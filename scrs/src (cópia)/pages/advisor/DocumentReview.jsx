// Arquivo: scrs/src (cópia)/pages/advisor/DocumentReview.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Toolbar,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Menu, // Adicionado
  ListItemIcon // Adicionado
} from '@mui/material';
import {
  ArrowBack,
  Comment as CommentIcon,
  AddComment,
  History,
  CheckCircleOutline,
  RateReviewOutlined,
  InfoOutlined,
  CompareArrows,
  Person,
  Schedule,
  Edit,
  MoreVert as MoreVertIcon, // Adicionado
  DeleteOutline as DeleteIcon, // Adicionado
  CheckCircle as ResolveIcon // Adicionado
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';
import { documentService, versionService, commentService } from "../../services";
import { ConfirmDialog, StatusChip as UtilityStatusChip } from '../../utils'; // Supondo que ConfirmDialog e StatusChip existam em utils

// Função para renderizar conteúdo Markdown (pode ser movida para um utilitário)
const renderFormattedContentPreview = (text) => {
  if (text === null || text === undefined || text.trim() === '') {
    return <Typography color="textSecondary" sx={{p: 2, fontStyle: 'italic'}}>Conteúdo da versão não disponível ou vazio.</Typography>;
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

  if (!html.match(/^<(h[1-3]|ul|ol)/)) {
    html = `<p style="margin-bottom: 1em;">${html}`;
  }
  if (html.endsWith('<br>') || !html.endsWith('</p>')) {
       html += '</p>';
  }
  html = html.replace(/<\/ul>\s*<ul.*?>/g, '');
  html = html.replace(/<\/ol>\s*<ol.*?>/g, '');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const getStatusInfo = (status) => {
    const statusMap = {
      'DRAFT': { label: 'Rascunho', color: 'default', icon: <Edit /> },
      'SUBMITTED': { label: 'Submetido', color: 'primary', icon: <Person /> }, // Icone alterado para representar submissão pelo aluno
      'REVISION': { label: 'Em Revisão', color: 'warning', icon: <RateReviewOutlined /> },
      'APPROVED': { label: 'Aprovado', color: 'success', icon: <CheckCircleOutline /> },
      'FINALIZED': { label: 'Finalizado', color: 'info', icon: <CheckCircleOutline /> } // Pode ser outro ícone se desejar
    };
    return statusMap[status] || { label: status || 'Desconhecido', color: 'default', icon: <InfoOutlined /> };
};


const DocumentReview = () => {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedVersionContent, setSelectedVersionContent] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); 
  const [actionReason, setActionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Estados para menu de ações do comentário
  const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState(null);
  const [selectedCommentForAction, setSelectedCommentForAction] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState(() => {});
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
  const [confirmDialogMessage, setConfirmDialogMessage] = useState('');


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docData = await documentService.getDocument(documentId);
      setDocument(docData);

      const versionsData = await versionService.getVersionsByDocument(documentId);
      setVersions(versionsData || []);

      if (versionsData && versionsData.length > 0) {
        const latestVersion = versionsData[0];
        setSelectedVersionId(latestVersion.id.toString());
        setSelectedVersionContent(latestVersion.content || '');
        const commentsData = await commentService.getCommentsByVersion(latestVersion.id);
        setComments(commentsData || []);
      } else {
        setSelectedVersionContent('Nenhuma versão encontrada para este documento.');
        setComments([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da revisão:', err);
      setError('Não foi possível carregar os dados do documento para revisão.');
      toast.error('Erro ao carregar dados do documento.');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVersionChange = async (event) => {
    const versionId = event.target.value;
    setSelectedVersionId(versionId);
    setLoading(true); 
    try {
      const version = versions.find(v => v.id.toString() === versionId);
      if (version) {
        setSelectedVersionContent(version.content || '');
        const commentsData = await commentService.getCommentsByVersion(versionId);
        setComments(commentsData || []);
      }
    } catch (err) {
      console.error('Erro ao carregar versão ou comentários:', err);
      toast.error('Erro ao carregar detalhes da versão.');
      setSelectedVersionContent('Erro ao carregar conteúdo da versão.');
      setComments([]);
    } finally {
        setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setCommentError('O comentário não pode estar vazio.');
      return;
    }
    if (!selectedVersionId) {
      toast.error('Nenhuma versão selecionada para adicionar o comentário.');
      return;
    }
    setCommentError('');
    setSubmittingComment(true);
    try {
      const commentData = {
        versionId: selectedVersionId,
        content: newComment.trim(),
      };
      const createdComment = await commentService.createComment(commentData);
      setComments(prevComments => [createdComment, ...prevComments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setNewComment('');
      toast.success('Comentário adicionado com sucesso!');
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      toast.error(err.response?.data?.message || 'Erro ao adicionar comentário.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const openActionModal = (type) => {
    setActionType(type);
    setActionReason('');
    setActionModalOpen(true);
  };

  const handlePerformAction = async () => {
    if (actionType === 'request_revision' && !actionReason.trim()) {
        toast.error('A justificativa é obrigatória para solicitar revisão.');
        return;
    }
    setSubmittingAction(true);
    try {
        let newStatus = '';
        if (actionType === 'approve') newStatus = 'APPROVED';
        else if (actionType === 'request_revision') newStatus = 'REVISION';

        if (newStatus) {
            const updatedDocument = await documentService.changeStatus(documentId, newStatus, actionReason);
            setDocument(updatedDocument); 
            toast.success(`Documento ${newStatus === 'APPROVED' ? 'aprovado' : 'enviado para revisão'} com sucesso!`);
            fetchData();
        }
        setActionModalOpen(false);
        setActionReason('');
    } catch (err) {
        console.error(`Erro na ação ${actionType}:`, err);
        toast.error(err.response?.data?.message || `Erro ao ${actionType === 'approve' ? 'aprovar' : 'solicitar revisão'} o documento.`);
    } finally {
        setSubmittingAction(false);
    }
  };

  const handleOpenCommentMenu = (event, comment) => {
    setCommentMenuAnchorEl(event.currentTarget);
    setSelectedCommentForAction(comment);
  };

  const handleCloseCommentMenu = () => {
    setCommentMenuAnchorEl(null);
    setSelectedCommentForAction(null);
  };

  const handleResolveComment = async () => {
    if (!selectedCommentForAction) return;
    setConfirmDialogOpen(false);
    try {
      const updatedComment = await commentService.resolveComment(selectedCommentForAction.id);
      setComments(prevComments => 
        prevComments.map(c => c.id === selectedCommentForAction.id ? updatedComment : c)
      );
      toast.success('Comentário marcado como resolvido!');
    } catch (err) {
      console.error('Erro ao resolver comentário:', err);
      toast.error(err.response?.data?.message || 'Erro ao resolver comentário.');
    }
    handleCloseCommentMenu();
  };

  const handleDeleteComment = async () => {
    if (!selectedCommentForAction) return;
    setConfirmDialogOpen(false);
    try {
      await commentService.delete(selectedCommentForAction.id); // Utilizando commentService.delete
      setComments(prevComments => 
        prevComments.filter(c => c.id !== selectedCommentForAction.id)
      );
      toast.success('Comentário excluído com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir comentário:', err);
      toast.error(err.response?.data?.message || 'Erro ao excluir comentário.');
    }
    handleCloseCommentMenu();
  };

  const openConfirmDialog = (action, title, message) => {
    setConfirmDialogAction(() => action); // Usa callback para garantir a função correta
    setConfirmDialogTitle(title);
    setConfirmDialogMessage(message);
    setConfirmDialogOpen(true);
    handleCloseCommentMenu();
  };


  if (loading && !document) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando dados para revisão...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
          <Button onClick={fetchData} sx={{ ml: 2 }}>Tentar Novamente</Button>
        </Alert>
      </Container>
    );
  }

  if (!document) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>Documento não encontrado.</Alert>
        <Button startIcon={<ArrowBack/>} onClick={() => navigate('/advisor/documents')} sx={{mt:2}}>
            Voltar para Orientações
        </Button>
      </Container>
    );
  }

  const currentDocStatusInfo = getStatusInfo(document.status);
  const selectedVersionDetails = versions.find(v => v.id.toString() === selectedVersionId);

  return (
    <Container maxWidth="xl">
      <Toolbar disableGutters sx={{ my: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/advisor/documents')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1, whiteSpace: 'normal', wordBreak: 'break-word', mr:1 }}>
          Revisão: {document.title}
        </Typography>
        <UtilityStatusChip status={document.status} />
      </Toolbar>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: {xs: 1, sm: 2, md:3}, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6">Conteúdo da Versão</Typography>
              {versions.length > 0 && (
                <FormControl variant="outlined" size="small" sx={{ minWidth: 250, maxWidth: '100%' }}>
                  <InputLabel id="select-version-label">Selecionar Versão</InputLabel>
                  <Select
                    labelId="select-version-label"
                    value={selectedVersionId}
                    onChange={handleVersionChange}
                    label="Selecionar Versão"
                  >
                    {versions.map(v => (
                      <MenuItem key={v.id} value={v.id.toString()}>
                        v{v.versionNumber} - {v.commitMessage || "Sem mensagem"} ({format(new Date(v.createdAt), 'dd/MM/yy HH:mm')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            {loading && !selectedVersionContent && selectedVersionId ? <Box sx={{display: 'flex', justifyContent:'center', p:3}}><CircularProgress /></Box> :
             <Box sx={{ maxHeight: '60vh', overflowY: 'auto', p:1, border: '1px solid #eee', borderRadius: 1, background: '#f9f9f9', minHeight:'300px' }}>
                {renderFormattedContentPreview(selectedVersionContent)}
             </Box>
            }
          </Paper>

          <Paper elevation={2} sx={{ p: {xs: 1, sm: 2, md:3} }}>
            <Typography variant="h6" gutterBottom>Ações do Orientador</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutline />}
                onClick={() => openActionModal('approve')}
                disabled={document.status === 'APPROVED' || document.status === 'FINALIZED' || submittingAction || loading}
              >
                Aprovar Documento
              </Button>
              <Button
                variant="contained"
                color="warning"
                startIcon={<RateReviewOutlined />}
                onClick={() => openActionModal('request_revision')}
                disabled={document.status === 'FINALIZED' || submittingAction || loading}
              >
                Solicitar Revisão
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center'}}>
                <InfoOutlined sx={{mr:1}} color="primary"/> Informações do Documento
            </Typography>
            <Divider sx={{ mb: 1 }}/>
            <Typography variant="body2"><strong>Estudante:</strong> {document.studentName}</Typography>
            <Typography variant="body2"><strong>Orientador:</strong> {document.advisorName}</Typography>
            <Typography variant="body2" sx={{display:'flex', alignItems:'center'}}><strong>Status Atual:</strong> <UtilityStatusChip status={document.status} size="small" sx={{ml:0.5}}/></Typography>
            <Typography variant="body2"><strong>Criado em:</strong> {format(new Date(document.createdAt), 'dd/MM/yyyy HH:mm')}</Typography>
            <Typography variant="body2"><strong>Última atualização:</strong> {format(new Date(document.updatedAt), 'dd/MM/yyyy HH:mm')}</Typography>
            {selectedVersionDetails && (
                <>
                <Divider sx={{ my: 1 }}/>
                <Typography variant="subtitle2" sx={{mt:1}}>Versão selecionada (v{selectedVersionDetails.versionNumber}):</Typography>
                <Typography variant="body2"><strong>Commit:</strong> {selectedVersionDetails.commitMessage || "N/A"}</Typography>
                <Typography variant="body2"><strong>Criada por:</strong> {selectedVersionDetails.createdByName}</Typography>
                <Typography variant="body2"><strong>Data:</strong> {format(new Date(selectedVersionDetails.createdAt), 'dd/MM/yyyy HH:mm')}</Typography>
                </>
            )}
            <Button
                component={RouterLink}
                to={`/student/documents/${documentId}/compare`} // Idealmente, esta rota seria parametrizada para o orientador também
                startIcon={<CompareArrows />}
                size="small"
                sx={{ mt: 2 }}
                fullWidth
                variant="outlined"
            >
                Comparar Versões
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center'}}>
                <CommentIcon sx={{mr:1}} color="primary"/> Comentários da Versão (v{selectedVersionDetails?.versionNumber || 'N/A'})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                label="Adicionar novo comentário"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                error={!!commentError}
                helperText={commentError}
                disabled={submittingComment || !selectedVersionId || loading}
              />
              <Button
                variant="contained"
                startIcon={<AddComment />}
                onClick={handleAddComment}
                disabled={submittingComment || !newComment.trim() || !selectedVersionId || loading}
                sx={{ mt: 1 }}
              >
                {submittingComment ? <CircularProgress size={24}/> : "Enviar Comentário"}
              </Button>
            </Box>
            <List sx={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {loading && comments.length === 0 && selectedVersionId && <Box sx={{display: 'flex', justifyContent:'center'}}><CircularProgress size={24}/></Box>}
              {!loading && comments.length === 0 && <Typography variant="body2" color="textSecondary">Nenhum comentário para esta versão.</Typography>}
              {comments.map(comment => (
                <React.Fragment key={comment.id}>
                  <ListItem 
                    alignItems="flex-start"
                    secondaryAction={
                      currentUser?.id === comment.userId || document?.advisor?.id === currentUser?.id ? ( // Permite orientador e autor deletar/resolver
                        <IconButton 
                            edge="end" 
                            aria-label="actions"
                            onClick={(e) => handleOpenCommentMenu(e, comment)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      ) : null
                    }
                  >
                    <ListItemAvatar>
                      <Avatar>{comment.userName ? comment.userName.charAt(0).toUpperCase() : 'U'}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="subtitle2" component="span">{comment.userName}</Typography>}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textPrimary" sx={{wordBreak: 'break-word'}}>
                            {comment.content}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="textSecondary">
                            {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}
                          </Typography>
                          {comment.resolved && <Chip size="small" label="Resolvido" sx={{ml:1}} color="success" variant="outlined"/>}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Menu de Ações do Comentário */}
      <Menu
        anchorEl={commentMenuAnchorEl}
        open={Boolean(commentMenuAnchorEl)}
        onClose={handleCloseCommentMenu}
      >
        {!selectedCommentForAction?.resolved && (
          <MenuItem onClick={() => openConfirmDialog(handleResolveComment, "Resolver Comentário", "Tem certeza que deseja marcar este comentário como resolvido?")}>
            <ListItemIcon><ResolveIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Resolver</ListItemText>
          </MenuItem>
        )}
        {/* Adicionar "Marcar como Não Resolvido" aqui se o backend suportar */}
        <MenuItem onClick={() => openConfirmDialog(handleDeleteComment, "Excluir Comentário", "Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.")}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error' }}>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      {/* Diálogo de Confirmação para Ações de Comentário */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDialogAction}
        title={confirmDialogTitle}
        message={confirmDialogMessage}
      />


      <Dialog open={actionModalOpen} onClose={() => setActionModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
            {actionType === 'approve' && 'Aprovar Documento'}
            {actionType === 'request_revision' && 'Solicitar Revisão do Documento'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'approve' && `Você tem certeza que deseja aprovar o documento "${document?.title}"? O aluno será notificado.`}
            {actionType === 'request_revision' && `Por favor, forneça uma justificativa ou observações para a revisão do documento "${document?.title}". O aluno será notificado.`}
          </DialogContentText>
          {actionType === 'request_revision' && (
            <TextField
              autoFocus
              margin="dense"
              id="reason"
              label="Justificativa / Observações para Revisão"
              type="text"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              sx={{mt: 2}}
              required
            />
          )}
        </DialogContent>
        <DialogActions sx={{p:2}}>
          <Button onClick={() => setActionModalOpen(false)} disabled={submittingAction}>Cancelar</Button>
          <Button
            onClick={handlePerformAction}
            color={actionType === 'approve' ? 'success' : 'warning'}
            variant="contained"
            disabled={submittingAction || (actionType === 'request_revision' && !actionReason.trim())}
          >
            {submittingAction ? <CircularProgress size={24} color="inherit"/> : (actionType === 'approve' ? 'Confirmar Aprovação' : 'Enviar para Revisão')}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default DocumentReview;