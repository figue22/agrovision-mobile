import { api } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

 export interface Parcela {
  parcela_id: string;
  agricultor_id: string;
  nombre: string;
  area_hectareas: number;
  ubicacion?: { latitud: number; longitud: number };
  tipo_suelo?: string;
  municipio?: string;
  departamento?: string;
  ph_suelo?: number;
  altitud_msnm?: number;
  limites_geojson?: object;
  descripcion?: string;
  cultivos?: CultivoParcela[];
  creado_en: string;
  actualizado_en: string;
}

export interface CultivoParcela {
  cultivo_parcela_id: string;
  parcela_id: string;
  tipo_cultivo_id: string;
  fecha_siembra: string;
  fecha_cosecha_esperada?: string;
  estado: string;
  area_sembrada_ha?: number;
  rendimiento_esperado_ton?: number;
  temporada?: string;
  notas?: string;
  tipoCultivo?: { nombre: string; codigo: string };
}

export interface TipoCultivo {
  tipo_cultivo_id: string;
  nombre: string;
  codigo: string;
}

const OFFLINE_KEY = 'offline_parcelas';
const OFFLINE_CULTIVOS_KEY = 'offline_cultivos';

export const parcelasService = {
  getMyParcelas: async (): Promise<Parcela[]> => {
    try {
      const response = await api.get<Parcela[]>('/parcels/my');
      await AsyncStorage.setItem('cache_parcelas', JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem('cache_parcelas');
      return cached ? JSON.parse(cached) : [];
    }
  },

  create: async (data: {
    nombre: string;
    area_hectareas: number;
    ubicacion: { latitud: number; longitud: number };
    tipo_suelo?: string;
    ph_suelo?: number;
    altitud_msnm?: number;
    limites_geojson?: object;
    agricultor_id: string;
}): Promise<Parcela> => {
    try {
      const response = await api.post<Parcela>('/parcels', data);
      return response.data;
    } catch {
      const pending = await AsyncStorage.getItem(OFFLINE_KEY);
      const pendingList = pending ? JSON.parse(pending) : [];
      const offlineItem = { ...data, _offline: true, _id: Date.now().toString() };
      pendingList.push(offlineItem);
      await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(pendingList));
      return offlineItem as any;
    }
  },

  createCultivo: async (parcelaId: string, data: {
    tipo_cultivo_id: string;
    fecha_siembra: string;
    fecha_cosecha_esperada?: string;
    area_sembrada_ha?: number;
    rendimiento_esperado_ton?: number;
    estado?: string;
    temporada?: string;
    notas?: string;
}): Promise<CultivoParcela> => {
    try {
      const response = await api.post<CultivoParcela>('/crops/parcela', {
        ...data,
        parcela_id: parcelaId,
      });
      return response.data;
    } catch {
      const pending = await AsyncStorage.getItem(OFFLINE_CULTIVOS_KEY);
      const pendingList = pending ? JSON.parse(pending) : [];
      const offlineItem = { ...data, parcela_id: parcelaId, _offline: true };
      pendingList.push(offlineItem);
      await AsyncStorage.setItem(OFFLINE_CULTIVOS_KEY, JSON.stringify(pendingList));
      return offlineItem as any;
    }
  },

  getTiposCultivo: async (): Promise<TipoCultivo[]> => {
    try {
      const response = await api.get<TipoCultivo[]>('/crops/tipos');
      await AsyncStorage.setItem('cache_tipos_cultivo', JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem('cache_tipos_cultivo');
      return cached ? JSON.parse(cached) : [];
    }
  },

  getCultivosByParcela: async (parcelaId: string): Promise<CultivoParcela[]> => {
        try {
            const response = await api.get<CultivoParcela[]>(`/crops/parcela/${parcelaId}`);
            await AsyncStorage.setItem(`cache_cultivos_${parcelaId}`, JSON.stringify(response.data));
            return response.data;
        } catch {
            const cached = await AsyncStorage.getItem(`cache_cultivos_${parcelaId}`);
            return cached ? JSON.parse(cached) : [];
        }
    },

    update: async (parcelaId: string, data: Partial<Parcela>): Promise<Parcela> => {
    const response = await api.put<Parcela>(`/parcels/${parcelaId}`, data);
    return response.data;
    
    },

    delete: async (parcelaId: string): Promise<void> => {
        await api.delete(`/parcels/${parcelaId}`);
    },

  syncOffline: async (): Promise<{ synced: number; failed: number }> => {
    let synced = 0;
    let failed = 0;

    const pendingParcelas = await AsyncStorage.getItem(OFFLINE_KEY);
    if (pendingParcelas) {
      const list = JSON.parse(pendingParcelas);
      const remaining = [];
      for (const item of list) {
        try {
          const { _offline, _id, ...data } = item;
          await api.post('/parcels', data);
          synced++;
        } catch {
          remaining.push(item);
          failed++;
        }
      }
      await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
    }

    const pendingCultivos = await AsyncStorage.getItem(OFFLINE_CULTIVOS_KEY);
    if (pendingCultivos) {
      const list = JSON.parse(pendingCultivos);
      const remaining = [];
      for (const item of list) {
        try {
          const { _offline, ...data } = item;
          await api.post('/crops/parcela', data);
          synced++;
        } catch {
          remaining.push(item);
          failed++;
        }
      }
      await AsyncStorage.setItem(OFFLINE_CULTIVOS_KEY, JSON.stringify(remaining));
    }

    return { synced, failed };
  },
};