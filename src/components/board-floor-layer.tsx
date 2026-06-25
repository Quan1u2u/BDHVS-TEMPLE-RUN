import type { Texture } from 'pixi.js';
import { useMemo } from 'react';

import { buildBoardRowTiles } from '../game/rendering/board-tiles';
import { BOARD_COLUMNS } from '../game/rendering/grid-layout';
import { createTileTextureOrThrow } from '../game/rendering/tile-textures';

interface BoardFloorLayerProps {
  tileSize: number;
  tileTexture: Texture;
  visibleRows: number;
}

export function BoardFloorLayer({ tileSize, tileTexture, visibleRows }: BoardFloorLayerProps) {
  const sprites = useMemo(() => {
    const nextSprites = [];

    for (let row = 0; row < visibleRows; row += 1) {
      const rowTiles = buildBoardRowTiles(row);
      for (let column = 0; column < BOARD_COLUMNS; column += 1) {
        const tileId = rowTiles[column];
        if (tileId === undefined) {
          continue;
        }

        nextSprites.push(
          <pixiSprite
            key={`floor-${row}-${column}-${tileId}`}
            texture={createTileTextureOrThrow(tileTexture, tileId)}
            x={column * tileSize}
            y={row * tileSize}
            width={tileSize}
            height={tileSize}
          />,
        );
      }
    }

    return nextSprites;
  }, [tileSize, tileTexture, visibleRows]);

  return <pixiContainer>{sprites}</pixiContainer>;
}
