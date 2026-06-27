import { atom } from 'jotai';
import type { PoseLandmark } from '../../game/domain/types';

export const previewStreamAtom = atom<MediaStream | null>(null);
export const previewLandmarksAtom = atom<PoseLandmark[]>([]);
export const previewVideoWidthAtom = atom(0);
export const previewVideoHeightAtom = atom(0);
