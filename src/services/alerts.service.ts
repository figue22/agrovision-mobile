import { api } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Alerta {
  alerta_id: string;
  parcela_id?: string;
  usuario_id: string;
  tipo_alerta_id: number;
  severidad: string;
  titulo: string;
  mensaje: string;
  accion_requerida?: string;
  esta_leida: boolean;
  fecha_lectura?: string;
  creado_en: string;
  parcela?: { nombre: string };
  tipoAlerta?: { nombre: string; descripcion: string };
}

export const alertsService = {
  getMyAlerts: async (): Promise<Alerta[]> => {
    try {
      const response = await api.get<Alerta[]>('/alerts/my');
      await AsyncStorage.setItem('cache_alertas', JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem('cache_alertas');
      return cached ? JSON.parse(cached) : [];
    }
  },

  getUnread: async (): Promise<Alerta[]> => {
    try {
      const response = await api.get<Alerta[]>('/alerts/my/unread');
      return response.data;
    } catch {
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<{ count: number }>('/alerts/my/unread/count');
      return response.data.count;
    } catch {
      return 0;
    }
  },

  markAsRead: async (alertaId: string): Promise<void> => {
    await api.patch(`/alerts/${alertaId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/alerts/my/read-all');
  },
};