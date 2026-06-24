import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultGameSettings } from '@/game/config';
import { createSettingsStore } from './game-settings-store';

describe('game settings store', () => {
  const localStorageMock = (() => {
    const store = new Map<string, string>();

    return {
      clear() {
        store.clear();
      },
      getItem(key: string) {
        return store.get(key) ?? null;
      },
      key(index: number) {
        return Array.from(store.keys())[index] ?? null;
      },
      removeItem(key: string) {
        store.delete(key);
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
      get length() {
        return store.size;
      },
    };
  })();

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps draft changes separate until save', () => {
    const store = createSettingsStore();

    store.getState().updateDraftSetting('jumpVelocity', 900);

    expect(store.getState().draftSettings.jumpVelocity).toBe(900);
    expect(store.getState().appliedSettings.jumpVelocity).toBe(defaultGameSettings.jumpVelocity);
  });

  it('persists applied settings to localStorage on save', () => {
    const store = createSettingsStore();

    store.getState().updateDraftSetting('backgroundMusicVolume', 0.2);
    store.getState().saveDraft();

    expect(store.getState().appliedSettings.backgroundMusicVolume).toBe(0.2);
    expect(localStorage.getItem('temple-run-lite.settings')).toContain('backgroundMusicVolume');
  });

  it('resets the draft back to applied values on discard', () => {
    const store = createSettingsStore();

    store.getState().updateDraftSetting('sfxVolume', 0.95);
    store.getState().discardDraft();

    expect(store.getState().draftSettings.sfxVolume).toBe(defaultGameSettings.sfxVolume);
    expect(store.getState().isDirty).toBe(false);
  });
});
