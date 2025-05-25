import React from 'react';
import { Chip } from '@mui/material';
import {
  Edit, Send, Warning, CheckCircle, Info, 
  Person, Assignment, Schedule
} from '@mui/icons-material';

const StatusChip = ({ 
  status, 
  variant = 'filled',
  size = 'small',
  showIcon = true,
  customConfig = null 
}) => {
  const defaultConfigs = {
    // Document Status
    DRAFT: { 
      label: 'Rascunho', 
      color: 'default', 
      icon: Edit 
    },
    SUBMITTED: { 
      label: 'Enviado', 
      color: 'primary', 
      icon: Send 
    },
    REVISION: { 
      label: 'Em Revisão', 
      color: 'warning', 
      icon: Warning 
    },
    APPROVED: { 
      label: 'Aprovado', 
      color: 'success', 
      icon: CheckCircle 
    },
    FINALIZED: { 
      label: 'Finalizado', 
      color: 'info', 
      icon: Info 
    },
    
    // User Roles
    STUDENT: { 
      label: 'Estudante', 
      color: 'primary', 
      icon: Person 
    },
    ADVISOR: { 
      label: 'Orientador', 
      color: 'secondary', 
      icon: Assignment 
    },
    ADMIN: { 
      label: 'Administrador', 
      color: 'error', 
      icon: Person 
    },
    
    // Priority
    LOW: { 
      label: 'Baixa', 
      color: 'default', 
      icon: null 
    },
    NORMAL: { 
      label: 'Normal', 
      color: 'primary', 
      icon: null 
    },
    HIGH: { 
      label: 'Alta', 
      color: 'warning', 
      icon: null 
    },
    URGENT: { 
      label: 'Urgente', 
      color: 'error', 
      icon: Schedule 
    }
  };

  const config = customConfig || defaultConfigs[status] || {
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
      sx={{
        fontWeight: variant === 'filled' ? 500 : 400,
        minWidth: size === 'small' ? 80 : 100
      }}
    />
  );
};

export default StatusChip;