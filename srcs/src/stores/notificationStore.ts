import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Notification, NotificationSummary, NotificationSettings } from '@/types'
import { notificationApi } from '@/services/api'
import { connectWebSocket, disconnectWebSocket } from '@/services/websocket'
import toast from 'react-hot-toast'

interface NotificationState {
  notifications: Notification[]
  summary: NotificationSummary | null
  settings: NotificationSettings | null
  connected: boolean
  loading: boolean
  error: string | null
  
  // Actions
  connect: () => void
  disconnect: () => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
  loadNotifications: () => Promise<void>
  loadSummary: () => Promise<void>
  loadSettings: () => Promise<void>
  updateSettings: (settings: NotificationSettings) => Promise<void>
  updateSummary: (summary: NotificationSummary) => void
}

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    summary: null,
    settings: null,
    connected: false,
    loading: false,
    error: null,

    connect: () => {
      if (get().connected) return
      
      try {
        connectWebSocket({
          onNotification: (notification: Notification) => {
            get().addNotification(notification)
            
            // Mostrar toast para notificações importantes
            if (notification.priority === 'HIGH' || notification.priority === 'URGENT') {
              toast(notification.title, {
                icon: notification.icon || '🔔',
                duration: 6000,
              })
            }
          },
          onSummaryUpdate: (summary: NotificationSummary) => {
            get().updateSummary(summary)
          },
          onConnect: () => {
            set({ connected: true })
          },
          onDisconnect: () => {
            set({ connected: false })
          },
        })
      } catch (error) {
        console.error('Erro ao conectar WebSocket de notificações:', error)
      }
    },

    disconnect: () => {
      disconnectWebSocket()
      set({ connected: false })
    },

    addNotification: (notification: Notification) => {
      set(state => ({
        notifications: [notification, ...state.notifications.slice(0, 49)], // Manter apenas 50 notificações
      }))
      
      // Atualizar summary
      get().loadSummary()
    },

    markAsRead: async (id: number) => {
      try {
        await notificationApi.markAsRead(id)
        
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        }))
        
        // Atualizar summary
        get().loadSummary()
        
      } catch (error: any) {
        console.error('Erro ao marcar notificação como lida:', error)
        toast.error('Erro ao marcar notificação como lida')
      }
    },

    markAllAsRead: async () => {
      try {
        await notificationApi.markAllAsRead()
        
        set(state => ({
          notifications: state.notifications.map(n => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString()
          }))
        }))
        
        // Atualizar summary
        get().loadSummary()
        
        toast.success('Todas as notificações foram marcadas como lidas')
        
      } catch (error: any) {
        console.error('Erro ao marcar todas as notificações como lidas:', error)
        toast.error('Erro ao marcar notificações como lidas')
      }
    },

    deleteNotification: async (id: number) => {
      try {
        await notificationApi.deleteNotification(id)
        
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
        
        // Atualizar summary
        get().loadSummary()
        
      } catch (error: any) {
        console.error('Erro ao deletar notificação:', error)
        toast.error('Erro ao deletar notificação')
      }
    },

    loadNotifications: async () => {
      set({ loading: true, error: null })
      
      try {
        const notifications = await notificationApi.getUnreadNotifications()
        set({ 
          notifications, 
          loading: false 
        })
        
      } catch (error: any) {
        console.error('Erro ao carregar notificações:', error)
        set({ 
          loading: false, 
          error: error.message || 'Erro ao carregar notificações' 
        })
      }
    },

    loadSummary: async () => {
      try {
        const summary = await notificationApi.getSummary()
        set({ summary })
        
      } catch (error: any) {
        console.error('Erro ao carregar resumo de notificações:', error)
      }
    },

    loadSettings: async () => {
      try {
        const settings = await notificationApi.getSettings()
        set({ settings })
        
      } catch (error: any) {
        console.error('Erro ao carregar configurações de notificação:', error)
      }
    },

    updateSettings: async (newSettings: NotificationSettings) => {
      try {
        const settings = await notificationApi.updateSettings(newSettings)
        set({ settings })
        
        toast.success('Configurações de notificação atualizadas')
        
      } catch (error: any) {
        console.error('Erro ao atualizar configurações:', error)
        toast.error('Erro ao atualizar configurações de notificação')
        throw error
      }
    },

    updateSummary: (summary: NotificationSummary) => {
      set({ summary })
    },
  }))
)

// Hooks utilitários
export const useNotifications = () => {
  const { notifications, summary, loading } = useNotificationStore()
  return {
    notifications,
    summary,
    loading,
    unreadCount: summary?.unreadCount || 0,
    hasUrgent: summary?.hasUrgent || false,
  }
}

export const useNotificationActions = () => {
  const { 
    connect, 
    disconnect, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    loadNotifications,
    loadSummary,
    loadSettings,
    updateSettings 
  } = useNotificationStore()
  
  return {
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
    loadSummary,
    loadSettings,
    updateSettings,
  }
}