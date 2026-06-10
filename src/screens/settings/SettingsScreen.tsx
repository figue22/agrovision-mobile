import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/services/api.service';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme/colors';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TwoFAStatus {
  tiene_2fa: boolean;
  backup_codes_remaining: number;
}

export default function SettingsScreen() {
  const { usuario } = useAuthStore();
  const [notificaciones, setNotificaciones] = useState(true);
  const [biometrico, setBiometrico] = useState(true);

  // 2FA
  const [twoFaStatus, setTwoFaStatus] = useState<TwoFAStatus | null>(null);
  const [qrData, setQrData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    check2faStatus();
  }, []);

  const check2faStatus = async () => {
    try {
      const res = await api.get<TwoFAStatus>('/auth/2fa/status');
      setTwoFaStatus(res.data);
    } catch {
      setError('Error al verificar estado 2FA');
    }
  };

  const generate2fa = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
        // Verificar que el token esté disponible
        const token = await AsyncStorage.getItem('accessToken');
        console.log('Token disponible:', !!token, token?.slice(0, 20));
        
        const res = await api.post<{ secret: string; otpauth_url: string; qr_code: string }>(
            '/auth/2fa/generate',
        );
        setQrData({ secret: res.data.secret, qr_code: res.data.qr_code });
    } catch (err: any) {
        console.log('Error 2FA:', err.response?.status, err.response?.data);
        setError(err.response?.data?.message || 'Error al generar 2FA');
    } finally {
        setLoading(false);
    }
};

  const verify2fa = async () => {
    if (codigo.length !== 6) { setError('El código debe tener 6 dígitos'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ mensaje: string; backup_codes: string[] }>(
        '/auth/2fa/verify',
        { codigo },
      );
      setMessage(res.data.mensaje);
      setBackupCodes(res.data.backup_codes);
      setQrData(null);
      setCodigo('');
      setTwoFaStatus({ tiene_2fa: true, backup_codes_remaining: res.data.backup_codes.length });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const disable2fa = async () => {
    if (codigo.length < 6) { setError('Ingresa tu código TOTP'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ mensaje: string }>('/auth/2fa/disable', { codigo });
      setMessage(res.data.mensaje);
      setCodigo('');
      setTwoFaStatus({ tiene_2fa: false, backup_codes_remaining: 0 });
      setBackupCodes(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (codigo.length !== 6) { setError('Ingresa tu código TOTP actual'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ backup_codes: string[] }>(
        '/auth/2fa/regenerate-backup',
        { codigo },
      );
      setBackupCodes(res.data.backup_codes);
      setCodigo('');
      setMessage('Nuevos códigos de respaldo generados');
      setTwoFaStatus((prev) => prev
        ? { ...prev, backup_codes_remaining: res.data.backup_codes.length }
        : null,
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    Alert.alert('Limpiar caché', '¿Deseas eliminar los datos guardados localmente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('cache_parcelas');
          await SecureStore.deleteItemAsync('cache_predicciones');
          Alert.alert('✅ Caché eliminado correctamente');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Notificaciones */}
      <Text style={styles.sectionTitle}>Notificaciones</Text>
      <View style={styles.card}>
        <SettingRow
          label="Notificaciones push"
          description="Recibir alertas y recordatorios"
          value={notificaciones}
          onToggle={setNotificaciones}
        />
      </View>

      {/* Seguridad */}
      <Text style={styles.sectionTitle}>Seguridad</Text>
      <View style={styles.card}>
        <SettingRow
          label="Autenticación biométrica"
          description="Usar huella o Face ID al iniciar"
          value={biometrico}
          onToggle={setBiometrico}
          last
        />
      </View>

      {/* 2FA */}
      <Text style={styles.sectionTitle}>Autenticación en dos pasos (2FA)</Text>
      <View style={styles.card}>
        <View style={styles.twoFaHeader}>
          <Text style={styles.twoFaTitle}>🔐 2FA</Text>
          <Text style={styles.twoFaDesc}>
            Agrega seguridad extra con Google Authenticator o Authy
          </Text>
        </View>

        {twoFaStatus === null ? (
          <ActivityIndicator color={colors.primary} style={{ margin: 16 }} />
        ) : twoFaStatus.tiene_2fa ? (
          <View style={styles.twoFaSection}>
            <View style={styles.twoFaActive}>
              <Text style={styles.twoFaActiveText}>✅ 2FA está activo</Text>
              <Text style={styles.twoFaCodesLeft}>
                🔑 {twoFaStatus.backup_codes_remaining} códigos de respaldo restantes
              </Text>
            </View>

            <Text style={styles.label}>Código TOTP o código de respaldo</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={codigo}
              onChangeText={(v) => setCodigo(v.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={8}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={disable2fa}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={colors.error} size="small" />
                  : <Text style={styles.dangerButtonText}>Desactivar</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={regenerateBackupCodes}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>🔄 Regenerar códigos</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.twoFaSection}>
            <Text style={styles.twoFaInactive}>2FA no está activo</Text>

            {!qrData ? (
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={generate2fa}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color={colors.white} size="small" />
                        : <Text style={styles.primaryButtonText}>📱 Activar 2FA</Text>}
                </TouchableOpacity>
            ) : (
                <View style={styles.qrSection}>
                    <Text style={styles.qrStep}>
                        1. Escanea este QR con Google Authenticator o Authy:
                    </Text>
                    <View style={styles.qrContainer}>
                        <Image
                            source={{ uri: qrData.qr_code }}
                            style={styles.qrImage}
                            contentFit="contain"
                        />
                    </View>
                    <View style={styles.secretBox}>
                        <Text style={styles.secretLabel}>O ingresa manualmente:</Text>
                        <Text selectable style={styles.secretCode}>{qrData.secret}</Text>
                    </View>
                    <Text style={styles.qrStep}>2. Ingresa el código de 6 dígitos:</Text>
                    <TextInput
                        style={[styles.input, styles.codeInput]}
                        value={codigo}
                        onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                    <TouchableOpacity
                        style={[styles.primaryButton, (loading || codigo.length !== 6) && { opacity: 0.6 }]}
                        onPress={verify2fa}
                        disabled={loading || codigo.length !== 6}
                    >
                        {loading
                            ? <ActivityIndicator color={colors.white} size="small" />
                            : <Text style={styles.primaryButtonText}>Verificar y activar</Text>
                        }
                    </TouchableOpacity>
                </View>
            )}
          </View>
        )}

        {error !== '' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {message !== '' && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        )}
      </View>

      {/* Códigos de respaldo */}
      {backupCodes && (
        <View style={[styles.card, styles.backupCard]}>
          <Text style={styles.backupTitle}>🔑 Códigos de respaldo</Text>
          <Text style={styles.backupDesc}>
            Guárdalos en un lugar seguro. Cada uno funciona una sola vez.
          </Text>
          <View style={styles.backupGrid}>
            {backupCodes.map((bc, i) => (
              <View key={i} style={styles.backupCode}>
                <Text style={styles.backupCodeText}>{bc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Datos */}
      <Text style={styles.sectionTitle}>Datos</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow} onPress={clearCache}>
          <View>
            <Text style={styles.actionLabel}>🗑 Limpiar caché</Text>
            <Text style={styles.actionDesc}>Eliminar datos guardados localmente</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Acerca de */}
      <Text style={styles.sectionTitle}>Acerca de</Text>
      <View style={styles.card}>
        <InfoRow label="Versión" value="0.1.0" />
        <InfoRow label="SDK" value="Expo 54" />
        <InfoRow label="Usuario" value={usuario?.correo || ''} last />
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, description, value, onToggle, last }: {
  label: string; description: string; value: boolean;
  onToggle: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={[styles.settingRow, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : '#f4f3f4'}
      />
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', marginTop: 12,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  settingLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  settingDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  twoFaHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  twoFaTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  twoFaDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  twoFaSection: { padding: 16, gap: 12 },
  twoFaActive: { gap: 4 },
  twoFaActiveText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  twoFaCodesLeft: { fontSize: 12, color: colors.textMuted },
  twoFaInactive: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, fontSize: 14,
    backgroundColor: colors.background,
  },
  codeInput: { textAlign: 'center', fontSize: 20, letterSpacing: 8 },
  row: { flexDirection: 'row', gap: 10 },
  primaryButton: {
    height: 48, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  dangerButton: {
    flex: 1, height: 44, borderWidth: 1, borderColor: '#fca5a5',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  dangerButtonText: { fontSize: 13, color: colors.error, fontWeight: '600' },
  secondaryButton: {
    flex: 1, height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 12, color: colors.text },
  qrSection: { gap: 12 },
  qrStep: { fontSize: 13, fontWeight: '500', color: colors.text },
  secretBox: {
    backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, gap: 4,
  },
  secretLabel: { fontSize: 11, color: colors.textMuted },
  secretCode: { fontSize: 13, fontFamily: 'monospace', color: colors.text },
  errorBox: {
    margin: 16, backgroundColor: '#fef2f2', borderRadius: 10, padding: 12,
  },
  errorText: { fontSize: 13, color: colors.error },
  successBox: {
    margin: 16, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12,
  },
  successText: { fontSize: 13, color: colors.primary },
  backupCard: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
  backupTitle: { fontSize: 15, fontWeight: '700', color: '#92400e', padding: 16, paddingBottom: 4 },
  backupDesc: { fontSize: 12, color: '#b45309', paddingHorizontal: 16, paddingBottom: 12 },
  backupGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backupCode: {
    backgroundColor: colors.white, borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: '#fcd34d', minWidth: '22%',
    alignItems: 'center',
  },
  backupCodeText: { fontSize: 11, fontFamily: 'monospace', color: '#92400e', fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  actionLabel: { fontSize: 15, fontWeight: '500', color: colors.error },
  actionDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actionArrow: { fontSize: 20, color: colors.textMuted },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 13, color: colors.text },

  qrHint: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  qrContainer: {
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.white, borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: colors.border,
    },
  qrImage: { width: 200, height: 200 },
});