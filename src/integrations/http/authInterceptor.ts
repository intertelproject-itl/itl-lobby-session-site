import axios from 'axios';
import { apiClient } from './apiClient';
import { authStorage } from '../../scripts/utils/storage';
import { useApiErrorStore } from '../../scripts/store/api-error.store';

function isTimeoutError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;

  return error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout');
}

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const apiMessage = error?.response?.data?.message;
    const defaultMessage = 'Nao foi possivel se comunicar com a API. Tente novamente em instantes.';
    const shouldSuppress = Boolean(error?.config?.suppressNonTimeoutError) && !isTimeoutError(error);

    if (!axios.isCancel(error) && !shouldSuppress) {
      useApiErrorStore.getState().openError({
        title: 'Erro ao processar a requisicao',
        message: apiMessage || defaultMessage,
        statusCode: status,
      });
    }

    if (status === 401) {
      authStorage.clearAccessToken();
      authStorage.clearUser();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
