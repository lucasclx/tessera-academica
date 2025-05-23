import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  Divider,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material';
import {
  Search,
  FilterList,
  MarkEmailRead,
  Delete,
  Refresh,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Today,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from '../../components/notifications/NotificationItem';
import notificationUtils, { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from '../../utils/notificationUtils';

const NotificationsPage = () => {
  const {
    notifications: realtimeNotifications,
    summary,
    loading: contextLoading,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadAllNotifications
  } = useNotifications();

  // Estados locais
  const [allNotifications, setAllNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'card'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [typeFilters, setTypeFilters] = useState([]);
  const [priorityFilters, setPriorityFilters] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Carregar notificações
  const loadNotifications = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await loadAllNotifications(pageNumber - 1, 20);
      setAllNotifications(response.content || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = () => {
    let filtered = [...allNotifications];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (statusFilter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Filtro por tipo
    if (typeFilters.length > 0) {
      filtered = filtered.filter(n => typeFilters.includes(n.type));
    }

    // Filtro por prioridade
    if (priorityFilters.length > 0) {
      filtered = filtered.filter(n => priorityFilters.includes(n.priority));
    }

    // Filtro por data
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      filtered = filtered.filter(n => {
        const date = new Date(n.createdAt);
        return date >= start && date <= end;
      });
    }

    setFilteredNotifications(filtered);
  };

  // Efeitos
  useEffect(() => {
    loadNotifications(page);
  }, [page]);

  useEffect(() => {
    applyFilters();
  }, [allNotifications, searchTerm, statusFilter, typeFilters, priorityFilters, dateRange]);

  // Handlers
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    switch (newValue) {
      case 0:
        setStatusFilter('all');
        break;
      case 1:
        setStatusFilter('unread');
        break;
      case 2:
        setStatusFilter('read');
        break;
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
    // Atualizar lista local
    setAllNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleDeleteNotification = async (notificationId) => {
    await deleteNotification(notificationId);
    // Remover da lista local
    setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    // Atualizar todas as notificações como lidas
    setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleTypeFilterChange = (type) => {
    setTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handlePriorityFilterChange = (priority) => {
    setPriorityFilters(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedNotifications.length === 0) return;

    switch (action) {
      case 'markRead':
        for (const id of selectedNotifications) {
          await markAsRead(id);
        }
        setAllNotifications(prev => 
          prev.map(n => selectedNotifications.includes(n.id) ? { ...n, read: true } : n)
        );
        break;
      case 'delete':
        for (const id of selectedNotifications) {
          await deleteNotification(id);
        }
        setAllNotifications(prev => 
          prev.filter(n => !selectedNotifications.includes(n.id))
        );
        break;
    }
    setSelectedNotifications([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilters([]);
    setPriorityFilters([]);
    setDateRange({ start: '', end: '' });
  };

  // Agrupar notificações por data
  const groupedNotifications = notificationUtils.groupNotificationsByDate(filteredNotifications);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notificações
        </Typography>
        
        {/* Status da conexão */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: connected ? '#4CAF50' : '#FF5722'
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {connected ? 'Conectado - recebendo atualizações em tempo real' : 'Desconectado'}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Resumo */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="primary">{summary.unreadCount}</Typography>
                    <Typography variant="body2">Não lidas</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="info.main">{summary.documentsCount}</Typography>
                    <Typography variant="body2">Documentos</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="success.main">{summary.commentsCount}</Typography>
                    <Typography variant="body2">Comentários</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" color="warning.main">{summary.approvalsCount}</Typography>
                    <Typography variant="body2">Aprovações</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Filtros */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Filtros</Typography>
              <Button size="small" onClick={clearFilters}>Limpar</Button>
            </Box>

            {/* Busca */}
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            {/* Filtro por tipo */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Tipos</FormLabel>
              <FormGroup>
                {Object.entries(NOTIFICATION_TYPES).slice(0, 6).map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={typeFilters.includes(value)}
                        onChange={() => handleTypeFilterChange(value)}
                        size="small"
                      />
                    }
                    label={notificationUtils.getTypeTitle(value)}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {/* Filtro por prioridade */}
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Prioridade</FormLabel>
              <FormGroup>
                {Object.entries(NOTIFICATION_PRIORITIES).map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={priorityFilters.includes(value)}
                        onChange={() => handlePriorityFilterChange(value)}
                        size="small"
                      />
                    }
                    label={key}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {/* Filtro por data */}
            <Box>
              <FormLabel component="legend">Período</FormLabel>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Data inicial"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Data final"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Lista de notificações */}
        <Grid item xs={12} md={9}>
          <Paper>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Tabs value={selectedTab} onChange={handleTabChange}>
                  <Tab label={`Todas (${summary.totalCount})`} />
                  <Tab label={`Não lidas (${summary.unreadCount})`} />
                  <Tab label="Lidas" />
                </Tabs>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => setViewMode(viewMode === 'list' ? 'card' : 'list')}>
                    {viewMode === 'list' ? <ViewModule /> : <ViewList />}
                  </IconButton>
                  <IconButton onClick={() => loadNotifications(page)}>
                    <Refresh />
                  </IconButton>
                </Box>
              </Box>

              {/* Ações em massa */}
              {selectedNotifications.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip 
                    label={`${selectedNotifications.length} selecionadas`} 
                    onDelete={() => setSelectedNotifications([])}
                  />
                  <Button 
                    size="small" 
                    startIcon={<MarkEmailRead />}
                    onClick={() => handleBulkAction('markRead')}
                  >
                    Marcar como lidas
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Delete />}
                    onClick={() => handleBulkAction('delete')}
                    color="error"
                  >
                    Excluir
                  </Button>
                </Box>
              )}

              {/* Ações gerais */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {summary.unreadCount > 0 && (
                  <Button 
                    startIcon={<MarkEmailRead />}
                    onClick={handleMarkAllAsRead}
                    size="small"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button 
                  startIcon={<SettingsIcon />}
                  onClick={() => window.location.href = '/settings/notifications'}
                  size="small"
                  variant="outlined"
                >
                  Configurações
                </Button>
              </Box>
            </Box>

            {/* Conteúdo */}
            <Box sx={{ minHeight: 400 }}>
              {loading || contextLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : filteredNotifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhuma notificação encontrada
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {allNotifications.length === 0 
                      ? 'Você não possui notificações ainda.' 
                      : 'Tente ajustar os filtros para encontrar notificações.'}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {viewMode === 'list' ? (
                    // Visualização em lista agrupada por data
                    Object.entries(groupedNotifications).map(([dateGroup, notifications]) => (
                      <Box key={dateGroup}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid #e0e0e0' }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            {dateGroup}
                          </Typography>
                        </Box>
                        <List sx={{ p: 0 }}>
                          {notifications.map((notification, index) => (
                            <React.Fragment key={notification.id}>
                              <NotificationItem
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDeleteNotification}
                                showActions={true}
                              />
                              {index < notifications.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      </Box>
                    ))
                  ) : (
                    // Visualização em cards
                    <Grid container spacing={2} sx={{ p: 2 }}>
                      {filteredNotifications.map((notification) => (
                        <Grid item xs={12} sm={6} md={4} key={notification.id}>
                          <Card 
                            variant="outlined"
                            sx={{
                              borderLeft: notification.read ? 'none' : `4px solid ${notificationUtils.getPriorityColor(notification.priority)}`,
                              backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.04)'
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: notification.read ? 'normal' : 'bold' }}>
                                  {notification.title}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {!notification.read && (
                                    <IconButton size="small" onClick={() => handleMarkAsRead(notification.id)}>
                                      <MarkEmailRead fontSize="small" />
                                    </IconButton>
                                  )}
                                  <IconButton size="small" onClick={() => handleDeleteNotification(notification.id)}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.message}
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  {notificationUtils.formatTimeAgo(notification.createdAt)}
                                </Typography>
                                <Chip 
                                  label={notificationUtils.getTypeTitle(notification.type)} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
            </Box>

            {/* Paginação */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: '1px solid #e0e0e0' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NotificationsPage;