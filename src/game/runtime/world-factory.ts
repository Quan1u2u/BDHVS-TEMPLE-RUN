import type { GameSettings } from '../config';
import { GamePhase, Lane, PoseCommand } from '../domain/types';
import type { WorldRuntimeState } from '../domain/world';

export function createInitialWorld(settings: GameSettings): WorldRuntimeState {
  return {
    settings,
    score: 0,
    distance: 0,
    speed: settings.baseRunSpeed,
    lives: settings.startingLives,
    fps: 60,
    phase: GamePhase.CameraPermission,
    player: {
      currentLane: Lane.Center,
      targetLane: Lane.Center,
      trackPosition: settings.playerTrackPosition,
      jumpHeight: 0,
      jumpVelocity: 0,
      isJumping: false,
    },
    obstacles: [],
    collectibles: [],
    poseCommand: PoseCommand.Idle,
    trackingStatus: 'idle',
    calibrationProgress: 0,
    cameraEnabled: false,
    debugMessage: 'Waiting for input',
    poseLandmarks: [],
    elapsedMs: 0,
    obstacleSpawnCooldownMs: settings.obstacleSpawnCooldownMs,
    collectibleSpawnCooldownMs: settings.collectibleSpawnCooldownMs,
  };
}
