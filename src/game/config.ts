export interface GameSettings {
  playerTrackPosition: number;
  laneSnapSpeed: number;
  baseRunSpeed: number;
  maxRunSpeed: number;
  speedRampPerSecond: number;
  obstacleWidth: number;
  obstacleHeight: number;
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
  backgroundMusicVolume: number;
  sfxVolume: number;
}

export const defaultGameSettings: GameSettings = {
  playerTrackPosition: 180,
  laneSnapSpeed: 10,
  baseRunSpeed: 100,
  maxRunSpeed: 520,
  speedRampPerSecond: 3,
  obstacleWidth: 72,
  obstacleHeight: 48,
  startingLives: 3,
  obstacleSpawnCooldownMs: 980,
  collectibleSpawnCooldownMs: 680,
  obstacleSpawnMinCooldownMs: 520,
  collectibleSpawnMinCooldownMs: 420,
  obstacleSpawnDistanceFactor: 0.08,
  collectibleSpawnDistanceFactor: 0.05,
  distanceScale: 0.1,
  passiveScorePerSecond: 12,
  obstacleCollisionWidthFactor: 0.5,
  collectibleCollisionRadius: 40,
  backgroundMusicVolume: 0.24,
  sfxVolume: 0.62,
};

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const TRACK_LANE_COUNT = 3;
