// Arquivo: scrs/src/utils/index.jsx
// src/utils/index.js - ARQUIVO CONSOLIDADO DE TODOS OS UTILITÁRIOS
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Menu as MenuComponent, ListItemIcon, ListItemText, Grid, Fab,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardHeader, Divider, List, ListItem,
  ListItemAvatar, Avatar, Skeleton, Breadcrumbs, Link, Badge,
  Popover, Tooltip, Switch, FormControlLabel, FormGroup, FormHelperText // Added FormHelperText
} from '@mui/material';
import { 
  Add, Search, Edit, Visibility, Delete, MoreVert, ArrowBack, Save,
  CheckCircle, Warning, Info, Send, Person, SupervisorAccount, School,
  Assignment, Schedule, Notifications, NotificationsActive, Computer,
  Email, VolumeUp, Settings as SettingsIcon, MarkEmailRead, Launch,
  NavigateNext, RestoreOutlined, NotificationsActiveOutlined,
  Business, FormatBold, FormatItalic, FormatListBulleted, FormatListNumbered,
  DeleteOutline as DeleteIcon,
  // Edit as EditIcon, // Already exist implicitly via Edit de @mui/icons-material
  // Visibility as VisibilityIcon, // Already exist implicitly
  People, 
  CloudUpload, 
  CompareArrows, 
  InfoOutlined, 
  RateReviewOutlined, 
  CheckCircleOutline, 
  Subject,
  Title as TitleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { AuthContext } from '../context/AuthContext'; // Ajustado caminho relativo

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES CONSOLIDADAS
// ============================================================================

export const STATUS_CONFIG = {
  // Document Status
  DRAFT: { label: 'Rascunho', color: 'default', icon: Edit },
  SUBMITTED: { label: 'Enviado', color: 'primary', icon: Send },
  REVISION: { label: 'Em Revisão', color: 'warning', icon: Warning },
  APPROVED: { label: 'Aprovado', color: 'success', icon: CheckCircle },
  FINALIZED: { label: 'Finalizado', color: 'info', icon: Info },
  
  // User Roles (usado para visualização, pode ser expandido)
  STUDENT: { label: 'Estudante', color: 'primary', icon: School },
  ADVISOR: { label: 'Orientador', color: 'secondary', icon: SupervisorAccount },
  ADMIN: { label: 'Administrador', color: 'error', icon: Person },
  INACTIVE: { label: 'Inativo', color: 'default', icon: Person }, // Added for user status
  
  // Notification Priorities
  LOW: { label: 'Baixa', color: 'default', icon: null },
  NORMAL: { label: 'Normal', color: 'primary', icon: null },
  HIGH: { label: 'Alta', color: 'warning', icon: null },
  URGENT: { label: 'Urgente', color: 'error', icon: Schedule }
};

export const NOTIFICATION_TYPES = {
  DOCUMENT_CREATED: 'DOCUMENT_CREATED',
  DOCUMENT_SUBMITTED: 'DOCUMENT_SUBMITTED',
  DOCUMENT_APPROVED: 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED: 'DOCUMENT_REJECTED',
  DOCUMENT_REVISION_REQUESTED: 'DOCUMENT_REVISION_REQUESTED',
  DOCUMENT_FINALIZED: 'DOCUMENT_FINALIZED',
  VERSION_CREATED: 'VERSION_CREATED',
  VERSION_UPDATED: 'VERSION_UPDATED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  COMMENT_REPLIED: 'COMMENT_REPLIED',
  COMMENT_RESOLVED: 'COMMENT_RESOLVED',
  USER_REGISTERED: 'USER_REGISTERED',
  USER_APPROVED: 'USER_APPROVED',
  USER_REJECTED: 'USER_REJECTED',
  COLLABORATOR_ADDED: 'COLLABORATOR_ADDED',
  COLLABORATOR_REMOVED: 'COLLABORATOR_REMOVED',
  COLLABORATOR_ROLE_CHANGED: 'COLLABORATOR_ROLE_CHANGED',
  DEADLINE_APPROACHING: 'DEADLINE_APPROACHING',
  DEADLINE_OVERDUE: 'DEADLINE_OVERDUE',
  TASK_ASSIGNED: 'TASK_ASSIGNED'
};

export const APP_CONFIG = {
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8080/api/ws',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Tessera Acadêmica',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  },
  features: {
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false'
  }
};

// ============================================================================
// UTILITY FUNCTIONS CONSOLIDADAS
// ============================================================================

export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Data inválida';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Data inválida';
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 5) return 'agora mesmo';
  if (diffInSeconds < 60) return `${diffInSeconds} seg atrás`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getNotificationIcon = (type) => {
  const icons = {
    DOCUMENT_CREATED: '📄', DOCUMENT_SUBMITTED: '📤', DOCUMENT_APPROVED: '✅', DOCUMENT_REJECTED: '❌', DOCUMENT_REVISION_REQUESTED: '🔄', DOCUMENT_FINALIZED: '🎯',
    VERSION_CREATED: '📝', VERSION_UPDATED: '✏️', COMMENT_ADDED: '💬', COMMENT_REPLIED: '↩️', COMMENT_RESOLVED: '✔️',
    USER_REGISTERED: '👤', USER_APPROVED: '✅', USER_REJECTED: '❌', COLLABORATOR_ADDED: '🤝', COLLABORATOR_REMOVED: '👋', COLLABORATOR_ROLE_CHANGED: '🔄',
    DEADLINE_APPROACHING: '⏰', DEADLINE_OVERDUE: '🚨', TASK_ASSIGNED: '📋', DEFAULT: '📢' 
  };
  return icons[type] || icons.DEFAULT;
};

export const getPriorityColor = (priority) => {
  // Ensure STATUS_CONFIG is used if priority matches one of its keys
  if (STATUS_CONFIG[priority] && STATUS_CONFIG[priority].color) {
      return STATUS_CONFIG[priority].color;
  }
  // Fallback for general priority strings or if not in STATUS_CONFIG
  const colors = { LOW: 'success.light', NORMAL: 'info.main', HIGH: 'warning.main', URGENT: 'error.main' };
  return colors[priority] || colors.NORMAL;
};


export const getStatusConfig = (statusKey, type = 'document') => { // type can be 'document' or 'user' or 'role' etc.
  if (type === 'user' && statusKey === 'INACTIVE') { // Specific handling for user inactive status
    return STATUS_CONFIG.INACTIVE;
  }
  if (type === 'role' || type === 'user') { // For general user roles or user status not 'INACTIVE'
     const roleConfig = STATUS_CONFIG[statusKey];
     if (roleConfig) return roleConfig;
  }
  // Default to document status or a generic fallback
  return STATUS_CONFIG[statusKey] || { label: statusKey || 'Desconhecido', color: 'default', icon: <Info /> };
};


export const renderMarkdownContent = (text) => {
  if (text === null || text === undefined || text.trim() === '') { return <Typography color="textSecondary" sx={{p: 2, fontStyle: 'italic'}}>Conteúdo não disponível ou vazio.</Typography>; }
  let html = text
    .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.8em; margin-top: 1em; margin-bottom: 0.5em;">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.5em; margin-top: 0.8em; margin-bottom: 0.4em;">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.2em; margin-top: 0.6em; margin-bottom: 0.3em;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/^- (.*$)/gm, '<ul style="margin-left: 20px; padding-left: 0;"><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gm, '<ol style="margin-left: 20px; padding-left: 0;"><li>$1</li></ol>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 1em;">').replace(/\n/g, '<br>');
  if (!html.match(/^<(h[1-3]|ul|ol|p)/)) { html = `<p style="margin-bottom: 1em;">${html}`; }
  if (!html.endsWith('</p>') && !html.endsWith('</h1>') && !html.endsWith('</h2>') && !html.endsWith('</h3>') && !html.endsWith('</ul>') && !html.endsWith('</ol>')) { html += '</p>'; }
  html = html.replace(/<\/ul>\s*<ul.*?>/g, '').replace(/<\/ol>\s*<ol.*?>/g, '');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export const getTableColumns = (type) => {
  const configs = {
    studentDocuments: [ { id: 'title', label: 'Título', render: (row) => ( <Box> <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 500 }}> {row.title || "Sem Título"} </Typography> <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 250, display: 'block' }}> {row.description || "Sem descrição"} </Typography> </Box> ) }, { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> }, { id: 'advisorName', label: 'Orientador', render: (row) => row.advisorName || 'Não definido' }, { id: 'updatedAt', label: 'Atualizado em', render: (row) => row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy HH:mm') : '-' }, { id: 'versionCount', label: 'Versões', align: 'center', render: (row) => <Chip label={row.versionCount || 0} size="small" /> } ],
    advisorDocuments: [ { id: 'title', label: 'Título', render: (row) => ( <Box> <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 500 }}> {row.title || "Sem Título"} </Typography> <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 250, display: 'block' }}> {row.description || "Sem descrição"} </Typography> </Box> ) }, { id: 'studentName', label: 'Estudante', render: (row) => ( <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}> <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.light' }}> {row.studentName ? row.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'} </Avatar> <Typography variant="body2">{row.studentName || "Desconhecido"}</Typography> </Box> ) }, { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> }, { id: 'updatedAt', label: 'Submetido/Atualizado', render: (row) => row.submittedAt ? format(new Date(row.submittedAt), 'dd/MM/yy HH:mm') : (row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy HH:mm') : '-') } ],
    pendingRegistrations: [ { id: 'user', label: 'Usuário Solicitante', render: (item) => ( <Box> <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 500 }}> {item.user?.name || "Nome Indisponível"} </Typography> <Typography variant="caption" color="text.secondary"> {item.user?.email || "Email Indisponível"} </Typography> </Box> ) }, { id: 'role', label: 'Papel Solicitado', render: (item) => { const roleName = item.user?.roles?.[0]?.name; const roleConfig = getStatusConfig(roleName, 'role'); return <Chip label={roleConfig.label} color={roleConfig.color} size="small" icon={roleConfig.icon ? <roleConfig.icon fontSize="small"/> : null}/>; } }, { id: 'institution', label: 'Instituição', render: (item) => item.institution || "Não Informada" }, { id: 'createdAt', label: 'Data da Solicitação', render: (item) => item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yy HH:mm') : '-' } ]
  };
  return configs[type] || configs.studentDocuments;
};

// ============================================================================
// HOOKS CUSTOMIZADOS CONSOLIDADOS
// ============================================================================

export const useData = (fetchFn, initialFilterValue = 'ALL', initialDeps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilterValue);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const originalFetchFnRef = React.useRef(fetchFn);
  useEffect(() => {
    originalFetchFnRef.current = fetchFn;
  }, [fetchFn]);


  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFetchFn = originalFetchFnRef.current;
      
      if (typeof currentFetchFn !== 'function') {
        const errorMsg = `[useData] Erro crítico: fetchFn não é uma função. Tipo recebido: ${typeof currentFetchFn}.`;
        console.error(errorMsg);
        setError(errorMsg);
        setData([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const result = await currentFetchFn(page, size, search, filter, sortBy, sortOrder);
      setData(result?.content || []);
      setTotal(result?.totalElements || 0);
      if (result?.totalPages > 0 && page >= result.totalPages) {
        setPage(Math.max(0, result.totalPages - 1));
      }
    } catch (err) {
      console.error(`[useData] Erro ao carregar dados:`, err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro desconhecido ao carregar dados.';
      setError(errorMessage);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, search, filter, sortBy, sortOrder, ...initialDeps, fetchFn]); 

  useEffect(() => { 
    load(); 
  }, [load]); 

  return {
    data, loading, page, size, total, search, filter, error, sortBy, sortOrder,
    setPage, setSize, setSearch, setFilter, reload: load, setSortBy, setSortOrder
  };
};

export const usePaginatedData = ({ fetchFunction, initialPageSize = 10, initialFilter = 'ALL', dependencies = [] }) => {
  return useData(fetchFunction, initialFilter, dependencies);
};

// ============================================================================
// COMPONENTES UI CONSOLIDADOS
// ============================================================================
export const StatusChip = ({ status, type = 'document', variant = 'filled', size = 'small', showIcon = true, sx }) => { const config = getStatusConfig(status, type); const IconComponent = config.icon; return ( <Chip icon={showIcon && IconComponent ? (typeof IconComponent === 'function' ? <IconComponent fontSize="small" /> : IconComponent) : undefined} label={config.label} color={config.color} variant={variant} size={size} sx={{ fontWeight: variant === 'filled' ? 500 : 400, ...sx }} /> ); };
export const LoadingButton = ({ loading = false, children, loadingText = "Carregando...", ...props }) => ( <Button {...props} disabled={loading || props.disabled} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : props.startIcon}> {loading && loadingText ? loadingText : children} </Button> );
export const ConfirmDialog = ({ open = false, onClose = () => {}, onConfirm = () => {}, title = "Confirmar ação", message = "Tem certeza que deseja continuar?", confirmText = "Confirmar", cancelText = "Cancelar", variant = 'default', loading = false }) => { const variants = { default: { icon: Info, color: 'primary', confirmColor: 'primary' }, danger: { icon: DeleteIcon, color: 'error', confirmColor: 'error'}, warning: { icon: Warning, color: 'warning', confirmColor: 'warning'}, success: { icon: CheckCircle, color: 'success', confirmColor: 'success'} }; const config = variants[variant] || variants.default; const IconComponent = config.icon; return ( <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth PaperProps={{ elevation: 3 }}> <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid #eee` }}> <IconComponent sx={{ color: `${config.color}.main` }} /> {title} </DialogTitle> <DialogContent sx={{pt: '20px !important'}}> <Typography variant="body1">{message}</Typography> </DialogContent> <DialogActions sx={{ p: '16px 24px', gap: 1, borderTop: `1px solid #eee` }}> <Button onClick={onClose} disabled={loading} variant="outlined"> {cancelText} </Button> <LoadingButton onClick={onConfirm} loading={loading} variant="contained" color={config.confirmColor} loadingText="Processando..."> {confirmText} </LoadingButton> </DialogActions> </Dialog> ); };

export const PageHeader = ({ title, subtitle, breadcrumbs = [], actions = [], backButton = false, status = null, statusType = 'document', variant = 'default', onBackClick }) => {
  const navigate = useNavigate();
  const handleBack = onBackClick || (() => navigate(-1));
  return ( <Box sx={{ mb: variant === 'compact' ? 2 : 3 }}> {breadcrumbs.length > 0 && ( <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1 }}> {breadcrumbs.map((crumb, index) => ( crumb.href ? ( <Link key={index} color="inherit" component={RouterLink} to={crumb.href} sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}> {crumb.icon && <crumb.icon sx={{ mr: 0.5, fontSize: 'inherit', verticalAlign: 'bottom' }} />} {crumb.label} </Link> ) : ( <Typography key={index} color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}> {crumb.icon && <crumb.icon sx={{ mr: 0.5, fontSize: 'inherit', verticalAlign: 'bottom' }} />} {crumb.label} </Typography> ) ))} </Breadcrumbs> )} <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: variant === 'compact' ? 'center' : 'flex-start', flexWrap: 'wrap', gap: 2, }}> <Box sx={{ display: 'flex', alignItems: 'center', gap: backButton ? 1 : 2, flexGrow: 1 }}> {backButton && ( <Tooltip title="Voltar"> <IconButton onClick={handleBack} sx={{ mr: variant === 'compact' ? 0.5 : 1 }}> <ArrowBack /> </IconButton> </Tooltip> )} <Box sx={{ flexGrow: 1 }}> <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}> <Typography variant={variant === 'compact' ? 'h5' : 'h4'} component="h1" sx={{ fontWeight: 600 }}> {title} </Typography> {status && <StatusChip status={status} type={statusType} showIcon={true} />} </Box> {subtitle && ( <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}> {subtitle} </Typography> )} </Box> </Box> {actions.length > 0 && ( <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}> {actions.map((action, index) => ( <Button key={index} variant={action.variant || 'contained'} color={action.color || 'primary'} startIcon={action.icon} onClick={action.onClick} disabled={action.disabled} size={variant === 'compact' ? 'small' : 'medium'} sx={action.sx} > {action.label} </Button> ))} </Box> )} </Box> <Divider sx={{ mt: variant === 'compact' ? 1.5 : 2.5, mb: variant === 'compact' ? 1.5 : 2.5 }} /> </Box> );
};

export const TableSkeleton = ({ rows = 5, columns = 4, showAvatar = true }) => ( <TableContainer component={Paper} elevation={1}> <Table> <TableHead> <TableRow> {Array.from({ length: columns }).map((_, index) => ( <TableCell key={`header-${index}`}> <Skeleton variant="text" width="70%" height={24} /> </TableCell> ))} </TableRow> </TableHead> <TableBody> {Array.from({ length: rows }).map((_, rowIndex) => ( <TableRow key={`row-${rowIndex}`} sx={{ '&:last-child td, &:last-child th': { border: 0 }}}> {Array.from({ length: columns }).map((_, colIndex) => ( <TableCell key={`cell-${rowIndex}-${colIndex}`}> {colIndex === 0 && showAvatar ? ( <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}> <Skeleton variant="circular" width={36} height={36} /> <Box sx={{ flexGrow: 1 }}> <Skeleton variant="text" width="80%" height={18} /> <Skeleton variant="text" width="50%" height={14} /> </Box> </Box> ) : colIndex === 1 && columns > 2 ? ( <Skeleton variant="rounded" width={70} height={22} /> ) : ( <Skeleton variant="text" width="60%" height={18} /> )} </TableCell> ))} </TableRow> ))} </TableBody> </Table> </TableContainer> );
export const PageSkeleton = ({ showStats = true, tableRows = 6 }) => ( <Box sx={{ p: {xs: 2, md: 3}, maxWidth: 1200, mx: 'auto' }}> <Skeleton variant="text" width="30%" height={40} sx={{ mb: 0.5 }} /> <Skeleton variant="text" width="50%" height={20} sx={{ mb: 3 }} /> {showStats && ( <Grid container spacing={2} sx={{ mb: 3 }}> {Array.from({ length: 4 }).map((_, index) => ( <Grid item xs={12} sm={6} md={3} key={index}> <Card elevation={1}> <CardContent sx={{ textAlign: 'center', py: 2.5 }}> <Skeleton variant="text" width="50%" height={36} sx={{ mx: 'auto', mb: 0.5 }} /> <Skeleton variant="text" width="70%" height={18} sx={{ mx: 'auto' }} /> </CardContent> </Card> </Grid> ))} </Grid> )} <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 3, borderRadius: 1 }} /> <TableSkeleton rows={tableRows} columns={4} /> </Box> );
export const EmptyState = ({ icon: IconComponent = Assignment, title = "Nenhum item encontrado", description, actionLabel, onAction, variant = 'default', size = 'medium' }) => { const iconSizes = { small: 40, medium: 56, large: 72 }; const paddingY = { small: 2, medium: 4, large: 6 }; return ( <Box sx={{ textAlign: 'center', py: paddingY[size], px: 2, borderRadius: 1, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}> <IconComponent sx={{ fontSize: iconSizes[size], color: 'text.disabled', mb: 1.5 }} /> <Typography variant={size === 'large' ? 'h5' : 'h6'} gutterBottom color="text.secondary" sx={{ fontWeight: 500 }} > {title} </Typography> {description && ( <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel && onAction ? 2.5 : 0, maxWidth: 380, mx: 'auto' }} > {description} </Typography> )} {actionLabel && onAction && ( <Button variant="contained" onClick={onAction} startIcon={<Add />} size={size === 'small' ? 'small' : 'medium'} > {actionLabel} </Button> )} </Box> ); };
export const DataTable = ({ data = [], columns = [], loading = false, pagination = null, onPageChange = () => {}, onRowsPerPageChange = () => {}, onSort = null, sortBy = null, sortOrder = 'asc', onRowClick = null, onActionMenuClick = null, emptyState = null, stickyHeader = true, size = 'medium' }) => { if (loading && data.length === 0) { return <TableSkeleton rows={pagination?.rowsPerPage || 5} columns={columns.length} />; } return ( <TableContainer component={Paper} elevation={2}> <Table stickyHeader={stickyHeader} size={size}> <TableHead> <TableRow sx={{ '& th': { bgcolor: 'grey.100' }}}> {columns.map((column) => ( <TableCell key={column.id} align={column.align || 'left'} style={{ minWidth: column.minWidth }} sortDirection={sortBy === column.id ? sortOrder : false} > <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}> {column.label} </Typography> </TableCell> ))} {onActionMenuClick && <TableCell align="right" sx={{ width: 50, pr:1 }}>Ações</TableCell>} </TableRow> </TableHead> <TableBody> {data.length === 0 ? ( <TableRow> <TableCell colSpan={columns.length + (onActionMenuClick ? 1 : 0)} sx={{ textAlign: 'center', py: 6 }}> {emptyState || ( <EmptyState title="Nenhum dado encontrado" description="Não há itens para exibir no momento." size="small" /> )} </TableCell> </TableRow> ) : ( data.map((row, index) => ( <TableRow hover key={row.id || `row-${index}`} onClick={onRowClick ? () => onRowClick(row) : undefined} sx={{ cursor: onRowClick ? 'pointer' : 'default', '&:last-child td, &:last-child th': { border: 0 } }} > {columns.map((column) => ( <TableCell key={column.id} align={column.align || 'left'}> {column.render ? column.render(row) : (row[column.id] === undefined || row[column.id] === null ? '-' : row[column.id])} </TableCell> ))} {onActionMenuClick && ( <TableCell align="right" sx={{pr:1}}> <IconButton size="small" onClick={(e) => { e.stopPropagation(); onActionMenuClick(e, row); }} > <MoreVert /> </IconButton> </TableCell> )} </TableRow> )) )} </TableBody> </Table> {pagination && pagination.total > 0 && ( <TablePagination rowsPerPageOptions={pagination.rowsPerPageOptions || [5, 10, 25, 50]} component="div" count={pagination.total || 0} rowsPerPage={pagination.rowsPerPage || 10} page={pagination.page || 0} onPageChange={(event, newPage) => onPageChange(newPage)} onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))} labelRowsPerPage="Itens por pág:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}` } showFirstButton showLastButton /> )} </TableContainer> ); };
export const GenericDataView = ({ title, subtitle, createButtonLabel, onCreateNew, data = [], loading = false, error = null, totalElements = 0, page = 0, rowsPerPage = 10, onPageChange, onRowsPerPageChange, searchTerm = '', onSearchChange, searchPlaceholder = "Buscar...", filters = [], columns = [], onRowClick, onActionMenuClick, emptyState, actions = [], showCreateFab = true, showStats = false, stats = {}, onRefresh }) => { const handleSearchChange = (event) => { if (onSearchChange) onSearchChange(event.target.value); }; const renderStats = () => { if (!showStats || !stats || Object.keys(stats).length === 0) return null; return ( <Grid container spacing={2} sx={{ mb: 3 }}> {Object.entries(stats).map(([key, { value, label, color = 'primary', icon: StatIcon }]) => ( <Grid item xs={12} sm={6} md={3} key={key}> <Card elevation={1} sx={{ textAlign: 'center', bgcolor: `${color}.50` }}> <CardContent sx={{ py: 2 }}> {StatIcon && <StatIcon sx={{ fontSize: 32, color: `${color}.main`, mb: 0.5 }} />} <Typography variant="h4" color={`${color}.main`} sx={{ fontWeight: 700 }}> {value} </Typography> <Typography variant="body2" color="text.secondary"> {label} </Typography> </CardContent> </Card> </Grid> ))} </Grid> ); }; if (error && !loading) { return ( <Container> <PageHeader title={title} subtitle={subtitle} backButton={true} /> <Alert severity="error" sx={{ mt: 2 }} action={ onRefresh && <Button color="inherit" size="small" onClick={onRefresh}>TENTAR NOVAMENTE</Button> }> {error} </Alert> </Container> ); } return ( <Container maxWidth="lg"> <PageHeader title={title} subtitle={subtitle} backButton={true} actions={[ ...(actions || []), ...(onCreateNew && !showCreateFab ? [{ label: createButtonLabel || 'Criar Novo', variant: 'contained', icon: <Add />, onClick: onCreateNew }] : []) ]} /> {renderStats()} <Card elevation={1} sx={{ p: 2, mb: 3 }}> <Grid container spacing={2} alignItems="center"> <Grid item xs={12} md={filters.length > 0 ? 6 : 12}> <TextField fullWidth variant="outlined" placeholder={searchPlaceholder} value={searchTerm} onChange={handleSearchChange} InputProps={{ startAdornment: ( <InputAdornment position="start"> <Search /> </InputAdornment> ), }} /> </Grid> {filters.map((filter, index) => ( <Grid item xs={12} sm={6} md={filters.length > 1 ? 3 : 6} key={filter.id || index}> <TextField select={filter.type === 'select'} fullWidth variant="outlined" label={filter.label} value={filter.value} onChange={filter.onChange} > {filter.type === 'select' && filter.options?.map(option => ( <MenuItem key={option.value} value={option.value}> {option.label} </MenuItem> ))} </TextField> </Grid> ))} </Grid> </Card> {loading && data.length === 0 ? ( <TableSkeleton rows={rowsPerPage} columns={columns.length}/> ) : ( <DataTable data={data} columns={columns} loading={loading} pagination={{ total: totalElements, page, rowsPerPage, rowsPerPageOptions: [5, 10, 25, 50] }} onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange} onRowClick={onRowClick} onActionMenuClick={onActionMenuClick} emptyState={emptyState} /> )} {showCreateFab && onCreateNew && ( <Tooltip title={createButtonLabel || 'Criar Novo'}> <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: {xs: 72, sm: 24}, right: 24 }} onClick={onCreateNew} > <Add /> </Fab> </Tooltip> )} </Container> ); };

// NotificationBell component is MOVED to components/common/NotificationBell.jsx

export const createPage = ({ 
  title, 
  service, 
  fetchFunctionName, 
  createPath, 
  rowActions = () => [], 
  columnsConfig,
  tableType,
  defaultFilters = [],
  pageSubtitle = ""
}) => {
  return function PageInstance() {
    const { currentUser } = useContext(AuthContext);
    
    const actualNavigate = useNavigate(); 

    const memoizedFetchFn = useCallback((...args) => {
      if (service && fetchFunctionName && typeof service[fetchFunctionName] === 'function') {
        return service[fetchFunctionName](...args);
      }
      console.error(`[PageInstance for ${title}] fetchFunctionName '${fetchFunctionName}' não encontrado ou não é uma função no service:`, service);
      return Promise.resolve({ content: [], totalElements: 0, totalPages: 0 });
    }, [service, fetchFunctionName, title]); // Added title to dep array for better error messages
    
    const initialMainFilterValue = defaultFilters.find(f => f.isMainFilter)?.defaultValue || 
                                 (defaultFilters.find(f => f.type === 'select')?.defaultValue || 'ALL');
    
    const { 
      data, loading, page, size, total, search, filter, error, sortBy, sortOrder,
      setPage, setSize, setSearch, setFilter, reload, setSortBy, setSortOrder 
    } = useData(memoizedFetchFn, initialMainFilterValue, []);
    
    const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
    const [selectedItemForAction, setSelectedItemForAction] = useState(null);

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [confirmDialogProps, setConfirmDialogProps] = useState({
        title: "", message: "", onConfirm: () => {}, variant: 'default', confirmText: "Confirmar"
    });

    const columns = columnsConfig || getTableColumns(tableType);

    const handleActionMenuOpen = (event, item) => {
      setActionMenuAnchorEl(event.currentTarget);
      setSelectedItemForAction(item);
    };

    const handleActionMenuClose = () => {
      setActionMenuAnchorEl(null);
      setSelectedItemForAction(null);
    };
    
    const openConfirmation = (item, actionFn, dialogOptions) => {
        setConfirmDialogProps({
            title: dialogOptions.title || `Confirmar Ação`,
            message: dialogOptions.message || `Você tem certeza que deseja executar esta ação em "${item?.title || item?.name || item?.id}"?`,
            onConfirm: async () => {
                setConfirmDialogOpen(false);
                await actionFn(item); 
            },
            variant: dialogOptions.variant || 'danger',
            confirmText: dialogOptions.confirmText || 'Confirmar'
        });
        setConfirmDialogOpen(true);
        handleActionMenuClose();
    };
    
    const handleDeleteAction = (item) => {
        openConfirmation(
            item,
            async (itemToDelete) => {
                try {
                    // Check if specific delete function (like deleteDocument) exists, otherwise use generic delete
                    const deleteFn = service.deleteDocument || service.delete;
                    if (typeof deleteFn !== 'function') {
                        toast.error('Função de exclusão não implementada no serviço.');
                        return;
                    }
                    await deleteFn(itemToDelete.id);
                    toast.success(`"${itemToDelete.title || itemToDelete.name || itemToDelete.id}" excluído com sucesso.`);
                    reload(); 
                } catch (deleteError) {
                    console.error('Erro ao excluir item:', deleteError);
                    toast.error(deleteError.response?.data?.message || 'Falha ao excluir o item.');
                }
            },
            { 
                title: `Confirmar Exclusão de "${item?.title || item?.name || item?.id}"`,
                message: "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
                variant: 'danger',
                confirmText: 'Excluir'
            }
        );
    };
    
    const availableRowActions = selectedItemForAction 
      ? rowActions(selectedItemForAction, { navigate: actualNavigate, handleDelete: handleDeleteAction, currentUser, openConfirmation, reload }) // Added reload to utils
      : [];

    const mainFilterConfig = defaultFilters.find(f => f.isMainFilter) || defaultFilters.find(f => f.type === 'select');
    const searchFilterConfig = defaultFilters.find(f => f.type === 'search');
    const otherFilters = defaultFilters.filter(f => f !== mainFilterConfig && f !== searchFilterConfig);


    return (
      <Container maxWidth="lg" sx={{pb:4}}>
        <PageHeader
          title={title}
          subtitle={pageSubtitle}
          actions={createPath ? [{
              label: typeof createPath === 'string' ? "Novo" : (createPath.label || "Novo"),
              variant: 'contained', icon: <Add />,
              onClick: () => actualNavigate(typeof createPath === 'string' ? createPath : (createPath.path || '/'))
            }] : []
          }
          onBackClick={pageSubtitle ? () => actualNavigate(-1) : undefined } // Back button only if subtitle (meaning it's not a top-level page)
          backButton={!!pageSubtitle} // Show back button if there is a subtitle
        />

        {(searchFilterConfig || mainFilterConfig || otherFilters.length > 0) && (
          <Card elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              {searchFilterConfig && (
                <Grid item xs={12} md={mainFilterConfig || otherFilters.length > 0 ? 6 : 12}>
                  <TextField
                    fullWidth variant="outlined" 
                    placeholder={searchFilterConfig.placeholder || "Buscar..."}
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{ startAdornment: ( <InputAdornment position="start"> <Search /> </InputAdornment> ), }}
                  />
                </Grid>
              )}
              {mainFilterConfig && (
                <Grid item xs={12} md={searchFilterConfig || otherFilters.length > 0 ? (otherFilters.length > 0 ? 3 : 6) : 12}>
                  <TextField
                    select fullWidth variant="outlined"
                    label={mainFilterConfig.label} value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {mainFilterConfig.options?.map(option => (
                      <MenuItem key={option.value} value={option.value}> {option.label} </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}
              {otherFilters.map((f, index) => (
                 <Grid item xs={12} sm={6} md={3} key={f.id || `other-filter-${index}`}>
                     <TextField
                        select={f.type === 'select'}
                        fullWidth
                        variant="outlined"
                        label={f.label}
                        value={f.value || ''} // Ensure value is controlled
                        onChange={f.onChange}
                        InputLabelProps={f.type === 'date' ? { shrink: true } : {}}
                        type={f.type === 'date' ? 'date' : undefined}
                     >
                        {f.type === 'select' && f.options?.map(option => (
                            <MenuItem key={option.value} value={option.value}> {option.label} </MenuItem>
                        ))}
                     </TextField>
                 </Grid>
              ))}
            </Grid>
          </Card>
        )}
        
        {error && !loading && <Alert severity="error" sx={{mb:2}} action={ <Button color="inherit" size="small" onClick={reload}>TENTAR NOVAMENTE</Button> }>{error}</Alert>}

        <DataTable
          data={data} columns={columns} loading={loading}
          pagination={{ total: total, page, rowsPerPage: size, rowsPerPageOptions: [5, 10, 25, 50] }}
          onPageChange={setPage}
          onRowsPerPageChange={(newPageSize) => { setSize(newPageSize); setPage(0); }}
          onRowClick={(item) => {
             const actionsForItem = rowActions(item, { navigate: actualNavigate, handleDelete: handleDeleteAction, currentUser, openConfirmation, reload });
             const viewAction = actionsForItem.find(act => act.isDefaultView === true || (typeof act.isDefaultView === 'function' && act.isDefaultView(item)));
             
             if (viewAction && typeof viewAction.onClick === 'function') {
                viewAction.onClick(item);
             } else if(createPath && typeof createPath !== 'string' && createPath.viewPath && item.id) { 
                actualNavigate(createPath.viewPath.replace(':id', item.id));
             } else if (typeof createPath === 'object' && createPath.viewPath && item.id) { // Check explicit viewPath
                actualNavigate(createPath.viewPath.replace(':id', item.id));
             }
          }}
          onActionMenuClick={rowActions && typeof rowActions === 'function' && rowActions().length > 0 ? handleActionMenuOpen : null}
          emptyState={
            <EmptyState
              title={`Nenhum ${title.toLowerCase()} encontrado`}
              description="Tente ajustar os filtros ou crie um novo item."
              actionLabel={createPath ? (typeof createPath === 'string' ? "Criar Novo" : (createPath.label || "Criar Novo")) : null}
              onAction={createPath ? () => actualNavigate(typeof createPath === 'string' ? createPath : (createPath.path || '/')) : null}
            />
          }
        />

        {selectedItemForAction && availableRowActions.length > 0 && (
          <MenuComponent
            anchorEl={actionMenuAnchorEl}
            open={Boolean(actionMenuAnchorEl)}
            onClose={handleActionMenuClose}
            PaperProps={{ elevation: 2, sx: { minWidth: 180 } }}
          >
            {availableRowActions.map((action, index) => {
              if (!action || typeof action.label !== 'string') return null;
              const isDisabled = action.disabled && typeof action.disabled === 'function' && action.disabled(selectedItemForAction, currentUser);
              const meetsCondition = !action.condition || (typeof action.condition === 'function' && action.condition(selectedItemForAction, currentUser));
              if (!meetsCondition) return null;
              return (
                <MenuItem 
                    key={action.label + index} 
                    onClick={() => { if(typeof action.onClick === 'function') action.onClick(selectedItemForAction); handleActionMenuClose(); }}
                    disabled={isDisabled}
                    sx={{color: action.isDestructive ? 'error.main' : 'inherit'}}
                >
                  {action.icon && <ListItemIcon sx={{color: action.isDestructive ? 'error.main' : 'inherit', minWidth: '36px'}}>{React.cloneElement(action.icon, { fontSize: "small" })}</ListItemIcon>}
                  <ListItemText primaryTypographyProps={{ fontSize: '0.9rem' }}>{action.label}</ListItemText>
                </MenuItem>
              );
            })}
          </MenuComponent>
        )}
        
        <ConfirmDialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
            onConfirm={confirmDialogProps.onConfirm}
            title={confirmDialogProps.title}
            message={confirmDialogProps.message}
            confirmText={confirmDialogProps.confirmText || "Confirmar"}
            variant={confirmDialogProps.variant || 'danger'}
            loading={loading} // Pass a relevant loading state, e.g. a specific one for the dialog action
        />
      </Container>
    );
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  STATUS_CONFIG, NOTIFICATION_TYPES, APP_CONFIG,
  formatTimeAgo, getNotificationIcon, getPriorityColor, getStatusConfig, 
  renderMarkdownContent, getTableColumns,
  useData, usePaginatedData,
  StatusChip, LoadingButton, ConfirmDialog, PageHeader,
  TableSkeleton, PageSkeleton, EmptyState, DataTable,
  GenericDataView,
  // NotificationBell, // MOVED
  createPage
};