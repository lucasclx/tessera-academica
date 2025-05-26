// Arquivo: scrs/src (cópia)/components/collaborators/CollaboratorManagement.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Card, CardHeader, CardContent, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
  ListItemAvatar, ListItemSecondaryAction, Avatar, IconButton,
  Chip, Autocomplete, Alert, Divider, Grid, Tooltip, CircularProgress,
  FormHelperText // Adicionado
} from '@mui/material';
import {
  PersonAdd, Delete, Edit as EditIcon, Group, SupervisorAccount, School, Person,
  Check, Close, Warning, SettingsApplications as SettingsIcon, Visibility // Adicionado Visibility
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { collaboratorService } from '../../services/collaboratorService'; // Importando de seu local específico
import { AuthContext } from '../../context/AuthContext';
import { ConfirmDialog } from '../../utils';

// Mapeamentos de papeis e permissões para exibição e seleção
const COLLABORATOR_ROLES_MAP = {
  PRIMARY_STUDENT: { label: 'Estudante Principal', icon: School, color: 'primary', description: 'Responsável principal pelo trabalho', type: 'STUDENT' },
  SECONDARY_STUDENT: { label: 'Estudante Colaborador', icon: Person, color: 'info', description: 'Estudante que colabora no trabalho', type: 'STUDENT' },
  CO_STUDENT: { label: 'Coautor Estudante', icon: Person, color: 'info', description: 'Estudante com participação significativa', type: 'STUDENT' },
  
  PRIMARY_ADVISOR: { label: 'Orientador Principal', icon: SupervisorAccount, color: 'secondary', description: 'Orientador responsável', type: 'ADVISOR' },
  SECONDARY_ADVISOR: { label: 'Orientador Colaborador', icon: SupervisorAccount, color: 'warning', description: 'Orientador que auxilia', type: 'ADVISOR' },
  CO_ADVISOR: { label: 'Coorientador', icon: SupervisorAccount, color: 'success', description: 'Coorientador do trabalho', type: 'ADVISOR' },
  EXTERNAL_ADVISOR: { label: 'Orientador Externo', icon: SupervisorAccount, color: 'default', description: 'Orientador de outra instituição', type: 'ADVISOR'},

  OBSERVER: { label: 'Observador', icon: Visibility, color: 'default', description: 'Apenas visualização', type: 'OTHER' },
  REVIEWER: { label: 'Revisor', icon: EditIcon, color: 'default', description: 'Pode revisar e comentar', type: 'OTHER'},
  EXAMINER: { label: 'Banca Examinadora', icon: Group, color: 'default', description: 'Membro da banca', type: 'OTHER'},
};

const COLLABORATOR_PERMISSIONS_MAP = {
  READ_ONLY: { label: 'Apenas Leitura', description: 'Pode visualizar o documento e comentários', color: 'default' },
  READ_COMMENT: {label: 'Leitura e Comentários', description: 'Pode visualizar e adicionar comentários', color: 'info'},
  READ_WRITE: { label: 'Leitura e Escrita', description: 'Pode editar o conteúdo do documento', color: 'primary' },
  FULL_ACCESS: { label: 'Acesso Completo', description: 'Pode gerenciar colaboradores e configurações do documento', color: 'secondary' }
};


const CollaboratorManagement = ({ documentId, currentUser, canManage, onCollaboratorsUpdate }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  
  const [selectedCollaboratorToEdit, setSelectedCollaboratorToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({ role: '', permission: '' });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchInput, setUserSearchInput] = useState('');

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  const [addFormData, setAddFormData] = useState({
    selectedUser: null,
    role: 'SECONDARY_STUDENT',
    permission: 'READ_WRITE',
    message: ''
  });

  useEffect(() => {
    if (documentId) {
      loadCollaborators();
    } else {
      setLoading(false);
      setCollaborators([]);
    }
  }, [documentId]);

  const loadCollaborators = async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const data = await collaboratorService.getDocumentCollaborators(documentId);
      setCollaborators(data || []);
      if(onCollaboratorsUpdate) onCollaboratorsUpdate(data || []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  };

  const searchAvailableUsers = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) {
        setAvailableUsers([]);
        return;
    }
    setLoadingUsers(true);
    try {
        const users = await collaboratorService.searchUsers(inputValue, null, documentId);
        setAvailableUsers(users || []);
    } catch (error) {
        console.error('Erro ao buscar usuários disponíveis:', error);
        setAvailableUsers([]);
        toast.error('Falha ao buscar usuários.');
    } finally {
        setLoadingUsers(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!canManage) {
        toast.error("Você não tem permissão para adicionar colaboradores.");
        return;
    }
    try {
      if (!addFormData.selectedUser || !addFormData.role || !addFormData.permission) {
        toast.error('Selecione um usuário e defina papel e permissão.');
        return;
      }

      const collaboratorData = {
        userEmail: addFormData.selectedUser.email,
        role: addFormData.role,
        permission: addFormData.permission,
        message: addFormData.message
      };

      await collaboratorService.addCollaborator(documentId, collaboratorData);
      toast.success('Colaborador adicionado com sucesso!');
      
      setAddDialog(false);
      setAddFormData({ selectedUser: null, role: 'SECONDARY_STUDENT', permission: 'READ_WRITE', message: '' });
      setUserSearchInput('');
      setAvailableUsers([]);
      loadCollaborators();
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      toast.error(error.response?.data?.message || 'Erro ao adicionar colaborador');
    }
  };

  const confirmRemoveCollaborator = (collaborator) => {
    setItemToRemove(collaborator);
    setConfirmDialogOpen(true);
  };

  const handleRemoveCollaborator = async () => {
    if (!itemToRemove || !canManage) {
        toast.error("Você não tem permissão para remover colaboradores ou nenhum colaborador selecionado.");
        setConfirmDialogOpen(false);
        return;
    }
    try {
      await collaboratorService.removeCollaborator(documentId, itemToRemove.id);
      toast.success('Colaborador removido com sucesso!');
      loadCollaborators();
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      toast.error(error.response?.data?.message || 'Erro ao remover colaborador');
    } finally {
        setConfirmDialogOpen(false);
        setItemToRemove(null);
    }
  };

  const handleOpenEditDialog = (collaborator) => {
    setSelectedCollaboratorToEdit(collaborator);
    setEditFormData({ role: collaborator.role, permission: collaborator.permission });
    setEditDialog(true);
  };

  const handleUpdateCollaborator = async () => {
    if (!selectedCollaboratorToEdit || !editFormData.role || !editFormData.permission || !canManage) {
        toast.error("Dados inválidos para atualização ou permissão negada.");
        return;
    }
    try {
        let updated = false;
        if (editFormData.role !== selectedCollaboratorToEdit.role) {
            await collaboratorService.updateRole(documentId, selectedCollaboratorToEdit.id, editFormData.role);
            updated = true;
        }
        if (editFormData.permission !== selectedCollaboratorToEdit.permission) {
            await collaboratorService.updatePermissions(documentId, selectedCollaboratorToEdit.id, editFormData.permission);
            updated = true;
        }

        if (updated) {
            toast.success('Colaborador atualizado com sucesso!');
        } else {
            toast.info('Nenhuma alteração detectada.');
        }
        setEditDialog(false);
        setSelectedCollaboratorToEdit(null);
        loadCollaborators();
    } catch (error) {
        console.error('Erro ao atualizar colaborador:', error);
        toast.error(error.response?.data?.message || 'Erro ao atualizar colaborador');
    }
  };

  const getRoleInfo = (roleKey) => COLLABORATOR_ROLES_MAP[roleKey] || { label: roleKey, icon: Person, color: 'default', type: 'OTHER' };
  const getPermissionInfo = (permissionKey) => COLLABORATOR_PERMISSIONS_MAP[permissionKey] || { label: permissionKey, description: '', color: 'default' };

  const canEditThisCollaborator = (collaborator) => {
    if (!canManage) return false;
    if (collaborator.role === 'PRIMARY_STUDENT' || collaborator.role === 'PRIMARY_ADVISOR') {
        const isCurrentUserTheCollaborator = currentUser?.id === collaborator.userId;
        if (isCurrentUserTheCollaborator) return false; 

        const sameTypePrincipals = collaborators.filter(c => c.role === collaborator.role && c.active);
        if (sameTypePrincipals.length <= 1) return false;
    }
    return true;
  };
  
  const canRemoveThisCollaborator = (collaborator) => {
    if (!canManage) return false;
    if (currentUser?.id === collaborator.userId) return false; // Não pode remover a si mesmo
    if (collaborator.role === 'PRIMARY_STUDENT' || collaborator.role === 'PRIMARY_ADVISOR') {
        const sameTypePrincipals = collaborators.filter(c => c.role === collaborator.role && c.active);
        return sameTypePrincipals.length > 1;
    }
    return true;
  };

  const groupedCollaborators = collaborators.reduce((groups, collaborator) => {
    const roleInfo = getRoleInfo(collaborator.role);
    const groupKey = roleInfo.type;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(collaborator);
    return groups;
  }, {});

  if (!documentId) {
    return (
      <Card>
        <CardHeader title="Colaboradores" />
        <CardContent>
          <Alert severity="info">Salve o documento primeiro para gerenciar colaboradores.</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Group color="primary" />
            <Typography variant="h6">
              Equipe Colaborativa ({collaborators.length})
            </Typography>
          </Box>
        }
        action={
          canManage && documentId && (
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={() => {
                setAddFormData({ selectedUser: null, role: 'SECONDARY_STUDENT', permission: 'READ_WRITE', message: '' });
                setUserSearchInput('');
                setAvailableUsers([]);
                setAddDialog(true);
              }}
              size="small"
            >
              Adicionar
            </Button>
          )
        }
      />
      
      <CardContent>
        {loading ? (
          <Box sx={{display: 'flex', justifyContent: 'center', p:3}}><CircularProgress /></Box>
        ) : (
          <Box>
            {Object.entries(groupedCollaborators).map(([groupKey, groupCollaborators]) => {
                const groupTitle = groupKey === 'STUDENT' ? 'Estudantes' : groupKey === 'ADVISOR' ? 'Orientadores' : 'Outros';
                const GroupIcon = groupKey === 'STUDENT' ? School : groupKey === 'ADVISOR' ? SupervisorAccount : SettingsIcon;
                const iconColor = groupKey === 'STUDENT' ? 'primary' : groupKey === 'ADVISOR' ? 'secondary' : 'action';

                return (
                  <Box key={groupKey} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #eee', pb: 1, mb:1 }}>
                      <GroupIcon color={iconColor} />
                      {groupTitle} ({groupCollaborators.length})
                    </Typography>
                    <List dense>
                      {groupCollaborators.map((collaborator) => {
                        const roleInfo = getRoleInfo(collaborator.role);
                        const permissionInfo = getPermissionInfo(collaborator.permission);
                        const RoleIcon = roleInfo.icon || Person;
                        
                        return (
                          <ListItem key={collaborator.id} divider sx={{py: 1.5}}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: `${roleInfo.color || 'default'}.main` }}>
                                <RoleIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="subtitle2" sx={{fontWeight: 600}}>
                                    {collaborator.userName}
                                    {currentUser?.id === collaborator.userId && <Chip label="Você" size="small" sx={{ml:1}}/>}
                                  </Typography>
                                  <Chip 
                                    label={roleInfo.label} 
                                    size="small" 
                                    color={roleInfo.color || 'default'}
                                    variant="outlined"
                                    title={roleInfo.description}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary" sx={{fontSize: '0.8rem'}}>
                                    {collaborator.userEmail}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                    <Chip 
                                      label={permissionInfo.label} 
                                      size="small" 
                                      color={permissionInfo.color || 'default'}
                                      variant="filled"
                                      title={permissionInfo.description}
                                      sx={{fontSize: '0.75rem', height: '20px'}}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      Adicionado em: {new Date(collaborator.addedAt).toLocaleDateString('pt-BR')}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                            />
                            {canManage && (currentUser?.id !== collaborator.userId) && (
                              <ListItemSecondaryAction>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {canEditThisCollaborator(collaborator) && (
                                    <Tooltip title="Editar Papel/Permissões">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenEditDialog(collaborator)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {canRemoveThisCollaborator(collaborator) && (
                                    <Tooltip title="Remover colaborador">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => confirmRemoveCollaborator(collaborator)}
                                      >
                                        <Delete fontSize="small"/>
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </ListItemSecondaryAction>
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                );
            })}
            {collaborators.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Group sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Nenhum colaborador adicionado ainda.
                </Typography>
                {canManage && documentId && (
                  <Button
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    onClick={() => {
                        setAddFormData({ selectedUser: null, role: 'SECONDARY_STUDENT', permission: 'READ_WRITE', message: '' });
                        setUserSearchInput('');
                        setAvailableUsers([]);
                        setAddDialog(true);
                    }}
                    sx={{ mt: 2 }}
                  >
                    Adicionar Primeiro Colaborador
                  </Button>
                )}
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
        <DialogContent sx={{pt: '10px !important'}}>
            <Autocomplete
                options={availableUsers}
                getOptionLabel={(option) => `${option.name} (${option.email || 'Email não disponível'})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={addFormData.selectedUser}
                onInputChange={(event, newInputValue) => {
                    setUserSearchInput(newInputValue);
                    searchAvailableUsers(newInputValue);
                }}
                onChange={(event, newValue) => {
                    setAddFormData(prev => ({ ...prev, selectedUser: newValue }));
                }}
                loading={loadingUsers}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    label="Buscar Usuário (Nome ou Email)"
                    variant="outlined"
                    margin="normal"
                    required
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                        <>
                            {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                        </>
                        ),
                    }}
                    />
                )}
                noOptionsText={userSearchInput.length < 2 ? "Digite ao menos 2 caracteres" : "Nenhum usuário encontrado"}
                renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      {option.name} ({option.email})
                    </Box>
                  )}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Papel do Colaborador</InputLabel>
              <Select
                value={addFormData.role}
                label="Papel do Colaborador"
                onChange={(e) => setAddFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                {Object.entries(COLLABORATOR_ROLES_MAP).map(([key, info]) => (
                  <MenuItem key={key} value={key} disabled={key === 'PRIMARY_STUDENT' || key === 'PRIMARY_ADVISOR'}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {React.createElement(info.icon || Person, { fontSize: "small"})}
                      <Box>
                        <Typography variant="body2">{info.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {info.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Nível de Permissão</InputLabel>
              <Select
                value={addFormData.permission}
                label="Nível de Permissão"
                onChange={(e) => setAddFormData(prev => ({ ...prev, permission: e.target.value }))}
              >
                {Object.entries(COLLABORATOR_PERMISSIONS_MAP).map(([key, info]) => (
                  <MenuItem key={key} value={key}>
                     <Box>
                        <Typography variant="body2">{info.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {info.description}
                        </Typography>
                      </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth label="Mensagem (Opcional)" value={addFormData.message}
              onChange={(e) => setAddFormData(prev => ({ ...prev, message: e.target.value }))}
              margin="normal" multiline rows={2} placeholder="Mensagem de convite ou observações..."
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddCollaborator} variant="contained" disabled={!addFormData.selectedUser}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Colaborador: {selectedCollaboratorToEdit?.userName}</DialogTitle>
        <DialogContent sx={{pt: '10px !important'}}>
          {selectedCollaboratorToEdit && (
            <Box>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Papel</InputLabel>
                <Select
                  value={editFormData.role} label="Papel"
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  disabled={selectedCollaboratorToEdit.role === 'PRIMARY_STUDENT' || selectedCollaboratorToEdit.role === 'PRIMARY_ADVISOR'}
                >
                  {Object.entries(COLLABORATOR_ROLES_MAP)
                    .filter(([key, info]) => info.type === getRoleInfo(selectedCollaboratorToEdit.role).type)
                    .map(([key, info]) => (
                    <MenuItem key={key} value={key} disabled={key === 'PRIMARY_STUDENT' || key === 'PRIMARY_ADVISOR'}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         {React.createElement(info.icon || Person, { fontSize: "small"})} {info.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {(selectedCollaboratorToEdit.role === 'PRIMARY_STUDENT' || selectedCollaboratorToEdit.role === 'PRIMARY_ADVISOR') &&
                    <FormHelperText>O papel de Principal não pode ser alterado aqui. Use a opção "Promover" em outro colaborador.</FormHelperText>
                }
              </FormControl>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Permissão</InputLabel>
                <Select
                  value={editFormData.permission} label="Permissão"
                  onChange={(e) => setEditFormData(prev => ({ ...prev, permission: e.target.value }))}
                  disabled={selectedCollaboratorToEdit.role === 'PRIMARY_STUDENT' || selectedCollaboratorToEdit.role === 'PRIMARY_ADVISOR'}
                >
                  {Object.entries(COLLABORATOR_PERMISSIONS_MAP).map(([key, info]) => (
                    <MenuItem key={key} value={key}>
                      <Box>{info.label}</Box>
                    </MenuItem>
                  ))}
                </Select>
                {(selectedCollaboratorToEdit.role === 'PRIMARY_STUDENT' || selectedCollaboratorToEdit.role === 'PRIMARY_ADVISOR') &&
                    <FormHelperText>Colaboradores Principais sempre têm Acesso Completo.</FormHelperText>
                }
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleUpdateCollaborator} variant="contained"
            disabled={!canEditThisCollaborator(selectedCollaboratorToEdit) || selectedCollaboratorToEdit?.role === 'PRIMARY_STUDENT' || selectedCollaboratorToEdit?.role === 'PRIMARY_ADVISOR'}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
            onConfirm={handleRemoveCollaborator}
            title={`Remover Colaborador "${itemToRemove?.userName}"`}
            message="Tem certeza que deseja remover este colaborador do documento? Esta ação não pode ser desfeita."
            confirmText="Remover"
            cancelText="Cancelar"
            variant="danger"
        />
    </Card>
  );
};

export default CollaboratorManagement;