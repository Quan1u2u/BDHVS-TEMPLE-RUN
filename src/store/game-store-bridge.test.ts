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
import { createMetricsSink, type GameMetricsSnapshot } from './atoms/sink';

describe('createMetricsSink — atom writes', () => {
  const store = getDefaultStore();

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

  it('does not update atoms when primitive values are unchanged', () => {
    const sink = createMetricsSink();
    const snapshot: GameMetricsSnapshot = {
      score: 10,
      distance: 20,
      speed: 1,
      lives: 3,
      lane: Lane.Center,
      phase: GamePhase.Paused,
      poseCommand: PoseCommand.Idle,
      trackingStatus: 'idle',
      calibrationProgress: 0,
      fps: 60,
      cameraEnabled: false,
      debugMessage: 'waiting',
      bootStage: 'idle',
      bootProgress: 1,
    };

    sink.publish(snapshot);
    const scoreAfterFirst = store.get(scoreAtom);
    sink.publish({ ...snapshot });
    const scoreAfterSecond = store.get(scoreAtom);
    expect(scoreAfterSecond).toBe(scoreAfterFirst);
  });

  it('publishes render snapshot data into atoms', () => {
    const sink = createMetricsSink();
    sink.publishRenderState({
      playerLane: Lane.Center,
      boardScrollOffsetRows: 1.25,
      unitsPerBoardRow: 72,
      blockedRows: [{ id: 'blocker-1', trackOffset: 180, blockedColumns: [1, 2] }],
      obstacles: [
        { id: 'obstacle-1', lane: Lane.Left, trackOffset: 180, type: ObstacleType.Virus },
      ],
      collectibles: [
        { id: 'collectible-1', lane: Lane.Right, trackOffset: 120, type: CollectibleType.Cloud },
      ],
      renderError: 'Tilesheet unavailable',
    });

    expect(store.get(playerLaneAtom)).toBe(Lane.Center);
    expect(store.get(boardScrollOffsetRowsAtom)).toBe(1.25);
    expect(store.get(blockedRowsAtom)).toHaveLength(1);
    expect(store.get(obstaclesAtom)).toHaveLength(1);
    expect(store.get(collectiblesAtom)[0]?.type).toBe(CollectibleType.Cloud);
    expect(store.get(renderErrorAtom)).toBe('Tilesheet unavailable');
  });

  it('does not replace array atoms when JSON-stringified snapshot is unchanged', () => {
    const sink = createMetricsSink();
    const snapshot = {
      playerLane: Lane.Right,
      boardScrollOffsetRows: 2.5,
      unitsPerBoardRow: 72,
      blockedRows: [{ id: 'blocker-1', trackOffset: 96, blockedColumns: [2] }],
      obstacles: [
        { id: 'obstacle-1', lane: Lane.Center, trackOffset: 72, type: ObstacleType.Hacker },
      ],
      collectibles: [
        { id: 'collectible-1', lane: Lane.Left, trackOffset: 144, type: CollectibleType.AI },
      ],
      renderError: null,
    };

    sink.publishRenderState(snapshot);
    const firstRef = store.get(obstaclesAtom);
    sink.publishRenderState({
      ...snapshot,
      obstacles: [...snapshot.obstacles],
      collectibles: [...snapshot.collectibles],
    });
    const secondRef = store.get(obstaclesAtom);
    expect(secondRef).toBe(firstRef);
  });
});
