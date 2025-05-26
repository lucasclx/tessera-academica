import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { 
  Box, CssBaseline, Toolbar, Typography, AppBar, Drawer, 
  List, Divider, IconButton, ListItem, ListItemIcon, ListItemText 
} from '@mui/material';
import { 
  Dashboard, SupervisorAccount, School, ExitToApp, Menu as MenuIcon, 
  Description, Person, Assignment, Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell'; // UPDATED IMPORT PATH

const drawerWidth = 240;

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { currentUser, logout, hasRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleNavigation = (path) => { navigate(path); if (mobileOpen) setMobileOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { label: 'Dashboard', icon: Dashboard, path: '/dashboard', roles: ['STUDENT', 'ADVISOR', 'ADMIN'] },
    { label: 'Notificações', icon: Notifications, path: '/notifications', roles: ['STUDENT', 'ADVISOR', 'ADMIN'] },
    { label: 'Solicitações', icon: SupervisorAccount, path: '/admin/registrations', roles: ['ADMIN'] },
    { label: 'Monografias', icon: Description, path: '/student/documents', roles: ['STUDENT'] },
    { label: 'Orientações', icon: Assignment, path: '/advisor/documents', roles: ['ADVISOR'] },
    { label: 'Orientandos', icon: Person, path: '/advisor/students', roles: ['ADVISOR'] }
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64 }}>
        <Typography variant="h6" noWrap component="div">
          Tessera Acadêmica
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.filter(item => item.roles.some(roleName => hasRole(roleName))).map((item) => (
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
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentUser?.name || 'Usuário'} 
          </Typography>
          <NotificationBell />
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar /> {/* Necessary for content to be below app bar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;