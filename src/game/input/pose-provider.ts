import type { PoseCommand, PoseLandmark, TrackingStatus } from '../domain/types';

export interface PoseProviderStatus {
  command: PoseCommand;
  trackingStatus: TrackingStatus;
  calibrationProgress: number;
  cameraEnabled: boolean;
  debugMessage: string;
  stream: MediaStream | null;
  landmarks: PoseLandmark[];
  videoWidth: number;
  videoHeight: number;
}

export interface PoseProviderListeners {
  onCommand: (command: PoseCommand) => void;
  onStatus: (status: PoseProviderStatus) => void;
}

export interface PoseCommandProvider {
  start: (listeners: PoseProviderListeners) => Promise<void>;
  stop: () => Promise<void>;
}
