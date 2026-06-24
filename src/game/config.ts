export interface GameSettings {
  playerTrackPosition: number;
  laneSnapSpeed: number;
  baseRunSpeed: number;
  maxRunSpeed: number;
  speedRampPerSecond: number;
  jumpVelocity: number;
  gravity: number;
  obstacleWidth: number;
  obstacleHeight: number;
  collectibleValue: number;
  startingLives: number;
  obstacleSpawnCooldownMs: number;
  collectibleSpawnCooldownMs: number;
  obstacleSpawnMinCooldownMs: number;
  collectibleSpawnMinCooldownMs: number;
  obstacleSpawnDistanceFactor: number;
  collectibleSpawnDistanceFactor: number;
  distanceScale: number;
  passiveScorePerSecond: number;
  obstacleCollisionWidthFactor: number;
  collectibleCollisionRadius: number;
  playerBodyWidth: number;
  playerBodyHeight: number;
  playerHeadRadius: number;
  playerShadowRadius: number;
  tileScale: number;
  backgroundMusicVolume: number;
  sfxVolume: number;
}

export const defaultGameSettings: GameSettings = {
  playerTrackPosition: 180,
  laneSnapSpeed: 10,
  baseRunSpeed: 260,
  maxRunSpeed: 620,
  speedRampPerSecond: 8,
  jumpVelocity: 620,
  gravity: 1450,
  obstacleWidth: 72,
  obstacleHeight: 48,
  collectibleValue: 35,
  startingLives: 3,
  obstacleSpawnCooldownMs: 850,
  collectibleSpawnCooldownMs: 520,
  obstacleSpawnMinCooldownMs: 420,
  collectibleSpawnMinCooldownMs: 320,
  obstacleSpawnDistanceFactor: 0.2,
  collectibleSpawnDistanceFactor: 0.15,
  distanceScale: 0.1,
  passiveScorePerSecond: 12,
  obstacleCollisionWidthFactor: 0.5,
  collectibleCollisionRadius: 40,
  playerBodyWidth: 40,
  playerBodyHeight: 58,
  playerHeadRadius: 16,
  playerShadowRadius: 28,
  tileScale: 3,
  backgroundMusicVolume: 0.24,
  sfxVolume: 0.62,
};

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const TRACK_LANE_COUNT = 3;
