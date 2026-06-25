import { describe, expect, it } from 'vitest';

import { TileId } from '../tiles/tile-atlas';
import { buildBoardRowTiles } from './board-tiles';

describe('board tiles', () => {
  it('builds a five-column row with border tiles on the outside', () => {
    expect(buildBoardRowTiles(0)).toEqual([
      TileId.BORDER_L,
      TileId.FLOOR,
      TileId.FLOOR,
      TileId.FLOOR,
      TileId.BORDER_R,
    ]);
  });

  it('allows explicit blocking tiles without replacing entity layering rules', () => {
    expect(buildBoardRowTiles(3, { blockedColumns: [2] })[2]).toBe(TileId.FLOOR_STONE);
  });
});
