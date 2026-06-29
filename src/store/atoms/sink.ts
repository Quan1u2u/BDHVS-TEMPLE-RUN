import { getDefaultStore } from 'jotai/vanilla';
import type {
  CollectibleType,
  GamePhase,
  Lane,
  ObstacleType,
  PoseCommand,
  TrackingStatus,
} from '../../game/domain/types';
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
} from './metrics-atoms';
import {
  blockedRowsAtom,
  boardScrollOffsetRowsAtom,
  collectiblesAtom,
  obstaclesAtom,
  playerLaneAtom,
  renderErrorAtom,
  unitsPerBoardRowAtom,
} from './render-atoms';

export interface GameMetricsSnapshot {
  score: number;
  distance: number;
  speed: number;
  lives: number;
  lane: Lane;
  phase: GamePhase;
  poseCommand: PoseCommand;
  trackingStatus: TrackingStatus;
  calibrationProgress: number;
  fps: number;
  cameraEnabled: boolean;
  debugMessage: string;
  bootStage: string;
  bootProgress: number;
}

export interface GameRenderSnapshot {
  playerLane: Lane;
  boardScrollOffsetRows: number;
  unitsPerBoardRow: number;
  blockedRows: Array<{ id: string; trackOffset: number; blockedColumns: number[] }>;
  obstacles: Array<{ id: string; lane: Lane; trackOffset: number; type: ObstacleType }>;
  collectibles: Array<{ id: string; lane: Lane; trackOffset: number; type: CollectibleType }>;
  renderError: string | null;
}

export interface RuntimeUiEvent {
  type: 'tracking-lost' | 'tracking-restored' | 'render-error' | 'phase-changed';
  message?: string;
  phase?: GamePhase;
}

export interface MetricsSink {
  publish: (snapshot: GameMetricsSnapshot) => void;
  publishRenderState: (snapshot: GameRenderSnapshot) => void;
  registerMetricTarget: <Key extends keyof GameMetricsSnapshot>(
    key: Key,
    target: (value: GameMetricsSnapshot[Key]) => void,
  ) => () => void;
  subscribeRenderSnapshot: (listener: (snapshot: GameRenderSnapshot) => void) => () => void;
  subscribeUiEvent: (listener: (event: RuntimeUiEvent) => void) => () => void;
}

function identity<T>(value: T): T {
  return value;
}

function isUiTrackingLossStatus(status: TrackingStatus): boolean {
  return status === 'lost' || status === 'error';
}

function cloneMetricsSnapshot(snapshot: GameMetricsSnapshot): GameMetricsSnapshot {
  return { ...snapshot };
}

export function createMetricsSink(): MetricsSink {
  const store = getDefaultStore();
  const metricTargets: Partial<{
    [Key in keyof GameMetricsSnapshot]: Set<(value: GameMetricsSnapshot[Key]) => void>;
  }> = {};
  const renderSnapshotListeners = new Set<(snapshot: GameRenderSnapshot) => void>();
  const uiEventListeners = new Set<(event: RuntimeUiEvent) => void>();
  const mirroredMetricKeys = new Set<keyof GameMetricsSnapshot>();
  const mirroredMetricValues = new Map<keyof GameMetricsSnapshot, unknown>();
  let previousMetricsSnapshot: GameMetricsSnapshot | null = null;
  let previousRenderError: string | null = null;
  let lastBlockedRowsJson = '';
  let lastObstaclesJson = '';
  let lastCollectiblesJson = '';

  function registerListener<T>(listeners: Set<T>, listener: T): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function emitUiEvent(event: RuntimeUiEvent): void {
    uiEventListeners.forEach((listener) => {
      listener(event);
    });
  }

  function registerMetricTarget<Key extends keyof GameMetricsSnapshot>(
    key: Key,
    target: (value: GameMetricsSnapshot[Key]) => void,
  ): () => void {
    const listeners =
      (metricTargets[key] as Set<(value: GameMetricsSnapshot[Key]) => void> | undefined) ??
      new Set<(value: GameMetricsSnapshot[Key]) => void>();
    listeners.add(target);
    metricTargets[key] = listeners as (typeof metricTargets)[Key];
    return () => {
      listeners.delete(target);
      if (listeners.size === 0) {
        delete metricTargets[key];
      }
    };
  }

  function notifyMetricTargets<Key extends keyof GameMetricsSnapshot>(
    key: Key,
    value: GameMetricsSnapshot[Key],
  ): void {
    const listeners = metricTargets[key] as
      | Set<(value: GameMetricsSnapshot[Key]) => void>
      | undefined;
    listeners?.forEach((listener) => {
      listener(value);
    });
  }

  function mirrorMetric<Key extends keyof GameMetricsSnapshot>(
    key: Key,
    value: GameMetricsSnapshot[Key],
    project: (value: GameMetricsSnapshot[Key]) => unknown,
    write: (value: GameMetricsSnapshot[Key]) => void,
  ): void {
    const projectedValue = project(value);
    if (!mirroredMetricKeys.has(key) || !Object.is(mirroredMetricValues.get(key), projectedValue)) {
      mirroredMetricKeys.add(key);
      mirroredMetricValues.set(key, projectedValue);
      write(value);
    }
  }

  function emitMetricEvents(snapshot: GameMetricsSnapshot): void {
    if (!previousMetricsSnapshot) {
      previousMetricsSnapshot = cloneMetricsSnapshot(snapshot);
      return;
    }

    if (snapshot.phase !== previousMetricsSnapshot.phase) {
      emitUiEvent({ type: 'phase-changed', phase: snapshot.phase });
    }

    const previousTrackingStatus = previousMetricsSnapshot.trackingStatus;
    const wasTrackingLoss = isUiTrackingLossStatus(previousTrackingStatus);
    const wasTracking = previousTrackingStatus === 'tracking';
    const isTracking = snapshot.trackingStatus === 'tracking';
    const isTrackingLoss = isUiTrackingLossStatus(snapshot.trackingStatus);

    if (isTrackingLoss && !wasTrackingLoss) {
      emitUiEvent({ type: 'tracking-lost' });
    }

    if (isTracking && !wasTracking) {
      emitUiEvent({ type: 'tracking-restored' });
    }

    previousMetricsSnapshot = cloneMetricsSnapshot(snapshot);
  }

  return {
    registerMetricTarget,
    subscribeRenderSnapshot(listener) {
      return registerListener(renderSnapshotListeners, listener);
    },
    subscribeUiEvent(listener) {
      return registerListener(uiEventListeners, listener);
    },
    publish(snapshot) {
      notifyMetricTargets('score', snapshot.score);
      notifyMetricTargets('distance', snapshot.distance);
      notifyMetricTargets('speed', snapshot.speed);
      notifyMetricTargets('lives', snapshot.lives);
      notifyMetricTargets('lane', snapshot.lane);
      notifyMetricTargets('phase', snapshot.phase);
      notifyMetricTargets('poseCommand', snapshot.poseCommand);
      notifyMetricTargets('trackingStatus', snapshot.trackingStatus);
      notifyMetricTargets('calibrationProgress', snapshot.calibrationProgress);
      notifyMetricTargets('fps', snapshot.fps);
      notifyMetricTargets('cameraEnabled', snapshot.cameraEnabled);
      notifyMetricTargets('debugMessage', snapshot.debugMessage);
      notifyMetricTargets('bootStage', snapshot.bootStage);
      notifyMetricTargets('bootProgress', snapshot.bootProgress);

      mirrorMetric('score', snapshot.score, identity, (value) => {
        store.set(scoreAtom, value);
      });
      mirrorMetric('distance', snapshot.distance, Math.floor, (value) => {
        store.set(distanceAtom, value);
      });
      mirrorMetric(
        'speed',
        snapshot.speed,
        (value) => value.toFixed(2),
        (value) => {
          store.set(speedAtom, value);
        },
      );
      mirrorMetric('lives', snapshot.lives, identity, (value) => {
        store.set(livesAtom, value);
      });
      mirrorMetric('lane', snapshot.lane, identity, (value) => {
        store.set(laneAtom, value);
      });
      mirrorMetric('phase', snapshot.phase, identity, (value) => {
        store.set(phaseAtom, value);
      });
      mirrorMetric('poseCommand', snapshot.poseCommand, identity, (value) => {
        store.set(poseCommandAtom, value);
      });
      mirrorMetric('trackingStatus', snapshot.trackingStatus, identity, (value) => {
        store.set(trackingStatusAtom, value);
      });
      mirrorMetric(
        'calibrationProgress',
        snapshot.calibrationProgress,
        (value) => Math.round(value * 100),
        (value) => {
          store.set(calibrationProgressAtom, value);
        },
      );
      mirrorMetric('fps', snapshot.fps, Math.round, (value) => {
        store.set(fpsAtom, value);
      });
      mirrorMetric('cameraEnabled', snapshot.cameraEnabled, identity, (value) => {
        store.set(cameraEnabledAtom, value);
      });
      mirrorMetric('debugMessage', snapshot.debugMessage, identity, (value) => {
        store.set(debugMessageAtom, value);
      });
      mirrorMetric('bootStage', snapshot.bootStage, identity, (value) => {
        store.set(bootStageAtom, value);
      });
      mirrorMetric(
        'bootProgress',
        snapshot.bootProgress,
        (value) => Math.round(value * 100),
        (value) => {
          store.set(bootProgressAtom, value);
        },
      );

      emitMetricEvents(snapshot);
    },
    publishRenderState(snapshot) {
      renderSnapshotListeners.forEach((listener) => {
        listener(snapshot);
      });

      store.set(playerLaneAtom, snapshot.playerLane);
      store.set(boardScrollOffsetRowsAtom, snapshot.boardScrollOffsetRows);
      store.set(unitsPerBoardRowAtom, snapshot.unitsPerBoardRow);

      const blockedJson = JSON.stringify(snapshot.blockedRows);
      if (blockedJson !== lastBlockedRowsJson) {
        lastBlockedRowsJson = blockedJson;
        store.set(blockedRowsAtom, snapshot.blockedRows);
      }

      const obsJson = JSON.stringify(snapshot.obstacles);
      if (obsJson !== lastObstaclesJson) {
        lastObstaclesJson = obsJson;
        store.set(obstaclesAtom, snapshot.obstacles);
      }

      const colJson = JSON.stringify(snapshot.collectibles);
      if (colJson !== lastCollectiblesJson) {
        lastCollectiblesJson = colJson;
        store.set(collectiblesAtom, snapshot.collectibles);
      }

      store.set(renderErrorAtom, snapshot.renderError);

      if (snapshot.renderError !== previousRenderError) {
        previousRenderError = snapshot.renderError;
        if (snapshot.renderError) {
          emitUiEvent({ type: 'render-error', message: snapshot.renderError });
        }
      }
    },
  };
}
