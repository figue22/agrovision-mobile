import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/auth.store';
import { farmersService } from '@/src/services/farmers.service';
import { colors } from '@/src/theme/colors';
import { toDecimalInput } from '@/src/utils/formatters';

export default function ProfileScreen() {
  const { usuario, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editDireccion, setEditDireccion] = useState('');
  const [editMunicipio, setEditMunicipio] = useState('');
  const [editDepartamento, setEditDepartamento] = useState('');
  const [editTamano, setEditTamano] = useState('');

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: farmersService.getMyProfile,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => farmersService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setEditing(false);
      Alert.alert('✅ Perfil actualizado correctamente');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al actualizar';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const openEdit = () => {
    if (!perfil) return;
    setEditDireccion(perfil.direccion || '');
    setEditMunicipio(perfil.municipio);
    setEditDepartamento(perfil.departamento);
    setEditTamano(perfil.tamano_finca_ha?.toString() || '');
    setEditing(true);
  };

  const handleUpdate = () => {
    const clean: any = {};
    if (editDireccion) clean.direccion = editDireccion;
    if (editMunicipio) clean.municipio = editMunicipio;
    if (editDepartamento) clean.departamento = editDepartamento;
    if (editTamano && !isNaN(Number(editTamano))) clean.tamano_finca_ha = Number(editTamano);
    updateMutation.mutate(clean);
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          <Text style={styles.rolText}>AGRICULTOR</Text>
        </View>
      </View>

      {/* Información de cuenta */}
      <Text style={styles.sectionTitle}>Información de cuenta</Text>
      <View style={styles.card}>
        <InfoRow label="Correo" value={usuario?.correo || ''} />
        <InfoRow label="Nombre" value={`${usuario?.nombre} ${usuario?.apellido}`} />
        <InfoRow label="Rol" value="Agricultor" last />
      </View>

      {/* Datos de agricultor */}
      {perfil && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Datos de agricultor</Text>
            {!editing && (
              <TouchableOpacity style={styles.editButton} onPress={openEdit}>
                <Text style={styles.editButtonText}>✏️ Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <View style={styles.card}>
              <Text style={styles.label}>Cédula</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#f1f5f9', color: colors.textMuted }]}
                value={perfil.cedula}
                editable={false}
              />
              <Text style={styles.hint}>La cédula no se puede cambiar</Text>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Dirección</Text>
                <Text style={styles.optional}>(opcional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={editDireccion}
                onChangeText={setEditDireccion}
                placeholder="Vereda La Esperanza, Km 5"
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Municipio</Text>
                  <TextInput
                    style={styles.input}
                    value={editMunicipio}
                    onChangeText={setEditMunicipio}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Departamento</Text>
                  <TextInput
                    style={styles.input}
                    value={editDepartamento}
                    onChangeText={setEditDepartamento}
                  />
                </View>
              </View>

              <View style={styles.labelRow}>
                <Text style={styles.label}>Tamaño finca (ha)</Text>
                <Text style={styles.optional}>(opcional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={editTamano}
                onChangeText={(v) => setEditTamano(toDecimalInput(v))}
                keyboardType="decimal-pad"
                placeholder="0.0"
              />

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, updateMutation.isPending && { opacity: 0.6 }]}
                  onPress={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={styles.saveButtonText}>Guardar</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <InfoRow label="👤 Cédula" value={perfil.cedula} />
              {perfil.direccion && <InfoRow label="📍 Dirección" value={perfil.direccion} />}
              <InfoRow label="📍 Ubicación" value={`${perfil.municipio}, ${perfil.departamento}`} />
              {perfil.tamano_finca_ha && (
                <InfoRow label="🌾 Finca" value={`${perfil.tamano_finca_ha} ha`} />
              )}
              <InfoRow
                label="📅 Registrado"
                value={new Date(perfil.creado_en).toLocaleDateString('es-CO', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
                last
              />
            </View>
          )}
        </>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', marginTop: 8,
  },
  editButton: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  editButtonText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  card: {
    backgroundColor: colors.card, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.text, textAlign: 'right', flex: 1, marginLeft: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text, paddingHorizontal: 16, paddingTop: 12 },
  optional: { fontSize: 11, color: colors.textMuted },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, fontSize: 14,
    backgroundColor: colors.background, marginHorizontal: 16, marginTop: 6,
  },
  hint: { fontSize: 11, color: colors.textMuted, paddingHorizontal: 16, marginTop: 2, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  halfInput: { flex: 1 },
  cancelButton: {
    flex: 1, height: 48, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, marginTop: 8,
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  saveButton: {
    flex: 1, height: 48, backgroundColor: colors.primary,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, marginTop: 8,
  },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  logoutButton: {
    height: 52, backgroundColor: '#fee2e2', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#fca5a5', marginTop: 16,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
});