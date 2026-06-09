import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors } from '@/src/theme/colors';

export default function SettingsScreen() {
  const [notificaciones, setNotificaciones] = useState(true);
  const [biometrico, setBiometrico] = useState(true);
  const [modoOffline, setModoOffline] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar caché',
      '¿Deseas eliminar los datos guardados localmente?',
      [
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
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Notificaciones</Text>
      <View style={styles.card}>
        <SettingRow
          label="Notificaciones push"
          description="Recibir alertas y recordatorios"
          value={notificaciones}
          onToggle={setNotificaciones}
        />
      </View>

      <Text style={styles.sectionTitle}>Seguridad</Text>
      <View style={styles.card}>
        <SettingRow
          label="Autenticación biométrica"
          description="Usar huella o Face ID al iniciar"
          value={biometrico}
          onToggle={setBiometrico}
        />
      </View>

      <Text style={styles.sectionTitle}>Datos</Text>
      <View style={styles.card}>
        <SettingRow
          label="Modo offline"
          description="Guardar datos para uso sin internet"
          value={modoOffline}
          onToggle={setModoOffline}
        />
        <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
          <View>
            <Text style={styles.actionLabel}>Limpiar caché</Text>
            <Text style={styles.actionDescription}>Eliminar datos guardados localmente</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Acerca de</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versión</Text>
          <Text style={styles.infoValue}>0.1.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>SDK</Text>
          <Text style={styles.infoValue}>Expo 54</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Proyecto</Text>
          <Text style={styles.infoValue}>AgroVision</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function SettingRow({ label, description, value, onToggle }: {
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', marginBottom: 8, marginTop: 16,
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
  settingDescription: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  actionLabel: { fontSize: 15, fontWeight: '500', color: colors.error },
  actionDescription: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actionArrow: { fontSize: 20, color: colors.textMuted },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 14, color: colors.textMuted },
  infoValue: { fontSize: 14, color: colors.text },
});