import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Box, 
  Grid, Card, CardContent, CardHeader, 
  Button, Divider, Avatar, IconButton,
  List, ListItem, ListItemText, ListItemAvatar,
  ListItemSecondaryAction, CircularProgress,
  Chip
} from '@mui/material';
import { 
  SupervisorAccount, Person, School, 
  AssignmentTurnedIn, Notifications, 
  Check, Close, ArrowForward
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const AdminDashboard = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdvisors: 0,
    pendingRegistrations: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar solicitações pendentes
        const registrationsData = await adminService.getPendingRegistrations(0, 5);
        setPendingRegistrations(registrationsData.content);
        
        // Buscar estatísticas
        const statsData = await adminService.getDashboardStats();
        setStats(statsData);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRoleChip = (role) => {
    switch(role) {
      case 'STUDENT':
        return <Chip label="Estudante" size="small" color="primary" />;
      case 'ADVISOR':
        return <Chip label="Orientador" size="small" color="secondary" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Painel de Administração
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          Gerencie usuários e solicitações de cadastro na plataforma Tessera Acadêmica
        </Typography>
        <Divider />
      </Box>

      {/* Cards com estatísticas */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3} 
            sx={{ 
              bgcolor: '#e3f2fd', 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Person fontSize="large" />
              </Avatar>
              <Typography variant="h4" component="div" gutterBottom>
                {loading ? <CircularProgress size={24} /> : stats.totalUsers}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Usuários Totais
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3} 
            sx={{ 
              bgcolor: '#e8f5e9', 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#2e7d32', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <School fontSize="large" />
              </Avatar>
              <Typography variant="h4" component="div" gutterBottom>
                {loading ? <CircularProgress size={24} /> : stats.totalStudents}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Estudantes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3} 
            sx={{ 
              bgcolor: '#f3e5f5', 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#9c27b0', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <SupervisorAccount fontSize="large" />
              </Avatar>
              <Typography variant="h4" component="div" gutterBottom>
                {loading ? <CircularProgress size={24} /> : stats.totalAdvisors}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Orientadores
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={3} 
            sx={{ 
              bgcolor: '#ffebee', 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              },
              cursor: 'pointer'
            }}
            onClick={() => navigate('/admin/registrations')}
          >
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#d32f2f', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Notifications fontSize="large" />
              </Avatar>
              <Typography variant="h4" component="div" gutterBottom>
                {loading ? <CircularProgress size={24} /> : stats.pendingRegistrations}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Solicitações Pendentes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ações rápidas */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Solicitações Pendentes" 
              subheader="Solicitações de cadastro aguardando aprovação"
              action={
                <Button 
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/admin/registrations')}
                >
                  Ver todas
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : pendingRegistrations.length > 0 ? (
                <List>
                  {pendingRegistrations.map((registration) => (
                    <React.Fragment key={registration.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                          borderRadius: 1
                        }}
                        onClick={() => navigate(`/admin/registrations/${registration.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: registration.user.roles[0].name === 'STUDENT' ? 
                              '#1976d2' : '#f50057'
                          }}>
                            {registration.user.roles[0].name === 'STUDENT' ? 
                              <School /> : <SupervisorAccount />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={registration.user.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {registration.user.email}
                              </Typography>
                              {` — ${registration.institution}, ${registration.department}`}
                              <Box sx={{ mt: 0.5 }}>
                                {registration.user.roles.map(role => (
                                  <Box component="span" key={role.name} sx={{ mr: 1 }}>
                                    {getRoleChip(role.name)}
                                  </Box>
                                ))}
                              </Box>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            color="success"
                            title="Aprovar"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/registrations/${registration.id}`);
                            }}
                          >
                            <Check />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            color="error"
                            title="Rejeitar"
                            sx={{ ml: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/registrations/${registration.id}`);
                            }}
                          >
                            <Close />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Não há solicitações pendentes no momento.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="Ações Administrativas" 
              subheader="Funcionalidades de gerenciamento do sistema"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderLeft: '4px solid #f44336',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 3
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/admin/registrations')}
                  >
                    <SupervisorAccount color="error" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Gerenciar Solicitações de Cadastro
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Aprove ou rejeite solicitações pendentes
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderLeft: '4px solid #2e7d32',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 3
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/admin/users')}
                  >
                    <Person color="success" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Gerenciar Usuários
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Visualize, edite ou desative contas de usuários
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      borderLeft: '4px solid #1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 3
                      },
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/admin/system')}
                  >
                    <AssignmentTurnedIn color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Configurações do Sistema
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ajuste as configurações da plataforma
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resumo do sistema */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumo do Sistema
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Funções Administrativas
            </Typography>
            <Typography variant="body2" paragraph>
              • Aprovação e rejeição de solicitações de cadastro
            </Typography>
            <Typography variant="body2" paragraph>
              • Gerenciamento de usuários (estudantes e orientadores)
            </Typography>
            <Typography variant="body2" paragraph>
              • Visualização de estatísticas do sistema
            </Typography>
            <Typography variant="body2" paragraph>
              • Monitoramento das atividades da plataforma
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Informações da Plataforma
            </Typography>
            <Typography variant="body2" paragraph>
              A Tessera Acadêmica é uma plataforma para gestão de monografias e trabalhos acadêmicos, 
              facilitando a interação entre orientadores e orientados durante o processo de 
              desenvolvimento e revisão de trabalhos acadêmicos.
            </Typography>
            <Typography variant="body2">
              Como administrador, você tem acesso a todas as funcionalidades de gestão do sistema, 
              incluindo gerenciamento de usuários e configurações.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;