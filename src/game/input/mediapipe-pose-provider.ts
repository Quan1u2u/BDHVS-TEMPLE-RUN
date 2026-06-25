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
          width: 960,
          height: 540,
          facingMode: 'user',
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
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
      );
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
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
    const previewLandmarks = landmarks.map<PoseLandmark>((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility,
    }));
    this.pushStatus({
      command: classification.command,
      trackingStatus: 'tracking',
      calibrationProgress: 1,
      cameraEnabled: true,
      debugMessage: 'Pose tracking locked',
      stream: this.stream,
      landmarks: previewLandmarks,
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight,
    });
  }

  private pushStatus(status: PoseProviderStatus): void {
    this.listeners?.onStatus(status);
  }
}
