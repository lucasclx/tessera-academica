import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import { AuthContext } from './AuthContext';

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
  
  // Estados principais
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
  
  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [settings, setSettings] = useState(null);

  // Carregar notificações iniciais
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const [unreadData, summaryData, settingsData] = await Promise.all([
        notificationService.getUnreadNotifications(),
        notificationService.getNotificationSummary(),
        notificationService.getNotificationSettings()
      ]);
      
      setNotifications(unreadData);
      setSummary(summaryData);
      setUnreadCount(summaryData.unreadCount);
      setSettings(settingsData);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Configurar conexão WebSocket
  const setupWebSocket = useCallback(() => {
    if (!isAuthenticated || !currentUser || connected) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = new SockJS('http://localhost:8080/api/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('WebSocket conectado:', frame);
      setConnected(true);
      
      // Subscrever para notificações específicas do usuário
      client.subscribe(`/user/topic/notifications`, (message) => {
        const notification = JSON.parse(message.body);
        handleNewNotification(notification);
      });
      
      // Subscrever para resumo de notificações
      client.subscribe(`/user/topic/notification-summary`, (message) => {
        const newSummary = JSON.parse(message.body);
        setSummary(newSummary);
        setUnreadCount(newSummary.unreadCount);
      });
    };

    client.onStompError = (frame) => {
      console.error('Erro STOMP:', frame.headers['message'], frame.body);
      setConnected(false);
    };

    client.onWebSocketClose = () => {
      console.log('WebSocket desconectado');
      setConnected(false);
    };

    client.activate();
    setStompClient(client);

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [isAuthenticated, currentUser, connected]);

  // Lidar com nova notificação recebida via WebSocket
  const handleNewNotification = (notification) => {
    console.log('Nova notificação recebida:', notification);
    
    // Adicionar à lista de notificações
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Manter apenas 50 mais recentes
    
    // Verificar configurações antes de mostrar toast
    if (settings?.browserEnabled) {
      const shouldShow = checkShouldShowNotification(notification);
      
      if (shouldShow) {
        // Mostrar toast com base na prioridade
        const toastOptions = {
          position: "top-right",
          autoClose: getAutoCloseTime(notification.priority),
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        };

        switch (notification.priority) {
          case 'URGENT':
            toast.error(`${notification.icon} ${notification.title}`, toastOptions);
            break;
          case 'HIGH':
            toast.warn(`${notification.icon} ${notification.title}`, toastOptions);
            break;
          case 'NORMAL':
            toast.info(`${notification.icon} ${notification.title}`, toastOptions);
            break;
          case 'LOW':
            toast.success(`${notification.icon} ${notification.title}`, toastOptions);
            break;
          default:
            toast(`${notification.icon} ${notification.title}`, toastOptions);
        }

        // Mostrar notificação do browser se suportado
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
            requireInteraction: notification.priority === 'URGENT'
          });
        }
      }
    }
  };

  // Verificar se deve mostrar a notificação baseado nas configurações
  const checkShouldShowNotification = (notification) => {
    if (!settings?.browserEnabled) return false;
    
    const type = notification.type;
    
    if (type.includes('DOCUMENT') || type.includes('VERSION')) {
      return settings.browserDocumentUpdates;
    } else if (type.includes('COMMENT')) {
      return settings.browserComments;
    } else if (type.includes('APPROVED') || type.includes('REJECTED')) {
      return settings.browserApprovals;
    }
    
    return true;
  };

  // Tempo de auto-close baseado na prioridade
  const getAutoCloseTime = (priority) => {
    switch (priority) {
      case 'URGENT': return 8000;
      case 'HIGH': return 6000;
      case 'NORMAL': return 4000;
      case 'LOW': return 3000;
      default: return 4000;
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      // O resumo será atualizado via WebSocket
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      // O resumo será atualizado via WebSocket
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  // Deletar notificação
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // O resumo será atualizado via WebSocket
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  // Atualizar configurações
  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = await notificationService.updateNotificationSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Erro ao atualizar configurações de notificação:', error);
      throw error;
    }
  };

  // Solicitar permissão para notificações do browser
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Carregar todas as notificações (paginadas)
  const loadAllNotifications = async (page = 0, size = 20) => {
    try {
      const data = await notificationService.getAllNotifications(page, size);
      return data;
    } catch (error) {
      console.error('Erro ao carregar todas as notificações:', error);
      throw error;
    }
  };

  // Efeitos
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      // Limpar dados quando deslogado
      setNotifications([]);
      setSummary({
        unreadCount: 0,
        totalCount: 0,
        hasUrgent: false,
        documentsCount: 0,
        commentsCount: 0,
        approvalsCount: 0
      });
      setUnreadCount(0);
      setSettings(null);
    }
  }, [isAuthenticated, loadNotifications]);

  useEffect(() => {
    const cleanup = setupWebSocket();
    
    return () => {
      if (cleanup) cleanup();
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [setupWebSocket, stompClient]);

  // Limpar conexão ao desmontar
  useEffect(() => {
    return () => {
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [stompClient]);

  const value = {
    // Dados
    notifications,
    unreadCount,
    summary,
    settings,
    
    // Estados
    loading,
    connected,
    
    // Ações
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    loadNotifications,
    loadAllNotifications,
    requestNotificationPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
