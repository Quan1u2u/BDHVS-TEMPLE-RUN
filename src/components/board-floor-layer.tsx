import type { Texture } from 'pixi.js';
import { useMemo } from 'react';

import { buildBoardRowTiles } from '../game/rendering/board-tiles';
import {
  BOARD_COLUMNS,
  FLOOR_BUFFER_ROWS,
  splitBoardScrollOffset,
  trackOffsetToBoardY,
} from '../game/rendering/grid-layout';
import { createTileTextureOrThrow } from '../game/rendering/tile-textures';
import { TileId } from '../game/tiles/tile-atlas';
import type { GameRenderSnapshot } from '../store/game-store';

interface BoardFloorLayerProps {
  render: GameRenderSnapshot;
  tileSize: number;
  tileTexture: Texture;
  visibleRows: number;
}

export function BoardFloorLayer({
  render,
  tileSize,
  tileTexture,
  visibleRows,
}: BoardFloorLayerProps) {
  const sprites = useMemo(() => {
    const nextSprites = [];
    const { baseRow, rowOffset } = splitBoardScrollOffset(render.boardScrollOffsetRows);

    for (let row = -FLOOR_BUFFER_ROWS; row < visibleRows + FLOOR_BUFFER_ROWS; row += 1) {
      const boardRow = baseRow + row;
      const rowTiles = buildBoardRowTiles(boardRow);
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
            y={(row - rowOffset) * tileSize}
            width={tileSize}
            height={tileSize}
            cullable
          />,
        );
      }
    }

    for (const blockedRow of render.blockedRows) {
      const y = trackOffsetToBoardY(blockedRow.trackOffset, visibleRows, render.unitsPerBoardRow);
      for (const column of blockedRow.blockedColumns) {
        nextSprites.push(
          <pixiSprite
            key={`${blockedRow.id}-${column}`}
            texture={createTileTextureOrThrow(tileTexture, TileId.FLOOR_STONE)}
            x={column * tileSize}
            y={y * tileSize}
            width={tileSize}
            height={tileSize}
            cullable
          />,
        );
      }
    }

    return nextSprites;
  }, [render, tileSize, tileTexture, visibleRows]);

  return <pixiContainer cullableChildren>{sprites}</pixiContainer>;
}
