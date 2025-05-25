// src/services/index.js - SERVICES CONSOLIDADOS
import axios from 'axios';

// API CONFIGURAÇÃO CONSOLIDADA
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// FACTORY PARA CRIAR SERVICES PADRONIZADOS
const createService = (baseEndpoint) => ({
  create: async (data) => {
    const response = await api.post(baseEndpoint, data);
    return response.data;
  },
  
  get: async (id) => {
    const response = await api.get(`${baseEndpoint}/${id}`);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`${baseEndpoint}/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`${baseEndpoint}/${id}`);
    return { success: true };
  },
  
  list: async (params = {}) => {
    const response = await api.get(baseEndpoint, { params });
    return response.data;
  }
});

// AUTH SERVICE CONSOLIDADO
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => localStorage.removeItem('token'),
  isAuthenticated: () => !!localStorage.getItem('token'),
  getToken: () => localStorage.getItem('token')
};

// DOCUMENT SERVICE CONSOLIDADO
export const documentService = {
  ...createService('/documents'),
  
  createDocument: async (documentData) => {
    if (!documentData.title?.trim()) throw new Error('Título é obrigatório');
    if (!documentData.studentId) throw new Error('ID do estudante é obrigatório');
    if (!documentData.advisorId) throw new Error('Orientador é obrigatório');
    
    const response = await api.post('/documents', documentData);
    return response.data;
  },
  
  getDocument: async (id) => {
    if (!id) throw new Error('ID inválido');
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  getMyDocumentsPaged: async (page = 0, size = 10, searchTerm = '', statusFilter = 'ALL', sortBy = 'updatedAt', sortOrder = 'desc') => {
    const params = new URLSearchParams({
      page, size, sort: `${sortBy},${sortOrder}`
    });
    if (searchTerm) params.append('searchTerm', searchTerm);
    if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
    
    const response = await api.get(`/documents/student?${params.toString()}`);
    return response.data;
  },
  
  getMyAdvisingDocumentsPaged: async (page = 0, size = 10, searchTerm = '', statusFilter = 'ALL', sortBy = 'updatedAt', sortOrder = 'desc') => {
    const params = new URLSearchParams({
      page, size, sort: `${sortBy},${sortOrder}`
    });
    if (searchTerm) params.append('searchTerm', searchTerm);
    if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);

    const response = await api.get(`/documents/advisor?${params.toString()}`);
    return response.data;
  },
  
  updateDocument: async (id, documentData) => {
    if (!id) throw new Error('ID inválido');
    const response = await api.put(`/documents/${id}`, documentData);
    return response.data;
  },
  
  changeStatus: async (id, status, reason = null) => {
    if (!id || !status?.trim()) throw new Error('ID e status são obrigatórios');
    const payload = reason ? { reason } : {};
    const response = await api.put(`/documents/${id}/status/${status}`, payload);
    return response.data;
  },
  
  deleteDocument: async (id) => {
    if (!id) throw new Error('ID inválido');
    await api.delete(`/documents/${id}`);
    return { success: true };
  }
};

// VERSION SERVICE CONSOLIDADO
export const versionService = {
  ...createService('/versions'),
  
  createVersion: async (versionData) => {
    const response = await api.post('/versions', versionData);
    return response.data;
  },
  
  getVersion: async (id) => {
    const response = await api.get(`/versions/${id}`);
    return response.data;
  },
  
  getVersionsByDocument: async (documentId) => {
    const response = await api.get(`/versions/document/${documentId}`);
    return response.data;
  },
  
  getDiffBetweenVersions: async (v1Id, v2Id) => {
    const response = await api.get(`/versions/diff/${v1Id}/${v2Id}`);
    return response.data;
  }
};

// COMMENT SERVICE CONSOLIDADO
export const commentService = {
  ...createService('/comments'),
  
  createComment: async (commentData) => {
    const response = await api.post('/comments', commentData);
    return response.data;
  },
  
  getCommentsByVersion: async (versionId) => {
    const response = await api.get(`/comments/version/${versionId}`);
    return response.data;
  },
  
  resolveComment: async (id) => {
    const response = await api.put(`/comments/${id}/resolve`);
    return response.data;
  }
};

// USER SERVICE CONSOLIDADO
export const userService = {
  ...createService('/users'),
  
  getApprovedAdvisors: async () => {
    const response = await api.get('/users/advisors');
    return response.data;
  }
};

// ADMIN SERVICE CONSOLIDADO
export const adminService = {
  ...createService('/admin'),
  
  getPendingRegistrations: async (page = 0, size = 10) => {
    const response = await api.get(`/admin/registrations?page=${page}&size=${size}`);
    return response.data;
  },
  
  getRegistrationDetails: async (id) => {
    const response = await api.get(`/admin/registrations/${id}`);
    return response.data;
  },
  
  approveRegistration: async (id, adminNotes = '') => {
    const response = await api.put(`/admin/registrations/${id}/approve`, { adminNotes });
    return response.data;
  },
  
  rejectRegistration: async (id, rejectionReason) => {
    if (!rejectionReason) throw new Error('Motivo da rejeição é obrigatório');
    const response = await api.put(`/admin/registrations/${id}/reject`, { rejectionReason });
    return response.data;
  },
  
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      return { totalUsers: 0, totalStudents: 0, totalAdvisors: 0, pendingRegistrations: 0 };
    }
  }
};

// NOTIFICATION SERVICE CONSOLIDADO
export const notificationService = {
  ...createService('/notifications'),
  
  getNotificationSummary: async () => {
    const response = await api.get('/notifications/summary');
    return response.data;
  },

  getUnreadNotifications: async () => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  getAllNotifications: async (page = 0, size = 20) => {
    const response = await api.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    await api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all');
  },

  deleteNotification: async (notificationId) => {
    await api.delete(`/notifications/${notificationId}`);
  },

  getNotificationSettings: async () => {
    try {
      const response = await api.get('/notifications/settings');
      return response.data;
    } catch (error) {
      return {
        emailEnabled: true, emailDocumentUpdates: true, emailComments: true, emailApprovals: true,
        browserEnabled: true, browserDocumentUpdates: true, browserComments: true, browserApprovals: true,
        digestFrequency: 'DAILY', quietHoursStart: '22:00', quietHoursEnd: '08:00'
      };
    }
  },

  updateNotificationSettings: async (settings) => {
    const response = await api.put('/notifications/settings', settings);
    return response.data;
  }
};

// EXPORTS
export { api };
export default {
  api, authService, documentService, versionService, 
  commentService, userService, adminService, notificationService
};
