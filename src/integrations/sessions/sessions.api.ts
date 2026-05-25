import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';
import { PublicSession } from './sessions.types';

export async function getPublicSessions() {
  const { data } = await apiClient.get<PublicSession | PublicSession[]>('/SessaoJogatina/publicas');
  return Array.isArray(data) ? data : [data];
}

export async function getPublicSessionById(sessionId: number) {
  const { data } = await apiClient.get<PublicSession>(`/SessaoJogatina/${sessionId}`);
  return data;
}

export async function getSessionByIdSilently(sessionId: number) {
  const { data } = await apiClient.get<PublicSession>(`/SessaoJogatina/${sessionId}`, {
    suppressNonTimeoutError: true,
  });
  return data;
}

export async function accessPublicSession(sessionId: number, suppressNonTimeoutError = false) {
  const { data } = await apiClient.post<PublicSession>(`/SessaoJogatina/${sessionId}/Acessar`, undefined, {
    suppressNonTimeoutError,
  });
  return data;
}
