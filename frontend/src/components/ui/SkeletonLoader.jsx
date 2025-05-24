// src/components/ui/SkeletonLoader.jsx
import React from 'react';
import { 
  Skeleton, 
  Card, 
  CardContent, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Grid
} from '@mui/material';

// =============================================================================
// SKELETON PARA CARDS DE DOCUMENTOS
// =============================================================================
export const DocumentCardSkeleton = () => (
  <Card sx={{ mb: 2, p: 2 }}>
    <CardContent>
      {/* Linha do título */}
      <Skeleton 
        variant="text" 
        width="70%" 
        height={28} 
        sx={{ mb: 1 }}
      />
      
      {/* Linha da descrição */}
      <Skeleton 
        variant="text" 
        width="100%" 
        height={20} 
        sx={{ mb: 1 }}
      />
      <Skeleton 
        variant="text" 
        width="40%" 
        height={20} 
        sx={{ mb: 2 }}
      />
      
      {/* Chips de status e ações */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={60} height={24} />
        </Box>
        <Skeleton variant="rounded" width={100} height={32} />
      </Box>
    </CardContent>
  </Card>
);

// =============================================================================
// SKELETON PARA TABELAS
// =============================================================================
export const TableSkeleton = ({ 
  rows = 5, 
  columns = ['40%', '20%', '20%', '20%'] // Larguras das colunas
}) => (
  <TableContainer component={Paper} elevation={2}>
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((width, index) => (
            <TableCell key={`header-${index}`}>
              <Skeleton 
                variant="text" 
                width={width} 
                height={20}
                sx={{ fontWeight: 'bold' }}
              />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={`row-${rowIndex}`}>
            {columns.map((width, colIndex) => (
              <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                {colIndex === 0 ? (
                  // Primeira coluna com avatar + texto
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="80%" height={20} />
                      <Skeleton variant="text" width="60%" height={16} />
                    </Box>
                  </Box>
                ) : colIndex === 1 ? (
                  // Segunda coluna com chip
                  <Skeleton variant="rounded" width={80} height={24} />
                ) : (
                  // Outras colunas com texto normal
                  <Skeleton variant="text" width={width} height={20} />
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// =============================================================================
// SKELETON PARA LISTAS DE NOTIFICAÇÕES
// =============================================================================
export const NotificationSkeleton = () => (
  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      {/* Avatar */}
      <Skeleton variant="circular" width={48} height={48} />
      
      {/* Conteúdo */}
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="80px" height={20} />
        </Box>
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="40%" height={20} />
      </Box>
      
      {/* Ações */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" width={32} height={32} />
        <Skeleton variant="rounded" width={32} height={32} />
      </Box>
    </Box>
  </Box>
);

// =============================================================================
// SKELETON PARA PÁGINA INTEIRA
// =============================================================================
export const PageSkeleton = () => (
  <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
    {/* Header da página */}
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
    </Box>
    
    {/* Cards de estatísticas */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto', mb: 1 }} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
    
    {/* Barra de busca */}
    <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 3 }} />
    
    {/* Tabela */}
    <TableSkeleton rows={8} />
  </Box>
);

// =============================================================================
// SKELETON PARA FORMULÁRIOS
// =============================================================================
export const FormSkeleton = () => (
  <Box sx={{ p: 3 }}>
    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
    
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 2 }} />
      </Grid>
      <Grid item xs={12}>
        <Skeleton variant="rounded" width="100%" height={120} sx={{ mb: 2 }} />
      </Grid>
    </Grid>
    
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
      <Skeleton variant="rounded" width={100} height={40} />
      <Skeleton variant="rounded" width={120} height={40} />
    </Box>
  </Box>
);

// =============================================================================
// SKELETON CUSTOMIZADO PARA DOCUMENTOS
// =============================================================================
export const CustomDocumentSkeleton = ({ withAvatar = true, withActions = true }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {withAvatar && <Skeleton variant="circular" width={48} height={48} />}
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="50%" height={20} />
        </Box>
        {withActions && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="rounded" width={32} height={32} />
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);