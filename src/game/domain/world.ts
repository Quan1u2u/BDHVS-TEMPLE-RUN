import type { GameSettings } from '../config';
import type {
  CollectibleType,
  GamePhase,
  Lane,
  ObstacleType,
  PoseCommand,
  PoseLandmark,
  TrackingStatus,
} from './types';

export interface PlayerState {
  currentLane: Lane;
  targetLane: Lane;
  trackPosition: number;
  jumpHeight: number;
  jumpVelocity: number;
  isJumping: boolean;
}

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  lane: Lane;
  x: number;
  width: number;
  height: number;
  scoreDelta: number;
}

export interface CollectibleState {
  id: string;
  type: CollectibleType;
  lane: Lane;
  x: number;
  y: number;
  value: number;
}

export interface WorldRuntimeState {
  settings: GameSettings;
  score: number;
  distance: number;
  speed: number;
  lives: number;
  fps: number;
  phase: GamePhase;
  player: PlayerState;
  obstacles: ObstacleState[];
  collectibles: CollectibleState[];
  poseCommand: PoseCommand;
  trackingStatus: TrackingStatus;
  calibrationProgress: number;
  cameraEnabled: boolean;
  debugMessage: string;
  poseLandmarks: PoseLandmark[];
  elapsedMs: number;
  obstacleSpawnCooldownMs: number;
  collectibleSpawnCooldownMs: number;
}
