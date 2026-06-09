import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme/colors';

const MENU_ITEMS = [
  { emoji: '🗺️', label: 'Parcelas', screen: 'Parcels' },
  { emoji: '🌱', label: 'Cultivos', screen: 'Crops' },
  { emoji: '📋', label: 'Actividades', screen: 'Activities' },
  { emoji: '📊', label: 'Predicciones', screen: 'Predictions' },
  { emoji: '💡', label: 'Recomendaciones', screen: 'Recommendations' },
  { emoji: '🌤️', label: 'Clima', screen: 'Weather' },
  { emoji: '🔔', label: 'Alertas', screen: 'Alerts' },
  { emoji: '💬', label: 'Chat IA', screen: 'Chat' },
  { emoji: '👤', label: 'Perfil', screen: 'Profile' },
  { emoji: '⚙️', label: 'Configuración', screen: 'Settings' },
];

export default function HomeScreen({ navigation }: any) {
  const { usuario } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {usuario?.nombre}! 👋</Text>
        <Text style={styles.subtitle}>¿En qué te puedo ayudar hoy?</Text>
      </View>

      <View style={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', backgroundColor: colors.card, borderRadius: 16,
    padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  emoji: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
});