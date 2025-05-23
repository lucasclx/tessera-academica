import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import { AuthContext } from './AuthContext';
import notificationUtils from '../utils/notificationUtils'; // Importar utils

// URL do WebSocket - idealmente vinda de uma variável de ambiente
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:8080/api/ws';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [summary, setSummary] = useState({
    unreadCount: 0,
    totalCount: 0,
    hasUrgent: false,
    documentsCount: 0,
    commentsCount: 0,
    approvalsCount: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [settings, setSettings] = useState(null);

  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    
    try {
      setLoading(true);
      const [unreadData, summaryData, settingsData] = await Promise.all([
        notificationService.getUnreadNotifications(),
        notificationService.getNotificationSummary(),
        notificationService.getNotificationSettings()
      ]);
      
      setNotifications(unreadData.map(n => ({...n, isNew: notificationUtils.isNew(n) }))); // Processar isNew
      setSummary(summaryData);
      setUnreadCount(summaryData.unreadCount);
      setSettings(settingsData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais de notificação:', error);
      // Definir estados padrão em caso de erro para evitar que fiquem indefinidos
      setNotifications([]);
      setSummary({ unreadCount: 0, totalCount: 0, hasUrgent: false, documentsCount: 0, commentsCount: 0, approvalsCount: 0 });
      setUnreadCount(0);
      setSettings(notificationService.getNotificationSettings()); // Carrega padrões do serviço
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);


  const setupWebSocket = useCallback(() => {
    if (!isAuthenticated || !currentUser || stompClient?.active) return;

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn("Token não encontrado, WebSocket não pode conectar.");
        return;
    }

    const client = new Client({
      brokerURL: WEBSOCKET_URL.replace("http", "ws"), // Para brokers STOMP diretos
      webSocketFactory: () => new SockJS(WEBSOCKET_URL), // SockJS para fallback
      connectHeaders: {
        Authorization: `Bearer ${token}`,
        Login: currentUser.email // Adicionando login para depuração ou uso no backend
      },
      debug: (str) => {
        console.log('STOMP:', str);
      },
      reconnectDelay: 10000, // Aumentar delay para evitar spam de reconexão
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('WebSocket conectado:', frame);
      setConnected(true);
      
      client.subscribe(`/user/${currentUser.email}/topic/notifications`, (message) => { // Destino específico do usuário
        const notification = JSON.parse(message.body);
        handleNewNotification(notification);
      });
      
      client.subscribe(`/user/${currentUser.email}/topic/notification-summary`, (message) => { // Destino específico
        const newSummary = JSON.parse(message.body);
        setSummary(newSummary);
        setUnreadCount(newSummary.unreadCount);
      });
      // Carregar dados iniciais após conexão bem-sucedida se ainda não carregados
      if (notifications.length === 0 && unreadCount === 0) {
          loadInitialData();
      }
    };

    client.onStompError = (frame) => {
      console.error('Erro STOMP:', frame.headers?.['message'], frame.body);
      setConnected(false);
    };

    client.onWebSocketClose = (event) => {
      console.log('WebSocket desconectado:', event);
      setConnected(false);
      // Não tentar reconectar manualmente aqui, o client já faz isso com reconnectDelay
    };
    
    client.onWebSocketError = (error) => {
        console.error("Erro no WebSocket:", error);
        setConnected(false);
    };


    client.activate();
    setStompClient(client);

    return () => {
      if (client && client.active) {
        console.log("Desativando cliente STOMP");
        client.deactivate();
        setStompClient(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated, currentUser, stompClient?.active, loadInitialData]); // Adicionado stompClient.active para evitar múltiplas conexões

  useEffect(() => {
    if (isAuthenticated && currentUser && !stompClient) { // Tentar conectar se autenticado e sem cliente
      const cleanup = setupWebSocket();
      return cleanup;
    } else if (!isAuthenticated && stompClient) { // Desconectar se não autenticado mas cliente existe
        stompClient.deactivate();
        setStompClient(null);
        setConnected(false);
    }
  }, [isAuthenticated, currentUser, stompClient, setupWebSocket]);


  const handleNewNotification = (notification) => {
    console.log('Nova notificação WebSocket recebida:', notification);
    const processedNotification = {...notification, isNew: true, timeAgo: 'agora'};
    
    setNotifications(prev => [processedNotification, ...prev.slice(0, 49)]);
    
    // Atualiza o resumo localmente também, embora o backend deva enviar um novo resumo.
    // Isso pode ajudar a ter uma UI mais responsiva imediatamente.
    setSummary(prevSummary => ({
        ...prevSummary,
        unreadCount: prevSummary.unreadCount + 1,
        totalCount: prevSummary.totalCount + 1,
        hasUrgent: prevSummary.hasUrgent || notification.priority === 'URGENT',
        // Atualizar contagens específicas se a notificação fornecer essa info ou recalcular
    }));
    setUnreadCount(prev => prev + 1);

    if (settings?.browserEnabled && checkShouldShowNotification(notification)) {
        const toastOptions = {
          position: "top-right",
          autoClose: getAutoCloseTime(notification.priority),
          hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true,
        };

        const icon = notificationUtils.getTypeIcon(notification.type);
        const displayTitle = `${icon} ${notification.title}`;

        switch (notification.priority) {
          case 'URGENT': toast.error(displayTitle, toastOptions); break;
          case 'HIGH': toast.warn(displayTitle, toastOptions); break;
          case 'NORMAL': toast.info(displayTitle, toastOptions); break;
          default: toast(displayTitle, toastOptions);
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo192.png', // Usar um ícone da pasta public
            tag: notification.id?.toString(), // Tag precisa ser string
            requireInteraction: notification.priority === 'URGENT'
          });
        }
      }
  };

  const checkShouldShowNotification = (notification) => {
    if (!settings?.browserEnabled) return false;
    const type = notification.type;
    if (type.name) { // Se type for um objeto Enum do backend
        if (type.name.includes('DOCUMENT') || type.name.includes('VERSION')) return settings.browserDocumentUpdates;
        if (type.name.includes('COMMENT')) return settings.browserComments;
        if (type.name.includes('APPROVED') || type.name.includes('REJECTED')) return settings.browserApprovals;
    } else if (typeof type === 'string') { // Se type for string
        if (type.includes('DOCUMENT') || type.includes('VERSION')) return settings.browserDocumentUpdates;
        if (type.includes('COMMENT')) return settings.browserComments;
        if (type.includes('APPROVED') || type.includes('REJECTED')) return settings.browserApprovals;
    }
    return true;
  };

  const getAutoCloseTime = (priority) => {
    switch (priority) {
      case 'URGENT': return 8000;
      case 'HIGH': return 6000;
      case 'NORMAL': return 4000;
      default: return 3000;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, isNew: false } : n)
      );
      // O backend deve enviar um novo resumo via WebSocket.
      // Se não, chamar loadInitialData() ou uma função específica de recarregar resumo.
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      toast.error("Falha ao marcar notificação como lida.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isNew: false })));
      // O backend deve enviar um novo resumo via WebSocket.
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error("Falha ao marcar todas as notificações como lidas.");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // O backend deve enviar um novo resumo via WebSocket.
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error("Falha ao deletar notificação.");
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = await notificationService.updateNotificationSettings(newSettings);
      setSettings(updatedSettings);
      toast.success("Configurações de notificação salvas!");
      return updatedSettings;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error("Falha ao salvar configurações.");
      throw error;
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.warn("Este navegador não suporta notificações desktop.");
      return false;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        toast.success("Permissão para notificações concedida!");
    } else {
        toast.warn("Permissão para notificações negada.");
    }
    return permission === 'granted';
  };

  const loadAllHistoricalNotifications = async (page = 0, size = 20) => {
    // Renomeado para clareza, este busca do histórico, não em tempo real
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications(page, size);
      return data; // Retorna a página de notificações históricas
    } catch (error) {
      console.error('Erro ao carregar histórico de notificações:', error);
      toast.error("Falha ao carregar histórico de notificações.");
      throw error;
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadInitialData();
    } else {
      setNotifications([]);
      setSummary({ unreadCount: 0, totalCount: 0, hasUrgent: false, documentsCount: 0, commentsCount: 0, approvalsCount: 0 });
      setUnreadCount(0);
      setSettings(null);
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
        setStompClient(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, currentUser, loadInitialData]); // stompClient removido para evitar reconexão em loop


  const value = {
    notifications, unreadCount, summary, settings,
    loading, connected,
    markAsRead, markAllAsRead, deleteNotification,
    updateSettings, loadInitialData, // renomeado de loadNotifications
    loadAllHistoricalNotifications, // renomeado de loadAllNotifications
    requestNotificationPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};