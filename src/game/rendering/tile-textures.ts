import { Rectangle, Texture } from 'pixi.js';

import { getTileFrame, type TileId } from '../tiles/tile-atlas';

let tileTextureCache: Record<string, Texture> = {};

export function getTileTextureKey(tileId: TileId): string {
  return `tile-${Number(tileId)}`;
}

export function resolveTileFrameOrThrow(tileId: TileId) {
  const frame = getTileFrame(tileId);

  if (frame.width <= 0 || frame.height <= 0) {
    throw new Error(`Invalid tile frame for ${tileId}`);
  }

  return frame;
}

export function createTileTextureOrThrow(tileTexture: Texture, tileId: TileId): Texture {
  const cacheKey = getTileTextureKey(tileId);
  const cached = tileTextureCache[cacheKey];
  if (cached) {
    return cached;
  }

  const frame = resolveTileFrameOrThrow(tileId);
  const texture = new Texture({
    source: tileTexture.source,
    frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
  });
  tileTextureCache[cacheKey] = texture;
  return texture;
}

export function clearTileTextureCache(): void {
  tileTextureCache = {};
}
