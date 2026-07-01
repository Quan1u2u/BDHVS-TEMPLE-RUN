import { getDefaultStore } from 'jotai/vanilla';
import { toaster } from '@/components/ui/toaster';
import { soundEngine } from '@/sound-engine';
import { openGameOverDialog } from '@/store/atoms/game-over-atoms';
import {
  previewLandmarksAtom,
  previewStreamAtom,
  previewVideoHeightAtom,
  previewVideoWidthAtom,
} from '@/store/atoms/preview-atoms';
import { renderErrorAtom, tileSizeAtom, visibleRowsAtom } from '@/store/atoms/render-atoms';
import { getAppliedGameSettings } from '@/store/atoms/settings-atoms';
import type { MetricsSink } from '../../store/atoms/sink';
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
import { computeTileSize, computeVisibleRows } from '../rendering/grid-layout';
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
  resizeObserver: ResizeObserver | null;
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
      resizeObserver: null,
    };

    GameRuntime.context = context;
    context.resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry || !GameRuntime.context) return;
      const { width, height } = entry.contentRect;
      const tileSize = computeTileSize(Math.round(width));
      const visibleRows = computeVisibleRows(Math.round(height), tileSize);
      getDefaultStore().set(tileSizeAtom, tileSize);
      getDefaultStore().set(visibleRowsAtom, visibleRows);
    });
    context.resizeObserver.observe(context.host);

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
    GameRuntime.context.resizeObserver?.disconnect();
    GameRuntime.context.resizeObserver = null;
    GameRuntime.unbindKeyboard();
    await GameRuntime.context.poseProvider?.stop();
    soundEngine.stopBackgroundMusic();
    GameRuntime.context = null;
  }

  public static async enableCameraTracking(): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    await soundEngine.unlockAudio();

    if (GameRuntime.context.poseProvider) {
      GameRuntime.context.world.phase = GamePhase.CameraPermission;
      GameRuntime.context.world.debugMessage = 'Camera already active';
      GameRuntime.publishMetrics();
      return;
    }

    GameRuntime.context.poseProvider = new MediaPipePoseProvider();
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
      GameRuntime.context.world.debugMessage = 'Camera startup failed';
      GameRuntime.context.world.phase = GamePhase.CameraPermission;
      GameRuntime.publishMetrics();
    }
  }

  public static async recalibrateTracking(): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    GameRuntime.context.pendingAction = PlayerAction.None;
    GameRuntime.context.world.phase = GamePhase.Calibration;
    GameRuntime.context.world.debugMessage = 'Recalibrating pose tracking';
    GameRuntime.publishMetrics();

    await GameRuntime.context.poseProvider?.stop();
    GameRuntime.context.poseProvider = new MediaPipePoseProvider();
    await GameRuntime.enableCameraTracking();
  }

  public static async startGame(): Promise<void> {
    if (!GameRuntime.context) {
      return;
    }

    await soundEngine.unlockAudio();
    GameRuntime.context.world.phase = GamePhase.Running;
    GameRuntime.context.world.debugMessage = 'Game started';
    await soundEngine.resume();
    if (soundEngine.isBackgroundMusicPaused()) {
      await soundEngine.resumeBackgroundMusic();
    } else {
      GameRuntime.ensureBackgroundMusic();
    }
    GameRuntime.publishMetrics();
  }

  /** @deprecated Use startGame() instead */
  public static async startKeyboardRun(): Promise<void> {
    await GameRuntime.startGame();
  }

  public static togglePause(): void {
    if (!GameRuntime.context) {
      return;
    }

    const world = GameRuntime.context.world;
    if (world.phase !== GamePhase.Running && world.phase !== GamePhase.Paused) {
      return;
    }

    const nextPhase = world.phase === GamePhase.Paused ? GamePhase.Running : GamePhase.Paused;
    world.phase = nextPhase;
    world.debugMessage = nextPhase === GamePhase.Running ? 'Back on the run' : 'Simulation paused';

    if (nextPhase === GamePhase.Paused) {
      soundEngine.pauseBackgroundMusic();
    } else {
      void soundEngine.resumeBackgroundMusic();
    }
    GameRuntime.publishMetrics();
  }

  public static restart(): void {
    if (!GameRuntime.context) {
      return;
    }

    const replacement = createInitialWorld(getAppliedGameSettings());
    replacement.phase = GamePhase.Running;
    replacement.cameraEnabled = GameRuntime.context.world.cameraEnabled;
    replacement.trackingStatus = GameRuntime.context.world.trackingStatus;
    replacement.debugMessage = 'Restarted';

    GameRuntime.context.world = replacement;
    soundEngine.applyMix(replacement.settings);
    GameRuntime.ensureBackgroundMusic(true);
    GameRuntime.publishMetrics();
  }

  public static resetToIdle(): void {
    if (!GameRuntime.context) {
      return;
    }

    const replacement = createInitialWorld(getAppliedGameSettings());
    replacement.phase = GamePhase.CameraPermission;
    replacement.debugMessage = '';
    replacement.cameraEnabled = GameRuntime.context.world.cameraEnabled;
    replacement.trackingStatus = GameRuntime.context.world.trackingStatus;

    GameRuntime.context.world = replacement;
    soundEngine.stopBackgroundMusic();
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

    const previousPhase = GameRuntime.context.world.phase;

    if (GameRuntime.context.world.phase === GamePhase.Running) {
      stepWorld(GameRuntime.context.world, {
        deltaMs,
        action: GameRuntime.context.pendingAction,
        mode: 'active',
      });

      if (GameRuntime.context.world.lastCollectedItem) {
        const { type, scoreDelta } = GameRuntime.context.world.lastCollectedItem;
        soundEngine.playSfx();
        toaster.create({
          title: 'Nhận vật phẩm',
          description: `${collectibleLabel(type)} (+${scoreDelta})`,
          type: 'success',
          closable: true,
        });
      }

      if (GameRuntime.context.world.lastHitObstacle) {
        const { type, scoreDelta } = GameRuntime.context.world.lastHitObstacle;
        soundEngine.playBonk();
        toaster.create({
          title: 'Cản trở nguy hiểm',
          description: `${obstacleLabel(type)} (${scoreDelta}), bạn còn ${GameRuntime.context.world.lives} trái tim`,
          type: 'error',
          closable: true,
        });
      }
    } else if (
      GameRuntime.context.world.phase === GamePhase.CameraPermission ||
      GameRuntime.context.world.phase === GamePhase.GameOver
    ) {
      const { settings } = GameRuntime.context.world;
      const deltaSeconds = deltaMs / 1000;
      GameRuntime.context.world.idleScroll +=
        settings.baseRunSpeed * deltaSeconds * settings.distanceScale;
      GameRuntime.context.world.elapsedMs += deltaMs;
    }

    GameRuntime.context.pendingAction = PlayerAction.None;

    if (
      previousPhase !== GamePhase.GameOver &&
      GameRuntime.context.world.phase === GamePhase.GameOver
    ) {
      GameRuntime.context.world.debugMessage = 'Game over';
      if (soundEngine.isBackgroundMusicPlaying()) {
        soundEngine.stopBackgroundMusic();
      }
      openGameOverDialog(GameRuntime.context.world.score);
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
    const speedFactor = world.speed / Math.max(world.settings.baseRunSpeed, 1);
    const renderError = getDefaultStore().get(renderErrorAtom);
    GameRuntime.context.metricsSink.publish({
      score: world.score,
      distance: world.distance,
      speed: Number(speedFactor.toFixed(2)),
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
      boardScrollOffsetRows:
        (world.distance + world.idleScroll) /
        (Math.max(0.001, world.settings.distanceScale) * Math.max(1, world.settings.obstacleWidth)),
      unitsPerBoardRow: world.settings.obstacleWidth,
      blockedRows: world.blockedRows.map((blockedRow) => ({
        id: blockedRow.id,
        trackOffset: blockedRow.x - world.player.trackPosition,
        blockedColumns: blockedRow.blockedColumns,
      })),
      obstacles: world.obstacles.map((obstacle) => ({
        id: obstacle.id,
        lane: obstacle.lane,
        trackOffset: obstacle.x - world.player.trackPosition,
        type: obstacle.type,
      })),
      collectibles: world.collectibles.map((collectible) => ({
        id: collectible.id,
        lane: collectible.lane,
        trackOffset: collectible.x - world.player.trackPosition,
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
    if (world.phase !== GamePhase.GameOver) {
      world.phase = mapTrackingStatusToPhase(status.trackingStatus, world.phase);
    }
    const store = getDefaultStore();
    store.set(previewStreamAtom, status.stream);
    store.set(previewLandmarksAtom, status.landmarks);
    store.set(previewVideoWidthAtom, status.videoWidth);
    store.set(previewVideoHeightAtom, status.videoHeight);

    if (status.trackingStatus === 'tracking') {
      void soundEngine.resume();
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
        case 'Escape':
          GameRuntime.togglePause();
          return;
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
        default:
          return;
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

function collectibleLabel(type: string): string {
  switch (type) {
    case 'ai':
      return 'AI';
    case 'cloud':
      return 'Cloud';
    case 'stem':
      return 'STEM';
    case 'digital-citizen':
      return 'Digital Citizen';
    case 'e-learning':
      return 'E-Learning';
    default:
      return type;
  }
}

function obstacleLabel(type: string): string {
  switch (type) {
    case 'virus':
      return 'Virus';
    case 'hacker':
      return 'Hacker';
    case 'scam':
      return 'Scam';
    case 'fake-news':
      return 'Fake News';
    case 'cyberbullying':
      return 'Cyberbullying';
    case 'blocked-lane':
      return 'Đường bị chặn';
    default:
      return type;
  }
}

function mapPoseCommandToAction(command: PoseCommand): PlayerAction {
  switch (command) {
    case PoseCommand.MoveLeft:
      return PlayerAction.MoveLeft;
    case PoseCommand.MoveRight:
      return PlayerAction.MoveRight;
    case PoseCommand.Jump:
      return PlayerAction.None;
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
      return previousPhase === GamePhase.Running ||
        previousPhase === GamePhase.Paused ||
        previousPhase === GamePhase.GameOver
        ? previousPhase
        : GamePhase.CameraPermission;
    case 'lost':
      return previousPhase;
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
