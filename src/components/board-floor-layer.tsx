import type { Texture } from 'pixi.js';
import { useMemo } from 'react';
import { GamePhase } from '../game/domain/types';
import { buildBoardRowTiles } from '../game/rendering/board-tiles';
import {
  BOARD_COLUMNS,
  FLOOR_BUFFER_ROWS,
  splitBoardScrollOffset,
  trackOffsetToBoardY,
} from '../game/rendering/grid-layout';
import { createTileTextureOrThrow } from '../game/rendering/tile-textures';
import { TileId } from '../game/tiles/tile-atlas';
import type { BlockedRowRender } from '../store/atoms/render-atoms';

interface BoardFloorLayerProps {
  tileSize: number;
  tileTexture: Texture;
  visibleRows: number;
  phase: GamePhase;
  boardScrollOffsetRows: number;
  blockedRows: BlockedRowRender[];
  unitsPerBoardRow: number;
}

export function BoardFloorLayer({
  tileSize,
  tileTexture,
  visibleRows,
  phase,
  boardScrollOffsetRows,
  blockedRows,
  unitsPerBoardRow,
}: BoardFloorLayerProps) {
  const sprites = useMemo(() => {
    if (phase === GamePhase.Boot) return [];

    const nextSprites: React.ReactElement[] = [];
    const { baseRow, rowOffset } = splitBoardScrollOffset(boardScrollOffsetRows);

    for (let row = -FLOOR_BUFFER_ROWS; row < visibleRows + FLOOR_BUFFER_ROWS; row += 1) {
      const boardRow = baseRow - row;
      const rowTiles = buildBoardRowTiles(boardRow);
      for (let column = 0; column < BOARD_COLUMNS; column += 1) {
        const tileId = rowTiles[column];
        if (tileId === undefined) continue;
        nextSprites.push(
          <pixiSprite
            key={`floor-${row}-${column}`}
            texture={createTileTextureOrThrow(tileTexture, tileId)}
            x={column * tileSize}
            y={(row + rowOffset) * tileSize}
            width={tileSize}
            height={tileSize}
            cullable
          />,
        );
      }
    }

    for (const blockedRow of blockedRows) {
      const y = trackOffsetToBoardY(blockedRow.trackOffset, visibleRows, unitsPerBoardRow);
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
  }, [
    phase,
    boardScrollOffsetRows,
    blockedRows,
    unitsPerBoardRow,
    tileSize,
    tileTexture,
    visibleRows,
  ]);

  return <pixiContainer cullableChildren>{sprites}</pixiContainer>;
}
