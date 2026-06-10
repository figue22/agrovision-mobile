import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsService, Alerta } from '@/src/services/alerts.service';
import { notificationsService } from '@/src/services/notifications.service';
import { colors } from '@/src/theme/colors';

const SEVERIDAD_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  critica: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  alta: { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  media: { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
  baja: { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
};

const SEVERIDAD_EMOJI: Record<string, string> = {
  critica: '🚨', alta: '⚠️', media: '🔔', baja: 'ℹ️',
};

export default function AlertsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('no_leidas');

  useEffect(() => {
    notificationsService.registerForPushNotifications();
  }, []);

  const { data: alertas, isLoading, refetch } = useQuery({
    queryKey: ['alertas', filtro],
    queryFn: filtro === 'no_leidas' ? alertsService.getUnread : alertsService.getMyAlerts,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['alertas-count'],
    queryFn: alertsService.getUnreadCount,
    refetchInterval: 60000,
  });

  const markReadMutation = useMutation({
    mutationFn: alertsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: alertsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-count'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header con contador y marcar todas */}
      <View style={styles.header}>
        <View style={styles.filtros}>
          <TouchableOpacity
            style={[styles.chip, filtro === 'no_leidas' && styles.chipSelected]}
            onPress={() => setFiltro('no_leidas')}
          >
            <Text style={[styles.chipText, filtro === 'no_leidas' && styles.chipTextSelected]}>
              Sin leer {unreadCount ? `(${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, filtro === 'todas' && styles.chipSelected]}
            onPress={() => setFiltro('todas')}
          >
            <Text style={[styles.chipText, filtro === 'todas' && styles.chipTextSelected]}>
              Todas
            </Text>
          </TouchableOpacity>
        </View>
        {(unreadCount || 0) > 0 && (
          <TouchableOpacity
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Text style={styles.markAllText}>Marcar todas ✓</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alertas}
          keyExtractor={(item) => item.alerta_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>
                {filtro === 'no_leidas' ? '¡Sin alertas pendientes!' : 'No hay alertas'}
              </Text>
            </View>
          }
          renderItem={({ item: alerta }) => {
            const sevStyle = SEVERIDAD_COLOR[alerta.severidad] || SEVERIDAD_COLOR.baja;
            const emoji = SEVERIDAD_EMOJI[alerta.severidad] || '🔔';
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  { borderColor: sevStyle.border, backgroundColor: alerta.esta_leida ? colors.card : sevStyle.bg },
                ]}
                onPress={() => {
                  if (!alerta.esta_leida) {
                    markReadMutation.mutate(alerta.alerta_id);
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.emoji}>{emoji}</Text>
                    <View>
                      <Text style={styles.cardTitle}>{alerta.titulo}</Text>
                      {alerta.parcela && (
                        <Text style={styles.cardParcela}>📍 {alerta.parcela.nombre}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.rightCol}>
                    <View style={[styles.badge, { backgroundColor: sevStyle.bg, borderWidth: 1, borderColor: sevStyle.border }]}>
                      <Text style={[styles.badgeText, { color: sevStyle.text }]}>{alerta.severidad}</Text>
                    </View>
                    {!alerta.esta_leida && <View style={styles.unreadDot} />}
                  </View>
                </View>

                <Text style={styles.cardMensaje}>{alerta.mensaje}</Text>

                {alerta.accion_requerida && (
                  <View style={styles.accionContainer}>
                    <Text style={styles.accionLabel}>📋 Acción requerida:</Text>
                    <Text style={styles.accionText}>{alerta.accion_requerida}</Text>
                  </View>
                )}

                <Text style={styles.cardFecha}>
                  {new Date(alerta.creado_en).toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                  {alerta.esta_leida ? ' · Leída' : ' · Toca para marcar como leída'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  filtros: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  markAllText: { fontSize: 13, color: colors.secondary },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  card: {
    borderRadius: 16, padding: 16, borderWidth: 1.5, gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleRow: { flexDirection: 'row', gap: 10, flex: 1 },
  emoji: { fontSize: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  cardParcela: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  cardMensaje: { fontSize: 13, color: colors.text, lineHeight: 18 },
  accionContainer: {
    backgroundColor: '#fffbeb', borderRadius: 8, padding: 10, gap: 2,
  },
  accionLabel: { fontSize: 11, fontWeight: '600', color: '#d97706' },
  accionText: { fontSize: 12, color: colors.text },
  cardFecha: { fontSize: 11, color: colors.textMuted },
});