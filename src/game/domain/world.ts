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
}

export interface ObstacleState {
  id: string;
  type: ObstacleType;
  lane: Lane;
  x: number;
  width: number;
  height: number;
  scoreDelta: number;
  progress: number;
}

export interface BlockedRowState {
  id: string;
  blockedColumns: number[];
  x: number;
  width: number;
  progress: number;
}

export interface CollectedItemEvent {
  type: CollectibleType;
  scoreDelta: number;
}

export interface ObstacleHitEvent {
  type: ObstacleType | 'blocked-lane';
  scoreDelta: number;
}

export interface CollectibleState {
  id: string;
  type: CollectibleType;
  lane: Lane;
  x: number;
  y: number;
  value: number;
  progress: number;
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
  blockedRows: BlockedRowState[];
  lastCollectedItem: CollectedItemEvent | null;
  lastHitObstacle: ObstacleHitEvent | null;
  poseCommand: PoseCommand;
  trackingStatus: TrackingStatus;
  calibrationProgress: number;
  cameraEnabled: boolean;
  debugMessage: string;
  poseLandmarks: PoseLandmark[];
  elapsedMs: number;
  obstacleSpawnCooldownMs: number;
  collectibleSpawnCooldownMs: number;
  blockerSpawnCooldownMs: number;
  idleScroll: number;
}
