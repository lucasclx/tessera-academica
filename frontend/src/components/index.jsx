// components/index.js - COMPONENTES CONSOLIDADOS E OTIMIZADOS
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, IconButton, Badge, Tooltip, Popover, Paper, Typography,
  List, ListItem, ListItemAvatar, Avatar, ListItemText, Button,
  Divider, AppBar, Toolbar, Drawer, ListItemIcon, Chip, Alert,
  TextField, Autocomplete, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem
} from '@mui/material';
import {
  Notifications, NotificationsActive, Settings as SettingsIcon,
  Launch, Menu as MenuIcon, Dashboard, SupervisorAccount, School,
  ExitToApp, Description, Person, Assignment, Add, Delete, Edit
} from '@mui/icons-material';
import { AuthContext, useNotifications } from '../context';
import { collaboratorService } from '../services';
import { getNotificationIcon, getPriorityColor, formatTimeAgo, StatusChip, notify } from '../utils';

// ============================================================================
// NOTIFICATION BELL
// ============================================================================

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications = [], summary = {}, markAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const { unreadCount = 0, hasUrgent = false } = summary;

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.actionUrl) navigate(notification.actionUrl);
    handleClose();
  };

  const getBellIcon = () => hasUrgent ? 
    <NotificationsActive color="error" /> : 
    <Notifications />;

  const getBadgeColor = () => {
    if (hasUrgent) return 'error';
    if (unreadCount > 0) return 'primary';
    return 'default';
  };

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: { xs: '90%', sm: 380 }, maxHeight: 500, mt: 1.5 }
        }}
      >
        <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Notificações</Typography>
              <Tooltip title="Configurações">
                <IconButton size="small" onClick={() => { navigate('/settings/notifications'); handleClose(); }}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 320 }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Notifications sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Nenhuma notificação por aqui.
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.slice(0, 10).map((notification) => (
                  <ListItem
                    key={notification.id}
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                      my: 0.5, mx: 1, borderRadius: '4px'
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{
                        bgcolor: getPriorityColor(notification.priority),
                        width: 32, height: 32, fontSize: '1rem'
                      }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                          {notification.title}
                        </Typography>
                      }
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
                    {notification.actionUrl && (
                      <Tooltip title="Abrir">
                        <IconButton size="small" edge="end">
                          <Launch fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
          
          {notifications.length > 0 && (
            <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
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
// MAIN LAYOUT
// ============================================================================

export const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, logout, hasRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleNavigation = (path) => { navigate(path); setMobileOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { label: 'Dashboard', icon: Dashboard, path: '/dashboard', roles: ['STUDENT', 'ADVISOR', 'ADMIN'] },
    { label: 'Notificações', icon: Notifications, path: '/notifications', roles: ['STUDENT', 'ADVISOR', 'ADMIN'] },
    { label: 'Solicitações', icon: SupervisorAccount, path: '/admin/registrations', roles: ['ADMIN'] },
    { label: 'Monografias', icon: Description, path: '/student/documents', roles: ['STUDENT'] },
    { label: 'Orientações', icon: Assignment, path: '/advisor/documents', roles: ['ADVISOR'] },
    { label: 'Orientandos', icon: Person, path: '/advisor/students', roles: ['ADVISOR'] }
  ].filter(item => item.roles.some(role => hasRole(role)));

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" noWrap>Tessera Acadêmica</Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.label} onClick={() => handleNavigation(item.path)}>
            <ListItemIcon><item.icon /></ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><ExitToApp /></ListItemIcon>
          <ListItemText primary="Sair" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {currentUser?.name || 'Usuário'}
          </Typography>
          <NotificationBell />
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: 240 }
        }}
      >
        {drawer}
      </Drawer>
      
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { width: 240 }
        }}
      >
        {drawer}
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: 'calc(100% - 240px)' } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

// ============================================================================
// COLLABORATOR MANAGEMENT - SIMPLIFICADO
// ============================================================================

export const CollaboratorManagement = ({ documentId, currentUser, canManage, onCollaboratorsUpdate }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('VIEWER');

  const roles = [
    { value: 'VIEWER', label: 'Visualizador', color: 'default' },
    { value: 'EDITOR', label: 'Editor', color: 'primary' },
    { value: 'ADMIN', label: 'Administrador', color: 'secondary' }
  ];

  const loadCollaborators = async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const data = await collaboratorService.getDocumentCollaborators(documentId);
      setCollaborators(data || []);
      if (onCollaboratorsUpdate) onCollaboratorsUpdate(data || []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      notify.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const users = await collaboratorService.searchUsers(query, null, documentId);
      setSearchResults(users || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      notify.error('Erro ao buscar usuários');
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUser || !canManage) return;
    
    try {
      await collaboratorService.addCollaborator(documentId, {
        userEmail: selectedUser.email,
        role: selectedRole,
        permission: selectedRole === 'ADMIN' ? 'FULL_ACCESS' : selectedRole === 'EDITOR' ? 'READ_WRITE' : 'READ_ONLY'
      });
      notify.success('Colaborador adicionado com sucesso!');
      setAddDialog(false);
      setSelectedUser(null);
      setSearchQuery('');
      loadCollaborators();
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      notify.error('Erro ao adicionar colaborador');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!canManage) return;
    
    try {
      await collaboratorService.removeCollaborator(documentId, collaboratorId);
      notify.success('Colaborador removido com sucesso!');
      loadCollaborators();
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      notify.error('Erro ao remover colaborador');
    }
  };

  const handleUpdateRole = async (collaboratorId, newRole) => {
    if (!canManage) return;
    
    try {
      await collaboratorService.updateRole(documentId, collaboratorId, newRole);
      notify.success('Papel atualizado com sucesso!');
      loadCollaborators();
    } catch (error) {
      console.error('Erro ao atualizar papel:', error);
      notify.error('Erro ao atualizar papel');
    }
  };

  React.useEffect(() => {
    if (documentId) loadCollaborators();
  }, [documentId]);

  if (!documentId) {
    return (
      <Alert severity="info">
        Salve o documento primeiro para gerenciar colaboradores.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Colaboradores ({collaborators.length})
        </Typography>
        {canManage && (
          <Button
            startIcon={<Add />}
            onClick={() => setAddDialog(true)}
            variant="outlined"
            size="small"
          >
            Adicionar
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {collaborators.map((collaborator) => (
            <ListItem
              key={collaborator.id}
              sx={{ border: '1px solid #eee', borderRadius: 1, mb: 1 }}
              secondaryAction={
                canManage && currentUser?.id !== collaborator.userId && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <StatusChip 
                      status={collaborator.role} 
                      size="small"
                      onClick={() => {
                        const currentRole = collaborator.role;
                        const newRole = currentRole === 'VIEWER' ? 'EDITOR' : 
                                       currentRole === 'EDITOR' ? 'ADMIN' : 'VIEWER';
                        handleUpdateRole(collaborator.id, newRole);
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                )
              }
            >
              <ListItemAvatar>
                <Avatar>
                  {collaborator.userName?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {collaborator.userName}
                    </Typography>
                    {currentUser?.id === collaborator.userId && (
                      <Chip label="Você" size="small" />
                    )}
                  </Box>
                }
                secondary={collaborator.userEmail}
              />
            </ListItem>
          ))}
          
          {collaborators.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum colaborador adicionado ainda.
              </Typography>
            </Box>
          )}
        </List>
      )}

      {/* Dialog para adicionar colaborador */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Colaborador</DialogTitle>
        <DialogContent sx={{ pt: '10px !important' }}>
          <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={selectedUser}
            onInputChange={(_, newValue) => {
              setSearchQuery(newValue);
              searchUsers(newValue);
            }}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar usuário"
                variant="outlined"
                margin="normal"
                fullWidth
              />
            )}
            noOptionsText={searchQuery.length < 2 ? "Digite ao menos 2 caracteres" : "Nenhum usuário encontrado"}
          />
          
          <TextField
            select
            fullWidth
            label="Papel"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            margin="normal"
          >
            {roles.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddCollaborator} 
            variant="contained" 
            disabled={!selectedUser}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============================================================================
// ROUTE GUARDS - SIMPLIFICADOS
// ============================================================================

const createRouteGuard = (requiredRole) => {
  return function RouteGuard({ children }) {
    const { isAuthenticated, hasRole, isLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    React.useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          navigate('/login');
        } else if (requiredRole && !hasRole(requiredRole)) {
          navigate('/dashboard');
        }
      }
    }, [isAuthenticated, isLoading, hasRole, navigate]);

    if (isLoading) return <Typography>Carregando...</Typography>;
    if (!isAuthenticated) return null;
    if (requiredRole && !hasRole(requiredRole)) return null;

    return children;
  };
};

export const PrivateRoute = createRouteGuard(null);
export const AdminRoute = createRouteGuard('ADMIN');
export const AdvisorRoute = createRouteGuard('ADVISOR');
export const StudentRoute = createRouteGuard('STUDENT');

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  NotificationBell,
  MainLayout,
  CollaboratorManagement,
  PrivateRoute,
  AdminRoute,
  AdvisorRoute,
  StudentRoute
};