import { TileId } from '../tiles/tile-atlas';

const floorPattern = [TileId.FLOOR_2, TileId.FLOOR_4, TileId.FLOOR_6] as const;

export function buildBoardRowTiles(
  row: number,
  options: { blockedColumns?: number[] } = {},
): TileId[] {
  const tiles: TileId[] = [TileId.BORDER_L];

  for (let column = 0; column < floorPattern.length; column += 1) {
    const boardColumn = column + 1;
    const baseTile = floorPattern[(row + column) % floorPattern.length] ?? TileId.FLOOR_2;
    tiles.push(options.blockedColumns?.includes(boardColumn) ? TileId.FLOOR_STONE : baseTile);
  }

  tiles.push(TileId.BORDER_R);
  return tiles;
}
