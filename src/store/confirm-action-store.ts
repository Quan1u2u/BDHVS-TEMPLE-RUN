import { create } from 'zustand';

interface ConfirmActionPayload {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmActionStore {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: ((value: boolean) => void) | null;
  reset: () => void;
}

const initialState = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  resolve: null,
};

export const useConfirmActionStore = create<ConfirmActionStore>((set) => ({
  ...initialState,
  reset: () => set(initialState),
}));

export function confirmAction(payload: ConfirmActionPayload): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmActionStore.setState({
      open: true,
      title: payload.title,
      message: payload.message,
      confirmLabel: payload.confirmLabel ?? 'Confirm',
      cancelLabel: payload.cancelLabel ?? 'Cancel',
      resolve,
    });
  });
}

export function resolveConfirmAction(ok: boolean) {
  const state = useConfirmActionStore.getState();
  state.resolve?.(ok);
  state.reset();
}
