import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/src/stores/auth.store';
import { authService } from '@/src/services/auth.service';
import { colors } from '@/src/theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);

      // Verificar token en AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');
      const usuario = await AsyncStorage.getItem('usuario');
      console.log('En checkBiometric - token:', !!token, 'usuario:', !!usuario);

      if (compatible && enrolled && token) {
          authenticateBiometric();
      }
  };

  const authenticateBiometric = async () => {
      try {
          const result = await LocalAuthentication.authenticateAsync({
              promptMessage: 'Ingresa a AgroVision',
              fallbackLabel: 'Usar contraseña',
              cancelLabel: 'Cancelar',
          });

          if (result.success) {
              // Leer de AsyncStorage como respaldo
              const token = await AsyncStorage.getItem('accessToken');
              const refreshToken = await AsyncStorage.getItem('refreshToken');
              const usuarioStr = await AsyncStorage.getItem('usuario');

              console.log('Token:', !!token, 'Usuario:', !!usuarioStr);

              if (token && usuarioStr && refreshToken) {
                  const usuario = JSON.parse(usuarioStr);
                  setAuth(usuario, token, refreshToken);
              }
          }
      } catch (err) {
          console.log('Error biometrico:', err);
      }
  };

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(correo.trim().toLowerCase(), contrasena);
      await setAuth(response.usuario, response.access_token, response.refresh_token);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🌱</Text>
          </View>
          <Text style={styles.title}>AgroVision</Text>
          <Text style={styles.subtitle}>Predictor & Asistente Agrícola</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            placeholder="agricultor@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.buttonText}>Ingresar</Text>
            }
          </TouchableOpacity>

          {biometricAvailable && (
            <TouchableOpacity style={styles.biometricButton} onPress={authenticateBiometric}>
              <Text style={styles.biometricText}>🔐 Usar huella / Face ID</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  logoText: { fontSize: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 },
  input: {
    height: 48, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, fontSize: 16,
    backgroundColor: colors.card, marginBottom: 8,
  },
  button: {
    height: 52, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  biometricButton: {
    height: 48, borderWidth: 1, borderColor: colors.primary,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  biometricText: { color: colors.primary, fontSize: 15, fontWeight: '500' },
});