import { describe, expect, it } from 'vitest';

import { defaultGameSettings } from '../config';
import { CollectibleType, Lane, ObstacleType, PlayerAction } from '../domain/types';
import { createInitialWorld } from './world-factory';
import { stepWorld } from './world-simulation';

describe('stepWorld', () => {
  it('clamps lane changes within the available track', () => {
    const world = createInitialWorld(defaultGameSettings);

    stepWorld(world, { deltaMs: 16, action: PlayerAction.MoveLeft });
    stepWorld(world, { deltaMs: 16, action: PlayerAction.MoveLeft });
    stepWorld(world, { deltaMs: 16, action: PlayerAction.MoveLeft });

    expect(world.player.targetLane).toBe(Lane.Left);

    stepWorld(world, { deltaMs: 16, action: PlayerAction.MoveRight });
    stepWorld(world, { deltaMs: 16, action: PlayerAction.MoveRight });
    stepWorld(world, { deltaMs: 16, action: PlayerAction.MoveRight });

    expect(world.player.targetLane).toBe(Lane.Right);
  });

  it('applies LUT-based penalties and life loss on obstacle collisions', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.obstacles = [];
    world.score = 400;
    world.player.currentLane = Lane.Center;
    world.player.targetLane = Lane.Center;
    world.obstacles.push({
      id: 'obstacle-1',
      type: ObstacleType.Hacker,
      lane: Lane.Center,
      x: world.player.trackPosition,
      width: 70,
      height: 40,
      scoreDelta: -20,
      progress: 1,
    });

    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(world.lives).toBe(2);
    expect(world.score).toBe(380);
    expect(world.obstacles).toHaveLength(0);
    expect(world.lastHitObstacle).toEqual({
      type: ObstacleType.Hacker,
      scoreDelta: -20,
    });
  });

  it('applies award-list rewards on collectible collisions', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.collectibles = [];
    world.player.currentLane = Lane.Right;
    world.player.targetLane = Lane.Right;
    world.collectibles.push({
      id: 'collectible-1',
      type: CollectibleType.Cloud,
      lane: Lane.Right,
      x: world.player.trackPosition,
      y: 200,
      value: 20,
      progress: 1,
    });

    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(world.score).toBe(20);
    expect(world.collectibles).toHaveLength(0);
    expect(world.lastCollectedItem).toEqual({
      type: CollectibleType.Cloud,
      scoreDelta: 20,
    });
  });

  it('exposes normalized vertical progress for spawned obstacles and collectibles', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.obstacles = [];
    world.collectibles = [];
    world.obstacleSpawnCooldownMs = 0;
    world.collectibleSpawnCooldownMs = Number.POSITIVE_INFINITY;

    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    const spawnedObstacle = world.obstacles[0];
    expect(spawnedObstacle?.progress).toBe(0);

    world.obstacles = [];
    world.collectibleSpawnCooldownMs = 0;
    world.obstacleSpawnCooldownMs = Number.POSITIVE_INFINITY;

    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    const spawnedCollectible = world.collectibles[0];

    expect(spawnedCollectible?.progress).toBe(0);

    stepWorld(world, { deltaMs: 400, action: PlayerAction.None });

    expect(world.collectibles[0]?.progress).toBeGreaterThan(0);
    expect(world.collectibles[0]?.progress).toBeLessThanOrEqual(1);
  });

  it('ramps speed more gradually than before while still increasing over time', () => {
    const world = createInitialWorld(defaultGameSettings);
    const initialSpeed = world.speed;

    stepWorld(world, { deltaMs: 1000, action: PlayerAction.None });

    expect(world.speed).toBeGreaterThan(initialSpeed);
    expect(world.speed - initialSpeed).toBeLessThan(40);
  });

  it('keeps same-lane obstacle spawns separated by roughly three cells', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.obstacles = [];
    world.obstacleSpawnCooldownMs = 0;
    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });
    const firstObstacle = world.obstacles[0];
    expect(firstObstacle).toBeDefined();

    world.obstacleSpawnCooldownMs = 0;
    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(world.obstacles).toHaveLength(1);
  });

  it('limits each spawn band to one dangerous lane so there are always two ways around', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.obstacles = [];
    world.blockedRows = [];
    world.obstacleSpawnCooldownMs = 0;
    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    world.obstacleSpawnCooldownMs = 0;
    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(world.obstacles).toHaveLength(1);
  });

  it('does not place a collectible into the same danger band as an obstacle', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.obstacles = [
      {
        id: 'obstacle-1',
        type: ObstacleType.Virus,
        lane: Lane.Center,
        x: 1040,
        width: 72,
        height: 48,
        scoreDelta: -20,
        progress: 0,
      },
    ];
    world.collectibles = [];
    world.collectibleSpawnCooldownMs = 0;

    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(
      world.collectibles.every(
        (collectible) =>
          Math.abs(collectible.x - 1040) >= defaultGameSettings.obstacleWidth * 3 ||
          collectible.lane !== Lane.Center,
      ),
    ).toBe(true);
  });

  it('starts blocked floor rows only after the run reaches 1.5x speed and leaves a lane open', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.obstacles = [];
    world.collectibles = [];
    world.blockedRows = [];
    expect(world.blockedRows).toHaveLength(0);

    world.speed = defaultGameSettings.baseRunSpeed * 1.5;
    world.blockerSpawnCooldownMs = 0;
    world.obstacleSpawnCooldownMs = Number.POSITIVE_INFINITY;
    world.collectibleSpawnCooldownMs = Number.POSITIVE_INFINITY;
    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(world.blockedRows.length).toBeGreaterThan(0);
    expect(world.blockedRows[0]?.blockedColumns.length).toBeLessThan(3);
  });

  it('removes offscreen entities before they can linger in render state', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.obstacles = [];
    world.collectibles = [];
    world.obstacles.push({
      id: 'offscreen-obstacle',
      type: ObstacleType.Virus,
      lane: Lane.Left,
      x: -100,
      width: 70,
      height: 40,
      scoreDelta: -10,
      progress: 1,
    });

    world.collectibles.push({
      id: 'offscreen-collectible',
      type: CollectibleType.AI,
      lane: Lane.Right,
      x: -100,
      y: 200,
      value: 30,
      progress: 1,
    });

    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(world.obstacles).toHaveLength(0);
    expect(world.collectibles).toHaveLength(0);
  });

  it('supports a preview step mode without changing score or lives', () => {
    const world = createInitialWorld(defaultGameSettings);
    const initialDistance = world.distance;
    const initialScore = world.score;
    const initialLives = world.lives;

    stepWorld(world, { deltaMs: 1000, action: PlayerAction.None, mode: 'preview' });

    expect(world.distance).toBeGreaterThan(initialDistance);
    expect(world.score).toBe(initialScore);
    expect(world.lives).toBe(initialLives);
  });

  it('seeds visible entities for the attract-mode start state', () => {
    const world = createInitialWorld(defaultGameSettings);

    expect(world.obstacles.length).toBeGreaterThan(0);
    expect(world.collectibles.length).toBeGreaterThan(0);
  });
});
