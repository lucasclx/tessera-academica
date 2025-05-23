// src/pages/advisor/DocumentReview.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const DocumentReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/advisor/documents');
  };

  return (
    <Container>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />} sx={{ mr: 2 }}>
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          Revisão de Documento
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography>
          Funcionalidade em desenvolvimento. Aqui será exibido o documento para revisão ID: {id}.
        </Typography>
      </Paper>
    </Container>
  );
};

export default DocumentReview;