import { soundEngine } from '@/sound-engine';
import { getAppliedGameSettings } from '@/store/game-settings-store';
import { gameStore } from '@/store/game-store';
import type { MetricsSink } from '../../store/game-store-bridge';
import { AssetPipeline } from '../assets/asset-pipeline';
import {
  GamePhase,
  type Lane,
  PlayerAction,
  PoseCommand,
  type TrackingStatus,
} from '../domain/types';
import type { WorldRuntimeState } from '../domain/world';
import { MediaPipePoseProvider } from '../input/mediapipe-pose-provider';
import type { PoseCommandProvider, PoseProviderStatus } from '../input/pose-provider';
import { createInitialWorld } from './world-factory';
import { stepWorld } from './world-simulation';

interface RuntimeContext {
  sessionId: number;
  host: HTMLElement;
  metricsSink: MetricsSink;
  poseProvider: PoseCommandProvider | null;
  world: WorldRuntimeState;
  lastFrameAt: number;
  frameHandle: number;
  pendingAction: PlayerAction;
  bootStage: string;
  bootProgress: number;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Static runtime ownership is intentional to keep the hot path centralized and lightweight.
export class GameRuntime {
  private static context: RuntimeContext | null = null;
  private static boundKeyHandler: ((event: KeyboardEvent) => void) | null = null;
  private static sessionCounter = 0;

  public static async bootstrap(host: HTMLElement, metricsSink: MetricsSink): Promise<void> {
    const sessionId = ++GameRuntime.sessionCounter;
    const bootstrapStart = performance.now();
    const context: RuntimeContext = {
      sessionId,
      host,
      metricsSink,
      poseProvider: null,
      world: createInitialWorld(getAppliedGameSettings()),
      lastFrameAt: performance.now(),
      frameHandle: 0,
      pendingAction: PlayerAction.None,
      bootStage: 'shell',
      bootProgress: 0.05,
    };

    GameRuntime.context = context;
    context.world.phase = GamePhase.Boot;
    context.world.debugMessage = 'Preparing DOM shell';
    GameRuntime.publishMetrics();
    await nextFrame();
    if (!GameRuntime.isSessionActive(sessionId)) {
      return;
    }

    await GameRuntime.runBootStage(
      sessionId,
      'boot-assets',
      0.16,
      'Loading boot assets',
      async () => {
        await AssetPipeline.loadBundle('boot');
      },
    );
    await nextFrame();
    if (!GameRuntime.isSessionActive(sessionId)) {
      return;
    }

    await GameRuntime.runBootStage(sessionId, 'pixi', 0.34, 'Preparing render state', async () => {
      host.setAttribute('data-runtime-ready', 'true');
    });
    await nextFrame();
    if (!GameRuntime.isSessionActive(sessionId)) {
      return;
    }

    await GameRuntime.runBootStage(
      sessionId,
      'gameplay-assets',
      0.58,
      'Loading gameplay assets',
      async () => {
        await AssetPipeline.loadBundle('gameplay');
      },
    );
    await nextFrame();
    if (!GameRuntime.isSessionActive(sessionId)) {
      return;
    }

    await GameRuntime.runBootStage(sessionId, 'audio', 0.82, 'Decoding audio buffers', async () => {
      await Promise.all([soundEngine.preloadBackgroundMusic(), soundEngine.preloadSfx()]);
    });
    if (!GameRuntime.isSessionActive(sessionId)) {
      return;
    }

    await GameRuntime.runBootStage(sessionId, 'ready', 1, 'Runtime ready', async () => {
      soundEngine.applyMix(getAppliedGameSettings());
      GameRuntime.bindKeyboard();
      context.world.phase = GamePhase.CameraPermission;
      context.world.debugMessage = `Runtime ready in ${Math.round(performance.now() - bootstrapStart)}ms`;
    });
    if (!GameRuntime.isSessionActive(sessionId)) {
      return;
    }

    GameRuntime.publishMetrics();
    GameRuntime.tick();
  }

  public static async destroy(): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    GameRuntime.sessionCounter += 1;
    cancelAnimationFrame(GameRuntime.context.frameHandle);
    GameRuntime.unbindKeyboard();
    await GameRuntime.context.poseProvider?.stop();
    soundEngine.stopBackgroundMusic();
    GameRuntime.context = null;
  }

  public static async enableCameraTracking(): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    if (!GameRuntime.context.poseProvider) {
      GameRuntime.context.poseProvider = new MediaPipePoseProvider();
    }

    GameRuntime.context.world.phase = GamePhase.CameraPermission;
    GameRuntime.context.world.debugMessage = 'Starting camera tracking';
    GameRuntime.publishMetrics();

    try {
      await GameRuntime.context.poseProvider.start({
        onCommand(command) {
          const action = mapPoseCommandToAction(command);
          if (action !== PlayerAction.None && GameRuntime.context) {
            GameRuntime.context.pendingAction = action;
          }
        },
        onStatus(status) {
          GameRuntime.applyPoseStatus(status);
        },
      });
    } catch {
      GameRuntime.context.world.cameraEnabled = false;
      GameRuntime.context.world.trackingStatus = 'error';
      GameRuntime.context.world.debugMessage = 'Camera startup failed; keyboard fallback active';
      GameRuntime.context.world.phase = GamePhase.Running;
      GameRuntime.publishMetrics();
      GameRuntime.startKeyboardRun();
      return;
    }

    if (!GameRuntime.context.world.cameraEnabled) {
      GameRuntime.context.world.debugMessage = 'Camera unavailable; keyboard fallback active';
      GameRuntime.startKeyboardRun();
    }
  }

  public static startKeyboardRun(): void {
    if (!GameRuntime.context) {
      return;
    }

    GameRuntime.context.world.phase = GamePhase.Running;
    GameRuntime.context.world.debugMessage = 'Keyboard fallback active';
    void soundEngine.resume();
    GameRuntime.ensureBackgroundMusic();
    GameRuntime.publishMetrics();
  }

  public static togglePause(): void {
    if (!GameRuntime.context) {
      return;
    }

    const world = GameRuntime.context.world;
    if (world.phase === GamePhase.GameOver) {
      return;
    }

    world.phase = world.phase === GamePhase.Paused ? GamePhase.Running : GamePhase.Paused;
    world.debugMessage =
      world.phase === GamePhase.Running ? 'Back on the run' : 'Simulation paused';
    GameRuntime.publishMetrics();
  }

  public static restart(): void {
    if (!GameRuntime.context) {
      return;
    }

    const replacement = createInitialWorld(getAppliedGameSettings());
    replacement.phase = GameRuntime.context.world.cameraEnabled
      ? GamePhase.Running
      : GamePhase.CameraPermission;
    replacement.cameraEnabled = GameRuntime.context.world.cameraEnabled;
    replacement.trackingStatus = GameRuntime.context.world.trackingStatus;
    replacement.debugMessage = replacement.cameraEnabled
      ? 'Restarted with live tracking'
      : 'Restarted in standby';

    GameRuntime.context.world = replacement;
    soundEngine.applyMix(replacement.settings);
    GameRuntime.ensureBackgroundMusic(true);
    GameRuntime.publishMetrics();
  }

  public static applySettingsAndRestart(): void {
    if (!GameRuntime.context) {
      return;
    }

    soundEngine.applyMix(getAppliedGameSettings());
    GameRuntime.restart();
  }

  private static tick(): void {
    if (!GameRuntime.context) {
      return;
    }

    const now = performance.now();
    const deltaMs = Math.min(40, now - GameRuntime.context.lastFrameAt);
    GameRuntime.context.lastFrameAt = now;
    GameRuntime.context.world.fps = Math.round(1000 / Math.max(1, deltaMs));

    if (GameRuntime.context.world.phase === GamePhase.Running) {
      const previousLives = GameRuntime.context.world.lives;
      stepWorld(GameRuntime.context.world, {
        deltaMs,
        action: GameRuntime.context.pendingAction,
      });

      if (GameRuntime.context.world.lives < previousLives) {
        if (GameRuntime.context.world.lives <= 0) {
          soundEngine.playBonk();
        } else {
          soundEngine.playSfx();
        }
      }
    }

    GameRuntime.context.pendingAction = PlayerAction.None;

    if (GameRuntime.context.world.phase === GamePhase.GameOver) {
      GameRuntime.context.world.debugMessage = 'Game over';
    }

    GameRuntime.publishMetrics();
    GameRuntime.context.frameHandle = requestAnimationFrame(() => {
      GameRuntime.tick();
    });
  }

  private static publishMetrics(): void {
    if (!GameRuntime.context) {
      return;
    }

    const { world } = GameRuntime.context;
    const renderError = gameStore.getState().render.renderError;
    GameRuntime.context.metricsSink.publish({
      score: world.score,
      distance: world.distance,
      speed: Number((world.speed / 260).toFixed(2)),
      lives: world.lives,
      lane: Math.round(world.player.currentLane) as Lane,
      phase: world.phase,
      poseCommand: world.poseCommand,
      trackingStatus: world.trackingStatus,
      calibrationProgress: world.calibrationProgress,
      fps: world.fps,
      cameraEnabled: world.cameraEnabled,
      debugMessage: world.debugMessage,
      bootStage: GameRuntime.context.bootStage,
      bootProgress: GameRuntime.context.bootProgress,
    });
    GameRuntime.context.metricsSink.publishRenderState({
      playerLane: Math.round(world.player.currentLane) as Lane,
      playerProgress: 1,
      obstacles: world.obstacles.map((obstacle) => ({
        id: obstacle.id,
        lane: obstacle.lane,
        progress: obstacle.progress,
        type: obstacle.type,
      })),
      collectibles: world.collectibles.map((collectible) => ({
        id: collectible.id,
        lane: collectible.lane,
        progress: collectible.progress,
        type: collectible.type,
      })),
      renderError,
    });
  }

  private static applyPoseStatus(status: PoseProviderStatus): void {
    if (!GameRuntime.context) {
      return;
    }

    const world = GameRuntime.context.world;
    world.poseCommand = status.command;
    world.trackingStatus = status.trackingStatus;
    world.calibrationProgress = status.calibrationProgress;
    world.cameraEnabled = status.cameraEnabled;
    world.debugMessage = status.debugMessage;
    world.poseLandmarks = status.landmarks;
    world.phase = mapTrackingStatusToPhase(status.trackingStatus, world.phase);
    gameStore.getState().setPreview({
      stream: status.stream,
      landmarks: status.landmarks,
      videoWidth: status.videoWidth,
      videoHeight: status.videoHeight,
    });

    if (status.trackingStatus === 'tracking') {
      void soundEngine.resume();
      GameRuntime.ensureBackgroundMusic();
    }

    GameRuntime.publishMetrics();
  }

  private static ensureBackgroundMusic(forceRestart = false): void {
    if (forceRestart || !soundEngine.isBackgroundMusicPlaying()) {
      soundEngine.playBackgroundMusic();
    }
  }

  private static async runBootStage(
    sessionId: number,
    stage: string,
    progress: number,
    message: string,
    task: () => Promise<void>,
  ): Promise<void> {
    if (!GameRuntime.isSessionActive(sessionId)) {
      return;
    }

    const context = GameRuntime.context;
    if (!context) {
      return;
    }

    context.bootStage = stage;
    context.bootProgress = progress;
    context.world.debugMessage = message;
    GameRuntime.publishMetrics();
    await task();
  }

  private static isSessionActive(sessionId: number): boolean {
    return GameRuntime.context?.sessionId === sessionId && GameRuntime.sessionCounter === sessionId;
  }

  private static bindKeyboard(): void {
    if (GameRuntime.boundKeyHandler) {
      return;
    }

    GameRuntime.boundKeyHandler = (event: KeyboardEvent) => {
      if (!GameRuntime.context) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          GameRuntime.context.pendingAction = PlayerAction.MoveLeft;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          GameRuntime.context.pendingAction = PlayerAction.MoveRight;
          break;
        case 'ArrowUp':
        case ' ':
        case 'w':
        case 'W':
          GameRuntime.context.pendingAction = PlayerAction.Jump;
          break;
        default:
          return;
      }

      if (GameRuntime.context.world.phase === GamePhase.CameraPermission) {
        GameRuntime.startKeyboardRun();
      }
    };

    window.addEventListener('keydown', GameRuntime.boundKeyHandler);
  }

  private static unbindKeyboard(): void {
    if (GameRuntime.boundKeyHandler) {
      window.removeEventListener('keydown', GameRuntime.boundKeyHandler);
      GameRuntime.boundKeyHandler = null;
    }
  }
}

function mapPoseCommandToAction(command: PoseCommand): PlayerAction {
  switch (command) {
    case PoseCommand.MoveLeft:
      return PlayerAction.MoveLeft;
    case PoseCommand.MoveRight:
      return PlayerAction.MoveRight;
    case PoseCommand.Jump:
      return PlayerAction.Jump;
    case PoseCommand.Idle:
      return PlayerAction.None;
  }
}

function mapTrackingStatusToPhase(status: TrackingStatus, previousPhase: GamePhase): GamePhase {
  switch (status) {
    case 'requesting-camera':
      return GamePhase.CameraPermission;
    case 'model-loading':
      return GamePhase.ModelLoading;
    case 'calibrating':
      return GamePhase.Calibration;
    case 'tracking':
      return GamePhase.Running;
    case 'lost':
      return GamePhase.Paused;
    case 'denied':
      return previousPhase === GamePhase.Running ? GamePhase.Running : GamePhase.CameraPermission;
    case 'error':
      return previousPhase === GamePhase.Running ? GamePhase.Running : GamePhase.Recovery;
    case 'idle':
      return previousPhase;
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}
