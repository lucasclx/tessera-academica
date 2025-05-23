import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  Paper,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  MarkEmailRead,
  Delete,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import notificationUtils from '../../utils/notificationUtils';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    summary, 
    loading, 
    connected,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    // Marcar como lida se não estiver
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navegar para a URL de ação se disponível
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    handleClose();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getBellIcon = () => {
    if (summary.hasUrgent) {
      return <NotificationsActive color="error" />;
    }
    return <NotificationsIcon />;
  };

  const getBadgeColor = () => {
    if (summary.hasUrgent) return 'error';
    if (unreadCount > 0) return 'primary';
    return 'default';
  };

  return (
    <>
      <Tooltip title={`${unreadCount} notificações não lidas`}>
        <IconButton 
          color="inherit" 
          onClick={handleClick}
          sx={{ 
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color={getBadgeColor()}
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                animation: summary.hasUrgent ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                  },
                  '50%': {
                    transform: 'scale(1.1)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                  },
                }
              }
            }}
          >
            {getBellIcon()}
          </Badge>
          
          {/* Indicador de conexão */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: connected ? '#4CAF50' : '#FF5722',
              border: '2px solid white'
            }}
          />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { 
            width: 400, 
            maxHeight: 600,
            mt: 1
          }
        }}
      >
        <Paper elevation={0}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">
                Notificações
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {unreadCount > 0 && (
                  <Tooltip title="Marcar todas como lidas">
                    <IconButton size="small" onClick={handleMarkAllAsRead}>
                      <MarkEmailRead fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Configurações">
                  <IconButton size="small" onClick={() => navigate('/settings/notifications')}>
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Resumo */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {summary.documentsCount > 0 && (
                <Chip label={`${summary.documentsCount} documentos`} size="small" color="primary" />
              )}
              {summary.commentsCount > 0 && (
                <Chip label={`${summary.commentsCount} comentários`} size="small" color="info" />
              )}
              {summary.approvalsCount > 0 && (
                <Chip label={`${summary.approvalsCount} aprovações`} size="small" color="success" />
              )}
            </Box>
          </Box>

          {/* Lista de notificações */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
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
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.08)',
                        borderLeft: notification.read ? 'none' : `4px solid ${notificationUtils.getPriorityColor(notification.priority)}`,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{ 
                            width: 40, 
                            height: 40,
                            backgroundColor: notificationUtils.getPriorityColor(notification.priority),
                            fontSize: '1.2rem'
                          }}
                        >
                          {notificationUtils.getTypeIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: notification.read ? 'normal' : 'bold',
                                fontSize: '0.875rem'
                              }}
                            >
                              {notification.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {notificationUtils.isNew(notification) && (
                                <Chip label="Novo" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />
                              )}
                              <Tooltip title="Remover notificação">
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => handleDeleteNotification(notification.id, e)}
                                  sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontSize: '0.75rem',
                                mb: 0.5
                              }}
                            >
                              {notification.message}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {notificationUtils.formatTimeAgo(notification.createdAt)}
                              </Typography>
                              {notification.triggeredByName && (
                                <Typography variant="caption" color="text.secondary">
                                  por {notification.triggeredByName}
                                </Typography>
                              )}
                            </Box>
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

          {/* Footer */}
          {notifications.length > 0 && (
            <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Button 
                fullWidth 
                size="small" 
                onClick={() => {
                  navigate('/notifications');
                  handleClose();
                }}
              >
                Ver todas as notificações
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationBell;
