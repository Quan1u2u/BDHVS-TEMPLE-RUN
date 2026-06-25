import { describe, expect, it } from 'vitest';

import { TileId } from '../tiles/tile-atlas';
import { getTileTextureKey, resolveTileFrameOrThrow } from './tile-textures';

describe('tile textures', () => {
  it('builds stable cache keys per tile id', () => {
    expect(getTileTextureKey(TileId.BORDER_L)).toBe('tile-57');
  });

  it('returns atlas frame data for valid tile ids', () => {
    expect(resolveTileFrameOrThrow(TileId.BORDER_C)).toMatchObject({
      width: 16,
      height: 16,
    });
  });
});
