// src/providers/WebSocketProvider.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { Notification } from '../lib/api';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (destination: string, body: any) => void;
  subscribe: (destination: string, callback: (message: any) => void) => () => void;
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

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (isAuthenticated && token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, user]);

  const connect = () => {
    if (clientRef.current?.connected) {
      return;
    }

    try {
      const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/ws`);
      
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          if (import.meta.env.DEV) {
            console.log('WebSocket:', str);
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setReconnectAttempts(0);
          
          // Subscribe to user-specific notifications
          subscribeToNotifications();
          
          // Show connection success (only after reconnect)
          if (reconnectAttempts > 0) {
            toast.success('Reconectado ao servidor');
          }
        },
        onDisconnect: () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        },
        onStompError: (frame) => {
          console.error('WebSocket error:', frame);
          setIsConnected(false);
          
          // Attempt reconnection
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }, delay);
          } else {
            toast.error('Erro de conexão. Recarregue a página para tentar novamente.');
          }
        },
      });

      clientRef.current = client;
      client.activate();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Clear all subscriptions
    subscriptionsRef.current.clear();

    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
    }
    
    clientRef.current = null;
    setIsConnected(false);
    setReconnectAttempts(0);
  };

  const subscribeToNotifications = () => {
    if (!clientRef.current?.connected || !user) return;

    // Subscribe to personal notifications
    const notificationDestination = `/user/${user.email}/topic/notifications`;
    const summaryDestination = `/user/${user.email}/topic/notification-summary`;

    subscribe(notificationDestination, (notification: Notification) => {
      handleNewNotification(notification);
    });

    subscribe(summaryDestination, (summary: any) => {
      // Update notification count in header or store
      // This could be handled by a notification store/context
      console.log('Notification summary updated:', summary);
    });
  };

  const handleNewNotification = (notification: Notification) => {
    // Show toast notification
    const isUrgent = notification.priority === 'URGENT';
    const icon = getNotificationIcon(