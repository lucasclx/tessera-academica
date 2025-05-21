// src/pages/student/DocumentCompare.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const DocumentCompare = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/student/documents/${id}`);
  };

  return (
    <Container>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />} sx={{ mr: 2 }}>
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          Comparar Versões
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography>
          Funcionalidade em desenvolvimento. Aqui será exibida a comparação entre versões do documento ID: {id}.
        </Typography>
      </Paper>
    </Container>
  );
};

export default DocumentCompare;