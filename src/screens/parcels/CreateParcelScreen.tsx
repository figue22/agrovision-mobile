import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelasService } from '@/src/services/parcelas.service';
import { colors } from '@/src/theme/colors';
import ParcelMap from '@/src/components/maps/ParcelMap';
import { toDecimalInput } from '@/src/utils/formatters';

const TIPO_SUELO = [
  { value: 'arcilloso', label: 'Arcilloso' },
  { value: 'arenoso', label: 'Arenoso' },
  { value: 'limoso', label: 'Limoso' },
  { value: 'franco', label: 'Franco' },
  { value: 'mixto', label: 'Mixto' },
];

export default function CreateParcelScreen({ navigation }: any) {
  const queryClient = useQueryClient();

  // Campos requeridos
  const [nombre, setNombre] = useState('');
  const [area, setArea] = useState('');
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);

  // Campos opcionales
  const [tipoSuelo, setTipoSuelo] = useState('');
  const [phSuelo, setPhSuelo] = useState('');
  const [altitudMsnm, setAltitudMsnm] = useState('');
  const [limitesGeoJson, setLimitesGeoJson] = useState('');

  const [loadingGPS, setLoadingGPS] = useState(false);

  useEffect(() => {
    obtenerUbicacion();
  }, []);

  const createMutation = useMutation({
    mutationFn: parcelasService.create,
    onSuccess: (parcela) => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      Alert.alert(
        '✅ Parcela registrada',
        (parcela as any)._offline
          ? 'Guardada localmente. Se sincronizará cuando tengas internet.'
          : 'La parcela fue registrada exitosamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'No se pudo registrar la parcela';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const obtenerUbicacion = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos acceso a tu ubicación para registrar la parcela');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = parseFloat(location.coords.latitude.toFixed(6));
      const lon = parseFloat(location.coords.longitude.toFixed(6));
      setLatitud(lat);
      setLongitud(lon);

      if (location.coords.altitude) {
        setAltitudMsnm(Math.round(location.coords.altitude).toString());
      }
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación. Verifica que el GPS esté activado.');
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleCreate = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la parcela es requerido');
      return;
    }
    if (!area || isNaN(Number(area)) || Number(area) <= 0) {
      Alert.alert('Error', 'El área debe ser un número mayor a 0');
      return;
    }
    if (!latitud || !longitud) {
      Alert.alert('Error', 'La ubicación GPS es requerida. Toca "Capturar GPS"');
      return;
    }

    let limites_geojson = undefined;
    if (limitesGeoJson.trim()) {
      try {
        const parsed = JSON.parse(limitesGeoJson);
        if (parsed.type === 'Polygon' && parsed.coordinates) {
          limites_geojson = parsed;
        } else {
          Alert.alert('Error', 'El GeoJSON debe tener type: "Polygon" y coordinates');
          return;
        }
      } catch {
        Alert.alert('Error', 'El formato del GeoJSON no es válido. Debe ser JSON válido.');
        return;
      }
    }

    createMutation.mutate({
      nombre: nombre.trim(),
      area_hectareas: Number(area),
      ubicacion: { latitud, longitud },
      tipo_suelo: tipoSuelo || undefined,
      ph_suelo: phSuelo && !isNaN(Number(phSuelo)) ? Number(phSuelo) : undefined,
      altitud_msnm: altitudMsnm && !isNaN(Number(altitudMsnm)) ? Number(altitudMsnm) : undefined,
      limites_geojson,
    } as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Información básica */}
      <Text style={styles.sectionTitle}>Información básica</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Nombre de la parcela *</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Parcela San José"
        />

        <Text style={styles.label}>Área (hectáreas) *</Text>
        <TextInput
          style={styles.input}
          value={area}
          onChangeText={(v) => setArea(toDecimalInput(v))}
          placeholder="3.5"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Ubicación GPS */}
      <Text style={styles.sectionTitle}>Ubicación GPS *</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={obtenerUbicacion}
          disabled={loadingGPS}
        >
          {loadingGPS
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.gpsButtonText}>📍 Capturar GPS</Text>
          }
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Latitud *</Text>
            <TextInput
              style={styles.input}
              value={latitud?.toString() || ''}
              onChangeText={(v) => setLatitud(parseFloat(v) || null)}
              placeholder="5.0689"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Longitud *</Text>
            <TextInput
              style={styles.input}
              value={longitud?.toString() || ''}
              onChangeText={(v) => setLongitud(parseFloat(v) || null)}
              placeholder="-75.5174"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {latitud && longitud && (
          <View style={styles.coordsContainer}>
            <Text style={styles.coordsText}>✅ Coordenadas capturadas</Text>
            <Text style={styles.coordsValue}>
              {latitud.toFixed(6)}, {longitud.toFixed(6)}
            </Text>
          </View>
        )}

        {latitud && longitud && (
          <ParcelMap latitud={latitud} longitud={longitud} nombre={nombre || 'Mi parcela'} />
        )}
      </View>

      {/* Datos del suelo */}
      <Text style={styles.sectionTitle}>Datos del suelo</Text>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Tipo de suelo</Text>
          <Text style={styles.optional}>(opcional)</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, tipoSuelo === '' && styles.chipSelected]}
            onPress={() => setTipoSuelo('')}
          >
            <Text style={[styles.chipText, tipoSuelo === '' && styles.chipTextSelected]}>
              Sin especificar
            </Text>
          </TouchableOpacity>
          {TIPO_SUELO.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, tipoSuelo === t.value && styles.chipSelected]}
              onPress={() => setTipoSuelo(t.value)}
            >
              <Text style={[styles.chipText, tipoSuelo === t.value && styles.chipTextSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>pH del suelo</Text>
              <Text style={styles.optional}>(opc)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phSuelo}
              onChangeText={(v) => setPhSuelo(toDecimalInput(v))}
              placeholder="6.5"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Altitud msnm</Text>
              <Text style={styles.optional}>(opc)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={altitudMsnm}
              onChangeText={setAltitudMsnm}
              placeholder="1520"
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      {/* Límites GeoJSON */}
      <Text style={styles.sectionTitle}>Límites GeoJSON</Text>
      <View style={styles.card}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>GeoJSON Polygon</Text>
          <Text style={styles.optional}>(opcional)</Text>
        </View>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={limitesGeoJson}
          onChangeText={setLimitesGeoJson}
          placeholder={'{"type":"Polygon","coordinates":[[[-75.518,5.068],[-75.516,5.068],[-75.516,5.069],[-75.518,5.069],[-75.518,5.068]]]}'}
          multiline
          numberOfLines={4}
        />
        <Text style={styles.hint}>
          Pega un GeoJSON Polygon. Las coordenadas van en formato [longitud, latitud].
          El primer y último punto deben ser iguales.
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, createMutation.isPending && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.saveButtonText}>📍 Crear parcela</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', marginBottom: 4, marginTop: 12,
  },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  optional: { fontSize: 11, color: colors.textMuted },
  input: {
    height: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 12, fontSize: 15,
    backgroundColor: colors.background,
  },
  textArea: { height: 90, paddingTop: 10, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  gpsButton: {
    height: 48, backgroundColor: colors.secondary, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  gpsButtonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  coordsContainer: {
    backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12,
  },
  coordsText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  coordsValue: { fontSize: 12, color: colors.primaryDark, marginTop: 2 },
  chipScroll: { marginVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, marginRight: 8,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  hint: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  cancelButton: {
    flex: 1, height: 52, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
  saveButton: {
    flex: 1, height: 52, backgroundColor: colors.primary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});