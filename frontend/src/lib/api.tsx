// src/lib/api.tsx
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// Interfaces Base
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // Current page number
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Todas as interfaces existentes permanecem as mesmas...
export interface User {
  id: number;
  name:string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  roles: string[]; // e.g., ["ROLE_STUDENT", "ROLE_ADMIN"]
  registrationDate?: string;
  approvalDate?: string;
  approvedBy?: User;
  rejectionReason?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  name: string;
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
  role: string; // "STUDENT" ou "ADVISOR"
  institution: string;
  department: string;
  justification: string;
}

export interface Document {
  id: number;
  title: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVISION' | 'APPROVED' | 'FINALIZED';
  studentId?: number;
  advisorId?: number;
  studentName: string;
  advisorName: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  versionCount: number;
  allowMultipleStudents?: boolean;
  allowMultipleAdvisors?: boolean;
  maxStudents?: number;
  maxAdvisors?: number;
}

export interface DocumentDetailDTO extends Document {
    collaborators: DocumentCollaborator[];
    canEdit: boolean;
    canManageCollaborators: boolean;
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

export interface NotificationSettings {
  id?: number;
  emailEnabled: boolean;
  emailDocumentUpdates: boolean;
  emailComments: boolean;
  emailApprovals: boolean;
  browserEnabled: boolean;
  browserDocumentUpdates: boolean;
  browserComments: boolean;
  browserApprovals: boolean;
  digestFrequency: 'NONE' | 'DAILY' | 'WEEKLY';
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
}

export interface NotificationSummary {
  unreadCount: number;
  totalCount: number;
  hasUrgent: boolean;
  documentsCount: number;
  commentsCount: number;
  approvalsCount: number;
}

export interface RegistrationRequestItem {
  id: number;
  user: User;
  institution: string;
  department: string;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
}

export interface RegistrationApprovalPayload {
  adminNotes?: string;
}

export interface RegistrationRejectionPayload {
  rejectionReason: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalAdvisors: number;
  pendingRegistrations: number;
}

export interface UserStatusUpdatePayload {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
}

export interface Advisor {
    id: number;
    name: string;
}

export interface UserSelection {
    id: number;
    name: string;
    email?: string;
    role?: string;
    department?: string;
    institution?: string;
    isActive?: boolean;
}

export interface AddCollaboratorPayload {
  userEmail: string;
  role: string;
  permission: string;
  message?: string;
}

export interface DocumentCollaborator {
  id: number;
  documentId: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  permission: string;
  addedAt: string;
  addedByName?: string;
  active: boolean;
  lastAccessAt?: string;
  canEdit: boolean;
  canComment: boolean;
  canManageCollaborators: boolean;
  canSubmitDocument: boolean;
  canApproveDocument: boolean;
  isPrimary: boolean;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Rate Limiting System
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number = 10; // máximo de 10 requests
  private readonly timeWindow: number = 60000; // por minuto

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove requests antigas (fora da janela de tempo)
    const validRequests = requests.filter(time => now - time < this.timeWindow);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getRemainingTime(key: string): number {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    const timeElapsed = Date.now() - oldestRequest;
    return Math.max(0, this.timeWindow - timeElapsed);
  }
}

// --- API Client Class ---
class ApiClient {
  private client: AxiosInstance;
  private rateLimiter = new RateLimiter();
  private retryCount = new Map<string, number>();
  private maxRetries = 3;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: 15000, // Reduzido para 15 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Rate limiting check
        const requestKey = `${config.method}-${config.url}`;
        if (!this.rateLimiter.canMakeRequest(requestKey)) {
          const remainingTime = this.rateLimiter.getRemainingTime(requestKey);
          console.warn(`Rate limit exceeded for ${requestKey}. Try again in ${Math.ceil(remainingTime / 1000)}s`);
          return Promise.reject(new Error(`Rate limit exceeded. Try again in ${Math.ceil(remainingTime / 1000)} seconds.`));
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Reset retry count on success
        const requestKey = `${response.config.method}-${response.config.url}`;
        this.retryCount.delete(requestKey);
        return response;
      },
      (error) => {
        const requestKey = `${error.config?.method}-${error.config?.url}`;
        const currentRetries = this.retryCount.get(requestKey) || 0;

        // Handle different types of errors
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Sessão expirada. Faça login novamente.');
          return Promise.reject(error);
        } 
        
        if (error.response?.status === 403) {
          toast.error(error.response?.data?.message || 'Você não tem permissão para realizar esta ação.');
          return Promise.reject(error);
        }
        
        if (error.response?.status >= 500) {
          toast.error('Erro interno do servidor. Tente novamente mais tarde.');
          return Promise.reject(error);
        }

        // Network errors or timeout
        if (!error.response) {
          if (error.code === 'ECONNABORTED') {
            toast.error('Timeout: A requisição demorou muito para responder.');
          } else if (error.message?.includes('Network Error')) {
            // Só mostra erro de rede se for a primeira tentativa para evitar spam
            if (currentRetries === 0) {
              toast.error('Erro de conexão. Verifique se o backend está rodando.');
            }
            
            // Retry logic for network errors
            if (currentRetries < this.maxRetries && error.config) {
              this.retryCount.set(requestKey, currentRetries + 1);
              
              // Wait before retry (exponential backoff)
              const delay = Math.pow(2, currentRetries) * 1000;
              return new Promise(resolve => {
                setTimeout(() => {
                  resolve(this.client.request(error.config));
                }, delay);
              });
            } else {
              toast.error(`Falha na conexão após ${this.maxRetries} tentativas. Verifique se o backend está rodando em ${this.client.defaults.baseURL}`);
            }
          } else {
            toast.error(`Erro de rede: ${error.message}`);
          }
          return Promise.reject(error);
        }

        // API errors with specific messages
        if (error.response?.data?.message) {
          // Só mostra se não é um erro repetido
          if (currentRetries === 0) {
            toast.error(error.response.data.message);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
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

export const api = new ApiClient();

// --- API Functions ---
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<{ message: string }>('/auth/register', data),
};

export const adminApi = {
  getStats: () => api.get<DashboardStats>('/admin/stats'),
  getPendingRegistrations: (page = 0, size = 10) =>
    api.get<Page<RegistrationRequestItem>>(`/admin/registrations?page=${page}&size=${size}`),
  getRegistrationDetails: (id: number) =>
    api.get<RegistrationRequestItem>(`/admin/registrations/${id}`),
  approveRegistration: (id: number, payload: RegistrationApprovalPayload) =>
    api.put<{ message: string }>(`/admin/registrations/${id}/approve`, payload),
  rejectRegistration: (id: number, payload: RegistrationRejectionPayload) =>
    api.put<{ message: string }>(`/admin/registrations/${id}/reject`, payload),
  getUsers: (page = 0, size = 10, status?: string) => {
    let url = `/admin/users?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    return api.get<Page<User>>(url);
  },
  updateUserStatus: (userId: number, payload: UserStatusUpdatePayload) =>
    api.put<{ message: string }>(`/admin/users/${userId}/status`, payload),
};

export const documentsApi = {
  getMyDocuments: (page = 0, size = 10, searchTerm = '', status = 'ALL') =>
    api.get<Page<Document>>(`/documents/student?page=${page}&size=${size}&searchTerm=${searchTerm}&status=${status}`),
  getAdvisorDocuments: (page = 0, size = 10, searchTerm = '', status = 'ALL') =>
    api.get<Page<Document>>(`/documents/advisor?page=${page}&size=${size}&searchTerm=${searchTerm}&status=${status}`),
  getAll: (page = 0, size = 10, searchTerm = '', status = 'ALL') =>
    api.get<Page<Document>>(`/documents?page=${page}&size=${size}&searchTerm=${searchTerm}&status=${status}`),
  getById: (id: number) => api.get<DocumentDetailDTO>(`/documents/${id}`),
  create: (data: Partial<Document>) => api.post<Document>(`/documents`, data),
  update: (id: number, data: Partial<Document>) => api.put<Document>(`/documents/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/documents/${id}`),
  changeStatus: (id: number, status: string, reason?: string) =>
    api.put<Document>(`/documents/${id}/status/${status}`, reason ? { reason } : {}),
};

export const versionsApi = {
  getByDocument: (documentId: number) => api.get<Version[]>(`/versions/document/${documentId}`),
  getByDocumentPaged: (documentId: number, page = 0, size = 10) =>
    api.get<Page<Version>>(`/versions/document/${documentId}/paged?page=${page}&size=${size}`),
  getById: (id: number) => api.get<Version>(`/versions/${id}`),
  create: (data: Partial<Version>) => api.post<Version>('/versions', data),
  getDiff: (v1Id: number, v2Id: number) => api.get<string>(`/versions/diff/${v1Id}/${v2Id}`),
  getVersionHistory: (documentId: number) => api.get<Version[]>(`/versions/document/${documentId}/history`),
};

export const commentsApi = {
  getByVersion: (versionId: number) => api.get<Comment[]>(`/comments/version/${versionId}`),
  getResolvedByVersion: (versionId: number, resolved: boolean) =>
    api.get<Comment[]>(`/comments/version/${versionId}/resolved?resolved=${resolved}`),
  getMyComments: (page = 0, size = 10) =>
    api.get<Page<Comment>>(`/comments/my?page=${page}&size=${size}`),
  getByPosition: (versionId: number, startPos: number, endPos: number) =>
    api.get<Comment[]>(`/comments/version/${versionId}/position?startPos=${startPos}&endPos=${endPos}`),
  create: (data: Partial<Comment>) => api.post<Comment>('/comments', data),
  update: (id: number, data: Partial<Comment>) => api.put<Comment>(`/comments/${id}`, data),
  resolve: (id: number) => api.put<Comment>(`/comments/${id}/resolve`),
  delete: (id: number) => api.delete<{ message: string }>(`/comments/${id}`),
};

export const collaboratorsApi = {
  getCollaborators: (documentId: number) =>
    api.get<DocumentCollaborator[]>(`/documents/${documentId}/collaborators`),
  addCollaborator: (documentId: number, payload: AddCollaboratorPayload) =>
    api.post<DocumentCollaborator>(`/documents/${documentId}/collaborators`, payload),
  removeCollaborator: (documentId: number, collaboratorId: number) =>
    api.delete<void>(`/documents/${documentId}/collaborators/${collaboratorId}`),
  updatePermissions: (documentId: number, collaboratorId: number, permission: string) =>
    api.put<DocumentCollaborator>(`/documents/${documentId}/collaborators/${collaboratorId}/permissions`, permission, {
      headers: { 'Content-Type': 'application/json' }
    }),
  updateRole: (documentId: number, collaboratorId: number, role: string) =>
    api.put<DocumentCollaborator>(`/documents/${documentId}/collaborators/${collaboratorId}/role`, role, {
      headers: { 'Content-Type': 'application/json' }
    }),
  promoteToPrimary: (documentId: number, collaboratorId: number) =>
    api.put<DocumentCollaborator>(`/documents/${documentId}/collaborators/${collaboratorId}/promote`),
  migrateAllCollaborators: () => api.post<{ message: string }>('/documents/collaborators/migrate-all'),
};

export const notificationsApi = {
  getAll: (page = 0, size = 20) =>
    api.get<Page<Notification>>(`/notifications?page=${page}&size=${size}`),
  getUnread: () => api.get<Notification[]>('/notifications/unread'),
  getSummary: () => api.get<NotificationSummary>('/notifications/summary'),
  markAsRead: (id: number) => api.put<void>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put<void>('/notifications/read-all'),
  delete: (id: number) => api.delete<void>(`/notifications/${id}`),
  getSettings: () => api.get<NotificationSettings>('/notifications/settings'),
  updateSettings: (settings: NotificationSettings) =>
    api.put<NotificationSettings>('/notifications/settings', settings),
};

export const usersApi = {
  getAdvisors: () => api.get<Advisor[]>('/users/advisors'),
  getStudents: () => api.get<UserSelection[]>('/users/students'),
  getProfile: () => api.get<User>('/users/profile'),
  changePassword: (data: PasswordChangePayload) => api.put<{ message: string }>('/users/change-password', data),
  searchPotentialCollaborators: (search?: string, role?: string, excludeDocumentId?: number) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (excludeDocumentId) params.append('excludeDocumentId', excludeDocumentId.toString());
    return api.get<UserSelection[]>(`/users/search/collaborators?${params.toString()}`);
  },
  searchUsers: (search?: string, role?: string, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    return api.get<Page<UserSelection>>(`/users/search-generic?${params.toString()}`);
  },
  checkUserByEmail: (email: string) =>
    api.get<{ exists: boolean; id?: number; name?: string; status?: string; roles?: string[] }>(`/users/check-email?email=${email}`),
  getUserById: (id: number) => api.get<UserSelection>(`/users/${id}`),
  getAllUsers: (page = 0, size = 20, search?: string, status?: string) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    return api.get<Page<User>>(`/users?${params.toString()}`);
  },
  getMyAdvisedStudents: (page = 0, size = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (search) params.append('search', search);
    return api.get<Page<UserSelection>>(`/users/advisor/my-students?${params.toString()}`);
  }
};

export const metricsApi = {
  getHealth: () => api.get<any>('/metrics/health'),
  getSystem: () => api.get<any>('/metrics/system'),
};