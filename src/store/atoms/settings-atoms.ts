import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { getDefaultStore } from 'jotai/vanilla';
import { defaultGameSettings, type GameSettings } from '../../game/config';

const STORAGE_KEY = 'temple-run-lite.settings';

function cloneSettings(s: GameSettings): GameSettings {
  return { ...s };
}

export const appliedSettingsAtom = atomWithStorage<GameSettings>(
  STORAGE_KEY,
  cloneSettings(defaultGameSettings),
);

export const draftSettingsAtom = atom(cloneSettings(defaultGameSettings));

export const isSettingsPanelOpenAtom = atom(false);

export const isDirtyAtom = atom((get) => {
  const applied = get(appliedSettingsAtom);
  const draft = get(draftSettingsAtom);
  return Object.keys(defaultGameSettings).some((key) => {
    const k = key as keyof GameSettings;
    return applied[k] !== draft[k];
  });
});

export const openSettingsPanelAtom = atom(null, (get, set) => {
  set(draftSettingsAtom, cloneSettings(get(appliedSettingsAtom)));
  set(isSettingsPanelOpenAtom, true);
});

export const updateDraftSettingAtom = atom(
  null,
  (
    get,
    set,
    { key, value }: { key: keyof GameSettings; value: GameSettings[keyof GameSettings] },
  ) => {
    const current = get(draftSettingsAtom);
    set(draftSettingsAtom, { ...current, [key]: value });
  },
);

export const discardDraftAtom = atom(null, (get, set) => {
  set(draftSettingsAtom, cloneSettings(get(appliedSettingsAtom)));
  set(isSettingsPanelOpenAtom, false);
});

export const saveDraftAtom = atom(null, (get, set) => {
  const draft = cloneSettings(get(draftSettingsAtom));
  set(appliedSettingsAtom, draft);
  set(draftSettingsAtom, draft);
  set(isSettingsPanelOpenAtom, false);
});

export function getAppliedGameSettings(): GameSettings {
  return getDefaultStore().get(appliedSettingsAtom);
}
