import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Para links internos, se necessário

const AdminDashboard = () => {
  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Painel de Administração
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bem-vindo à área administrativa do Tessera Acadêmica.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ações Rápidas
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <RouterLink to="/admin/registrations" style={{ textDecoration: 'none' }}>
            <Typography color="primary">
              Gerenciar Solicitações de Cadastro Pendentes
            </Typography>
          </RouterLink>
          {/* Adicionar outros links para funcionalidades administrativas aqui */}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;