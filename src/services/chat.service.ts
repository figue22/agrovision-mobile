import { api } from './api.service';

export interface ChatMessage {
  rol: 'usuario' | 'asistente';
  contenido: string;
  timestamp: string;
  fuentes?: { titulo: string; pagina?: number; score: number }[];
  tipo?: string;
}

export interface ChatResponse {
  conversacion_id: string;
  respuesta: string;
  fuentes?: { titulo: string; pagina?: number; score: number }[];
  tipo: string;
  timestamp: string;
}

export const chatService = {
  sendMessage: async (
    mensaje: string,
    conversacionId?: string,
    cultivo?: string,
    region?: string,
  ): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chatbot/message', {
      mensaje,
      conversacion_id: conversacionId,
      cultivo,
      region,
    });
    return response.data;
  },

  getHistorial: async (conversacionId: string): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(`/chatbot/historial/${conversacionId}`);
    return response.data;
  },

  clearConversation: async (conversacionId: string): Promise<void> => {
    await api.delete(`/chatbot/conversacion/${conversacionId}`);
  },
};