import React, { useContext } from 'react';
import { 
  Container, Typography, Grid, Paper, Box, 
  Card, CardContent, CardHeader
} from '@mui/material';
import { AuthContext } from '../../context/AuthContext';

const Dashboard = () => {
  const { currentUser, hasRole } = useContext(AuthContext);

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bem-vindo ao Tessera Acadêmica, {currentUser?.name}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Sistema de gestão de monografias para orientadores e orientados
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {hasRole('ADMIN') && (
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={3}>
              <CardHeader title="Administração" />
              <CardContent>
                <Typography variant="body1">
                  Como administrador, você pode gerenciar solicitações de cadastro 
                  e configurações do sistema.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {hasRole('ADVISOR') && (
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={3}>
              <CardHeader title="Orientações" />
              <CardContent>
                <Typography variant="body1">
                  Gerencie suas orientações de monografias, acompanhe o progresso 
                  dos seus orientandos e faça comentários nas versões.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {hasRole('STUDENT') && (
          <Grid item xs={12} md={6} lg={4}>
            <Card elevation={3}>
              <CardHeader title="Minhas Monografias" />
              <CardContent>
                <Typography variant="body1">
                  Gerencie suas monografias, crie novas versões e visualize os comentários 
                  do seu orientador.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={6} lg={4}>
          <Card elevation={3}>
            <CardHeader title="Funcionalidades Principais" />
            <CardContent>
              <Typography variant="body2" paragraph>
                • Controle de versões de monografias
              </Typography>
              <Typography variant="body2" paragraph>
                • Visualização de diferenças entre versões
              </Typography>
              <Typography variant="body2" paragraph>
                • Sistema de comentários contextual
              </Typography>
              <Typography variant="body2" paragraph>
                • Comunicação direta entre orientadores e orientados
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Próximos Passos
            </Typography>
            <Typography variant="body1" paragraph>
              Utilize o menu lateral para navegar entre as funcionalidades do sistema.
              {hasRole('STUDENT') && " Como aluno, você pode iniciar criando uma nova monografia."}
              {hasRole('ADVISOR') && " Como orientador, você pode visualizar as monografias dos seus orientandos."}
              {hasRole('ADMIN') && " Como administrador, você pode gerenciar as solicitações de cadastro pendentes."}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;