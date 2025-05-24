import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Box
} from '@mui/material';
import { Warning, Delete, CheckCircle, Info } from '@mui/icons-material';
import LoadingButton from './LoadingButton';

const ConfirmDialog = ({
  open = false,
  onClose = () => {},
  onConfirm = () => {},
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'default', // 'default', 'danger', 'warning', 'success'
  loading = false,
  maxWidth = 'sm'
}) => {
  const variants = {
    default: { 
      icon: Info, 
      color: 'primary',
      iconColor: 'primary.main'
    },
    danger: { 
      icon: Delete, 
      color: 'error',
      iconColor: 'error.main'
    },
    warning: { 
      icon: Warning, 
      color: 'warning',
      iconColor: 'warning.main'
    },
    success: { 
      icon: CheckCircle, 
      color: 'success',
      iconColor: 'success.main'
    }
  };

  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <Dialog 
      open={open} 
      onClose={!loading ? onClose : undefined}
      maxWidth={maxWidth}
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconComponent sx={{ color: config.iconColor }} />
        {title}
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          {cancelText}
        </Button>
        
        <LoadingButton
          onClick={onConfirm}
          loading={loading}
          variant="contained"
          color={config.color}
          loadingText="Processando..."
        >
          {confirmText}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;