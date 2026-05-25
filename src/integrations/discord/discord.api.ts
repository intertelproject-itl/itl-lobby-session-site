import { apiClient } from '../http/apiClient';
import '../http/authInterceptor';
import { DiscordMessageRequest } from './discord.types';

export async function sendDiscordRoll(payload: DiscordMessageRequest) {
  await apiClient.post('/Discord', payload, {
    suppressNonTimeoutError: true,
  });
}
