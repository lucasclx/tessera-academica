import React, { useContext, useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Paper, Box, 
  Card, CardContent, CardHeader, CardActions,
  Button, Divider, Avatar, IconButton,
  List, ListItem, ListItemText, ListItemIcon,
  CircularProgress, Chip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  SupervisorAccount, 
  School, 
  Assignment, 
  Add, 
  AssignmentTurnedIn, 
  Loop, 
  Edit, 
  Check, 
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import documentService from '../../services/documentService';

const Dashboard = () => {
  const { currentUser, hasRole } = useContext(AuthContext);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingReview: 0,
    approved: 0,
    inRevision: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (hasRole('STUDENT')) {
          const docs = await documentService.getMyDocuments();
          setRecentDocuments(docs.slice(0, 3));
          
          // Calcular estatísticas
          setStats({
            totalDocuments: docs.length,
            pendingReview: docs.filter(doc => doc.status === 'SUBMITTED').length,
            approved: docs.filter(doc => doc.status === 'APPROVED').length,
            inRevision: docs.filter(doc => doc.status === 'REVISION').length
          });
        } else if (hasRole('ADVISOR')) {
          const docs = await documentService.getMyAdvisingDocuments();
          setRecentDocuments(docs.slice(0, 3));
          
          // Calcular estatísticas
          setStats({
            totalDocuments: docs.length,
            pendingReview: docs.filter(doc => doc.status === 'SUBMITTED').length,
            approved: docs.filter(doc => doc.status === 'APPROVED').length,
            inRevision: docs.filter(doc => doc.status === 'REVISION').length
          });
        }
      } catch (error) {
        console.error('Erro ao carregar documentos:', error);
        // Não mostrar erro se o usuário não tem documentos ainda
        setRecentDocuments([]);
        setStats({
          totalDocuments: 0,
          pendingReview: 0,
          approved: 0,
          inRevision: 0
        });
      } finally {
        setLoading(false);
      }
    };

    // Só buscar dados se não for admin
    if (!hasRole('ADMIN')) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [hasRole]);

  const getStatusChip = (status) => {
    switch(status) {
      case 'DRAFT':
        return <Chip label="Rascunho" size="small" color="default" />;
      case 'SUBMITTED':
        return <Chip label="Enviado para Revisão" size="small" color="primary" />;
      case 'REVISION':
        return <Chip label="Em Revisão" size="small" color="warning" />;
      case 'APPROVED':
        return <Chip label="Aprovado" size="small" color="success" />;
      case 'FINALIZED':
        return <Chip label="Finalizado" size="small" color="info" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const handleDocumentClick = (document) => {
    if (hasRole('STUDENT')) {
      navigate(`/student/documents/${document.id}`);
    } else if (hasRole('ADVISOR')) {
      navigate(`/advisor/documents/${document.id}`);
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bem-vindo ao Tessera Acadêmica, {currentUser?.name}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          Sistema de gestão de monografias para orientadores e orientados
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={3}>
        {/* Cartão com informações do usuário */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ 
                  bgcolor: hasRole('ADMIN') ? '#f44336' : 
                           hasRole('ADVISOR') ? '#f50057' : '#1976d2' 
                }}>
                  {hasRole('ADMIN') ? <SupervisorAccount /> : 
                   hasRole('ADVISOR') ? <School /> : <Assignment />}
                </Avatar>
              }
              title={currentUser?.name}
              subheader={currentUser?.email}
            />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Perfil:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {currentUser?.roles?.map(role => (
                    <Chip 
                      key={role} 
                      label={
                        role === 'ROLE_ADMIN' ? 'Administrador' : 
                        role === 'ROLE_ADVISOR' ? 'Orientador' : 'Estudante'
                      } 
                      size="small"
                      color={
                        role === 'ROLE_ADMIN' ? 'error' : 
                        role === 'ROLE_ADVISOR' ? 'secondary' : 'primary'
                      }
                    />
                  ))}
                </Box>
              </Box>
              
              {!hasRole('ADMIN') && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Estatísticas:
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                        <Typography variant="h5">{stats.totalDocuments}</Typography>
                        <Typography variant="body2">Documentos</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#fff3e0' }}>
                        <Typography variant="h5">{stats.pendingReview}</Typography>
                        <Typography variant="body2">Pendentes</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                        <Typography variant="h5">{stats.approved}</Typography>
                        <Typography variant="body2">Aprovados</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#fffde7' }}>
                        <Typography variant="h5">{stats.inRevision}</Typography>
                        <Typography variant="body2">Revisão</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
            
            <CardActions>
              {hasRole('STUDENT') && (
                <Button 
                  startIcon={<Add />} 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  onClick={() => navigate('/student/documents/new')}
                >
                  Nova Monografia
                </Button>
              )}
              {hasRole('ADVISOR') && (
                <Button 
                  startIcon={<AssignmentTurnedIn />} 
                  variant="contained" 
                  color="secondary"
                  fullWidth
                  onClick={() => navigate('/advisor/documents')}
                >
                  Ver Orientações
                </Button>
              )}
              {hasRole('ADMIN') && (
                <Button 
                  startIcon={<SupervisorAccount />} 
                  variant="contained" 
                  color="error"
                  fullWidth
                  onClick={() => navigate('/admin/registrations')}
                >
                  Gerenciar Solicitações
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Módulos do Sistema */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardHeader 
              title="Ações Disponíveis" 
              subheader="Funções principais do sistema"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {hasRole('ADMIN') && (
                  <Grid item xs={12} md={6}>
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
                          Gerenciar Solicitações
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avalie e aprove cadastros de novos usuários
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {hasRole('ADVISOR') && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderLeft: '4px solid #f50057',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: 3
                          },
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate('/advisor/documents')}
                      >
                        <AssignmentTurnedIn color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Revisar Monografias
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Analise e comente os trabalhos dos seus orientandos
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderLeft: '4px solid #f50057',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: 3
                          },
                          cursor: 'pointer'
                        }}
                        onClick={() => navigate('/advisor/students')}
                      >
                        <School color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Gerenciar Orientandos
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Visualize e acompanhe seus orientandos
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </>
                )}

                {hasRole('STUDENT') && (
                  <>
                    <Grid item xs={12} md={6}>
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
                        onClick={() => navigate('/student/documents')}
                      >
                        <Assignment color="primary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Minhas Monografias
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Gerencie e acompanhe seus documentos
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
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
                        onClick={() => navigate('/student/documents/new')}
                      >
                        <Edit color="primary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Nova Monografia
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Crie um novo documento para orientação
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
          
          {/* Documentos Recentes */}
          {!hasRole('ADMIN') && (
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardHeader 
                title="Documentos Recentes" 
                subheader={hasRole('STUDENT') ? "Suas monografias" : "Monografias dos seus orientandos"}
                action={
                  <Button 
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(hasRole('STUDENT') ? '/student/documents' : '/advisor/documents')}
                  >
                    Ver todos
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : recentDocuments.length > 0 ? (
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {recentDocuments.map((document) => (
                      <React.Fragment key={document.id}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                            borderRadius: 1,
                            mb: 1
                          }}
                          onClick={() => handleDocumentClick(document)}
                          secondaryAction={
                            <Box>
                              {getStatusChip(document.status)}
                            </Box>
                          }
                        >
                          <ListItemIcon>
                            {document.status === 'DRAFT' && <Edit color="action" />}
                            {document.status === 'SUBMITTED' && <Loop color="primary" />}
                            {document.status === 'REVISION' && <Loop color="warning" />}
                            {document.status === 'APPROVED' && <Check color="success" />}
                            {document.status === 'FINALIZED' && <AssignmentTurnedIn color="info" />}
                          </ListItemIcon>
                          <ListItemText
                            primary={document.title}
                            secondary={
                              <>
                                <Typography
                                  sx={{ display: 'inline' }}
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {hasRole('STUDENT') ? 
                                    `Orientador: ${document.advisorName}` : 
                                    `Estudante: ${document.studentName}`}
                                </Typography>
                                {` — Última atualização: ${document.updatedAt ? 
                                  new Date(document.updatedAt).toLocaleDateString('pt-BR') : 
                                  new Date(document.createdAt).toLocaleDateString('pt-BR')}`}
                              </>
                            }
                          />
                        </ListItem>
                        {recentDocuments.indexOf(document) < recentDocuments.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Você ainda não possui documentos.
                    </Typography>
                    {hasRole('STUDENT') && (
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<Add />}
                        sx={{ mt: 1 }}
                        onClick={() => navigate('/student/documents/new')}
                      >
                        Criar Nova Monografia
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Seção de funcionalidades principais para todos os usuários */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ mt: 3 }}>
            <CardHeader 
              title="Funcionalidades Principais" 
              subheader="Recursos disponíveis no Tessera Acadêmica"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: '#e3f2fd',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Assignment sx={{ fontSize: 50, color: '#1976d2', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Controle de Versões
                    </Typography>
                    <Typography variant="body2">
                      Acompanhe todas as mudanças no seu documento com histórico completo de versões.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: '#e8f5e9',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Loop sx={{ fontSize: 50, color: '#2e7d32', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Comparação de Versões
                    </Typography>
                    <Typography variant="body2">
                      Visualize exatamente o que mudou entre diferentes versões do seu documento.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: '#fff3e0',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Edit sx={{ fontSize: 50, color: '#ed6c02', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Comentários Contextuais
                    </Typography>
                    <Typography variant="body2">
                      Adicione comentários diretamente no texto, facilitando a revisão e o feedback.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6} lg={3}>
                  <Paper
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      bgcolor: '#f3e5f5',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <School sx={{ fontSize: 50, color: '#9c27b0', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Comunicação Direta
                    </Typography>
                    <Typography variant="body2">
                      Troca de feedback eficiente entre orientador e orientando dentro da plataforma.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Seção de dicas rápidas */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mt: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Próximos Passos
            </Typography>
            <Typography variant="body1" paragraph>
              Utilize o menu lateral para navegar entre as funcionalidades do sistema.
              {hasRole('STUDENT') && " Como aluno, você pode iniciar criando uma nova monografia e convidando seu orientador para acompanhar o processo."}
              {hasRole('ADVISOR') && " Como orientador, você pode revisar os documentos dos seus orientandos e fornecer feedback através de comentários."}
              {hasRole('ADMIN') && " Como administrador, você pode gerenciar as solicitações de cadastro pendentes e configurar o sistema."}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;