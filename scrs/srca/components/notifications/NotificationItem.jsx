import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Delete,
  MarkEmailRead,
  Launch
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import notificationUtils from '../../utils/notificationUtils';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  showActions = true,
  compact = false 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAsRead = (event) => {
    event.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <ListItem
      button={!!notification.actionUrl}
      onClick={handleClick}
      sx={{
        backgroundColor: notification.read ? 'inherit' : 'rgba(25, 118, 210, 0.04)',
        borderLeft: notification.read ? 'none' : `4px solid ${notificationUtils.getPriorityColor(notification.priority)}`,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)'
        },
        py: compact ? 1 : 2
      }}
      secondaryAction={
        showActions && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {!notification.read && (
              <Tooltip title="Marcar como lida">
                <IconButton size="small" onClick={handleMarkAsRead}>
                  <MarkEmailRead fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {notification.actionUrl && (
              <Tooltip title="Abrir">
                <IconButton size="small" onClick={handleClick}>
                  <Launch fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Remover">
              <IconButton size="small" onClick={handleDelete}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            backgroundColor: notificationUtils.getPriorityColor(notification.priority),
            width: compact ? 32 : 48,
            height: compact ? 32 : 48,
            fontSize: compact ? '1rem' : '1.5rem'
          }}
        >
          {notificationUtils.getTypeIcon(notification.type)}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
            <Typography
              variant={compact ? "body2" : "subtitle1"}
              sx={{
                fontWeight: notification.read ? 'normal' : 'bold',
                pr: 1
              }}
            >
              {notification.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {notificationUtils.isNew(notification) && (
                <Chip 
                  label="Novo" 
                  size="small" 
                  color="error" 
                  sx={{ height: compact ? 16 : 20, fontSize: compact ? '0.6rem' : '0.7rem' }} 
                />
              )}
              {notification.priority === 'URGENT' && (
                <Chip 
                  label="Urgente" 
                  size="small" 
                  color="error" 
                  variant="outlined"
                  sx={{ height: compact ? 16 : 20, fontSize: compact ? '0.6rem' : '0.7rem' }} 
                />
              )}
            </Box>
          </Box>
        }
        secondary={
          <Box>
            <Typography
              variant={compact ? "caption" : "body2"}
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: compact ? 1 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
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
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'medium' }}>
              {notificationUtils.getTypeTitle(notification.type)}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

export default NotificationItem;