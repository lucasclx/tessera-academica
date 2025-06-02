// src/components/Notifications/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { notificationsApi, Notification } from '../../lib/api';
import { toast } from 'react-hot-toast';
import NotificationSettings from './NotificationSettings';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    unreadCount: 0,
    totalCount: 0,
    hasUrgent: false,
    documentsCount: 0,
    commentsCount: 0,
    approvalsCount: 0,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('unread');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadSummary();
    }
  }, [isOpen, activeTab]);

  const loadNotifications = async (page = 0, append = false) => {
    try {
      setLoading(true);
      
      let data: Notification[];
      if (activeTab === 'unread') {
        data = await notificationsApi.getUnread();
        setHasMore(false); // Unread is always a single call
      } else {
        const response = await notificationsApi.getAll(page, 20);
        data = response.content;
        setHasMore(page < response.totalPages - 1);
      }
      
      if (append) {
        setNotifications(prev => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      setCurrentPage(page);
    } catch (error) {
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await notificationsApi.getSummary();
      setSummary(summaryData);
    } catch (error) {
      // Silent fail for summary
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      loadSummary(); // Refresh summary
    } catch (error) {
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      loadSummary();
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await notificationsApi.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      loadSummary();
      toast.success('Notificação excluída');
    } catch (error) {
      toast.error('Erro ao excluir notificação');
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(currentPage + 1, true);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
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
      USER_APPROVED: '✅',
      USER_REJECTED: '❌',
      DEADLINE_APPROACHING: '⏰',
      DEADLINE_OVERDUE: '🚨',
      TASK_ASSIGNED: '📋',
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-red-500 bg-red-50';
      case 'HIGH': return 'border-l-orange-500 bg-orange-50';
      case 'NORMAL': return 'border-l-blue-500 bg-blue-50';
      case 'LOW': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-0 right-0 h-full w-full max-w-md ml-auto bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Notificações</h2>
            {summary.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {summary.unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Summary */}
        {summary.unreadCount > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                {summary.unreadCount} não lida(s)
                {summary.hasUrgent && (
                  <span className="ml-2 text-red-600 font-medium">• Urgente</span>
                )}
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Marcar todas como lidas
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-blue-600">
              <div>📄 {summary.documentsCount} documentos</div>
              <div>💬 {summary.commentsCount} comentários</div>
              <div>✅ {summary.approvalsCount} aprovações</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('unread')}
              className={`${
                activeTab === 'unread'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } flex-1 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm text-center`}
            >
              Não Lidas ({summary.unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } flex-1 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm text-center`}
            >
              Todas
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } flex-1 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm text-center`}
            >
              <Cog6ToothIcon className="h-4 w-4 mx-auto" />
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'settings' ? (
            <NotificationSettings />
          ) : (
            <div className="divide-y divide-gray-200">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {activeTab === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === 'unread' 
                      ? 'Você está em dia com suas notificações!'
                      : 'Suas notificações aparecerão aqui.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.isRead ? 'bg-blue-50' : 'bg-white'
                      } hover:bg-gray-50`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>{formatTimeAgo(notification.createdAt)}</span>
                                {notification.triggeredByName && (
                                  <span>Por {notification.triggeredByName}</span>
                                )}
                                {notification.priority === 'URGENT' && (
                                  <span className="text-red-600 font-medium">Urgente</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-gray-400 hover:text-green-600"
                                  title="Marcar como lida"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Excluir"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Load More */}
                  {hasMore && activeTab === 'all' && (
                    <div className="p-4 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="btn btn-secondary btn-sm"
                      >
                        {loading ? 'Carregando...' : 'Carregar mais'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;