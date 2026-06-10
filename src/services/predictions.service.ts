import { api } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Prediccion {
  prediccion_id: string;
  parcela_id: string;
  cultivo_parcela_id?: string;
  tipo_cultivo_id: string;
  version_modelo: string;
  tipo_modelo: string;
  rendimiento_predicho_ton: number;
  puntaje_confianza?: number;
  intervalo_conf_inferior?: number;
  intervalo_conf_superior?: number;
  nivel_riesgo: string;
  fecha_prediccion: string;
  factores_riesgo?: object;
  recomendaciones?: Recomendacion[];
  parcela?: { nombre: string };
  tipoCultivo?: { nombre: string; codigo: string };
}

export interface Recomendacion {
  recomendacion_id: string;
  prediccion_id: string;
  parcela_id?: string;
  tipo_recomendacion: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  fecha_recomendacion: string;
  fecha_implementacion?: string;
  resultado?: string;
  notas_agricultor?: string;
}

export const predictionsService = {
  getByParcela: async (parcelaId: string): Promise<Prediccion[]> => {
    try {
      const response = await api.get<Prediccion[]>(`/predictions/parcela/${parcelaId}`);
      await AsyncStorage.setItem(`cache_pred_${parcelaId}`, JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem(`cache_pred_${parcelaId}`);
      return cached ? JSON.parse(cached) : [];
    }
  },

  getLatestByParcela: async (parcelaId: string): Promise<Prediccion | null> => {
    try {
      const response = await api.get<Prediccion>(`/predictions/parcela/${parcelaId}/latest`);
      await AsyncStorage.setItem(`cache_pred_latest_${parcelaId}`, JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem(`cache_pred_latest_${parcelaId}`);
      return cached ? JSON.parse(cached) : null;
    }
  },

  getRecomendacionesByParcela: async (parcelaId: string): Promise<Recomendacion[]> => {
    try {
      const response = await api.get<Recomendacion[]>(`/recommendations/parcela/${parcelaId}`);
      await AsyncStorage.setItem(`cache_recom_${parcelaId}`, JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem(`cache_recom_${parcelaId}`);
      return cached ? JSON.parse(cached) : [];
    }
  },

  getRecomendacionesPendientes: async (): Promise<Recomendacion[]> => {
    try {
      const response = await api.get<Recomendacion[]>('/recommendations/pendientes');
      await AsyncStorage.setItem('cache_recom_pendientes', JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem('cache_recom_pendientes');
      return cached ? JSON.parse(cached) : [];
    }
  },
};