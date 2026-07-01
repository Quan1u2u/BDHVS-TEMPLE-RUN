import { TileId } from '../tiles/tile-atlas';

function pickFloorTile(row: number, column: number): TileId {
  const n = row * 157 + column * 271;
  return n % 13 === 0 ? TileId.FLOOR_2 : TileId.FLOOR_1;
}

const floorPattern = [0, 1, 2] as const;

export function buildBoardRowTiles(
  row: number,
  options: { blockedColumns?: number[] } = {},
): TileId[] {
  const tiles: TileId[] = [TileId.BORDER_L];

  for (let column = 0; column < floorPattern.length; column += 1) {
    const boardColumn = column + 1;
    const baseTile = pickFloorTile(row, column);
    tiles.push(options.blockedColumns?.includes(boardColumn) ? TileId.FLOOR_STONE : baseTile);
  }

  tiles.push(TileId.BORDER_R);
  return tiles;
}
