import { api } from './api.service';
import { Usuario } from '@/src/types/auth.types';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  usuario: Usuario;
}

export interface Login2FARequired {
  requiere_2fa: true;
  mensaje: string;
}

export const authService = {
  login: async (correo: string, contrasena: string): Promise<LoginResponse | Login2FARequired> => {
    const response = await api.post<LoginResponse | Login2FARequired>('/auth/login', {
      correo,
      contrasena,
    });
    return response.data;
  },

  loginWith2fa: async (correo: string, contrasena: string, codigo: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login-2fa', {
      correo,
      contrasena,
      codigo_2fa: codigo,
    });
    return response.data;
  },

  me: async (): Promise<Usuario> => {
    const response = await api.get<Usuario>('/auth/me');
    return response.data;
  },

  forgotPassword: async (correo: string): Promise<{
    mensaje: string;
    dev_reset_url?: string;
    dev_token?: string;
    dev_expira?: string;
  }> => {
    const response = await api.post('/auth/forgot-password', { correo });
    return response.data;
  },

  resetPassword: async (token: string, nueva_contrasena: string): Promise<{ mensaje: string }> => {
    const response = await api.post<{ mensaje: string }>('/auth/reset-password', { token, nueva_contrasena });
    return response.data;
  },
};