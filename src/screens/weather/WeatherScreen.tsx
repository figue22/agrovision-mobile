import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelasService, Parcela } from '@/src/services/parcelas.service';
import { weatherService } from '@/src/services/weather.service';
import { colors } from '@/src/theme/colors';

export default function WeatherScreen() {
  const queryClient = useQueryClient();
  const [selectedParcelaId, setSelectedParcelaId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: parcelas } = useQuery<Parcela[]>({
    queryKey: ['parcelas'],
    queryFn: parcelasService.getMyParcelas,
  });

  const { data: ultimo, isLoading: loadingUltimo, refetch: refetchUltimo } = useQuery({
    queryKey: ['clima-ultimo', selectedParcelaId],
    queryFn: () => selectedParcelaId ? weatherService.getUltimo(selectedParcelaId) : null,
    enabled: !!selectedParcelaId,
  });

  const { data: forecast, isLoading: loadingForecast, refetch: refetchForecast } = useQuery({
    queryKey: ['forecast', selectedParcelaId],
    queryFn: () => selectedParcelaId ? weatherService.getForecast(selectedParcelaId) : [],
    enabled: !!selectedParcelaId,
  });

  const { data: promedios, refetch: refetchPromedios } = useQuery({
    queryKey: ['promedios-clima', selectedParcelaId],
    queryFn: () => selectedParcelaId ? weatherService.getPromedios(selectedParcelaId) : null,
    enabled: !!selectedParcelaId,
  });

  const fetchCurrentMutation = useMutation({
    mutationFn: () => weatherService.fetchCurrent(selectedParcelaId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clima-ultimo', selectedParcelaId] });
      queryClient.invalidateQueries({ queryKey: ['promedios-clima', selectedParcelaId] });
      Alert.alert('✅ Clima actualizado correctamente');
    },
    onError: () => Alert.alert('Error', 'No se pudo actualizar el clima'),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchUltimo(), refetchForecast(), refetchPromedios()]);
    setRefreshing(false);
  };

  const formatFecha = (fecha: string) => {
    const [y, m, d] = fecha.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Selector parcela */}
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
          <Text style={styles.emptyEmoji}>🌤</Text>
          <Text style={styles.emptyText}>Selecciona una parcela para ver el clima</Text>
        </View>
      )}

      {(loadingUltimo || loadingForecast) && selectedParcelaId && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      )}

      {/* Clima actual */}
      {selectedParcelaId && (
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => fetchCurrentMutation.mutate()}
          disabled={fetchCurrentMutation.isPending}
        >
          {fetchCurrentMutation.isPending
            ? <ActivityIndicator color={colors.white} size="small" />
            : <Text style={styles.updateButtonText}>🔄 Actualizar clima actual</Text>
          }
        </TouchableOpacity>
      )}

      {ultimo && (
        <View style={styles.climaCard}>
          <Text style={styles.climaTitle}>🌡 Condiciones actuales</Text>
          <Text style={styles.climaFecha}>{formatFecha(ultimo.fecha)}</Text>
          {ultimo.fuente && (
            <Text style={styles.fuenteText}>Fuente: {ultimo.fuente}</Text>
          )}

          <View style={styles.climaGrid}>
            {ultimo.temp_promedio != null && (
              <ClimaItem emoji="🌡" value={`${Number(ultimo.temp_promedio).toFixed(1)}°C`} label="Temperatura" />
            )}
            {ultimo.temp_maxima != null && (
              <ClimaItem emoji="🔺" value={`${Number(ultimo.temp_maxima).toFixed(1)}°C`} label="Máxima" />
            )}
            {ultimo.temp_minima != null && (
              <ClimaItem emoji="🔻" value={`${Number(ultimo.temp_minima).toFixed(1)}°C`} label="Mínima" />
            )}
            {ultimo.precipitacion_mm != null && (
              <ClimaItem emoji="🌧" value={`${Number(ultimo.precipitacion_mm).toFixed(1)} mm`} label="Precipitación" />
            )}
            {ultimo.humedad_pct != null && (
              <ClimaItem emoji="💧" value={`${Number(ultimo.humedad_pct).toFixed(0)}%`} label="Humedad" />
            )}
            {ultimo.velocidad_viento != null && (
              <ClimaItem emoji="💨" value={`${Number(ultimo.velocidad_viento).toFixed(1)} km/h`} label="Viento" />
            )}
            {ultimo.indice_uv != null && (
              <ClimaItem emoji="☀️" value={`${Number(ultimo.indice_uv).toFixed(1)}`} label="Índice UV" />
            )}
            {ultimo.cobertura_nubes_pct != null && (
              <ClimaItem emoji="☁️" value={`${Number(ultimo.cobertura_nubes_pct).toFixed(0)}%`} label="Nubes" />
            )}
            {ultimo.presion_atm != null && (
              <ClimaItem emoji="🌀" value={`${Number(ultimo.presion_atm).toFixed(0)} hPa`} label="Presión" />
            )}
            {ultimo.datos_crudos?.prob_lluvia_pct != null && (
              <ClimaItem emoji="🌂" value={`${ultimo.datos_crudos.prob_lluvia_pct}%`} label="Prob. lluvia" />
            )}
          </View>
        </View>
      )}

      {/* Promedios */}
      {promedios && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📊 Promedios últimos 30 días</Text>
          <View style={styles.climaGrid}>
            {promedios.temp_promedio != null && (
              <ClimaItem emoji="🌡" value={`${Number(promedios.temp_promedio).toFixed(1)}°C`} label="Temp. prom." />
            )}
            {promedios.precipitacion_total != null && (
              <ClimaItem emoji="🌧" value={`${Number(promedios.precipitacion_total).toFixed(1)} mm`} label="Precip. total" />
            )}
            {promedios.humedad_promedio != null && (
              <ClimaItem emoji="💧" value={`${Number(promedios.humedad_promedio).toFixed(0)}%`} label="Humedad prom." />
            )}
            {promedios.dias_registrados != null && (
              <ClimaItem emoji="📅" value={`${promedios.dias_registrados}`} label="Días regist." />
            )}
          </View>
        </View>
      )}

      {/* Pronóstico */}
      {forecast && forecast.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📅 Pronóstico</Text>
          {forecast
            .filter((f) => f.fuente === 'openweathermap_forecast' || f.fuente === 'forecast')
            .slice(0, 7)
            .map((f, i) => (
              <View key={i} style={[styles.forecastRow, i === 0 && { borderTopWidth: 0 }]}>
                <Text style={styles.forecastFecha}>
                  {new Date(f.fecha.split('T')[0] + 'T12:00:00').toLocaleDateString('es-CO', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })}
                </Text>
                <View style={styles.forecastData}>
                  {f.temp_maxima != null && (
                    <Text style={styles.forecastItem}>🔺{Number(f.temp_maxima).toFixed(0)}°</Text>
                  )}
                  {f.temp_minima != null && (
                    <Text style={styles.forecastItem}>🔻{Number(f.temp_minima).toFixed(0)}°</Text>
                  )}
                  {f.precipitacion_mm != null && (
                    <Text style={styles.forecastItem}>🌧{Number(f.precipitacion_mm).toFixed(0)}mm</Text>
                  )}
                  {f.humedad_pct != null && (
                    <Text style={styles.forecastItem}>💧{Number(f.humedad_pct).toFixed(0)}%</Text>
                  )}
                  {f.datos_crudos?.prob_lluvia_pct != null && (
                    <Text style={styles.forecastItem}>🌂{f.datos_crudos.prob_lluvia_pct}%</Text>
                  )}
                </View>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

function ClimaItem({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.climaItem}>
      <Text style={styles.climaEmoji}>{emoji}</Text>
      <Text style={styles.climaValue}>{value}</Text>
      <Text style={styles.climaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  chipScroll: { marginBottom: 4 },
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
  updateButton: {
    height: 48, backgroundColor: colors.secondary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  updateButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  climaCard: {
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#86efac', gap: 8,
  },
  climaTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  climaFecha: { fontSize: 12, color: colors.textMuted },
  fuenteText: { fontSize: 10, color: colors.textMuted },
  climaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  climaItem: { width: '28%', alignItems: 'center', gap: 2 },
  climaEmoji: { fontSize: 22 },
  climaValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  climaLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  forecastRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  forecastFecha: { fontSize: 13, color: colors.text, width: 90 },
  forecastData: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 },
  forecastItem: { fontSize: 12, color: colors.text },
});