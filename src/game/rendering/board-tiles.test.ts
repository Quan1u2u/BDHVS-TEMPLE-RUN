import { describe, expect, it } from 'vitest';

import { TileId } from '../tiles/tile-atlas';
import { buildBoardRowTiles } from './board-tiles';

describe('board tiles', () => {
  it('builds a five-column row with border tiles and sparse random floor tiles', () => {
    const row = buildBoardRowTiles(0);
    expect(row[0]).toBe(TileId.BORDER_L);
    expect(row[1]).toBe(TileId.FLOOR_2);
    expect(row[2]).toBe(TileId.FLOOR_1);
    expect(row[3]).toBe(TileId.FLOOR_1);
    expect(row[4]).toBe(TileId.BORDER_R);
  });

  it('allows explicit blocking tiles without replacing entity layering rules', () => {
    expect(buildBoardRowTiles(3, { blockedColumns: [2] })[2]).toBe(TileId.FLOOR_STONE);
  });
});
