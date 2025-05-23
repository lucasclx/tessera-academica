import api from './api';

const adminService = {
  getPendingRegistrations: async (page = 0, size = 10) => {
    try {
      const response = await api.get(`/admin/registrations?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar solicitações pendentes:', error);
      throw error;
    }
  },
  
  getRegistrationDetails: async (id) => {
    try {
      const response = await api.get(`/admin/registrations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes da solicitação:', error);
      throw error;
    }
  },
  
  approveRegistration: async (id, adminNotes = '') => {
    try {
      const response = await api.put(`/admin/registrations/${id}/approve`, { 
        adminNotes: adminNotes 
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      throw error;
    }
  },
  
  rejectRegistration: async (id, rejectionReason) => {
    if (!rejectionReason) {
      throw new Error('Motivo da rejeição é obrigatório');
    }
    
    try {
      const response = await api.put(`/admin/registrations/${id}/reject`, { 
        rejectionReason: rejectionReason 
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      throw error;
    }
  },
  
  // Função para obter estatísticas para o dashboard
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      // Retorna valores padrão em caso de erro
      return {
        totalUsers: 0,
        totalStudents: 0,
        totalAdvisors: 0,
        pendingRegistrations: 0
      };
    }
  },
  
  // Função para gerenciar usuários
  getUsers: async (page = 0, size = 10, status = null) => {
    try {
      let url = `/admin/users?page=${page}&size=${size}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  },
  
  updateUserStatus: async (userId, statusUpdateDTO) => {
    try {
      // Garantir que o DTO tem os campos corretos conforme backend
      if (!statusUpdateDTO || !statusUpdateDTO.status) {
        throw new Error('Status é obrigatório para atualização');
      }
      
      const response = await api.put(`/admin/users/${userId}/status`, statusUpdateDTO);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error);
      throw error;
    }
  }
};

export default adminService;