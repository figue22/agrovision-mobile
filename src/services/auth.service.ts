import { api } from './api.service';
import { Usuario } from '@/src/types/auth.types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  usuario: Usuario;
}

export const authService = {
    login: async (correo: string, contrasena: string): Promise<LoginResponse> => {
      const response = await api.post<LoginResponse>('/auth/login', { correo, contrasena });
      return response.data;
  },

  me: async (): Promise<Usuario> => {
    const response = await api.get<Usuario>('/auth/me');
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
};