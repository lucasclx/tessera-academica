import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  Tooltip,
  TextField,
  InputAdornment,
  Grid 
} from '@mui/material';
import {
  Visibility,
  Edit, 
  MoreVert,
  Description, 
  Schedule,
  Person,
  Search,
  FilterList,
  ArrowUpward,
  ArrowDownward,
  RateReviewOutlined, 
  CheckCircleOutline 
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import documentService from '../../services/documentService';
import { format } from 'date-fns'; 

const AdvisingDocuments = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  // Estados principais
  const [documents, setDocuments] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para paginação, filtros e ordenação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); 
  const [sortBy, setSortBy] = useState('updatedAt'); 
  const [sortOrder, setSortOrder] = useState('desc'); 

  // Estados para menu de ações
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const getStatusInfo = (status) => {
    const statusMap = {
      'DRAFT': { label: 'Rascunho', color: 'default', icon: <Edit fontSize="small" /> },
      'SUBMITTED': { label: 'Submetido', color: 'primary', icon: <Person fontSize="small" /> }, 
      'REVISION': { label: 'Em Revisão', color: 'warning', icon: <RateReviewOutlined fontSize="small" /> }, 
      'APPROVED': { label: 'Aprovado', color: 'success', icon: <CheckCircleOutline fontSize="small" /> }, 
      'FINALIZED': { label: 'Finalizado', color: 'info', icon: <CheckCircleOutline fontSize="small" /> }
    };
    return statusMap[status] || { label: status || 'Desconhecido', color: 'default', icon: <Description fontSize="small" /> };
  };


  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentService.getMyAdvisingDocumentsPaged(page, rowsPerPage);
      if (data && data.content) {
        let processedDocs = data.content;

        if (searchTerm) {
          processedDocs = processedDocs.filter(doc =>
            (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (doc.studentName && doc.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        if (statusFilter !== 'ALL') {
          processedDocs = processedDocs.filter(doc => doc.status === statusFilter);
        }

        processedDocs.sort((a, b) => {
          let aValue = a[sortBy];
          let bValue = b[sortBy];

          if (sortBy.includes('Date') || sortBy.includes('At')) {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
          } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
          } else if (aValue === null || aValue === undefined) { 
            return sortOrder === 'asc' ? -1 : 1;
          } else if (bValue === null || bValue === undefined) {
            return sortOrder === 'asc' ? 1 : -1;
          }


          if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        setDocuments(processedDocs);
        setTotalElements(data.totalElements);
      } else {
        setDocuments([]);
        setTotalElements(0);
      }
    } catch (err) {
      console.error('Erro ao carregar documentos de orientação:', err);
      setError('Não foi possível carregar os documentos. Tente novamente mais tarde.');
      toast.error('Erro ao carregar documentos de orientação.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [page, rowsPerPage, statusFilter, sortBy, sortOrder, searchTerm]);


  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(0);
  };

  const handleSort = (columnId) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(columnId);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, document) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDocument(null);
  };

  const handleReviewDocument = (id) => {
    handleMenuClose();
    navigate(`/advisor/documents/${id}/review`);
  };

  const handleViewHistory = (id) => {
    handleMenuClose();
    navigate(`/student/documents/${id}/compare`); 
  };


  if (loading && documents.length === 0) {
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

  const statusOptions = ['ALL', 'DRAFT', 'SUBMITTED', 'REVISION', 'APPROVED', 'FINALIZED'];


  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Documentos para Orientação
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Acompanhe e revise os trabalhos acadêmicos dos seus orientandos.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              label="Buscar por Título ou Aluno"
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Filtrar por Status"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                ),
              }}
            >
              {statusOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {getStatusInfo(option).label === option ? 'Todos' : getStatusInfo(option).label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {documents.length === 0 && !loading ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Nenhum documento encontrado
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ainda não há documentos de seus orientandos para revisar ou que correspondam aos filtros aplicados.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => handleSort('title')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Título
                  {sortBy === 'title' && (sortOrder === 'asc' ? <ArrowUpward fontSize="inherit" sx={{verticalAlign: 'middle'}}/> : <ArrowDownward fontSize="inherit" sx={{verticalAlign: 'middle'}}/>)}
                </TableCell>
                <TableCell onClick={() => handleSort('studentName')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Estudante
                  {sortBy === 'studentName' && (sortOrder === 'asc' ? <ArrowUpward fontSize="inherit" sx={{verticalAlign: 'middle'}}/> : <ArrowDownward fontSize="inherit" sx={{verticalAlign: 'middle'}}/>)}
                </TableCell>
                <TableCell onClick={() => handleSort('status')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Status
                  {sortBy === 'status' && (sortOrder === 'asc' ? <ArrowUpward fontSize="inherit" sx={{verticalAlign: 'middle'}}/> : <ArrowDownward fontSize="inherit" sx={{verticalAlign: 'middle'}}/>)}
                </TableCell>
                <TableCell onClick={() => handleSort('updatedAt')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Últ. Atualização
                  {sortBy === 'updatedAt' && (sortOrder === 'asc' ? <ArrowUpward fontSize="inherit" sx={{verticalAlign: 'middle'}}/> : <ArrowDownward fontSize="inherit" sx={{verticalAlign: 'middle'}}/>)}
                </TableCell>
                 <TableCell onClick={() => handleSort('submittedAt')} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Submissão
                  {sortBy === 'submittedAt' && (sortOrder === 'asc' ? <ArrowUpward fontSize="inherit" sx={{verticalAlign: 'middle'}}/> : <ArrowDownward fontSize="inherit" sx={{verticalAlign: 'middle'}}/>)}
                </TableCell>
                <TableCell align="right" sx={{fontWeight: 'bold'}}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress sx={{my: 2}}/>
                  </TableCell>
                </TableRow>
              )}
              {!loading && documents.map((doc) => {
                const statusInfo = getStatusInfo(doc.status);
                return (
                  <TableRow hover key={doc.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      <Typography variant="subtitle2" component="div" color="primary.main" noWrap sx={{ maxWidth: 280, cursor: 'pointer' }} onClick={() => handleReviewDocument(doc.id)}>
                        {doc.title || "Sem Título"}
                      </Typography>
                       <Tooltip title={doc.description || "Sem descrição"} placement="bottom-start">
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 280 }}>
                          {doc.description ? `${doc.description.substring(0, 45)}...` : "Sem descrição"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', mr: 1, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
                          {doc.studentName ? doc.studentName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?'}
                        </Avatar>
                        <Typography variant="body2">{doc.studentName || "Aluno Desconhecido"}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={statusInfo.label} placement="top">
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                          sx={{minWidth: 110}}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {doc.updatedAt ? format(new Date(doc.updatedAt), 'dd/MM/yy HH:mm') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {doc.submittedAt ? format(new Date(doc.submittedAt), 'dd/MM/yy HH:mm') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Revisar / Ver Detalhes">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleReviewDocument(doc.id)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mais Opções">
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, doc)}>
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
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

      {selectedDocument && (
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => handleReviewDocument(selectedDocument.id)}>
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            <ListItemText>Revisar / Ver Detalhes</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleViewHistory(selectedDocument.id)}>
            <ListItemIcon>
              <History fontSize="small" />
            </ListItemIcon>
            <ListItemText>Histórico de Versões</ListItemText>
          </MenuItem>
        </Menu>
      )}
    </Container>
  );
};

export default AdvisingDocuments;