// context/index.js - CONTEXTS CONSOLIDADOS E OTIMIZADOS
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import * as StompJs from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';
import { authService, notificationService } from '../services';
import { APP_CONFIG, getNotificationIcon } from '../utils';

// ============================================================================
// AUTH CONTEXT
// ============================================================================

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          if (decodedToken.exp > Date.now() / 1000) {
            setCurrentUser({
              id: decodedToken.id,
              name: decodedToken.name,
              email: decodedToken.sub,
              roles: decodedToken.roles.split(',')
            });
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { token, id, name, roles } = response;
      
      localStorage.setItem('token', token);
      const user = { id, name, email, roles };
      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao realizar login';
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao realizar cadastro';
      throw new Error(message);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const hasRole = useCallback((role) => {
    return currentUser?.roles?.includes(`ROLE_${role}`) || false;
  }, [currentUser]);

  const value = useMemo(() => ({
    currentUser, isAuthenticated, isLoading,
    login, register, logout, hasRole
  }), [currentUser, isAuthenticated, isLoading, logout, hasRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// NOTIFICATION CONTEXT
// ============================================================================

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({
    unreadCount: 0, totalCount: 0, hasUrgent: false,
    documentsCount: 0, commentsCount: 0, approvalsCount: 0
  });
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    
    try {
      setLoading(true);
      const [unreadData, summaryData, settingsData] = await Promise.all([
        notificationService.getUnreadNotifications(),
        notificationService.getNotificationSummary(),
        notificationService.getNotificationSettings()
      ]);
      
      setNotifications(unreadData || []);
      setSummary(summaryData || {
        unreadCount: 0, totalCount: 0, hasUrgent: false,
        documentsCount: 0, commentsCount: 0, approvalsCount: 0
      });
      setSettings(settingsData);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  // Configurar WebSocket
  const setupWebSocket = useCallback(() => {
    if (!isAuthenticated || !currentUser || stompClient?.active || !APP_CONFIG.features.enableWebSocket) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const client = new StompJs.Client({
        webSocketFactory: () => new SockJS(APP_CONFIG.api.websocketUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          Login: currentUser.email
        },
        reconnectDelay: 10000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: () => {
          setConnected(true);
          console.log('[WebSocket] Conectado');
          
          // Subscrever notificações
          client.subscribe(`/user/${currentUser.email}/topic/notifications`, (message) => {
            const notification = JSON.parse(message.body);
            handleNewNotification(notification);
          });
          
          // Subscrever resumo
          client.subscribe(`/user/${currentUser.email}/topic/notification-summary`, (message) => {
            const newSummary = JSON.parse(message.body);
            setSummary(newSummary);
          });
        },
        
        onStompError: (frame) => {
          console.error('[WebSocket] Erro STOMP:', frame);
          setConnected(false);
        },
        
        onWebSocketClose: () => {
          console.log('[WebSocket] Conexão fechada');
          setConnected(false);
        }
      });

      client.activate();
      setStompClient(client);
    } catch (error) {
      console.error('Erro ao configurar WebSocket:', error);
      setConnected(false);
    }
  }, [isAuthenticated, currentUser, stompClient]);

  // Manipular nova notificação
  const handleNewNotification = useCallback((notification) => {
    const processedNotification = { 
      ...notification, 
      isNew: true, 
      createdAt: notification.createdAt || new Date().toISOString() 
    };
    
    setNotifications(prev => [processedNotification, ...prev.slice(0, 49)]);
    setSummary(prev => ({
      ...prev,
      unreadCount: prev.unreadCount + 1,
      totalCount: prev.totalCount + 1,
      hasUrgent: prev.hasUrgent || notification.priority === 'URGENT'
    }));

    // Mostrar toast se habilitado
    if (settings?.browserEnabled && shouldShowNotification(notification)) {
      const icon = getNotificationIcon(notification.type);
      const toastFn = {
        'URGENT': toast.error,
        'HIGH': toast.warn,
        'NORMAL': toast.info,
        'LOW': toast
      }[notification.priority] || toast;
      
      toastFn(`${icon} ${notification.title}`, {
        autoClose: getAutoCloseTime(notification.priority)
      });

      // Notificação do navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo192.png'
          });
        } catch (error) {
          console.warn('Erro ao exibir notificação do navegador:', error);
        }
      }
    }
  }, [settings]);

  const shouldShowNotification = useCallback((notification) => {
    if (!settings?.browserEnabled) return false;
    const type = notification.type?.toString() || "";
    if (type.includes('DOCUMENT')) return settings.browserDocumentUpdates !== false;
    if (type.includes('COMMENT')) return settings.browserComments !== false;
    if (type.includes('APPROVED') || type.includes('REJECTED')) return settings.browserApprovals !== false;
    return true;
  }, [settings]);

  const getAutoCloseTime = (priority) => {
    const times = { 'URGENT': 8000, 'HIGH': 6000, 'NORMAL': 4000, 'LOW': 3000 };
    return times[priority] || 3000;
  };

  // Ações de notificação
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true, isNew: false } : n)
      );
      const newSummary = await notificationService.getNotificationSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      toast.error("Falha ao marcar como lida");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isNew: false })));
      const newSummary = await notificationService.getNotificationSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error("Falha ao marcar todas como lidas");
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const newSummary = await notificationService.getNotificationSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      toast.error("Falha ao deletar");
    }
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const updatedSettings = await notificationService.updateNotificationSettings(newSettings);
      setSettings(updatedSettings);
      toast.success("Configurações salvas!");
      return updatedSettings;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error("Falha ao salvar configurações");
      throw error;
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.warn("Seu navegador não suporta notificações desktop");
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success("Permissão de notificação concedida!");
      } else {
        toast.warn("Permissão de notificação negada");
      }
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error("Erro ao solicitar permissão");
      return false;
    }
  }, []);

  const loadAllHistoricalNotifications = useCallback(async (page = 0, size = 20) => {
    try {
      setLoading(true);
      return await notificationService.getAllNotifications(page, size);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error("Falha ao carregar histórico");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Effects
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
      setSummary({
        unreadCount: 0, totalCount: 0, hasUrgent: false,
        documentsCount: 0, commentsCount: 0, approvalsCount: 0
      });
      setSettings(null);
      setConnected(false);
    }

    return () => {
      if (stompClient?.active) {
        stompClient.deactivate();
      }
    };
  }, [isAuthenticated, currentUser, loadInitialData, setupWebSocket]);

  const value = useMemo(() => ({
    notifications,
    unreadCount: summary.unreadCount,
    summary,
    settings,
    loading,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    loadInitialData,
    loadAllHistoricalNotifications,
    requestNotificationPermission
  }), [
    notifications, summary, settings, loading, connected,
    markAsRead, markAllAsRead, deleteNotification, updateSettings,
    loadInitialData, loadAllHistoricalNotifications, requestNotificationPermission
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ============================================================================
// HOOKS CUSTOMIZADOS
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AuthContext,
  AuthProvider,
  NotificationContext,
  NotificationProvider,
  useAuth,
  useNotifications
};