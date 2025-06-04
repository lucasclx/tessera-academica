import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import { toastManager } from '../utils/toastManager';

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

// Role e User Types (simplificado para o contexto do AdminUserListPage)
export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  roles: Role[];
  registrationDate: string;
  approvalDate?: string;
  approvedBy?: { id: number; name: string }; // Simplificado, pode ser UserSummary
  rejectionReason?: string;
  updatedAt: string;
}

// ... (outras interfaces permanecem como no arquivo original) ...
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
    // Adicione os campos que faltam de acordo com DocumentDetailDTO.java
    students: UserSelection[];
    advisors: UserSelection[];
    canSubmitDocument: boolean;
    canApproveDocument: boolean;
    canAddMoreStudents: boolean;
    canAddMoreAdvisors: boolean;
    activeStudentCount: number;
    activeAdvisorCount: number;
    primaryStudentName?: string;
    primaryAdvisorName?: string;
    allStudentNames?: string;
    allAdvisorNames?: string;
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
  documentId?: number; // Adicionado este campo para poder criar links
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
  quietHoursStart: string; 
  quietHoursEnd: string; 
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
  user: User; // User aqui deve ser a interface User definida acima
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


class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number = 30; // Aumentado para requests gerais
  private readonly timeWindow: number = 60000; // 1 minuto

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requestTimestamps = this.requests.get(key) || [];
    const validRequests = requestTimestamps.filter(time => now - time < this.timeWindow);

    if (validRequests.length >= this.maxRequests) {
      console.warn(`Rate limit exceeded for key: ${key}`);
      return false;
    }
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  getRemainingTime(key: string): number {
    const requestTimestamps = this.requests.get(key) || [];
    if (requestTimestamps.length < this.maxRequests) return 0;
    
    const oldestRequestInWindow = requestTimestamps.sort((a,b) => a-b)[requestTimestamps.length - this.maxRequests];
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequestInWindow));
  }
}

class ApiClient {
  private client: AxiosInstance;
  private rateLimiter = new RateLimiter();
  private retryCount = new Map<string, number>();
  private maxRetries = 2; // Reduzido para 2 retries em caso de erro de rede

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const requestKey = `${config.method?.toUpperCase()}-${config.url}`;
        if (!this.rateLimiter.canMakeRequest(requestKey)) {
          const remainingTime = this.rateLimiter.getRemainingTime(requestKey);
          const message = `Limite de requisições excedido. Tente novamente em ${Math.ceil(remainingTime / 1000)} segundos.`;
          if (!toastManager.isActive('rate-limit-error')) {
            toastManager.add('rate-limit-error');
            toast.error(message, { id: 'rate-limit-error' });
          }
          return Promise.reject(new Error(message));
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const requestKey = `${response.config.method?.toUpperCase()}-${response.config.url}`;
        this.retryCount.delete(requestKey);
        return response;
      },
      (error) => {
        const config = error.config;
        const requestKey = config ? `${config.method?.toUpperCase()}-${config.url}` : `unknown-${Date.now()}`;
        const currentRetries = this.retryCount.get(requestKey) || 0;
        let toastDisplayed = false;

        if (error.response) {
          const { status, data } = error.response;
          const message = data?.message || error.message || `Erro ${status}`;
          const toastId = `api-error-${status}-${requestKey}`;

          if (!toastManager.isActive(toastId)) {
              toastManager.add(toastId);
            if (status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              toast.error('Sessão expirada. Por favor, faça login novamente.', { id: 'auth-error' });
              setTimeout(() => { if (window.location.pathname !== '/login') window.location.href = '/login'; }, 500);
              toastDisplayed = true;
            } else if (status === 403) {
              toast.error(message, { id: 'forbidden-error' });
              toastDisplayed = true;
            } else if (status >= 500) {
              toast.error(message, { id: 'server-error' });
              toastDisplayed = true;
            } else if (status >= 400) {
              toast.error(message, { id: `client-error-${status}` });
              toastDisplayed = true;
            }
          } else {
            toastDisplayed = true; // Assume toast for this error is already active
          }
        } else if (error.request) { // Erro de rede ou timeout
          const networkToastId = `network-error-${requestKey}`;
          if (currentRetries < this.maxRetries && config) {
            this.retryCount.set(requestKey, currentRetries + 1);
            const delay = Math.pow(2, currentRetries) * 1500; // Aumentar um pouco o delay
            console.warn(`Retry ${requestKey} (tentativa ${currentRetries + 1}/${this.maxRetries}) em ${delay}ms`);
            if (currentRetries === 0 && !toastManager.isActive(networkToastId)) { // Toast apenas na primeira tentativa de erro de rede
                 toastManager.add(networkToastId);
                 toast.loading('Problema de conexão. Tentando reconectar...', { id: networkToastId, duration: delay - 200 });
                 toastDisplayed = true;
            }
            return new Promise(resolve => setTimeout(() => {
                 // Remove o toast de loading antes de tentar novamente
                 if(toastManager.isActive(networkToastId)) toast.dismiss(networkToastId);
                 this.client.request(config).then(resolve).catch(e => resolve(Promise.reject(e)));
            }, delay));
          } else {
            if (!toastManager.isActive(networkToastId)) {
                 toastManager.add(networkToastId);
                 toast.error('Erro de conexão. Não foi possível comunicar com o servidor após várias tentativas.', { id: networkToastId });
                 toastDisplayed = true;
            }
            if (config) this.retryCount.delete(requestKey);
          }
        }
        
        // Se nenhum toast específico foi mostrado e ainda há uma mensagem de erro genérica
        if (!toastDisplayed && error.message && !toastManager.isActive('generic-api-error')) {
          toastManager.add('generic-api-error');
          toast.error(`Erro: ${error.message}`, {id: 'generic-api-error'});
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

export const api = new ApiClient();

// Funções da API existentes...
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<{ message: string }>('/auth/register', data),
};

export const adminApi = {
  getStats: () => api.get<DashboardStats>('/admin/stats'),
  getPendingRegistrations: (page = 0, size = 10, sort = 'createdAt,asc') =>
    api.get<Page<RegistrationRequestItem>>(`/admin/registrations?page=${page}&size=${size}&sort=${sort}`),
  getRegistrationDetails: (id: number) =>
    api.get<RegistrationRequestItem>(`/admin/registrations/${id}`),
  approveRegistration: (id: number, payload: RegistrationApprovalPayload) =>
    api.put<{ message: string }>(`/admin/registrations/${id}/approve`, payload),
  rejectRegistration: (id: number, payload: RegistrationRejectionPayload) =>
    api.put<{ message: string }>(`/admin/registrations/${id}/reject`, payload),
  getUsers: (page = 0, size = 10, status?: string, sort = 'registrationDate,desc') => {
    let url = `/admin/users?page=${page}&size=${size}&sort=${sort}`;
    if (status && status !== 'ALL') url += `&status=${status}`;
    return api.get<Page<User>>(url);
  },
  updateUserStatus: (userId: number, payload: UserStatusUpdatePayload) =>
    api.put<{ message: string }>(`/admin/users/${userId}/status`, payload),
};

export const documentsApi = {
  getMyDocuments: (page = 0, size = 10, searchTerm = '', status = 'ALL') =>
    api.get<Page<Document>>(`/documents/student?page=${page}&size=${size}&searchTerm=${encodeURIComponent(searchTerm)}&status=${status}`),
  getAdvisorDocuments: (page = 0, size = 10, searchTerm = '', status = 'ALL') =>
    api.get<Page<Document>>(`/documents/advisor?page=${page}&size=${size}&searchTerm=${encodeURIComponent(searchTerm)}&status=${status}`),
  getAll: (page = 0, size = 10, searchTerm = '', status = 'ALL') => // Endpoint genérico, permissões controladas no backend
    api.get<Page<Document>>(`/documents?page=${page}&size=${size}&searchTerm=${encodeURIComponent(searchTerm)}&status=${status}`),    
  getById: (id: number) => api.get<DocumentDetailDTO>(`/documents/${id}`),
  create: (data: Partial<Document>) => api.post<Document>(`/documents`, data),
  update: (id: number, data: Partial<DocumentDetailDTO>) => api.put<DocumentDetailDTO>(`/documents/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/documents/${id}`),
  changeStatus: (id: number, status: string, reason?: string) =>
    api.put<DocumentDetailDTO>(`/documents/${id}/status/${status}`, reason ? { reason } : {}),
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
    api.put<DocumentCollaborator>(`/documents/${documentId}/collaborators/${collaboratorId}/permissions`, JSON.stringify(permission), {
      headers: { 'Content-Type': 'application/json' } // Assegurar que o backend espera JSON String
    }),
  updateRole: (documentId: number, collaboratorId: number, role: string) =>
    api.put<DocumentCollaborator>(`/documents/${documentId}/collaborators/${collaboratorId}/role`, JSON.stringify(role), {
      headers: { 'Content-Type': 'application/json' } // Assegurar que o backend espera JSON String
    }),
  promoteToPrimary: (documentId: number, collaboratorId: number) =>
    api.put<DocumentCollaborator>(`/documents/${documentId}/collaborators/${collaboratorId}/promote`),
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
  getStudents: () => api.get<UserSelection[]>('/users/students'), // Para seleção em formulários
  getProfile: () => api.get<User>('/users/profile'),
  changePassword: (data: PasswordChangePayload) => api.post<{message: string}>('/users/profile/change-password', data), // Era PUT, mas POST é comum para ações que não são idempotentes
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
  getUserById: (id: number) => api.get<UserSelection>(`/users/${id}`), // Para obter dados básicos de um usuário
  // getUsers (para admin) já está em adminApi.
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