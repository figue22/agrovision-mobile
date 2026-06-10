import { api } from './api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DatoClimaticoResponse {
  dato_climatico_id: string;
  parcela_id: string;
  fecha: string;
  temp_maxima?: number;
  temp_minima?: number;
  temp_promedio?: number;
  precipitacion_mm?: number;
  humedad_pct?: number;
  velocidad_viento?: number;
  indice_uv?: number;
  cobertura_nubes_pct?: number;
  presion_atm?: number;
  datos_crudos?: { prob_lluvia_pct?: number };
  fuente?: string;
}

export interface PromediosResponse {
  temp_promedio: number;
  precipitacion_total: number;
  humedad_promedio: number;
  dias_registrados: number;
}

export const weatherService = {
  getUltimo: async (parcelaId: string): Promise<DatoClimaticoResponse | null> => {
    try {
      const response = await api.get<DatoClimaticoResponse>(
        `/weather/parcela/${parcelaId}/ultimo`,
      );
      await AsyncStorage.setItem(`cache_weather_${parcelaId}`, JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem(`cache_weather_${parcelaId}`);
      return cached ? JSON.parse(cached) : null;
    }
  },

  getForecast: async (parcelaId: string): Promise<DatoClimaticoResponse[]> => {
    try {
      const response = await api.get<DatoClimaticoResponse[]>(
        `/weather/parcela/${parcelaId}/forecast`,
      );
      await AsyncStorage.setItem(`cache_forecast_${parcelaId}`, JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem(`cache_forecast_${parcelaId}`);
      return cached ? JSON.parse(cached) : [];
    }
  },

  fetchCurrent: async (parcelaId: string): Promise<DatoClimaticoResponse> => {
    const response = await api.get<DatoClimaticoResponse>(
      `/weather/parcela/${parcelaId}/fetch`,
    );
    return response.data;
  },

  getPromedios: async (parcelaId: string): Promise<PromediosResponse | null> => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await api.get<PromediosResponse>(
        `/weather/parcela/${parcelaId}/promedios?desde=${hace30}&hasta=${hoy}`,
      );
      return response.data;
    } catch {
      return null;
    }
  },

  getHistorial: async (parcelaId: string): Promise<DatoClimaticoResponse[]> => {
    try {
      const response = await api.get<DatoClimaticoResponse[]>(
        `/weather/parcela/${parcelaId}?limit=30`,
      );
      return response.data;
    } catch {
      return [];
    }
  },
};