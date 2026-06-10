import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { colors } from '@/src/theme/colors';

interface Props {
  latitud: number;
  longitud: number;
  nombre?: string;
}

export default function ParcelMap({ latitud, longitud, nombre }: Props) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: latitud,
          longitude: longitud,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude: latitud, longitude: longitud }}
          title={nombre || 'Mi parcela'}
          pinColor={colors.primary}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  map: { flex: 1 },
});