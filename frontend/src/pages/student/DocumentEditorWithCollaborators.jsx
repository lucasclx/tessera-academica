// Arquivo: scrs/src/pages/student/DocumentEditorWithCollaborators.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container, Typography, Button, Box, Paper, Grid, Tabs, Tab,
  Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
  Chip, IconButton, Tooltip, Alert, CircularProgress, TextField,
  ListItem, ListItemText, ListItemAvatar, Avatar, List,
  Autocomplete // IMPORT Autocomplete
} from '@mui/material';
import {
  Save, History, Comment as CommentIconMUI, Visibility, ArrowBack, Edit,
  Send, ExpandMore, Add, Group, Person, SupervisorAccount,
  CheckCircle, Warning, Error as ErrorIcon, Info,
  CloudUpload, CompareArrows, People,
  School
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext'; //
import { documentService, versionService, commentService, userService } from "../../services"; // userService IMPORTED //
import { collaboratorService } from '../../services/collaboratorService'; //
import CollaboratorManagement from '../../components/collaborators/CollaboratorManagement'; //

const DocumentEditorWithCollaborators = () => {
  const { id: documentIdFromParams } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, hasRole } = useContext(AuthContext); // hasRole might be useful //

  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [userPermissions, setUserPermissions] = useState({
    canRead: false,
    canWrite: false,
    canManage: false
  });
  const [collaborators, setCollaborators] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [currentComments, setCurrentComments] = useState([]);

  const [selectedAdvisor, setSelectedAdvisor] = useState(null); 
  const [advisorsList, setAdvisorsList] = useState([]); 
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);


  const loadDocumentAndPermissions = useCallback(async (id) => {
    setLoading(true);
    setPageError(null);
    try {
      const docData = await documentService.getDocument(id); //
      setDocument(docData);
      setTitle(docData.title);
      setDescription(docData.description || '');
      setStatus(docData.status);
      
      if (advisorsList.length > 0 && docData.advisorId) {
        const foundAdvisor = advisorsList.find(a => a.id === docData.advisorId);
        setSelectedAdvisor(foundAdvisor || null);
      }

      const permissions = await collaboratorService.getCurrentUserPermissions(id); //
      setUserPermissions(permissions);

      if (!permissions.canRead) {
        setPageError('Você não tem permissão para acessar este documento.');
        setLoading(false);
        return;
      }

      const collaboratorsData = await collaboratorService.getDocumentCollaborators(id); //
      setCollaborators(collaboratorsData || []);

      const versionsData = await versionService.getVersionsByDocument(id); //
      setVersions(versionsData || []);

      if (versionsData && versionsData.length > 0) {
        const latestVersion = versionsData[0];
        setCurrentVersion(latestVersion);
        setContent(latestVersion.content || '');
        try {
          const commentsData = await commentService.getCommentsByVersion(latestVersion.id); //
          setCurrentComments(commentsData || []);
        } catch (commentError) {
          console.warn('Não foi possível carregar comentários:', commentError);
          setCurrentComments([]);
        }
      } else {
        setContent(docData.description || '# Comece a editar seu documento aqui.');
        setCurrentVersion(null);
        setCurrentComments([]);
      }
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast.error('Erro ao carregar documento. Verifique se ele existe e tente novamente.');
      setPageError('Não foi possível carregar o documento. Ele pode ter sido removido ou você não tem permissão para acessá-lo.');
    } finally {
      setLoading(false);
    }
  }, [advisorsList]);

  useEffect(() => {
    const fetchAdvisorsForNewDoc = async () => {
      if (isNewDocument && hasRole('STUDENT')) { 
        setLoadingAdvisors(true);
        try {
          const data = await userService.getApprovedAdvisors(); //
          setAdvisorsList(data || []);
        } catch (error) {
          toast.error('Falha ao carregar lista de orientadores.');
          console.error("Erro ao buscar orientadores: ", error);
        } finally {
          setLoadingAdvisors(false);
        }
      }
    };
    fetchAdvisorsForNewDoc();
  }, [isNewDocument, hasRole]);
  
  useEffect(() => {
    if (document && document.advisorId && advisorsList.length > 0 && !selectedAdvisor) {
      const foundAdvisor = advisorsList.find(a => a.id === document.advisorId);
      setSelectedAdvisor(foundAdvisor || null);
    }
  }, [document, advisorsList, selectedAdvisor]);


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabQueryParam = queryParams.get('tab');
    if (tabQueryParam === 'collaborators') {
      setSelectedTab(1);
    }

    if (documentIdFromParams === undefined) {
      setIsNewDocument(true);
      setIsEditing(true);
      setTitle('Nova Monografia Colaborativa');
      setContent('# Título da Monografia\n\n## Seção 1\n\nComece a escrever aqui...\n\n## Colaboração\n\nEste documento permite múltiplos colaboradores!');
      setDescription('');
      setStatus('DRAFT');
      setDocument(null);
      setCurrentVersion(null);
      setVersions([]);
      setCurrentComments([]);
      setCollaborators([]);
      setLoading(false);
      setUnsavedChanges(false);
      setPageError(null);
      setUserPermissions({ canRead: true, canWrite: true, canManage: true });
      setSelectedAdvisor(null); 
    } else {
      setIsNewDocument(false);
       if (advisorsList.length > 0 || !hasRole('STUDENT')) { 
            loadDocumentAndPermissions(documentIdFromParams);
        }
      if (queryParams.get('edit') === 'true') {
        setIsEditing(true);
      }
    }
  }, [documentIdFromParams, location.search, loadDocumentAndPermissions, advisorsList, hasRole]);


  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (unsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);

  const handleFieldChange = (setter) => (event) => {
    setter(event.target.value);
    setUnsavedChanges(true);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!userPermissions.canWrite && !isNewDocument) {
      toast.error('Você não tem permissão para editar este documento.');
      return;
    }
    if (!title.trim()) {
      toast.error('O título da monografia é obrigatório.');
      return;
    }
    if (isNewDocument && hasRole('STUDENT') && !selectedAdvisor) {
      toast.error('Por favor, selecione um orientador.');
      return;
    }

    setSaving(true);
    try {
      if (isNewDocument) {
        const newDocData = {
          title: title.trim(),
          description: description.trim(),
          studentId: currentUser.id,
          advisorId: selectedAdvisor?.id || null, 
        };
        const createdDoc = await documentService.createDocument(newDocData); //
        const versionData = {
          documentId: createdDoc.id,
          content: content,
          commitMessage: 'Versão inicial do documento colaborativo'
        };
        await versionService.createVersion(versionData); //
        toast.success('Monografia colaborativa criada com sucesso!');
        setUnsavedChanges(false);
        navigate(`/student/documents/${createdDoc.id}?tab=collaborators`, { replace: true });
      } else {
        if (document && document.id) {
          let documentMetaChanged = false;
          const updatedMetaData = {};
          if (title.trim() !== document.title) { updatedMetaData.title = title.trim(); documentMetaChanged = true; }
          if (description.trim() !== document.description) { updatedMetaData.description = description.trim(); documentMetaChanged = true; }
          
          if (documentMetaChanged) {
            await documentService.updateDocument(document.id, updatedMetaData); //
          }
          const versionData = {
            documentId: document.id,
            content: content,
            commitMessage: `Atualização colaborativa - ${new Date().toLocaleString('pt-BR')}`
          };
          await versionService.createVersion(versionData); //
          toast.success('Nova versão salva com sucesso!');
          await loadDocumentAndPermissions(document.id);
        }
      }
      setUnsavedChanges(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEditMode = () => {
    if (!userPermissions.canWrite && !isNewDocument) {
      toast.error('Você não tem permissão para editar este documento.');
      return;
    }
    if (isEditing && unsavedChanges) {
      if (window.confirm('Você tem alterações não salvas. Deseja descartá-las e sair do modo de edição?')) {
        setIsEditing(false);
        if (!isNewDocument && document && document.id) {
          loadDocumentAndPermissions(document.id);
        }
      }
    } else {
      if (!isEditing && !userPermissions.canWrite && !isNewDocument) {
         toast.warn('Você tem permissão apenas para visualizar este documento.');
      }
      setIsEditing(!isEditing);
    }
  };

  const getStatusInfo = (docStatus) => {
    const statusMap = {
      'DRAFT': { label: 'Rascunho', color: 'default', icon: <Edit /> },
      'SUBMITTED': { label: 'Enviado', color: 'primary', icon: <Send /> },
      'REVISION': { label: 'Em Revisão', color: 'warning', icon: <Warning /> },
      'APPROVED': { label: 'Aprovado', color: 'success', icon: <CheckCircle /> },
      'FINALIZED': { label: 'Finalizado', color: 'info', icon: <Info /> }
    };
    return statusMap[docStatus] || statusMap['DRAFT'];
  };

  const renderFormattedContentPreview = (text) => {
    if (text === null || text === undefined || text.trim() === '') {
      return <Typography color="textSecondary" sx={{p: 2, fontStyle: 'italic'}}>Conteúdo não disponível ou vazio.</Typography>;
    }
    let html = text
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.8em; margin-top: 1em; margin-bottom: 0.5em;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.5em; margin-top: 0.8em; margin-bottom: 0.4em;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.2em; margin-top: 0.6em; margin-bottom: 0.3em;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^- (.*$)/gm, '<ul style="margin-left: 20px; padding-left: 0;"><li>$1</li></ul>')
      .replace(/^\d+\. (.*$)/gm, '<ol style="margin-left: 20px; padding-left: 0;"><li>$1</li></ol>')
      .replace(/\n\n/g, '</p><p style="margin-bottom: 1em;">')
      .replace(/\n/g, '<br>');
    if (!html.match(/^<(h[1-3]|ul|ol)/)) html = `<p style="margin-bottom: 1em;">${html}`;
    if (html.endsWith('<br>') || !html.endsWith('</p>')) html += '</p>';
    html = html.replace(/<\/ul>\s*<ul.*?>/g, '');
    html = html.replace(/<\/ol>\s*<ol.*?>/g, '');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderCollaboratorSummary = () => {
    const students = collaborators.filter(c => c.role?.toUpperCase().includes('STUDENT'));
    const advisors = collaborators.filter(c => c.role?.toUpperCase().includes('ADVISOR'));

    return (
      <Card sx={{ mb: 2 }} variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People color="primary" />
            Equipe ({collaborators.length})
          </Typography>
          <Grid container spacing={1}>
            {students.length > 0 && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt:1 }}>
                    <School fontSize="small" /> Estudantes ({students.length})
                  </Typography>
                  <List dense disablePadding>
                  {students.slice(0, 3).map(student => (
                    <ListItem key={student.id} disableGutters sx={{pb:0}}>
                       <Chip label={student.userName} size="small" variant={student.role === 'PRIMARY_STUDENT' ? 'filled' : 'outlined'} color={student.role === 'PRIMARY_STUDENT' ? 'primary' : 'default'}/>
                    </ListItem>
                  ))}
                  </List>
                  {students.length > 3 && <Typography variant="caption" color="text.secondary"> +{students.length - 3} mais </Typography>}
                </Box>
              </Grid>
            )}
            {advisors.length > 0 && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt:1 }}>
                    <SupervisorAccount fontSize="small" /> Orientadores ({advisors.length})
                  </Typography>
                   <List dense disablePadding>
                  {advisors.slice(0, 3).map(advisor => (
                     <ListItem key={advisor.id} disableGutters sx={{pb:0}}>
                        <Chip label={advisor.userName} size="small" variant={advisor.role === 'PRIMARY_ADVISOR' ? 'filled' : 'outlined'} color={advisor.role === 'PRIMARY_ADVISOR' ? 'secondary' : 'default'}/>
                     </ListItem>
                  ))}
                  </List>
                  {advisors.length > 3 && <Typography variant="caption" color="text.secondary"> +{advisors.length - 3} mais </Typography>}
                </Box>
              </Grid>
            )}
          </Grid>
          {collaborators.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum colaborador. {userPermissions.canManage && "Use a aba 'Colaboradores'."}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading && !isNewDocument) {
    return (
      <Container maxWidth="lg"><Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box></Container>
    );
  }

  if (pageError) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" gutterBottom>Erro</Typography>
          <Typography>{pageError}</Typography>
          <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate('/student/documents')} sx={{ mt: 3 }}>
            Voltar
          </Button>
        </Paper>
      </Container>
    );
  }
  
  const currentDisplayStatus = getStatusInfo(isNewDocument ? 'DRAFT' : (status || 'DRAFT'));

  return (
    <Container maxWidth="lg"> {/* MODIFIED from "xl" */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <IconButton onClick={() => navigate(isNewDocument && !document?.id ? '/student/documents' : `/student/documents`)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {title || "Monografia Colaborativa"}
            <Tooltip title="Documento Colaborativo"><People color="primary" /></Tooltip>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip icon={currentDisplayStatus.icon} label={currentDisplayStatus.label} color={currentDisplayStatus.color} size="small" />
          {unsavedChanges && isEditing && (<Chip label="Não Salvo" color="warning" size="small" icon={<Warning />} />)}
          {!isNewDocument && document?.id && (
            <Button variant="outlined" startIcon={<CompareArrows />} onClick={() => navigate(`/student/documents/${document.id}/compare`)} size="small">
              Comparar
            </Button>
          )}
          {(userPermissions.canWrite || isNewDocument) && (
            <Button variant="outlined" startIcon={isEditing ? <Visibility /> : <Edit />} onClick={handleToggleEditMode} size="small" disabled={saving}>
              {isEditing ? 'Visualizar' : 'Editar'}
            </Button>
          )}
          {isEditing && (userPermissions.canWrite || isNewDocument) && (
            <Button 
                variant="contained" 
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} 
                onClick={handleSave} 
                disabled={saving || !unsavedChanges || (isNewDocument && hasRole('STUDENT') && !selectedAdvisor)} 
                size="small"
            >
              {saving ? 'Salvando...' : (isNewDocument ? 'Criar Monografia' : 'Salvar Versão')}
            </Button>
          )}
        </Box>
      </Box>

      {!isNewDocument && (
        <Alert 
          severity={userPermissions.canWrite ? "success" : (userPermissions.canRead ? "info" : "warning")} 
          sx={{ mb: 3 }}
          icon={userPermissions.canWrite ? <CheckCircle /> : (userPermissions.canRead ? <Info /> : <Warning />)}
        >
          <Typography variant="body2">
            {userPermissions.canManage && "Você pode gerenciar colaboradores, editar e visualizar este documento."}
            {userPermissions.canWrite && !userPermissions.canManage && "Você pode editar e visualizar este documento."}
            {!userPermissions.canWrite && userPermissions.canRead && "Você tem permissão apenas para visualizar este documento."}
            {!userPermissions.canRead && "Acesso negado a este documento."}
          </Typography>
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} indicatorColor="primary" textColor="primary">
          <Tab label="Documento" icon={<Edit />} iconPosition="start" />
          <Tab label={`Colaboradores (${collaborators.length})`} icon={<Group />} iconPosition="start" disabled={isNewDocument && !document?.id} />
          {!isNewDocument && document?.id && <Tab label={`Versões (${versions.length})`} icon={<History />} iconPosition="start" />}
          {!isNewDocument && document?.id && currentVersion && <Tab label={`Comentários (${currentComments.length})`} icon={<CommentIconMUI />} iconPosition="start" />}
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={isEditing && !isNewDocument ? 8 : 12}>
            <Paper sx={{ p: 3, minHeight: '70vh' }}>
              {isEditing ? (
                <Box>
                  {isNewDocument && hasRole('STUDENT') && (
                    <Autocomplete
                      id="advisor-select-editor"
                      options={advisorsList}
                      getOptionLabel={(option) => option.name || ""}
                      value={selectedAdvisor}
                      onChange={(event, newValue) => {
                        setSelectedAdvisor(newValue);
                        setUnsavedChanges(true);
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      loading={loadingAdvisors}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Orientador"
                          variant="outlined"
                          margin="normal"
                          required
                          error={!selectedAdvisor && unsavedChanges} 
                          helperText={!selectedAdvisor && unsavedChanges ? "Orientador é obrigatório." : ""}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingAdvisors ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      sx={{ mb: 2 }}
                    />
                  )}
                  <TextField fullWidth label="Título da Monografia" value={title} onChange={handleFieldChange(setTitle)} margin="normal" disabled={saving || (!userPermissions.canWrite && !isNewDocument)} sx={{ mb: 2 }} variant="outlined" />
                  <TextField fullWidth label="Descrição" value={description} onChange={handleFieldChange(setDescription)} multiline rows={2} margin="normal" disabled={saving || (!userPermissions.canWrite && !isNewDocument)} sx={{ mb: 2 }} variant="outlined" />
                  <TextField fullWidth multiline minRows={20} label="Conteúdo da Monografia (Markdown)" value={content} onChange={handleContentChange} disabled={saving || (!userPermissions.canWrite && !isNewDocument)} variant="outlined" sx={{ '& .MuiOutlinedInput-root': { fontFamily: '"Roboto Mono", monospace', fontSize: '0.95rem', lineHeight: 1.7 }, bgcolor: 'grey.50' }} />
                </Box>
              ) : (
                <Box>
                  {description && ( <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, borderLeft: `4px solid ${currentDisplayStatus.color === 'default' ? 'grey.500' : currentDisplayStatus.color + '.main'}` }}> <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}> Descrição </Typography> <Typography variant="body1" sx={{ fontStyle: 'italic' }}> {description} </Typography> </Box> )}
                  <Box sx={{ fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.8, color: '#333' }}> {renderFormattedContentPreview(content)} </Box>
                  {(!content && !description) && ( <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 5 }}> Este documento ainda não possui conteúdo. {(userPermissions.canWrite || isNewDocument) && " Clique em 'Editar' para começar."} </Typography> )}
                </Box>
              )}
            </Paper>
          </Grid>
          {isEditing && !isNewDocument && (
            <Grid item xs={12} md={4}>
              {renderCollaboratorSummary()}
            </Grid>
          )}
        </Grid>
      )}

      {selectedTab === 1 && !isNewDocument && document?.id && (
        <CollaboratorManagement
          documentId={document.id}
          currentUser={currentUser} 
          canManage={userPermissions.canManage}
          onCollaboratorsUpdate={setCollaborators} // Changed from onCollaboratorsChange
        />
      )}

      {selectedTab === 2 && !isNewDocument && document?.id && (
         <Card><CardContent>
          <Typography variant="h6" gutterBottom>Histórico de Versões</Typography>
          {versions.length > 0 ? (<List>{versions.map((v, i)=><ListItem key={v.id} divider={i < versions.length -1}><ListItemText primaryTypographyProps={{fontWeight: currentVersion?.id === v.id ? 'bold' : 'normal'}} primary={`v${v.versionNumber} - ${v.commitMessage || "N/A"}`} secondary={`Por ${v.createdByName} em ${new Date(v.createdAt).toLocaleString()}`}/></ListItem>)}</List>) 
          : <Typography sx={{textAlign: 'center', p:2}}>Nenhuma versão encontrada.</Typography>}
         </CardContent></Card>
      )}

      {selectedTab === 3 && !isNewDocument && document?.id && currentVersion && (
         <Card><CardContent>
          <Typography variant="h6" gutterBottom>Comentários da Versão (v{currentVersion.versionNumber})</Typography>
          {currentComments.length > 0 ? (<List>{currentComments.map((c, i)=><ListItem key={c.id} divider={i < currentComments.length -1}><ListItemAvatar><Avatar>{c.userName?.charAt(0)}</Avatar></ListItemAvatar><ListItemText primary={c.userName} secondary={<><Typography variant="body2">{c.content}</Typography><Typography variant="caption">{new Date(c.createdAt).toLocaleString()}</Typography></>}/></ListItem>)}</List>) 
          : <Typography sx={{textAlign: 'center', p:2}}>Nenhum comentário nesta versão.</Typography>}
         </CardContent></Card>
      )}

    </Container>
  );
};

export default DocumentEditorWithCollaborators;