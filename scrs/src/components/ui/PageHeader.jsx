import React from 'react';
import { 
  Box, Typography, Breadcrumbs, Link, Button,
  Chip, Divider, IconButton
} from '@mui/material';
import { ArrowBack, NavigateNext } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  backButton = false,
  status = null,
  variant = 'default' // 'default', 'compact'
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box sx={{ mb: variant === 'compact' ? 2 : 4 }}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((crumb, index) => (
            crumb.href ? (
              <Link 
                key={index}
                color="inherit" 
                href={crumb.href}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(crumb.href);
                }}
                sx={{ textDecoration: 'none' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key={index} color="text.primary">
                {crumb.label}
              </Typography>
            )
          ))}
        </Breadcrumbs>
      )}

      {/* Header Content */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: variant === 'compact' ? 'center' : 'flex-start',
        flexWrap: 'wrap',
        gap: 2,
        mb: variant === 'compact' ? 1 : 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          {backButton && (
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
          )}
          
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography 
                variant={variant === 'compact' ? 'h5' : 'h4'} 
                component="h1"
                sx={{ fontWeight: 600 }}
              >
                {title}
              </Typography>
              
              {status && (
                <StatusChip status={status} />
              )}
            </Box>
            
            {subtitle && (
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        {actions.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'contained'}
                color={action.color || 'primary'}
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
                size={variant === 'compact' ? 'small' : 'medium'}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      <Divider />
    </Box>
  );
};

export default PageHeader;