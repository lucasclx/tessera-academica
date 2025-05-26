import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, IconButton, Badge, Tooltip, Popover, Paper, Typography,
  List, ListItem, ListItemAvatar, Avatar, ListItemText, Button, Divider
} from '@mui/material';
import {
  Settings as SettingsIcon, Launch, Notifications, NotificationsActive
} from '@mui/icons-material';
import { NotificationContext } from '../../context/NotificationContext';
import { getNotificationIcon, getPriorityColor, formatTimeAgo } from '../../utils';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications = [],
    summary = { unreadCount: 0, hasUrgent: false },
    markAsRead,
  } = useContext(NotificationContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    handleClose();
  };

  const getBellIcon = () => {
    return summary.hasUrgent ? <NotificationsActive color="error" /> : <Notifications />;
  };

  const getBadgeColor = () => {
    if (summary.hasUrgent) return 'error';
    if (summary.unreadCount > 0) return 'primary';
    return 'default';
  };

  return (
    <>
      <Tooltip title={`${summary.unreadCount || 0} notificações não lidas`}>
        <IconButton color="inherit" onClick={handleClick}>
          <Badge badgeContent={summary.unreadCount || 0} color={getBadgeColor()} max={99}>
            {getBellIcon()}
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: { xs: '90%', sm: 380 },
            maxHeight: 500,
            mt: 1.5,
            borderRadius: '8px',
            boxShadow: 3,
            overflow: 'hidden' // Prevent content from overflowing Paper
          }
        }}
      >
        <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Notificações</Typography>
              <Tooltip title="Configurações de Notificação">
                <IconButton size="small" onClick={() => { navigate('/settings/notifications'); handleClose(); }}>
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 320 }}> {/* Scrollable area */}
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
                  <React.Fragment key={notification.id}>
                    <ListItem
                      button
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                        borderLeft: `4px solid ${getPriorityColor(notification.priority) || 'transparent'}`,
                        my: 0.5,
                        mx: 1,
                        width: 'calc(100% - 16px)', // Adjust width for padding
                        borderRadius: '4px',
                        '&:hover': {
                            bgcolor: notification.read ? 'action.selected' : 'action.focus'
                        }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{
                          bgcolor: getPriorityColor(notification.priority) || 'grey.500',
                          width: 32, height: 32, fontSize: '1rem'
                        }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }} noWrap>
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
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
                          <IconButton
                            size="small"
                            edge="end"
                            sx={{ ml: 1 }}
                            onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                          >
                            <Launch fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
          
          {notifications.length > 0 && (
            <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center', mt: 'auto' }}> {/* Push to bottom */}
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

export default NotificationBell; // Default export