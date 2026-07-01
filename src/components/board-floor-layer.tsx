import { useAtomValue } from 'jotai';
import type { Texture } from 'pixi.js';
import { memo, useMemo } from 'react';

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
import { phaseAtom } from '../store/atoms/metrics-atoms';
import {
  blockedRowsAtom,
  boardScrollOffsetRowsAtom,
  tileSizeAtom,
  unitsPerBoardRowAtom,
  visibleRowsAtom,
} from '../store/atoms/render-atoms';

interface BoardFloorLayerProps {
  tileTexture: Texture;
}

export const BoardFloorLayer = memo(function BoardFloorLayer({
  tileTexture,
}: BoardFloorLayerProps) {
  const phase = useAtomValue(phaseAtom);
  const tileSize = useAtomValue(tileSizeAtom);
  const visibleRows = useAtomValue(visibleRowsAtom);
  const boardScrollOffsetRows = useAtomValue(boardScrollOffsetRowsAtom);
  const blockedRows = useAtomValue(blockedRowsAtom);
  const unitsPerBoardRow = useAtomValue(unitsPerBoardRowAtom);

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

  return <pixiContainer>{sprites}</pixiContainer>;
});
