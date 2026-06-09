import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme/colors';

export default function ProfileScreen() {
  const { usuario, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {usuario?.nombre?.charAt(0)}{usuario?.apellido?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.nombre}>{usuario?.nombre} {usuario?.apellido}</Text>
        <Text style={styles.correo}>{usuario?.correo}</Text>
        <View style={styles.rolBadge}>
          <Text style={styles.rolText}>{usuario?.rol?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.card}>
          <InfoRow label="Nombre" value={`${usuario?.nombre} ${usuario?.apellido}`} />
          <InfoRow label="Correo" value={usuario?.correo || ''} />
          <InfoRow label="Rol" value={usuario?.rol || ''} />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  nombre: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  correo: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  rolBadge: {
    marginTop: 8, backgroundColor: colors.primaryLight,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  rolText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  card: {
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 14, color: colors.textMuted },
  infoValue: { fontSize: 14, fontWeight: '500', color: colors.text },
  logoutButton: {
    height: 52, backgroundColor: '#fee2e2', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#fca5a5',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
});