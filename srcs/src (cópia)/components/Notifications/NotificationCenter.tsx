// src/components/Notifications/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
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
import { useNotificationSummaryStore } from '../../store/notificationStore'; // Para decrementar a contagem ao ler

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { summary, setSummary: setGlobalSummary, decrementUnreadCount } = useNotificationSummaryStore(); // Usar o summary da store e decrementUnreadCount
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('unread');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate(); // Hook para navegação

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // O resumo agora vem da store e é atualizado via WebSocket,
      // mas uma carga inicial aqui pode ser útil se a store não estiver sincronizada ainda.
      // loadSummary(); // Pode ser removido se a store for confiável
    }
  }, [isOpen, activeTab]); // Dependência em activeTab para recarregar ao mudar de aba

  const loadNotifications = async (page = 0, append = false) => {
    try {
      setLoading(true);
      
      let data: Notification[];
      let responseMeta: { totalPages: number };

      if (activeTab === 'unread') {
        data = await notificationsApi.getUnread();
        responseMeta = { totalPages: 1 }; // Unread é sempre uma única chamada, sem paginação real
        setHasMore(false);
      } else {
        const response = await notificationsApi.getAll(page, 20);
        data = response.content;
        responseMeta = { totalPages: response.totalPages };
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

  // loadSummary pode ser removido se a store for a única fonte da verdade para o resumo
  // const loadSummary = async () => {
  //   try {
  //     const summaryData = await notificationsApi.getSummary();
  //     setGlobalSummary(summaryData); // Atualiza a store global
  //   } catch (error) {
  //     // Falha silenciosa para resumo, pois já temos a store
  //     console.error("Erro ao carregar resumo inicial:", error);
  //   }
  // };

  const handleMarkAsRead = async (notificationId: number, wasUnread: boolean) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      if (wasUnread) {
        decrementUnreadCount(); // Decrementa da store global
      }
      // loadSummary(); // Recarregar o resumo através da API não é mais necessário, a store é decrementada
    } catch (error) {
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      const unreadCountBefore = summary?.unreadCount || 0;
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      // Atualiza a store para refletir que todas foram lidas
      if (summary) {
        setGlobalSummary({ ...summary, unreadCount: 0 });
      }
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const handleDelete = async (notificationId: number, wasUnread: boolean) => {
    try {
      await notificationsApi.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread && summary && summary.unreadCount > 0) {
        decrementUnreadCount(); // Decrementa da store global se a notificação excluída não estava lida
      } else if (summary) {
        // Se não estava não lida, apenas atualiza a contagem total no resumo (se necessário)
        // Esta lógica pode ser mais complexa se a contagem total na store for importante
        setGlobalSummary({ ...summary, totalCount: Math.max(0, summary.totalCount - 1) });
      }
      toast.success('Notificação excluída');
    } catch (error) {
      toast.error('Erro ao excluir notificação');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida ao clicar, se não estiver lida
    if (!notification.isRead) {
      handleMarkAsRead(notification.id, true);
    }

    // Navegar se houver actionUrl
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    onClose(); // Fechar a central de notificações após o clique
  };


  const handleLoadMore = () => {
    if (hasMore && !loading && activeTab === 'all') {
      loadNotifications(currentPage + 1, true);
    }
  };

  const getNotificationIcon = (type: string) => {
    // ... (código getNotificationIcon existente, sem alterações)
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
      COLLABORATOR_ADDED: '👥',
      COLLABORATOR_REMOVED: '👤➖',
      COLLABORATOR_ROLE_CHANGED: '🧑‍🔧',
    };
    return icons[type as keyof typeof icons] || '📢';
  };

  const getPriorityColor = (priority: string) => {
    // ... (código getPriorityColor existente, sem alterações)
    switch (priority) {
      case 'URGENT': return 'border-l-red-500 bg-red-50';
      case 'HIGH': return 'border-l-orange-500 bg-orange-50';
      case 'NORMAL': return 'border-l-blue-500 bg-blue-50';
      case 'LOW': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    // ... (código formatTimeAgo existente, sem alterações)
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
      <div className="relative top-0 right-0 h-full w-full max-w-md ml-auto bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Notificações</h2>
            {(summary && summary.unreadCount > 0) && (
              <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
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
        {(summary && summary.unreadCount > 0 && activeTab !== 'settings') && (
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
            { (summary.documentsCount > 0 || summary.commentsCount > 0 || summary.approvalsCount > 0) &&
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-blue-600">
                {summary.documentsCount > 0 && <div>📄 {summary.documentsCount} docs</div>}
                {summary.commentsCount > 0 && <div>💬 {summary.commentsCount} coments</div>}
                {summary.approvalsCount > 0 && <div>✅ {summary.approvalsCount} aprovações</div>}
              </div>
            }
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => { setActiveTab('unread'); loadNotifications(0, false); }}
              className={`${
                activeTab === 'unread'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } flex-1 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm text-center`}
            >
              Não Lidas ({(summary?.unreadCount || 0)})
            </button>
            <button
              onClick={() => { setActiveTab('all'); loadNotifications(0, false); }}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                      } hover:bg-gray-50 cursor-pointer`} // Adicionado cursor-pointer
                      onClick={() => handleNotificationClick(notification)} // Adicionado onClick
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 text-lg pt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
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
                            {/* Mover botões para dentro do div clicável principal ou remover daqui se o clique principal for suficiente */}
                            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Evita que o handleNotificationClick seja chamado duas vezes
                                    handleMarkAsRead(notification.id, true);
                                  }}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-100"
                                  title="Marcar como lida"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Evita que o handleNotificationClick seja chamado
                                  handleDelete(notification.id, !notification.isRead);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100"
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