import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

export const fullscreenAtom = atom(false);

if (typeof document !== 'undefined') {
  document.addEventListener('fullscreenchange', () => {
    getDefaultStore().set(fullscreenAtom, !!document.fullscreenElement);
  });
}

export const toggleFullscreenAtom = atom(null, () => {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
});
