// frontend/src/components/collaborators/CollaboratorManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardHeader, CardContent, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, List, ListItem, ListItemText,
  ListItemAvatar, ListItemSecondaryAction, Avatar, IconButton,
  Chip, Autocomplete, Alert, Divider, Grid, Tooltip
} from '@mui/material';
import {
  PersonAdd, Delete, Edit, Group, SupervisorAccount, School,
  Person, Settings, Check, Close, Warning
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { collaboratorService, userService } from '../../services/collaboratorService';

const COLLABORATOR_ROLES = {
  PRIMARY_STUDENT: { label: 'Estudante Principal', icon: School, color: 'primary', description: 'Responsável principal pelo trabalho' },
  SECONDARY_STUDENT: { label: 'Estudante Colaborador', icon: Person, color: 'info', description: 'Estudante que colabora no trabalho' },
  PRIMARY_ADVISOR: { label: 'Orientador Principal', icon: SupervisorAccount, color: 'secondary', description: 'Orientador responsável' },
  SECONDARY_ADVISOR: { label: 'Orientador Colaborador', icon: SupervisorAccount, color: 'warning', description: 'Orientador que auxilia' },
  CO_ADVISOR: { label: 'Co-orientador', icon: SupervisorAccount, color: 'success', description: 'Co-orientador do trabalho' }
};

const COLLABORATOR_PERMISSIONS = {
  READ_ONLY: { label: 'Apenas Leitura', description: 'Pode visualizar o documento', color: 'default' },
  READ_WRITE: { label: 'Leitura e Escrita', description: 'Pode editar o documento', color: 'primary' },
  FULL_ACCESS: { label: 'Acesso Completo', description: 'Pode gerenciar colaboradores', color: 'secondary' }
};

const CollaboratorManagement = ({ documentId, currentUser, canManage = false }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    userEmail: '',
    role: 'SECONDARY_STUDENT',
    permission: 'READ_WRITE',
    message: ''
  });

  useEffect(() => {
    loadCollaborators();
    if (canManage) {
      loadAvailableUsers();
    }
  }, [documentId, canManage]);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const data = await collaboratorService.getDocumentCollaborators(documentId);
      setCollaborators(data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      // Aqui você pode implementar um endpoint para buscar usuários disponíveis
      const advisors = await userService.getApprovedAdvisors();
      // const students = await userService.getApprovedStudents(); // Implementar se necessário
      setAvailableUsers(advisors);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddCollaborator = async () => {
    try {
      if (!formData.userEmail || !formData.role || !formData.permission) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const collaboratorData = {
        userEmail: formData.userEmail,
        role: formData.role,
        permission: formData.permission,
        message: formData.message
      };

      await collaboratorService.addCollaborator(documentId, collaboratorData);
      toast.success('Colaborador adicionado com sucesso!');
      
      setAddDialog(false);
      setFormData({
        userEmail: '',
        role: 'SECONDARY_STUDENT',
        permission: 'READ_WRITE',
        message: ''
      });
      loadCollaborators();
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      toast.error(error.response?.data?.message || 'Erro ao adicionar colaborador');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm('Tem certeza que deseja remover este colaborador?')) {
      return;
    }

    try {
      await collaboratorService.removeCollaborator(documentId, collaboratorId);
      toast.success('Colaborador removido com sucesso!');
      loadCollaborators();
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      toast.error(error.response?.data?.message || 'Erro ao remover colaborador');
    }
  };

  const handleUpdatePermissions = async (collaboratorId, newPermission) => {
    try {
      await collaboratorService.updatePermissions(documentId, collaboratorId, newPermission);
      toast.success('Permissões atualizadas!');
      loadCollaborators();
      setEditDialog(false);
      setSelectedCollaborator(null);
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar permissões');
    }
  };

  const getRoleInfo = (role) => COLLABORATOR_ROLES[role] || COLLABORATOR_ROLES.SECONDARY_STUDENT;
  const getPermissionInfo = (permission) => COLLABORATOR_PERMISSIONS[permission] || COLLABORATOR_PERMISSIONS.READ_ONLY;

  const canRemoveCollaborator = (collaborator) => {
    // Não pode remover colaboradores primários
    return !['PRIMARY_STUDENT', 'PRIMARY_ADVISOR'].includes(collaborator.role);
  };

  const canEditPermissions = (collaborator) => {
    // Não pode alterar permissões de colaboradores primários
    return !['PRIMARY_STUDENT', 'PRIMARY_ADVISOR'].includes(collaborator.role);
  };

  const groupedCollaborators = collaborators.reduce((groups, collaborator) => {
    const roleInfo = getRoleInfo(collaborator.role);
    const isStudent = collaborator.role.includes('STUDENT');
    const groupKey = isStudent ? 'students' : 'advisors';
    
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(collaborator);
    return groups;
  }, {});

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Group color="primary" />
            <Typography variant="h6">
              Colaboradores ({collaborators.length})
            </Typography>
          </Box>
        }
        action={
          canManage && (
            <Button
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={() => setAddDialog(true)}
              size="small"
            >
              Adicionar
            </Button>
          )
        }
      />
      
      <CardContent>
        {loading ? (
          <Typography>Carregando colaboradores...</Typography>
        ) : (
          <Box>
            {/* Estudantes */}
            {groupedCollaborators.students && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School color="primary" />
                  Estudantes ({groupedCollaborators.students.length})
                </Typography>
                <List dense>
                  {groupedCollaborators.students.map((collaborator) => {
                    const roleInfo = getRoleInfo(collaborator.role);
                    const permissionInfo = getPermissionInfo(collaborator.permission);
                    
                    return (
                      <ListItem key={collaborator.id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${roleInfo.color}.main` }}>
                            <roleInfo.icon />
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2">
                                {collaborator.userName}
                              </Typography>
                              <Chip 
                                label={roleInfo.label} 
                                size="small" 
                                color={roleInfo.color}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {collaborator.userEmail}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={permissionInfo.label} 
                                  size="small" 
                                  color={permissionInfo.color}
                                  variant="filled"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Adicionado em {new Date(collaborator.addedAt).toLocaleDateString('pt-BR')}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        
                        {canManage && (
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {canEditPermissions(collaborator) && (
                                <Tooltip title="Editar permissões">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedCollaborator(collaborator);
                                      setEditDialog(true);
                                    }}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {canRemoveCollaborator(collaborator) && (
                                <Tooltip title="Remover colaborador">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                                  >
                                    <Delete />
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
            )}

            {/* Orientadores */}
            {groupedCollaborators.advisors && (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SupervisorAccount color="secondary" />
                  Orientadores ({groupedCollaborators.advisors.length})
                </Typography>
                <List dense>
                  {groupedCollaborators.advisors.map((collaborator) => {
                    const roleInfo = getRoleInfo(collaborator.role);
                    const permissionInfo = getPermissionInfo(collaborator.permission);
                    
                    return (
                      <ListItem key={collaborator.id} divider>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: `${roleInfo.color}.main` }}>
                            <roleInfo.icon />
                          </Avatar>
                        </ListItemAvatar>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2">
                                {collaborator.userName}
                              </Typography>
                              <Chip 
                                label={roleInfo.label} 
                                size="small" 
                                color={roleInfo.color}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {collaborator.userEmail}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip 
                                  label={permissionInfo.label} 
                                  size="small" 
                                  color={permissionInfo.color}
                                  variant="filled"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Adicionado em {new Date(collaborator.addedAt).toLocaleDateString('pt-BR')}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        
                        {canManage && (
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {canEditPermissions(collaborator) && (
                                <Tooltip title="Editar permissões">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedCollaborator(collaborator);
                                      setEditDialog(true);
                                    }}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              {canRemoveCollaborator(collaborator) && (
                                <Tooltip title="Remover colaborador">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                                  >
                                    <Delete />
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
            )}

            {collaborators.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Group sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Nenhum colaborador adicionado ainda
                </Typography>
                {canManage && (
                  <Button
                    variant="outlined"
                    startIcon={<PersonAdd />}
                    onClick={() => setAddDialog(true)}
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

      {/* Dialog para Adicionar Colaborador */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Colaborador</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Email do Usuário"
              value={formData.userEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
              margin="normal"
              required
              helperText="Digite o email do usuário que deseja adicionar"
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Papel do Colaborador</InputLabel>
              <Select
                value={formData.role}
                label="Papel do Colaborador"
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              >
                {Object.entries(COLLABORATOR_ROLES).map(([key, info]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <info.icon fontSize="small" />
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
                value={formData.permission}
                label="Nível de Permissão"
                onChange={(e) => setFormData(prev => ({ ...prev, permission: e.target.value }))}
              >
                {Object.entries(COLLABORATOR_PERMISSIONS).map(([key, info]) => (
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
              fullWidth
              label="Mensagem (Opcional)"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
              placeholder="Mensagem de convite ou observações..."
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              O usuário receberá uma notificação sobre o convite para colaborar no documento.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddCollaborator} variant="contained">
            Adicionar Colaborador
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para Editar Permissões */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Permissões</DialogTitle>
        <DialogContent>
          {selectedCollaborator && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedCollaborator.userName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedCollaborator.userEmail}
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Nova Permissão</InputLabel>
                <Select
                  value={selectedCollaborator.permission}
                  label="Nova Permissão"
                  onChange={(e) => setSelectedCollaborator(prev => ({ ...prev, permission: e.target.value }))}
                >
                  {Object.entries(COLLABORATOR_PERMISSIONS).map(([key, info]) => (
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
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
          <Button 
            onClick={() => handleUpdatePermissions(selectedCollaborator.id, selectedCollaborator.permission)}
            variant="contained"
          >
            Atualizar Permissões
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CollaboratorManagement;