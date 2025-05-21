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
  }
};

export default adminService;