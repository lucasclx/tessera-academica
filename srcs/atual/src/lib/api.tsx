// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para adicionar token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Sessão expirada. Faça login novamente.');
        } else if (error.response?.status === 403) {
          toast.error('Você não tem permissão para realizar esta ação.');
        } else if (error.response?.status >= 500) {
          toast.error('Erro interno do servidor. Tente novamente mais tarde.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          toast.error(error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

// Instância global do cliente API
export const api = new ApiClient();

// Tipos para as principais entidades
export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registrationDate: string;
  approvalDate?: string;
}

export interface Document {
  id: number;
  title: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVISION' | 'APPROVED' | 'FINALIZED';
  studentId: number;
  advisorId: number;
  studentName: string;
  advisorName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  versionCount: number;
}

export interface Version {
  id: number;
  documentId: number;
  versionNumber: string;
  commitMessage: string;
  content: string;
  diffFromPrevious?: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  commentCount: number;
}

export interface Comment {
  id: number;
  versionId: number;
  content: string;
  startPosition?: number;
  endPosition?: number;
  resolved: boolean;
  resolvedAt?: string;
  resolvedById?: number;
  resolvedByName?: string;
  userId: number;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isRead: boolean;
  entityId?: number;
  entityType?: string;
  actionUrl?: string;
  icon?: string;
  priorityColor?: string;
  triggeredById?: number;
  triggeredByName?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  timeAgo?: string;
  isNew: boolean;
  isExpired: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
  roles: string[];
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  institution: string;
  department: string;
  justification: string;
}

// Funções de API específicas
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<string>('/auth/register', data),
};

export const documentsApi = {
  getAll: (page = 0, size = 10, search = '', status = 'ALL') => 
    api.get<{ content: Document[]; totalElements: number; totalPages: number }>(`/documents/student?page=${page}&size=${size}&searchTerm=${search}&status=${status}`),
  
  getAdvisorDocuments: (page = 0, size = 10, search = '', status = 'ALL') => 
    api.get<{ content: Document[]; totalElements: number; totalPages: number }>(`/documents/advisor?page=${page}&size=${size}&searchTerm=${search}&status=${status}`),
  
  getById: (id: number) => api.get<Document>(`/documents/${id}`),
  create: (data: Partial<Document>) => api.post<Document>('/documents', data),
  update: (id: number, data: Partial<Document>) => api.put<Document>(`/documents/${id}`, data),
  delete: (id: number) => api.delete(`/documents/${id}`),
  changeStatus: (id: number, status: string, reason?: string) => 
    api.put<Document>(`/documents/${id}/status/${status}`, reason),
};

export const versionsApi = {
  getByDocument: (documentId: number) => api.get<Version[]>(`/versions/document/${documentId}`),
  getById: (id: number) => api.get<Version>(`/versions/${id}`),
  create: (data: Partial<Version>) => api.post<Version>('/versions', data),
  getDiff: (v1Id: number, v2Id: number) => api.get<string>(`/versions/diff/${v1Id}/${v2Id}`),
};

export const commentsApi = {
  getByVersion: (versionId: number) => api.get<Comment[]>(`/comments/version/${versionId}`),
  create: (data: Partial<Comment>) => api.post<Comment>('/comments', data),
  update: (id: number, data: Partial<Comment>) => api.put<Comment>(`/comments/${id}`, data),
  resolve: (id: number) => api.put<Comment>(`/comments/${id}/resolve`),
  delete: (id: number) => api.delete(`/comments/${id}`),
};

export const notificationsApi = {
  getAll: (page = 0, size = 20) => 
    api.get<{ content: Notification[]; totalElements: number; totalPages: number }>(`/notifications?page=${page}&size=${size}`),
  
  getUnread: () => api.get<Notification[]>('/notifications/unread'),
  getSummary: () => api.get<{
    unreadCount: number;
    totalCount: number;
    hasUrgent: boolean;
    documentsCount: number;
    commentsCount: number;
    approvalsCount: number;
  }>('/notifications/summary'),
  
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

export const usersApi = {
  getAdvisors: () => api.get<{ id: number; name: string }[]>('/users/advisors'),
  getStudents: () => api.get<{ id: number; name: string; email: string }[]>('/users/students'),
  getProfile: () => api.get<User>('/users/profile'),
};