import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { parcelasService } from '@/src/services/parcelas.service';
import { predictionsService, Prediccion } from '@/src/services/predictions.service';
import { colors } from '@/src/theme/colors';

const RIESGO_COLOR: Record<string, { bg: string; text: string }> = {
  bajo: { bg: '#f0fdf4', text: '#15803d' },
  medio: { bg: '#fffbeb', text: '#d97706' },
  alto: { bg: '#fff7ed', text: '#c2410c' },
  critico: { bg: '#fef2f2', text: '#dc2626' },
};

export default function PredictionsScreen({ navigation }: any) {
  const [selectedParcelaId, setSelectedParcelaId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas'],
    queryFn: parcelasService.getMyParcelas,
  });

  const { data: predicciones, isLoading, refetch } = useQuery({
    queryKey: ['predicciones', selectedParcelaId],
    queryFn: () => selectedParcelaId
      ? predictionsService.getByParcela(selectedParcelaId)
      : Promise.resolve([]),
    enabled: !!selectedParcelaId,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Selector de parcela */}
      <Text style={styles.sectionTitle}>Selecciona una parcela</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {parcelas?.map((p) => (
          <TouchableOpacity
            key={p.parcela_id}
            style={[styles.chip, selectedParcelaId === p.parcela_id && styles.chipSelected]}
            onPress={() => setSelectedParcelaId(p.parcela_id)}
          >
            <Text style={[styles.chipText, selectedParcelaId === p.parcela_id && styles.chipTextSelected]}>
              {p.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!selectedParcelaId && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>Selecciona una parcela para ver sus predicciones</Text>
        </View>
      )}

      {isLoading && selectedParcelaId && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      )}

      {predicciones && predicciones.length === 0 && selectedParcelaId && !isLoading && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>No hay predicciones para esta parcela</Text>
        </View>
      )}

      {predicciones?.map((pred) => {
        const riesgoStyle = RIESGO_COLOR[pred.nivel_riesgo] || RIESGO_COLOR.bajo;
        return (
          <TouchableOpacity
            key={pred.prediccion_id}
            style={styles.card}
            onPress={() => navigation.navigate('PredictionDetail', { prediccion: pred })}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  🌱 {pred.tipoCultivo?.nombre || 'Cultivo'}
                </Text>
                <Text style={styles.cardDate}>
                  {new Date(pred.fecha_prediccion).toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Text>
              </View>
              <View style={[styles.riesgoBadge, { backgroundColor: riesgoStyle.bg }]}>
                <Text style={[styles.riesgoText, { color: riesgoStyle.text }]}>
                  Riesgo {pred.nivel_riesgo}
                </Text>
              </View>
            </View>

            <View style={styles.rendRow}>
              <View style={styles.rendItem}>
                <Text style={styles.rendLabel}>Rendimiento estimado</Text>
                <Text style={styles.rendValue}>{pred.rendimiento_predicho_ton} ton/ha</Text>
              </View>
              {pred.puntaje_confianza && (
                <View style={styles.rendItem}>
                  <Text style={styles.rendLabel}>Confianza</Text>
                  <Text style={styles.rendValue}>{pred.puntaje_confianza}%</Text>
                </View>
              )}
            </View>

            {pred.intervalo_conf_inferior && pred.intervalo_conf_superior && (
              <Text style={styles.intervalo}>
                Intervalo: {pred.intervalo_conf_inferior} - {pred.intervalo_conf_superior} ton/ha
              </Text>
            )}

            <Text style={styles.verDetalle}>Ver detalle y recomendaciones →</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', marginBottom: 8,
  },
  chipScroll: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  riesgoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  riesgoText: { fontSize: 11, fontWeight: '600' },
  rendRow: { flexDirection: 'row', gap: 16 },
  rendItem: { flex: 1 },
  rendLabel: { fontSize: 11, color: colors.textMuted },
  rendValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  intervalo: { fontSize: 11, color: colors.textMuted },
  verDetalle: { fontSize: 12, color: colors.secondary, textAlign: 'right' },
});