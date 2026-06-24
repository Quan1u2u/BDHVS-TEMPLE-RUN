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
import { PixiRenderer, type RendererPort } from '../rendering/pixi-renderer';
import { createInitialWorld } from './world-factory';
import { stepWorld } from './world-simulation';

interface RuntimeContext {
  host: HTMLElement;
  renderer: RendererPort;
  metricsSink: MetricsSink;
  poseProvider: PoseCommandProvider;
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

  public static async bootstrap(host: HTMLElement, metricsSink: MetricsSink): Promise<void> {
    const bootstrapStart = performance.now();
    const renderer = new PixiRenderer();
    const context: RuntimeContext = {
      host,
      renderer,
      metricsSink,
      poseProvider: new MediaPipePoseProvider(),
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

    await GameRuntime.runBootStage('boot-assets', 0.16, 'Loading boot assets', async () => {
      await AssetPipeline.loadBundle('boot');
    });
    await nextFrame();

    await GameRuntime.runBootStage('pixi', 0.34, 'Mounting Pixi renderer', async () => {
      await renderer.mount(host);
    });
    await nextFrame();

    await GameRuntime.runBootStage('gameplay-assets', 0.58, 'Loading gameplay assets', async () => {
      await AssetPipeline.loadBundle('gameplay');
    });
    await nextFrame();

    await GameRuntime.runBootStage('audio', 0.82, 'Decoding audio buffers', async () => {
      await Promise.all([soundEngine.preloadBackgroundMusic(), soundEngine.preloadSfx()]);
    });

    await GameRuntime.runBootStage('ready', 1, 'Runtime ready', async () => {
      soundEngine.applyMix(getAppliedGameSettings());
      GameRuntime.bindKeyboard();
      context.world.phase = GamePhase.CameraPermission;
      context.world.debugMessage = `Runtime ready in ${Math.round(performance.now() - bootstrapStart)}ms`;
    });

    GameRuntime.publishMetrics();
    GameRuntime.render();
    GameRuntime.tick();
  }

  public static async destroy(): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    cancelAnimationFrame(GameRuntime.context.frameHandle);
    GameRuntime.unbindKeyboard();
    await GameRuntime.context.poseProvider.stop();
    soundEngine.stopBackgroundMusic();
    await GameRuntime.context.renderer.destroy();
    GameRuntime.context = null;
  }

  public static async enableCameraTracking(): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    GameRuntime.context.world.phase = GamePhase.CameraPermission;
    GameRuntime.context.world.debugMessage = 'Starting camera tracking';
    GameRuntime.publishMetrics();
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
    GameRuntime.render();
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
    GameRuntime.render();
    GameRuntime.context.frameHandle = requestAnimationFrame(() => {
      GameRuntime.tick();
    });
  }

  private static render(): void {
    GameRuntime.context?.renderer.render(GameRuntime.context.world);
  }

  private static publishMetrics(): void {
    if (!GameRuntime.context) {
      return;
    }

    const { world } = GameRuntime.context;
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
    stage: string,
    progress: number,
    message: string,
    task: () => Promise<void>,
  ): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    GameRuntime.context.bootStage = stage;
    GameRuntime.context.bootProgress = progress;
    GameRuntime.context.world.debugMessage = message;
    GameRuntime.publishMetrics();
    await task();
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
      return GamePhase.CameraPermission;
    case 'error':
      return GamePhase.Recovery;
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
