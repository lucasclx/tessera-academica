import api from './api';

const notificationService = {
  // Buscar resumo das notificações
  getNotificationSummary: async () => {
    try {
      const response = await api.get('/notifications/summary');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar resumo das notificações:', error);
      throw error;
    }
  },

  // Buscar notificações não lidas
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/notifications/unread');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      throw error;
    }
  },

  // Buscar todas as notificações com paginação
  getAllNotifications: async (page = 0, size = 20) => {
    try {
      const response = await api.get(`/notifications?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar todas as notificações:', error);
      throw error;
    }
  },

  // Marcar notificação específica como lida
  markAsRead: async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  },

  // Marcar todas as notificações como lidas
  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      throw error;
    }
  },

  // Deletar notificação
  deleteNotification: async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      throw error;
    }
  },

  // Buscar configurações de notificação
  getNotificationSettings: async () => {
    try {
      const response = await api.get('/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar configurações de notificação:', error);
      // Retorna configurações padrão em caso de erro
      return {
        emailEnabled: true,
        emailDocumentUpdates: true,
        emailComments: true,
        emailApprovals: true,
        browserEnabled: true,
        browserDocumentUpdates: true,
        browserComments: true,
        browserApprovals: true,
        digestFrequency: 'DAILY',
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      };
    }
  },

  // Atualizar configurações de notificação
  updateNotificationSettings: async (settings) => {
    try {
      const response = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar configurações de notificação:', error);
      throw error;
    }
  }
};

export default notificationService;