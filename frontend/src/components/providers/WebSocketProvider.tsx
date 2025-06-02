// src/components/providers/WebSocketProvider.tsx - CORRIGIDO E OTIMIZADO
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'; // Adicionado useMemo
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../../store/authStore'; //
import { toast } from 'react-hot-toast';
import { Notification } from '../../lib/api'; //
import { useNotificationSummaryStore } from '../../store/notificationStore'; //

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (destination: string, body: any) => void;
  subscribe: (destination: string, callback: (message: any) => void) => (() => void) | undefined;
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

interface NotificationSummaryData {
  unreadCount: number;
  totalCount: number;
  hasUrgent: boolean;
  documentsCount: number;
  commentsCount: number;
  approvalsCount: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuthStore(); //
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3; // Máximo de tentativas de reconexão

  const { setSummary: setGlobalSummary, incrementUnreadCount } = useNotificationSummaryStore(); //

  const userRef = useRef(user);
  const tokenRef = useRef(token);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const getNotificationIcon = useCallback((type: string, providedIcon?: string) => {
    if (providedIcon) return providedIcon;
    const icons: { [key: string]: string } = {
      DOCUMENT_CREATED: '📄', DOCUMENT_SUBMITTED: '📤', DOCUMENT_APPROVED: '✅', DOCUMENT_REJECTED: '❌',
      DOCUMENT_REVISION_REQUESTED: '🔄', DOCUMENT_FINALIZED: '🎯', VERSION_CREATED: '📝', VERSION_UPDATED: '✏️',
      COMMENT_ADDED: '💬', COMMENT_REPLIED: '↩️', COMMENT_RESOLVED: '✔️', USER_REGISTERED: '👤',
      USER_APPROVED: '✅', USER_REJECTED: '❌', DEADLINE_APPROACHING: '⏰', DEADLINE_OVERDUE: '🚨',
      TASK_ASSIGNED: '📋', COLLABORATOR_ADDED: '👥', COLLABORATOR_REMOVED: '👤➖', COLLABORATOR_ROLE_CHANGED: '🧑‍🔧',
    };
    return icons[type] || '📢';
  }, []);

  const handleNewNotification = useCallback((notification: Notification) => {
    const icon = getNotificationIcon(notification.type, notification.icon);
    const toastId = `notification-${notification.id || Date.now()}`;
    if (toast.isActive && toast.isActive(toastId)) return;

    const toastContent = (
      <div onClick={() => toast.dismiss(toastId)} style={{ cursor: 'pointer', width: '100%' }}>
        <strong className="font-semibold">{notification.title}</strong>
        <p className="text-sm">{notification.message}</p>
      </div>
    );

    if (notification.priority === 'URGENT') {
      toast.error(toastContent, { id: toastId, duration: 6000, icon });
    } else {
      toast.success(toastContent, { id: toastId, icon });
    }
    incrementUnreadCount(); //
  }, [incrementUnreadCount, getNotificationIcon]);

  const subscribeToTopics = useCallback(() => {
    if (!clientRef.current?.connected || !userRef.current) return;
    const userEmail = userRef.current.email;

    subscriptionsRef.current.forEach((sub, destination) => {
      try { sub.unsubscribe(); console.log(`WebSocket: Inscrição cancelada para ${destination}`); }
      catch (e) { console.error(`WebSocket: Erro ao cancelar inscrição de ${destination}`, e); }
    });
    subscriptionsRef.current.clear();

    try {
      const notificationDestination = `/user/${userEmail}/topic/notifications`;
      const notificationSubscription = clientRef.current.subscribe(notificationDestination, (message: IMessage) => {
        try { handleNewNotification(JSON.parse(message.body)); } //
        catch (e) { console.error("WebSocket: Erro ao processar mensagem de notificação:", e, message.body); }
      });
      subscriptionsRef.current.set(notificationDestination, notificationSubscription);
      console.log(`WebSocket: Inscrito em: ${notificationDestination}`);

      const summaryDestination = `/user/${userEmail}/topic/notification-summary`;
      const summarySubscription = clientRef.current.subscribe(summaryDestination, (message: IMessage) => {
        try { setGlobalSummary(JSON.parse(message.body)); console.log('WebSocket: Resumo de notificações atualizado:', JSON.parse(message.body)); } //
        catch (e) { console.error("WebSocket: Erro ao processar mensagem de resumo de notificação:", e, message.body); }
      });
      subscriptionsRef.current.set(summaryDestination, summarySubscription);
      console.log(`WebSocket: Inscrito em: ${summaryDestination}`);
    } catch (error) { console.error('WebSocket: Erro ao inscrever-se nos tópicos:', error); }
  }, [handleNewNotification, setGlobalSummary]);

  const connect = useCallback(() => {
    if (clientRef.current?.active) { console.log('WebSocket: Já conectado ou conectando.'); return; }
    if (!isAuthenticatedRef.current || !tokenRef.current || !userRef.current) { console.log('WebSocket: Não autenticado ou dados do usuário/token ausentes. Conexão não será iniciada.'); return; }

    console.log('WebSocket: Tentando conectar...');
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const socketUrl = `${baseUrl}/ws`;
      const socket = new SockJS(socketUrl);
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: { Authorization: `Bearer ${tokenRef.current}` },
        debug: (str) => { if (import.meta.env.DEV && (str.includes('CONNECT') || str.includes('DISCONNECT') || str.includes('ERROR') || str.includes('>>>'))) { console.log('WebSocket Debug:', str); } },
        reconnectDelay: 10000,
        heartbeatIncoming: 30000,
        heartbeatOutgoing: 30000,
        onConnect: () => {
          console.log('WebSocket: Conectado com sucesso.');
          setIsConnected(true); setReconnectAttempts(0);
          setTimeout(subscribeToTopics, 1000);
          if (reconnectAttempts > 0) toast.success('Reconectado ao servidor de notificações.');
        },
        onDisconnect: () => { console.log('WebSocket: Desconectado.'); setIsConnected(false); },
        onStompError: (frame) => {
          console.error('WebSocket: Erro STOMP:', frame.headers?.message, frame.body); setIsConnected(false);
          if (frame.headers?.message?.includes('AccessDeniedException') || frame.headers?.message?.includes('AuthenticationFailedException')) {
            console.error('WebSocket: Erro de autenticação WebSocket.');
            if (reconnectAttempts === 0) toast.error('Erro de autenticação com o servidor de notificações.');
          }
        },
        onWebSocketError: (event) => { console.error("WebSocket: Erro na camada WebSocket:", event); },
        onWebSocketClose: () => { console.log("WebSocket: Conexão fechada."); setIsConnected(false); }
      });
      clientRef.current = client; client.activate();
    } catch (error) {
      console.error('WebSocket: Falha ao iniciar a conexão WebSocket:', error); setIsConnected(false);
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`WebSocket: Tentando reconectar em ${delay / 1000}s (tentativa ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => { setReconnectAttempts(prev => prev + 1); connect(); }, delay);
      } else {
        console.error('WebSocket: Máximo de tentativas de reconexão atingido.');
        if (reconnectAttempts === maxReconnectAttempts) toast.error('Não foi possível conectar ao servidor de notificações após várias tentativas.');
      }
    }
  }, [subscribeToTopics, reconnectAttempts, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    console.log('WebSocket: Iniciando desconexão...');
    if (reconnectTimeoutRef.current) { clearTimeout(reconnectTimeoutRef.current); reconnectTimeoutRef.current = undefined; }
    subscriptionsRef.current.forEach((sub, destination) => {
      try { sub.unsubscribe(); console.log(`WebSocket: Inscrição cancelada para ${destination}`); }
      catch (e) { console.error(`WebSocket: Erro ao cancelar inscrição de ${destination}`, e); }
    });
    subscriptionsRef.current.clear();
    if (clientRef.current?.active) {
      clientRef.current.deactivate()
        .then(() => console.log('WebSocket: Cliente STOMP desativado.'))
        .catch(e => console.error('WebSocket: Erro ao desativar cliente STOMP.', e));
    }
    clientRef.current = null; setIsConnected(false); setReconnectAttempts(0);
  }, []);

  useEffect(() => {
    if (isAuthenticatedRef.current && tokenRef.current && userRef.current) {
      const timeoutId = setTimeout(() => { if (!clientRef.current || !clientRef.current.active) connect(); }, 1000);
      return () => clearTimeout(timeoutId);
    } else { disconnect(); }
  }, [isAuthenticated, token, user?.email, connect, disconnect]);

  useEffect(() => { return () => { disconnect(); }; }, [disconnect]);

  const sendMessage = useCallback((destination: string, body: any) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
    } else { console.error('WebSocket: Não conectado. Não é possível enviar mensagem para', destination); }
  }, []);

  const subscribe = useCallback((destination: string, callback: (message: any) => void) => {
    if (clientRef.current?.connected) {
      if (subscriptionsRef.current.has(destination)) {
        console.warn(`WebSocket: Já inscrito em ${destination}. Re-inscrição evitada.`); return undefined;
      }
      const subscription = clientRef.current.subscribe(destination, (message: IMessage) => {
        try { callback(JSON.parse(message.body)); }
        catch (e) { console.error("WebSocket: Erro ao processar mensagem de inscrição customizada (JSON.parse falhou):", e, message.body); callback(message.body); }
      });
      subscriptionsRef.current.set(destination, subscription);
      console.log(`WebSocket: Inscrito em tópico customizado: ${destination}`);
      return () => {
        try { subscription.unsubscribe(); subscriptionsRef.current.delete(destination); console.log(`WebSocket: Inscrição cancelada para ${destination}`); }
        catch (e) { console.error(`WebSocket: Erro ao cancelar inscrição de ${destination}`, e); }
      };
    } else { console.error('WebSocket: Não conectado. Não é possível inscrever-se em', destination); return undefined; }
  }, []);

  // Otimização: Memoizar o valor do contexto para evitar re-renderizações desnecessárias dos consumidores.
  const contextValue = useMemo(() => ({
    isConnected,
    sendMessage,
    subscribe
  }), [isConnected, sendMessage, subscribe]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};