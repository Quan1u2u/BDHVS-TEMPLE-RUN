import type { GameMetricsSnapshot } from './game-store';
import { gameStore } from './game-store';

export interface MetricsSink {
  publish: (snapshot: GameMetricsSnapshot) => void;
}

export function createMetricsSink(): MetricsSink {
  return {
    publish(snapshot) {
      const current = gameStore.getState().metrics;

      if (areMetricsEqual(current, snapshot)) {
        return;
      }

      gameStore.getState().setMetrics(snapshot);
    },
  };
}

function areMetricsEqual(left: GameMetricsSnapshot, right: GameMetricsSnapshot): boolean {
  return (
    left.score === right.score &&
    left.distance === right.distance &&
    left.speed === right.speed &&
    left.lives === right.lives &&
    left.lane === right.lane &&
    left.phase === right.phase &&
    left.poseCommand === right.poseCommand &&
    left.trackingStatus === right.trackingStatus &&
    left.calibrationProgress === right.calibrationProgress &&
    left.fps === right.fps &&
    left.cameraEnabled === right.cameraEnabled &&
    left.debugMessage === right.debugMessage &&
    left.bootStage === right.bootStage &&
    left.bootProgress === right.bootProgress
  );
}
