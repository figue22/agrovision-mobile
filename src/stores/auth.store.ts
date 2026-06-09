import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario, AuthState } from '@/src/types/auth.types';

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (usuario, accessToken, refreshToken) => {
      try {
          // Guardar en SecureStore
          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', refreshToken);
          // Respaldo en AsyncStorage
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
          await AsyncStorage.setItem('ultimo_login', new Date().toISOString());
          console.log('Auth guardado correctamente');
      } catch (err) {
          console.log('Error guardando auth:', err);
      }
      set({ usuario, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('usuario');
    await AsyncStorage.removeItem('ultimo_login');
    set({ usuario: null, accessToken: null, refreshToken: null, isAuthenticated: false });
},

  setLoading: (isLoading) => set({ isLoading }),
}));