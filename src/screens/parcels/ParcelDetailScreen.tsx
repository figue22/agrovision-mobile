import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelasService } from '@/src/services/parcelas.service';
import { colors } from '@/src/theme/colors';
import ParcelMap from '@/src/components/maps/ParcelMap';
import { toDecimalInput } from '@/src/utils/formatters';

const TIPO_SUELO_LABEL: Record<string, string> = {
  arcilloso: 'Arcilloso', arenoso: 'Arenoso', limoso: 'Limoso',
  franco: 'Franco', mixto: 'Mixto',
};

const ESTADO_CULTIVO = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'activo', label: 'Activo' },
];

const ESTADO_COLOR: Record<string, { bg: string; text: string }> = {
  planificado: { bg: '#eff6ff', text: '#1d4ed8' },
  activo: { bg: '#f0fdf4', text: '#15803d' },
  cosechado: { bg: '#fffbeb', text: '#d97706' },
  fallido: { bg: '#fef2f2', text: '#dc2626' },
  abandonado: { bg: '#f1f5f9', text: '#64748b' },
};

export default function ParcelDetailScreen({ route, navigation }: any) {
  const { parcela: parcelaParam } = route.params;
  const queryClient = useQueryClient();

  const { data: cultivos, isLoading: loadingCultivos } = useQuery({
    queryKey: ['cultivos-parcela', parcelaParam.parcela_id],
    queryFn: () => parcelasService.getCultivosByParcela(parcelaParam.parcela_id),
  });

  const parcela = parcelaParam;

  const { data: tiposCultivo } = useQuery({
    queryKey: ['tipos-cultivo'],
    queryFn: parcelasService.getTiposCultivo,
  });

  // ── Estados formulario cultivo ──
  const [showCultivoForm, setShowCultivoForm] = useState(false);
  const [tipoCultivoId, setTipoCultivoId] = useState<string | null>(null);
  const [fechaSiembra, setFechaSiembra] = useState(new Date().toISOString().split('T')[0]);
  const [fechaCosechaEsperada, setFechaCosechaEsperada] = useState('');
  const [areaSembradaHa, setAreaSembradaHa] = useState('');
  const [rendimientoEsperado, setRendimientoEsperado] = useState('');
  const [estadoCultivo, setEstadoCultivo] = useState('planificado');
  const [temporada, setTemporada] = useState('');
  const [notas, setNotas] = useState('');

  // ── Estados formulario edición parcela ──
  const [showEditForm, setShowEditForm] = useState(false);
  const [editNombre, setEditNombre] = useState(parcela.nombre);
  const [editArea, setEditArea] = useState(parcela.area_hectareas?.toString() || '');
  const [editTipoSuelo, setEditTipoSuelo] = useState((parcela as any).tipo_suelo || '');
  const [editPh, setEditPh] = useState((parcela as any).ph_suelo?.toString() || '');
  const [editAltitud, setEditAltitud] = useState((parcela as any).altitud_msnm?.toString() || '');

  // ── Mutations ──
  const cultivoMutation = useMutation({
    mutationFn: (data: any) => parcelasService.createCultivo(parcela.parcela_id, data),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cultivos-parcela', parcela.parcela_id] });
        queryClient.invalidateQueries({ queryKey: ['parcelas'] });
        queryClient.refetchQueries({ queryKey: ['cultivos-parcela', parcela.parcela_id] });
        setShowCultivoForm(false);
        resetCultivoForm();
        Alert.alert('✅ Cultivo registrado correctamente');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al registrar cultivo';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => parcelasService.update(parcela.parcela_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      setShowEditForm(false);
      Alert.alert('✅ Parcela actualizada correctamente');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al actualizar';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => parcelasService.delete(parcela.parcela_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'No se pudo eliminar la parcela'),
  });

  const resetCultivoForm = () => {
    setTipoCultivoId(null);
    setFechaSiembra(new Date().toISOString().split('T')[0]);
    setFechaCosechaEsperada('');
    setAreaSembradaHa('');
    setRendimientoEsperado('');
    setEstadoCultivo('planificado');
    setTemporada('');
    setNotas('');
  };

  const handleAddCultivo = () => {
    if (!tipoCultivoId) { Alert.alert('Error', 'Selecciona un tipo de cultivo'); return; }
    if (!fechaSiembra) { Alert.alert('Error', 'La fecha de siembra es requerida'); return; }
    cultivoMutation.mutate({
      tipo_cultivo_id: tipoCultivoId,
      fecha_siembra: fechaSiembra,
      fecha_cosecha_esperada: fechaCosechaEsperada || undefined,
      area_sembrada_ha: areaSembradaHa && !isNaN(Number(areaSembradaHa)) ? Number(areaSembradaHa) : undefined,
      rendimiento_esperado_ton: rendimientoEsperado && !isNaN(Number(rendimientoEsperado)) ? Number(rendimientoEsperado) : undefined,
      estado: estadoCultivo || undefined,
      temporada: temporada || undefined,
      notas: notas || undefined,
    });
  };

  const handleUpdateParcela = () => {
    if (!editNombre.trim()) { Alert.alert('Error', 'El nombre es requerido'); return; }
    const clean: any = {};
    if (editNombre.trim()) clean.nombre = editNombre.trim();
    if (editArea && !isNaN(Number(editArea))) clean.area_hectareas = Number(editArea);
    if (editTipoSuelo) clean.tipo_suelo = editTipoSuelo;
    if (editPh && !isNaN(Number(editPh))) clean.ph_suelo = Number(editPh);
    if (editAltitud && !isNaN(Number(editAltitud))) clean.altitud_msnm = Number(editAltitud);
    updateMutation.mutate(clean);
  };

  const handleDeleteParcela = () => {
    Alert.alert(
      'Eliminar parcela',
      `¿Estás seguro de eliminar "${parcela.nombre}"? Se eliminarán también sus cultivos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Info parcela */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{parcela.nombre}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📐 Área</Text>
          <Text style={styles.infoValue}>{parcela.area_hectareas} hectáreas</Text>
        </View>

        {parcela.ubicacion?.latitud && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🌍 Coordenadas</Text>
            <Text style={styles.infoValue}>
              {parcela.ubicacion.latitud?.toFixed(4)}, {parcela.ubicacion.longitud?.toFixed(4)}
            </Text>
          </View>
        )}

        {(parcela as any).tipo_suelo && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🪨 Tipo suelo</Text>
            <Text style={styles.infoValue}>
              {TIPO_SUELO_LABEL[(parcela as any).tipo_suelo] || (parcela as any).tipo_suelo}
            </Text>
          </View>
        )}

        {(parcela as any).ph_suelo && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>💧 pH suelo</Text>
            <Text style={styles.infoValue}>{(parcela as any).ph_suelo}</Text>
          </View>
        )}

        {(parcela as any).altitud_msnm && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>⛰️ Altitud</Text>
            <Text style={styles.infoValue}>{(parcela as any).altitud_msnm} msnm</Text>
          </View>
        )}

        {parcela.ubicacion?.latitud && parcela.ubicacion?.longitud && (
          <ParcelMap
            latitud={parcela.ubicacion.latitud}
            longitud={parcela.ubicacion.longitud}
            nombre={parcela.nombre}
          />
        )}

        {/* Botones editar / eliminar */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowEditForm(!showEditForm)}
          >
            <Text style={styles.editButtonText}>
              {showEditForm ? '✕ Cancelar' : '✏️ Editar parcela'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteParcela}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? <ActivityIndicator color={colors.error} size="small" />
              : <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* Formulario edición parcela */}
      {showEditForm && (
        <View style={styles.card}>
          <Text style={styles.formTitle}>Editar parcela</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={editNombre} onChangeText={setEditNombre} />

          <Text style={styles.label}>Área (ha)</Text>
          <TextInput
            style={styles.input} value={editArea}
            onChangeText={(v) => setEditArea(toDecimalInput(v))}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Tipo de suelo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <TouchableOpacity
              style={[styles.chip, editTipoSuelo === '' && styles.chipSelected]}
              onPress={() => setEditTipoSuelo('')}
            >
              <Text style={[styles.chipText, editTipoSuelo === '' && styles.chipTextSelected]}>
                Sin especificar
              </Text>
            </TouchableOpacity>
            {Object.entries(TIPO_SUELO_LABEL).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.chip, editTipoSuelo === value && styles.chipSelected]}
                onPress={() => setEditTipoSuelo(value)}
              >
                <Text style={[styles.chipText, editTipoSuelo === value && styles.chipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>pH suelo</Text>
                <Text style={styles.optional}>(opc)</Text>
              </View>
              <TextInput
                style={styles.input} value={editPh}
                onChangeText={(v) => setEditPh(toDecimalInput(v))}
                keyboardType="decimal-pad" placeholder="6.5"
              />
            </View>
            <View style={styles.halfInput}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Altitud msnm</Text>
                <Text style={styles.optional}>(opc)</Text>
              </View>
              <TextInput
                style={styles.input} value={editAltitud}
                onChangeText={setEditAltitud}
                keyboardType="number-pad" placeholder="1520"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, updateMutation.isPending && { opacity: 0.6 }]}
            onPress={handleUpdateParcela}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.saveButtonText}>💾 Guardar cambios</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Header cultivos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Cultivos asociados</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCultivoForm(!showCultivoForm)}
        >
          <Text style={styles.addButtonText}>
            {showCultivoForm ? '✕ Cancelar' : '+ Nuevo cultivo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Formulario cultivo */}
      {showCultivoForm && (
        <View style={styles.card}>
          <Text style={styles.formTitle}>Registrar cultivo</Text>

          <Text style={styles.label}>Tipo de cultivo *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {tiposCultivo?.map((t) => (
              <TouchableOpacity
                key={t.tipo_cultivo_id}
                style={[styles.chip, tipoCultivoId === t.tipo_cultivo_id && styles.chipSelected]}
                onPress={() => setTipoCultivoId(t.tipo_cultivo_id)}
              >
                <Text style={[styles.chipText, tipoCultivoId === t.tipo_cultivo_id && styles.chipTextSelected]}>
                  {t.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fecha de siembra *</Text>
              <TextInput
                style={styles.input} value={fechaSiembra}
                onChangeText={setFechaSiembra} placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfInput}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Cosecha esp.</Text>
                <Text style={styles.optional}>(opc)</Text>
              </View>
              <TextInput
                style={styles.input} value={fechaCosechaEsperada}
                onChangeText={setFechaCosechaEsperada} placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Área (ha)</Text>
                <Text style={styles.optional}>(opc)</Text>
              </View>
              <TextInput
                style={styles.input} value={areaSembradaHa}
                onChangeText={(v) => setAreaSembradaHa(toDecimalInput(v))}
                placeholder="2.5" keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Rend. esp. (ton)</Text>
                <Text style={styles.optional}>(opc)</Text>
              </View>
              <TextInput
                style={styles.input} value={rendimientoEsperado}
                onChangeText={(v) => setRendimientoEsperado(toDecimalInput(v))}
                placeholder="4.0" keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Estado</Text>
          <View style={styles.row}>
            {ESTADO_CULTIVO.map((e) => (
              <TouchableOpacity
                key={e.value}
                style={[styles.chip, estadoCultivo === e.value && styles.chipSelected]}
                onPress={() => setEstadoCultivo(e.value)}
              >
                <Text style={[styles.chipText, estadoCultivo === e.value && styles.chipTextSelected]}>
                  {e.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.label}>Temporada</Text>
            <Text style={styles.optional}>(opcional)</Text>
          </View>
          <TextInput
            style={styles.input} value={temporada}
            onChangeText={setTemporada} placeholder="2026-A"
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Notas</Text>
            <Text style={styles.optional}>(opcional)</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notas} onChangeText={setNotas}
            placeholder="Semilla certificada, observaciones..."
            multiline numberOfLines={3}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddCultivo}
            disabled={cultivoMutation.isPending}
          >
            {cultivoMutation.isPending
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.saveButtonText}>🌱 Registrar cultivo</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Lista cultivos */}
      {loadingCultivos ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      ) : cultivos && cultivos.length > 0 ? (
        cultivos.map((c: any) => {
          const estadoStyle = ESTADO_COLOR[c.estado] || ESTADO_COLOR.planificado;
          return (
            <View key={c.cultivo_parcela_id} style={styles.cultivoCard}>
              <View style={styles.cultivoHeader}>
                <Text style={styles.cultivoNombre}>🌱 {c.tipoCultivo?.nombre || 'Cultivo'}</Text>
                <View style={[styles.estadoBadge, { backgroundColor: estadoStyle.bg }]}>
                  <Text style={[styles.estadoText, { color: estadoStyle.text }]}>{c.estado}</Text>
                </View>
              </View>
              <Text style={styles.cultivoInfo}>
                Sembrado: {new Date(c.fecha_siembra).toLocaleDateString('es-CO')}
              </Text>
              {c.fecha_cosecha_esperada && (
                <Text style={styles.cultivoInfo}>
                  Cosecha esp.: {new Date(c.fecha_cosecha_esperada).toLocaleDateString('es-CO')}
                </Text>
              )}
              {c.area_sembrada_ha && (
                <Text style={styles.cultivoInfo}>Área: {c.area_sembrada_ha} ha</Text>
              )}
              {c.rendimiento_esperado_ton && (
                <Text style={styles.cultivoInfo}>Rend. esp.: {c.rendimiento_esperado_ton} ton</Text>
              )}
              {c.temporada && (
                <Text style={styles.cultivoInfo}>Temporada: {c.temporada}</Text>
              )}
              {c.notas && (
                <Text style={styles.cultivoNotas}>📝 {c.notas}</Text>
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Sin cultivos asociados aún</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoLabel: { fontSize: 13, color: colors.textMuted, flex: 1 },
  infoValue: { fontSize: 13, color: colors.text, flex: 2, textAlign: 'right' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editButton: {
    flex: 1, height: 40, borderWidth: 1, borderColor: colors.primary,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  editButtonText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  deleteButton: {
    flex: 1, height: 40, borderWidth: 1, borderColor: '#fca5a5',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: { fontSize: 13, color: colors.error },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  addButton: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  addButtonText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  optional: { fontSize: 11, color: colors.textMuted },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, fontSize: 15,
    backgroundColor: colors.background,
  },
  textArea: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  chipScroll: { marginVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  saveButton: {
    height: 48, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  saveButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  cultivoCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  cultivoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cultivoNombre: { fontSize: 14, fontWeight: '600', color: colors.text },
  cultivoInfo: { fontSize: 12, color: colors.textMuted },
  cultivoNotas: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  estadoText: { fontSize: 11, fontWeight: '600' },
  emptyCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  emptyText: { fontSize: 13, color: colors.textMuted },
});