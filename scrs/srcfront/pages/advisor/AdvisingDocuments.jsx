// src/pages/advisor/AdvisingDocuments.js
import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const AdvisingDocuments = () => {
  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Orientações
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Gerencie as monografias dos seus orientandos
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography>
          Funcionalidade em desenvolvimento. Aqui serão exibidas as monografias dos seus orientandos.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdvisingDocuments;