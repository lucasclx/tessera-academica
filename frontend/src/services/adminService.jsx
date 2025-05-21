import api from './api';

const adminService = {
  getPendingRegistrations: async (page = 0, size = 10) => {
    const response = await api.get(`/admin/registrations?page=${page}&size=${size}`);
    return response.data;
  },
  
  getRegistrationDetails: async (id) => {
    const response = await api.get(`/admin/registrations/${id}`);
    return response.data;
  },
  
  approveRegistration: async (id, notes) => {
    const response = await api.put(`/admin/registrations/${id}/approve`, { adminNotes: notes });
    return response.data;
  },
  
  rejectRegistration: async (id, reason) => {
    const response = await api.put(`/admin/registrations/${id}/reject`, { rejectionReason: reason });
    return response.data;
  },
  
  // Função para obter estatísticas para o dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  // Função para gerenciar usuários
  getUsers: async (page = 0, size = 10, status = null) => {
    let url = `/admin/users?page=${page}&size=${size}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await api.get(url);
    return response.data;
  },
  
  updateUserStatus: async (userId, status, reason = null) => {
    const response = await api.put(`/admin/users/${userId}/status`, { status, reason });
    return response.data;
  }
};

export default adminService;