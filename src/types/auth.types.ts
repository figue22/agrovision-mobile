export interface Usuario {
  usuario_id: string;
  correo: string;
  nombre: string;
  apellido: string;
  rol: 'admin' | 'tecnico' | 'agricultor';
}

export interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (usuario: Usuario, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}