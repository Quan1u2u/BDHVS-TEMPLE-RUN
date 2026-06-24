import { describe, expect, it } from 'vitest';

import { GamePhase, Lane, PoseCommand } from '../game/domain/types';
import { type GameMetricsSnapshot, gameStore } from './game-store';
import { createMetricsSink } from './game-store-bridge';

describe('createMetricsSink', () => {
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
});
