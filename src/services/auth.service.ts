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
};