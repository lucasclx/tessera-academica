// Arquivo: scrs/src/pages/dashboard/Dashboard.jsx
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
import { documentService } from "../../services";
import { StatusChip as UtilStatusChip } from '../../utils'; // Renomeando para evitar conflito

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
        let docsData = { content: [], totalElements: 0 };
        if (hasRole('STUDENT')) {
          // MODIFIED: Use getMyDocumentsPaged and access content
          docsData = await documentService.getMyDocumentsPaged(0, 5, '', 'ALL', 'updatedAt', 'desc');
          setRecentDocuments(docsData.content.slice(0, 3));
          
          // For accurate stats, you might need a separate endpoint or fetch all documents.
          // This example uses totalElements from the first page call for simplicity.
          setStats({
            totalDocuments: docsData.totalElements,
            pendingReview: docsData.content.filter(doc => doc.status === 'SUBMITTED').length, // This is only for current page
            approved: docsData.content.filter(doc => doc.status === 'APPROVED').length,   // This is only for current page
            inRevision: docsData.content.filter(doc => doc.status === 'REVISION').length // This is only for current page
            // TODO: Backend should ideally provide these stats directly for accuracy
          });

        } else if (hasRole('ADVISOR')) {
          // MODIFIED: Use getMyAdvisingDocumentsPaged and access content
          docsData = await documentService.getMyAdvisingDocumentsPaged(0, 5, '', 'ALL', 'updatedAt', 'desc');
          setRecentDocuments(docsData.content.slice(0, 3));
          
          setStats({
            totalDocuments: docsData.totalElements,
            pendingReview: docsData.content.filter(doc => doc.status === 'SUBMITTED').length,
            approved: docsData.content.filter(doc => doc.status === 'APPROVED').length,
            inRevision: docsData.content.filter(doc => doc.status === 'REVISION').length
            // TODO: Backend should ideally provide these stats directly
          });
        }
      } catch (error) {
        console.error('Erro ao carregar documentos:', error);
        setRecentDocuments([]);
        setStats({ totalDocuments: 0, pendingReview: 0, approved: 0, inRevision: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (!hasRole('ADMIN')) {
      fetchData();
    } else {
      setLoading(false); // Admin dashboard might have different data sources
    }
  }, [hasRole]); // currentUser removed as hasRole depends on it but doesn't need to be direct dep

  const handleDocumentClick = (document) => {
    if (hasRole('STUDENT')) {
      navigate(`/student/documents/${document.id}`);
    } else if (hasRole('ADVISOR')) {
      // Assuming advisor review path, adjust if DocumentView is for students only
      navigate(`/advisor/documents/${document.id}/review`);
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
        {/* Card com informações do usuário */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ 
                  bgcolor: hasRole('ADMIN') ? 'error.main' : 
                           hasRole('ADVISOR') ? 'secondary.main' : 'primary.main' 
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
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                    Estatísticas (da página atual):
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: 'primary.lighter', color: 'primary.darker' }}>
                        <Typography variant="h5">{stats.totalDocuments}</Typography>
                        <Typography variant="body2">Documentos (Total)</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.lighter', color: 'warning.darker' }}>
                        <Typography variant="h5">{stats.pendingReview}</Typography>
                        <Typography variant="body2">Pendentes</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: 'success.lighter', color: 'success.darker' }}>
                        <Typography variant="h5">{stats.approved}</Typography>
                        <Typography variant="body2">Aprovados</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: 'info.lighter', color: 'info.darker' }}>
                        <Typography variant="h5">{stats.inRevision}</Typography>
                        <Typography variant="body2">Em Revisão</Typography>
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
                  onClick={() => navigate('/admin/dashboard')} // Admin dashboard path
                >
                  Painel Admin
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
              subheader="Funcionalidades principais do sistema"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {hasRole('ADMIN') && (
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'error.main', '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }, cursor: 'pointer', transition: '0.2s' }} onClick={() => navigate('/admin/registrations')} >
                      <SupervisorAccount color="error" sx={{ fontSize: 40, mr: 2 }} />
                      <Box> <Typography variant="subtitle1" fontWeight="bold"> Gerenciar Solicitações </Typography> <Typography variant="body2" color="text.secondary"> Avalie e aprove cadastros </Typography> </Box>
                    </Paper>
                  </Grid>
                )}
                {hasRole('ADVISOR') && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'secondary.main', '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }, cursor: 'pointer', transition: '0.2s' }} onClick={() => navigate('/advisor/documents')} >
                        <AssignmentTurnedIn color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box> <Typography variant="subtitle1" fontWeight="bold"> Revisar Monografias </Typography> <Typography variant="body2" color="text.secondary"> Analise trabalhos dos orientandos </Typography> </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'secondary.main', '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }, cursor: 'pointer', transition: '0.2s' }} onClick={() => navigate('/advisor/students')} >
                        <School color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box> <Typography variant="subtitle1" fontWeight="bold"> Meus Orientandos </Typography> <Typography variant="body2" color="text.secondary"> Acompanhe seus estudantes </Typography> </Box>
                      </Paper>
                    </Grid>
                  </>
                )}
                {hasRole('STUDENT') && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main', '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }, cursor: 'pointer', transition: '0.2s' }} onClick={() => navigate('/student/documents')} >
                        <Assignment color="primary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box> <Typography variant="subtitle1" fontWeight="bold"> Minhas Monografias </Typography> <Typography variant="body2" color="text.secondary"> Gerencie seus documentos </Typography> </Box>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main', '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' }, cursor: 'pointer', transition: '0.2s' }} onClick={() => navigate('/student/documents/new')} >
                        <Edit color="primary" sx={{ fontSize: 40, mr: 2 }} />
                        <Box> <Typography variant="subtitle1" fontWeight="bold"> Nova Monografia </Typography> <Typography variant="body2" color="text.secondary"> Crie um novo documento </Typography> </Box>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
          
          {!hasRole('ADMIN') && (
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardHeader 
                title="Documentos Recentes" 
                subheader={hasRole('STUDENT') ? "Suas monografias" : "Monografias dos seus orientandos"}
                action={ <Button endIcon={<ArrowForward />} onClick={() => navigate(hasRole('STUDENT') ? '/student/documents' : '/advisor/documents')} > Ver todos </Button> }
              />
              <Divider />
              <CardContent>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}> <CircularProgress /> </Box>
                ) : recentDocuments.length > 0 ? (
                  <List>
                    {recentDocuments.map((document, index) => (
                      <React.Fragment key={document.id}>
                        <ListItem button onClick={() => handleDocumentClick(document)} secondaryAction={ <UtilStatusChip status={document.status} type="document" /> } >
                          <ListItemIcon>
                            {document.status === 'DRAFT' && <Edit color="action" />}
                            {document.status === 'SUBMITTED' && <Loop color="primary" />}
                            {document.status === 'REVISION' && <Loop color="warning" />}
                            {document.status === 'APPROVED' && <Check color="success" />}
                            {document.status === 'FINALIZED' && <AssignmentTurnedIn color="info" />}
                          </ListItemIcon>
                          <ListItemText
                            primary={document.title}
                            secondary={ hasRole('STUDENT') ? `Orientador: ${document.advisorName || 'N/A'}` : `Estudante: ${document.studentName || 'N/A'}` }
                          />
                        </ListItem>
                        {index < recentDocuments.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom> Você ainda não possui documentos. </Typography>
                    {hasRole('STUDENT') && ( <Button variant="contained" color="primary" startIcon={<Add />} sx={{ mt: 1 }} onClick={() => navigate('/student/documents/new')} > Criar Nova Monografia </Button> )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;