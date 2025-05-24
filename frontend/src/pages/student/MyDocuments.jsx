import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Add, Visibility, Edit, Delete, MoreVert } from '@mui/icons-material';

// NOVOS COMPONENTES REUTILIZÁVEIS
import DataTable from '../../components/ui/DataTable';
import StatusChip from '../../components/ui/StatusChip';
import EmptyState, { EmptyDocuments } from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const MyDocumentsOptimized = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0
  });

  // CONFIGURAÇÃO DA TABELA - Muito mais limpo!
  const columns = [
    {
      id: 'title',
      label: 'Título',
      field: 'title',
      sortable: true,
      render: (row) => (
        <Box>
          <Box sx={{ fontWeight: 500, color: 'primary.main', cursor: 'pointer' }}>
            {row.title || "Sem Título"}
          </Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 0.5 }}>
            {row.description || "Sem descrição"}
          </Box>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      field: 'status',
      sortable: true,
      render: (row) => <StatusChip status={row.status} />
    },
    {
      id: 'advisorName',
      label: 'Orientador',
      field: 'advisorName',
      render: (row) => row.advisorName || 'Não definido'
    },
    {
      id: 'updatedAt',
      label: 'Atualizado em',
      field: 'updatedAt',
      sortable: true,
      render: (row) => row.updatedAt 
        ? new Date(row.updatedAt).toLocaleDateString('pt-BR')
        : '-'
    }
  ];

  // HANDLERS
  const handleRowClick = (doc) => {
    navigate(`/student/documents/${doc.id}`);
  };

  const handleMenuClick = (event, doc) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDoc(doc);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDoc(null);
  };

  const handleDelete = async () => {
    // Lógica de delete
    setDeleteDialog(false);
    setSelectedDoc(null);
  };

  // EMPTY STATE INTELIGENTE
  const renderEmptyState = () => {
    if (loading) return null;
    
    // Se tem filtros aplicados mas nenhum resultado
    if (/* algum filtro ativo */ false) {
      return (
        <EmptyState
          icon={Search}
          title="Nenhum documento encontrado"
          description="Tente ajustar os filtros ou termo de busca"
          actionLabel="Limpar Filtros"
          onAction={() => {/* limpar filtros */}}
          variant="filter"
        />
      );
    }
    
    // Se não tem documentos mesmo
    return (
      <EmptyDocuments onCreateNew={() => navigate('/student/documents/new')} />
    );
  };

  return (
    <Container maxWidth="lg">
      {/* HEADER PADRONIZADO */}
      <PageHeader
        title="Minhas Monografias"
        subtitle="Gerencie seus trabalhos acadêmicos"
        actions={[
          {
            label: 'Nova Monografia',
            icon: <Add />,
            onClick: () => navigate('/student/documents/new'),
            variant: 'contained'
          }
        ]}
      />

      {/* TABELA REUTILIZÁVEL - Substitui todo aquele código repetitivo! */}
      <DataTable
        data={documents}
        columns={columns}
        loading={loading}
        pagination={{
          ...pagination,
          rowsPerPageOptions: [5, 10, 25]
        }}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onRowsPerPageChange={(rowsPerPage) => setPagination(prev => ({ ...prev, rowsPerPage, page: 0 }))}
        onRowClick={handleRowClick}
        onMenuClick={handleMenuClick}
        onSort={(columnId) => {/* lógica de sort */}}
        emptyState={renderEmptyState()}
      />

      {/* MENU DE AÇÕES */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { 
          navigate(`/student/documents/${selectedDoc?.id}`);
          handleMenuClose();
        }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { 
          navigate(`/student/documents/${selectedDoc?.id}?edit=true`);
          handleMenuClose();
        }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        
        {selectedDoc?.status === 'DRAFT' && (
          <MenuItem onClick={() => { 
            setDeleteDialog(true);
            handleMenuClose();
          }}>
            <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* DIALOG DE CONFIRMAÇÃO REUTILIZÁVEL */}
      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir "${selectedDoc?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="danger"
      />
    </Container>
  );
};

export default MyDocumentsOptimized;