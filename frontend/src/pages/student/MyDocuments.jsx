// src/pages/student/MyDocuments.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Paper, Box, Button
} from '@mui/material';
import { Add } from '@mui/icons-material';

const MyDocuments = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Minhas Monografias
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
        >
          Nova Monografia
        </Button>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography>
          Funcionalidade em desenvolvimento. Aqui serão exibidas suas monografias.
        </Typography>
      </Paper>
    </Container>
  );
};

export default MyDocuments;