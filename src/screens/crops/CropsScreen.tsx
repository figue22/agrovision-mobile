import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/services/api.service';
import { parcelasService } from '@/src/services/parcelas.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme/colors';
import { toDecimalInput } from '@/src/utils/formatters';

export interface CultivoResponse {
  cultivo_parcela_id: string;
  parcela_id: string;
  tipo_cultivo_id: string;
  fecha_siembra: string;
  fecha_cosecha_esperada?: string;
  fecha_cosecha_real?: string;
  area_sembrada_ha?: number;
  rendimiento_esperado_ton?: number;
  rendimiento_real_ton?: number;
  estado: string;
  temporada?: string;
  notas?: string;
  tipoCultivo?: { tipo_cultivo_id: string; nombre: string; codigo: string };
  parcela?: { parcela_id: string; nombre: string };
}

const ESTADO_CULTIVO = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'activo', label: 'Activo' },
  { value: 'cosechado', label: 'Cosechado' },
  { value: 'fallido', label: 'Fallido' },
  { value: 'abandonado', label: 'Abandonado' },
];

const ESTADO_COLOR: Record<string, { bg: string; text: string }> = {
  planificado: { bg: '#eff6ff', text: '#1d4ed8' },
  activo: { bg: '#f0fdf4', text: '#15803d' },
  cosechado: { bg: '#fffbeb', text: '#d97706' },
  fallido: { bg: '#fef2f2', text: '#dc2626' },
  abandonado: { bg: '#f1f5f9', text: '#64748b' },
};

const cultivosService = {
  getMyCultivos: async (): Promise<CultivoResponse[]> => {
    try {
      const response = await api.get<CultivoResponse[]>('/crops/my');
      await AsyncStorage.setItem('cache_cultivos', JSON.stringify(response.data));
      return response.data;
    } catch {
      const cached = await AsyncStorage.getItem('cache_cultivos');
      return cached ? JSON.parse(cached) : [];
    }
  },

  update: async (id: string, data: Partial<CultivoResponse>): Promise<CultivoResponse> => {
      const response = await api.put<CultivoResponse>(`/crops/parcela/cultivo/${id}`, data);
      return response.data;
  },

  delete: async (id: string): Promise<void> => {
      await api.delete(`/crops/parcela/cultivo/${id}`);
  },
};

export default function CropsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Campos de edición
  const [editEstado, setEditEstado] = useState('');
  const [editFechaCosechaReal, setEditFechaCosechaReal] = useState('');
  const [editAreaSembrada, setEditAreaSembrada] = useState('');
  const [editRendEsperado, setEditRendEsperado] = useState('');
  const [editRendReal, setEditRendReal] = useState('');
  const [editTemporada, setEditTemporada] = useState('');
  const [editNotas, setEditNotas] = useState('');

  const { data: cultivos, isLoading } = useQuery({
    queryKey: ['mis-cultivos'],
    queryFn: cultivosService.getMyCultivos,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cultivosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-cultivos'] });
      setEditingId(null);
      Alert.alert('✅ Cultivo actualizado correctamente');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al actualizar cultivo';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cultivosService.delete(id),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['mis-cultivos'] });
        queryClient.invalidateQueries({ queryKey: ['parcelas'] });
        queryClient.invalidateQueries({ queryKey: ['cultivos-parcela'] });
        queryClient.refetchQueries({ queryKey: ['mis-cultivos'] });
        queryClient.refetchQueries({ queryKey: ['parcelas'] });
    },
});

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['mis-cultivos'] });
    setRefreshing(false);
  };

  const openEdit = (c: CultivoResponse) => {
    setEditingId(c.cultivo_parcela_id);
    setEditEstado(c.estado);
    setEditFechaCosechaReal(c.fecha_cosecha_real || '');
    setEditAreaSembrada(c.area_sembrada_ha?.toString() || '');
    setEditRendEsperado(c.rendimiento_esperado_ton?.toString() || '');
    setEditRendReal(c.rendimiento_real_ton?.toString() || '');
    setEditTemporada(c.temporada || '');
    setEditNotas(c.notas || '');
  };

  const handleUpdate = (id: string) => {
    const clean: any = {};
    if (editEstado) clean.estado = editEstado;
    if (editFechaCosechaReal) clean.fecha_cosecha_real = editFechaCosechaReal;
    if (editAreaSembrada && !isNaN(Number(editAreaSembrada)))
      clean.area_sembrada_ha = Number(editAreaSembrada);
    if (editRendEsperado && !isNaN(Number(editRendEsperado)))
      clean.rendimiento_esperado_ton = Number(editRendEsperado);
    if (editRendReal && !isNaN(Number(editRendReal)))
      clean.rendimiento_real_ton = Number(editRendReal);
    if (editTemporada) clean.temporada = editTemporada;
    if (editNotas !== undefined) clean.notas = editNotas;

    updateMutation.mutate({ id, data: clean });
  };

  const handleDelete = (id: string, nombre: string) => {
    Alert.alert(
      'Eliminar cultivo',
      `¿Estás seguro de eliminar el cultivo de ${nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={cultivos}
      keyExtractor={(item) => item.cultivo_parcela_id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>No tienes cultivos registrados</Text>
          <Text style={styles.emptySubtext}>Ve a una parcela para agregar cultivos</Text>
        </View>
      }
      renderItem={({ item: c }) => {
        const estadoStyle = ESTADO_COLOR[c.estado] || ESTADO_COLOR.planificado;
        const isEditing = editingId === c.cultivo_parcela_id;

        // Calcular días para cosecha
        let diasCosecha: number | null = null;
        if (c.fecha_cosecha_esperada) {
          const diff = new Date(c.fecha_cosecha_esperada).getTime() - new Date().getTime();
          diasCosecha = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        return (
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  🌱 {c.tipoCultivo?.nombre || 'Cultivo'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  📍 {c.parcela?.nombre || 'Parcela'}
                  {c.area_sembrada_ha ? ` · ${c.area_sembrada_ha} ha` : ''}
                </Text>
                <Text style={styles.cardSubtitle}>
                  Sembrado: {new Date(c.fecha_siembra).toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={[styles.estadoBadge, { backgroundColor: estadoStyle.bg }]}>
                <Text style={[styles.estadoText, { color: estadoStyle.text }]}>{c.estado}</Text>
              </View>
            </View>

            {/* Info adicional */}
            {diasCosecha !== null && diasCosecha > 0 && (
              <Text style={styles.diasCosecha}>
                📅 {diasCosecha} días para cosecha
              </Text>
            )}
            {c.rendimiento_real_ton && (
              <Text style={styles.rendReal}>
                ✅ Rendimiento real: {c.rendimiento_real_ton} ton
              </Text>
            )}
            {c.temporada && (
              <Text style={styles.infoExtra}>Temporada: {c.temporada}</Text>
            )}
            {c.notas && (
              <Text style={styles.notas}>📝 {c.notas}</Text>
            )}

            {/* Formulario edición */}
            {isEditing && (
              <View style={styles.editForm}>
                <Text style={styles.editTitle}>Editar cultivo</Text>

                {/* Estado */}
                <Text style={styles.label}>Estado</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {ESTADO_CULTIVO.map((e) => (
                    <TouchableOpacity
                      key={e.value}
                      style={[styles.chip, editEstado === e.value && styles.chipSelected]}
                      onPress={() => setEditEstado(e.value)}
                    >
                      <Text style={[styles.chipText, editEstado === e.value && styles.chipTextSelected]}>
                        {e.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Fechas */}
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Cosecha esperada</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editFechaCosechaReal}
                      onChangeText={setEditFechaCosechaReal}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Cosecha real</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={editFechaCosechaReal}
                      onChangeText={setEditFechaCosechaReal}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>

                {/* Rendimientos */}
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Área (ha)</Text>
                    <TextInput
                      style={styles.input}
                      value={editAreaSembrada}
                      onChangeText={(v) => setEditAreaSembrada(toDecimalInput(v))}
                      placeholder="2.5"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.label}>Rend. esperado (ton)</Text>
                    <TextInput
                      style={styles.input}
                      value={editRendEsperado}
                      onChangeText={(v) => setEditRendEsperado(toDecimalInput(v))}
                      placeholder="4.0"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.labelRow}>
                  <Text style={styles.label}>Rend. real (ton)</Text>
                  <Text style={styles.optional}>(opcional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={editRendReal}
                  onChangeText={(v) => setEditRendReal(toDecimalInput(v))}
                  placeholder="3.8"
                  keyboardType="decimal-pad"
                />

                <View style={styles.labelRow}>
                  <Text style={styles.label}>Temporada</Text>
                  <Text style={styles.optional}>(opcional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={editTemporada}
                  onChangeText={setEditTemporada}
                  placeholder="2026-A"
                />

                <View style={styles.labelRow}>
                  <Text style={styles.label}>Notas</Text>
                  <Text style={styles.optional}>(opcional)</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editNotas}
                  onChangeText={setEditNotas}
                  placeholder="Observaciones..."
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditingId(null)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => handleUpdate(c.cultivo_parcela_id)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending
                      ? <ActivityIndicator color={colors.white} size="small" />
                      : <Text style={styles.saveButtonText}>Guardar</Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Acciones */}
            {!isEditing && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEdit(c)}
                >
                  <Text style={styles.editButtonText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(c.cultivo_parcela_id, c.tipoCultivo?.nombre || 'cultivo')}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  estadoText: { fontSize: 11, fontWeight: '600' },
  diasCosecha: { fontSize: 12, color: colors.secondary },
  rendReal: { fontSize: 12, fontWeight: '600', color: colors.primary },
  infoExtra: { fontSize: 12, color: colors.textMuted },
  notas: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  editForm: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: 12, marginTop: 6, gap: 10,
  },
  editTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  optional: { fontSize: 11, color: colors.textMuted },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, fontSize: 15,
    backgroundColor: colors.background,
  },
  textArea: { height: 70, paddingTop: 10, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  chipScroll: { marginVertical: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editButton: {
    flex: 1, height: 36, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  editButtonText: { fontSize: 13, color: colors.text },
  deleteButton: {
    flex: 1, height: 36, borderWidth: 1, borderColor: '#fca5a5',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: { fontSize: 13, color: colors.error },
  cancelButton: {
    flex: 1, height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 14, color: colors.text },
  saveButton: {
    flex: 1, height: 44, backgroundColor: colors.primary,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
});