import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { predictionsService } from '@/src/services/predictions.service';
import { parcelasService } from '@/src/services/parcelas.service';
import { colors } from '@/src/theme/colors';

const PRIORIDAD_COLOR: Record<string, { bg: string; text: string }> = {
  alta: { bg: '#fef2f2', text: '#dc2626' },
  media: { bg: '#fffbeb', text: '#d97706' },
  baja: { bg: '#f0fdf4', text: '#15803d' },
};

const TIPO_EMOJI: Record<string, string> = {
  fertilizacion: '🌿', riego: '💧', control_plagas: '🐛',
  cosecha: '🌾', siembra: '🌱', general: '💡',
};

export default function RecommendationsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParcelaId, setSelectedParcelaId] = useState<string | null>(null);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas'],
    queryFn: parcelasService.getMyParcelas,
  });

  const { data: recomendaciones, isLoading, refetch } = useQuery({
    queryKey: ['recomendaciones', selectedParcelaId],
    queryFn: () => selectedParcelaId
      ? predictionsService.getRecomendacionesByParcela(selectedParcelaId)
      : predictionsService.getRecomendacionesPendientes(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Selector parcela */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.chip, !selectedParcelaId && styles.chipSelected]}
          onPress={() => setSelectedParcelaId(null)}
        >
          <Text style={[styles.chipText, !selectedParcelaId && styles.chipTextSelected]}>
            Todas
          </Text>
        </TouchableOpacity>
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
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={recomendaciones}
          keyExtractor={(item) => item.recomendacion_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💡</Text>
              <Text style={styles.emptyText}>No hay recomendaciones disponibles</Text>
            </View>
          }
          renderItem={({ item: r }) => {
            const prioridadStyle = PRIORIDAD_COLOR[r.prioridad] || PRIORIDAD_COLOR.baja;
            const emoji = TIPO_EMOJI[r.tipo_recomendacion] || '💡';
            return (
              <View style={[styles.card, r.estado === 'implementada' && styles.cardDone]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTipo}>{emoji} {r.tipo_recomendacion?.replace('_', ' ')}</Text>
                  <View style={[styles.badge, { backgroundColor: prioridadStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: prioridadStyle.text }]}>
                      {r.prioridad}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardTitulo}>{r.titulo}</Text>
                <Text style={styles.cardDesc}>{r.descripcion}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFecha}>
                    {new Date(r.fecha_recomendacion).toLocaleDateString('es-CO')}
                  </Text>
                  <Text style={[styles.cardEstado,
                    r.estado === 'implementada' ? styles.estadoDone : styles.estadoPending]}>
                    {r.estado}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterContainer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  cardDone: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTipo: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardTitulo: { fontSize: 14, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFecha: { fontSize: 11, color: colors.textMuted },
  cardEstado: { fontSize: 11, fontWeight: '600' },
  estadoDone: { color: colors.primary },
  estadoPending: { color: colors.warning },
});