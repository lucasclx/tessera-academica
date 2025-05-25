// src/utils/minimal.jsx - VERSÃO EXPANDIDA CONSOLIDADA
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
  NavigateNext, RestoreOutlined, NotificationsActiveOutlined
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// ============================================================================
// CONSTANTES E CONFIGURAÇÕES
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
  COMMENT_ADDED: 'COMMENT_ADDED',
  USER_REGISTERED: 'USER_REGISTERED'
};

// ============================================================================
// UTILITY FUNCTIONS
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
    'COMMENT_ADDED': '💬',
    'USER_REGISTERED': '👤'
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

// ============================================================================
// HOOKS CUSTOMIZADOS
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
// COMPONENTES UI BÁSICOS
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
// SKELETON LOADERS
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
// EMPTY STATES
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
// DATA TABLE
// ============================================================================

export const DataTable = ({
  data = [], columns = [], loading = false, pagination = null,
  onPageChange = () => {}, onRowsPerPageChange = () => {},
  onSort = null, sortBy = null, sortOrder = 'asc',
  onRowClick = null, onMenuClick = null, emptyState = null,
  stickyHeader = true, size = 'medium'
}) => {
  const handleSort = (columnId) => {
    if (onSort && columns.find(col => col.id === columnId)?.sortable) {
      onSort(columnId);
    }
  };

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
                sortDirection={sortBy === column.id ? sortOrder : false}
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
// GENERIC DATA VIEW (PÁGINA COMPLETA)
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
  const navigate = useNavigate();

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
// PAGE FACTORY (CREATEPAGE EXPANDIDA)
// ============================================================================

export const createPage = ({ 
  title, service, fetchFunctionName, createPath, viewPath, 
  canDelete = (status) => status === 'DRAFT', 
  columnsConfig 
}) => {
  return function Page() {
    const navigate = useNavigate();
    const fetchFn = service[fetchFunctionName];
    const { data, loading, page, size, total, search, filter, setPage, setSize, setSearch, setFilter, reload } = useData(fetchFn);
    const [menu, setMenu] = useState({ anchor: null, item: null });

    // Colunas padrão se não especificadas
    const defaultColumns = [
      {
        id: 'main',
        label: 'Principal',
        render: (item) => (
          <Box>
            <Typography variant="subtitle2" color="primary">
              {item.title || item.user?.name || 'Sem título'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.description || item.user?.email || ''}
            </Typography>
          </Box>
        )
      },
      {
        id: 'status',
        label: 'Status',
        render: (item) => <StatusChip status={item.status || item.user?.roles?.[0]?.name} />
      },
      {
        id: 'details',
        label: 'Detalhes',
        render: (item) => (
          <Typography variant="body2">
            {item.advisorName || item.studentName || item.institution || '-'}
          </Typography>
        )
      },
      {
        id: 'date',
        label: 'Data',
        render: (item) => (
          <Typography variant="body2">
            {item.updatedAt || item.createdAt ? 
              format(new Date(item.updatedAt || item.createdAt), 'dd/MM/yy') : '-'}
          </Typography>
        )
      }
    ];

    const columns = columnsConfig || defaultColumns;

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
// NOTIFICATION COMPONENTS
// ============================================================================

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
                    <ListItem
                      button
                      sx={{
                        backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                        borderLeft: notification.read ? 'none' : `4px solid ${getPriorityColor(notification.priority)}`,
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          backgroundColor: getPriorityColor(notification.priority),
                          fontSize: '1.2rem'
                        }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ 
                            fontWeight: notification.read ? 'normal' : 'bold'
                          }}>
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
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

export const NotificationSettingsCard = ({ 
  title, subtitle, icon, enabled, onEnabledChange, 
  children, disabled = false, info 
}) => (
  <Card>
    <CardHeader
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          {title}
        </Box>
      }
      subheader={subtitle}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {info && (
            <Tooltip title={info}>
              <IconButton size="small"><Info /></IconButton>
            </Tooltip>
          )}
          <Chip 
            label={enabled && !disabled ? 'Ativo' : 'Inativo'} 
            color={enabled && !disabled ? 'success' : 'default'}
            size="small"
          />
        </Box>
      }
    />
    <CardContent>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={onEnabledChange}
              disabled={disabled}
            />
          }
          label={`Habilitar ${title.toLowerCase()}`}
        />
        {enabled && !disabled && (
          <Box sx={{ ml: 4, mt: 2 }}>
            {children}
          </Box>
        )}
      </FormGroup>
    </CardContent>
  </Card>
);

// ============================================================================
// EXPORTS NOMEADOS E DEFAULT
// ============================================================================

// Exports nomeados individuais para facilitar imports
export { 
  // Hooks
  useData, usePaginatedData,
  
  // Components básicos
  StatusChip, LoadingButton, ConfirmDialog, PageHeader,
  TableSkeleton, PageSkeleton, EmptyState, DataTable,
  GenericDataView, NotificationBell, NotificationSettingsCard,
  
  // Factory
  createPage,
  
  // Utils e constantes
  formatTimeAgo, getNotificationIcon, getPriorityColor,
  STATUS_CONFIG, NOTIFICATION_TYPES
};

// Default export com tudo organizado
export default {
  // Hooks
  useData, usePaginatedData,
  
  // Components
  StatusChip, LoadingButton, ConfirmDialog, PageHeader,
  TableSkeleton, PageSkeleton, EmptyState, DataTable,
  GenericDataView, NotificationBell, NotificationSettingsCard,
  
  // Factory
  createPage,
  
  // Utils
  formatTimeAgo, getNotificationIcon, getPriorityColor,
  STATUS_CONFIG, NOTIFICATION_TYPES
};