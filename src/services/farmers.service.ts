import { api } from './api.service';

export interface PerfilAgricultor {
  agricultor_id: string;
  usuario_id: string;
  cedula: string;
  direccion?: string;
  municipio: string;
  departamento: string;
  tamano_finca_ha?: number;
  creado_en: string;
}

export const farmersService = {
  getMyProfile: async (): Promise<PerfilAgricultor> => {
    const response = await api.get<PerfilAgricultor>('/farmers/my-profile');
    return response.data;
  },

  updateMyProfile: async (data: Partial<PerfilAgricultor>): Promise<PerfilAgricultor> => {
    const response = await api.put<PerfilAgricultor>('/farmers/my-profile', data);
    return response.data;
  },
};