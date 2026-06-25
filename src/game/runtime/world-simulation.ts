import { TRACK_LANE_COUNT, WORLD_WIDTH } from '../config';
import {
  CollectibleType,
  GamePhase,
  Lane,
  ObstacleType,
  PlayerAction,
  PoseCommand,
} from '../domain/types';
import type { CollectibleState, ObstacleState, WorldRuntimeState } from '../domain/world';
import { collectibleValue } from '../rules/collectible-value';
import { obstacleScoreDelta } from '../rules/obstacle-score-delta';

interface StepWorldArgs {
  deltaMs: number;
  action: PlayerAction;
}

const laneOrder = [Lane.Left, Lane.Center, Lane.Right] as const;
const OBSTACLE_SPAWN_X = WORLD_WIDTH + 120;
const COLLECTIBLE_SPAWN_X = WORLD_WIDTH + 80;

export function stepWorld(world: WorldRuntimeState, { deltaMs, action }: StepWorldArgs): void {
  const deltaSeconds = deltaMs / 1000;
  const { settings } = world;

  applyAction(world, action);
  updatePlayer(world, deltaSeconds);
  updateSpeed(world, deltaSeconds);
  updateEntities(world, deltaSeconds);
  spawnEntities(world, deltaMs);
  resolveCollisions(world);

  world.distance += world.speed * deltaSeconds * settings.distanceScale;
  world.score += Math.floor(deltaSeconds * settings.passiveScorePerSecond);
  world.elapsedMs += deltaMs;

  if (world.lives <= 0) {
    world.phase = GamePhase.GameOver;
    world.debugMessage = 'The runner is down';
  }
}

function applyAction(world: WorldRuntimeState, action: PlayerAction): void {
  const { settings } = world;
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
    case PlayerAction.Jump:
      if (!world.player.isJumping) {
        world.player.isJumping = true;
        world.player.jumpVelocity = settings.jumpVelocity;
      }
      world.poseCommand = PoseCommand.Jump;
      return;
    case PlayerAction.None:
      world.poseCommand = PoseCommand.Idle;
      return;
  }
}

function updatePlayer(world: WorldRuntimeState, deltaSeconds: number): void {
  const { settings } = world;
  const laneDelta = world.player.targetLane - world.player.currentLane;
  const laneStep =
    Math.sign(laneDelta) * Math.min(Math.abs(laneDelta), settings.laneSnapSpeed * deltaSeconds);
  world.player.currentLane = clampLane((world.player.currentLane + laneStep) as Lane);

  if (!world.player.isJumping) {
    world.player.jumpHeight = 0;
    return;
  }

  world.player.jumpHeight += world.player.jumpVelocity * deltaSeconds;
  world.player.jumpVelocity -= settings.gravity * deltaSeconds;

  if (world.player.jumpHeight <= 0 && world.player.jumpVelocity < 0) {
    world.player.jumpHeight = 0;
    world.player.jumpVelocity = 0;
    world.player.isJumping = false;
  }
}

function updateSpeed(world: WorldRuntimeState, deltaSeconds: number): void {
  const { settings } = world;
  world.speed = Math.min(
    settings.maxRunSpeed,
    Math.max(settings.baseRunSpeed, world.speed + settings.speedRampPerSecond * deltaSeconds * 10),
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

  updateEntityProgress(world);

  world.obstacles = world.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);
  world.collectibles = world.collectibles.filter((collectible) => collectible.x > -40);
}

function spawnEntities(world: WorldRuntimeState, deltaMs: number): void {
  const { settings } = world;
  world.obstacleSpawnCooldownMs -= deltaMs;
  world.collectibleSpawnCooldownMs -= deltaMs;

  if (world.obstacleSpawnCooldownMs <= 0) {
    world.obstacles.push(createObstacle(world.elapsedMs, settings));
    world.obstacleSpawnCooldownMs = Math.max(
      settings.obstacleSpawnMinCooldownMs,
      settings.obstacleSpawnCooldownMs - world.distance * settings.obstacleSpawnDistanceFactor,
    );
  }

  if (world.collectibleSpawnCooldownMs <= 0) {
    world.collectibles.push(createCollectible(world.elapsedMs, settings));
    world.collectibleSpawnCooldownMs = Math.max(
      settings.collectibleSpawnMinCooldownMs,
      settings.collectibleSpawnCooldownMs -
        world.distance * settings.collectibleSpawnDistanceFactor,
    );
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
  settings: WorldRuntimeState['settings'],
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
    value: collectibleValue[type] ?? settings.collectibleValue,
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
        obstacle.width * settings.obstacleCollisionWidthFactor &&
      !world.player.isJumping,
  );

  if (obstacleIndex >= 0) {
    const [obstacle] = world.obstacles.splice(obstacleIndex, 1);
    if (!obstacle) {
      return;
    }
    world.lives -= 1;
    world.score += obstacle.scoreDelta;
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
    world.debugMessage = `Collected ${collectible.type}`;
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
}

function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}
