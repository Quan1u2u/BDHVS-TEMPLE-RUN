export enum GamePhase {
  Boot = 'boot',
  CameraPermission = 'camera-permission',
  ModelLoading = 'model-loading',
  Calibration = 'calibration',
  Running = 'running',
  Paused = 'paused',
  GameOver = 'game-over',
  Recovery = 'recovery',
}

export enum Lane {
  Left = 0,
  Center = 1,
  Right = 2,
}

export enum PlayerAction {
  None = 'none',
  MoveLeft = 'move-left',
  MoveRight = 'move-right',
  Jump = 'jump',
}

export enum ObstacleType {
  Virus = 'virus',
  Hacker = 'hacker',
  Scam = 'scam',
  FakeNews = 'fake-news',
  Cyberbullying = 'cyberbullying',
}

export enum CollectibleType {
  AI = 'ai',
  Cloud = 'cloud',
  STEM = 'stem',
  DigitalCitizen = 'digital-citizen',
  ELearning = 'e-learning',
}

export enum PoseCommand {
  Idle = 'idle',
  MoveLeft = 'move-left',
  MoveRight = 'move-right',
  Jump = 'jump',
}

export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type TrackingStatus =
  | 'idle'
  | 'requesting-camera'
  | 'model-loading'
  | 'calibrating'
  | 'tracking'
  | 'lost'
  | 'denied'
  | 'error';
