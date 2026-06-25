import { beforeEach, describe, expect, it } from 'vitest';

import { CollectibleType, GamePhase, Lane, ObstacleType, PoseCommand } from '../game/domain/types';
import {
  defaultMetrics,
  defaultRenderSnapshot,
  type GameMetricsSnapshot,
  type GameRenderSnapshot,
  gameStore,
} from './game-store';
import { createMetricsSink } from './game-store-bridge';

describe('createMetricsSink', () => {
  beforeEach(() => {
    gameStore.getState().setMetrics(defaultMetrics);
    gameStore.getState().setRender(defaultRenderSnapshot);
  });

  it('publishes runtime snapshots into Zustand state', () => {
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

    const state = gameStore.getState();
    expect(state.metrics.score).toBe(640);
    expect(state.metrics.phase).toBe(GamePhase.Running);
    expect(state.metrics.poseCommand).toBe(PoseCommand.MoveRight);
    expect(state.metrics.cameraEnabled).toBe(true);
  });

  it('does not replace the metrics object when the snapshot is unchanged', () => {
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
    const firstMetricsRef = gameStore.getState().metrics;
    sink.publish(snapshot);
    const secondMetricsRef = gameStore.getState().metrics;

    expect(secondMetricsRef).toBe(firstMetricsRef);
  });

  it('publishes render snapshot data into Zustand state', () => {
    const sink = createMetricsSink();

    sink.publishRenderState({
      playerLane: Lane.Center,
      boardScrollOffsetRows: 1.25,
      unitsPerBoardRow: 72,
      blockedRows: [{ id: 'blocker-1', trackOffset: 180, blockedColumns: [1, 2] }],
      obstacles: [
        {
          id: 'obstacle-1',
          lane: Lane.Left,
          trackOffset: 180,
          type: ObstacleType.Virus,
        },
      ],
      collectibles: [
        {
          id: 'collectible-1',
          lane: Lane.Right,
          trackOffset: 120,
          type: CollectibleType.Cloud,
        },
      ],
      renderError: 'Tilesheet unavailable',
    });

    const state = gameStore.getState();
    expect(state.render.playerLane).toBe(Lane.Center);
    expect(state.render.boardScrollOffsetRows).toBe(1.25);
    expect(state.render.unitsPerBoardRow).toBe(72);
    expect(state.render.blockedRows).toHaveLength(1);
    expect(state.render.obstacles).toHaveLength(1);
    expect(state.render.collectibles[0]?.type).toBe(CollectibleType.Cloud);
    expect(state.render.renderError).toBe('Tilesheet unavailable');
  });

  it('does not replace the render object when the snapshot is unchanged', () => {
    const sink = createMetricsSink();
    const snapshot: GameRenderSnapshot = {
      playerLane: Lane.Right,
      boardScrollOffsetRows: 2.5,
      unitsPerBoardRow: 72,
      blockedRows: [{ id: 'blocker-1', trackOffset: 96, blockedColumns: [2] }],
      obstacles: [
        {
          id: 'obstacle-1',
          lane: Lane.Center,
          trackOffset: 72,
          type: ObstacleType.Hacker,
        },
      ],
      collectibles: [
        {
          id: 'collectible-1',
          lane: Lane.Left,
          trackOffset: 144,
          type: CollectibleType.AI,
        },
      ],
      renderError: null,
    };

    sink.publishRenderState(snapshot);
    const firstRenderRef = gameStore.getState().render;
    sink.publishRenderState({
      ...snapshot,
      obstacles: [...snapshot.obstacles],
      collectibles: [...snapshot.collectibles],
    });
    const secondRenderRef = gameStore.getState().render;

    expect(secondRenderRef).toBe(firstRenderRef);
  });
});
