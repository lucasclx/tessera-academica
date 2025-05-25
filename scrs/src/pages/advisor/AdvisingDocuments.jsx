import React, { useState } from 'react';
import { Container, Box, Chip, Avatar, TextField, InputAdornment, Grid } from '@mui/material';
import { Search, FilterList, Visibility, History, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';

const AdvisingDocumentsOptimized = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0
  });

  // CONFIGURAÇÃO DA TABELA PARA ORIENTADOR
  const columns = [
    {
      id: 'title',
      label: 'Título',
      sortable: true,
      render: (row) => (
        <Box onClick={() => navigate(`/advisor/documents/${row.id}/review`)} sx={{ cursor: 'pointer' }}>
          <Box sx={{ fontWeight: 500, color: 'primary.main', mb: 0.5 }}>
            {row.title || "Sem Título"}
          </Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {row.description ? `${row.description.substring(0, 60)}...` : "Sem descrição"}
          </Box>
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
          <Box>
            <Box sx={{ fontWeight: 500 }}>{row.studentName || "Estudante Desconhecido"}</Box>
          </Box>
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
      render: (row) => row.updatedAt 
        ? new Date(row.updatedAt).toLocaleDateString('pt-BR')
        : '-'
    },
    {
      id: 'submittedAt',
      label: 'Submissão',
      sortable: true,
      render: (row) => row.submittedAt 
        ? new Date(row.submittedAt).toLocaleDateString('pt-BR')
        : '-'
    }
  ];

  const handleRowClick = (doc) => {
    navigate(`/advisor/documents/${doc.id}/review`);
  };

  const renderEmptyState = () => {
    if (searchTerm || statusFilter !== 'ALL') {
      return (
        <EmptyState
          icon={Search}
          title="Nenhum documento encontrado"
          description="Nenhum documento corresponde aos filtros aplicados"
          actionLabel="Limpar Filtros"
          onAction={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
          }}
          variant="filter"
        />
      );
    }

    return (
      <EmptyState
        icon={Person}
        title="Nenhum documento para orientação"
        description="Ainda não há documentos dos seus orientandos para revisar."
        variant="default"
      />
    );
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Documentos para Orientação"
        subtitle="Acompanhe e revise os trabalhos acadêmicos dos seus orientandos"
      />

      {/* FILTROS REUTILIZÁVEIS */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              label="Buscar por Título ou Aluno"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Filtrar por Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="SUBMITTED">Submetidos</MenuItem>
              <MenuItem value="REVISION">Em Revisão</MenuItem>
              <MenuItem value="APPROVED">Aprovados</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* TABELA REUTILIZÁVEL */}
      <DataTable
        data={documents}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(rowsPerPage) => setPagination(prev => ({ ...prev, rowsPerPage, page: 0 }))}
        onRowClick={handleRowClick}
        emptyState={renderEmptyState()}
      />
    </Container>
  );
};

export default AdvisingDocumentsOptimized;