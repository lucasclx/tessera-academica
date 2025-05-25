import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  Box, 
  TablePagination, 
  Chip,
  CircularProgress,
  Avatar,
  TextField,
  InputAdornment,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  Person, 
  Email, 
  Business, 
  Search,
  CheckCircle,
  Cancel,
  School,
  SupervisorAccount
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import moment from 'moment';

// ADICIONADO: Import dos skeleton loaders
import { 
  TableSkeleton, 
  PageSkeleton 
} from '../../components/ui';

import adminService from '../../services/adminService';

const PendingRegistrations = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState(null);

  // Estados para estatísticas
  const [stats, setStats] = useState({
    totalPending: 0,
    studentsCount: 0,
    advisorsCount: 0,
    thisWeekCount: 0
  });

  useEffect(() => {
    fetchRegistrations();
    loadStats();
  }, [page, rowsPerPage]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPendingRegistrations(page, rowsPerPage);
      
      let filteredData = data.content || [];
      
      // Filtro de busca
      if (searchTerm) {
        filteredData = filteredData.filter(reg => 
          reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.department.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setRegistrations(filteredData);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      setError('Erro ao carregar solicitações de cadastro');
      toast.error('Erro ao carregar solicitações de cadastro');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adminService.getDashboardStats();
      setStats({
        totalPending: statsData.pendingRegistrations || 0,
        studentsCount: registrations.filter(r => r.user.roles.some(role => role.name === 'STUDENT')).length,
        advisorsCount: registrations.filter(r => r.user.roles.some(role => role.name === 'ADVISOR')).length,
        thisWeekCount: registrations.filter(r => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(r.createdAt) > weekAgo;
        }).length
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/registrations/${id}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
    // Trigger search after user stops typing
    setTimeout(() => {
      fetchRegistrations();
    }, 300);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'STUDENT':
        return <Chip label="Estudante" color="primary" size="small" icon={<School fontSize="small" />} />;
      case 'ADVISOR':
        return <Chip label="Orientador" color="secondary" size="small" icon={<SupervisorAccount fontSize="small" />} />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  // MODIFICADO: Função para renderizar empty state
  const renderEmptyState = () => {
    if (searchTerm) {
      return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Search sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            Nenhuma solicitação encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Não encontramos solicitações para "{searchTerm}"
          </Typography>
          <Button variant="outlined" onClick={() => setSearchTerm('')}>
            Limpar Busca
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom color="text.secondary">
          Todas as solicitações foram processadas!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Não há solicitações de cadastro pendentes no momento.
        </Typography>
      </Box>
    );
  };

  // MODIFICADO: Tratamento de erro
  if (error && !loading) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button onClick={fetchRegistrations} sx={{ ml: 2 }}>
            Tentar Novamente
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* MODIFICADO: Header com skeleton */}
      {loading ? (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ height: 48, bgcolor: 'grey.100', borderRadius: 1, mb: 1, width: '60%' }} />
          <Box sx={{ height: 24, bgcolor: 'grey.100', borderRadius: 1, width: '80%' }} />
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Solicitações de Cadastro Pendentes
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {stats.totalPending} solicitações pendentes de aprovação
          </Typography>
        </Box>
      )}

      {/* MODIFICADO: Cards de estatísticas com skeleton */}
      {loading ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ height: 40, bgcolor: 'grey.100', borderRadius: 1, mb: 1 }} />
                  <Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'error.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                  {stats.totalPending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Pendentes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'primary.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                  {stats.studentsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estudantes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'secondary.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                  {stats.advisorsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orientadores
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'success.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                  {stats.thisWeekCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Esta Semana
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* MODIFICADO: Barra de busca com skeleton */}
      {loading ? (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ height: 56, bgcolor: 'grey.100', borderRadius: 1 }} />
        </Box>
      ) : (
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar por nome, email, instituição ou departamento..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                }
              }
            }}
          />
        </Box>
      )}

      {/* MODIFICADO: Conteúdo principal com skeleton loading */}
      {loading ? (
        // SKELETON LOADING - Tabela com avatar + texto na primeira coluna
        <TableSkeleton 
          rows={8}
          columns={['40%', '20%', '25%', '15%']}
        />
      ) : registrations.length === 0 ? (
        // EMPTY STATE
        renderEmptyState()
      ) : (
        // CONTEÚDO REAL - Tabela com dados
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuário</TableCell>
                <TableCell>Papel</TableCell>
                <TableCell>Instituição</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow 
                  key={reg.id} 
                  hover 
                  onClick={() => handleViewDetails(reg.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: reg.user.roles[0]?.name === 'STUDENT' ? 'primary.main' : 'secondary.main',
                          fontSize: '0.875rem'
                        }}
                      >
                        {reg.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {reg.user.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {reg.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {reg.user.roles.map(role => (
                        <Box key={role.name} sx={{ mb: 0.5 }}>
                          {getRoleLabel(role.name)}
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                        <Business sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {reg.institution}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {reg.department}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {moment(reg.createdAt).format('DD/MM/YYYY')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {moment(reg.createdAt).format('HH:mm')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(reg.id);
                      }}
                    >
                      Detalhes
                    </Button>
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </TableContainer>
      )}
    </Container>
  );
};

export default PendingRegistrations;