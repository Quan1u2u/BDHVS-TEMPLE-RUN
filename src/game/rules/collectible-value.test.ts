import { describe, expect, it } from 'vitest';

import { CollectibleType } from '../domain/types';
import { collectibleValue } from './collectible-value';

describe('collectibleValue', () => {
  it('defines a score value for every collectible type', () => {
    const collectibleTypes = Object.values(CollectibleType);

    expect(Object.keys(collectibleValue)).toHaveLength(collectibleTypes.length);

    for (const collectibleType of collectibleTypes) {
      expect(collectibleValue[collectibleType]).toEqual(expect.any(Number));
    }
  });

  it('matches the beneficial award table', () => {
    expect(collectibleValue).toEqual({
      [CollectibleType.AI]: 20,
      [CollectibleType.Cloud]: 20,
      [CollectibleType.STEM]: 10,
      [CollectibleType.DigitalCitizen]: 5,
      [CollectibleType.ELearning]: 5,
    });
  });
});
