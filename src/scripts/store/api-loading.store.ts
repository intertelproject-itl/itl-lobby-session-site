import { create } from 'zustand';

type ApiLoadingState = {
  pendingCount: number;
  isLoading: boolean;
  startRequest: () => void;
  finishRequest: () => void;
};

export const useApiLoadingStore = create<ApiLoadingState>((set) => ({
  pendingCount: 0,
  isLoading: false,

  startRequest: () =>
    set((state) => {
      const pendingCount = state.pendingCount + 1;
      return { pendingCount, isLoading: pendingCount > 0 };
    }),

  finishRequest: () =>
    set((state) => {
      const pendingCount = Math.max(0, state.pendingCount - 1);
      return { pendingCount, isLoading: pendingCount > 0 };
    }),
}));
