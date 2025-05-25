// src/components/ui/GenericDataView.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Box, TextField, InputAdornment, Grid, Card, CardContent,
  Typography, Button, MenuItem, Fab
} from '@mui/material';
import { Search, FilterList, Add } from '@mui/icons-material';

import DataTable from './DataTable';
import PageHeader from './PageHeader';
import { TableSkeleton } from './SkeletonLoader';

/**
 * Componente genérico para visualização de dados tabulares
 * Consolida funcionalidades comuns entre MyDocuments, AdvisingDocuments, PendingRegistrations
 */
const GenericDataView = ({
  // Props de configuração
  title,
  subtitle,
  createButtonLabel,
  onCreateNew,
  
  // Props de dados
  data = [],
  loading = false,
  error = null,
  totalElements = 0,
  
  // Props de paginação
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  
  // Props de busca e filtros
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  
  // Props da tabela
  columns = [],
  onRowClick,
  onMenuClick,
  emptyState,
  
  // Props de ações
  actions = [],
  
  // Customizações
  showCreateFab = true,
  showStats = false,
  stats = {},
  
  // Callbacks
  onRefresh
}) => {
  const handleSearchChange = (event) => {
    if (onSearchChange) {
      onSearchChange(event.target.value);
    }
  };

  const renderStats = () => {
    if (!showStats || !stats || Object.keys(stats).length === 0) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(stats).map(([key, { value, label, color = 'primary', bgcolor }]) => (
          <Grid item xs={6} sm={3} key={key}>
            <Card sx={{ textAlign: 'center', bgcolor: bgcolor || `${color}.50` }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color={`${color}.main`} sx={{ fontWeight: 700 }}>
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderFilters = () => {
    if (!filters || filters.length === 0) return null;
    
    return (
      <Card elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Campo de busca */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* Filtros dinâmicos */}
          {filters.map((filter, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <TextField
                select={filter.type === 'select'}
                fullWidth
                variant="outlined"
                label={filter.label}
                value={filter.value}
                onChange={filter.onChange}
                InputProps={filter.type !== 'select' ? {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  ),
                } : undefined}
              >
                {filter.type === 'select' && filter.options?.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ))}
        </Grid>
      </Card>
    );
  };

  if (error) {
    return (
      <Container>
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
        {onRefresh && (
          <Button onClick={onRefresh} sx={{ mt: 1 }}>
            Tentar Novamente
          </Button>
        )}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={[
          ...(actions || []),
          ...(onCreateNew ? [{
            label: createButtonLabel || 'Criar Novo',
            variant: 'contained',
            icon: <Add />,
            onClick: onCreateNew
          }] : [])
        ]}
      />

      {renderStats()}
      {renderFilters()}

      {loading ? (
        <TableSkeleton rows={rowsPerPage} />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          pagination={{
            total: totalElements,
            page,
            rowsPerPage,
            rowsPerPageOptions: [5, 10, 25]
          }}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          onRowClick={onRowClick}
          onMenuClick={onMenuClick}
          emptyState={emptyState}
        />
      )}

      {/* FAB para mobile */}
      {showCreateFab && onCreateNew && (
        <Fab 
          color="primary" 
          aria-label="add" 
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={onCreateNew}
        >
          <Add />
        </Fab>
      )}
    </Container>
  );
};

export default GenericDataView;