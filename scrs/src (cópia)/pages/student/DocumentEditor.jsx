// Arquivo: scrs/src (cópia)/pages/student/DocumentEditor.jsx
// frontend/src/pages/student/DocumentEditor.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container, Typography, Button, Box, Paper,
  TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Chip, IconButton,
  Toolbar, Divider, Card, CardContent,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, ListItemIcon,
  Alert, Autocomplete, CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Save, History, Comment, Visibility, ArrowBack, Edit,
  Send, ExpandMore, Add, FormatBold, FormatItalic,
  FormatListBulleted, FormatListNumbered,
  Title as TitleIcon, Subject, Person, Schedule,
  CheckCircle, Warning, Error as ErrorIcon, Info,
  CloudUpload, CompareArrows
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import { documentService, versionService, commentService, userService } from "../../services";

const DocumentEditor = () => {
  const { id: documentIdFromParams } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);

  // Core Document States
  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('DRAFT');

  // Mode States
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  // Advisor Selection
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  const isStudent = currentUser?.roles?.includes('ROLE_STUDENT');

  const fetchAdvisors = useCallback(async () => {
    if (!isStudent) return;
    setLoadingAdvisors(true);
    try {
      const advisorData = await userService.getApprovedAdvisors();
      setAdvisors(advisorData || []);
    } catch (error) {
      console.error('Erro ao buscar orientadores:', error);
      toast.error('Não foi possível carregar a lista de orientadores.');
      setAdvisors([]);
    } finally {
      setLoadingAdvisors(false);
    }
  }, [isStudent]);

  const loadDocumentAndRelatedData = useCallback(async (id) => {
    setLoading(true);
    setPageError(null);
    try {
      const docData = await documentService.getDocument(id);
      setDocument(docData);
      setTitle(docData.title);
      setDescription(docData.description || '');
      setStatus(docData.status);

      // Se a lista de orientadores já estiver carregada, tenta selecionar o orientador do documento
      if (advisors.length > 0 && docData.advisorId) {
        const foundAdvisor = advisors.find(a => a.id === docData.advisorId);
        if (foundAdvisor) {
            setSelectedAdvisor(foundAdvisor);
        } else {
            console.warn(`Orientador com ID ${docData.advisorId} não encontrado na lista de orientadores ativos.`);
            // Poderia buscar os dados do orientador individualmente se necessário, ou exibir "Orientador Desconhecido"
        }
      }


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
          // toast.warn('Não foi possível carregar os comentários desta versão.'); // Pode ser muito verboso
        }
      } else {
        setContent(''); // Ou algum conteúdo padrão se o documento for recém-criado e não tiver versões
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
  }, [advisors]); // Adiciona advisors como dependência para re-selecionar o orientador quando a lista carregar

  useEffect(() => {
    if (isStudent) {
        fetchAdvisors();
    }
  }, [isStudent, fetchAdvisors]);


  useEffect(() => {
    if (documentIdFromParams === undefined) {
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
      setSelectedAdvisor(null);
      setLoading(false);
      setUnsavedChanges(false);
      setPageError(null);
    } else {
      setIsNewDocument(false);
      // Carrega o documento imediatamente. loadDocumentAndRelatedData lidará com a seleção do orientador quando advisors estiverem disponíveis.
      loadDocumentAndRelatedData(documentIdFromParams);
      const queryParams = new URLSearchParams(location.search);
      if (queryParams.get('edit') === 'true') {
        setIsEditing(true);
      }
    }
  }, [documentIdFromParams, location.search, loadDocumentAndRelatedData]);


   // Efeito para tentar selecionar o orientador assim que a lista de `advisors` e os dados do `document` estiverem disponíveis
   useEffect(() => {
    if (document && document.advisorId && advisors.length > 0 && !selectedAdvisor) {
      const foundAdvisor = advisors.find(a => a.id === document.advisorId);
      if (foundAdvisor) {
        setSelectedAdvisor(foundAdvisor);
      } else {
         console.warn(`Orientador com ID ${document.advisorId} não encontrado na lista de orientadores ativos após o carregamento da lista.`);
      }
    }
  }, [document, advisors, selectedAdvisor]);


  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (unsavedChanges) {
        event.preventDefault();
        event.returnValue = ''; // Padrão para navegadores modernos
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

  const validateSave = () => {
    if (!title.trim()) {
      toast.error('O título da monografia é obrigatório.');
      return false;
    }
    if (isNewDocument && isStudent && !selectedAdvisor) {
      toast.error('Por favor, selecione um orientador.');
      return false;
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
    if (isNewDocument && isStudent && !selectedAdvisor) {
      toast.error('Selecione um orientador antes de salvar.');
      const advisorField = document.getElementById('advisor-autocomplete'); 
      if (advisorField) advisorField.focus();
      return;
    }
    const defaultMsg = isNewDocument ? 'Versão inicial' :
                       currentVersion ? `Atualizações baseadas na v${currentVersion.versionNumber}` : 'Nova versão';
    setCommitMessage(defaultMsg);
    setSaveDialog(true);
  };

  const handleSave = async () => {
    if (!currentUser || !currentUser.id) {
        toast.error('Erro: Informações do usuário não encontradas. Faça login novamente.');
        setSaving(false);
        return;
    }

    if (!validateSave()) {
      setSaving(false); // Reset saving state if validation fails
      return;
    }
    setSaving(true);

    try {
      if (isNewDocument) {
        const newDocData = {
          title: title.trim(),
          description: description.trim(),
          studentId: currentUser.id, 
          advisorId: selectedAdvisor ? selectedAdvisor.id : null,
        };
        // Re-validação de orientador aqui, caso o usuário tenha desselecionado
        if (isStudent && !newDocData.advisorId) { 
            toast.error("Orientador é obrigatório para criar uma nova monografia.");
            setSaving(false);
            setSaveDialog(false); // Fechar diálogo para permitir correção
            return;
        }
        const createdDoc = await documentService.createDocument(newDocData);

        const versionData = {
          documentId: createdDoc.id,
          content: content,
          commitMessage: commitMessage.trim()
        };
        await versionService.createVersion(versionData);

        toast.success('Monografia criada com sucesso!');
        setUnsavedChanges(false);
        navigate(`/student/documents/${createdDoc.id}`, { replace: true });
      } else {
        if (document && document.id) {
            let documentMetaChanged = false;
            const updatedMetaData = {
                title: title.trim(),
                description: description.trim(),
                // Atualizar advisorId se mudou e se o usuário tem permissão (ex: admin ou estudante antes da submissão)
                // Por ora, a lógica de mudança de orientador não está implementada nesta tela, apenas seleção inicial.
            };
            
            // Comparar com os dados do documento carregado
            if (updatedMetaData.title !== document.title) documentMetaChanged = true;
            if (updatedMetaData.description !== document.description) documentMetaChanged = true;
            // if (updatedMetaData.advisorId !== document.advisorId) documentMetaChanged = true; // Se fosse editável

            if (documentMetaChanged) {
                await documentService.updateDocument(document.id, updatedMetaData);
            }

            const versionData = {
              documentId: document.id,
              content: content,
              commitMessage: commitMessage.trim()
            };
            await versionService.createVersion(versionData);
            toast.success('Nova versão salva com sucesso!');
            await loadDocumentAndRelatedData(document.id); // Recarrega os dados
        } else {
            toast.error('Não foi possível salvar. ID do documento não encontrado.');
            console.error('Tentativa de salvar documento existente sem ID:', document);
        }
      }
      setUnsavedChanges(false);
      setSaveDialog(false);
      setCommitMessage('');
      setIsEditing(false); // Sai do modo de edição após salvar
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (error.message && error.message.includes('ID do estudante é obrigatório')) {
          toast.error('Erro ao salvar: ID do estudante não encontrado. Verifique se está logado corretamente.');
      } else {
          toast.error(error.response?.data?.message || 'Erro ao salvar. Tente novamente.');
      }
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
      };
      await commentService.createComment(commentData);
      setNewComment('');
      setCommentDialog(false);
      toast.success('Comentário adicionado!');
      // Recarregar comentários da versão atual
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
        // Recarregar dados do documento para reverter alterações não salvas
        if (!isNewDocument && document && document.id) {
           loadDocumentAndRelatedData(document.id);
        }
      }
    } else {
      setIsEditing(!isEditing);
    }
  };

  // Função de formatação de texto (Markdown)
  const formatText = (formatType) => {
    const textarea = document.getElementById('content-editor');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let newContent = content;
    let newStart = start;
    let newEnd = end;

    const prefixMap = { bold: '**', italic: '*', underline: '__' }; // Underline não é padrão Markdown, mas comum
    const blockMap = { h1: '# ', h2: '## ', h3: '### ', ul: '- ', ol: '1. ' };

    if (formatType in prefixMap) {
        const prefix = prefixMap[formatType];
        newContent = `${content.substring(0, start)}${prefix}${selectedText}${prefix}${content.substring(end)}`;
        newStart = start + prefix.length;
        newEnd = end + prefix.length;
    } else if (formatType in blockMap) {
        const blockPrefix = blockMap[formatType];
        // Encontra o início da linha atual ou da primeira linha selecionada
        let lineStart = content.lastIndexOf('\n', start -1) + 1;
        
        if (selectedText.includes('\n')) { // Múltiplas linhas selecionadas
            const lines = content.substring(lineStart, end).split('\n');
            const formattedLines = lines.map(line => `${blockPrefix}${line}`).join('\n');
            newContent = `${content.substring(0, lineStart)}${formattedLines}${content.substring(end)}`;
            newEnd = lineStart + formattedLines.length;
        } else { // Linha única ou nenhuma seleção
             newContent = `${content.substring(0, lineStart)}${blockPrefix}${content.substring(lineStart, end)}${content.substring(end)}`;
             newEnd = end + blockPrefix.length;
             if (start === end) newStart = lineStart + blockPrefix.length; // Move cursor após prefixo se nada selecionado
             else newStart = lineStart;
        }
    }
    setContent(newContent);
    setUnsavedChanges(true);
    
    // Focar e restaurar seleção (ou posicionar cursor)
    textarea.focus();
    setTimeout(() => {
        if (start === end && (formatType in blockMap || formatType in prefixMap)) { // Posiciona cursor após prefixo
             textarea.setSelectionRange(newStart, newStart);
        } else {
             textarea.setSelectionRange(newStart, newEnd);
        }
    }, 0);
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

  // Função para renderizar Markdown (simplificada, pode ser substituída por uma lib como react-markdown)
  const renderFormattedContentPreview = (text) => {
    if (text === null || text === undefined || text.trim() === '') {
        return <Typography color="textSecondary" sx={{p: 2, fontStyle: 'italic'}}>Conteúdo não disponível ou vazio.</Typography>;
    }
    // Uma implementação muito básica, idealmente usar uma biblioteca Markdown
    let html = text
      .replace(/^# (.*$)/gm, '<h1 style="font-size: 1.8em; margin-top: 1em; margin-bottom: 0.5em;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size: 1.5em; margin-top: 0.8em; margin-bottom: 0.4em;">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 style="font-size: 1.2em; margin-top: 0.6em; margin-bottom: 0.3em;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negrito
      .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Itálico
      .replace(/__(.*?)__/g, '<u>$1</u>')       // Sublinhado (não padrão Markdown, mas exemplo)
      .replace(/^- (.*$)/gm, '<ul style="margin-left: 20px; padding-left: 0;"><li>$1</li></ul>') // Lista não ordenada
      .replace(/^\d+\. (.*$)/gm, '<ol style="margin-left: 20px; padding-left: 0;"><li>$1</li></ol>') // Lista ordenada
      .replace(/\n\n/g, '</p><p style="margin-bottom: 1em;">') // Parágrafos
      .replace(/\n/g, '<br>'); // Quebras de linha
    
    // Adiciona tags <p> se não começar com um header ou lista
    if (!html.match(/^<(h[1-3]|ul|ol)/)) {
        html = `<p style="margin-bottom: 1em;">${html}`;
    }
    // Fecha a tag <p> se necessário
    if (html.endsWith('<br>') || !html.endsWith('</p>')) {
       html += '</p>';
    }
    // Remove listas vazias ou múltiplas tags ul/ol consecutivas
    html = html.replace(/<\/ul>\s*<ul.*?>/g, '');
    html = html.replace(/<\/ol>\s*<ol.*?>/g, '');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (loading && !isNewDocument) {
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
            <Button variant="contained" startIcon={<ArrowBack />} onClick={() => navigate('/student/documents')} sx={{ mt: 3 }}>
                Voltar para Minhas Monografias
            </Button>
        </Paper>
      </Container>
     );
  }

  const currentDisplayStatus = getStatusInfo(status);

  return (
    <Container maxWidth="xl">
      <Toolbar disableGutters sx={{ my: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/student/documents')} sx={{ mr: 1 }} aria-label="Voltar">
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
            <Typography variant="h4" component="h1" noWrap>{title || "Monografia sem Título"}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip 
            icon={currentDisplayStatus.icon} 
            label={currentDisplayStatus.label} 
            color={currentDisplayStatus.color} 
            size="small" 
          />
          {unsavedChanges && isEditing && (<Chip label="Não Salvo" color="warning" size="small" icon={<Warning />} />)}
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
              disabled={saving || !unsavedChanges || (isNewDocument && isStudent && !selectedAdvisor)} 
              size="small"
            >
              {saving ? 'Salvando...' : (isNewDocument ? 'Criar Monografia' : 'Salvar Versão')}
            </Button>
          )}
        </Box>
      </Toolbar>

      <Grid container spacing={isEditing ? 2 : 3}>
        <Grid item xs={12} md={isEditing ? 8 : 12}>
          <Paper sx={{ p: isEditing ? 2 : 3, minHeight: '70vh' }}>
            {isEditing && (
              <>
                {isNewDocument && isStudent && (
                  <Autocomplete
                    id="advisor-autocomplete" 
                    options={advisors}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedAdvisor}
                    onChange={(event, newValue) => {
                      setSelectedAdvisor(newValue);
                      setUnsavedChanges(true); // Marcar como alteração não salva ao mudar orientador
                    }}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    loading={loadingAdvisors}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Orientador (Obrigatório)"
                        variant="outlined"
                        required
                        error={isNewDocument && !selectedAdvisor && saveDialog} // Mostrar erro se for novo e não selecionado no diálogo de salvar
                        helperText={isNewDocument && !selectedAdvisor && saveDialog ? "Selecione um orientador." : ""}
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
                    renderOption={(props, option) => ( // Adicionar key para cada opção
                      <Box component="li" {...props} key={option.id}>
                        {option.name}
                      </Box>
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
                <Box sx={{ border: '1px solid #ccc', p: 1, mb: 2, borderRadius: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Tooltip title="Negrito (Ctrl+B / Cmd+B)"><IconButton size="small" onClick={() => formatText('bold')}><FormatBold /></IconButton></Tooltip>
                  <Tooltip title="Itálico (Ctrl+I / Cmd+I)"><IconButton size="small" onClick={() => formatText('italic')}><FormatItalic /></IconButton></Tooltip>
                  {/* <Tooltip title="Sublinhado (Ctrl+U / Cmd+U)"><IconButton size="small" onClick={() => formatText('underline')}><FormatUnderlined /></IconButton></Tooltip> */}
                  <Divider orientation="vertical" flexItem sx={{ mx:0.5 }}/>
                  <Tooltip title="Título Principal (H1)"><IconButton size="small" onClick={() => formatText('h1')}><TitleIcon /></IconButton></Tooltip>
                  <Tooltip title="Subtítulo (H2)"><IconButton size="small" onClick={() => formatText('h2')}><Subject /></IconButton></Tooltip>
                  {/* <Tooltip title="Sub-Subtítulo (H3)"><IconButton size="small" onClick={() => formatText('h3')}><TextFieldsIcon /></IconButton></Tooltip> */}
                  <Divider orientation="vertical" flexItem sx={{ mx:0.5 }}/>
                  <Tooltip title="Lista Não Ordenada"><IconButton size="small" onClick={() => formatText('ul')}><FormatListBulleted /></IconButton></Tooltip>
                  <Tooltip title="Lista Ordenada"><IconButton size="small" onClick={() => formatText('ol')}><FormatListNumbered /></IconButton></Tooltip>
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
                  <Box sx={{ 
                    mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1,
                    borderLeft: `4px solid ${currentDisplayStatus.color === 'default' ? 'grey.500' : currentDisplayStatus.color + '.main'}` 
                  }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Descrição</Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{description}</Typography>
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
        {(isEditing || !isNewDocument) && ( // Mostrar painel lateral se estiver editando OU se não for novo documento
          <Grid item xs={12} md={4}>
            {!isNewDocument && document && ( // Mostrar informações do documento apenas se não for novo
              <Card sx={{ mb: 2 }} variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1, color: 'primary.main' }} /> Informações
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="body2" gutterBottom>
                    <strong>Orientador:</strong> {document.advisorName || (selectedAdvisor ? selectedAdvisor.name : 'Não definido')}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Estudante:</strong> {document.studentName || currentUser.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Criado em:</strong> {document.createdAt ? 
                      new Date(document.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Última Atualização:</strong> {document.updatedAt ? 
                      new Date(document.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            )}
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
                          primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 500, mt:0.5} }}
                          secondaryTypographyProps={{ variant: 'caption'}}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
            {!isNewDocument && currentVersion && ( // Mostrar comentários apenas se houver versão atual e não for novo doc
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
                    fullWidth sx={{ mb: comments.length > 0 ? 2 : 0 }}
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
                            borderRadius:1, 
                            mb:1, 
                            p:1.5 
                          }}
                        >
                           <Box sx={{display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5}}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{comment.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'})}
                            </Typography>
                           </Box>
                          <Typography variant="body2" sx={{wordBreak: 'break-word'}}>{comment.content}</Typography>
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
            error={!commitMessage.trim() && saveDialog} // Mostrar erro se vazio no diálogo
            helperText={!commitMessage.trim() && saveDialog ? "A mensagem da versão é necessária." : ""}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Uma nova versão do seu documento será criada. Isso permite que você acompanhe o histórico de alterações.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSaveDialog(false)} disabled={saving}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving || !commitMessage.trim() || (isNewDocument && isStudent && !selectedAdvisor) }
          >
            {saving ? <CircularProgress size={24} /> : (isNewDocument ? 'Criar e Salvar' : 'Salvar Versão')}
          </Button>
        </DialogActions>
      </Dialog>
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