import { create } from 'zustand';

type ApiErrorState = {
  isOpen: boolean;
  title: string;
  message: string;
  statusCode?: number;
  openError: (params: { title: string; message: string; statusCode?: number }) => void;
  closeError: () => void;
};

export const useApiErrorStore = create<ApiErrorState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  statusCode: undefined,

  openError: ({ title, message, statusCode }) =>
    set({
      isOpen: true,
      title,
      message,
      statusCode,
    }),

  closeError: () =>
    set({
      isOpen: false,
      title: '',
      message: '',
      statusCode: undefined,
    }),
}));