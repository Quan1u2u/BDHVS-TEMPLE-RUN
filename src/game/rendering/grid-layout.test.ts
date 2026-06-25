import { describe, expect, it } from 'vitest';

import { Lane } from '../domain/types';
import {
  computeTileSize,
  computeVisibleRows,
  laneToBoardColumn,
  progressToBoardRow,
  VERTICAL_PLAYER_ROW_OFFSET,
} from './grid-layout';

describe('grid layout', () => {
  it('computes tile size from exactly five tiles across the viewport', () => {
    expect(computeTileSize(500)).toBe(100);
    expect(computeTileSize(960)).toBe(192);
  });

  it('computes visible rows from viewport height and tile size', () => {
    expect(computeVisibleRows(540, 108)).toBe(5);
    expect(computeVisibleRows(550, 108)).toBe(6);
  });

  it('maps gameplay lanes into the three inner board columns', () => {
    expect(laneToBoardColumn(Lane.Left)).toBe(1);
    expect(laneToBoardColumn(Lane.Center)).toBe(2);
    expect(laneToBoardColumn(Lane.Right)).toBe(3);
  });

  it('maps smaller progress values to higher rows and larger progress values toward the player', () => {
    expect(progressToBoardRow(0, 8)).toBe(0);
    expect(progressToBoardRow(0.5, 8)).toBe(3);
    expect(progressToBoardRow(1, 8)).toBe(8 - VERTICAL_PLAYER_ROW_OFFSET);
  });
});
