// Substitua o conteúdo de: src/pages/student/MyDocuments.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button, Grid,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  TextField, InputAdornment, FormControl, InputLabel, Select,
  Alert, CircularProgress, Fab
} from '@mui/material';
import { 
  Add, Edit, Visibility, Delete, MoreVert,
  Search, FilterList, CheckCircle, Warning, Info, Error, Send
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import documentService from '../../services/documentService';

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
  
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const statusOptions = [
    { value: 'ALL', label: 'Todos' },
    { value: 'DRAFT', label: 'Rascunho' },
    { value: 'SUBMITTED', label: 'Enviado' },
    { value: 'REVISION', label: 'Em Revisão' },
    { value: 'APPROVED', label: 'Aprovado' },
    { value: 'FINALIZED', label: 'Finalizado' }
  ];

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await documentService.getMyDocumentsPaged(
        page, 
        rowsPerPage, 
        searchTerm, 
        statusFilter, 
        'updatedAt', 
        'desc'
      );
      
      if (data && data.content) {
        setDocuments(data.content);
        setTotalElements(data.totalElements);
      } else {
        setDocuments([]);
        setTotalElements(0);
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
  }, [page, rowsPerPage, statusFilter, searchTerm]);

  const getStatusChip = (status) => {
    const configs = {
      'DRAFT': { label: 'Rascunho', color: 'default', icon: <Edit fontSize="small" /> },
      'SUBMITTED': { label: 'Enviado', color: 'primary', icon: <Send fontSize="small" /> },
      'REVISION': { label: 'Em Revisão', color: 'warning', icon: <Warning fontSize="small" /> },
      'APPROVED': { label: 'Aprovado', color: 'success', icon: <CheckCircle fontSize="small" /> },
      'FINALIZED': { label: 'Finalizado', color: 'info', icon: <Info fontSize="small" /> }
    };
    
    const config = configs[status] || { label: status, color: 'default', icon: null };
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" />;
  };

  const handleMenuClick = (event, doc) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDocument(doc);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDocument(null);
  };

  const handleDeleteDocument = async () => {
    if (selectedDocument) {
      if (window.confirm(`Tem certeza que deseja excluir "${selectedDocument.title}"?`)) {
        try {
          await documentService.deleteDocument(selectedDocument.id);
          toast.success('Documento excluído com sucesso');
          loadDocuments();
          handleMenuClose();
        } catch (error) {
          toast.error('Erro ao excluir documento');
        }
      }
    }
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={loadDocuments} sx={{ ml: 2 }}>Tentar Novamente</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Minhas Monografias
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gerencie seus trabalhos acadêmicos
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />} 
          size="large" 
          onClick={() => navigate('/student/documents/new')}
        >
          Nova Monografia
        </Button>
      </Box>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              variant="outlined" 
              label="Buscar por Título ou Descrição" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select 
                value={statusFilter} 
                label="Status" 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Conteúdo */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Nenhuma monografia encontrada</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchTerm || statusFilter !== 'ALL' ? 
              'Nenhum documento corresponde aos filtros aplicados.' : 
              'Você ainda não criou nenhuma monografia.'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Add />} 
            size="large" 
            onClick={() => navigate('/student/documents/new')}
          >
            Criar Primeira Monografia
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
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
              {documents.map((doc) => (
                <TableRow 
                  hover 
                  key={doc.id} 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/student/documents/${doc.id}`)}
                >
                  <TableCell>
                    <Typography variant="subtitle2" color="primary.main">
                      {doc.title || "Sem Título"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{maxWidth: 250}}>
                      {doc.description || "Sem descrição"}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(doc.status)}</TableCell>
                  <TableCell>{doc.advisorName || 'Não definido'}</TableCell>
                  <TableCell>
                    {doc.updatedAt ? format(new Date(doc.updatedAt), 'dd/MM/yy HH:mm') : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleMenuClick(e, doc); 
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </TableContainer>
      )}

      {/* FAB para mobile */}
      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{position: 'fixed', bottom: 24, right: 24}} 
        onClick={() => navigate('/student/documents/new')}
      >
        <Add />
      </Fab>

      {/* Menu de ações */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { 
          navigate(`/student/documents/${selectedDocument?.id}`); 
          handleMenuClose(); 
        }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { 
          navigate(`/student/documents/${selectedDocument?.id}?edit=true`); 
          handleMenuClose(); 
        }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        {selectedDocument?.status === 'DRAFT' && (
          <MenuItem onClick={handleDeleteDocument}>
            <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Container>
  );
};

export default MyDocuments;