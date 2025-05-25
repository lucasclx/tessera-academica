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
import { NotificationBell } from '../../utils/minimal'; // Import do minimal!

const drawerWidth = 240;

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { currentUser, logout, hasRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleNavigation = (path) => { navigate(path); setMobileOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>Tessera Acadêmica</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => handleNavigation('/dashboard')}>
          <ListItemIcon><Dashboard /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        <ListItem button onClick={() => handleNavigation('/notifications')}>
          <ListItemIcon><Notifications /></ListItemIcon>
          <ListItemText primary="Notificações" />
        </ListItem>
        
        {hasRole('ADMIN') && (
          <ListItem button onClick={() => handleNavigation('/admin/registrations')}>
            <ListItemIcon><SupervisorAccount /></ListItemIcon>
            <ListItemText primary="Solicitações" />
          </ListItem>
        )}

        {hasRole('STUDENT') && (
          <ListItem button onClick={() => handleNavigation('/student/documents')}>
            <ListItemIcon><Description /></ListItemIcon>
            <ListItemText primary="Monografias" />
          </ListItem>
        )}

        {hasRole('ADVISOR') && (
          <>
            <ListItem button onClick={() => handleNavigation('/advisor/documents')}>
              <ListItemIcon><Assignment /></ListItemIcon>
              <ListItemText primary="Orientações" />
            </ListItem>
            <ListItem button onClick={() => handleNavigation('/advisor/students')}>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary="Orientandos" />
            </ListItem>
          </>
        )}
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
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerWidth}px)` }, ml: { sm: `${drawerWidth}px` } }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {currentUser?.name}
          </Typography>
          <NotificationBell />
        </Toolbar>
      </AppBar>
      
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;