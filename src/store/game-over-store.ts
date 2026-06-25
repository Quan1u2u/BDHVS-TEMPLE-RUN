import { create } from 'zustand';

interface GameOverState {
  open: boolean;
  score: number;
  close: () => void;
}

export const useGameOverStore = create<GameOverState>((set) => ({
  open: false,
  score: 0,
  close: () => set({ open: false }),
}));

export function openGameOverDialog(score: number) {
  useGameOverStore.setState({
    open: true,
    score,
  });
}
