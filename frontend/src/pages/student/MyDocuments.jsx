import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Grid,
  Card, CardContent, CardActions, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Avatar,
  Menu, MenuItem, ListItemIcon, ListItemText, Fab,
  Alert, CircularProgress, Divider
} from '@mui/material';
import { 
  Add, Edit, Visibility, Delete, MoreVert,
  Description, Schedule, Person, Send,
  CheckCircle, Warning, Info, Error,
  FilterList, Sort
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import documentService from '../../services/documentService';

const MyDocuments = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  // Estados principais
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para paginação e filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados para dialogs
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, [page, rowsPerPage, statusFilter, sortBy, sortOrder]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar o serviço paginado
      const data = await documentService.getMyDocumentsPaged(page, rowsPerPage);
      
      // Filtrar por status se necessário
      let filteredDocs = data.content || data;
      if (statusFilter !== 'ALL') {
        filteredDocs = filteredDocs.filter(doc => doc.status === statusFilter);
      }
      
      // Ordenar documentos
      filteredDocs.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy.includes('Date') || sortBy.includes('At')) {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setDocuments(filteredDocs);
      
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setError('Erro ao carregar documentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/student/documents/new');
  };

  const handleViewDocument = (id) => {
    navigate(`/student/documents/${id}`);
  };

  const handleEditDocument = (id) => {
    navigate(`/student/documents/${id}?edit=true`);
  };

  const handleDeleteDocument = async () => {
    try {
      if (documentToDelete) {
        await documentService.deleteDocument(documentToDelete.id);
        await loadDocuments();
        setDeleteDialog(false);
        setDocumentToDelete(null);
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro ao excluir documento. Verifique se não há versões pendentes.');
    }
  };

  const handleMenuClick = (event, document) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDocument(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'DRAFT': { 
        label: 'Rascunho', 
        color: 'default', 
        icon: <Edit />,
        description: 'Documento em edição'
      },
      'SUBMITTED': { 
        label: 'Enviado para Revisão', 
        color: 'primary', 
        icon: <Send />,
        description: 'Aguardando feedback do orientador'
      },
      'REVISION': { 
        label: 'Em Revisão', 
        color: 'warning', 
        icon: <Warning />,
        description: 'Orientador solicitou alterações'
      },
      'APPROVED': { 
        label: 'Aprovado', 
        color: 'success', 
        icon: <CheckCircle />,
        description: 'Aprovado pelo orientador'
      },
      'FINALIZED': { 
        label: 'Finalizado', 
        color: 'info', 
        icon: <Info />,
        description: 'Documento finalizado'
      }
    };
    return statusMap[status] || statusMap['DRAFT'];
  };

  const getDocumentStats = () => {
    const stats = {
      total: documents.length,
      draft: documents.filter(d => d.status === 'DRAFT').length,
      submitted: documents.filter(d => d.status === 'SUBMITTED').length,
      revision: documents.filter(d => d.status === 'REVISION').length,
      approved: documents.filter(d => d.status === 'APPROVED').length,
      finalized: documents.filter(d => d.status === 'FINALIZED').length,
    };
    return stats;
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Carregando documentos...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={loadDocuments} sx={{ ml: 2 }}>
            Tentar Novamente
          </Button>
        </Alert>
      </Container>
    );
  }

  const stats = getDocumentStats();

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Minhas Monografias
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gerencie e acompanhe o progresso dos seus trabalhos acadêmicos
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          size="large"
          onClick={handleCreateNew}
        >
          Nova Monografia
        </Button>
      </Box>

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="text.secondary">
                {stats.draft}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rascunhos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {stats.revision}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Em Revisão
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main">
                {stats.submitted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enviados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aprovados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {stats.finalized}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Finalizados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros e Ordenação */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterList />
          <Typography variant="subtitle2">Filtros:</Typography>
          
          <Button
            variant={statusFilter === 'ALL' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('ALL')}
          >
            Todos
          </Button>
          
          <Button
            variant={statusFilter === 'DRAFT' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('DRAFT')}
          >
            Rascunhos
          </Button>
          
          <Button
            variant={statusFilter === 'SUBMITTED' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('SUBMITTED')}
          >
            Enviados
          </Button>
          
          <Button
            variant={statusFilter === 'REVISION' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('REVISION')}
          >
            Em Revisão
          </Button>
          
          <Button
            variant={statusFilter === 'APPROVED' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter('APPROVED')}
          >
            Aprovados
          </Button>

          <Divider orientation="vertical" flexItem />
          
          <Sort />
          <Typography variant="subtitle2">Ordenar por:</Typography>
          
          <Button
            variant={sortBy === 'updatedAt' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSortBy('updatedAt')}
          >
            Data de Atualização
          </Button>
          
          <Button
            variant={sortBy === 'createdAt' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSortBy('createdAt')}
          >
            Data de Criação
          </Button>
          
          <Button
            variant={sortBy === 'title' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setSortBy('title')}
          >
            Título
          </Button>
        </Box>
      </Paper>

      {/* Lista de Documentos */}
      {documents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Nenhuma monografia encontrada
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Você ainda não criou nenhuma monografia. Comece agora criando sua primeira!
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />}
            size="large"
            onClick={handleCreateNew}
          >
            Criar Primeira Monografia
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Orientador</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell>Atualizado em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((document) => {
                const statusInfo = getStatusInfo(document.status);
                return (
                  <TableRow 
                    key={document.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewDocument(document.id)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Description />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {document.title}
                          </Typography>
                          {document.description && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {document.description.length > 50 
                                ? `${document.description.substring(0, 50)}...`
                                : document.description
                              }
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        title={statusInfo.description}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {document.advisorName}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {new Date(document.createdAt).toLocaleDateString('pt-BR')}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(document.updatedAt).toLocaleDateString('pt-BR')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, document);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={documents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      {/* FAB para criar nova monografia */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleCreateNew}
      >
        <Add />
      </Fab>

      {/* Menu de Ações */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleViewDocument(selectedDocument?.id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility />
          </ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleEditDocument(selectedDocument?.id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        
        {selectedDocument?.status === 'DRAFT' && (
          <MenuItem onClick={() => {
            setDocumentToDelete(selectedDocument);
            setDeleteDialog(true);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <Delete />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Dialog de Confirmação para Excluir */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir a monografia "{documentToDelete?.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteDocument} 
            color="error" 
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyDocuments;