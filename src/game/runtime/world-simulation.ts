import { TRACK_LANE_COUNT, WORLD_WIDTH } from '../config';
import {
  CollectibleType,
  GamePhase,
  Lane,
  ObstacleType,
  PlayerAction,
  PoseCommand,
} from '../domain/types';
import type {
  BlockedRowState,
  CollectibleState,
  ObstacleState,
  WorldRuntimeState,
} from '../domain/world';
import { collectibleValue } from '../rules/collectible-value';
import { obstacleScoreDelta } from '../rules/obstacle-score-delta';

interface StepWorldArgs {
  deltaMs: number;
  action: PlayerAction;
  mode?: 'active' | 'preview';
}

const laneOrder = [Lane.Left, Lane.Center, Lane.Right] as const;
const OBSTACLE_SPAWN_X = WORLD_WIDTH + 120;
const COLLECTIBLE_SPAWN_X = WORLD_WIDTH + 80;
const BLOCKER_SPAWN_X = WORLD_WIDTH + 100;
const SAME_LANE_MIN_GAP_CELLS = 3;
const DEPTH_BAND_GAP_CELLS = 3;
const BLOCKER_SPEED_FACTOR = 1.5;
const BLOCKER_RETRY_MS = 120;

export function stepWorld(
  world: WorldRuntimeState,
  { deltaMs, action, mode = 'active' }: StepWorldArgs,
): void {
  const deltaSeconds = deltaMs / 1000;
  const { settings } = world;
  world.lastCollectedItem = null;
  world.lastHitObstacle = null;

  if (mode === 'active') {
    applyAction(world, action);
  } else {
    world.poseCommand = PoseCommand.Idle;
  }
  updatePlayer(world, deltaSeconds);
  updateSpeed(world, deltaSeconds);
  updateEntities(world, deltaSeconds);
  spawnEntities(world, deltaMs);
  if (mode === 'active') {
    resolveCollisions(world);
  }

  world.distance += world.speed * deltaSeconds * settings.distanceScale;
  if (mode === 'active') {
    world.score += Math.floor(deltaSeconds * settings.passiveScorePerSecond);
  }
  world.elapsedMs += deltaMs;

  if (mode === 'active' && world.lives <= 0) {
    world.phase = GamePhase.GameOver;
    world.debugMessage = 'The runner is down';
  }
}

function applyAction(world: WorldRuntimeState, action: PlayerAction): void {
  const targetLaneIndex = laneOrder.indexOf(world.player.targetLane);

  switch (action) {
    case PlayerAction.MoveLeft: {
      const nextIndex = Math.max(0, targetLaneIndex - 1);
      world.player.targetLane = laneOrder[nextIndex] ?? Lane.Left;
      world.poseCommand = PoseCommand.MoveLeft;
      return;
    }
    case PlayerAction.MoveRight: {
      const nextIndex = Math.min(TRACK_LANE_COUNT - 1, targetLaneIndex + 1);
      world.player.targetLane = laneOrder[nextIndex] ?? Lane.Right;
      world.poseCommand = PoseCommand.MoveRight;
      return;
    }
    case PlayerAction.None:
      world.poseCommand = PoseCommand.Idle;
      return;
  }
}

function updatePlayer(world: WorldRuntimeState, deltaSeconds: number): void {
  const laneDelta = world.player.targetLane - world.player.currentLane;
  const laneStep =
    Math.sign(laneDelta) *
    Math.min(Math.abs(laneDelta), world.settings.laneSnapSpeed * deltaSeconds);
  world.player.currentLane = clampLane((world.player.currentLane + laneStep) as Lane);
}

function updateSpeed(world: WorldRuntimeState, deltaSeconds: number): void {
  const { settings } = world;
  world.speed = Math.min(
    settings.maxRunSpeed,
    Math.max(settings.baseRunSpeed, world.speed + settings.speedRampPerSecond * deltaSeconds),
  );
}

function updateEntities(world: WorldRuntimeState, deltaSeconds: number): void {
  const travelDistance = world.speed * deltaSeconds;

  for (const obstacle of world.obstacles) {
    obstacle.x -= travelDistance;
  }

  for (const collectible of world.collectibles) {
    collectible.x -= travelDistance;
  }

  for (const blockedRow of world.blockedRows) {
    blockedRow.x -= travelDistance;
  }

  updateEntityProgress(world);

  const offscreenThreshold = world.player.trackPosition - 40;
  world.obstacles = world.obstacles.filter(
    (obstacle) => obstacle.x + obstacle.width > offscreenThreshold,
  );
  world.collectibles = world.collectibles.filter(
    (collectible) => collectible.x > offscreenThreshold,
  );
  world.blockedRows = world.blockedRows.filter(
    (blockedRow) => blockedRow.x + blockedRow.width > offscreenThreshold,
  );
}

function spawnEntities(world: WorldRuntimeState, deltaMs: number): void {
  const { settings } = world;
  world.obstacleSpawnCooldownMs -= deltaMs;
  world.collectibleSpawnCooldownMs -= deltaMs;
  world.blockerSpawnCooldownMs -= deltaMs;

  if (world.obstacleSpawnCooldownMs <= 0) {
    const obstacle = createObstacle(world.elapsedMs, settings);
    if (
      hasSameLaneSpawnGap(world.obstacles, obstacle.lane, obstacle.x, settings.obstacleWidth) &&
      canPlaceObstacle(world, obstacle, settings)
    ) {
      world.obstacles.push(obstacle);
      world.obstacleSpawnCooldownMs = Math.max(
        settings.obstacleSpawnMinCooldownMs,
        settings.obstacleSpawnCooldownMs - world.distance * settings.obstacleSpawnDistanceFactor,
      );
    } else {
      world.obstacleSpawnCooldownMs = BLOCKER_RETRY_MS;
    }
  }

  if (world.collectibleSpawnCooldownMs <= 0) {
    const collectible = createCollectible(world.elapsedMs, settings);
    if (
      hasSameLaneSpawnGap(
        world.collectibles,
        collectible.lane,
        collectible.x,
        settings.obstacleWidth,
      ) &&
      canPlaceCollectible(world, collectible, settings)
    ) {
      world.collectibles.push(collectible);
      world.collectibleSpawnCooldownMs = Math.max(
        settings.collectibleSpawnMinCooldownMs,
        settings.collectibleSpawnCooldownMs -
          world.distance * settings.collectibleSpawnDistanceFactor,
      );
    } else {
      world.collectibleSpawnCooldownMs = BLOCKER_RETRY_MS;
    }
  }

  const speedFactor = world.speed / Math.max(settings.baseRunSpeed, 1);
  if (world.blockerSpawnCooldownMs <= 0 && speedFactor >= BLOCKER_SPEED_FACTOR) {
    const blockedRow = createBlockedRow(world.elapsedMs, settings, speedFactor);
    if (canPlaceBlockedRow(world, blockedRow, settings)) {
      world.blockedRows.push(blockedRow);
      world.blockerSpawnCooldownMs = Math.max(
        settings.obstacleSpawnMinCooldownMs,
        settings.obstacleSpawnCooldownMs * 1.35,
      );
    } else {
      world.blockerSpawnCooldownMs = BLOCKER_RETRY_MS;
    }
  }
}

function createObstacle(seed: number, settings: WorldRuntimeState['settings']): ObstacleState {
  const obstacleVariants = [
    { type: ObstacleType.Virus, lane: Lane.Left },
    { type: ObstacleType.Hacker, lane: Lane.Center },
    { type: ObstacleType.Scam, lane: Lane.Right },
    { type: ObstacleType.FakeNews, lane: Lane.Left },
    { type: ObstacleType.Cyberbullying, lane: Lane.Right },
  ] as const;
  const variant =
    obstacleVariants[Math.floor(seed / 1000) % obstacleVariants.length] ?? obstacleVariants[0];

  return {
    id: `obstacle-${seed}`,
    type: variant.type,
    lane: variant.lane,
    x: OBSTACLE_SPAWN_X,
    width: settings.obstacleWidth,
    height: settings.obstacleHeight,
    scoreDelta: obstacleScoreDelta[variant.type],
    progress: 0,
  };
}

function createCollectible(
  seed: number,
  _settings: WorldRuntimeState['settings'],
): CollectibleState {
  const collectibleVariants = [
    CollectibleType.AI,
    CollectibleType.Cloud,
    CollectibleType.STEM,
    CollectibleType.DigitalCitizen,
    CollectibleType.ELearning,
  ] as const;
  const type =
    collectibleVariants[Math.floor(seed / 700) % collectibleVariants.length] ??
    CollectibleType.STEM;

  return {
    id: `collectible-${seed}`,
    type,
    lane: laneOrder[Math.floor(seed / 700) % laneOrder.length] ?? Lane.Center,
    x: COLLECTIBLE_SPAWN_X,
    y: 200,
    value: collectibleValue[type],
    progress: 0,
  };
}

function resolveCollisions(world: WorldRuntimeState): void {
  const { settings } = world;
  const lane = Math.round(world.player.currentLane) as Lane;
  const obstacleIndex = world.obstacles.findIndex(
    (obstacle) =>
      obstacle.lane === lane &&
      Math.abs(obstacle.x - world.player.trackPosition) <=
        obstacle.width * settings.obstacleCollisionWidthFactor,
  );

  if (obstacleIndex >= 0) {
    const [obstacle] = world.obstacles.splice(obstacleIndex, 1);
    if (!obstacle) {
      return;
    }
    world.lives -= 1;
    world.score += obstacle.scoreDelta;
    world.lastHitObstacle = {
      type: obstacle.type,
      scoreDelta: obstacle.scoreDelta,
    };
    world.debugMessage = `Hit ${obstacle.type}`;
  }

  const collectibleIndex = world.collectibles.findIndex(
    (collectible) =>
      collectible.lane === lane &&
      Math.abs(collectible.x - world.player.trackPosition) <= settings.collectibleCollisionRadius,
  );

  if (collectibleIndex >= 0) {
    const [collectible] = world.collectibles.splice(collectibleIndex, 1);
    if (!collectible) {
      return;
    }
    world.score += collectible.value;
    world.obstacles = world.obstacles.filter(
      (obstacle) =>
        !(
          obstacle.lane === collectible.lane &&
          Math.abs(obstacle.x - collectible.x) <= settings.collectibleCollisionRadius
        ),
    );
    world.lastCollectedItem = {
      type: collectible.type,
      scoreDelta: collectible.value,
    };
    world.debugMessage = `Collected ${collectible.type}`;
  }

  const blockedRowIndex = world.blockedRows.findIndex(
    (blockedRow) =>
      Math.abs(blockedRow.x - world.player.trackPosition) <= settings.obstacleWidth * 0.5 &&
      blockedRow.blockedColumns.includes(lane + 1),
  );

  if (blockedRowIndex >= 0) {
    world.blockedRows.splice(blockedRowIndex, 1);
    world.lives -= 1;
    world.lastHitObstacle = {
      type: 'blocked-lane',
      scoreDelta: -10,
    };
    world.debugMessage = 'Hit blocked lane';
  }
}

function clampLane(lane: Lane): Lane {
  if (lane <= Lane.Left) {
    return Lane.Left;
  }

  if (lane >= Lane.Right) {
    return Lane.Right;
  }

  return lane;
}

function updateEntityProgress(world: WorldRuntimeState): void {
  const obstacleTravelSpan = Math.max(1, OBSTACLE_SPAWN_X - world.player.trackPosition);
  const collectibleTravelSpan = Math.max(1, COLLECTIBLE_SPAWN_X - world.player.trackPosition);
  const blockerTravelSpan = Math.max(1, BLOCKER_SPAWN_X - world.player.trackPosition);

  for (const obstacle of world.obstacles) {
    obstacle.progress = clampProgress(
      (OBSTACLE_SPAWN_X - Math.max(obstacle.x, world.player.trackPosition)) / obstacleTravelSpan,
    );
  }

  for (const collectible of world.collectibles) {
    collectible.progress = clampProgress(
      (COLLECTIBLE_SPAWN_X - Math.max(collectible.x, world.player.trackPosition)) /
        collectibleTravelSpan,
    );
  }

  for (const blockedRow of world.blockedRows) {
    blockedRow.progress = clampProgress(
      (BLOCKER_SPAWN_X - Math.max(blockedRow.x, world.player.trackPosition)) / blockerTravelSpan,
    );
  }
}

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function hasSameLaneSpawnGap<T extends { lane: Lane; x: number }>(
  entities: T[],
  lane: Lane,
  spawnX: number,
  cellWidth: number,
): boolean {
  const minGap = cellWidth * SAME_LANE_MIN_GAP_CELLS;
  return entities.every((entity) => entity.lane !== lane || Math.abs(spawnX - entity.x) >= minGap);
}

function canPlaceObstacle(
  world: WorldRuntimeState,
  obstacle: ObstacleState,
  settings: WorldRuntimeState['settings'],
): boolean {
  const bandGap = settings.obstacleWidth * DEPTH_BAND_GAP_CELLS;
  const occupiedLanes = new Set<Lane>();

  for (const existingObstacle of world.obstacles) {
    if (Math.abs(existingObstacle.x - obstacle.x) < bandGap) {
      occupiedLanes.add(existingObstacle.lane);
    }
  }

  for (const blockedRow of world.blockedRows) {
    if (Math.abs(blockedRow.x - obstacle.x) < bandGap) {
      for (const blockedColumn of blockedRow.blockedColumns) {
        occupiedLanes.add((blockedColumn - 1) as Lane);
      }
    }
  }

  return occupiedLanes.size === 0 && !occupiedLanes.has(obstacle.lane);
}

function canPlaceCollectible(
  world: WorldRuntimeState,
  collectible: CollectibleState,
  settings: WorldRuntimeState['settings'],
): boolean {
  const bandGap = settings.obstacleWidth * DEPTH_BAND_GAP_CELLS;

  return (
    world.obstacles.every(
      (obstacle) =>
        Math.abs(obstacle.x - collectible.x) >= bandGap || obstacle.lane !== collectible.lane,
    ) &&
    world.blockedRows.every(
      (blockedRow) =>
        Math.abs(blockedRow.x - collectible.x) >= bandGap ||
        !blockedRow.blockedColumns.includes(collectible.lane + 1),
    )
  );
}

function canPlaceBlockedRow(
  world: WorldRuntimeState,
  blockedRow: BlockedRowState,
  settings: WorldRuntimeState['settings'],
): boolean {
  const bandGap = settings.obstacleWidth * DEPTH_BAND_GAP_CELLS;

  return (
    blockedRow.blockedColumns.length <= 1 &&
    world.obstacles.every((obstacle) => Math.abs(obstacle.x - blockedRow.x) >= bandGap)
  );
}

function createBlockedRow(
  seed: number,
  settings: WorldRuntimeState['settings'],
  speedFactor: number,
): BlockedRowState {
  const openLane = laneOrder[Math.floor(seed / 500) % laneOrder.length] ?? Lane.Center;
  const blockedColumns = laneOrder.filter((lane) => lane !== openLane).map((lane) => lane + 1);

  if (speedFactor < 1.8) {
    blockedColumns.splice(1);
  }

  return {
    id: `blocked-row-${seed}`,
    blockedColumns,
    x: BLOCKER_SPAWN_X,
    width: settings.obstacleWidth,
    progress: 0,
  };
}
