// DocumentEditor.js - EDITOR UNIFICADO E OTIMIZADO
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, TextField, Paper, Grid, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Tooltip,
  IconButton, Chip, Avatar, List, ListItem, ListItemText, ListItemAvatar,
  Menu, MenuItem, ListItemIcon, Fab, Snackbar
} from '@mui/material';
import {
  Save, Edit, Preview, Share, People, Add, Delete, MoreVert, 
  Download, Upload, Visibility, Edit as EditIcon, Close
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { documentService, versionService, commentService, collaboratorService } from '../services';
import { PageHeader, StatusChip, LoadingButton, ConfirmDialog, notify, handleAsyncAction } from '../utils';

// ============================================================================
// HOOKS PERSONALIZADOS
// ============================================================================

const useDocument = (id) => {
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [docData, versionsData] = await Promise.all([
        documentService.get(id),
        versionService.getVersionsByDocument(id)
      ]);
      
      setDocument(docData);
      setVersions(versionsData || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar documento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadDocument();
  }, [id]);

  return { document, versions, loading, error, reload: loadDocument };
};

const useCollaborators = (documentId, enabled = false) => {
  const [collaborators, setCollaborators] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const loadCollaborators = async () => {
    if (!enabled || !documentId) return;
    
    try {
      setLoading(true);
      const [collabData, permsData] = await Promise.all([
        collaboratorService.getDocumentCollaborators(documentId),
        collaboratorService.getCurrentUserPermissions(documentId)
      ]);
      
      setCollaborators(collabData || []);
      setPermissions(permsData || {});
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, [documentId, enabled]);

  return { collaborators, permissions, loading, reload: loadCollaborators };
};

const useAutoSave = (content, onSave, delay = 30000) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeout = useRef(null);
  const lastContent = useRef(content);

  const save = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      await onSave(content);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      notify.success('Documento salvo automaticamente');
    } catch (err) {
      notify.error('Erro no salvamento automático');
    }
  };

  useEffect(() => {
    if (content !== lastContent.current) {
      lastContent.current = content;
      setHasUnsavedChanges(true);
      
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(save, delay);
    }

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [content, delay]);

  return { lastSaved, hasUnsavedChanges, forceSave: save };
};

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const CollaboratorsList = ({ collaborators, permissions, onAdd, onRemove, onUpdateRole }) => {
  const [addDialog, setAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const searchUsers = async (query) => {
    if (!query.trim()) return;
    try {
      const results = await collaboratorService.searchUsers(query);
      setSearchResults(results || []);
    } catch (err) {
      notify.error('Erro ao buscar usuários');
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUser) return;
    
    await handleAsyncAction(
      () => onAdd(selectedUser.id, 'VIEWER'),
      {
        successMessage: 'Colaborador adicionado com sucesso!',
        onSuccess: () => {
          setAddDialog(false);
          setSelectedUser(null);
          setSearchQuery('');
        }
      }
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Colaboradores ({collaborators.length})</Typography>
        {permissions.canManage && (
          <Button startIcon={<Add />} onClick={() => setAddDialog(true)}>
            Adicionar
          </Button>
        )}
      </Box>

      <List>
        {collaborators.map((collab) => (
          <ListItem
            key={collab.id}
            secondaryAction={
              permissions.canManage && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={collab.role} 
                    size="small" 
                    onClick={() => onUpdateRole(collab.id, collab.role === 'VIEWER' ? 'EDITOR' : 'VIEWER')}
                  />
                  <IconButton edge="end" onClick={() => onRemove(collab.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              )
            }
          >
            <ListItemAvatar>
              <Avatar>{collab.user?.name?.charAt(0)?.toUpperCase()}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={collab.user?.name || 'Usuário Desconhecido'}
              secondary={collab.user?.email}
            />
          </ListItem>
        ))}
      </List>

      {/* Dialog para adicionar colaborador */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Colaborador</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Buscar por nome ou email"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            sx={{ mb: 2 }}
          />
          
          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                button
                selected={selectedUser?.id === user.id}
                onClick={() => setSelectedUser(user)}
              >
                <ListItemAvatar>
                  <Avatar>{user.name?.charAt(0)?.toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.name} secondary={user.email} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddCollaborator} disabled={!selectedUser} variant="contained">
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DocumentInfo = ({ document, versions, onStatusChange }) => {
  const [statusDialog, setStatusDialog] = useState(false);
  const [reason, setReason] = useState('');

  const handleStatusChange = async (newStatus) => {
    await handleAsyncAction(
      () => onStatusChange(newStatus, reason),
      {
        successMessage: 'Status alterado com sucesso!',
        onSuccess: () => {
          setStatusDialog(false);
          setReason('');
        }
      }
    );
  };

  const canChangeStatus = document?.canEdit && document.status !== 'FINALIZED';

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Informações do Documento</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Status</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <StatusChip status={document?.status} />
            {canChangeStatus && (
              <IconButton size="small" onClick={() => setStatusDialog(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Versões</Typography>
          <Typography variant="body1">{versions.length}</Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Orientador</Typography>
          <Typography variant="body1">{document?.advisorName || 'Não definido'}</Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">Estudante</Typography>
          <Typography variant="body1">{document?.studentName || 'Não definido'}</Typography>
        </Grid>
      </Grid>

      {/* Dialog para alterar status */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alterar Status</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancelar</Button>
          <Button onClick={() => handleStatusChange('REVISION')} color="warning">
            Solicitar Revisão
          </Button>
          <Button onClick={() => handleStatusChange('APPROVED')} color="success" variant="contained">
            Aprovar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const DocumentEditor = ({ 
  mode = 'edit', // 'edit', 'view', 'collaborate'
  enableCollaboration = false,
  enableVersioning = true,
  enableComments = false 
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  
  // Estados principais
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(mode === 'view');
  
  // Hooks personalizados
  const { document, versions, loading, error, reload } = useDocument(id);
  const { collaborators, permissions, reload: reloadCollaborators } = useCollaborators(id, enableCollaboration);
  
  // Auto-save
  const { lastSaved, hasUnsavedChanges, forceSave } = useAutoSave(
    content,
    async (newContent) => {
      if (document && permissions.canWrite !== false) {
        await versionService.create({
          documentId: document.id,
          content: newContent,
          title: title || document.title,
          description: description || document.description
        });
        reload();
      }
    }
  );

  // Inicialização
  useEffect(() => {
    if (document) {
      setTitle(document.title || '');
      setDescription(document.description || '');
      
      // Pegar conteúdo da versão mais recente
      if (versions.length > 0) {
        setContent(versions[0].content || '');
      }
    }
  }, [document, versions]);

  // Verificar permissões
  const canEdit = mode === 'edit' && (document?.canEdit || permissions.canWrite !== false);
  const canView = mode === 'view' || !canEdit;
  const isCollaborative = enableCollaboration && document?.id;

  // Handlers
  const handleSave = async () => {
    setSaving(true);
    try {
      await forceSave();
      notify.success('Documento salvo com sucesso!');
    } catch (err) {
      notify.error('Erro ao salvar documento');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'documento'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = async (newStatus, reason = '') => {
    await documentService.changeStatus(document.id, newStatus, reason);
    reload();
  };

  const handleAddCollaborator = async (userId, role) => {
    await collaboratorService.addCollaborator(document.id, { userId, role });
    reloadCollaborators();
  };

  const handleRemoveCollaborator = async (collabId) => {
    await collaboratorService.removeCollaborator(document.id, collabId);
    reloadCollaborators();
  };

  const handleUpdateRole = async (collabId, newRole) => {
    await collaboratorService.updateRole(document.id, collabId, { role: newRole });
    reloadCollaborators();
  };

  if (loading) {
    return (
      <Container>
        <Typography>Carregando documento...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Ações do header
  const headerActions = [
    ...(canEdit ? [
      { label: 'Salvar', icon: <Save />, onClick: handleSave, disabled: saving || !hasUnsavedChanges },
      { label: previewMode ? 'Editar' : 'Visualizar', icon: previewMode ? <Edit /> : <Preview />, onClick: () => setPreviewMode(!previewMode) }
    ] : []),
    { label: 'Exportar', icon: <Download />, onClick: handleExport },
    ...(isCollaborative ? [
      { label: 'Compartilhar', icon: <Share />, onClick: () => setShareDialog(true) }
    ] : [])
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <PageHeader
        title={title || 'Documento sem título'}
        subtitle={description}
        backButton
        actions={headerActions}
        breadcrumbs={[
          { label: 'Documentos', href: '/documents' },
          { label: title || 'Documento' }
        ]}
      />

      {/* Status bar */}
      {hasUnsavedChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Existem alterações não salvas. 
          {lastSaved && ` Último salvamento: ${lastSaved.toLocaleTimeString()}`}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Editor/Visualizador principal */}
        <Grid item xs={12} md={isCollaborative ? 8 : 12}>
          <Paper sx={{ p: 3, minHeight: '70vh' }}>
            {previewMode || canView ? (
              <Box>
                <Typography variant="h4" gutterBottom>{title}</Typography>
                {description && (
                  <Typography variant="subtitle1" color="text.secondary" paragraph>
                    {description}
                  </Typography>
                )}
                <Divider sx={{ my: 2 }} />
                <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />
              </Box>
            ) : (
              <Box>
                <TextField
                  fullWidth
                  label="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={!canEdit}
                />
                
                <TextField
                  fullWidth
                  label="Descrição"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={!canEdit}
                />
                
                <TextField
                  fullWidth
                  multiline
                  label="Conteúdo"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={20}
                  disabled={!canEdit}
                  placeholder="Digite o conteúdo do documento aqui..."
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar com informações e colaboradores */}
        {isCollaborative && (
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <DocumentInfo 
                document={document} 
                versions={versions} 
                onStatusChange={handleStatusChange} 
              />
              
              <Paper sx={{ p: 2 }}>
                <CollaboratorsList
                  collaborators={collaborators}
                  permissions={permissions}
                  onAdd={handleAddCollaborator}
                  onRemove={handleRemoveCollaborator}
                  onUpdateRole={handleUpdateRole}
                />
              </Paper>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* FAB para salvar rápido */}
      {canEdit && hasUnsavedChanges && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleSave}
          disabled={saving}
        >
          <Save />
        </Fab>
      )}
    </Container>
  );
};

export default DocumentEditor;