import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Description, Search, FilterList, Notifications, Add } from '@mui/icons-material';

const EmptyState = ({
  icon: IconComponent = Description,
  title = "Nenhum item encontrado",
  description,
  actionLabel,
  onAction,
  variant = 'default',
  size = 'medium'
}) => {
  const iconSizes = {
    small: 48,
    medium: 64,
    large: 80
  };

  const paddingY = {
    small: 3,
    medium: 4,
    large: 6
  };

  return (
    <Box 
      sx={{ 
        textAlign: 'center', 
        py: paddingY[size],
        px: 3
      }}
    >
      <IconComponent 
        sx={{ 
          fontSize: iconSizes[size], 
          color: 'text.disabled',
          mb: 2
        }} 
      />
      
      <Typography 
        variant={size === 'large' ? 'h4' : size === 'medium' ? 'h5' : 'h6'} 
        gutterBottom 
        color="text.secondary"
        sx={{ fontWeight: 500 }}
      >
        {title}
      </Typography>
      
      {description && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
        >
          {description}
        </Typography>
      )}
      
      {actionLabel && onAction && (
        <Button 
          variant="contained" 
          onClick={onAction}
          startIcon={<Add />}
          size={size === 'small' ? 'small' : 'medium'}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

// Componentes específicos para casos comuns
export const EmptyDocuments = ({ onCreateNew }) => (
  <EmptyState
    icon={Description}
    title="Nenhuma monografia ainda"
    description="Que tal criar sua primeira monografia? É rápido e fácil!"
    actionLabel="Criar Monografia"
    onAction={onCreateNew}
    size="medium"
  />
);

export const EmptySearchResults = ({ searchTerm, onClearSearch }) => (
  <EmptyState
    icon={Search}
    title="Nenhum resultado encontrado"
    description={searchTerm ? `Não encontramos nada para "${searchTerm}". Tente termos diferentes.` : "Nenhum resultado para a busca atual."}
    actionLabel={searchTerm ? "Limpar Busca" : undefined}
    onAction={onClearSearch}
    size="medium"
  />
);

export const EmptyFilterResults = ({ onClearFilters }) => (
  <EmptyState
    icon={FilterList}
    title="Nenhum item corresponde aos filtros"
    description="Tente ajustar os filtros para encontrar o que procura."
    actionLabel="Limpar Filtros"
    onAction={onClearFilters}
    size="medium"
  />
);

export const EmptyNotifications = () => (
  <EmptyState
    icon={Notifications}
    title="Nenhuma notificação"
    description="Você está em dia! Não há notificações pendentes."
    size="small"
  />
);

export default EmptyState;