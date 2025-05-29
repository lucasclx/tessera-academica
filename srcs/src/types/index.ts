// ============================================
// ENUMS
// ============================================

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  REVISION = 'REVISION',
  APPROVED = 'APPROVED',
  FINALIZED = 'FINALIZED'
}

export enum CollaboratorRole {
  PRIMARY_STUDENT = 'PRIMARY_STUDENT',
  SECONDARY_STUDENT = 'SECONDARY_STUDENT',
  CO_STUDENT = 'CO_STUDENT',
  PRIMARY_ADVISOR = 'PRIMARY_ADVISOR',
  SECONDARY_ADVISOR = 'SECONDARY_ADVISOR',
  CO_ADVISOR = 'CO_ADVISOR',
  EXTERNAL_ADVISOR = 'EXTERNAL_ADVISOR',
  EXAMINER = 'EXAMINER',
  REVIEWER = 'REVIEWER',
  OBSERVER = 'OBSERVER'
}

export enum CollaboratorPermission {
  READ_ONLY = 'READ_ONLY',
  READ_COMMENT = 'READ_COMMENT',
  READ_WRITE = 'READ_WRITE',
  FULL_ACCESS = 'FULL_ACCESS'
}

export enum NotificationType {
  DOCUMENT_CREATED = 'DOCUMENT_CREATED',
  DOCUMENT_SUBMITTED = 'DOCUMENT_SUBMITTED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  DOCUMENT_REVISION_REQUESTED = 'DOCUMENT_REVISION_REQUESTED',
  DOCUMENT_FINALIZED = 'DOCUMENT_FINALIZED',
  VERSION_CREATED = 'VERSION_CREATED',
  VERSION_UPDATED = 'VERSION_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  COMMENT_REPLIED = 'COMMENT_REPLIED',
  COMMENT_RESOLVED = 'COMMENT_RESOLVED',
  USER_REGISTERED = 'USER_REGISTERED',
  USER_APPROVED = 'USER_APPROVED',
  USER_REJECTED = 'USER_REJECTED',
  COLLABORATOR_ADDED = 'COLLABORATOR_ADDED',
  COLLABORATOR_REMOVED = 'COLLABORATOR_REMOVED'
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// ============================================
// USER TYPES
// ============================================

export interface Role {
  id: number
  name: string
}

export interface User {
  id: number
  name: string
  email: string
  status: UserStatus
  roles: Role[]
  registrationDate: string
  approvalDate?: string
  updatedAt: string
}

export interface UserSelectionDTO {
  id: number
  name: string
  email: string
  role?: string
  department?: string
  institution?: string
  isActive: boolean
}

export interface AdvisorDTO {
  id: number
  name: string
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  id: number
  name: string
  email: string
  roles: string[]
  token: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: string
  institution: string
  department: string
  justification: string
}

// ============================================
// DOCUMENT TYPES
// ============================================

export interface Document {
  id: number
  title: string
  description: string
  status: DocumentStatus
  studentId: number
  advisorId: number
  studentName: string
  advisorName: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  versionCount: number
}

export interface DocumentCollaborator {
  id: number
  documentId: number
  userId: number
  userName: string
  userEmail: string
  role: CollaboratorRole
  permission: CollaboratorPermission
  addedAt: string
  addedByName?: string
  active: boolean
  lastAccessAt?: string
  canEdit: boolean
  canComment: boolean
  canManageCollaborators: boolean
  canSubmitDocument: boolean
  canApproveDocument: boolean
  isPrimary: boolean
}

export interface AddCollaboratorRequest {
  userEmail: string
  role: CollaboratorRole
  permission: CollaboratorPermission
  message?: string
}

// ============================================
// VERSION TYPES
// ============================================

export interface Version {
  id: number
  documentId: number
  versionNumber: string
  commitMessage?: string
  content: string
  diffFromPrevious?: string
  createdById: number
  createdByName: string
  createdAt: string
  commentCount: number
}

export interface VersionCreate {
  documentId: number
  commitMessage?: string
  content: string
}

// ============================================
// COMMENT TYPES
// ============================================

export interface Comment {
  id: number
  versionId: number
  content: string
  startPosition?: number
  endPosition?: number
  resolved: boolean
  resolvedAt?: string
  resolvedById?: number
  resolvedByName?: string
  userId: number
  userName: string
  createdAt: string
  updatedAt: string
}

export interface CommentCreate {
  versionId: number
  content: string
  startPosition?: number
  endPosition?: number
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: number
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  isRead: boolean
  entityId?: number
  entityType?: string
  actionUrl?: string
  icon?: string
  priorityColor?: string
  triggeredById?: number
  triggeredByName?: string
  createdAt: string
  readAt?: string
  expiresAt?: string
  timeAgo?: string
  isNew: boolean
  isExpired: boolean
}

export interface NotificationSummary {
  unreadCount: number
  totalCount: number
  hasUrgent: boolean
  documentsCount: number
  commentsCount: number
  approvalsCount: number
}

export interface NotificationSettings {
  id?: number
  emailEnabled: boolean
  emailDocumentUpdates: boolean
  emailComments: boolean
  emailApprovals: boolean
  browserEnabled: boolean
  browserDocumentUpdates: boolean
  browserComments: boolean
  browserApprovals: boolean
  digestFrequency: string
  quietHoursStart: string
  quietHoursEnd: string
}

// ============================================
// ADMIN TYPES
// ============================================

export interface DashboardStats {
  totalUsers: number
  totalStudents: number
  totalAdvisors: number
  pendingRegistrations: number
}

export interface RegistrationRequest {
  id: number
  user: User
  institution: string
  department: string
  justification: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes?: string
  createdAt: string
}

export interface RegistrationApproval {
  adminNotes?: string
}

export interface RegistrationRejection {
  rejectionReason: string
}

export interface UserStatusUpdate {
  status: UserStatus
  reason?: string
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface ApiError {
  message: string
  status: number
  timestamp: string
  path: string
}

// ============================================
// FORM TYPES
// ============================================

export interface DocumentForm {
  title: string
  description: string
  studentId: number
  advisorId: number
}

export interface ProfileForm {
  name: string
  email: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

// ============================================
// EDITOR TYPES
// ============================================

export interface EditorUser {
  name: string
  color: string
  cursor?: number
}

export interface EditorCollaboration {
  room: string
  users: EditorUser[]
  version: number
}

// ============================================
// WEBSOCKET TYPES
// ============================================

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export interface DocumentActivity {
  type: 'user_joined' | 'user_left' | 'document_updated' | 'comment_added'
  user: string
  timestamp: string
  data?: any
}

// ============================================
// UTILITY TYPES
// ============================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface PaginationParams {
  page: number
  size: number
  sort?: string
  search?: string
}

export interface FilterOptions {
  status?: string
  role?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  helperText?: string
}

// ============================================
// STORE TYPES
// ============================================

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  loading: boolean
  error: string | null
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  settings: NotificationSettings | null
  connected: boolean
}