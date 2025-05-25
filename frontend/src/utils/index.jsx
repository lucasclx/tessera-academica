// src/utils/index.js - ARQUIVO CONSOLIDADO DE TODOS OS UTILITÁRIOS
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Menu, ListItemIcon, ListItemText, Grid, Fab,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardHeader, Divider, List, ListItem,
  ListItemAvatar, Avatar, Skeleton, Breadcrumbs, Link, Badge,
  Popover, Tooltip, Switch, FormControlLabel, FormGroup
} from '@mui/material';
import { 
  Add, Search, Edit, Visibility, Delete, MoreVert, ArrowBack, Save,
  CheckCircle, Warning, Info, Send, Person, SupervisorAccount, School,
  Assignment, Schedule, Notifications, NotificationsActive, Computer,
  Email, VolumeUp, Settings as SettingsIcon, MarkEmailRead, Launch,
  NavigateNext, RestoreOutlined, NotificationsActiveOutlined,
  Business, FormatBold, FormatItalic, FormatListBulleted
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

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
  
  // User Roles
  STUDENT: { label: 'Estudante', color: 'primary', icon: School },
  ADVISOR: { label: 'Orientador', color: 'secondary', icon: SupervisorAccount },
  ADMIN: { label: 'Administrador', color: 'error', icon: Person },
  
  // Priorities
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
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
    enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true'
  }
};

// ============================================================================
// UTILITY FUNCTIONS CONSOLIDADAS
// ============================================================================

export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days} dia${days > 1 ? 's' : ''} atrás`;
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

export const getNotificationIcon = (type) => {
  const icons = {
    'DOCUMENT_CREATED': '📄',
    'DOCUMENT_SUBMITTED': '📤',
    'DOCUMENT_APPROVED': '✅',
    'DOCUMENT_REJECTED': '❌',
    'DOCUMENT_REVISION_REQUESTED': '🔄',
    'DOCUMENT_FINALIZED': '🎯',
    'VERSION_CREATED': '📝',
    'VERSION_UPDATED': '✏️',
    'COMMENT_ADDED': '💬',
    'COMMENT_REPLIED': '↩️',
    'COMMENT_RESOLVED': '✔️',
    'USER_REGISTERED': '👤',
    'USER_APPROVED': '✅',
    'USER_REJECTED': '❌',
    'DEADLINE_APPROACHING': '⏰',
    'DEADLINE_OVERDUE': '🚨',
    'TASK_ASSIGNED': '📋'
  };
  return icons[type] || '📢';
};

export const getPriorityColor = (priority) => {
  const colors = {
    'LOW': '#4CAF50',
    'NORMAL': '#2196F3', 
    'HIGH': '#FF9800',
    'URGENT': '#F44336'
  };
  return colors[priority] || colors.NORMAL;
};

export const getStatusConfig = (status, type = 'document') => {
  return STATUS_CONFIG[status] || {
    label: status || 'Desconhecido',
    color: 'default',
    icon: null
  };
};

export const renderMarkdownContent = (text) => {
  if (!text || text.trim() === '') {
    return <Typography color="textSecondary" sx={{p: 2, fontStyle: 'italic'}}>Conteúdo não disponível.</Typography>;
  }
  
  let html = text
    .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.8em; margin-top: 1em; margin-bottom: 0.5em;">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.5em; margin-top: 0.8em; margin-bottom: 0.4em;">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.2em; margin-top: 0.6em; margin-bottom: 0.3em;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/^- (.*$)/gm, '<ul style="margin-left: 20px;"><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gm, '<ol style="margin-left: 20px;"><li>$1</li></ol>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 1em;">')
    .replace(/\n/g, '<br>');

  if (!html.match(/^<(h[1-3]|ul|ol)/)) html = `<p style="margin-bottom: 1em;">${html}`;
  if (!html.endsWith('</p>')) html += '</p>';
  html = html.replace(/<\/ul>\s*<ul.*?>/g, '').replace(/<\/ol>\s*<ol.*?>/g, '');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

// ============================================================================
// CONFIGURAÇÕES DE COLUNAS PARA TABELAS
// ============================================================================

export const getTableColumns = (type) => {
  const configs = {
    studentDocuments: [
      {
        id: 'title',
        label: 'Título',
        render: (row) => (
          <Box>
            <Typography variant="subtitle2" color="primary">{row.title || "Sem Título"}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
              {row.description || "Sem descrição"}
            </Typography>
          </Box>
        )
      },
      {
        id: 'status',
        label: 'Status',
        render: (row) => <StatusChip status={row.status} />
      },
      {
        id: 'advisorName',
        label: 'Orientador',
        render: (row) => row.advisorName || 'Não definido'
      },
      {
        id: 'updatedAt',
        label: 'Atualizado',
        render: (row) => row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy') : '-'
      }
    ],
    
    advisorDocuments: [
      {
        id: 'title',
        label: 'Título',
        render: (row) => (
          <Box>
            <Typography variant="subtitle2" color="primary">{row.title || "Sem Título"}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.description ? `${row.description.substring(0, 60)}...` : "Sem descrição"}
            </Typography>
          </Box>
        )
      },
      {
        id: 'studentName',
        label: 'Estudante',
        render: (row) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
              {row.studentName ? row.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
            </Avatar>
            <Typography variant="body2">{row.studentName || "Desconhecido"}</Typography>
          </Box>
        )
      },
      {
        id: 'status',
        label: 'Status',
        render: (row) => <StatusChip status={row.status} />
      },
      {
        id: 'updatedAt',
        label: 'Atualizado',
        render: (row) => row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy') : '-'
      }
    ],
    
    pendingRegistrations: [
      {
        id: 'user',
        label: 'Usuário',
        render: (item) => (
          <Box>
            <Typography variant="subtitle2" color="primary">
              {item.user?.name || "N/A"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.user?.email || "N/A"}
            </Typography>
          </Box>
        )
      },
      {
        id: 'role',
        label: 'Papel',
        render: (item) => {
          const role = item.user?.roles?.[0]?.name;
          const config = STATUS_CONFIG[role] || { label: role, color: 'default' };
          return <Chip label={config.label} color={config.color} size="small" />;
        }
      },
      {
        id: 'institution',
        label: 'Instituição',
        render: (item) => item.institution || "N/A"
      },
      {
        id: 'createdAt',
        label: 'Data',
        render: (item) => item.createdAt ? 
          format(new Date(item.createdAt), 'dd/MM/yy HH:mm') : '-'
      }
    ]
  };
  
  return configs[type] || configs.studentDocuments;
};

// ============================================================================
// HOOKS CUSTOMIZADOS CONSOLIDADOS
// ============================================================================

export const useData = (fetchFn, deps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(page, size, search, filter, 'updatedAt', 'desc');
      setData(result?.content || []);
      setTotal(result?.totalElements || 0);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, size, search, filter, ...deps]);

  useEffect(() => { load(); }, [load]);

  return {
    data, loading, page, size, total, search, filter, error,
    setPage, setSize, setSearch, setFilter, reload: load
  };
};

export const usePaginatedData = ({ fetchFunction, initialPageSize = 10, dependencies = [] }) => {
  return useData(fetchFunction, dependencies);
};

// ============================================================================
// COMPONENTES UI CONSOLIDADOS
// ============================================================================

export const StatusChip = ({ status, variant = 'filled', size = 'small', showIcon = true }) => {
  const config = STATUS_CONFIG[status] || { 
    label: status || 'Desconhecido', 
    color: 'default', 
    icon: null 
  };
  const IconComponent = config.icon;

  return (
    <Chip
      icon={showIcon && IconComponent ? <IconComponent fontSize="small" /> : undefined}
      label={config.label}
      color={config.color}
      variant={variant}
      size={size}
      sx={{ fontWeight: variant === 'filled' ? 500 : 400 }}
    />
  );
};

export const LoadingButton = ({ loading = false, children, loadingText, ...props }) => (
  <Button
    {...props}
    disabled={loading || props.disabled}
    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : props.startIcon}
  >
    {loading && loadingText ? loadingText : children}
  </Button>
);

export const ConfirmDialog = ({
  open = false, onClose = () => {}, onConfirm = () => {},
  title = "Confirmar ação", message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar", cancelText = "Cancelar",
  variant = 'default', loading = false
}) => {
  const variants = {
    default: { icon: Info, color: 'primary' },
    danger: { icon: Delete, color: 'error' },
    warning: { icon: Warning, color: 'warning' },
    success: { icon: CheckCircle, color: 'success' }
  };
  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconComponent sx={{ color: `${config.color}.main` }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined">
          {cancelText}
        </Button>
        <LoadingButton
          onClick={onConfirm} loading={loading} variant="contained"
          color={config.color} loadingText="Processando..."
        >
          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export const PageHeader = ({
  title, subtitle, breadcrumbs = [], actions = [], 
  backButton = false, status = null, variant = 'default'
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: variant === 'compact' ? 2 : 4 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, index) => (
            crumb.href ? (
              <Link 
                key={index} color="inherit" href={crumb.href}
                onClick={(e) => { e.preventDefault(); navigate(crumb.href); }}
                sx={{ textDecoration: 'none' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">{crumb.label}</Typography>
            )
          ))}
        </Breadcrumbs>
      )}

      <Box sx={{ 
        display: 'flex', justifyContent: 'space-between', 
        alignItems: variant === 'compact' ? 'center' : 'flex-start',
        flexWrap: 'wrap', gap: 2, mb: variant === 'compact' ? 1 : 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          {backButton && (
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
          )}
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography 
                variant={variant === 'compact' ? 'h5' : 'h4'} 
                component="h1" sx={{ fontWeight: 600 }}
              >
                {title}
              </Typography>
              {status && <StatusChip status={status} />}
            </Box>
            {subtitle && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {actions.map((action, index) => (
              <Button
                key={index} variant={action.variant || 'contained'}
                color={action.color || 'primary'} startIcon={action.icon}
                onClick={action.onClick} disabled={action.disabled}
                size={variant === 'compact' ? 'small' : 'medium'}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
      <Divider />
    </Box>
  );
};

// ============================================================================
// SKELETON LOADERS CONSOLIDADOS
// ============================================================================

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          {Array.from({ length: columns }).map((_, index) => (
            <TableCell key={`header-${index}`}>
              <Skeleton variant="text" width="80%" height={20} />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={`row-${rowIndex}`}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                {colIndex === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width="60%" />
                    </Box>
                  </Box>
                ) : colIndex === 1 ? (
                  <Skeleton variant="rounded" width={80} height={24} />
                ) : (
                  <Skeleton variant="text" width="70%" />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export const PageSkeleton = () => (
  <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
    <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />
    
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto', mb: 1 }} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
    
    <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 3 }} />
    <TableSkeleton rows={8} />
  </Box>
);

// ============================================================================
// EMPTY STATES CONSOLIDADOS
// ============================================================================

export const EmptyState = ({
  icon: IconComponent = Assignment,
  title = "Nenhum item encontrado",
  description, actionLabel, onAction,
  variant = 'default', size = 'medium'
}) => {
  const iconSizes = { small: 48, medium: 64, large: 80 };
  const paddingY = { small: 3, medium: 4, large: 6 };

  return (
    <Box sx={{ textAlign: 'center', py: paddingY[size], px: 3 }}>
      <IconComponent sx={{ 
        fontSize: iconSizes[size], 
        color: 'text.disabled', mb: 2 
      }} />
      <Typography 
        variant={size === 'large' ? 'h4' : size === 'medium' ? 'h5' : 'h6'} 
        gutterBottom color="text.secondary" sx={{ fontWeight: 500 }}
      >
        {title}
      </Typography>
      {description && (
        <Typography variant="body1" color="text.secondary" 
          sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
        >
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} startIcon={<Add />}
          size={size === 'small' ? 'small' : 'medium'}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

// ============================================================================
// DATA TABLE CONSOLIDADA
// ============================================================================

export const DataTable = ({
  data = [], columns = [], loading = false, pagination = null,
  onPageChange = () => {}, onRowsPerPageChange = () => {},
  onSort = null, sortBy = null, sortOrder = 'asc',
  onRowClick = null, onMenuClick = null, emptyState = null,
  stickyHeader = true, size = 'medium'
}) => {
  if (loading && data.length === 0) {
    return <TableSkeleton rows={pagination?.rowsPerPage || 5} columns={columns.length} />;
  }

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table stickyHeader={stickyHeader} size={size}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id} align={column.align || 'left'}
                style={{ minWidth: column.minWidth }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {column.label}
                </Typography>
              </TableCell>
            ))}
            {onMenuClick && <TableCell align="right" sx={{ width: 50 }}>Ações</TableCell>}
          </TableRow>
        </TableHead>
        
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (onMenuClick ? 1 : 0)} sx={{ textAlign: 'center', py: 6 }}>
                {emptyState || (
                  <EmptyState 
                    title="Nenhum dado encontrado"
                    description="Não há itens para exibir no momento."
                    size="small"
                  />
                )}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                hover key={row.id || index}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {column.render ? column.render(row) : row[column.field]}
                  </TableCell>
                ))}
                {onMenuClick && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuClick(e, row);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={pagination.rowsPerPageOptions || [5, 10, 25]}
          component="div" count={pagination.total || 0}
          rowsPerPage={pagination.rowsPerPage || 10}
          page={pagination.page || 0}
          onPageChange={(event, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      )}
    </TableContainer>
  );
};

// ============================================================================
// GENERIC DATA VIEW CONSOLIDADA
// ============================================================================

export const GenericDataView = ({
  title, subtitle, createButtonLabel, onCreateNew,
  data = [], loading = false, error = null, totalElements = 0,
  page = 0, rowsPerPage = 10, onPageChange, onRowsPerPageChange,
  searchTerm = '', onSearchChange, searchPlaceholder = "Buscar...",
  filters = [], columns = [], onRowClick, onMenuClick, emptyState,
  actions = [], showCreateFab = true, showStats = false, stats = {},
  onRefresh
}) => {
  const handleSearchChange = (event) => {
    if (onSearchChange) onSearchChange(event.target.value);
  };

  const renderStats = () => {
    if (!showStats || !stats || Object.keys(stats).length === 0) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(stats).map(([key, { value, label, color = 'primary' }]) => (
          <Grid item xs={6} sm={3} key={key}>
            <Card sx={{ textAlign: 'center', bgcolor: `${color}.50` }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color={`${color}.main`} sx={{ fontWeight: 700 }}>
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          {onRefresh && (
            <Button onClick={onRefresh} sx={{ ml: 2 }}>
              Tentar Novamente
            </Button>
          )}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={title} subtitle={subtitle}
        actions={[
          ...(actions || []),
          ...(onCreateNew ? [{
            label: createButtonLabel || 'Criar Novo',
            variant: 'contained', icon: <Add />,
            onClick: onCreateNew
          }] : [])
        ]}
      />

      {renderStats()}

      {/* Filtros */}
      <Card elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth variant="outlined" placeholder={searchPlaceholder}
              value={searchTerm} onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          {filters.map((filter, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <TextField
                select={filter.type === 'select'} fullWidth variant="outlined"
                label={filter.label} value={filter.value} onChange={filter.onChange}
              >
                {filter.type === 'select' && filter.options?.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}
        </Grid>
      </Card>

      {loading ? (
        <TableSkeleton rows={rowsPerPage} />
      ) : (
        <DataTable
          data={data} columns={columns} loading={loading}
          pagination={{ total: totalElements, page, rowsPerPage, rowsPerPageOptions: [5, 10, 25] }}
          onPageChange={onPageChange} onRowsPerPageChange={onRowsPerPageChange}
          onRowClick={onRowClick} onMenuClick={onMenuClick} emptyState={emptyState}
        />
      )}

      {showCreateFab && onCreateNew && (
        <Fab 
          color="primary" aria-label="add" 
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={onCreateNew}
        >
          <Add />
        </Fab>
      )}
    </Container>
  );
};

// ============================================================================
// NOTIFICATION BELL CONSOLIDADO
// ============================================================================

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const getBellIcon = () => {
    const hasUrgent = notifications.some(n => n.priority === 'URGENT' && !n.read);
    return hasUrgent ? <NotificationsActive color="error" /> : <Notifications />;
  };

  const getBadgeColor = () => {
    const hasUrgent = notifications.some(n => n.priority === 'URGENT' && !n.read);
    if (hasUrgent) return 'error';
    if (unreadCount > 0) return 'primary';
    return 'default';
  };

  return (
    <>
      <Tooltip title={`${unreadCount} notificações não lidas`}>
        <IconButton color="inherit" onClick={handleClick}>
          <Badge badgeContent={unreadCount} color={getBadgeColor()} max={99}>
            {getBellIcon()}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open} anchorEl={anchorEl} onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 400, maxHeight: 600, mt: 1 } }}
      >
        <Paper elevation={0}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Notificações</Typography>
              <Tooltip title="Configurações">
                <IconButton size="small" onClick={() => navigate('/settings/notifications')}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Nenhuma notificação
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.slice(0, 10).map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem button>
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: getPriorityColor(notification.priority) }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="subtitle2">{notification.title}</Typography>}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(notification.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          {notifications.length > 0 && (
            <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Button fullWidth size="small" onClick={() => { navigate('/notifications'); handleClose(); }}>
                Ver todas as notificações
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

// ============================================================================
// PAGE FACTORY (CREATEPAGE)
// ============================================================================

export const createPage = ({ 
  title, service, fetchFunctionName, createPath, viewPath, 
  canDelete = (status) => status === 'DRAFT', 
  columnsConfig,
  tableType = 'studentDocuments'
}) => {
  return function Page() {
    const navigate = useNavigate();
    const fetchFn = service[fetchFunctionName];
    const { data, loading, page, size, total, search, filter, setPage, setSize, setSearch, setFilter, reload } = useData(fetchFn);
    const [menu, setMenu] = useState({ anchor: null, item: null });

    const columns = columnsConfig || getTableColumns(tableType);

    const handleAction = async (action, item) => {
      try {
        if (action === 'delete' && window.confirm(`Excluir "${item.title || item.user?.name}"?`)) {
          await (service.deleteDocument?.(item.id) || service.delete?.(item.id));
          toast.success('Excluído com sucesso');
          reload();
        }
        setMenu({ anchor: null, item: null });
      } catch (error) {
        console.error('Erro na operação:', error);
        toast.error('Erro na operação');
      }
    };

    return (
      <GenericDataView
        title={title}
        data={data}
        loading={loading}
        totalElements={total}
        page={page}
        rowsPerPage={size}
        onPageChange={setPage}
        onRowsPerPageChange={setSize}
        searchTerm={search}
        onSearchChange={setSearch}
        columns={columns}
        onRowClick={viewPath ? (item) => navigate(viewPath.replace(':id', item.id)) : null}
        createButtonLabel={createPath ? "Novo" : null}
        onCreateNew={createPath ? () => navigate(createPath) : null}
        filters={[
          {
            type: 'select',
            label: 'Status',
            value: filter,
            onChange: (e) => setFilter(e.target.value),
            options: [
              { value: 'ALL', label: 'Todos' },
              ...Object.entries(STATUS_CONFIG).map(([key, { label }]) => ({
                value: key,
                label
              }))
            ]
          }
        ]}
        onMenuClick={(event, item) => setMenu({ anchor: event.currentTarget, item })}
        emptyState={
          <EmptyState
            title="Nenhum item encontrado"
            description="Não há itens para exibir no momento."
            actionLabel={createPath ? "Criar Primeiro Item" : null}
            onAction={createPath ? () => navigate(createPath) : null}
          />
        }
      />
    );
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

// Default export com tudo consolidado
export default {
  // Configurações
  STATUS_CONFIG, NOTIFICATION_TYPES, APP_CONFIG,
  
  // Utils
  formatTimeAgo, getNotificationIcon, getPriorityColor, getStatusConfig, 
  renderMarkdownContent, getTableColumns,
  
  // Hooks
  useData, usePaginatedData,
  
  // Componentes
  StatusChip, LoadingButton, ConfirmDialog, PageHeader,
  TableSkeleton, PageSkeleton, EmptyState, DataTable,
  GenericDataView, NotificationBell,
  
  // Factory
  createPage
};