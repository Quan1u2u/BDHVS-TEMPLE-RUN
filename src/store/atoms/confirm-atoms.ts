import { atom } from 'jotai';
import { getDefaultStore } from 'jotai/vanilla';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: ((value: boolean) => void) | null;
}

const initialState: ConfirmState = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  resolve: null,
};

export const confirmStateAtom = atom<ConfirmState>(initialState);

export interface ConfirmActionPayload {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function confirmAction(payload: ConfirmActionPayload): Promise<boolean> {
  return new Promise((resolve) => {
    const store = getDefaultStore();
    store.set(confirmStateAtom, {
      open: true,
      title: payload.title,
      message: payload.message,
      confirmLabel: payload.confirmLabel ?? 'Confirm',
      cancelLabel: payload.cancelLabel ?? 'Cancel',
      resolve,
    });
  });
}

export function resolveConfirmAction(ok: boolean): void {
  const store = getDefaultStore();
  const state = store.get(confirmStateAtom);
  state.resolve?.(ok);
  store.set(confirmStateAtom, { ...initialState });
}
