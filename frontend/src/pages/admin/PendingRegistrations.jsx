import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, Box, 
  TablePagination, Chip
} from '@mui/material';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import moment from 'moment';

const PendingRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations();
  }, [page, rowsPerPage]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPendingRegistrations(page, rowsPerPage);
      setRegistrations(data.content);
      setTotalElements(data.totalElements);
    } catch (error) {
      toast.error('Erro ao carregar solicitações de cadastro');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (id) => {
    navigate(`/admin/registrations/${id}`);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'STUDENT':
        return <Chip label="Aluno" color="primary" size="small" />;
      case 'ADVISOR':
        return <Chip label="Orientador" color="secondary" size="small" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Solicitações de Cadastro Pendentes
        </Typography>
      </Box>
      
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Papel</TableCell>
                <TableCell>Instituição</TableCell>
                <TableCell>Data</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Carregando...</TableCell>
                </TableRow>
              ) : registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">Não há solicitações pendentes.</TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>{reg.user.name}</TableCell>
                    <TableCell>{reg.user.email}</TableCell>
                    <TableCell>
                      {reg.user.roles.map(role => 
                        <Box key={role.name} sx={{ my: 0.5 }}>
                          {getRoleLabel(role.name)}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{reg.institution}</TableCell>
                    <TableCell>{moment(reg.createdAt).format('DD/MM/YYYY HH:mm')}</TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={() => handleViewDetails(reg.id)}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default PendingRegistrations;