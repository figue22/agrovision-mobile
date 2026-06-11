import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';


import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from '@/src/screens/auth/LoginScreen';
import HomeScreen from '@/src/screens/home/HomeScreen';
import ParcelsScreen from '@/src/screens/parcels/ParcelsScreen';
import CropsScreen from '@/src/screens/crops/CropsScreen';
import ActivitiesScreen from '@/src/screens/activities/ActivitiesScreen';
import PredictionsScreen from '@/src/screens/predictions/PredictionsScreen';
import RecommendationsScreen from '@/src/screens/recommendations/RecommendationsScreen';
import WeatherScreen from '@/src/screens/weather/WeatherScreen';
import AlertsScreen from '@/src/screens/alerts/AlertsScreen';
import ChatScreen from '@/src/screens/chat/ChatScreen';
import ProfileScreen from '@/src/screens/profile/ProfileScreen';
import SettingsScreen from '@/src/screens/settings/SettingsScreen';
import CreateParcelScreen from '@/src/screens/parcels/CreateParcelScreen';
import ParcelDetailScreen from '@/src/screens/parcels/ParcelDetailScreen';
import PredictionDetailScreen from '@/src/screens/predictions/PredictionDetailScreen';
import RegisterScreen from '@/src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@/src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '@/src/screens/auth/ResetPasswordScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, paddingBottom: 4, height: 60 },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Parcels"
        component={ParcelsScreen}
        options={{ title: 'Parcelas', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text> }}
      />
      <Tab.Screen
        name="Predictions"
        component={PredictionsScreen}
        options={{ title: 'Predicciones', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text> }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: 'Alertas', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔔</Text> }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Chat IA', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💬</Text> }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Crops" component={CropsScreen} options={{ title: 'Cultivos' }} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} options={{ title: 'Actividades' }} />
      <Stack.Screen name="Recommendations" component={RecommendationsScreen} options={{ title: 'Recomendaciones' }} />
      <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: 'Clima' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configuración' }} />
      <Stack.Screen name="CreateParcel" component={CreateParcelScreen} options={{ title: 'Nueva Parcela' }} />
      <Stack.Screen name="ParcelDetail" component={ParcelDetailScreen} options={{ title: 'Detalle Parcela' }} />
      <Stack.Screen name="PredictionDetail" component={PredictionDetailScreen} options={{ title: 'Detalle Predicción' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
      try {
          const token = await AsyncStorage.getItem('accessToken');
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          const usuarioStr = await AsyncStorage.getItem('usuario');

          if (token && usuarioStr && refreshToken) {
              const usuario = JSON.parse(usuarioStr);

              // Solo agricultores pueden usar la app móvil
              if (usuario.rol !== 'agricultor') {
                  await AsyncStorage.clear();
                  return;
              }

              await setAuth(usuario, token, refreshToken);
          }
      } catch {
          // Sin sesión
      } finally {
          setLoading(false);
      }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}