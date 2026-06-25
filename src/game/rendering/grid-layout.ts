import { Lane } from '../domain/types';

export const BOARD_COLUMNS = 5;
export const PLAYABLE_COLUMNS = 3;
export const VERTICAL_PLAYER_ROW_OFFSET = 2;
export const FLOOR_BUFFER_ROWS = 2;

export function computeTileSize(viewportWidth: number): number {
  return viewportWidth / BOARD_COLUMNS;
}

export function computeVisibleRows(viewportHeight: number, tileSize: number): number {
  return Math.ceil(viewportHeight / tileSize);
}

export function laneToBoardColumn(lane: Lane): number {
  switch (lane) {
    case Lane.Left:
      return 1;
    case Lane.Center:
      return 2;
    case Lane.Right:
      return 3;
  }
}

export function progressToBoardY(progress: number, visibleRows: number): number {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const maxIncomingRow = Math.max(0, visibleRows - VERTICAL_PLAYER_ROW_OFFSET);
  return clampedProgress * maxIncomingRow;
}

export function trackOffsetToBoardY(
  trackOffset: number,
  visibleRows: number,
  unitsPerRow: number,
): number {
  const safeUnitsPerRow = Math.max(1, unitsPerRow);
  const playerRow = Math.max(0, visibleRows - VERTICAL_PLAYER_ROW_OFFSET);

  return playerRow - trackOffset / safeUnitsPerRow;
}

export function splitBoardScrollOffset(scrollRows: number): {
  baseRow: number;
  rowOffset: number;
} {
  const normalized = Math.max(0, scrollRows);
  const baseRow = Math.floor(normalized);
  return {
    baseRow,
    rowOffset: normalized - baseRow,
  };
}
