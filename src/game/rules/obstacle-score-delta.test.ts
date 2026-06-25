import { describe, expect, it } from 'vitest';

import { ObstacleType } from '../domain/types';
import { obstacleScoreDelta } from './obstacle-score-delta';

describe('obstacleScoreDelta', () => {
  it('defines a score delta for every obstacle type', () => {
    const obstacleTypes = Object.values(ObstacleType);

    expect(Object.keys(obstacleScoreDelta)).toHaveLength(obstacleTypes.length);

    for (const obstacleType of obstacleTypes) {
      expect(obstacleScoreDelta[obstacleType]).toEqual(expect.any(Number));
    }
  });

  it('punishes obstacle collisions with negative score values', () => {
    for (const delta of Object.values(obstacleScoreDelta)) {
      expect(delta).toBeLessThan(0);
    }
  });

  it('matches the harmful award table', () => {
    expect(obstacleScoreDelta).toEqual({
      [ObstacleType.Virus]: -20,
      [ObstacleType.Hacker]: -20,
      [ObstacleType.Scam]: -10,
      [ObstacleType.FakeNews]: -5,
      [ObstacleType.Cyberbullying]: -5,
    });
  });
});
