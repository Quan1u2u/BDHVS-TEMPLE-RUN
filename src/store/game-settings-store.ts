import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { defaultGameSettings, type GameSettings } from '@/game/config';

const STORAGE_KEY = 'temple-run-lite.settings';

export interface GameSettingsState {
  appliedSettings: GameSettings;
  draftSettings: GameSettings;
  isPanelOpen: boolean;
  isDirty: boolean;
  openPanel: () => void;
  closePanel: () => void;
  updateDraftSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  discardDraft: () => void;
  saveDraft: () => void;
}

function cloneSettings(settings: GameSettings): GameSettings {
  return { ...settings };
}

function areSettingsEqual(left: GameSettings, right: GameSettings): boolean {
  return Object.keys(defaultGameSettings).every((key) => {
    const settingsKey = key as keyof GameSettings;
    return left[settingsKey] === right[settingsKey];
  });
}

function readPersistedSettings(): GameSettings {
  if (typeof localStorage === 'undefined') {
    return cloneSettings(defaultGameSettings);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneSettings(defaultGameSettings);
  }

  try {
    return { ...defaultGameSettings, ...JSON.parse(raw) } as GameSettings;
  } catch {
    return cloneSettings(defaultGameSettings);
  }
}

function persistSettings(settings: GameSettings): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function createSettingsStore() {
  const initialSettings = readPersistedSettings();

  return createStore<GameSettingsState>()((set, get) => ({
    appliedSettings: initialSettings,
    draftSettings: cloneSettings(initialSettings),
    isPanelOpen: false,
    isDirty: false,
    openPanel: () => {
      set((state) => ({
        isPanelOpen: true,
        draftSettings: cloneSettings(state.appliedSettings),
        isDirty: false,
      }));
    },
    closePanel: () => {
      set({ isPanelOpen: false });
    },
    updateDraftSetting: (key, value) => {
      const nextDraft = { ...get().draftSettings, [key]: value };
      set({
        draftSettings: nextDraft,
        isDirty: !areSettingsEqual(nextDraft, get().appliedSettings),
      });
    },
    discardDraft: () => {
      const appliedSettings = cloneSettings(get().appliedSettings);
      set({
        draftSettings: appliedSettings,
        isDirty: false,
        isPanelOpen: false,
      });
    },
    saveDraft: () => {
      const appliedSettings = cloneSettings(get().draftSettings);
      persistSettings(appliedSettings);
      set({
        appliedSettings,
        draftSettings: cloneSettings(appliedSettings),
        isDirty: false,
        isPanelOpen: false,
      });
    },
  }));
}

export const gameSettingsStore = createSettingsStore();

export function useGameSettingsStore<T>(selector: (state: GameSettingsState) => T): T {
  return useStore(gameSettingsStore, selector);
}

export function getAppliedGameSettings(): GameSettings {
  return gameSettingsStore.getState().appliedSettings;
}
