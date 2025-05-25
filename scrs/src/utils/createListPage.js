// Crie este arquivo em: src/utils/createListPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box } from '@mui/material';
import { Description } from '@mui/icons-material';

// Por enquanto, uma implementação simples que funciona com sua estrutura atual
export const createDocumentListPage = (config) => {
  return function DocumentListPage() {
    const navigate = useNavigate();
    
    return (
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {config.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {config.subtitle}
          </Typography>
        </Box>

        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Página em Transição
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Esta página está sendo migrada para a nova arquitetura otimizada.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use o menu lateral para navegar para outras funcionalidades.
          </Typography>
        </Paper>
      </Container>
    );
  };
};