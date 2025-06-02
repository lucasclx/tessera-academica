// src/components/Collaborators/CollaboratorManager.tsx
import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CrownIcon,
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import AddCollaboratorModal from './AddCollaboratorModal';

interface DocumentCollaborator {
  id: number;
  documentId: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  permission: string;
  addedAt: string;
  addedByName: string;
  active: boolean;
  lastAccessAt?: string;
  canEdit: boolean;
  canComment: boolean;
  canManageCollaborators: boolean;
  canSubmitDocument: boolean;
  canApproveDocument: boolean;
  isPrimary: boolean;
}

interface CollaboratorManagerProps {
  documentId: number;
  canManageCollaborators: boolean;
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({
  documentId,
  canManageCollaborators,
}) => {
  const { user } = useAuthStore();
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<number | null>(null);

  useEffect(() => {
    loadCollaborators();
  }, [documentId]);

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      const data = await api.get<DocumentCollaborator[]>(`/documents/${documentId}/collaborators`);
      setCollaborators(data);
    } catch (error) {
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: number, collaboratorName: string) => {
    if (!window.confirm(`Tem certeza que deseja remover ${collaboratorName} como colaborador?`)) {
      return;
    }

    try {
      await api.delete(`/documents/${documentId}/collaborators/${collaboratorId}`);
      toast.success('Colaborador removido com sucesso');
      loadCollaborators();
    } catch (error) {
      toast.error('Erro ao remover colaborador');
    }
  };

  const handleUpdatePermissions = async (collaboratorId: number, newPermission: string) => {
    try {
      await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/permissions`, newPermission);
      toast.success('Permissões atualizadas');
      setEditingPermissions(null);
      loadCollaborators();
    } catch (error) {
      toast.error('Erro ao atualizar permissões');
    }
  };

  const handleUpdateRole = async (collaboratorId: number, newRole: string) => {
    try {
      await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/role`, newRole);
      toast.success('Papel atualizado');
      loadCollaborators();
    } catch (error) {
      toast.error('Erro ao atualizar papel');
    }
  };

  const handlePromoteToPrimary = async (collaboratorId: number, collaboratorName: string) => {
    if (!window.confirm(`Tem certeza que deseja promover ${collaboratorName} para colaborador principal?`)) {
      return;
    }

    try {
      await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/promote`);
      toast.success('Colaborador promovido para principal');
      loadCollaborators();
    } catch (error) {
      toast.error('Erro ao promover colaborador');
    }
  };

  const getRoleInfo = (role: string) => {
    const roles = {
      PRIMARY_STUDENT: { label: 'Estudante Principal', color: 'bg-blue-100 text-blue-800', icon: CrownIcon },
      SECONDARY_STUDENT: { label: 'Estudante Colaborador', color: 'bg-blue-50 text-blue-700', icon: UserIcon },
      CO_STUDENT: { label: 'Co-autor', color: 'bg-blue-50 text-blue-700', icon: UserIcon },
      PRIMARY_ADVISOR: { label: 'Orientador Principal', color: 'bg-purple-100 text-purple-800', icon: CrownIcon },
      SECONDARY_ADVISOR: { label: 'Orientador Colaborador', color: 'bg-purple-50 text-purple-700', icon: AcademicCapIcon },
      CO_ADVISOR: { label: 'Co-orientador', color: 'bg-purple-50 text-purple-700', icon: AcademicCapIcon },
      EXTERNAL_ADVISOR: { label: 'Orientador Externo', color: 'bg-purple-50 text-purple-700', icon: AcademicCapIcon },
      EXAMINER: { label: 'Banca Examinadora', color: 'bg-yellow-100 text-yellow-800', icon: EyeIcon },
      REVIEWER: { label: 'Revisor', color: 'bg-gray-100 text-gray-800', icon: EyeIcon },
      OBSERVER: { label: 'Observador', color: 'bg-gray-100 text-gray-800', icon: EyeIcon },
    };
    return roles[role as keyof typeof roles] || { label: role, color: 'bg-gray-100 text-gray-800', icon: UserIcon };
  };

  const getPermissionInfo = (permission: string) => {
    const permissions = {
      READ_ONLY: { label: 'Apenas Leitura', color: 'bg-gray-100 text-gray-800' },
      READ_COMMENT: { label: 'Leitura e Comentários', color: 'bg-blue-100 text-blue-800' },
      READ_WRITE: { label: 'Leitura e Escrita', color: 'bg-green-100 text-green-800' },
      FULL_ACCESS: { label: 'Acesso Completo', color: 'bg-red-100 text-red-800' },
    };
    return permissions[permission as keyof typeof permissions] || { label: permission, color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canRemoveCollaborator = (collaborator: DocumentCollaborator) => {
    return canManageCollaborators && collaborator.userId !== user?.id && !collaborator.isPrimary;
  };

  const canEditCollaborator = (collaborator: DocumentCollaborator) => {
    return canManageCollaborators && collaborator.userId !== user?.id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <UserGroupIcon className="h-5 w-5 mr-2" />
          Colaboradores ({collaborators.length})
        </h3>
        {canManageCollaborators && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Adicionar Colaborador
          </button>
        )}
      </div>

      {/* Collaborators List */}
      <div className="space-y-4">
        {collaborators.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum colaborador</h3>
            <p className="mt-1 text-sm text-gray-500">
              Este documento ainda não possui colaboradores.
            </p>
          </div>
        ) : (
          collaborators.map((collaborator) => {
            const roleInfo = getRoleInfo(collaborator.role);
            const permissionInfo = getPermissionInfo(collaborator.permission);
            const RoleIcon = roleInfo.icon;

            return (
              <div
                key={collaborator.id}
                className={`border rounded-lg p-4 ${
                  collaborator.isPrimary ? 'border-primary-200 bg-primary-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <RoleIcon className={`h-8 w-8 ${collaborator.isPrimary ? 'text-primary-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {collaborator.userName}
                        </span>
                        {collaborator.isPrimary && (
                          <CrownIcon className="h-4 w-4 text-yellow-500" title="Principal" />
                        )}
                        {collaborator.userId === user?.id && (
                          <span className="text-xs text-gray-500">(Você)</span>
                        )}
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-sm text-gray-600">{collaborator.userEmail}</p>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${permissionInfo.color}`}>
                          {permissionInfo.label}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        <div>Adicionado por {collaborator.addedByName} em {formatDate(collaborator.addedAt)}</div>
                        {collaborator.lastAccessAt && (
                          <div>Último acesso: {formatDate(collaborator.lastAccessAt)}</div>
                        )}
                      </div>

                      {/* Permissions Summary */}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {collaborator.canEdit && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Pode editar</span>
                        )}
                        {collaborator.canComment && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Pode comentar</span>
                        )}
                        {collaborator.canManageCollaborators && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Gerencia colaboradores</span>
                        )}
                        {collaborator.canSubmitDocument && (
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Pode submeter</span>
                        )}
                        {collaborator.canApproveDocument && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded">Pode aprovar</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canEditCollaborator(collaborator) && (
                    <div className="flex items-center space-x-2 ml-4">
                      {editingPermissions === collaborator.id ? (
                        <div className="space-y-2">
                          <select
                            onChange={(e) => handleUpdatePermissions(collaborator.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            defaultValue={collaborator.permission}
                          >
                            <option value="READ_ONLY">Apenas Leitura</option>
                            <option value="READ_COMMENT">Leitura e Comentários</option>
                            <option value="READ_WRITE">Leitura e Escrita</option>
                            <option value="FULL_ACCESS">Acesso Completo</option>
                          </select>
                          <button
                            onClick={() => setEditingPermissions(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingPermissions(collaborator.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Editar permissões"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>

                          {!collaborator.isPrimary && (
                            <button
                              onClick={() => handlePromoteToPrimary(collaborator.id, collaborator.userName)}
                              className="text-gray-400 hover:text-yellow-600"
                              title="Promover para principal"
                            >
                              <CrownIcon className="h-4 w-4" />
                            </button>
                          )}

                          {canRemoveCollaborator(collaborator) && (
                            <button
                              onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.userName)}
                              className="text-gray-400 hover:text-red-600"
                              title="Remover colaborador"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Collaborator Modal */}
      {showAddModal && (
        <AddCollaboratorModal
          documentId={documentId}
          onClose={() => setShowAddModal(false)}
          onCollaboratorAdded={() => {
            setShowAddModal(false);
            loadCollaborators();
          }}
        />
      )}
    </div>
  );
};

export default CollaboratorManager;