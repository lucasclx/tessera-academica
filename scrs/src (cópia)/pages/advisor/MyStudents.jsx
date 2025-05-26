import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

const MyStudents = () => (
  <Container>
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Meus Orientandos
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        Acompanhe o progresso dos seus orientandos.
      </Typography>
    </Box>
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="body1">
        Funcionalidade em desenvolvimento.
      </Typography>
    </Paper>
  </Container>
);

export default MyStudents;