import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const LoadingButton = ({
  loading = false,
  disabled = false,
  children,
  loadingText,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={loading || disabled}
      startIcon={loading ? (
        <CircularProgress size={16} color="inherit" />
      ) : (
        props.startIcon
      )}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};

export default LoadingButton;