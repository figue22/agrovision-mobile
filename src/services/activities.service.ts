import { api } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InsumoActividad {
  insumo_actividad_id?: string;
  actividad_id?: string;
  nombre_insumo: string;
  tipo_insumo_id: number;
  cantidad: number;
  unidad: string;
  costo_unitario_cop?: number;
  marca?: string;
  tipoInsumo?: { nombre: string };
}

export interface ActividadResponse {
  actividad_id: string;
  parcela_id: string;
  cultivo_parcela_id?: string;
  tipo_actividad_id: number;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  costo_cop?: number;
  fecha_realizacion: string;
  notas?: string;
  insumos?: InsumoActividad[];
  tipoActividad?: { nombre: string; codigo: string };
  cultivoParcela?: {
    cultivo_parcela_id: string;
    fecha_siembra: string;
    estado: string;
    tipoCultivo?: { nombre: string };
  };
  parcela?: { nombre: string };
}

export interface CreateActividadRequest {
  parcela_id: string;
  cultivo_parcela_id?: string;
  tipo_actividad_id: number;
  descripcion?: string;
  cantidad?: number;
  unidad?: string;
  costo_cop?: number;
  fecha_realizacion: string;
  notas?: string;
  insumos?: Omit<InsumoActividad, 'insumo_actividad_id' | 'actividad_id' | 'tipoInsumo'>[];
}

export interface ResumenActividades {
  total_actividades: number;
  costo_total_cop: number;
  por_tipo: { tipo: string; cantidad: number }[];
}

export const activitiesService = {
  getByParcela: async (parcelaId: string): Promise<ActividadResponse[]> => {
    try {
      const response = await api.get<ActividadResponse[]>(`/activities/parcela/${parcelaId}`);
      await AsyncStorage.setItem(`cache_activities_${parcelaId}`, JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem(`cache_activities_${parcelaId}`);
      return cached ? JSON.parse(cached) : [];
    }
  },

  getResumen: async (parcelaId: string): Promise<ResumenActividades | null> => {
    try {
      const response = await api.get<ResumenActividades>(`/activities/parcela/${parcelaId}/resumen`);
      return response.data;
    } catch {
      return null;
    }
  },

  create: async (data: CreateActividadRequest): Promise<ActividadResponse> => {
    const response = await api.post<ActividadResponse>('/activities', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateActividadRequest>): Promise<ActividadResponse> => {
    const response = await api.put<ActividadResponse>(`/activities/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/activities/${id}`);
  },
};

export const catalogsService = {
  getTiposActividad: async (): Promise<{ id: number; nombre: string; codigo: string }[]> => {
    try {
      const response = await api.get('/catalogs/tipos-actividad');
      await AsyncStorage.setItem('cache_tipos_actividad', JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem('cache_tipos_actividad');
      return cached ? JSON.parse(cached) : [];
    }
  },

  getTiposInsumo: async (): Promise<{ id: number; nombre: string }[]> => {
    try {
      const response = await api.get('/catalogs/tipos-insumo');
      await AsyncStorage.setItem('cache_tipos_insumo', JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem('cache_tipos_insumo');
      return cached ? JSON.parse(cached) : [];
    }
  },
};