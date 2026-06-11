import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { authService } from '@/src/services/auth.service';
import { colors } from '@/src/theme/colors';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const token: string = route?.params?.token ?? '';

  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  // Validaciones en tiempo real
  const longitudOk  = contrasena.length >= 8;
  const mayusculaOk = /[A-Z]/.test(contrasena);
  const numeroOk    = /[0-9]/.test(contrasena);
  const coincideOk  = contrasena === confirmar && confirmar.length > 0;
  const formValido  = longitudOk && mayusculaOk && numeroOk && coincideOk && !!token;

  const handleSubmit = async () => {
    if (!formValido) return;

    setLoading(true);
    try {
      await authService.resetPassword(token, contrasena);
      setExitoso(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'El enlace es inválido o ha expirado. Solicita uno nuevo.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  const ReqItem = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={styles.reqItem}>
      <View style={[styles.reqDot, ok ? styles.reqDotOk : styles.reqDotPending]} />
      <Text style={[styles.reqText, ok ? styles.reqTextOk : styles.reqTextPending]}>{label}</Text>
    </View>
  );

  // ── Pantalla de éxito ──
  if (exitoso) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🎉</Text>
          </View>
          <Text style={styles.title}>¡Contraseña actualizada!</Text>
          <Text style={styles.subtitle}>
            Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.
          </Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: 32 }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Ir al login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Sin token ──
  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={[styles.logoContainer, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.logoText}>⚠️</Text>
          </View>
          <Text style={styles.title}>Enlace inválido</Text>
          <Text style={styles.subtitle}>
            Este enlace de recuperación es inválido o ha expirado.
          </Text>
          <TouchableOpacity
            style={[styles.button, { marginTop: 32 }]}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.buttonText}>Solicitar nuevo enlace</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Formulario ──
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🔒</Text>
          </View>
          <Text style={styles.title}>Nueva contraseña</Text>
          <Text style={styles.subtitle}>Elige una contraseña segura para tu cuenta</Text>
        </View>

        <View style={styles.form}>
          {/* Campo contraseña */}
          <Text style={styles.label}>Nueva contraseña</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry={!showPassword}
              autoFocus
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* Requisitos */}
          {contrasena.length > 0 && (
            <View style={styles.requirements}>
              <ReqItem ok={longitudOk}  label="Mínimo 8 caracteres" />
              <ReqItem ok={mayusculaOk} label="Al menos una mayúscula" />
              <ReqItem ok={numeroOk}    label="Al menos un número" />
            </View>
          )}

          {/* Confirmar contraseña */}
          <Text style={[styles.label, { marginTop: 8 }]}>Confirmar contraseña</Text>
          <TextInput
            style={[
              styles.input,
              confirmar.length > 0 && (coincideOk ? styles.inputOk : styles.inputError),
            ]}
            value={confirmar}
            onChangeText={setConfirmar}
            placeholder="Repite la contraseña"
            secureTextEntry={!showPassword}
          />
          {confirmar.length > 0 && !coincideOk && (
            <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
          )}

          <TouchableOpacity
            style={[styles.button, !formValido && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!formValido || loading}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.buttonText}>Establecer nueva contraseña</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
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
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  logoText: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  form: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 },
  input: {
    height: 48, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, fontSize: 16,
    backgroundColor: colors.card, marginBottom: 4,
  },
  inputFlex: { flex: 1, marginBottom: 0 },
  inputOk: { borderColor: colors.primary },
  inputError: { borderColor: '#ef4444' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  eyeButton: {
    height: 48, width: 48, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card,
  },
  eyeIcon: { fontSize: 20 },
  requirements: { gap: 4, marginBottom: 8, paddingLeft: 4 },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqDot: { width: 6, height: 6, borderRadius: 3 },
  reqDotOk: { backgroundColor: colors.primary },
  reqDotPending: { backgroundColor: colors.border },
  reqText: { fontSize: 12 },
  reqTextOk: { color: colors.primary },
  reqTextPending: { color: colors.textMuted },
  errorText: { fontSize: 12, color: '#ef4444', marginBottom: 4 },
  button: {
    height: 52, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  backButton: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  backButtonText: { color: colors.textMuted, fontSize: 14 },
});