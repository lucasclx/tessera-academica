// services/index.js - SERVICES CONSOLIDADOS E OTIMIZADOS
import axios from 'axios';

// API CONFIGURAÇÃO
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// FACTORY PARA SERVICES PADRONIZADOS
const createService = (endpoint) => ({
  create: async (data) => (await api.post(endpoint, data)).data,
  get: async (id) => (await api.get(`${endpoint}/${id}`)).data,
  update: async (id, data) => (await api.put(`${endpoint}/${id}`, data)).data,
  delete: async (id) => { await api.delete(`${endpoint}/${id}`); return { success: true }; },
  list: async (params = {}) => (await api.get(endpoint, { params })).data
});

// SERVICES ESPECÍFICOS
export const authService = {
  login: async (email, password) => (await api.post('/auth/login', { email, password })).data,
  register: async (userData) => (await api.post('/auth/register', userData)).data,
  logout: () => localStorage.removeItem('token'),
  isAuthenticated: () => !!localStorage.getItem('token')
};

export const documentService = {
  ...createService('/documents'),
  
  createDocument: async (data) => {
    if (!data.title?.trim() || !data.studentId || !data.advisorId) 
      throw new Error('Campos obrigatórios: título, estudante e orientador');
    return (await api.post('/documents', data)).data;
  },
  
  getMyDocumentsPaged: async (page = 0, size = 10, search = '', status = 'ALL', sort = 'updatedAt', order = 'desc') => {
    const params = new URLSearchParams({ page, size, sort: `${sort},${order}` });
    if (search) params.append('searchTerm', search);
    if (status !== 'ALL') params.append('status', status);
    return (await api.get(`/documents/student?${params}`)).data;
  },
  
  getMyAdvisingDocumentsPaged: async (page = 0, size = 10, search = '', status = 'ALL', sort = 'updatedAt', order = 'desc') => {
    const params = new URLSearchParams({ page, size, sort: `${sort},${order}` });
    if (search) params.append('searchTerm', search);
    if (status !== 'ALL') params.append('status', status);
    return (await api.get(`/documents/advisor?${params}`)).data;
  },
  
  changeStatus: async (id, status, reason = null) => {
    const payload = reason ? { reason } : {};
    return (await api.put(`/documents/${id}/status/${status}`, payload)).data;
  }
};

export const versionService = {
  ...createService('/versions'),
  getVersionsByDocument: async (docId) => (await api.get(`/versions/document/${docId}`)).data,
  getDiffBetweenVersions: async (v1, v2) => (await api.get(`/versions/diff/${v1}/${v2}`)).data
};

export const commentService = {
  ...createService('/comments'),
  getCommentsByVersion: async (versionId) => (await api.get(`/comments/version/${versionId}`)).data,
  resolveComment: async (id) => (await api.put(`/comments/${id}/resolve`)).data
};

export const userService = {
  ...createService('/users'),
  getApprovedAdvisors: async () => (await api.get('/users/advisors')).data,
  getStudentsForCurrentAdvisorPaged: async (page = 0, size = 10, search = '') => {
    const params = new URLSearchParams({ page, size });
    if (search) params.append('search', search);
    return (await api.get(`/users/my-students?${params}`)).data;
  }
};

export const collaboratorService = {
  getDocumentCollaborators: async (docId) => (await api.get(`/documents/${docId}/collaborators`)).data,
  addCollaborator: async (docId, data) => (await api.post(`/documents/${docId}/collaborators`, data)).data,
  removeCollaborator: async (docId, collabId) => { await api.delete(`/documents/${docId}/collaborators/${collabId}`); return { success: true }; },
  updatePermissions: async (docId, collabId, permission) => (await api.put(`/documents/${docId}/collaborators/${collabId}/permissions`, permission)).data,
  updateRole: async (docId, collabId, role) => (await api.put(`/documents/${docId}/collaborators/${collabId}/role`, role)).data,
  searchUsers: async (query, role = null, excludeDocId = null) => {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (role) params.append('role', role);
    if (excludeDocId) params.append('excludeDocument', excludeDocId);
    return (await api.get(`/users/search/collaborators?${params}`)).data;
  },
  getCurrentUserPermissions: async (docId) => {
    try {
      return (await api.get(`/documents/${docId}/my-permissions`)).data;
    } catch {
      const docData = await api.get(`/documents/${docId}`);
      return {
        canRead: true,
        canWrite: docData?.data?.canEdit || false,
        canManage: docData?.data?.canManageCollaborators || false
      };
    }
  }
};

export const adminService = {
  ...createService('/admin'),
  getPendingRegistrations: async (page = 0, size = 10) => (await api.get(`/admin/registrations?page=${page}&size=${size}`)).data,
  approveRegistration: async (id, notes = '') => (await api.put(`/admin/registrations/${id}/approve`, { adminNotes: notes })).data,
  rejectRegistration: async (id, reason) => (await api.put(`/admin/registrations/${id}/reject`, { rejectionReason: reason })).data,
  getDashboardStats: async () => {
    try {
      return (await api.get('/admin/stats')).data;
    } catch {
      return { totalUsers: 0, totalStudents: 0, totalAdvisors: 0, pendingRegistrations: 0 };
    }
  }
};

export const notificationService = {
  ...createService('/notifications'),
  getNotificationSummary: async () => (await api.get('/notifications/summary')).data,
  getUnreadNotifications: async () => (await api.get('/notifications/unread')).data,
  getAllNotifications: async (page = 0, size = 20) => (await api.get(`/notifications?page=${page}&size=${size}`)).data,
  markAsRead: async (id) => await api.put(`/notifications/${id}/read`),
  markAllAsRead: async () => await api.put('/notifications/read-all'),
  deleteNotification: async (id) => await api.delete(`/notifications/${id}`),
  getNotificationSettings: async () => {
    try {
      return (await api.get('/notifications/settings')).data;
    } catch {
      return {
        emailEnabled: true, emailDocumentUpdates: true, emailComments: true, emailApprovals: true,
        browserEnabled: true, browserDocumentUpdates: true, browserComments: true, browserApprovals: true,
        digestFrequency: 'DAILY', quietHoursStart: '22:00', quietHoursEnd: '08:00'
      };
    }
  },
  updateNotificationSettings: async (settings) => (await api.put('/notifications/settings', settings)).data
};

export { api };
export default {
  api, authService, documentService, versionService, 
  commentService, userService, collaboratorService, adminService, notificationService
};