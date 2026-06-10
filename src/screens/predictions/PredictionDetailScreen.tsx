import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { predictionsService } from '@/src/services/predictions.service';
import { colors } from '@/src/theme/colors';

const RIESGO_COLOR: Record<string, { bg: string; text: string }> = {
  bajo: { bg: '#f0fdf4', text: '#15803d' },
  medio: { bg: '#fffbeb', text: '#d97706' },
  alto: { bg: '#fff7ed', text: '#c2410c' },
  critico: { bg: '#fef2f2', text: '#dc2626' },
};

const PRIORIDAD_COLOR: Record<string, { bg: string; text: string }> = {
  alta: { bg: '#fef2f2', text: '#dc2626' },
  media: { bg: '#fffbeb', text: '#d97706' },
  baja: { bg: '#f0fdf4', text: '#15803d' },
};

export default function PredictionDetailScreen({ route }: any) {
  const { prediccion } = route.params;
  const riesgoStyle = RIESGO_COLOR[prediccion.nivel_riesgo] || RIESGO_COLOR.bajo;

  const { data: recomendaciones, isLoading } = useQuery({
    queryKey: ['recomendaciones-pred', prediccion.prediccion_id],
    queryFn: () => predictionsService.getRecomendacionesByParcela(prediccion.parcela_id),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Resumen predicción */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            🌱 {prediccion.tipoCultivo?.nombre || 'Cultivo'}
          </Text>
          <View style={[styles.badge, { backgroundColor: riesgoStyle.bg }]}>
            <Text style={[styles.badgeText, { color: riesgoStyle.text }]}>
              Riesgo {prediccion.nivel_riesgo}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>
          {new Date(prediccion.fecha_prediccion).toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </Text>

        {/* Rendimiento */}
        <View style={styles.rendContainer}>
          <Text style={styles.rendLabel}>Rendimiento estimado</Text>
          <Text style={styles.rendValue}>{prediccion.rendimiento_predicho_ton} ton/ha</Text>
          {prediccion.intervalo_conf_inferior && prediccion.intervalo_conf_superior && (
            <Text style={styles.intervalo}>
              Intervalo de confianza: {prediccion.intervalo_conf_inferior} - {prediccion.intervalo_conf_superior} ton/ha
            </Text>
          )}
        </View>

        {/* Métricas */}
        <View style={styles.metricsRow}>
          {prediccion.puntaje_confianza && (
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Confianza</Text>
              <Text style={styles.metricValue}>{prediccion.puntaje_confianza}%</Text>
            </View>
          )}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Modelo</Text>
            <Text style={styles.metricValue}>{prediccion.tipo_modelo}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Versión</Text>
            <Text style={styles.metricValue}>{prediccion.version_modelo}</Text>
          </View>
        </View>
      </View>

      {/* Recomendaciones */}
      <Text style={styles.sectionTitle}>Recomendaciones</Text>

      {isLoading && <ActivityIndicator color={colors.primary} />}

      {recomendaciones && recomendaciones.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay recomendaciones disponibles</Text>
        </View>
      )}

      {recomendaciones?.map((r) => {
        const prioridadStyle = PRIORIDAD_COLOR[r.prioridad] || PRIORIDAD_COLOR.baja;
        return (
          <View key={r.recomendacion_id} style={styles.recomCard}>
            <View style={styles.recomHeader}>
              <Text style={styles.recomTipo}>
                {r.tipo_recomendacion === 'fertilizacion' ? '🌿' :
                  r.tipo_recomendacion === 'riego' ? '💧' :
                    r.tipo_recomendacion === 'control_plagas' ? '🐛' : '💡'}
                {' '}{r.tipo_recomendacion?.replace('_', ' ')}
              </Text>
              <View style={[styles.badge, { backgroundColor: prioridadStyle.bg }]}>
                <Text style={[styles.badgeText, { color: prioridadStyle.text }]}>
                  {r.prioridad}
                </Text>
              </View>
            </View>
            <Text style={styles.recomTitulo}>{r.titulo}</Text>
            <Text style={styles.recomDesc}>{r.descripcion}</Text>
            {r.estado && (
              <Text style={styles.recomEstado}>Estado: {r.estado}</Text>
            )}
          </View>
        );
      })}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  dateText: { fontSize: 12, color: colors.textMuted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  rendContainer: { alignItems: 'center', paddingVertical: 8 },
  rendLabel: { fontSize: 13, color: colors.textMuted },
  rendValue: { fontSize: 32, fontWeight: '800', color: colors.primary, marginTop: 4 },
  intervalo: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metricItem: { alignItems: 'center' },
  metricLabel: { fontSize: 11, color: colors.textMuted },
  metricValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase',
  },
  emptyCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  emptyText: { fontSize: 13, color: colors.textMuted },
  recomCard: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  recomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recomTipo: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  recomTitulo: { fontSize: 14, fontWeight: '600', color: colors.text },
  recomDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  recomEstado: { fontSize: 11, color: colors.secondary },
});