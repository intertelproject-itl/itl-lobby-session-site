import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';
import { AuthResponse, LoginRequest, Cadastro } from './auth.types';

export async function login(payload: LoginRequest) {
  const { data } = await apiClient.post<AuthResponse>('/Login', payload);
  return data;
}

export async function register(cadastro: Cadastro) {
  const { data } = await apiClient.post<AuthResponse>('/Login/cadastrar', cadastro);
  return data;
}
