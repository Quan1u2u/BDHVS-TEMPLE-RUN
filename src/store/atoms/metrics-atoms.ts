import { atom } from 'jotai';
import type { TrackingStatus } from '../../game/domain/types';
import { GamePhase, Lane, PoseCommand } from '../../game/domain/types';

export const scoreAtom = atom(0);
export const distanceAtom = atom(0);
export const speedAtom = atom(0);
export const livesAtom = atom(3);
export const laneAtom = atom(Lane.Center);
export const phaseAtom = atom(GamePhase.Boot);
export const poseCommandAtom = atom(PoseCommand.Idle);
export const trackingStatusAtom = atom<TrackingStatus>('idle');
export const calibrationProgressAtom = atom(0);
export const fpsAtom = atom(60);
export const cameraEnabledAtom = atom(false);
export const debugMessageAtom = atom('Booting runtime');
export const bootStageAtom = atom('shell');
export const bootProgressAtom = atom(0);
