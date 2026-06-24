import { describe, expect, it } from 'vitest';
import {
  getTileFrame,
  TILE_SIZE_PX,
  TILESHEET_COLUMNS,
  TILESHEET_GAP_PX,
  TileId,
} from './tile-atlas';

describe('tile atlas', () => {
  it('maps TILE_0 to the first slot in the sheet', () => {
    expect(getTileFrame(TileId.TILE_0)).toEqual({
      x: 0,
      y: 0,
      width: TILE_SIZE_PX,
      height: TILE_SIZE_PX,
    });
  });

  it('maps TILE_12 to the first tile of the second row', () => {
    expect(getTileFrame(TileId.TILE_12)).toEqual({
      x: 0,
      y: TILE_SIZE_PX + TILESHEET_GAP_PX,
      width: TILE_SIZE_PX,
      height: TILE_SIZE_PX,
    });
  });

  it('uses row-major indexing up to TILE_131', () => {
    const tileNumber = 131;
    const column = tileNumber % TILESHEET_COLUMNS;
    const row = Math.floor(tileNumber / TILESHEET_COLUMNS);

    expect(getTileFrame(TileId.TILE_131)).toEqual({
      x: column * (TILE_SIZE_PX + TILESHEET_GAP_PX),
      y: row * (TILE_SIZE_PX + TILESHEET_GAP_PX),
      width: TILE_SIZE_PX,
      height: TILE_SIZE_PX,
    });
  });
});
