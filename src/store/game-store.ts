import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import {
  GamePhase,
  Lane,
  PoseCommand,
  type PoseLandmark,
  type TrackingStatus,
} from '../game/domain/types';

export interface GameMetricsSnapshot {
  score: number;
  distance: number;
  speed: number;
  lives: number;
  lane: Lane;
  phase: GamePhase;
  poseCommand: PoseCommand;
  trackingStatus: TrackingStatus;
  calibrationProgress: number;
  fps: number;
  cameraEnabled: boolean;
  debugMessage: string;
  bootStage: string;
  bootProgress: number;
}

export interface GameStoreState {
  metrics: GameMetricsSnapshot;
  preview: {
    stream: MediaStream | null;
    landmarks: PoseLandmark[];
    videoWidth: number;
    videoHeight: number;
  };
  setMetrics: (metrics: GameMetricsSnapshot) => void;
  setPreview: (preview: GameStoreState['preview']) => void;
}

export const defaultMetrics: GameMetricsSnapshot = {
  score: 0,
  distance: 0,
  speed: 0,
  lives: 3,
  lane: Lane.Center,
  phase: GamePhase.Boot,
  poseCommand: PoseCommand.Idle,
  trackingStatus: 'idle',
  calibrationProgress: 0,
  fps: 60,
  cameraEnabled: false,
  debugMessage: 'Booting runtime',
  bootStage: 'shell',
  bootProgress: 0,
};

export const gameStore = createStore<GameStoreState>()((set) => ({
  metrics: defaultMetrics,
  preview: {
    stream: null,
    landmarks: [],
    videoWidth: 0,
    videoHeight: 0,
  },
  setMetrics: (metrics) => {
    set({ metrics });
  },
  setPreview: (preview) => {
    set({ preview });
  },
}));

export function useGameStore<T>(selector: (state: GameStoreState) => T): T {
  return useStore(gameStore, selector);
}
