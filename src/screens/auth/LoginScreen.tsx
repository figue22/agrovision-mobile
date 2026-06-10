import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/stores/auth.store';
import { authService } from '@/src/services/auth.service';
import { colors } from '@/src/theme/colors';


export default function LoginScreen({navigation}: any) {
  const { setAuth } = useAuthStore();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [codigo2fa, setCodigo2fa] = useState('');
  const [requiere2fa, setRequiere2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    if (compatible && enrolled) {
      const savedToken = await AsyncStorage.getItem('accessToken');
      if (savedToken) authenticateBiometric();
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
        const token = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const usuarioStr = await AsyncStorage.getItem('usuario');

        if (token && usuarioStr && refreshToken) {
          const usuario = JSON.parse(usuarioStr);
          setAuth(usuario, token, refreshToken);
        }
      }
    } catch {
      // Silencioso
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

      // Verificar si requiere 2FA
      if ('requiere_2fa' in response && response.requiere_2fa) {
        setRequiere2fa(true);
        setLoading(false);
        return;
      }

      const loginResponse = response as any;

      // Verificar que sea agricultor
      if (loginResponse.usuario.rol !== 'agricultor') {
        Alert.alert(
          'Acceso restringido',
          'Esta aplicación es exclusiva para agricultores. Los administradores y técnicos deben usar el portal web.',
        );
        setLoading(false);
        return;
      }

      await setAuth(loginResponse.usuario, loginResponse.access_token, loginResponse.refresh_token);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Credenciales incorrectas';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin2fa = async () => {
    if (codigo2fa.length < 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.loginWith2fa(
        correo.trim().toLowerCase(),
        contrasena,
        codigo2fa,
      );

      if (response.usuario.rol !== 'agricultor') {
        Alert.alert(
          'Acceso restringido',
          'Esta aplicación es exclusiva para agricultores.',
        );
        setLoading(false);
        return;
      }

      await setAuth(response.usuario, response.access_token, response.refresh_token);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Código 2FA inválido';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla 2FA ──
  if (requiere2fa) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🔐</Text>
            </View>
            <Text style={styles.title}>Verificación 2FA</Text>
            <Text style={styles.subtitle}>
              Abre Google Authenticator y escribe el código de 6 dígitos
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Código de verificación</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={codigo2fa}
              onChangeText={(v) => setCodigo2fa(v.replace(/\D/g, '').slice(0, 8))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={8}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.button, (loading || codigo2fa.length < 6) && styles.buttonDisabled]}
              onPress={handleLogin2fa}
              disabled={loading || codigo2fa.length < 6}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.buttonText}>Verificar</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setRequiere2fa(false); setCodigo2fa(''); }}
            >
              <Text style={styles.backButtonText}>← Volver al login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Pantalla login normal ──
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🌱</Text>
          </View>
          <Text style={styles.title}>AgroVision</Text>
          <Text style={styles.subtitle}>Predictor & Asistente Agrícola</Text>
        </View>

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
          <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate('Register')}
            >
                <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
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
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 },
  input: {
    height: 48, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, fontSize: 16,
    backgroundColor: colors.card, marginBottom: 8,
  },
  codeInput: {
    textAlign: 'center', fontSize: 24, letterSpacing: 10, fontWeight: '700',
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
  backButton: {
    height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  backButtonText: { color: colors.textMuted, fontSize: 14 },

  registerButton: { alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  registerText: { fontSize: 13, color: colors.primary },
});