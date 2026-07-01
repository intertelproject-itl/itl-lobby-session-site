import { create } from 'zustand';

type ApiLoadingState = {
  pendingCount: number;
  isLoading: boolean;
  startRequest: () => void;
  finishRequest: () => void;
};

const apiLoadingDelayMs = 10000;
let loadingTimeoutId: ReturnType<typeof setTimeout> | null = null;

function clearLoadingTimeout() {
  if (!loadingTimeoutId) return;

  clearTimeout(loadingTimeoutId);
  loadingTimeoutId = null;
}

export const useApiLoadingStore = create<ApiLoadingState>((set) => ({
  pendingCount: 0,
  isLoading: false,

  startRequest: () =>
    set((state) => {
      const pendingCount = state.pendingCount + 1;

      if (!loadingTimeoutId) {
        loadingTimeoutId = setTimeout(() => {
          loadingTimeoutId = null;
          set((current) => ({ isLoading: current.pendingCount > 0 }));
        }, apiLoadingDelayMs);
      }

      return { pendingCount };
    }),

  finishRequest: () =>
    set((state) => {
      const pendingCount = Math.max(0, state.pendingCount - 1);

      if (pendingCount === 0) {
        clearLoadingTimeout();
      }

      return { pendingCount, isLoading: pendingCount > 0 && state.isLoading };
    }),
}));
