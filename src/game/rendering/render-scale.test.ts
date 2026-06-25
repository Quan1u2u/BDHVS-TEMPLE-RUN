import { describe, expect, it } from 'vitest';

import { TILE_SIZE_PX } from '../tiles/tile-atlas';
import { computeTileSize } from './render-scale';

describe('computeTileSize', () => {
  it('caps tile width to one fifth of the viewport width', () => {
    expect(computeTileSize(320, 99)).toBe(64);
  });

  it('uses the requested scale when it stays within the viewport cap', () => {
    expect(computeTileSize(960, 3)).toBe(TILE_SIZE_PX * 3);
  });

  it('never scales below one source tile', () => {
    expect(computeTileSize(40, 0.5)).toBe(TILE_SIZE_PX);
  });
});
