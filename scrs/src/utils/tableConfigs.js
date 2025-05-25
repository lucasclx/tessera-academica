// Crie este arquivo em: src/utils/tableConfigs.js
import React from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { format } from 'date-fns';
import { Business, Email, School, SupervisorAccount } from '@mui/icons-material';
import StatusChip from '../components/ui/StatusChip';

// Configurações de colunas para documentos do estudante
export const documentColumns = {
  student: [
    {
      id: 'title',
      label: 'Título',
      sortable: true,
      render: (row) => (
        <Box sx={{ cursor: 'pointer' }}>
          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 500 }}>
            {row.title || "Sem Título"}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
            {row.description || "Sem descrição"}
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusChip status={row.status} />
    },
    {
      id: 'advisorName',
      label: 'Orientador',
      render: (row) => row.advisorName || 'Não definido'
    },
    {
      id: 'updatedAt',
      label: 'Atualizado em',
      sortable: true,
      render: (row) => row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy HH:mm') : '-'
    }
  ],

  advisor: [
    {
      id: 'title',
      label: 'Título',
      sortable: true,
      render: (row) => (
        <Box sx={{ cursor: 'pointer' }}>
          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 500 }}>
            {row.title || "Sem Título"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {row.description ? `${row.description.substring(0, 60)}...` : "Sem descrição"}
          </Typography>
        </Box>
      )
    },
    {
      id: 'studentName',
      label: 'Estudante',
      sortable: true,
      render: (row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
            {row.studentName ? row.studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {row.studentName || "Estudante Desconhecido"}
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusChip status={row.status} />
    },
    {
      id: 'updatedAt',
      label: 'Última Atualização',
      sortable: true,
      render: (row) => row.updatedAt ? format(new Date(row.updatedAt), 'dd/MM/yy') : '-'
    }
  ]
};