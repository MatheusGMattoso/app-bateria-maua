import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

// Faz uma requisicao para a API injetando o token JWT (se existir) no
// header "Authorization: Bearer <token>". Use o caminho relativo a partir
// de /api, ex.: apiFetch('/membros').
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}${path}`, { ...options, headers });
}
