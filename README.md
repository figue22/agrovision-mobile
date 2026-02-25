# 📱 AgroVision Mobile - App para Agricultores

> Aplicación móvil con React Native y Expo para agricultores colombianos, con modo offline y sincronización automática.

## Descripción

App nativa para iOS y Android diseñada para pequeños agricultores. Permite registrar parcelas con GPS, gestionar cultivos y rotación agrícola, consultar predicciones de rendimiento con recomendaciones accionables, chatear con el asistente IA, recibir alertas climáticas, llevar una bitácora de actividades con insumos y costos. Funciona sin internet con sincronización automática al recuperar conexión.

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| React Native | 0.73.2 | Framework móvil nativo |
| Expo | 50.0.0 | Toolchain y SDK |
| TypeScript | 5.3.3 | Lenguaje tipado |
| React Navigation | 6.1.9 | Navegación entre pantallas |
| TanStack Query | 5.17.0 | Data fetching y cache |
| AsyncStorage | 1.21.0 | Persistencia local (offline) |
| Expo Location | 16.5.5 | Geolocalización GPS |
| Expo Notifications | 0.27.6 | Push notifications |
| Expo Camera | latest | Fotografía de cultivos |

## Estructura del Proyecto

```
src/
├── screens/                    # Pantallas de la aplicación
│   ├── auth/                   # Login, registro, onboarding
│   ├── home/                   # Dashboard principal del agricultor
│   ├── parcels/                # Lista, detalle, registro de parcelas
│   ├── crops/                  # Cultivos activos, historial de rotación, rendimiento
│   ├── predictions/            # Predicciones de rendimiento + recomendaciones
│   ├── weather/                # Dashboard meteorológico
│   ├── chat/                   # Chat con asistente IA (sesión WhatsApp)
│   ├── alerts/                 # Centro de alertas climáticas
│   ├── activities/             # Bitácora de actividades agrícolas con insumos
│   ├── profile/                # Perfil del agricultor
│   └── settings/               # Configuración y preferencias
├── components/
│   ├── common/                 # Botones, inputs, cards, modales
│   ├── maps/                   # Componentes de mapa (parcelas)
│   ├── charts/                 # Gráficos de rendimiento
│   └── forms/                  # Formularios reutilizables
├── navigation/                 # Stack, Tab y Drawer navigators
├── hooks/                      # Custom hooks (useOffline, useLocation, etc.)
├── services/                   # Clientes API con manejo offline
├── stores/                     # Estado global (Zustand)
├── offline/                    # AsyncStorage, NetInfo, sync queue
├── media/                      # Cámara, galería, captura de imágenes
├── i18n/                       # Internacionalización (español)
├── theme/                      # Tema visual de la app
├── types/                      # Tipos TypeScript
└── utils/                      # Helpers, formatters, validators
└── assets/
    ├── images/
    ├── fonts/
    └── icons/
```

## Pantallas Principales

| Pantalla | Descripción |
|---|---|
| **Home** | Dashboard con resumen de parcelas, cultivos activos, alertas, clima actual |
| **Parcelas** | Lista de parcelas con mapa, registro con captura GPS |
| **Detalle Parcela** | Info de cultivos activos, predicción, clima, actividades, recomendaciones |
| **Cultivos** | Gestión de cultivos por parcela, rotación agrícola, rendimiento esperado vs real |
| **Predicciones** | Estimaciones de rendimiento con intervalos de confianza y factores de riesgo |
| **Recomendaciones** | Acciones sugeridas por predicción, marcar como implementada, dar feedback y calificación |
| **Weather** | Dashboard meteorológico con datos actuales y pronóstico por parcela |
| **Chat** | Asistente IA para consultas agrícolas (conecta con RAG vía sesión WhatsApp) |
| **Alertas** | Notificaciones climáticas y recordatorios agrícolas multicanal |
| **Actividades** | Bitácora agrícola con insumos detallados (siembra, fertilización, riego, cosecha) |
| **Perfil** | Datos del agricultor (cédula, municipio, departamento, finca), parcelas registradas |
| **Settings** | Preferencias de notificaciones, modo offline, cuenta |

## Funcionalidades Clave

### Modo Offline
- Consulta de predicciones y recomendaciones descargadas previamente
- Registro de actividades agrícolas con insumos sin conexión
- Acceso a recomendaciones guardadas
- Sincronización automática al recuperar conexión (React Query)

### Geolocalización
- Captura automática de coordenadas GPS al registrar parcelas
- Visualización de parcelas en mapa interactivo
- Personalización de alertas por ubicación

### Notificaciones Push
- Alertas climáticas 24-48h antes del evento
- Recordatorios de fechas críticas (siembra, fertilización, cosecha)
- Notificaciones de nuevas predicciones y recomendaciones disponibles

### Cámara
- Fotografía de cultivos y plagas
- Adjuntar imágenes a la bitácora de actividades (JSONB adjuntos)

### Gestión de Cultivos
- Registrar nuevo cultivo en parcela (tipo, fecha siembra, área sembrada)
- Ver historial de rotación y policultivo
- Registrar rendimiento real al cosechar
- Comparar rendimiento esperado (ML) vs real

## Variables de Entorno

```env
# API Backend
EXPO_PUBLIC_API_URL=http://localhost:4000/api

# Mapas
EXPO_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Notificaciones
EXPO_PUBLIC_FCM_SENDER_ID=your-fcm-sender-id
```

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar Expo
npx expo start

# Ejecutar en dispositivo/emulador
npx expo start --android
npx expo start --ios

# Build de producción
eas build --platform android
eas build --platform ios

# Tests
npm run test
```

## Diseño UX/UI

La app está diseñada para usuarios con:
- Edad promedio 45-60 años
- Educación primaria o secundaria incompleta
- Familiaridad con WhatsApp pero limitada con apps complejas

**Principios de diseño:**
- Interfaz simple con iconos grandes y textos claros
- Navegación por tabs (máximo 5 opciones)
- Flujos cortos (máximo 3 pasos para cualquier acción)
- Feedback visual claro en cada acción
- Idioma: Español (Colombia)

## Contribución

1. Crear branch desde `develop`: `git checkout -b feature/nombre-feature`
2. Commits con convención: `feat:`, `fix:`, `docs:`, `refactor:`
3. Pull Request hacia `develop`

## Licencia

Proyecto privado - AgroVision © 2026
