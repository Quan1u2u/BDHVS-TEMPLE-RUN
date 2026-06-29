import { getDefaultStore } from 'jotai/vanilla';
import { beforeEach, describe, expect, it } from 'vitest';
import { CollectibleType, GamePhase, Lane, ObstacleType, PoseCommand } from '../game/domain/types';
import {
  bootProgressAtom,
  bootStageAtom,
  calibrationProgressAtom,
  cameraEnabledAtom,
  debugMessageAtom,
  distanceAtom,
  fpsAtom,
  laneAtom,
  livesAtom,
  phaseAtom,
  poseCommandAtom,
  scoreAtom,
  speedAtom,
  trackingStatusAtom,
} from './atoms/metrics-atoms';
import {
  blockedRowsAtom,
  boardScrollOffsetRowsAtom,
  collectiblesAtom,
  obstaclesAtom,
  playerLaneAtom,
  renderErrorAtom,
  unitsPerBoardRowAtom,
} from './atoms/render-atoms';
import { createMetricsSink, type GameMetricsSnapshot, type GameRenderSnapshot } from './atoms/sink';

describe('createMetricsSink — atom writes', () => {
  const store = getDefaultStore();
  const createMetricsSnapshot = (
    overrides: Partial<GameMetricsSnapshot> = {},
  ): GameMetricsSnapshot => ({
    score: 10,
    distance: 20,
    speed: 1,
    lives: 3,
    lane: Lane.Center,
    phase: GamePhase.Boot,
    poseCommand: PoseCommand.Idle,
    trackingStatus: 'idle',
    calibrationProgress: 0,
    fps: 60,
    cameraEnabled: false,
    debugMessage: 'waiting',
    bootStage: 'idle',
    bootProgress: 0,
    ...overrides,
  });
  const createRenderSnapshot = (
    overrides: Partial<GameRenderSnapshot> = {},
  ): GameRenderSnapshot => ({
    playerLane: Lane.Center,
    boardScrollOffsetRows: 1.25,
    unitsPerBoardRow: 72,
    blockedRows: [{ id: 'blocker-1', trackOffset: 180, blockedColumns: [1, 2] }],
    obstacles: [{ id: 'obstacle-1', lane: Lane.Left, trackOffset: 180, type: ObstacleType.Virus }],
    collectibles: [
      { id: 'collectible-1', lane: Lane.Right, trackOffset: 120, type: CollectibleType.Cloud },
    ],
    renderError: null,
    ...overrides,
  });

  beforeEach(() => {
    store.set(scoreAtom, 0);
    store.set(distanceAtom, 0);
    store.set(speedAtom, 0);
    store.set(livesAtom, 3);
    store.set(laneAtom, Lane.Center);
    store.set(phaseAtom, GamePhase.Boot);
    store.set(poseCommandAtom, PoseCommand.Idle);
    store.set(trackingStatusAtom, 'idle');
    store.set(calibrationProgressAtom, 0);
    store.set(fpsAtom, 60);
    store.set(cameraEnabledAtom, false);
    store.set(debugMessageAtom, '');
    store.set(bootStageAtom, '');
    store.set(bootProgressAtom, 0);
    store.set(playerLaneAtom, Lane.Center);
    store.set(boardScrollOffsetRowsAtom, 0);
    store.set(unitsPerBoardRowAtom, 72);
    store.set(blockedRowsAtom, []);
    store.set(obstaclesAtom, []);
    store.set(collectiblesAtom, []);
    store.set(renderErrorAtom, null);
  });

  it('publishes metrics into individual atoms', () => {
    const sink = createMetricsSink();
    sink.publish({
      score: 640,
      distance: 128,
      speed: 1.8,
      lives: 2,
      lane: Lane.Right,
      phase: GamePhase.Running,
      poseCommand: PoseCommand.MoveRight,
      trackingStatus: 'tracking',
      calibrationProgress: 1,
      fps: 60,
      cameraEnabled: true,
      debugMessage: 'tracking locked',
      bootStage: 'ready',
      bootProgress: 1,
    });

    expect(store.get(scoreAtom)).toBe(640);
    expect(store.get(phaseAtom)).toBe(GamePhase.Running);
    expect(store.get(poseCommandAtom)).toBe(PoseCommand.MoveRight);
    expect(store.get(cameraEnabledAtom)).toBe(true);
  });

  it('suppresses duplicate metric atom notifications until visible values change', () => {
    const sink = createMetricsSink();
    let scoreNotifications = 0;
    let distanceNotifications = 0;
    const unsubscribeScore = store.sub(scoreAtom, () => {
      scoreNotifications += 1;
    });
    const unsubscribeDistance = store.sub(distanceAtom, () => {
      distanceNotifications += 1;
    });

    sink.publish(
      createMetricsSnapshot({
        score: 10,
        distance: 20.1,
      }),
    );
    sink.publish(
      createMetricsSnapshot({
        score: 10,
        distance: 20.4,
      }),
    );
    sink.publish(
      createMetricsSnapshot({
        score: 11,
        distance: 21,
      }),
    );

    expect(scoreNotifications).toBe(2);
    expect(distanceNotifications).toBe(2);
    expect(store.get(scoreAtom)).toBe(11);
    expect(store.get(distanceAtom)).toBe(21);

    unsubscribeScore();
    unsubscribeDistance();
  });

  it('publishes render snapshot data into atoms while also notifying fast-lane subscribers', () => {
    const sink = createMetricsSink();
    const seen: GameRenderSnapshot[] = [];

    store.set(playerLaneAtom, Lane.Left);
    store.set(boardScrollOffsetRowsAtom, 9.5);
    store.set(unitsPerBoardRowAtom, 144);
    store.set(blockedRowsAtom, [{ id: 'persisted-blocker', trackOffset: 24, blockedColumns: [3] }]);
    store.set(obstaclesAtom, [
      { id: 'persisted-obstacle', lane: Lane.Right, trackOffset: 48, type: ObstacleType.Scam },
    ]);
    store.set(collectiblesAtom, [
      { id: 'persisted-collectible', lane: Lane.Left, trackOffset: 12, type: CollectibleType.AI },
    ]);
    store.set(renderErrorAtom, 'Persisted render error');

    const unsubscribe = sink.subscribeRenderSnapshot((snapshot) => {
      seen.push(snapshot);
    });

    const snapshot = createRenderSnapshot({ renderError: 'Tilesheet unavailable' });

    sink.publishRenderState(snapshot);

    expect(seen).toEqual([snapshot]);
    expect(store.get(playerLaneAtom)).toBe(snapshot.playerLane);
    expect(store.get(boardScrollOffsetRowsAtom)).toBe(snapshot.boardScrollOffsetRows);
    expect(store.get(unitsPerBoardRowAtom)).toBe(snapshot.unitsPerBoardRow);
    expect(store.get(blockedRowsAtom)).toEqual(snapshot.blockedRows);
    expect(store.get(obstaclesAtom)).toEqual(snapshot.obstacles);
    expect(store.get(collectiblesAtom)).toEqual(snapshot.collectibles);
    expect(store.get(renderErrorAtom)).toBe('Tilesheet unavailable');

    unsubscribe();
  });

  it('registers fast metric targets and pushes values on every publish', () => {
    const sink = createMetricsSink();
    const seen: number[] = [];

    const unregister = sink.registerMetricTarget('score', (value) => {
      seen.push(value);
    });

    sink.publish(createMetricsSnapshot({ score: 640 }));
    sink.publish(createMetricsSnapshot({ score: 640 }));

    expect(seen).toEqual([640, 640]);

    unregister();
    sink.publish(createMetricsSnapshot({ score: 700 }));
    expect(seen).toEqual([640, 640]);
  });

  it('throttles mirrored noisy metrics while preserving immediate semantic atom updates', () => {
    const sink = createMetricsSink();

    sink.publish(
      createMetricsSnapshot({
        distance: 20.1,
        speed: 1.241,
        phase: GamePhase.Boot,
        trackingStatus: 'idle',
      }),
    );

    const firstDistance = store.get(distanceAtom);
    const firstSpeed = store.get(speedAtom);

    sink.publish(
      createMetricsSnapshot({
        distance: 20.4,
        speed: 1.244,
        phase: GamePhase.Running,
        trackingStatus: 'tracking',
      }),
    );

    expect(store.get(distanceAtom)).toBe(firstDistance);
    expect(store.get(speedAtom)).toBe(firstSpeed);
    expect(store.get(phaseAtom)).toBe(GamePhase.Running);
    expect(store.get(trackingStatusAtom)).toBe('tracking');
  });

  it('emits semantic UI events for tracking and phase transitions while suppressing duplicates', () => {
    const sink = createMetricsSink();
    const events: string[] = [];
    const unsubscribe = sink.subscribeUiEvent((event) => {
      events.push(
        event.type === 'phase-changed' && event.phase ? `${event.type}:${event.phase}` : event.type,
      );
    });

    sink.publish(createMetricsSnapshot());
    sink.publish(createMetricsSnapshot({ trackingStatus: 'lost' }));
    sink.publish(createMetricsSnapshot({ trackingStatus: 'lost' }));
    sink.publish(
      createMetricsSnapshot({
        trackingStatus: 'tracking',
        phase: GamePhase.Running,
      }),
    );
    sink.publish(
      createMetricsSnapshot({
        trackingStatus: 'tracking',
        phase: GamePhase.Running,
      }),
    );

    expect(events).toEqual([
      'tracking-lost',
      `phase-changed:${GamePhase.Running}`,
      'tracking-restored',
    ]);

    unsubscribe();
  });

  it('emits tracking-lost when healthy tracking degrades into an error state', () => {
    const sink = createMetricsSink();
    const events: string[] = [];
    const unsubscribe = sink.subscribeUiEvent((event) => {
      events.push(event.type);
    });

    sink.publish(
      createMetricsSnapshot({
        trackingStatus: 'tracking',
        phase: GamePhase.Running,
      }),
    );
    sink.publish(
      createMetricsSnapshot({
        trackingStatus: 'error',
        phase: GamePhase.Running,
      }),
    );

    expect(events).toEqual(['tracking-lost']);

    unsubscribe();
  });

  it('tracks semantic transitions even when the caller reuses and mutates one snapshot object', () => {
    const sink = createMetricsSink();
    const events: string[] = [];
    const snapshot = createMetricsSnapshot();
    const unsubscribe = sink.subscribeUiEvent((event) => {
      events.push(
        event.type === 'phase-changed' && event.phase ? `${event.type}:${event.phase}` : event.type,
      );
    });

    sink.publish(snapshot);

    snapshot.phase = GamePhase.Running;
    snapshot.trackingStatus = 'lost';

    sink.publish(snapshot);

    expect(events).toEqual(['phase-changed:running', 'tracking-lost']);

    unsubscribe();
  });

  it('emits render error transition events only when the error changes', () => {
    const sink = createMetricsSink();
    const events: Array<{ type: string; message?: string }> = [];
    const unsubscribe = sink.subscribeUiEvent((event) => {
      if (event.type === 'render-error' && event.message) {
        events.push({ type: event.type, message: event.message });
        return;
      }

      events.push({ type: event.type });
    });

    sink.publishRenderState(createRenderSnapshot());
    sink.publishRenderState(createRenderSnapshot({ renderError: 'Tilesheet unavailable' }));
    sink.publishRenderState(createRenderSnapshot({ renderError: 'Tilesheet unavailable' }));
    sink.publishRenderState(createRenderSnapshot({ renderError: null }));

    expect(events).toEqual([{ type: 'render-error', message: 'Tilesheet unavailable' }]);

    unsubscribe();
  });

  it('publishes render snapshots to fast-lane subscribers on every render publish', () => {
    const sink = createMetricsSink();
    const seen: GameRenderSnapshot[] = [];
    const renderSnapshot = createRenderSnapshot();
    const unsubscribe = sink.subscribeRenderSnapshot((snapshot) => {
      seen.push(snapshot);
    });

    sink.publishRenderState(renderSnapshot);
    sink.publishRenderState(renderSnapshot);

    expect(seen).toHaveLength(2);
    expect(seen[0]?.obstacles).toHaveLength(1);
    expect(seen[1]).toBe(renderSnapshot);

    unsubscribe();
    sink.publishRenderState(createRenderSnapshot({ playerLane: Lane.Right }));
    expect(seen).toHaveLength(2);
  });

  it('stops sending render snapshots after unsubscribe', () => {
    const sink = createMetricsSink();
    let calls = 0;
    const unsubscribe = sink.subscribeRenderSnapshot(() => {
      calls += 1;
    });

    unsubscribe();
    sink.publishRenderState(createRenderSnapshot());

    expect(calls).toBe(0);
  });
});
