import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  FormGroup,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Info
} from '@mui/icons-material';

const NotificationSettingsCard = ({ 
  title, 
  subtitle, 
  icon, 
  enabled, 
  onEnabledChange, 
  children, 
  disabled = false,
  info 
}) => {
  return (
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
                <IconButton size="small">
                  <Info />
                </IconButton>
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
};

export default NotificationSettingsCard;