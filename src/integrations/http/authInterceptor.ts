import { apiClient } from './apiClient';
import { authStorage } from '../../scripts/utils/storage';
import { useApiLoadingStore } from '../../scripts/store/api-loading.store';

apiClient.interceptors.request.use(
  (config) => {
    useApiLoadingStore.getState().startRequest();

    const token = authStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    useApiLoadingStore.getState().finishRequest();
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    useApiLoadingStore.getState().finishRequest();
    return response;
  },
  (error) => {
    useApiLoadingStore.getState().finishRequest();

    const status = error?.response?.status;
    if (status === 401) {
      authStorage.clearAccessToken();
      authStorage.clearUser();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
