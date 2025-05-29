import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Settings } from 'lucide-react'
import { useNotifications, useNotificationActions } from '@/stores/notificationStore'

const NotificationsPage = () => {
  const { notifications, loading } = useNotifications()
  const { markAsRead, markAllAsRead, deleteNotification } = useNotificationActions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">Notificações</h1>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={markAllAsRead}
            className="btn-secondary flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Marcar Todas como Lidas</span>
          </button>
          
          <button className="btn-secondary flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-secondary-200">
        {loading ? (
          <div className="p-6">Carregando notificações...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-secondary-600">
              Você está em dia com todas as suas notificações!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-secondary-50 transition-colors ${
                  !notification.isRead ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-secondary-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-secondary-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {notification.timeAgo}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-primary-600 hover:text-primary-700"
                        title="Marcar como lida"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-danger-600 hover:text-danger-700"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage