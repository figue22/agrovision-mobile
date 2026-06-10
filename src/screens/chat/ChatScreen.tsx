import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { chatService, ChatMessage } from '@/src/services/chat.service';
import { parcelasService, Parcela } from '@/src/services/parcelas.service';
import { useAuthStore } from '@/src/stores/auth.store';
import { colors } from '@/src/theme/colors';

const QUICK_QUESTIONS = [
  '¿Cuál es mi última predicción?',
  '¿Tengo alertas activas?',
  '¿Cómo está el clima hoy?',
  '¿Qué recomendaciones tengo?',
];

const TIPO_COLOR: Record<string, { bg: string; text: string }> = {
  saludo: { bg: '#f0fdf4', text: '#15803d' },
  prediccion: { bg: '#eff6ff', text: '#1d4ed8' },
  alerta: { bg: '#fef2f2', text: '#dc2626' },
  clima: { bg: '#f0f9ff', text: '#0369a1' },
  rag: { bg: '#faf5ff', text: '#7c3aed' },
  actividad: { bg: '#fffbeb', text: '#d97706' },
  recomendacion: { bg: '#fff7ed', text: '#c2410c' },
};

export default function ChatScreen() {
  const { usuario } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversacionId, setConversacionId] = useState<string | undefined>();
  const [selectedParcelaId, setSelectedParcelaId] = useState<string | null>(null);
  const [showFuentes, setShowFuentes] = useState<Record<number, boolean>>({});
  const flatListRef = useRef<FlatList>(null);

  const { data: parcelas } = useQuery<Parcela[]>({
    queryKey: ['parcelas'],
    queryFn: parcelasService.getMyParcelas,
  });

  const parcela = parcelas?.find((p) => p.parcela_id === selectedParcelaId);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (texto?: string) => {
    const msg = (texto || input).trim();
    if (!msg || sending) return;

    setInput('');
    setSending(true);

    const userMsg: ChatMessage = {
      rol: 'usuario',
      contenido: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await chatService.sendMessage(
        msg,
        conversacionId,
        (parcela as any)?.cultivos?.[0]?.tipoCultivo?.nombre?.toLowerCase(),
        (parcela as any)?.departamento,
      );

      setConversacionId(response.conversacion_id);
      setMessages((prev) => [...prev, {
        rol: 'asistente',
        contenido: response.respuesta,
        timestamp: response.timestamp,
        fuentes: response.fuentes,
        tipo: response.tipo,
      }]);
    } catch (err: any) {
      console.log('Chat error:', err.response?.status, JSON.stringify(err.response?.data));
      console.log('Chat error message:', err.message);
      setMessages((prev) => [...prev, {
        rol: 'asistente',
        contenido: '❌ Error al conectar con el asistente. Verifica tu conexión e intenta de nuevo.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    Alert.alert('Limpiar chat', '¿Deseas borrar el historial de esta conversación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpiar',
        style: 'destructive',
        onPress: async () => {
          if (conversacionId) {
            try { await chatService.clearConversation(conversacionId); } catch { /* ignore */ }
          }
          setMessages([]);
          setConversacionId(undefined);
        },
      },
    ]);
  };

  const toggleFuentes = (idx: number) => {
    setShowFuentes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.rol === 'usuario';
    const tipoStyle = item.tipo ? TIPO_COLOR[item.tipo] : null;

    return (
      <View style={[styles.msgContainer, isUser ? styles.msgContainerUser : styles.msgContainerBot]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.contenido}
          </Text>

          <View style={[styles.bubbleMeta, isUser && styles.bubbleMetaUser]}>
            <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
              {new Date(item.timestamp).toLocaleTimeString('es-CO', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
            {tipoStyle && !isUser && (
              <View style={[styles.tipoBadge, { backgroundColor: tipoStyle.bg }]}>
                <Text style={[styles.tipoText, { color: tipoStyle.text }]}>{item.tipo}</Text>
              </View>
            )}
          </View>

          {/* Fuentes */}
          {!isUser && item.fuentes && item.fuentes.length > 0 && (
            <View style={styles.fuentesContainer}>
              <TouchableOpacity
                style={styles.fuentesToggle}
                onPress={() => toggleFuentes(index)}
              >
                <Text style={styles.fuentesToggleText}>
                  📚 {item.fuentes.length} fuente{item.fuentes.length > 1 ? 's' : ''}
                  {showFuentes[index] ? ' ▲' : ' ▼'}
                </Text>
              </TouchableOpacity>

              {showFuentes[index] && (
                <View style={styles.fuentesList}>
                  {item.fuentes.map((f, i) => (
                    <View key={i} style={styles.fuenteItem}>
                      <Text style={styles.fuenteTitulo}>{f.titulo}</Text>
                      <View style={styles.fuenteMeta}>
                        {f.pagina && <Text style={styles.fuenteDetalle}>p.{f.pagina}</Text>}
                        <Text style={styles.fuenteDetalle}>{(f.score * 100).toFixed(0)}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header parcela + limpiar */}
      <View style={styles.header}>
        <FlatList
          data={parcelas || []}
          keyExtractor={(p) => p.parcela_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: p }) => (
            <TouchableOpacity
              style={[styles.chip, selectedParcelaId === p.parcela_id && styles.chipSelected]}
              onPress={() => setSelectedParcelaId(
                selectedParcelaId === p.parcela_id ? null : p.parcela_id,
              )}
            >
              <Text style={[styles.chipText, selectedParcelaId === p.parcela_id && styles.chipTextSelected]}>
                {p.nombre}
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <TouchableOpacity
              style={[styles.chip, !selectedParcelaId && styles.chipSelected]}
              onPress={() => setSelectedParcelaId(null)}
            >
              <Text style={[styles.chipText, !selectedParcelaId && styles.chipTextSelected]}>
                General
              </Text>
            </TouchableOpacity>
          }
          contentContainerStyle={styles.chipList}
        />
        {messages.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
            <Text style={styles.clearButtonText}>🗑</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>Chat IA Agrícola</Text>
          <Text style={styles.emptySubtitle}>
            Consulta sobre tus cultivos, clima y recomendaciones
          </Text>
          <View style={styles.quickList}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickChip}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Escribiendo... */}
      {sending && (
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.typingText}>AgroVision está escribiendo...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu consulta agrícola..."
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  chipList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.text },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  clearButton: {
    paddingHorizontal: 14, paddingVertical: 10,
  },
  clearButtonText: { fontSize: 18 },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 24, gap: 8,
  },
  emptyEmoji: { fontSize: 52, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  quickList: {
    marginTop: 16, gap: 8, width: '100%',
  },
  quickChip: {
    backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  quickChipText: { fontSize: 13, color: colors.text },
  messageList: { padding: 16, gap: 12, paddingBottom: 8 },
  msgContainer: { flexDirection: 'row' },
  msgContainerUser: { justifyContent: 'flex-end' },
  msgContainerBot: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%', borderRadius: 18, padding: 12, gap: 4,
  },
  bubbleUser: {
    backgroundColor: colors.primary, borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: colors.card, borderWidth: 1,
    borderColor: colors.border, borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  bubbleTextUser: { color: colors.white },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  bubbleMetaUser: { justifyContent: 'flex-end' },
  bubbleTime: { fontSize: 10, color: colors.textMuted },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tipoText: { fontSize: 9, fontWeight: '600' },
  fuentesContainer: { marginTop: 6, gap: 4 },
  fuentesToggle: { paddingVertical: 2 },
  fuentesToggleText: { fontSize: 11, color: colors.secondary },
  fuentesList: { gap: 4, marginTop: 4 },
  fuenteItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: colors.background, borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  fuenteTitulo: { fontSize: 11, color: colors.text, flex: 1 },
  fuenteMeta: { flexDirection: 'row', gap: 6 },
  fuenteDetalle: { fontSize: 10, color: colors.textMuted },
  typingContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  typingText: { fontSize: 12, color: colors.textMuted },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1,
    borderColor: colors.border, borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, backgroundColor: colors.background,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: colors.white, fontSize: 18 },
});