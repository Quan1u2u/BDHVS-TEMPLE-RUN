import type { GameSettings } from '../config';
import { CollectibleType, GamePhase, Lane, ObstacleType, PoseCommand } from '../domain/types';
import type { WorldRuntimeState } from '../domain/world';
import { collectibleValue } from '../rules/collectible-value';
import { obstacleScoreDelta } from '../rules/obstacle-score-delta';

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
    },
    obstacles: createSeedObstacles(settings),
    collectibles: createSeedCollectibles(settings),
    blockedRows: [],
    lastCollectedItem: null,
    lastHitObstacle: null,
    poseCommand: PoseCommand.Idle,
    trackingStatus: 'idle',
    calibrationProgress: 0,
    cameraEnabled: false,
    debugMessage: 'Waiting for input',
    poseLandmarks: [],
    elapsedMs: 0,
    obstacleSpawnCooldownMs: settings.obstacleSpawnCooldownMs,
    collectibleSpawnCooldownMs: settings.collectibleSpawnCooldownMs,
    blockerSpawnCooldownMs: settings.obstacleSpawnCooldownMs * 1.5,
    idleScroll: 0,
  };
}

function createSeedObstacles(settings: GameSettings): WorldRuntimeState['obstacles'] {
  return [
    {
      id: 'preview-obstacle-1',
      type: ObstacleType.Virus,
      lane: Lane.Left,
      x: settings.playerTrackPosition + settings.obstacleWidth * 6,
      width: settings.obstacleWidth,
      height: settings.obstacleHeight,
      scoreDelta: obstacleScoreDelta[ObstacleType.Virus],
      progress: 0,
    },
    {
      id: 'preview-obstacle-2',
      type: ObstacleType.Scam,
      lane: Lane.Right,
      x: settings.playerTrackPosition + settings.obstacleWidth * 10,
      width: settings.obstacleWidth,
      height: settings.obstacleHeight,
      scoreDelta: obstacleScoreDelta[ObstacleType.Scam],
      progress: 0,
    },
  ];
}

function createSeedCollectibles(settings: GameSettings): WorldRuntimeState['collectibles'] {
  return [
    {
      id: 'preview-collectible-1',
      type: CollectibleType.Cloud,
      lane: Lane.Center,
      x: settings.playerTrackPosition + settings.obstacleWidth * 4,
      y: 200,
      value: collectibleValue[CollectibleType.Cloud],
      progress: 0,
    },
    {
      id: 'preview-collectible-2',
      type: CollectibleType.AI,
      lane: Lane.Right,
      x: settings.playerTrackPosition + settings.obstacleWidth * 8,
      y: 200,
      value: collectibleValue[CollectibleType.AI],
      progress: 0,
    },
  ];
}
