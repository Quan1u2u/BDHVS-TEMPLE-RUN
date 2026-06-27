import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

export const gameOverOpenAtom = atom(false);
export const gameOverScoreAtom = atom(0);

export function openGameOverDialog(score: number): void {
  const store = getDefaultStore();
  store.set(gameOverScoreAtom, score);
  store.set(gameOverOpenAtom, true);
}
