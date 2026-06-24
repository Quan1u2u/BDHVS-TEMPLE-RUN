import { describe, expect, it } from 'vitest';

import { defaultGameSettings } from '../config';
import { Lane, ObstacleType, PlayerAction } from '../domain/types';
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

  it('resolves jumps back to the ground after enough simulated time', () => {
    const world = createInitialWorld(defaultGameSettings);

    stepWorld(world, { deltaMs: 16, action: PlayerAction.Jump });
    expect(world.player.isJumping).toBe(true);

    for (let frame = 0; frame < 90; frame += 1) {
      stepWorld(world, { deltaMs: 16, action: PlayerAction.None });
    }

    expect(world.player.isJumping).toBe(false);
    expect(world.player.jumpHeight).toBe(0);
  });

  it('applies LUT-based penalties and life loss on obstacle collisions', () => {
    const world = createInitialWorld(defaultGameSettings);

    world.score = 400;
    world.player.currentLane = Lane.Center;
    world.player.targetLane = Lane.Center;
    world.obstacles.push({
      id: 'obstacle-1',
      type: ObstacleType.FireTrap,
      lane: Lane.Center,
      x: world.player.trackPosition,
      width: 70,
      height: 40,
      scoreDelta: -180,
    });

    stepWorld(world, { deltaMs: 16, action: PlayerAction.None });

    expect(world.lives).toBe(2);
    expect(world.score).toBe(220);
    expect(world.obstacles).toHaveLength(0);
  });
});
