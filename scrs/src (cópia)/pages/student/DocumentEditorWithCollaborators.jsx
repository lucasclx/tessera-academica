// Arquivo: scrs/src (cópia)/pages/student/DocumentEditorWithCollaborators.jsx
// frontend/src/pages/student/DocumentEditorWithCollaborators.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container, Typography, Button, Box, Paper, Grid, Tabs, Tab,
  Card, CardContent, Accordion, AccordionSummary, AccordionDetails,
  Chip, IconButton, Tooltip, Alert, CircularProgress
} from '@mui/material';
import {
  Save, History, Comment, Visibility, ArrowBack, Edit,
  Send, ExpandMore, Add, Group, Person, SupervisorAccount,
  CheckCircle, Warning, Error as ErrorIcon, Info,
  CloudUpload, CompareArrows, People
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { documentService, versionService, commentService } from "../../services";
import { collaboratorService } from '../../services/collaboratorService';
import CollaboratorManagement from '../../components/collaborators/CollaboratorManagement';

const DocumentEditorWithCollaborators = () => {
  const { id: documentIdFromParams } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);

  // Estados do documento
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

  // Estados dos colaboradores
  const [userPermissions, setUserPermissions] = useState({
    canRead: false,
    canWrite: false,
    canManage: false
  });
  const [collaborators, setCollaborators] = useState([]);

  // Estado da aba selecionada
  const [selectedTab, setSelectedTab] = useState(0);

  // Versões e comentários
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
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
      setComments([]);
      setLoading(false);
      setUnsavedChanges(false);
      setPageError(null);
      setUserPermissions({ canRead: true, canWrite: true, canManage: true }); // Criador tem todas as permissões
    } else {
      setIsNewDocument(false);
      loadDocumentAndPermissions(documentIdFromParams);
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.get('edit') === 'true') {
        setIsEditing(true);
      }
    }
  }, [documentIdFromParams, location.search]);

  const loadDocumentAndPermissions = useCallback(async (id) => {
    setLoading(true);
    setPageError(null);
    try {
      // Carregar dados do documento
      const docData = await documentService.getDocument(id);
      setDocument(docData);
      setTitle(docData.title);
      setDescription(docData.description || '');
      setStatus(docData.status);

      // Carregar permissões do usuário atual
      const permissions = await collaboratorService.getCurrentUserPermissions(id);
      setUserPermissions(permissions);

      // Verificar se o usuário tem permissão para visualizar o documento
      if (!permissions.canRead) {
        setPageError('Você não tem permissão para acessar este documento.');
        setLoading(false);
        return;
      }

      // Carregar colaboradores
      const collaboratorsData = await collaboratorService.getDocumentCollaborators(id);
      setCollaborators(collaboratorsData);

      // Carregar versões
      const versionsData = await versionService.getVersionsByDocument(id);
      setVersions(versionsData || []);

      if (versionsData && versionsData.length > 0) {
        const latestVersion = versionsData[0];
        setCurrentVersion(latestVersion);
        setContent(latestVersion.content || '');
        try {
          const commentsData = await commentService.getCommentsByVersion(latestVersion.id);
          setComments(commentsData || []);
        } catch (commentError) {
          console.warn('Não foi possível carregar comentários:', commentError);
          setComments([]);
        }
      } else {
        setContent(docData.description || '# Comece a editar seu documento aqui.'); // Conteúdo inicial se não houver versões
        setCurrentVersion(null);
        setComments([]);
      }
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast.error('Erro ao carregar documento. Verifique se ele existe e tente novamente.');
      setPageError('Não foi possível carregar o documento. Ele pode ter sido removido ou você não tem permissão para acessá-lo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFieldChange = (setter) => (event) => {
    setter(event.target.value);
    setUnsavedChanges(true);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
    setUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!userPermissions.canWrite) {
      toast.error('Você não tem permissão para editar este documento.');
      return;
    }

    if (!title.trim()) {
      toast.error('O título da monografia é obrigatório.');
      return;
    }

    setSaving(true);

    try {
      if (isNewDocument) {
        // Criar novo documento
        const newDocData = {
          title: title.trim(),
          description: description.trim(),
          studentId: currentUser.id, // Para compatibilidade e definição do criador inicial
          advisorId: null, // Será definido/confirmado ao adicionar colaboradores
        };
        
        const createdDoc = await documentService.createDocument(newDocData);

        // Criar primeira versão
        const versionData = {
          documentId: createdDoc.id,
          content: content,
          commitMessage: 'Versão inicial do documento colaborativo'
        };
        await versionService.createVersion(versionData);

        toast.success('Monografia colaborativa criada com sucesso!');
        setUnsavedChanges(false);
        navigate(`/student/documents/${createdDoc.id}`, { replace: true });
      } else {
        // Atualizar documento existente
        if (document && document.id) {
          let documentMetaChanged = false;
          const updatedMetaData = {};
          
          if (title.trim() !== document.title) {
            updatedMetaData.title = title.trim();
            documentMetaChanged = true;
          }
          if (description.trim() !== document.description) {
            updatedMetaData.description = description.trim();
            documentMetaChanged = true;
          }
          
          if (documentMetaChanged) {
            await documentService.updateDocument(document.id, updatedMetaData);
          }

          // Criar nova versão
          const versionData = {
            documentId: document.id,
            content: content,
            commitMessage: `Atualização colaborativa - ${new Date().toLocaleString('pt-BR')}`
          };
          await versionService.createVersion(versionData);
          
          toast.success('Nova versão salva com sucesso!');
          await loadDocumentAndPermissions(document.id); // Recarrega para pegar nova versão e metadados
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
    if (!userPermissions.canWrite && !isNewDocument) { // Permite edição para novo documento
      toast.error('Você não tem permissão para editar este documento.');
      return;
    }

    if (isEditing && unsavedChanges) {
      if (window.confirm('Você tem alterações não salvas. Deseja descartá-las e sair do modo de edição?')) {
        setIsEditing(false);
        if (!isNewDocument && document && document.id) {
          loadDocumentAndPermissions(document.id); // Recarrega o conteúdo original
        }
      }
    } else {
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
    const students = collaborators.filter(c => c.role.includes('STUDENT'));
    const advisors = collaborators.filter(c => c.role.includes('ADVISOR'));

    return (
      <Card sx={{ mb: 2 }} variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People color="primary" />
            Equipe Colaborativa ({collaborators.length})
          </Typography>
          
          <Grid container spacing={2}>
            {students.length > 0 && (
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Person fontSize="small" />
                    Estudantes ({students.length})
                  </Typography>
                  {students.slice(0, 3).map(student => (
                    <Box key={student.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip 
                        label={student.userName} 
                        size="small" 
                        color={student.role === 'PRIMARY_STUDENT' ? 'primary' : 'default'}
                        variant={student.role === 'PRIMARY_STUDENT' ? 'filled' : 'outlined'}
                      />
                    </Box>
                  ))}
                  {students.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{students.length - 3} mais
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
            
            {advisors.length > 0 && (
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SupervisorAccount fontSize="small" />
                    Orientadores ({advisors.length})
                  </Typography>
                  {advisors.slice(0, 3).map(advisor => (
                    <Box key={advisor.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip 
                        label={advisor.userName} 
                        size="small" 
                        color={advisor.role === 'PRIMARY_ADVISOR' ? 'secondary' : 'default'}
                        variant={advisor.role === 'PRIMARY_ADVISOR' ? 'filled' : 'outlined'}
                      />
                    </Box>
                  ))}
                  {advisors.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{advisors.length - 3} mais
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>

          {collaborators.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum colaborador adicionado ainda.
                {userPermissions.canManage && " Use a aba 'Colaboradores' para adicionar pessoas à equipe."}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading && !isNewDocument) { // Mostrar loading apenas se não for novo documento
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Carregando documento...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (pageError) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h5" gutterBottom>Erro ao Carregar</Typography>
          <Typography>{pageError}</Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/student/documents')} 
            sx={{ mt: 3 }}
          >
            Voltar para Minhas Monografias
          </Button>
        </Paper>
      </Container>
    );
  }

  const currentDisplayStatus = getStatusInfo(isNewDocument ? 'DRAFT' : (status || 'DRAFT'));

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        mb: 3, flexWrap: 'wrap', gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <IconButton onClick={() => navigate('/student/documents')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {title || "Monografia Colaborativa"}
              <People color="primary" fontSize="large" />
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            icon={currentDisplayStatus.icon}
            label={currentDisplayStatus.label}
            color={currentDisplayStatus.color}
            size="small"
          />
          {unsavedChanges && isEditing && (
            <Chip label="Não Salvo" color="warning" size="small" icon={<Warning />} />
          )}
          {!isNewDocument && document && document.id && (
            <Button
              variant="outlined"
              startIcon={<CompareArrows />}
              onClick={() => navigate(`/student/documents/${document.id}/compare`)}
              size="small"
            >
              Comparar
            </Button>
          )}
          {(userPermissions.canWrite || isNewDocument) && ( // Permite edição para novo documento
            <Button
              variant="outlined"
              startIcon={isEditing ? <Visibility /> : <Edit />}
              onClick={handleToggleEditMode}
              size="small"
              disabled={saving}
            >
              {isEditing ? 'Visualizar' : 'Editar'}
            </Button>
          )}
          {isEditing && (userPermissions.canWrite || isNewDocument) && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleSave}
              disabled={saving || !unsavedChanges}
              size="small"
            >
              {saving ? 'Salvando...' : (isNewDocument ? 'Criar Monografia' : 'Salvar Versão')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Informações sobre permissões */}
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
            {!userPermissions.canRead && "Você não tem permissão para ler este documento."}
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Documento" icon={<Edit />} iconPosition="start" />
          <Tab 
            label={`Colaboradores (${collaborators.length})`} 
            icon={<Group />} 
            iconPosition="start"
            disabled={isNewDocument} // Desabilita aba de colaboradores para novo documento até ser salvo
          />
          {!isNewDocument && <Tab label="Versões" icon={<History />} iconPosition="start" />}
          {!isNewDocument && <Tab label="Comentários" icon={<Comment />} iconPosition="start" />}
        </Tabs>
      </Box>

      {/* Conteúdo das Tabs */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={isEditing ? 8 : 12}>
            <Paper sx={{ p: 3, minHeight: '70vh' }}>
              {isEditing ? (
                <Box>
                  <TextField
                    fullWidth
                    label="Título da Monografia"
                    value={title}
                    onChange={handleFieldChange(setTitle)}
                    margin="normal"
                    disabled={saving || (!userPermissions.canWrite && !isNewDocument)}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Descrição"
                    value={description}
                    onChange={handleFieldChange(setDescription)}
                    multiline
                    rows={2}
                    margin="normal"
                    disabled={saving || (!userPermissions.canWrite && !isNewDocument)}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    multiline
                    minRows={20}
                    label="Conteúdo da Monografia (Markdown)"
                    value={content}
                    onChange={handleContentChange}
                    disabled={saving || (!userPermissions.canWrite && !isNewDocument)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: '"Roboto Mono", "Courier New", monospace',
                        fontSize: '0.95rem',
                        lineHeight: 1.7,
                      },
                      bgcolor: '#f9f9f9'
                    }}
                  />
                </Box>
              ) : (
                <Box>
                  {description && (
                    <Box sx={{ 
                      mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1,
                      borderLeft: `4px solid ${currentDisplayStatus.color === 'default' ? 'grey.500' : currentDisplayStatus.color + '.main'}`
                    }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Descrição
                      </Typography>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        {description}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.8, color: '#333' }}>
                    {renderFormattedContentPreview(content)}
                  </Box>
                  
                  {(!content && !description) && (
                    <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', mt: 5 }}>
                      Este documento ainda não possui conteúdo. 
                      {(userPermissions.canWrite || isNewDocument) && " Clique em 'Editar' para começar."}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
          
          {isEditing && (
            <Grid item xs={12} md={4}>
              {renderCollaboratorSummary()}
              
              {!isNewDocument && document && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informações do Documento
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Criado em:</strong> {document.createdAt ? 
                        new Date(document.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Última Atualização:</strong> {document.updatedAt ? 
                        new Date(document.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>ID do Documento:</strong> {document.id}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>
          )}
        </Grid>
      )}

      {selectedTab === 1 && !isNewDocument && (
        <CollaboratorManagement
          documentId={document?.id}
          currentUser={currentUser}
          canManage={userPermissions.canManage}
        />
      )}

      {selectedTab === 2 && !isNewDocument && (
        <Card>
          <CardHeader title="Histórico de Versões" />
          <CardContent>
            {versions.length > 0 ? (
              <List>
                {versions.map((version, index) => (
                  <ListItem key={version.id} divider={index < versions.length - 1}>
                    <ListItemText
                      primary={`v${version.versionNumber} - ${version.commitMessage || "Sem mensagem de commit"}`}
                      secondary={`Por ${version.createdByName || "Desconhecido"} em ${new Date(version.createdAt).toLocaleString('pt-BR')}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhuma versão disponível
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === 3 && !isNewDocument && (
        <Card>
          <CardHeader title="Comentários" />
          <CardContent>
            {comments.length > 0 ? (
              <List>
                {comments.map((comment) => (
                  <ListItem key={comment.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={comment.userName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.primary">
                            {comment.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(comment.createdAt).toLocaleString('pt-BR')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhum comentário disponível
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default DocumentEditorWithCollaborators;