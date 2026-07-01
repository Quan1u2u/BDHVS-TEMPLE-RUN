import { PoseCommand, type PoseLandmark, type TrackingStatus } from '../domain/types';
import { classifyPose, createInitialPoseClassifierState } from './pose-classifier';
import type {
  PoseCommandProvider,
  PoseProviderListeners,
  PoseProviderStatus,
} from './pose-provider';
import type { WorkerEvent } from './pose-worker-types';
import { WorkerCommandType, WorkerEventType } from './pose-worker-types';

export class MediaPipePoseProvider implements PoseCommandProvider {
  private readonly video = document.createElement('video');
  private stream: MediaStream | null = null;
  private worker: Worker | null = null;
  private listeners: PoseProviderListeners | null = null;
  private classifierState = createInitialPoseClassifierState();
  private landmarkPool: PoseLandmark[] = [];
  private detectTimer: ReturnType<typeof setInterval> | null = null;
  private workerBusy = false;
  private cameraActive = false;
  private _resolveInit: (() => void) | null = null;
  private _rejectInit: ((error: Error) => void) | null = null;
  private readonly _visibilityHandler = () => {
    this.handleVisibilityChange();
  };
  private _statusPool: PoseProviderStatus = {
    command: PoseCommand.Idle,
    trackingStatus: 'idle',
    calibrationProgress: 0,
    cameraEnabled: false,
    debugMessage: '',
    stream: null,
    landmarks: [],
    videoWidth: 0,
    videoHeight: 0,
  };

  public async start(listeners: PoseProviderListeners): Promise<void> {
    await this.stop();
    this.listeners = listeners;
    this.pushStatus({
      command: PoseCommand.Idle,
      trackingStatus: 'requesting-camera',
      calibrationProgress: 0,
      cameraEnabled: false,
      debugMessage: 'Requesting webcam access',
      stream: null,
      landmarks: [],
      videoWidth: 0,
      videoHeight: 0,
    });

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 320,
          height: 180,
          facingMode: 'user',
          aspectRatio: 16 / 9,
        },
        audio: false,
      });
    } catch {
      this.pushStatus({
        command: PoseCommand.Idle,
        trackingStatus: 'denied',
        calibrationProgress: 0,
        cameraEnabled: false,
        debugMessage: 'Camera permission denied',
        stream: null,
        landmarks: [],
        videoWidth: 0,
        videoHeight: 0,
      });
      return;
    }

    this.pushStatus({
      command: PoseCommand.Idle,
      trackingStatus: 'model-loading',
      calibrationProgress: 0.15,
      cameraEnabled: true,
      debugMessage: 'Loading MediaPipe model',
      stream: this.stream,
      landmarks: [],
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight,
    });

    this.video.srcObject = this.stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();

    try {
      await this.initWorker();
    } catch (e) {
      console.error('[PoseProvider] Worker init failed:', e);
      this.pushStatus({
        command: PoseCommand.Idle,
        trackingStatus: 'error',
        calibrationProgress: 0,
        cameraEnabled: false,
        debugMessage: 'MediaPipe failed to initialize',
        stream: null,
        landmarks: [],
        videoWidth: 0,
        videoHeight: 0,
      });
      await this.stop();
      throw new Error('MediaPipe failed to initialize');
    }

    this.pushStatus({
      command: PoseCommand.Idle,
      trackingStatus: 'calibrating',
      calibrationProgress: 0.45,
      cameraEnabled: true,
      debugMessage: 'Calibrating pose tracking',
      stream: this.stream,
      landmarks: [],
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight,
    });

    document.addEventListener('visibilitychange', this._visibilityHandler);
    this.startDetectionLoop();
  }

  public async stop(): Promise<void> {
    document.removeEventListener('visibilitychange', this._visibilityHandler);
    this.cameraActive = false;
    this.workerBusy = false;

    if (this.detectTimer) {
      clearInterval(this.detectTimer);
      this.detectTimer = null;
    }

    this._resolveInit?.();
    this._resolveInit = null;
    this._rejectInit = null;

    if (this.worker) {
      this.worker.postMessage({ type: WorkerCommandType.Stop });
      this.worker.terminate();
      this.worker = null;
    }

    for (const track of this.stream?.getTracks() ?? []) {
      track.stop();
    }
    this.stream = null;
    this.video.srcObject = null;
    this.classifierState = createInitialPoseClassifierState();

    if (this.listeners) {
      this.pushStatus({
        command: PoseCommand.Idle,
        trackingStatus: 'idle',
        calibrationProgress: 0,
        cameraEnabled: false,
        debugMessage: 'Pose tracking stopped',
        stream: null,
        landmarks: [],
        videoWidth: 0,
        videoHeight: 0,
      });
    }
  }

  private async initWorker(): Promise<void> {
    this.worker = new Worker(new URL('./pose.worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);

    const initPromise = new Promise<void>((resolve, reject) => {
      this._resolveInit = resolve;
      this._rejectInit = reject;
    });

    this.worker.postMessage({ type: WorkerCommandType.Init });
    await initPromise;
  }

  private handleWorkerMessage(event: MessageEvent<WorkerEvent>): void {
    const evt = event.data;

    switch (evt.type) {
      case WorkerEventType.InitDone:
        this._resolveInit?.();
        this._resolveInit = null;
        this._rejectInit = null;
        break;
      case WorkerEventType.InitError:
        this._rejectInit?.(new Error(evt.error));
        this._resolveInit = null;
        this._rejectInit = null;
        break;
      case WorkerEventType.Result:
        this.workerBusy = false;
        this.handleDetectionResult(evt.result);
        break;
      case WorkerEventType.DetectError:
        this.workerBusy = false;
        this.writeStatus(
          PoseCommand.Idle,
          'lost',
          0.25,
          true,
          evt.error,
          this.stream,
          [],
          this.video.videoWidth,
          this.video.videoHeight,
        );
        break;
      case WorkerEventType.StopDone:
        break;
    }
  }

  private handleWorkerError(event: ErrorEvent): void {
    this.workerBusy = false;
    console.error('[PoseProvider] Worker error event:', event.message, event);
    this._rejectInit?.(new Error(event.message || 'Pose worker crashed'));
    this._resolveInit = null;
    this._rejectInit = null;
    this.pushStatus({
      command: PoseCommand.Idle,
      trackingStatus: 'error',
      calibrationProgress: 0,
      cameraEnabled: false,
      debugMessage: 'Pose worker crashed',
      stream: null,
      landmarks: [],
      videoWidth: 0,
      videoHeight: 0,
    });
  }

  private startDetectionLoop(): void {
    this.cameraActive = true;
    this.detectTimer = setInterval(() => {
      this.detectFrame();
    }, 66);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.cameraActive = false;
      if (this.detectTimer) {
        clearInterval(this.detectTimer);
        this.detectTimer = null;
      }
    } else {
      this.cameraActive = true;
      this.detectTimer = setInterval(() => {
        this.detectFrame();
      }, 66);
    }
  }

  private detectFrame(): void {
    if (!this.cameraActive || !this.worker || this.workerBusy) {
      return;
    }

    this.workerBusy = true;
    const timestampMs = performance.now();

    createImageBitmap(this.video, {
      resizeWidth: 320,
      resizeHeight: 180,
    })
      .then((bitmap) => {
        if (!this.cameraActive || !this.worker) {
          bitmap.close();
          this.workerBusy = false;
          return;
        }
        this.worker.postMessage(
          {
            type: WorkerCommandType.Detect,
            bitmap,
            timestampMs,
          },
          [bitmap],
        );
      })
      .catch(() => {
        this.workerBusy = false;
      });
  }

  private handleDetectionResult(result: {
    landmarks: (readonly { x: number; y: number; z?: number; visibility?: number }[])[];
  }): void {
    const landmarks = result.landmarks[0];

    if (!landmarks) {
      this.writeStatus(
        PoseCommand.Idle,
        'lost',
        0.25,
        true,
        'Pose lost; step back into frame',
        this.stream,
        [],
        this.video.videoWidth,
        this.video.videoHeight,
      );
      return;
    }

    const classification = classifyPose(landmarks, this.classifierState);
    this.classifierState = classification.nextState;
    this.listeners?.onCommand(classification.command);
    this.writeStatus(
      classification.command,
      'tracking',
      1,
      true,
      'Pose tracking locked',
      this.stream,
      this.fillLandmarkPool(landmarks),
      this.video.videoWidth,
      this.video.videoHeight,
    );
  }

  private fillLandmarkPool(
    src: readonly { x: number; y: number; z?: number; visibility?: number }[],
  ): PoseLandmark[] {
    const len = src.length;
    while (this.landmarkPool.length < len) {
      this.landmarkPool.push({ x: 0, y: 0, z: 0, visibility: 0 });
    }
    for (let i = 0; i < len; i++) {
      const s = src[i];
      const d = this.landmarkPool[i];
      if (!s || !d) continue;
      d.x = s.x;
      d.y = s.y;
      d.z = s.z ?? 0;
      d.visibility = s.visibility ?? 0;
    }
    return this.landmarkPool.slice(0, len);
  }

  private writeStatus(
    command: PoseCommand,
    trackingStatus: TrackingStatus,
    calibrationProgress: number,
    cameraEnabled: boolean,
    debugMessage: string,
    stream: MediaStream | null,
    landmarks: PoseLandmark[],
    videoWidth: number,
    videoHeight: number,
  ): void {
    const s = this._statusPool;
    s.command = command;
    s.trackingStatus = trackingStatus;
    s.calibrationProgress = calibrationProgress;
    s.cameraEnabled = cameraEnabled;
    s.debugMessage = debugMessage;
    s.stream = stream;
    s.landmarks = landmarks;
    s.videoWidth = videoWidth;
    s.videoHeight = videoHeight;
    this.listeners?.onStatus(s);
  }

  private pushStatus(status: PoseProviderStatus): void {
    this.listeners?.onStatus(status);
  }
}
