import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { api } from '@/src/services/api.service';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme/colors';
import { toDecimalInput } from '@/src/utils/formatters';

interface Step1Data {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  contrasena: string;
  confirmarContrasena: string;
}

interface Step2Data {
  cedula: string;
  municipio: string;
  departamento: string;
  direccion: string;
  tamano_finca_ha: string;
}

export default function RegisterScreen({ navigation }: any) {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  // Step 1
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');

  // Step 2
  const [cedula, setCedula] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [tamanoFinca, setTamanoFinca] = useState('');

  const validateStep1 = (): boolean => {
    if (nombre.trim().length < 2) {
      Alert.alert('Error', 'El nombre debe tener mínimo 2 caracteres'); return false;
    }
    if (apellido.trim().length < 2) {
      Alert.alert('Error', 'El apellido debe tener mínimo 2 caracteres'); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      Alert.alert('Error', 'Correo electrónico inválido'); return false;
    }
    if (contrasena.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener mínimo 8 caracteres'); return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(contrasena)) {
      Alert.alert('Error', 'La contraseña debe tener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&#)');
      return false;
    }
    if (contrasena !== confirmarContrasena) {
      Alert.alert('Error', 'Las contraseñas no coinciden'); return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (cedula.trim().length < 5) {
      Alert.alert('Error', 'Cédula inválida'); return false;
    }
    if (municipio.trim().length < 2) {
      Alert.alert('Error', 'Municipio obligatorio'); return false;
    }
    if (departamento.trim().length < 2) {
      Alert.alert('Error', 'Departamento obligatorio'); return false;
    }
    return true;
  };

  const handleStep1 = () => {
    if (!validateStep1()) return;
    setStep1Data({ nombre, apellido, correo, telefono, contrasena, confirmarContrasena });
    setStep(2);
  };

  const handleRegister = async () => {
    if (!validateStep2() || !step1Data) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        correo: step1Data.correo.trim().toLowerCase(),
        contrasena: step1Data.contrasena,
        nombre: step1Data.nombre.trim(),
        apellido: step1Data.apellido.trim(),
        telefono: step1Data.telefono || undefined,
        agricultor: {
          cedula: cedula.trim(),
          municipio: municipio.trim(),
          departamento: departamento.trim(),
          direccion: direccion.trim() || undefined,
          tamano_finca_ha: tamanoFinca && !isNaN(Number(tamanoFinca))
            ? Number(tamanoFinca) : undefined,
        },
      });

      await setAuth(
        response.data.usuario,
        response.data.access_token,
        response.data.refresh_token,
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al registrarse. Intenta de nuevo.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🌱</Text>
          </View>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Regístrate como agricultor en AgroVision</Text>
        </View>

        {/* Progress */}
        <View style={styles.progress}>
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, step >= 1 && styles.progressCircleActive]}>
              <Text style={[styles.progressNumber, step >= 1 && styles.progressNumberActive]}>1</Text>
            </View>
            <Text style={styles.progressLabel}>Datos personales</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressCircle, step >= 2 && styles.progressCircleActive]}>
              <Text style={[styles.progressNumber, step >= 2 && styles.progressNumberActive]}>2</Text>
            </View>
            <Text style={styles.progressLabel}>Datos de finca</Text>
          </View>
        </View>

        {/* Step 1 */}
        {step === 1 && (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Juan Manuel"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Figueroa"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Text style={styles.label}>Correo electrónico *</Text>
            <TextInput
              style={styles.input}
              value={correo}
              onChangeText={setCorreo}
              placeholder="juan@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Teléfono</Text>
              <Text style={styles.optional}>(opcional)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="+573001234567"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Contraseña *</Text>
            <TextInput
              style={styles.input}
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
            />
            <Text style={styles.hint}>
              Debe tener: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&#)
            </Text>

            <Text style={styles.label}>Confirmar contraseña *</Text>
            <TextInput
              style={styles.input}
              value={confirmarContrasena}
              onChangeText={setConfirmarContrasena}
              placeholder="Repite tu contraseña"
              secureTextEntry
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleStep1}>
              <Text style={styles.primaryButtonText}>Siguiente →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.label}>Cédula de ciudadanía *</Text>
            <TextInput
              style={styles.input}
              value={cedula}
              onChangeText={setCedula}
              placeholder="1053845678"
              keyboardType="number-pad"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Municipio *</Text>
                <TextInput
                  style={styles.input}
                  value={municipio}
                  onChangeText={setMunicipio}
                  placeholder="Manizales"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Departamento *</Text>
                <TextInput
                  style={styles.input}
                  value={departamento}
                  onChangeText={setDepartamento}
                  placeholder="Caldas"
                />
              </View>
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Dirección</Text>
              <Text style={styles.optional}>(opcional)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Vereda La Esperanza, Km 5"
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Tamaño de finca (hectáreas)</Text>
              <Text style={styles.optional}>(opcional)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={tamanoFinca}
              onChangeText={(v) => setTamanoFinca(toDecimalInput(v))}
              placeholder="3.5"
              keyboardType="decimal-pad"
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryButtonText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }, loading && { opacity: 0.6 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.white} />
                  : <Text style={styles.primaryButtonText}>Crear cuenta</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 28 },
  logoContainer: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center',
    justifyContent: 'center', marginBottom: 14,
  },
  logoText: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  progress: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 24,
  },
  progressStep: { alignItems: 'center', gap: 4 },
  progressCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  progressCircleActive: { backgroundColor: colors.primary },
  progressNumber: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  progressNumberActive: { color: colors.white },
  progressLabel: { fontSize: 11, color: colors.textMuted },
  progressLine: { flex: 1, height: 1, backgroundColor: colors.border, marginBottom: 14 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  optional: { fontSize: 11, color: colors.textMuted },
  input: {
    height: 46, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, fontSize: 15,
    backgroundColor: colors.background,
  },
  hint: { fontSize: 11, color: colors.textMuted, lineHeight: 16, marginTop: -6 },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  primaryButton: {
    height: 50, backgroundColor: colors.primary, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    height: 50, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontSize: 13, color: colors.primary },
});