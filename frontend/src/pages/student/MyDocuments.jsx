import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Grid,
  Card, CardContent, CardActions, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Avatar,
  Menu, MenuItem, ListItemIcon, ListItemText, Fab,
  Alert, CircularProgress, Divider, InputAdornment,
  Select, FormControl, InputLabel
} from '@mui/material';
import { 
  Add, Edit, Visibility, Delete, MoreVert,
  Description, Schedule, Person, Send,
  CheckCircle, Warning, Info, Error,
  FilterList, Sort as SortIcon, Search
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import documentService from '../../services/documentService';
import { format } from 'date-fns';

const MyDocuments = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const statusOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'DRAFT', label: 'Rascunho', icon: <Edit fontSize="small"/>, color: 'default' },
    { value: 'SUBMITTED', label: 'Enviado', icon: <Send fontSize="small"/>, color: 'primary' },
    { value: 'REVISION', label: 'Em Revisão', icon: <Warning fontSize="small"/>, color: 'warning' },
    { value: 'APPROVED', label: 'Aprovado', icon: <CheckCircle fontSize="small"/>, color: 'success' },
    { value: 'FINALIZED', label: 'Finalizado', icon: <Info fontSize="small"/>, color: 'info' }
  ];

  const sortOptions = [
    { value: 'updatedAt,desc', label: 'Atualização (Mais Recente)' },
    { value: 'updatedAt,asc', label: 'Atualização (Mais Antiga)' },
    { value: 'createdAt,desc', label: 'Criação (Mais Recente)' },
    { value: 'createdAt,asc', label: 'Criação (Mais Antiga)' },
    { value: 'title,asc', label: 'Título (A-Z)' },
    { value: 'title,desc', label: 'Título (Z-A)' },
  ];


  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentSortBy = sortBy.split(',')[0];
      const currentSortOrder = sortOrder;

      const data = await documentService.getMyDocumentsPaged(page, rowsPerPage, searchTerm, statusFilter, currentSortBy, currentSortOrder);
      
      if (data && data.content) {
        setDocuments(data.content);
        setTotalElements(data.totalElements);
      } else {
        setDocuments([]);
        setTotalElements(0);
        console.warn('Estrutura de dados inesperada ao carregar documentos:', data);
      }
      
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      setError('Erro ao carregar documentos. Tente novamente.');
      toast.error('Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadDocuments();
  }, [page, rowsPerPage, statusFilter, sortBy, sortOrder, searchTerm]);


  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset page on new search
  };

  const handleSortChange = (event) => {
    const [newSortBy, newSortOrder] = event.target.value.split(',');
    setSortBy(newSortBy + "," + newSortOrder); // Para manter o formato value
    // Atualiza sortBy e sortOrder separadamente para o useEffect e chamada de API
    // Esta lógica foi simplificada para definir sortBy para o valor completo "campo,ordem"
    // e o useEffect agora usa sortBy (que contém "campo,ordem")
    // O serviço de backend precisa ser ajustado para lidar com "campo,ordem" no parâmetro sortBy
    // ou dividir isso no frontend antes de chamar o serviço.
    // Para simplificar, vamos assumir que `loadDocuments` e `documentService` podem lidar com sortBy como "campo,ordem".
    // No entanto, a implementação atual de loadDocuments separa eles, então vamos manter assim.
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(0);
  };

  const validateDocumentId = (id, actionName = 'navegar') => {
    if (!id && id !== 0) {
      toast.error(`ID do documento inválido para ${actionName}`);
      return false;
    }
    return true;
  };

  const handleCreateNew = () => navigate('/student/documents/new');
  const handleViewDocument = (id) => validateDocumentId(id, 'visualizar') && navigate(`/student/documents/${id}`);
  const handleEditDocument = (id) => validateDocumentId(id, 'editar') && navigate(`/student/documents/${id}?edit=true`);

  const handleDeleteDocument = async () => {
    if (documentToDelete && validateDocumentId(documentToDelete.id, 'excluir')) {
      try {
        await documentService.deleteDocument(documentToDelete.id);
        toast.success('Documento excluído com sucesso');
        setDeleteDialog(false);
        setDocumentToDelete(null);
        loadDocuments(); // Recarregar
      } catch (error) {
        toast.error(error.response?.data?.message || 'Erro ao excluir documento.');
      }
    }
  };

  const handleMenuClick = (event, doc) => {
    if (doc && validateDocumentId(doc.id, 'abrir menu')) {
      setMenuAnchor(event.currentTarget);
      setSelectedDocument(doc);
    }
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDocument(null);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusInfo = (statusValue) => {
    return statusOptions.find(opt => opt.value === statusValue) || { label: statusValue, color: 'default', icon: <Description /> };
  };


  if (loading && documents.length === 0) {
    return <Container><Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><CircularProgress /><Typography sx={{ ml: 2 }}>Carregando...</Typography></Box></Container>;
  }

  if (error) {
    return <Container><Alert severity="error" sx={{ mt: 2 }}>{error}<Button onClick={loadDocuments} sx={{ ml: 2 }}>Tentar Novamente</Button></Alert></Container>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>Minhas Monografias</Typography>
          <Typography variant="subtitle1" color="text.secondary">Gerencie seus trabalhos acadêmicos</Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Add />} size="large" onClick={handleCreateNew}>Nova Monografia</Button>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth variant="outlined" label="Buscar por Título ou Descrição" value={searchTerm} onChange={handleSearchChange}
              InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>)}}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                {statusOptions.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Ordenar Por</InputLabel>
              <Select value={`${sortBy},${sortOrder}`} label="Ordenar Por" onChange={handleSortChange}>
                {sortOptions.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p:3 }}><CircularProgress/></Box>}
      {!loading && documents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>Nenhuma monografia encontrada</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchTerm || statusFilter !== 'ALL' ? 'Nenhum documento corresponde aos filtros aplicados.' : 'Você ainda não criou nenhuma monografia.'}
          </Typography>
          <Button variant="contained" color="primary" startIcon={<Add />} size="large" onClick={handleCreateNew}>Criar Primeira Monografia</Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Orientador</TableCell>
                <TableCell>Atualizado em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => {
                if (!doc || (!doc.id && doc.id !== 0)) return null;
                const statusInfo = getStatusInfo(doc.status);
                return (
                  <TableRow hover key={doc.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" onClick={() => handleViewDocument(doc.id)} sx={{cursor: 'pointer'}}>
                      <Typography variant="subtitle2" color="primary.main">{doc.title || "Sem Título"}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{maxWidth: 250}}>{doc.description || "Sem descrição"}</Typography>
                    </TableCell>
                    <TableCell><Chip icon={statusInfo.icon} label={statusInfo.label} color={statusInfo.color} size="small" /></TableCell>
                    <TableCell>{doc.advisorName || 'Não definido'}</TableCell>
                    <TableCell>{doc.updatedAt ? format(new Date(doc.updatedAt), 'dd/MM/yy HH:mm') : '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuClick(e, doc); }}><MoreVert /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              }).filter(Boolean)}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
          />
        </TableContainer>
      )}

      <Fab color="primary" aria-label="add" sx={{position: 'fixed', bottom: 24, right: 24}} onClick={handleCreateNew}><Add /></Fab>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { if (selectedDocument) handleViewDocument(selectedDocument.id); handleMenuClose(); }}><ListItemIcon><Visibility fontSize="small" /></ListItemIcon><ListItemText>Visualizar</ListItemText></MenuItem>
        <MenuItem onClick={() => { if (selectedDocument) handleEditDocument(selectedDocument.id); handleMenuClose(); }}><ListItemIcon><Edit fontSize="small" /></ListItemIcon><ListItemText>Editar</ListItemText></MenuItem>
        {selectedDocument?.status === 'DRAFT' && (
          <MenuItem onClick={() => { setDocumentToDelete(selectedDocument); setDeleteDialog(true); handleMenuClose(); }}><ListItemIcon><Delete fontSize="small" /></ListItemIcon><ListItemText>Excluir</ListItemText></MenuItem>
        )}
      </Menu>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent><Typography>Tem certeza que deseja excluir "{documentToDelete?.title}"? Esta ação não pode ser desfeita.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <Button onClick={handleDeleteDocument} color="error" variant="contained">Excluir</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyDocuments;