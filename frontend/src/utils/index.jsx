// utils/index.js - UTILITÁRIOS CONSOLIDADOS E OTIMIZADOS
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Chip, IconButton, Menu, ListItemIcon, ListItemText, Grid, Fab,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Avatar, Skeleton, Breadcrumbs, Link, Tooltip, Divider
} from '@mui/material';
import { 
  Add, Search, Edit, Visibility, Delete, MoreVert, ArrowBack,
  CheckCircle, Warning, Info, Send, Person, SupervisorAccount, School,
  Assignment, Schedule, Notifications, NotificationsActive, NavigateNext
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { AuthContext } from '../context/AuthContext';

// ============================================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================================

export const STATUS_CONFIG = {
  // Document Status
  DRAFT: { label: 'Rascunho', color: 'default', icon: Edit },
  SUBMITTED: { label: 'Enviado', color: 'primary', icon: Send },
  REVISION: { label: 'Em Revisão', color: 'warning', icon: Warning },
  APPROVED: { label: 'Aprovado', color: 'success', icon: CheckCircle },
  FINALIZED: { label: 'Finalizado', color: 'info', icon: Info },
  
  // User Status
  STUDENT: { label: 'Estudante', color: 'primary', icon: School },
  ADVISOR: { label: 'Orientador', color: 'secondary', icon: SupervisorAccount },
  ADMIN: { label: 'Administrador', color: 'error', icon: Person },
  INACTIVE: { label: 'Inativo', color: 'default', icon: Person },
  
  // Notification Priorities
  LOW: { label: 'Baixa', color: 'info', icon: Notifications },
  NORMAL: { label: 'Normal', color: 'primary', icon: NotificationsActive },
  HIGH: { label: 'Alta', color: 'warning', icon: Warning },
  URGENT: { label: 'Urgente', color: 'error', icon: Schedule }
};

export const APP_CONFIG = {
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8080/api/ws',
    timeout: 30000
  },
  features: {
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false'
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Data inválida';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Data inválida';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seg atrás`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`;
  
  return date.toLocaleDateString('pt-BR');
};

export const getNotificationIcon = (type) => {
  const icons = {
    DOCUMENT_CREATED: '📄', DOCUMENT_SUBMITTED: '📤', DOCUMENT_APPROVED: '✅',
    DOCUMENT_REJECTED: '❌', DOCUMENT_REVISION_REQUESTED: '🔄', VERSION_CREATED: '📝',
    COMMENT_ADDED: '💬', USER_REGISTERED: '👤', COLLABORATOR_ADDED: '🤝',
    DEFAULT: '📢'
  };
  return icons[type] || icons.DEFAULT;
};

export const getPriorityColor = (priority) => {
  const config = STATUS_CONFIG[priority];
  if (config && config.color) {
    return config.color;
  }
  const colors = { LOW: 'info', NORMAL: 'primary', HIGH: 'warning', URGENT: 'error' };
  return colors[priority] || 'default';
};

export const getStatusConfig = (status, type = 'document') => {
  const config = STATUS_CONFIG[status];
  if (config) return config;
  
  // Fallbacks
  if (type === 'user' && status === true) return STATUS_CONFIG.APPROVED;
  if (type === 'user' && status === false) return STATUS_CONFIG.INACTIVE;
  
  return { label: status?.toString() || 'Desconhecido', color: 'default', icon: Info };
};

export const renderMarkdownContent = (text) => {
  if (!text?.trim()) return <Typography color="textSecondary" sx={{p: 2, fontStyle: 'italic'}}>Conteúdo não disponível.</Typography>;
  
  let html = text
    .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.8em; margin: 1em 0 0.5em;">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.5em; margin: 0.8em 0 0.4em;">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.2em; margin: 0.6em 0 0.3em;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<ul style="margin-left: 20px;"><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gm, '<ol style="margin-left: 20px;"><li>$1</li></ol>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 1em;">')
    .replace(/\n/g, '<br>');
  
  if (!html.match(/^<(h[1-3]|ul|ol|p)/)) html = `<p style="margin-bottom: 1em;">${html}`;
  if (!html.endsWith('</p>')) html += '</p>';
  
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

// ============================================================================
// CONFIGURAÇÕES DE TABELA
// ============================================================================

export const getTableColumns = (type) => {
  const columnConfigs = {
    studentDocuments: [
      { 
        id: 'title', 
        label: 'Título', 
        render: (row) => (
          <Box>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 500 }}>
              {row.title || "Sem Título"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 250, display: 'block' }}>
              {row.description || "Sem descrição"}
            </Typography>
          </Box>
        )
      },
      { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> },
      { id: 'advisorName', label: 'Orientador', render: (row) => row.advisorName || 'Não definido' },
      { id: 'updatedAt', label: 'Atualizado', render: (row) => row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy HH:mm') : '-' },
      { id: 'versionCount', label: 'Versões', align: 'center', render: (row) => <Chip label={row.versionCount || 0} size="small" /> }
    ],
    
    advisorDocuments: [
      { 
        id: 'title', 
        label: 'Título', 
        render: (row) => (
          <Box>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 500 }}>
              {row.title || "Sem Título"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.description || "Sem descrição"}
            </Typography>
          </Box>
        )
      },
      { 
        id: 'studentName', 
        label: 'Estudante', 
        render: (row) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.light' }}>
              {row.studentName?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
            <Typography variant="body2">{row.studentName || "Desconhecido"}</Typography>
          </Box>
        )
      },
      { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> },
      { id: 'updatedAt', label: 'Atualizado', render: (row) => row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy') : '-' }
    ],
    
    pendingRegistrations: [
      { 
        id: 'user', 
        label: 'Usuário', 
        render: (item) => (
          <Box>
            <Typography variant="subtitle2" color="primary">{item.user?.name || "Nome Indisponível"}</Typography>
            <Typography variant="caption" color="text.secondary">{item.user?.email || "Email Indisponível"}</Typography>
          </Box>
        )
      },
      { 
        id: 'role', 
        label: 'Papel', 
        render: (item) => {
          const role = item.user?.roles?.[0]?.name;
          const config = getStatusConfig(role, 'role');
          return <Chip label={config.label} color={config.color} size="small" />;
        }
      },
      { id: 'institution', label: 'Instituição', render: (item) => item.institution || "Não Informada" },
      { id: 'createdAt', label: 'Data', render: (item) => item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yy') : '-' }
    ]
  };
  
  return columnConfigs[type] || columnConfigs.studentDocuments;
};

// ============================================================================
// HOOKS CUSTOMIZADOS
// ============================================================================

export const useData = (fetchFn, initialFilter = 'ALL', deps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (typeof fetchFn !== 'function') {
        throw new Error('fetchFn deve ser uma função');
      }
      
      const result = await fetchFn(page, size, search, filter, 'updatedAt', 'desc');
      setData(result?.content || []);
      setTotal(result?.totalElements || 0);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro ao carregar dados');
      setData([]);
      setTotal(0);
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

// ============================================================================
// COMPONENTES UI
// ============================================================================

export const StatusChip = ({ status, type = 'document', variant = 'filled', size = 'small', showIcon = true, sx }) => {
  const config = getStatusConfig(status, type);
  const IconComponent = config.icon;
  
  return (
    <Chip
      icon={showIcon && IconComponent ? <IconComponent fontSize="small" /> : undefined}
      label={config.label}
      color={config.color}
      variant={variant}
      size={size}
      sx={{ fontWeight: variant === 'filled' ? 500 : 400, ...sx }}
    />
  );
};

export const LoadingButton = ({ loading = false, children, loadingText = "Carregando...", ...props }) => (
  <Button 
    {...props} 
    disabled={loading || props.disabled}
    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : props.startIcon}
  >
    {loading && loadingText ? loadingText : children}
  </Button>
);

export const ConfirmDialog = ({ 
  open, onClose, onConfirm, title = "Confirmar ação", message = "Tem certeza?", 
  confirmText = "Confirmar", cancelText = "Cancelar", variant = 'default', loading = false 
}) => {
  const colors = { default: 'primary', danger: 'error', warning: 'warning' };
  const color = colors[variant] || 'primary';

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{cancelText}</Button>
        <LoadingButton onClick={onConfirm} loading={loading} variant="contained" color={color}>
          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export const PageHeader = ({ title, subtitle, breadcrumbs = [], actions = [], backButton, onBackClick }) => {
  const navigate = useNavigate();
  const handleBack = onBackClick || (() => navigate(-1));

  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1 }}>
          {breadcrumbs.map((crumb, index) => (
            crumb.href ? (
              <Link key={index} component={RouterLink} to={crumb.href} color="inherit">
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">{crumb.label}</Typography>
            )
          ))}
        </Breadcrumbs>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          {backButton && (
            <Tooltip title="Voltar">
              <IconButton onClick={handleBack}><ArrowBack /></IconButton>
            </Tooltip>
          )}
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>{title}</Typography>
            {subtitle && <Typography variant="subtitle1" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </Box>
        
        {actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'contained'}
                color={action.color || 'primary'}
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
      <Divider sx={{ mt: 2 }} />
    </Box>
  );
};

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableCell key={i}><Skeleton width="70%" /></TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: columns }).map((_, j) => (
              <TableCell key={j}><Skeleton /></TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export const EmptyState = ({ icon: IconComponent = Assignment, title = "Nenhum item encontrado", description, actionLabel, onAction }) => (
  <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
    <IconComponent sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h6" gutterBottom color="text.secondary">{title}</Typography>
    {description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>}
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction} startIcon={<Add />}>{actionLabel}</Button>
    )}
  </Box>
);

export const DataTable = ({ 
  data = [], columns = [], loading = false, pagination, onPageChange, onRowsPerPageChange, 
  onRowClick, onActionMenuClick, emptyState 
}) => {
  if (loading && data.length === 0) return <TableSkeleton />;

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align || 'left'}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {column.label}
                </Typography>
              </TableCell>
            ))}
            {onActionMenuClick && <TableCell align="right">Ações</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (onActionMenuClick ? 1 : 0)} sx={{ textAlign: 'center', py: 6 }}>
                {emptyState || <EmptyState title="Nenhum dado encontrado" />}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                hover
                key={row.id || index}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align || 'left'}>
                    {column.render ? column.render(row) : (row[column.id] || '-')}
                  </TableCell>
                ))}
                {onActionMenuClick && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onActionMenuClick(e, row); }}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {pagination && pagination.total > 0 && (
        <TablePagination
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={(e, newPage) => onPageChange(newPage)}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
          labelRowsPerPage="Itens por página:"
          showFirstButton
          showLastButton
        />
      )}
    </TableContainer>
  );
};

// ============================================================================
// FACTORY PARA PÁGINAS
// ============================================================================

export const createPage = ({ title, service, fetchFunctionName, createPath, tableType, rowActions = () => [] }) => {
  return function PageInstance() {
    const { currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [actionMenu, setActionMenu] = useState({ anchorEl: null, row: null });

    const fetchFn = useCallback(async (page, size, search, filter) => {
      return await service[fetchFunctionName](page, size, search, filter);
    }, []);

    const { data, loading, page, size, total, search, filter, setPage, setSize, setSearch, setFilter, reload } = 
      useData(fetchFn, 'ALL');

    const columns = getTableColumns(tableType);
    
    const handleCreateNew = () => navigate(createPath);
    const handleRowClick = (row) => navigate(`/${tableType}/${row.id}`);
    
    const handleActionMenu = (event, row) => {
      setActionMenu({ anchorEl: event.currentTarget, row });
    };

    const handleCloseActionMenu = () => {
      setActionMenu({ anchorEl: null, row: null });
    };

    const actions = rowActions(actionMenu.row, { navigate, reload, handleCloseActionMenu });

    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <PageHeader
          title={title}
          actions={createPath ? [{ label: 'Novo', icon: <Add />, onClick: handleCreateNew }] : []}
        />

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <MenuItem value="ALL">Todos</MenuItem>
                  <MenuItem value="DRAFT">Rascunho</MenuItem>
                  <MenuItem value="SUBMITTED">Enviado</MenuItem>
                  <MenuItem value="REVISION">Em Revisão</MenuItem>
                  <MenuItem value="APPROVED">Aprovado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabela */}
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          pagination={{ total, page, rowsPerPage: size }}
          onPageChange={setPage}
          onRowsPerPageChange={setSize}
          onRowClick={handleRowClick}
          onActionMenuClick={actions.length > 0 ? handleActionMenu : undefined}
          emptyState={<EmptyState title={`Nenhum ${title.toLowerCase()} encontrado`} />}
        />

        {/* Menu de Ações */}
        <Menu
          anchorEl={actionMenu.anchorEl}
          open={Boolean(actionMenu.anchorEl)}
          onClose={handleCloseActionMenu}
        >
          {actions.map((action, index) => (
            <MenuItem key={index} onClick={action.onClick} disabled={action.disabled}>
              {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
              <ListItemText>{action.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Container>
    );
  };
};

// ============================================================================
// UTILITÁRIOS DE NOTIFICAÇÃO
// ============================================================================

export const notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  warning: (message) => toast.warning(message),
  info: (message) => toast.info(message)
};

export const handleAsyncAction = async (asyncFn, { 
  loadingMessage = "Processando...", 
  successMessage = "Ação realizada com sucesso!", 
  errorMessage = "Erro ao realizar ação",
  onSuccess,
  onError 
} = {}) => {
  try {
    if (loadingMessage) notify.info(loadingMessage);
    const result = await asyncFn();
    if (successMessage) notify.success(successMessage);
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    console.error('Erro na ação assíncrona:', error);
    const message = error.response?.data?.message || error.message || errorMessage;
    notify.error(message);
    if (onError) onError(error);
    throw error;
  }
};

// ============================================================================
// VALIDADORES
// ============================================================================

export const validators = {
  required: (value, fieldName = 'Campo') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} é obrigatório`;
    }
    return null;
  },
  
  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email inválido';
  },
  
  minLength: (value, min, fieldName = 'Campo') => {
    if (!value) return null;
    return value.length >= min ? null : `${fieldName} deve ter pelo menos ${min} caracteres`;
  },
  
  validate: (value, rules = []) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  }
};

// ============================================================================
// EXPORTAÇÕES DEFAULT
// ============================================================================

export default {
  // Configurações
  STATUS_CONFIG, APP_CONFIG,
  
  // Utilitários
  formatTimeAgo, getNotificationIcon, getPriorityColor, getStatusConfig, renderMarkdownContent, getTableColumns,
  
  // Hooks
  useData,
  
  // Componentes
  StatusChip, LoadingButton, ConfirmDialog, PageHeader, TableSkeleton, EmptyState, DataTable,
  
  // Factories
  createPage,
  
  // Notificações e validações
  notify, handleAsyncAction, validators
};