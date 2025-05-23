// frontend/src/pages/student/DocumentEditor.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container, Typography, Button, Box, Paper,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Chip, IconButton,
  Toolbar, Divider, Card, CardContent,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, ListItemIcon,
  Alert, LinearProgress, Autocomplete, CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Save, History, Comment, Visibility, ArrowBack, Edit,
  Send, ExpandMore, Add, FormatBold, FormatItalic,
  FormatUnderlined, FormatListBulleted, FormatListNumbered,
  Link as LinkIcon, Image, Title as TitleIcon, Subject, Person, Schedule,
  CheckCircle, Warning, Error as ErrorIcon, Info,
  CloudUpload, CompareArrows
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import documentService from '../../services/documentService';
import versionService from '../../services/versionService';
import commentService from '../../services/commentService';
// TODO: import userService from '../../services/userService'; // For fetching advisors

const DocumentEditor = () => {
  const { id: documentId } = useParams(); // Renamed to avoid conflict
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);

  // Core Document States
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT'); // Default status for new documents

  // Mode States
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // True if in edit mode (vs. view mode)

  // Loading and Saving States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState(null);

  // Versions and Comments
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [comments, setComments] = useState([]);

  // Unsaved Changes
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Dialog States
  const [saveDialog, setSaveDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [commentDialog, setCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Advisor Selection (Placeholder)
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  const isStudent = currentUser?.roles?.includes('ROLE_STUDENT'); // Assuming role format

  // Initialize for new or existing document
  useEffect(() => {
    if (documentId === 'new') {
      setIsNewDocument(true);
      setIsEditing(true);
      setTitle('Nova Monografia');
      setContent('# Título da Monografia\n\n## Seção 1\n\nComece a escrever aqui...');
      setDescription('');
      setStatus('DRAFT');
      setDocument(null);
      setCurrentVersion(null);
      setVersions([]);
      setComments([]);
      setLoading(false);
      setUnsavedChanges(false); // Initially no unsaved changes for a new doc
      // TODO: Fetch advisors if isNewDocument and student
      // if (isStudent) fetchAdvisors();
    } else {
      setIsNewDocument(false);
      loadDocumentAndRelatedData(documentId);
      // Check if navigating with edit=true query param
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.get('edit') === 'true') {
        setIsEditing(true);
      }
    }
  }, [documentId, location.search]);


  // Prompt for unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (unsavedChanges) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);


  const loadDocumentAndRelatedData = useCallback(async (id) => {
    setLoading(true);
    setPageError(null);
    try {
      const docData = await documentService.getDocument(id);
      setDocument(docData);
      setTitle(docData.title);
      setDescription(docData.description || '');
      setStatus(docData.status);

      const versionsData = await versionService.getVersionsByDocument(id);
      setVersions(versionsData);

      if (versionsData.length > 0) {
        const latestVersion = versionsData[0];
        setCurrentVersion(latestVersion);
        setContent(latestVersion.content || '');
        // Load comments for the latest version
        try {
          const commentsData = await commentService.getCommentsByVersion(latestVersion.id);
          setComments(commentsData);
        } catch (commentError) {
          console.warn('Não foi possível carregar comentários:', commentError);
          setComments([]);
          toast.warn('Não foi possível carregar os comentários desta versão.');
        }
      } else {
        setContent(''); // No versions, so no content
        setCurrentVersion(null);
        setComments([]);
      }
      setUnsavedChanges(false); // Reset unsaved changes after loading
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast.error('Erro ao carregar documento. Verifique se ele existe e tente novamente.');
      setPageError('Não foi possível carregar o documento. Ele pode ter sido removido ou você não tem permissão para acessá-lo.');
    } finally {
      setLoading(false);
    }
  }, []);

  // TODO: Implement advisor fetching
  // const fetchAdvisors = async () => {
  //   setLoadingAdvisors(true);
  //   try {
  //     // const response = await userService.getUsersByRole('ADVISOR');
  //     // setAdvisors(response.data); // Assuming API returns a list of advisor objects
  //     // Simulate API call
  //     await new Promise(resolve => setTimeout(resolve, 1000));
  //     setAdvisors([
  //       { id: 1, name: 'Prof. Dr. Orientador Um' },
  //       { id: 2, name: 'Profa. Dra. Orientadora Dois' },
  //     ]);
  //   } catch (error) {
  //     console.error('Erro ao buscar orientadores:', error);
  //     toast.error('Erro ao buscar lista de orientadores.');
  //   } finally {
  //     setLoadingAdvisors(false);
  //   }
  // };

  const handleFieldChange = (setter) => (event) => {
    setter(event.target.value);
    setUnsavedChanges(true);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
    setUnsavedChanges(true);
  };

  const validateSave = () => {
    if (!title.trim()) {
      toast.error('O título da monografia é obrigatório.');
      return false;
    }
    if (isNewDocument && isStudent && !selectedAdvisor) {
      // TODO: Enable this validation when advisor selection is implemented
      // toast.error('Por favor, selecione um orientador.');
      // return false;
    }
    if (!commitMessage.trim()) {
      toast.error('A mensagem da versão é obrigatória.');
      return false;
    }
    return true;
  };

  const handleOpenSaveDialog = () => {
    if (!title.trim()) {
      toast.error('O título da monografia é obrigatório.');
      return;
    }
    // Set a default commit message
    const defaultMsg = isNewDocument ? 'Versão inicial' :
                       currentVersion ? `Atualizações baseadas na v${currentVersion.versionNumber}` : 'Nova versão';
    setCommitMessage(defaultMsg);
    setSaveDialog(true);
  };

  const handleSave = async () => {
    if (!validateSave()) {
      setSaving(false); // Ensure saving is false if validation fails early
      return;
    }
    setSaving(true);

    try {
      if (isNewDocument) {
        const newDocData = {
          title: title.trim(),
          description: description.trim(),
          studentId: currentUser.id,
          // advisorId: selectedAdvisor ? selectedAdvisor.id : null, // TODO: Use selected advisor
          advisorId: 1, // Placeholder
        };
        const createdDoc = await documentService.createDocument(newDocData);

        const versionData = {
          documentId: createdDoc.id,
          content: content,
          commitMessage: commitMessage.trim()
        };
        await versionService.createVersion(versionData);

        toast.success('Monografia criada com sucesso!');
        navigate(`/student/documents/${createdDoc.id}`);
      } else {
        // Update document metadata (title, description) if changed
        if (document && (title.trim() !== document.title || description.trim() !== document.description)) {
          await documentService.updateDocument(documentId, {
            title: title.trim(),
            description: description.trim()
          });
        }

        const versionData = {
          documentId: documentId,
          content: content,
          commitMessage: commitMessage.trim()
        };
        await versionService.createVersion(versionData);
        toast.success('Nova versão salva com sucesso!');
        await loadDocumentAndRelatedData(documentId); // Reload to get latest data
      }
      setUnsavedChanges(false);
      setSaveDialog(false);
      setCommitMessage('');
      setIsEditing(false); // Exit edit mode after saving
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentVersion) {
      toast.warn('Comentário não pode estar vazio e deve haver uma versão atual.');
      return;
    }
    try {
      const commentData = {
        versionId: currentVersion.id,
        content: newComment.trim(),
        // TODO: Add startPosition and endPosition if implementing text-selection comments
      };
      await commentService.createComment(commentData);
      setNewComment('');
      setCommentDialog(false);
      toast.success('Comentário adicionado!');
      // Reload comments for the current version
      const commentsData = await commentService.getCommentsByVersion(currentVersion.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário.');
    }
  };

  const handleToggleEditMode = () => {
    if (isEditing && unsavedChanges) {
      if (window.confirm('Você tem alterações não salvas. Deseja descartá-las e sair do modo de edição?')) {
        setIsEditing(false);
        // Revert changes by reloading original data if not a new doc
        if (!isNewDocument && documentId) {
           loadDocumentAndRelatedData(documentId);
        }
      }
    } else {
      setIsEditing(!isEditing);
    }
  };

  const formatText = (formatType) => {
    const textarea = document.getElementById('content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newContent = content;
    let newStart = start;
    let newEnd = end;

    const prefixMap = {
        bold: '**',
        italic: '*',
        underline: '__', // Example, Markdown doesn't have universal underline
    };

    const blockMap = {
        h1: '# ',
        h2: '## ',
        ul: '- ',
        ol: '1. '
    };

    if (formatType in prefixMap) {
        const prefix = prefixMap[formatType];
        newContent = `${content.substring(0, start)}${prefix}${selectedText}${prefix}${content.substring(end)}`;
        newStart = start + prefix.length;
        newEnd = end + prefix.length;
    } else if (formatType in blockMap) {
        const blockPrefix = blockMap[formatType];
        // For block elements, apply to the beginning of the line or selected lines
        let lineStart = content.lastIndexOf('\n', start -1) + 1;
        if (selectedText.includes('\n')) { // Multi-line selection
            const lines = selectedText.split('\n');
            const formattedLines = lines.map(line => `${blockPrefix}${line}`).join('\n');
            newContent = `${content.substring(0, lineStart)}${formattedLines}${content.substring(end)}`;
            newEnd = lineStart + formattedLines.length;
        } else {
             newContent = `${content.substring(0, lineStart)}${blockPrefix}${content.substring(lineStart)}`;
             newEnd = end + blockPrefix.length;
        }
         newStart = lineStart;
    }


    setContent(newContent);
    setUnsavedChanges(true);

    // Refocus and set cursor position
    textarea.focus();
    setTimeout(() => textarea.setSelectionRange(newStart, newEnd), 0);
  };


  const getStatusInfo = (docStatus) => {
    const statusMap = {
      'DRAFT': { label: 'Rascunho', color: 'default', icon: <Edit /> },
      'SUBMITTED': { label: 'Enviado para Revisão', color: 'primary', icon: <Send /> },
      'REVISION': { label: 'Em Revisão', color: 'warning', icon: <Warning /> },
      'APPROVED': { label: 'Aprovado', color: 'success', icon: <CheckCircle /> },
      'FINALIZED': { label: 'Finalizado', color: 'info', icon: <Info /> }
    };
    return statusMap[docStatus] || statusMap['DRAFT'];
  };

  const renderFormattedContentPreview = (text) => {
    // Basic Markdown to HTML conversion (can be expanded or use a library)
    let html = text
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.8em; margin-top: 1em; margin-bottom: 0.5em;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.5em; margin-top: 0.8em; margin-bottom: 0.4em;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.2em; margin-top: 0.6em; margin-bottom: 0.3em;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>') // Basic underline
      .replace(/^- (.*$)/gm, '<ul style="margin-left: 20px; padding-left: 0;"><li>$1</li></ul>') // Simplistic list
      .replace(/^\d+\. (.*$)/gm, '<ol style="margin-left: 20px; padding-left: 0;"><li>$1</li></ol>') // Simplistic ordered list
      .replace(/\n\n/g, '</p><p style="margin-bottom: 1em;">') // Paragraphs
      .replace(/\n/g, '<br>'); // Line breaks

    // Wrap in a starting p tag if not starting with a block element
    if (!html.match(/^<(h[1-3]|ul|ol)/)) {
      html = `<p style="margin-bottom: 1em;">${html}`;
    }
     // Close any open p tag at the end
    if (html.endsWith('<br>') || !html.endsWith('</p>')) {
         html += '</p>';
    }
    // Consolidate multiple <ul> and <ol> into single lists
    html = html.replace(/<\/ul>\s*<ul.*?>/g, '');
    html = html.replace(/<\/ol>\s*<ol.*?>/g, '');


    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };


  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Carregando {isNewDocument ? 'editor' : 'documento'}...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (pageError) {
     return (
      <Container maxWidth="lg">
        <Paper sx={{ p:3, mt: 4, textAlign: 'center' }}>
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

  const currentDisplayStatus = getStatusInfo(isNewDocument ? 'DRAFT' : (document?.status || 'DRAFT'));

  return (
    <Container maxWidth="xl">
      {/* Header Toolbar */}
      <Toolbar disableGutters sx={{ my: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/student/documents')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: '200px', mr: 2 }}>
          {isEditing ? (
            <TextField
              value={title}
              onChange={handleFieldChange(setTitle)}
              variant="standard"
              placeholder="Título da Monografia"
              fullWidth
              sx={{ '& .MuiInput-input': { fontSize: '1.6rem', fontWeight: 500 } }}
              disabled={saving}
            />
          ) : (
            <Typography variant="h4" component="h1" noWrap>
              {title || "Monografia sem Título"}
            </Typography>
          )}
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
          {!isNewDocument && (
            <Button
                variant="outlined"
                startIcon={<CompareArrows />}
                onClick={() => navigate(`/student/documents/${documentId}/compare`)}
                size="small"
            >
                Comparar
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={isEditing ? <Visibility /> : <Edit />}
            onClick={handleToggleEditMode}
            size="small"
            disabled={saving}
          >
            {isEditing ? 'Visualizar' : 'Editar'}
          </Button>
          {isEditing && (
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              onClick={handleOpenSaveDialog}
              disabled={saving || !unsavedChanges}
              size="small"
            >
              {saving ? 'Salvando...' : (isNewDocument ? 'Criar Monografia' : 'Salvar Versão')}
            </Button>
          )}
        </Box>
      </Toolbar>

      <Grid container spacing={isEditing ? 2 : 3}>
        {/* Main Content Area (Editor or Preview) */}
        <Grid item xs={12} md={isEditing ? 8 : 12}> {/* Full width in view mode */}
          <Paper sx={{ p: isEditing ? 2 : 3, minHeight: '70vh' }}>
            {isEditing && (
              <>
                {isNewDocument && isStudent && (
                  <Autocomplete
                    // TODO: Replace with actual advisor loading and selection
                    options={advisors}
                    getOptionLabel={(option) => option.name}
                    value={selectedAdvisor}
                    onChange={(event, newValue) => {
                      setSelectedAdvisor(newValue);
                      setUnsavedChanges(true);
                    }}
                    loading={loadingAdvisors}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Orientador"
                        variant="outlined"
                        placeholder="Selecione um orientador (Opcional por agora)"
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
                    disabled={saving}
                  />
                )}
                <TextField
                  label="Descrição da Monografia"
                  value={description}
                  onChange={handleFieldChange(setDescription)}
                  multiline
                  rows={2}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                  placeholder="Forneça uma breve descrição ou resumo da sua monografia..."
                  disabled={saving}
                />
                {/* Formatting Toolbar */}
                <Box sx={{ border: '1px solid #ccc', p: 1, mb: 2, borderRadius: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Tooltip title="Negrito (Ctrl+B / Cmd+B)"><IconButton size="small" onClick={() => formatText('bold')}><FormatBold /></IconButton></Tooltip>
                  <Tooltip title="Itálico (Ctrl+I / Cmd+I)"><IconButton size="small" onClick={() => formatText('italic')}><FormatItalic /></IconButton></Tooltip>
                  {/* <Tooltip title="Sublinhado (Ctrl+U / Cmd+U)"><IconButton size="small" onClick={() => formatText('underline')}><FormatUnderlined /></IconButton></Tooltip> */}
                  <Divider orientation="vertical" flexItem sx={{ mx:0.5 }}/>
                  <Tooltip title="Título Principal"><IconButton size="small" onClick={() => formatText('h1')}><TitleIcon /></IconButton></Tooltip>
                  <Tooltip title="Subtítulo"><IconButton size="small" onClick={() => formatText('h2')}><Subject /></IconButton></Tooltip>
                  <Divider orientation="vertical" flexItem sx={{ mx:0.5 }}/>
                  <Tooltip title="Lista Não Ordenada"><IconButton size="small" onClick={() => formatText('ul')}><FormatListBulleted /></IconButton></Tooltip>
                  <Tooltip title="Lista Ordenada"><IconButton size="small" onClick={() => formatText('ol')}><FormatListNumbered /></IconButton></Tooltip>
                  {/* <Tooltip title="Inserir Link"><IconButton size="small"><LinkIcon /></IconButton></Tooltip> */}
                  {/* <Tooltip title="Inserir Imagem"><IconButton size="small"><Image /></IconButton></Tooltip> */}
                </Box>
                <TextField
                  id="content-editor"
                  value={content}
                  onChange={handleContentChange}
                  multiline
                  minRows={20}
                  fullWidth
                  variant="outlined"
                  placeholder="Comece a escrever sua monografia aqui usando Markdown..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: '"Roboto Mono", "Courier New", monospace',
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                    },
                    bgcolor: '#f9f9f9'
                  }}
                  disabled={saving}
                />
              </>
            )}
            {!isEditing && (
              <Box sx={{ fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.8, color: '#333' }}>
                {description && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, borderLeft: `4px solid ${currentDisplayStatus.color === 'default' ? 'grey.500' : currentDisplayStatus.color + '.main'}` }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Descrição
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      {description}
                    </Typography>
                  </Box>
                )}
                {renderFormattedContentPreview(content)}
                 {(!content && !description) && (
                    <Typography variant="body1" color="textSecondary" sx={{textAlign: 'center', mt: 5}}>
                        Este documento ainda não possui conteúdo ou descrição. Clique em "Editar" para começar.
                    </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar (only in edit mode or if document exists) */}
        {(isEditing || !isNewDocument) && (
          <Grid item xs={12} md={4}>
            {/* Document Info Card */}
            {!isNewDocument && document && (
              <Card sx={{ mb: 2 }} variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1, color: 'primary.main' }} /> Informações
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="body2" gutterBottom>
                    <strong>Orientador:</strong> {document.advisorName || 'Não definido'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Estudante:</strong> {document.studentName || currentUser.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Criado em:</strong> {new Date(document.createdAt).toLocaleDateString('pt-BR')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Última Atualização:</strong> {new Date(document.updatedAt).toLocaleDateString('pt-BR')}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Version History Accordion */}
            {!isNewDocument && versions.length > 0 && (
              <Accordion defaultExpanded sx={{ mb: 2 }} variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <History sx={{ mr: 1, color: 'action.active' }} />
                  <Typography>Versões ({versions.length})</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <List dense>
                    {versions.map((version, index) => (
                      <ListItem
                        key={version.id}
                        divider={index < versions.length -1}
                        selected={currentVersion?.id === version.id}
                        sx={{
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            bgcolor: currentVersion?.id === version.id ? 'action.hover' : 'transparent'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                            <Typography variant="subtitle2" component="span" color="primary.main">
                            v{version.versionNumber} {currentVersion?.id === version.id && "(Atual)"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(version.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </Typography>
                        </Box>
                        <ListItemText
                          primary={version.commitMessage}
                          secondary={`Por: ${version.createdByName}`}
                          primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 500, mt: 0.5} }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Comments Accordion */}
            {!isNewDocument && currentVersion && (
              <Accordion variant="outlined">
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Comment sx={{ mr: 1, color: 'action.active' }} />
                  <Typography>Comentários ({comments.length})</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    size="small"
                    onClick={() => setCommentDialog(true)}
                    fullWidth
                    sx={{ mb: comments.length > 0 ? 2 : 0 }}
                  >
                    Adicionar Comentário
                  </Button>
                  {comments.length > 0 ? (
                    <List dense>
                      {comments.map((comment) => (
                        <ListItem
                          key={comment.id}
                          sx={{
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            mb: 1,
                            p: 1.5
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {comment.userName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {comment.content}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                      Nenhum comentário nesta versão.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            )}
          </Grid>
        )}
      </Grid>

      {/* Save Dialog */}
      <Dialog open={saveDialog} onClose={() => !saving && setSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudUpload sx={{mr: 1}} /> {isNewDocument ? 'Criar Nova Monografia' : 'Salvar Nova Versão'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="commitMessage"
            label="Mensagem da Versão (Obrigatório)"
            fullWidth
            multiline
            rows={3}
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Ex: Correções ortográficas, Adição da seção de metodologia, Versão inicial..."
            error={!commitMessage.trim() && saveDialog} // Show error if dialog is open and field is empty
            helperText={!commitMessage.trim() && saveDialog ? "A mensagem da versão é necessária." : ""}
          />
           <Alert severity="info" sx={{ mt: 2 }}>
            Uma nova versão do seu documento será criada. Isso permite que você acompanhe o histórico de alterações.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSaveDialog(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !commitMessage.trim()}>
            {saving ? <CircularProgress size={24} /> : (isNewDocument ? 'Criar e Salvar' : 'Salvar Versão')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialog} onClose={() => setCommentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
            <Add sx={{mr:1}}/> Adicionar Comentário à Versão {currentVersion?.versionNumber}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="newComment"
            label="Seu Comentário"
            fullWidth
            multiline
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Digite seu feedback ou observação sobre esta versão do documento..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCommentDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddComment} variant="contained" disabled={!newComment.trim()}>
            Adicionar Comentário
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentEditor;