import { atom } from 'jotai';
import type { CollectibleType, ObstacleType } from '../../game/domain/types';
import { Lane } from '../../game/domain/types';

export interface BlockedRowRender {
  id: string;
  trackOffset: number;
  blockedColumns: number[];
}

export interface ObstacleRender {
  id: string;
  lane: Lane;
  trackOffset: number;
  type: ObstacleType;
}

export interface CollectibleRender {
  id: string;
  lane: Lane;
  trackOffset: number;
  type: CollectibleType;
}

export const tileSizeAtom = atom(0);
export const visibleRowsAtom = atom(0);
export const playerLaneAtom = atom(Lane.Center);
export const boardScrollOffsetRowsAtom = atom(0);
export const unitsPerBoardRowAtom = atom(72);
export const blockedRowsAtom = atom<BlockedRowRender[]>([]);
export const obstaclesAtom = atom<ObstacleRender[]>([]);
export const collectiblesAtom = atom<CollectibleRender[]>([]);
export const renderErrorAtom = atom<string | null>(null);
