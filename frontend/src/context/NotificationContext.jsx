// Arquivo: scrs/src/context/NotificationContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import { Client } from '@stomp/stompjs'; // Previous import
import * as StompJs from '@stomp/stompjs'; // Changed import
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';
import { notificationService } from '../services'; //
import { AuthContext } from './AuthContext'; //
import { APP_CONFIG, getNotificationIcon, getPriorityColor } from '../utils'; //

export const NotificationContext = createContext(null); // MODIFIED: Added explicit null

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
    unreadCount: 0, totalCount: 0, hasUrgent: false,
    documentsCount: 0, commentsCount: 0, approvalsCount: 0
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
        notificationService.getUnreadNotifications(), //
        notificationService.getNotificationSummary(), //
        notificationService.getNotificationSettings() //
      ]);
      
      setNotifications(unreadData || []); 
      setSummary(summaryData || { unreadCount: 0, totalCount: 0, hasUrgent: false, documentsCount: 0, commentsCount: 0, approvalsCount: 0 });
      setUnreadCount(summaryData?.unreadCount || 0);
      setSettings(settingsData);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setNotifications([]);
      setSummary({ unreadCount: 0, totalCount: 0, hasUrgent: false, documentsCount: 0, commentsCount: 0, approvalsCount: 0 });
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  const setupWebSocket = useCallback(() => {
    if (!isAuthenticated || !currentUser || stompClient?.active || !APP_CONFIG.features.enableWebSocket) return; //

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Use StompJs.Client here
      const client = new StompJs.Client({ // MODIFIED LINE
        webSocketFactory: () => new SockJS(APP_CONFIG.api.websocketUrl), //
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          Login: currentUser.email 
        },
        reconnectDelay: 10000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setConnected(true);
          console.log('[WebSocket] Conectado.');
          
          client.subscribe(`/user/${currentUser.email}/topic/notifications`, (message) => {
            const notification = JSON.parse(message.body);
            console.log('[WebSocket] Notificação recebida:', notification);
            handleNewNotification(notification);
          });
          
          client.subscribe(`/user/${currentUser.email}/topic/notification-summary`, (message) => {
            const newSummary = JSON.parse(message.body);
            console.log('[WebSocket] Resumo recebido:', newSummary);
            setSummary(newSummary);
            setUnreadCount(newSummary.unreadCount); 
          });

          if (notifications.length === 0 && summary.totalCount === 0) {
            loadInitialData();
          }
        },
        onStompError: (frame) => {
          console.error('[WebSocket] Erro STOMP:', frame);
          setConnected(false);
        },
        onWebSocketClose: () => {
          console.log('[WebSocket] Conexão fechada.');
          setConnected(false);
        },
        onWebSocketError: (error) => {
          console.error('[WebSocket] Erro WebSocket:', error);
          setConnected(false);
        }
      });

      client.activate();
      setStompClient(client);
    } catch (error) {
      console.error('Erro ao configurar WebSocket:', error); 
      setConnected(false);
    }
  }, [isAuthenticated, currentUser, stompClient, APP_CONFIG.features.enableWebSocket, APP_CONFIG.api.websocketUrl, loadInitialData, notifications.length, summary.totalCount]); //

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadInitialData();
      setupWebSocket(); 
    } else {
      if (stompClient?.active) {
        stompClient.deactivate();
        setStompClient(null);
      }
      setNotifications([]);
      setSummary({ unreadCount: 0, totalCount: 0, hasUrgent: false, documentsCount: 0, commentsCount: 0, approvalsCount: 0 });
      setUnreadCount(0);
      setSettings(null);
      setConnected(false);
    }
    return () => {
      if (stompClient?.active) {
        stompClient.deactivate();
        console.log('[WebSocket] Cliente desativado no cleanup.');
      }
    };
  }, [isAuthenticated, currentUser, loadInitialData, setupWebSocket, stompClient]);


  const handleNewNotification = (notification) => {
    const processedNotification = { ...notification, isNew: true, createdAt: notification.createdAt || new Date().toISOString() };
    
    setNotifications(prev => [processedNotification, ...prev.slice(0, 49)]); 
    
    setUnreadCount(prev => prev + 1);
    if (notification.priority === 'URGENT') {
      setSummary(prev => ({ ...prev, hasUrgent: true, unreadCount: prev.unreadCount +1, totalCount: prev.totalCount + 1}));
    } else {
      setSummary(prev => ({ ...prev, unreadCount: prev.unreadCount +1, totalCount: prev.totalCount + 1}));
    }


    if (settings?.browserEnabled && shouldShowNotification(notification)) {
      const icon = getNotificationIcon(notification.type); //
      const displayTitle = `${icon} ${notification.title}`;

      const toastMap = {
        'URGENT': toast.error,
        'HIGH': toast.warn,
        'NORMAL': toast.info,
        'LOW': toast
      };
      
      (toastMap[notification.priority] || toast)(displayTitle, {
        position: "top-right",
        autoClose: getAutoCloseTime(notification.priority),
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo192.png', 
            tag: notification.id?.toString()
          });
        } catch (error) {
          console.warn('Erro ao exibir notificação do navegador:', error);
        }
      }
    }
  };

  const shouldShowNotification = (notification) => {
    if (!settings?.browserEnabled) return false;
    const type = notification.type?.toString() || ""; 
    if (type.includes('DOCUMENT') || type.includes('VERSION')) return settings.browserDocumentUpdates !== false;
    if (type.includes('COMMENT')) return settings.browserComments !== false;
    if (type.includes('APPROVED') || type.includes('REJECTED')) return settings.browserApprovals !== false;
    return true; 
  };

  const getAutoCloseTime = (priority) => {
    const times = { 'URGENT': 8000, 'HIGH': 6000, 'NORMAL': 4000, 'LOW': 3000 };
    return times[priority] || 3000;
  };

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId); //
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, isNew: false } : n)
      );
      const newSummary = await notificationService.getNotificationSummary(); //
      setSummary(newSummary);
      setUnreadCount(newSummary.unreadCount);
    } catch (error) {
      console.error('Erro marcar como lida:', error);
      toast.error("Falha ao marcar como lida.");
    }
  }, []); 

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(); //
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isNew: false })));
      const newSummary = await notificationService.getNotificationSummary(); //
      setSummary(newSummary);
      setUnreadCount(newSummary.unreadCount);
    } catch (error) {
      console.error('Erro marcar todas como lidas:', error);
      toast.error("Falha ao marcar todas como lidas.");
    }
  }, []); 

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId); //
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const newSummary = await notificationService.getNotificationSummary(); //
      setSummary(newSummary);
      setUnreadCount(newSummary.unreadCount);
    } catch (error) {
      console.error('Erro deletar notificação:', error);
      toast.error("Falha ao deletar.");
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = await notificationService.updateNotificationSettings(newSettings); //
      setSettings(updatedSettings);
      toast.success("Configurações salvas!");
      return updatedSettings;
    } catch (error) {
      console.error('Erro atualizar configurações:', error);
      toast.error("Falha ao salvar configurações.");
      throw error;
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.warn("Seu navegador não suporta notificações desktop.");
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success("Permissão de notificação concedida!");
      } else {
        toast.warn("Permissão de notificação negada ou ignorada.");
      }
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      toast.error("Erro ao solicitar permissão.");
      return false;
    }
  };

  const loadAllHistoricalNotifications = useCallback(async (page = 0, size = 20) => {
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications(page, size); //
      return data; 
    } catch (error) {
      console.error('Erro carregar histórico:', error);
      toast.error("Falha ao carregar histórico de notificações.");
      throw error; 
    } finally {
      setLoading(false);
    }
  }, []);


  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, summary, settings, loading, connected,
      markAsRead, markAllAsRead, deleteNotification, updateSettings, 
      loadInitialData, 
      loadAllHistoricalNotifications, 
      requestNotificationPermission
    }}>
      {children}
    </NotificationContext.Provider>
  );
};