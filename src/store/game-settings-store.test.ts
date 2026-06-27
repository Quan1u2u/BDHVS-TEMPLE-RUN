import { getDefaultStore } from 'jotai/vanilla';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultGameSettings } from '@/game/config';
import {
  appliedSettingsAtom,
  discardDraftAtom,
  draftSettingsAtom,
  isDirtyAtom,
  isSettingsPanelOpenAtom,
  saveDraftAtom,
  updateDraftSettingAtom,
} from './atoms/settings-atoms';

describe('settings atoms', () => {
  const store = getDefaultStore();
  const STORAGE_KEY = 'temple-run-lite.settings';
  const localStorageMock = (() => {
    const map = new Map<string, string>();
    return {
      clear() {
        map.clear();
      },
      getItem(key: string) {
        return map.get(key) ?? null;
      },
      key(index: number) {
        return Array.from(map.keys())[index] ?? null;
      },
      removeItem(key: string) {
        map.delete(key);
      },
      setItem(key: string, value: string) {
        map.set(key, value);
      },
      get length() {
        return map.size;
      },
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
    store.set(appliedSettingsAtom, { ...defaultGameSettings });
    store.set(draftSettingsAtom, { ...defaultGameSettings });
    store.set(isSettingsPanelOpenAtom, false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps draft changes separate until save', () => {
    store.set(updateDraftSettingAtom, { key: 'laneSnapSpeed', value: 12 });
    expect(store.get(draftSettingsAtom).laneSnapSpeed).toBe(12);
    expect(store.get(appliedSettingsAtom).laneSnapSpeed).toBe(defaultGameSettings.laneSnapSpeed);
  });

  it('persists applied settings to localStorage on save', () => {
    store.set(updateDraftSettingAtom, { key: 'backgroundMusicVolume', value: 0.2 });
    store.set(saveDraftAtom);
    expect(store.get(appliedSettingsAtom).backgroundMusicVolume).toBe(0.2);
    expect(localStorageMock.getItem(STORAGE_KEY)).toContain('backgroundMusicVolume');
  });

  it('resets draft back to applied values on discard', () => {
    store.set(updateDraftSettingAtom, { key: 'sfxVolume', value: 0.95 });
    store.set(discardDraftAtom);
    expect(store.get(draftSettingsAtom).sfxVolume).toBe(defaultGameSettings.sfxVolume);
    expect(store.get(isDirtyAtom)).toBe(false);
  });
});
