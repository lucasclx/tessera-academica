// src/components/providers/WebSocketProvider.tsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { Notification } from '../../lib/api'; // Supondo que NotificationSummaryDTO também venha daqui ou seja definido
import { useNotificationSummaryStore } from '../../store/notificationStore'; // Importe sua store de resumo

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (destination: string, body: any) => void;
  subscribe: (destination: string, callback: (message: any) => void) => (() => void) | undefined; // Tornar o retorno opcional
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

// Definição do tipo para o resumo, se não estiver já em lib/api
interface NotificationSummaryData {
  unreadCount: number;
  totalCount: number;
  hasUrgent: boolean;
  documentsCount: number;
  commentsCount: number;
  approvalsCount: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5; // Aumentado para mais tentativas

  const { setSummary: setGlobalSummary, incrementUnreadCount } = useNotificationSummaryStore();

  const getNotificationIcon = useCallback((type: string, providedIcon?: string) => {
    if (providedIcon) return providedIcon; // Usa o ícone da notificação se disponível

    const icons: { [key: string]: string } = {
      DOCUMENT_CREATED: '📄',
      DOCUMENT_SUBMITTED: '📤',
      DOCUMENT_APPROVED: '✅',
      DOCUMENT_REJECTED: '❌',
      DOCUMENT_REVISION_REQUESTED: '🔄',
      DOCUMENT_FINALIZED: '🎯',
      VERSION_CREATED: '📝',
      VERSION_UPDATED: '✏️',
      COMMENT_ADDED: '💬',
      COMMENT_REPLIED: '↩️',
      COMMENT_RESOLVED: '✔️',
      USER_REGISTERED: '👤',
      USER_APPROVED: '✅', // Tipo de usuário aprovado
      USER_REJECTED: '❌', // Tipo de usuário rejeitado
      DEADLINE_APPROACHING: '⏰',
      DEADLINE_OVERDUE: '🚨',
      TASK_ASSIGNED: '📋',
      COLLABORATOR_ADDED: '👥',
      COLLABORATOR_REMOVED: '👤➖',
      COLLABORATOR_ROLE_CHANGED: '🧑‍🔧',
      // Adicione mais tipos e ícones conforme necessário
    };
    return icons[type] || '📢'; // Ícone padrão
  }, []);

  const handleNewNotification = useCallback((notification: Notification) => {
    const icon = getNotificationIcon(notification.type, notification.icon);
    const toastId = `notification-${notification.id || Date.now()}`; // Garante um ID único

    // Exibe o toast
    if (notification.priority === 'URGENT') {
      toast.error(
        (t) => (
          <div onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer', width: '100%' }}>
            <strong className="font-semibold">{notification.title}</strong>
            <p className="text-sm">{notification.message}</p>
          </div>
        ),
        {
          id: toastId,
          duration: 6000, // Duração maior para urgentes
          icon: icon,
        }
      );
    } else {
      toast.success(
        (t) => (
          <div onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer', width: '100%' }}>
            <strong className="font-semibold">{notification.title}</strong>
            <p className="text-sm">{notification.message}</p>
          </div>
        ),
        {
          id: toastId,
          icon: icon,
        }
      );
    }

    // Atualiza a contagem global de não lidas
    incrementUnreadCount();

    // TODO: Opcionalmente, disparar um evento para que o NotificationCenter.tsx recarregue suas notificações
    // ou adicione a notificação diretamente a uma store global de notificações, se existir.
    // Exemplo: window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }));

  }, [incrementUnreadCount, getNotificationIcon]);


  const subscribeToTopics = useCallback(() => {
    if (!clientRef.current?.connected || !user) return;

    const userEmail = user.email; // Para evitar problemas com a closure do useEffect

    // Inscrever-se em notificações pessoais
    const notificationDestination = `/user/${userEmail}/topic/notifications`;
    const notificationSubscription = clientRef.current.subscribe(notificationDestination, (message: IMessage) => {
      try {
        const notification: Notification = JSON.parse(message.body);
        handleNewNotification(notification);
      } catch (e) {
        console.error("Erro ao processar mensagem de notificação:", e, message.body);
      }
    });
    subscriptionsRef.current.set(notificationDestination, notificationSubscription);
    console.log(`Inscrito em: ${notificationDestination}`);

    // Inscrever-se em atualizações de resumo
    const summaryDestination = `/user/${userEmail}/topic/notification-summary`;
    const summarySubscription = clientRef.current.subscribe(summaryDestination, (message: IMessage) => {
      try {
        const summary: NotificationSummaryData = JSON.parse(message.body);
        setGlobalSummary(summary); // Atualiza a store global
        console.log('Resumo de notificações atualizado via WebSocket:', summary);
      } catch (e) {
        console.error("Erro ao processar mensagem de resumo de notificação:", e, message.body);
      }
    });
    subscriptionsRef.current.set(summaryDestination, summarySubscription);
    console.log(`Inscrito em: ${summaryDestination}`);

  }, [user, handleNewNotification, setGlobalSummary]);


  const connect = useCallback(() => {
    if (clientRef.current?.active || !isAuthenticated || !token || !user) {
      console.log('WebSocket: Conexão não iniciada (já conectado, não autenticado ou faltando token/usuário).');
      return;
    }

    console.log('WebSocket: Tentando conectar...');
    try {
      const socketUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/ws`;
      const socket = new SockJS(socketUrl);
      
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          if (import.meta.env.DEV) {
            // console.log('WebSocket Debug:', str); // Pode ser muito verboso
          }
        },
        reconnectDelay: 5000 + Math.random() * 1000, // Adiciona jitter
        heartbeatIncoming: 20000, // Aumentado para ser mais tolerante
        heartbeatOutgoing: 20000, // Aumentado
        onConnect: () => {
          console.log('WebSocket: Conectado com sucesso.');
          setIsConnected(true);
          setReconnectAttempts(0);
          
          subscribeToTopics();
          
          if (reconnectAttempts > 0) {
            toast.success('Reconectado ao servidor de notificações.');
          }
        },
        onDisconnect: () => {
          console.log('WebSocket: Desconectado.');
          setIsConnected(false);
          // A lógica de reconexão do STOMP client deve lidar com isso.
        },
        onStompError: (frame) => {
          console.error('WebSocket: Erro STOMP:', frame.headers?.message, frame.body);
          setIsConnected(false);
          // A lógica de reconexão do STOMP client tentará reconectar.
          // Se falhar consistentemente, pode ser um problema de token ou servidor.
          if (frame.headers?.message?.includes('AccessDeniedException')) {
             toast.error('Erro de autenticação WebSocket. Verifique o console.');
             // Poderia tentar deslogar o usuário se for erro de token inválido persistente.
          }
        },
        onWebSocketError: (event) => {
            console.error("WebSocket: Erro na camada WebSocket:", event);
            // Isso pode indicar problemas de rede ou o servidor estar offline.
            // A reconexão automática do STOMP client deve tentar resolver.
        },
        onWebSocketClose: () => {
            console.log("WebSocket: Conexão fechada.");
            setIsConnected(false);
            // STOMP client tentará reconectar baseado em reconnectDelay
        }
      });

      clientRef.current = client;
      client.activate();
    } catch (error) {
      console.error('WebSocket: Falha ao criar conexão WebSocket:', error);
      setIsConnected(false);
      // Tentar reconectar manualmente após um erro de configuração inicial
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(3000 * Math.pow(2, reconnectAttempts), 60000); // Backoff exponencial
        console.log(`WebSocket: Tentando reconectar em ${delay / 1000}s (tentativa ${reconnectAttempts + 1})`);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        toast.error('Não foi possível conectar ao servidor de notificações após várias tentativas.');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, user, subscribeToTopics, reconnectAttempts]); // Adicionar reconnectAttempts aqui


  const disconnect = useCallback(() => {
    console.log('WebSocket: Iniciando desconexão...');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    subscriptionsRef.current.forEach((sub, destination) => {
      try {
        sub.unsubscribe();
        console.log(`WebSocket: Inscrição cancelada para ${destination}`);
      } catch (e) {
        console.error(`WebSocket: Erro ao cancelar inscrição de ${destination}`, e);
      }
    });
    subscriptionsRef.current.clear();

    if (clientRef.current?.active) {
      clientRef.current.deactivate()
        .then(() => console.log('WebSocket: Cliente STOMP desativado.'))
        .catch(e => console.error('WebSocket: Erro ao desativar cliente STOMP.', e));
    }
    
    clientRef.current = null;
    setIsConnected(false);
    setReconnectAttempts(0); // Resetar tentativas ao desconectar manualmente
  }, []);


  useEffect(() => {
    if (isAuthenticated && token && user) {
      if (!clientRef.current || !clientRef.current.active) {
        connect();
      }
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, user, connect, disconnect]);

  const sendMessage = (destination: string, body: any) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    } else {
      console.error('WebSocket: Não conectado, não é possível enviar mensagem.');
      toast.error('Não conectado ao servidor de mensagens.');
    }
  };

  const subscribe = (destination: string, callback: (message: any) => void) => {
    if (clientRef.current?.connected) {
      if (subscriptionsRef.current.has(destination)) {
        console.warn(`WebSocket: Já inscrito em ${destination}. Reutilizando inscrição existente ou cancele primeiro.`);
        // Opcionalmente, cancele a inscrição antiga e inscreva-se novamente, ou retorne a existente.
        // Por simplicidade, vamos permitir múltiplas lógicas de callback para o mesmo tópico,
        // mas o STOMP client pode otimizar isso para uma única inscrição no broker.
      }
      const subscription = clientRef.current.subscribe(destination, (message: IMessage) => {
        try {
          callback(JSON.parse(message.body));
        } catch (e) {
          console.error("Erro ao processar mensagem de inscrição customizada:", e, message.body);
          callback(message.body); // Fallback para corpo cru se JSON.parse falhar
        }
      });
      subscriptionsRef.current.set(destination, subscription); // Armazenar a inscrição para possível cancelamento
      return () => { // Função de cancelamento
        try {
          subscription.unsubscribe();
          subscriptionsRef.current.delete(destination);
          console.log(`WebSocket: Inscrição cancelada para ${destination}`);
        } catch (e) {
          console.error(`WebSocket: Erro ao cancelar inscrição de ${destination}`, e);
        }
      };
    } else {
      console.error('WebSocket: Não conectado, não é possível inscrever-se.');
      return undefined;
    }
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Crie este arquivo se ainda não existir: src/store/notificationStore.ts
// Exemplo de como poderia ser:
/*
import { create } from 'zustand';

interface NotificationSummaryData {
  unreadCount: number;
  totalCount: number;
  hasUrgent: boolean;
  documentsCount: number;
  commentsCount: number;
  approvalsCount: number;
}

interface NotificationSummaryStore {
  summary: NotificationSummaryData | null;
  setSummary: (summary: NotificationSummaryData) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (count?: number) => void;
  clearUnreadCount: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useNotificationSummaryStore = create<NotificationSummaryStore>((set) => ({
  summary: { // Valores iniciais
    unreadCount: 0,
    totalCount: 0,
    hasUrgent: false,
    documentsCount: 0,
    commentsCount: 0,
    approvalsCount: 0,
  },
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSummary: (summary) => set({ summary, isLoading: false }),
  incrementUnreadCount: () => set((state) => ({
    summary: state.summary ? { ...state.summary, unreadCount: state.summary.unreadCount + 1 } : { unreadCount: 1, totalCount: 1, hasUrgent: false, documentsCount: 0, commentsCount: 0, approvalsCount: 0 }
  })),
  decrementUnreadCount: (count = 1) => set((state) => ({
    summary: state.summary ? { ...state.summary, unreadCount: Math.max(0, state.summary.unreadCount - count) } : null
  })),
  clearUnreadCount: () => set((state) => ({
    summary: state.summary ? { ...state.summary, unreadCount: 0 } : null
  })),
}));
*/