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
  InputAdornment
} from '@mui/material';
import { 
  Person, 
  Email, 
  Business, 
  Search,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';

const PendingRegistrations = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    fetchRegistrations();
  }, [page, rowsPerPage]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingRegistrations(page, rowsPerPage);
      
      let filteredData = data.content || [];
      
      // Filtro de busca simples
      if (searchTerm) {
        filteredData = filteredData.filter(reg => 
          reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reg.institution.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setRegistrations(filteredData);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar solicitações de cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (registration) => {
    navigate(`/admin/registrations/${registration.id}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getRoleChip = (role) => {
    switch(role) {
      case 'STUDENT':
        return <Chip label="Estudante" size="small" color="primary" />;
      case 'ADVISOR':
        return <Chip label="Orientador" size="small" color="secondary" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  // Empty State Simples
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        {searchTerm ? (
          <>
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
          </>
        ) : (
          <>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="text.secondary">
              Todas as solicitações foram processadas!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Não há solicitações de cadastro pendentes no momento.
            </Typography>
          </>
        )}
      </Box>
    );
  };

  return (
    <Container>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Solicitações de Cadastro Pendentes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Aprove ou rejeite solicitações de novos usuários
        </Typography>
      </Box>

      {/* Busca */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome, email ou instituição..."
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
      </Box>

      {/* Tabela ou Loading */}
      {loading && registrations.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : registrations.length === 0 ? (
        renderEmptyState()
      ) : (
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
                  onClick={() => handleRowClick(reg)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {reg.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{reg.user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reg.user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {reg.user.roles.map(role => (
                      <Box key={role.name} sx={{ mb: 0.5 }}>
                        {getRoleChip(role.name)}
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {reg.institution}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reg.department}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(reg.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(reg);
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
          />
        </TableContainer>
      )}
    </Container>
  );
};

export default PendingRegistrations;