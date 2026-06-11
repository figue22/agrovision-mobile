import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Linking,
} from 'react-native';
import { authService } from '@/src/services/auth.service';
import { colors } from '@/src/theme/colors';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    mensaje: string;
    dev_reset_url?: string;
    dev_token?: string;
    dev_expira?: string;
  } | null>(null);

  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim() || !emailRegex.test(correo.trim())) {
      Alert.alert('Error', 'Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(correo.trim().toLowerCase());
      setResultado(res);
    } catch {
      // Mostrar mensaje genérico igual que en éxito (seguridad)
      setResultado({
        mensaje: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirEnlace = () => {
    if (resultado?.dev_reset_url) {
      // En desarrollo: navegar a la pantalla de reset con el token
      const url = resultado.dev_reset_url;
      const token = url.split('token=')[1];
      if (token) {
        navigation.navigate('ResetPassword', { token });
      } else {
        Linking.openURL(url);
      }
    }
  };

  // ── Pantalla de confirmación ──
  if (resultado) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>✅</Text>
            </View>
            <Text style={styles.title}>Solicitud enviada</Text>
            <Text style={styles.subtitle}>{resultado.mensaje}</Text>
          </View>

          <View style={styles.form}>
            {/* Modo desarrollo — mostrar enlace */}
            {resultado.dev_reset_url && (
              <View style={styles.devBox}>
                <Text style={styles.devTitle}>🛠 Modo desarrollo</Text>
                <Text style={styles.devSubtitle}>
                  En producción este enlace se enviaría por correo. Por ahora úsalo directamente:
                </Text>
                <TouchableOpacity style={styles.devButton} onPress={abrirEnlace}>
                  <Text style={styles.devButtonText}>Abrir pantalla de recuperación</Text>
                </TouchableOpacity>
                {resultado.dev_token && (
                  <Text style={styles.devToken} numberOfLines={3}>
                    Token: {resultado.dev_token}
                  </Text>
                )}
                {resultado.dev_expira && (
                  <Text style={styles.devExpira}>
                    Expira: {new Date(resultado.dev_expira).toLocaleString('es-CO')}
                  </Text>
                )}
              </View>
            )}

            {!resultado.dev_reset_url && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Revisa tu bandeja de entrada y también la carpeta de spam.
                  El enlace es válido por <Text style={styles.infoTextBold}>1 hora</Text>.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => { setResultado(null); setCorreo(''); }}
            >
              <Text style={styles.outlineButtonText}>Intentar con otro correo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backButtonText}>← Volver al login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Formulario ──
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🔑</Text>
          </View>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
          </Text>
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
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, (loading || !correo.trim()) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !correo.trim()}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.buttonText}>Enviar enlace de recuperación</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver al login</Text>
          </TouchableOpacity>
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
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
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
  outlineButton: {
    height: 48, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  outlineButtonText: { color: colors.text, fontSize: 15 },
  backButton: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  backButtonText: { color: colors.textMuted, fontSize: 14 },
  infoBox: {
    backgroundColor: colors.card, borderRadius: 12,
    padding: 16, marginBottom: 8,
  },
  infoText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  infoTextBold: { fontWeight: '600', color: colors.text },
  devBox: {
    borderWidth: 1, borderColor: '#f59e0b', borderRadius: 12,
    backgroundColor: '#fffbeb', padding: 16, gap: 8, marginBottom: 8,
  },
  devTitle: { fontSize: 12, fontWeight: '700', color: '#92400e', textTransform: 'uppercase' },
  devSubtitle: { fontSize: 12, color: '#b45309', lineHeight: 18 },
  devButton: {
    backgroundColor: '#d97706', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  devButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  devToken: { fontSize: 10, color: '#92400e', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  devExpira: { fontSize: 11, color: '#b45309' },
});