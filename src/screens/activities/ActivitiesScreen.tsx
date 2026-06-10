import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  activitiesService, catalogsService,
  ActividadResponse, CreateActividadRequest, InsumoActividad,
} from '@/src/services/activities.service';
import { parcelasService, Parcela } from '@/src/services/parcelas.service';
import { colors } from '@/src/theme/colors';
import { toDecimalInput } from '@/src/utils/formatters';

const TIPO_EMOJI: Record<string, string> = {
  siembra: '🌱', fertilizacion: '🧪', riego: '💧',
  fumigacion: '🪣', cosecha: '🌾', poda: '✂️', otro: '📋',
};

export default function ActivitiesScreen() {
  const queryClient = useQueryClient();
  const [selectedParcelaId, setSelectedParcelaId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  // Campos del formulario
  const [tipoActividadId, setTipoActividadId] = useState<number | null>(null);
  const [cultivoParcelaId, setCultivoParcelaId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('');
  const [costoCop, setCostoCop] = useState('');
  const [fechaRealizacion, setFechaRealizacion] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [notas, setNotas] = useState('');
  const [insumos, setInsumos] = useState<Partial<InsumoActividad>[]>([]);

  const { data: parcelas } = useQuery<Parcela[]>({
    queryKey: ['parcelas'],
    queryFn: parcelasService.getMyParcelas,
  });

  const { data: tiposActividad } = useQuery({
    queryKey: ['tipos-actividad'],
    queryFn: catalogsService.getTiposActividad,
  });

  const { data: tiposInsumo } = useQuery({
    queryKey: ['tipos-insumo'],
    queryFn: catalogsService.getTiposInsumo,
  });

  const { data: cultivosParcela } = useQuery({
    queryKey: ['cultivos-parcela', selectedParcelaId],
    queryFn: () => parcelasService.getCultivosByParcela(selectedParcelaId!),
    enabled: !!selectedParcelaId,
  });

  const { data: actividades, isLoading, refetch } = useQuery({
    queryKey: ['actividades', selectedParcelaId],
    queryFn: () => activitiesService.getByParcela(selectedParcelaId!),
    enabled: !!selectedParcelaId,
  });

  const { data: resumen } = useQuery({
    queryKey: ['actividades-resumen', selectedParcelaId],
    queryFn: () => activitiesService.getResumen(selectedParcelaId!),
    enabled: !!selectedParcelaId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateActividadRequest) => activitiesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades', selectedParcelaId] });
      queryClient.invalidateQueries({ queryKey: ['actividades-resumen', selectedParcelaId] });
      resetForm();
      setShowForm(false);
      Alert.alert('✅ Actividad registrada correctamente');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al registrar actividad';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => activitiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades', selectedParcelaId] });
      queryClient.invalidateQueries({ queryKey: ['actividades-resumen', selectedParcelaId] });
      resetForm();
      setShowForm(false);
      setEditingId(null);
      Alert.alert('✅ Actividad actualizada correctamente');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al actualizar';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => activitiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades', selectedParcelaId] });
      queryClient.invalidateQueries({ queryKey: ['actividades-resumen', selectedParcelaId] });
    },
    onError: () => Alert.alert('Error', 'No se pudo eliminar la actividad'),
  });

  const resetForm = () => {
    setTipoActividadId(null);
    setCultivoParcelaId('');
    setDescripcion('');
    setCantidad('');
    setUnidad('');
    setCostoCop('');
    setFechaRealizacion(new Date().toISOString().split('T')[0]);
    setNotas('');
    setInsumos([]);
    setEditingId(null);
  };

  const openEdit = (a: ActividadResponse) => {
    setEditingId(a.actividad_id);
    setTipoActividadId(a.tipo_actividad_id);
    setCultivoParcelaId(a.cultivo_parcela_id || '');
    setDescripcion(a.descripcion || '');
    setCantidad(a.cantidad?.toString() || '');
    setUnidad(a.unidad || '');
    setCostoCop(a.costo_cop?.toString() || '');
    setFechaRealizacion(a.fecha_realizacion.split('T')[0]);
    setNotas(a.notas || '');
    setInsumos(a.insumos?.map((ins) => ({
      nombre_insumo: ins.nombre_insumo,
      tipo_insumo_id: ins.tipo_insumo_id,
      cantidad: ins.cantidad,
      unidad: ins.unidad,
      costo_unitario_cop: ins.costo_unitario_cop,
      marca: ins.marca,
    })) || []);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!tipoActividadId) { Alert.alert('Error', 'Selecciona un tipo de actividad'); return; }
    if (!fechaRealizacion) { Alert.alert('Error', 'La fecha es requerida'); return; }
    if (!selectedParcelaId) return;

    const payload: CreateActividadRequest = {
      parcela_id: selectedParcelaId,
      cultivo_parcela_id: cultivoParcelaId || undefined,
      tipo_actividad_id: tipoActividadId,
      descripcion: descripcion || undefined,
      cantidad: cantidad && !isNaN(Number(cantidad)) ? Number(cantidad) : undefined,
      unidad: unidad || undefined,
      costo_cop: costoCop && !isNaN(Number(costoCop)) ? Number(costoCop) : undefined,
      fecha_realizacion: fechaRealizacion,
      notas: notas || undefined,
      insumos: insumos.length > 0 ? insumos.map((ins) => ({
        nombre_insumo: ins.nombre_insumo!,
        tipo_insumo_id: ins.tipo_insumo_id!,
        cantidad: ins.cantidad!,
        unidad: ins.unidad!,
        costo_unitario_cop: ins.costo_unitario_cop,
        marca: ins.marca,
      })) : undefined,
    };

    if (editingId) {
      const { parcela_id: _, ...updatePayload } = payload;
      updateMutation.mutate({ id: editingId, data: updatePayload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar actividad', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const addInsumo = () => {
    setInsumos([...insumos, {
      nombre_insumo: '',
      tipo_insumo_id: tiposInsumo?.[0]?.id || 1,
      cantidad: 1,
      unidad: 'kg',
    }]);
  };

  const updateInsumo = (idx: number, field: string, value: any) => {
    const updated = [...insumos];
    updated[idx] = { ...updated[idx], [field]: value };
    setInsumos(updated);
  };

  const removeInsumo = (idx: number) => {
    setInsumos(insumos.filter((_, i) => i !== idx));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filtrar actividades
  const actividadesFiltradas = actividades?.filter((a) => {
    if (filtroTipo && a.tipoActividad?.nombre?.toLowerCase() !== filtroTipo.toLowerCase()) return false;
    if (filtroDesde && new Date(a.fecha_realizacion.split('T')[0]) < new Date(filtroDesde)) return false;
    if (filtroHasta && new Date(a.fecha_realizacion.split('T')[0]) > new Date(filtroHasta)) return false;
    return true;
  }) || [];

  return (
    <FlatList
      data={actividadesFiltradas}
      keyExtractor={(item) => item.actividad_id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          {/* Selector parcela */}
          <Text style={styles.sectionLabel}>Selecciona una parcela</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {parcelas?.map((p) => (
              <TouchableOpacity
                key={p.parcela_id}
                style={[styles.chip, selectedParcelaId === p.parcela_id && styles.chipSelected]}
                onPress={() => { setSelectedParcelaId(p.parcela_id); setShowForm(false); resetForm(); }}
              >
                <Text style={[styles.chipText, selectedParcelaId === p.parcela_id && styles.chipTextSelected]}>
                  {p.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!selectedParcelaId && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Selecciona una parcela para ver su bitácora</Text>
            </View>
          )}

          {/* Resumen */}
          {resumen && (
            <View style={styles.resumenRow}>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenValue}>{resumen.total_actividades}</Text>
                <Text style={styles.resumenLabel}>Actividades</Text>
              </View>
              <View style={styles.resumenItem}>
                <Text style={styles.resumenValue}>
                  ${Number(resumen.costo_total_cop || 0).toLocaleString('es-CO')}
                </Text>
                <Text style={styles.resumenLabel}>Costo total</Text>
              </View>
            </View>
          )}

          {/* Botón nueva actividad */}
          {selectedParcelaId && !showForm && (
            <TouchableOpacity style={styles.newButton} onPress={() => { setShowForm(true); resetForm(); }}>
              <Text style={styles.newButtonText}>+ Nueva actividad</Text>
            </TouchableOpacity>
          )}

          {/* Formulario */}
          {showForm && (
            <View style={styles.card}>
              <Text style={styles.formTitle}>{editingId ? 'Editar actividad' : 'Registrar actividad'}</Text>

              {/* Tipo actividad */}
              <Text style={styles.label}>Tipo de actividad *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {tiposActividad?.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, tipoActividadId === t.id && styles.chipSelected]}
                    onPress={() => setTipoActividadId(t.id)}
                  >
                    <Text style={[styles.chipText, tipoActividadId === t.id && styles.chipTextSelected]}>
                      {TIPO_EMOJI[t.codigo] || '📋'} {t.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Fecha */}
              <Text style={styles.label}>Fecha de realización *</Text>
              <TextInput
                style={styles.input}
                value={fechaRealizacion}
                onChangeText={setFechaRealizacion}
                placeholder="YYYY-MM-DD"
              />

              {/* Cultivo */}
              <View style={styles.labelRow}>
                <Text style={styles.label}>Cultivo asociado</Text>
                <Text style={styles.optional}>(opcional)</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity
                  style={[styles.chip, cultivoParcelaId === '' && styles.chipSelected]}
                  onPress={() => setCultivoParcelaId('')}
                >
                  <Text style={[styles.chipText, cultivoParcelaId === '' && styles.chipTextSelected]}>
                    Sin cultivo
                  </Text>
                </TouchableOpacity>
                {cultivosParcela?.map((c) => (
                  <TouchableOpacity
                    key={c.cultivo_parcela_id}
                    style={[styles.chip, cultivoParcelaId === c.cultivo_parcela_id && styles.chipSelected]}
                    onPress={() => setCultivoParcelaId(c.cultivo_parcela_id)}
                  >
                    <Text style={[styles.chipText, cultivoParcelaId === c.cultivo_parcela_id && styles.chipTextSelected]}>
                      {c.tipoCultivo?.nombre || 'Cultivo'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Descripción */}
              <View style={styles.labelRow}>
                <Text style={styles.label}>Descripción</Text>
                <Text style={styles.optional}>(opcional)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Ej: Fertilización foliar con urea al 2%"
              />

              {/* Cantidad, Unidad, Costo */}
              <View style={styles.row}>
                <View style={styles.thirdInput}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Cantidad</Text>
                    <Text style={styles.optional}>(opc)</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={cantidad}
                    onChangeText={(v) => setCantidad(toDecimalInput(v))}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.thirdInput}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Unidad</Text>
                    <Text style={styles.optional}>(opc)</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={unidad}
                    onChangeText={setUnidad}
                    placeholder="kg, L, m²"
                  />
                </View>
                <View style={styles.thirdInput}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Costo COP</Text>
                    <Text style={styles.optional}>(opc)</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={costoCop}
                    onChangeText={(v) => setCostoCop(toDecimalInput(v))}
                    placeholder="0"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Notas */}
              <View style={styles.labelRow}>
                <Text style={styles.label}>Notas</Text>
                <Text style={styles.optional}>(opcional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notas}
                onChangeText={setNotas}
                placeholder="Observaciones adicionales..."
                multiline
                numberOfLines={3}
              />

              {/* Insumos */}
              <View style={styles.insumosHeader}>
                <Text style={styles.label}>Insumos utilizados</Text>
                <TouchableOpacity style={styles.addInsumoBtn} onPress={addInsumo}>
                  <Text style={styles.addInsumoBtnText}>+ Agregar insumo</Text>
                </TouchableOpacity>
              </View>

              {insumos.map((ins, idx) => (
                <View key={idx} style={styles.insumoCard}>
                  <View style={styles.row}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.label}>Nombre insumo</Text>
                      <TextInput
                        style={styles.input}
                        value={ins.nombre_insumo}
                        onChangeText={(v) => updateInsumo(idx, 'nombre_insumo', v)}
                        placeholder="Urea, fungicida..."
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Cantidad</Text>
                      <TextInput
                        style={styles.input}
                        value={ins.cantidad?.toString() || ''}
                        onChangeText={(v) => updateInsumo(idx, 'cantidad', toDecimalInput(v))}
                        keyboardType="decimal-pad"
                        placeholder="1"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Unidad</Text>
                      <TextInput
                        style={styles.input}
                        value={ins.unidad}
                        onChangeText={(v) => updateInsumo(idx, 'unidad', v)}
                        placeholder="kg, L"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Marca</Text>
                        <Text style={styles.optional}>(opc)</Text>
                      </View>
                      <TextInput
                        style={styles.input}
                        value={ins.marca || ''}
                        onChangeText={(v) => updateInsumo(idx, 'marca', v)}
                        placeholder="Marca"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.labelRow}>
                        <Text style={styles.label}>Costo/u COP</Text>
                        <Text style={styles.optional}>(opc)</Text>
                      </View>
                      <TextInput
                        style={styles.input}
                        value={ins.costo_unitario_cop?.toString() || ''}
                        onChangeText={(v) => updateInsumo(idx, 'costo_unitario_cop', toDecimalInput(v))}
                        keyboardType="number-pad"
                        placeholder="0"
                      />
                    </View>
                  </View>

                  {/* Tipo insumo */}
                  <Text style={styles.label}>Tipo de insumo</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tiposInsumo?.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.chip, ins.tipo_insumo_id === t.id && styles.chipSelected]}
                        onPress={() => updateInsumo(idx, 'tipo_insumo_id', t.id)}
                      >
                        <Text style={[styles.chipText, ins.tipo_insumo_id === t.id && styles.chipTextSelected]}>
                          {t.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity style={styles.removeInsumoBtn} onPress={() => removeInsumo(idx)}>
                    <Text style={styles.removeInsumoBtnText}>🗑️ Eliminar insumo</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Botones */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => { setShowForm(false); resetForm(); }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, (createMutation.isPending || updateMutation.isPending) && { opacity: 0.6 }]}
                  onPress={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending)
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={styles.saveButtonText}>{editingId ? 'Actualizar' : 'Registrar'}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Filtros */}
          {selectedParcelaId && actividades && actividades.length > 0 && (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.filtrosHeader}
                onPress={() => setShowFiltros(!showFiltros)}
              >
                <Text style={styles.label}>🔍 Filtros</Text>
                <Text style={styles.optional}>{showFiltros ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showFiltros && (
                <View style={styles.filtrosContent}>
                  <Text style={styles.label}>Tipo de actividad</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    <TouchableOpacity
                      style={[styles.chip, filtroTipo === '' && styles.chipSelected]}
                      onPress={() => setFiltroTipo('')}
                    >
                      <Text style={[styles.chipText, filtroTipo === '' && styles.chipTextSelected]}>Todos</Text>
                    </TouchableOpacity>
                    {tiposActividad?.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.chip, filtroTipo === t.nombre && styles.chipSelected]}
                        onPress={() => setFiltroTipo(t.nombre)}
                      >
                        <Text style={[styles.chipText, filtroTipo === t.nombre && styles.chipTextSelected]}>
                          {TIPO_EMOJI[t.codigo] || '📋'} {t.nombre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>Desde</Text>
                      <TextInput
                        style={styles.input}
                        value={filtroDesde}
                        onChangeText={setFiltroDesde}
                        placeholder="YYYY-MM-DD"
                      />
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>Hasta</Text>
                      <TextInput
                        style={styles.input}
                        value={filtroHasta}
                        onChangeText={setFiltroHasta}
                        placeholder="YYYY-MM-DD"
                      />
                    </View>
                  </View>

                  {(filtroTipo || filtroDesde || filtroHasta) && (
                    <TouchableOpacity
                      style={styles.clearFiltros}
                      onPress={() => { setFiltroTipo(''); setFiltroDesde(''); setFiltroHasta(''); }}
                    >
                      <Text style={styles.clearFiltrosText}>Limpiar filtros</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {selectedParcelaId && isLoading && (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          )}

          {selectedParcelaId && !isLoading && actividadesFiltradas.length === 0 && !showForm && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No hay actividades registradas</Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item: a }) => {
        const emoji = TIPO_EMOJI[a.tipoActividad?.nombre?.toLowerCase() || ''] || '📋';
        const expanded = expandedId === a.actividad_id;
        const fecha = new Date(a.fecha_realizacion.split('T')[0] + 'T12:00:00');
        console.log('Parcela:', selectedParcelaId, 'Actividades:', actividades?.length, 'Filtradas:', actividadesFiltradas.length);
        return (
          <TouchableOpacity
            style={styles.actividadCard}
            onPress={() => setExpandedId(expanded ? null : a.actividad_id)}
          >
            <View style={styles.actividadHeader}>
              <View style={styles.actividadLeft}>
                <Text style={styles.actividadEmoji}>{emoji}</Text>
                <View>
                  <Text style={styles.actividadTipo}>{a.tipoActividad?.nombre || 'Actividad'}</Text>
                  {a.cultivoParcela?.tipoCultivo?.nombre && (
                    <Text style={styles.actividadCultivo}>
                      🌱 {a.cultivoParcela.tipoCultivo.nombre}
                    </Text>
                  )}
                  <Text style={styles.actividadFecha}>
                    📅 {fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              </View>
              <View style={styles.actividadRight}>
                {a.costo_cop && (
                  <Text style={styles.actividadCosto}>
                    ${Number(a.costo_cop).toLocaleString('es-CO')}
                  </Text>
                )}
                <View style={styles.actividadActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={(e) => { e.stopPropagation?.(); openEdit(a); }}
                  >
                    <Text style={styles.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => { e.stopPropagation?.(); handleDelete(a.actividad_id); }}
                  >
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {a.descripcion && (
              <Text style={styles.actividadDesc}>{a.descripcion}</Text>
            )}

            {expanded && (
              <View style={styles.expandedContent}>
                {a.notas && (
                  <View style={styles.notasBox}>
                    <Text style={styles.notasLabel}>Notas</Text>
                    <Text style={styles.notasText}>{a.notas}</Text>
                  </View>
                )}
                {a.cantidad && a.unidad && (
                  <Text style={styles.expandedInfo}>
                    📦 {a.cantidad} {a.unidad}
                  </Text>
                )}
                {a.insumos && a.insumos.length > 0 && (
                  <View>
                    <Text style={styles.insumosTitle}>Insumos ({a.insumos.length})</Text>
                    {a.insumos.map((ins) => (
                      <View key={ins.insumo_actividad_id} style={styles.insumoRow}>
                        <Text style={styles.insumoNombre}>{ins.nombre_insumo}</Text>
                        <Text style={styles.insumoDetalle}>
                          {ins.cantidad} {ins.unidad}
                          {ins.marca ? ` · ${ins.marca}` : ''}
                          {ins.costo_unitario_cop ? ` · $${Number(ins.costo_unitario_cop).toLocaleString('es-CO')}/u` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={null}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  headerContainer: { gap: 12, marginBottom: 8 },
  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase',
  },
  chipScroll: { marginVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  resumenRow: {
    flexDirection: 'row', gap: 12,
  },
  resumenItem: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  resumenValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  resumenLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  newButton: {
    height: 48, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  newButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  formTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  optional: { fontSize: 11, color: colors.textMuted },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, fontSize: 14,
    backgroundColor: colors.background,
  },
  textArea: { height: 70, paddingTop: 10, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  thirdInput: { flex: 1 },
  insumosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addInsumoBtn: {
    backgroundColor: colors.primaryLight, paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 16,
  },
  addInsumoBtnText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  insumoCard: {
    backgroundColor: '#f8fafc', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.border, gap: 8,
  },
  removeInsumoBtn: {
    alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#fef2f2', borderRadius: 8,
  },
  removeInsumoBtnText: { fontSize: 12, color: colors.error },
  cancelButton: {
    flex: 1, height: 48, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  saveButton: {
    flex: 1, height: 48, backgroundColor: colors.primary,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  saveButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  filtrosHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  filtrosContent: { gap: 10, marginTop: 8 },
  clearFiltros: {
    height: 36, borderWidth: 1, borderColor: '#fca5a5',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  clearFiltrosText: { fontSize: 13, color: colors.error },
  actividadCard: {
    backgroundColor: colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  actividadHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  actividadLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  actividadEmoji: { fontSize: 24, marginTop: 2 },
  actividadTipo: { fontSize: 14, fontWeight: '600', color: colors.text },
  actividadCultivo: { fontSize: 11, color: colors.primary, marginTop: 1 },
  actividadFecha: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  actividadRight: { alignItems: 'flex-end', gap: 4 },
  actividadCosto: { fontSize: 13, fontWeight: '600', color: colors.primary },
  actividadActions: { flexDirection: 'row', gap: 4 },
  editBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnText: { fontSize: 14 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#fef2f2',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 14 },
  actividadDesc: { fontSize: 13, color: colors.textMuted },
  expandedContent: {
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 8,
  },
  notasBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 10 },
  notasLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  notasText: { fontSize: 13, color: colors.text, marginTop: 2 },
  expandedInfo: { fontSize: 13, color: colors.textMuted },
  insumosTitle: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 4 },
  insumoRow: {
    backgroundColor: colors.background, borderRadius: 8, padding: 8,
    marginBottom: 4,
  },
  insumoNombre: { fontSize: 13, fontWeight: '500', color: colors.text },
  insumoDetalle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});