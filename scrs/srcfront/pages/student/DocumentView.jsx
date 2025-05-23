// src/pages/student/DocumentView.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const DocumentView = ({ edit }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/student/documents');
  };

  return (
    <Container>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />} sx={{ mr: 2 }}>
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          {edit ? 'Editar Monografia' : 'Visualizar Monografia'}
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography>
          Funcionalidade em desenvolvimento. Aqui será exibido o conteúdo do documento ID: {id}.
        </Typography>
        <Typography sx={{ mt: 2 }}>
          Modo: {edit ? 'Edição' : 'Visualização'}
        </Typography>
      </Paper>
    </Container>
  );
};

export default DocumentView;