import axios from 'axios';
import { apiConfig } from '../../scripts/constants/api';

declare module 'axios' {
  export interface AxiosRequestConfig {
    suppressNonTimeoutError?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: apiConfig.timeout,
});
