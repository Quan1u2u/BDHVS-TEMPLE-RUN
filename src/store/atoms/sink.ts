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

export interface MetricsSink {
  publish: (snapshot: GameMetricsSnapshot) => void;
  publishRenderState: (snapshot: GameRenderSnapshot) => void;
}

let lastBlockedRowsJson = '';
let lastObstaclesJson = '';
let lastCollectiblesJson = '';

export function createMetricsSink(): MetricsSink {
  const store = getDefaultStore();
  return {
    publish(snapshot) {
      store.set(scoreAtom, snapshot.score);
      store.set(distanceAtom, snapshot.distance);
      store.set(speedAtom, snapshot.speed);
      store.set(livesAtom, snapshot.lives);
      store.set(laneAtom, snapshot.lane);
      store.set(phaseAtom, snapshot.phase);
      store.set(poseCommandAtom, snapshot.poseCommand);
      store.set(trackingStatusAtom, snapshot.trackingStatus);
      store.set(calibrationProgressAtom, snapshot.calibrationProgress);
      store.set(fpsAtom, snapshot.fps);
      store.set(cameraEnabledAtom, snapshot.cameraEnabled);
      store.set(debugMessageAtom, snapshot.debugMessage);
      store.set(bootStageAtom, snapshot.bootStage);
      store.set(bootProgressAtom, snapshot.bootProgress);
    },
    publishRenderState(snapshot) {
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
    },
  };
}
