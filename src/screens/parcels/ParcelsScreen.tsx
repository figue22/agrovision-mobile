import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelasService, Parcela } from '@/src/services/parcelas.service';
import { colors } from '@/src/theme/colors';

const TIPO_SUELO_LABEL: Record<string, string> = {
  arcilloso: 'Arcilloso', arenoso: 'Arenoso', limoso: 'Limoso',
  franco: 'Franco', mixto: 'Mixto',
};

export default function ParcelsScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: parcelas, isLoading } = useQuery({
    queryKey: ['parcelas'],
    queryFn: parcelasService.getMyParcelas,
  });

  const syncMutation = useMutation({
    mutationFn: parcelasService.syncOffline,
    onSuccess: (result) => {
      if (result.synced > 0) {
        Alert.alert('✅ Sincronizado', `${result.synced} registros sincronizados`);
        queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      }
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await syncMutation.mutateAsync();
    await queryClient.invalidateQueries({ queryKey: ['parcelas'] });
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={parcelas}
        keyExtractor={(item) => item.parcela_id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyText}>No tienes parcelas registradas</Text>
            <Text style={styles.emptySubtext}>Toca el botón + para agregar una</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ParcelDetail', { parcela: item })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.nombre}</Text>
              {(item as any)._offline && (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineBadgeText}>Pendiente sync</Text>
                </View>
              )}
            </View>

            <Text style={styles.cardSubtitle}>
              📐 {item.area_hectareas} ha
            </Text>

            {item.ubicacion?.latitud && (
              <Text style={styles.cardSubtitle}>
                🌍 {item.ubicacion.latitud?.toFixed(4)}, {item.ubicacion.longitud?.toFixed(4)}
              </Text>
            )}

            {(item as any).tipo_suelo && (
              <Text style={styles.cardSubtitle}>
                🪨 {TIPO_SUELO_LABEL[(item as any).tipo_suelo] || (item as any).tipo_suelo}
                {(item as any).ph_suelo ? ` · pH ${(item as any).ph_suelo}` : ''}
              </Text>
            )}

            {(item as any).altitud_msnm && (
              <Text style={styles.cardSubtitle}>
                ⛰️ {(item as any).altitud_msnm} msnm
              </Text>
            )}

            {item.cultivos && item.cultivos.length > 0 && (
              <Text style={styles.cardCultivos}>
                🌱 {item.cultivos.length} cultivo{item.cultivos.length > 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateParcel')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 80 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.textMuted },
  cardCultivos: { fontSize: 13, color: colors.primary, marginTop: 4 },
  offlineBadge: {
    backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  offlineBadgeText: { fontSize: 10, color: '#d97706', fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: colors.white, lineHeight: 32 },
});