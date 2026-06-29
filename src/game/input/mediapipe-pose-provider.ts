import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

import { PoseCommand, type PoseLandmark } from '../domain/types';
import { classifyPose, createInitialPoseClassifierState } from './pose-classifier';
import type {
  PoseCommandProvider,
  PoseProviderListeners,
  PoseProviderStatus,
} from './pose-provider';

export class MediaPipePoseProvider implements PoseCommandProvider {
  private readonly video = document.createElement('video');
  private stream: MediaStream | null = null;
  private poseLandmarker: PoseLandmarker | null = null;
  private listeners: PoseProviderListeners | null = null;
  private classifierState = createInitialPoseClassifierState();
  private animationFrame = 0;
  private landmarkPool: PoseLandmark[] = [];

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
          // Lower resolution to improve performance
          width: 640,
          height: 360,
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
      debugMessage: 'Loading MediaPipe Tasks',
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
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      );
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        numPoses: 1,
        runningMode: 'VIDEO',
      });
    } catch {
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

    this.detectFrame();
  }

  public async stop(): Promise<void> {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }

    this.poseLandmarker?.close();
    this.poseLandmarker = null;

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

  private detectFrame(): void {
    if (!this.poseLandmarker) {
      return;
    }

    const result = this.poseLandmarker.detectForVideo(this.video, performance.now());
    this.handleDetectionResult(result);
    this.animationFrame = requestAnimationFrame(() => {
      this.detectFrame();
    });
  }

  private handleDetectionResult(result: PoseLandmarkerResult): void {
    const landmarks = result.landmarks[0];

    if (!landmarks) {
      this.pushStatus({
        command: PoseCommand.Idle,
        trackingStatus: 'lost',
        calibrationProgress: 0.25,
        cameraEnabled: true,
        debugMessage: 'Pose lost; step back into frame',
        stream: this.stream,
        landmarks: [],
        videoWidth: this.video.videoWidth,
        videoHeight: this.video.videoHeight,
      });
      return;
    }

    const classification = classifyPose(landmarks, this.classifierState);
    this.classifierState = classification.nextState;
    this.listeners?.onCommand(classification.command);
    this.pushStatus({
      command: classification.command,
      trackingStatus: 'tracking',
      calibrationProgress: 1,
      cameraEnabled: true,
      debugMessage: 'Pose tracking locked',
      stream: this.stream,
      landmarks: this.fillLandmarkPool(landmarks),
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight,
    });
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

  private pushStatus(status: PoseProviderStatus): void {
    this.listeners?.onStatus(status);
  }
}
