import { TILE_SIZE_PX } from '../tiles/tile-atlas';

const MAX_TILES_ACROSS_VIEWPORT = 5;

export function computeTileSize(viewportWidth: number, tileScale: number): number {
  const requestedTileSize = TILE_SIZE_PX * tileScale;
  const viewportCap = viewportWidth / MAX_TILES_ACROSS_VIEWPORT;

  return Math.max(TILE_SIZE_PX, Math.min(requestedTileSize, viewportCap));
}
