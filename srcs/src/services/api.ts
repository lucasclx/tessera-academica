import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  Document,
  DocumentForm,
  Version,
  VersionCreate,
  Comment,
  CommentCreate,
  Notification,
  NotificationSummary,
  NotificationSettings,
  DocumentCollaborator,
  AddCollaboratorRequest,
  DashboardStats,
  RegistrationRequest,
  RegistrationApproval,
  RegistrationRejection,
  UserStatusUpdate,
  UserSelectionDTO,
  AdvisorDTO,
  PaginatedResponse,
  CollaboratorPermission,
  CollaboratorRole
} from '@/types'

// Configuração base do Axios
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - tratamento de erros globais
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          localStorage.removeItem('auth_token')
          window.location.href = '/auth/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Método auxiliar para requisições
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api(config)
    return response.data
  }

  // Método auxiliar para requisições paginadas
  private async requestPaginated<T>(config: AxiosRequestConfig): Promise<PaginatedResponse<T>> {
    const response: AxiosResponse<PaginatedResponse<T>> = await this.api(config)
    return response.data
  }

  // ============================================
  // AUTH API
  // ============================================
  auth = {
    login: (credentials: LoginRequest): Promise<LoginResponse> =>
      this.request({
        method: 'POST',
        url: '/auth/login',
        data: credentials,
      }),

    register: (data: RegisterRequest): Promise<void> =>
      this.request({
        method: 'POST',
        url: '/auth/register',
        data,
      }),

    getProfile: (): Promise<User> =>
      this.request({
        method: 'GET',
        url: '/users/profile',
      }),
  }

  // ============================================
  // DOCUMENTS API
  // ============================================
  documents = {
    getAll: (params?: { 
      page?: number
      size?: number
      searchTerm?: string
      status?: string
    }): Promise<PaginatedResponse<Document>> =>
      this.requestPaginated({
        method: 'GET',
        url: '/documents/student',
        params,
      }),

    getByAdvisor: (params?: { 
      page?: number
      size?: number
      searchTerm?: string
      status?: string
    }): Promise<PaginatedResponse<Document>> =>
      this.requestPaginated({
        method: 'GET',
        url: '/documents/advisor',
        params,
      }),

    getById: (id: number): Promise<Document> =>
      this.request({
        method: 'GET',
        url: `/documents/${id}`,
      }),

    create: (data: DocumentForm): Promise<Document> =>
      this.request({
        method: 'POST',
        url: '/documents',
        data,
      }),

    update: (id: number, data: Partial<DocumentForm>): Promise<Document> =>
      this.request({
        method: 'PUT',
        url: `/documents/${id}`,
        data,
      }),

    delete: (id: number): Promise<void> =>
      this.request({
        method: 'DELETE',
        url: `/documents/${id}`,
      }),

    changeStatus: (id: number, status: string, reason?: string): Promise<Document> =>
      this.request({
        method: 'PUT',
        url: `/documents/${id}/status/${status}`,
        data: reason,
      }),
  }

  // ============================================
  // VERSIONS API
  // ============================================
  versions = {
    getByDocument: (documentId: number): Promise<Version[]> =>
      this.request({
        method: 'GET',
        url: `/versions/document/${documentId}`,
      }),

    getById: (id: number): Promise<Version> =>
      this.request({
        method: 'GET',
        url: `/versions/${id}`,
      }),

    create: (data: VersionCreate): Promise<Version> =>
      this.request({
        method: 'POST',
        url: '/versions',
        data,
      }),

    getDiff: (v1Id: number, v2Id: number): Promise<string> =>
      this.request({
        method: 'GET',
        url: `/versions/diff/${v1Id}/${v2Id}`,
      }),

    getHistory: (documentId: number): Promise<Version[]> =>
      this.request({
        method: 'GET',
        url: `/versions/document/${documentId}/history`,
      }),
  }

  // ============================================
  // COMMENTS API
  // ============================================
  comments = {
    getByVersion: (versionId: number): Promise<Comment[]> =>
      this.request({
        method: 'GET',
        url: `/comments/version/${versionId}`,
      }),

    getByPosition: (versionId: number, startPos: number, endPos: number): Promise<Comment[]> =>
      this.request({
        method: 'GET',
        url: `/comments/version/${versionId}/position`,
        params: { startPos, endPos },
      }),

    create: (data: CommentCreate): Promise<Comment> =>
      this.request({
        method: 'POST',
        url: '/comments',
        data,
      }),

    update: (id: number, data: Partial<CommentCreate>): Promise<Comment> =>
      this.request({
        method: 'PUT',
        url: `/comments/${id}`,
        data,
      }),

    resolve: (id: number): Promise<Comment> =>
      this.request({
        method: 'PUT',
        url: `/comments/${id}/resolve`,
      }),

    delete: (id: number): Promise<void> =>
      this.request({
        method: 'DELETE',
        url: `/comments/${id}`,
      }),

    getMy: (params?: { page?: number; size?: number }): Promise<PaginatedResponse<Comment>> =>
      this.requestPaginated({
        method: 'GET',
        url: '/comments/my',
        params,
      }),
  }

  // ============================================
  // COLLABORATORS API
  // ============================================
  collaborators = {
    getByDocument: (documentId: number): Promise<DocumentCollaborator[]> =>
      this.request({
        method: 'GET',
        url: `/documents/${documentId}/collaborators`,
      }),

    add: (documentId: number, data: AddCollaboratorRequest): Promise<DocumentCollaborator> =>
      this.request({
        method: 'POST',
        url: `/documents/${documentId}/collaborators`,
        data,
      }),

    remove: (documentId: number, collaboratorId: number): Promise<void> =>
      this.request({
        method: 'DELETE',
        url: `/documents/${documentId}/collaborators/${collaboratorId}`,
      }),

    updatePermissions: (
      documentId: number, 
      collaboratorId: number, 
      permission: CollaboratorPermission
    ): Promise<DocumentCollaborator> =>
      this.request({
        method: 'PUT',
        url: `/documents/${documentId}/collaborators/${collaboratorId}/permissions`,
        data: permission,
      }),

    updateRole: (
      documentId: number, 
      collaboratorId: number, 
      role: CollaboratorRole
    ): Promise<DocumentCollaborator> =>
      this.request({
        method: 'PUT',
        url: `/documents/${documentId}/collaborators/${collaboratorId}/role`,
        data: role,
      }),

    promoteToPrimary: (documentId: number, collaboratorId: number): Promise<DocumentCollaborator> =>
      this.request({
        method: 'PUT',
        url: `/documents/${documentId}/collaborators/${collaboratorId}/promote`,
      }),
  }

  // ============================================
  // NOTIFICATIONS API
  // ============================================
  notifications = {
    getUnreadNotifications: (): Promise<Notification[]> =>
      this.request({
        method: 'GET',
        url: '/notifications/unread',
      }),

    getAll: (params?: { page?: number; size?: number }): Promise<PaginatedResponse<Notification>> =>
      this.requestPaginated({
        method: 'GET',
        url: '/notifications',
        params,
      }),

    getSummary: (): Promise<NotificationSummary> =>
      this.request({
        method: 'GET',
        url: '/notifications/summary',
      }),

    markAsRead: (id: number): Promise<void> =>
      this.request({
        method: 'PUT',
        url: `/notifications/${id}/read`,
      }),

    markAllAsRead: (): Promise<void> =>
      this.request({
        method: 'PUT',
        url: '/notifications/read-all',
      }),

    deleteNotification: (id: number): Promise<void> =>
      this.request({
        method: 'DELETE',
        url: `/notifications/${id}`,
      }),

    getSettings: (): Promise<NotificationSettings> =>
      this.request({
        method: 'GET',
        url: '/notifications/settings',
      }),

    updateSettings: (settings: NotificationSettings): Promise<NotificationSettings> =>
      this.request({
        method: 'PUT',
        url: '/notifications/settings',
        data: settings,
      }),
  }

  // ============================================
  // USERS API
  // ============================================
  users = {
    getAdvisors: (): Promise<AdvisorDTO[]> =>
      this.request({
        method: 'GET',
        url: '/users/advisors',
      }),

    getStudents: (): Promise<UserSelectionDTO[]> =>
      this.request({
        method: 'GET',
        url: '/users/students',
      }),

    searchCollaborators: (params?: {
      search?: string
      role?: string
      excludeDocumentId?: number
    }): Promise<UserSelectionDTO[]> =>
      this.request({
        method: 'GET',
        url: '/users/search/collaborators',
        params,
      }),

    checkEmail: (email: string): Promise<{ exists: boolean; [key: string]: any }> =>
      this.request({
        method: 'GET',
        url: '/users/check-email',
        params: { email },
      }),

    getMyAdvisedStudents: (params?: {
      page?: number
      size?: number
      search?: string
    }): Promise<PaginatedResponse<UserSelectionDTO>> =>
      this.requestPaginated({
        method: 'GET',
        url: '/users/advisor/my-students',
        params,
      }),
  }

  // ============================================
  // ADMIN API
  // ============================================
  admin = {
    getDashboardStats: (): Promise<DashboardStats> =>
      this.request({
        method: 'GET',
        url: '/admin/stats',
      }),

    getRegistrationRequests: (params?: {
      page?: number
      size?: number
    }): Promise<PaginatedResponse<RegistrationRequest>> =>
      this.requestPaginated({
        method: 'GET',
        url: '/admin/registrations',
        params,
      }),

    getRegistrationDetails: (id: number): Promise<RegistrationRequest> =>
      this.request({
        method: 'GET',
        url: `/admin/registrations/${id}`,
      }),

    approveRegistration: (id: number, data: RegistrationApproval): Promise<void> =>
      this.request({
        method: 'PUT',
        url: `/admin/registrations/${id}/approve`,
        data,
      }),

    rejectRegistration: (id: number, data: RegistrationRejection): Promise<void> =>
      this.request({
        method: 'PUT',
        url: `/admin/registrations/${id}/reject`,
        data,
      }),

    getUsers: (params?: {
      page?: number
      size?: number
      status?: string
    }): Promise<PaginatedResponse<User>> =>
      this.requestPaginated({
        method: 'GET',
        url: '/admin/users',
        params,
      }),

    updateUserStatus: (id: number, data: UserStatusUpdate): Promise<void> =>
      this.request({
        method: 'PUT',
        url: `/admin/users/${id}/status`,
        data,
      }),
  }
}

// Instância única da API
const apiService = new ApiService()

// Exports nomeados para facilitar o uso
export const authApi = apiService.auth
export const documentsApi = apiService.documents
export const versionsApi = apiService.versions
export const commentsApi = apiService.comments
export const collaboratorsApi = apiService.collaborators
export const notificationApi = apiService.notifications
export const usersApi = apiService.users
export const adminApi = apiService.admin

export default apiService