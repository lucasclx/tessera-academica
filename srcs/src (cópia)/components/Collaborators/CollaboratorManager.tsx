// src/components/Collaborators/CollaboratorManager.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon, // Usado para permissões, CrownIcon para principal
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
  StarIcon, // Ícone para Colaborador Principal
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { collaboratorsApi, DocumentCollaborator, AddCollaboratorPayload } from '../../lib/api'; // Importando collaboratorsApi e tipos
import { toast } from 'react-hot-toast';
import AddCollaboratorModal from './AddCollaboratorModal'; // Importar o modal

interface CollaboratorManagerProps {
  documentId: number;
  canManageThisDocument: boolean; // Renomeado de canManageCollaborators para ser mais específico ao documento atual
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({
  documentId,
  canManageThisDocument,
}) => {
  const { user } = useAuthStore();
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Estado para editar permissões e papel
  const [editingCollaborator, setEditingCollaborator] = useState<DocumentCollaborator | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');


  useEffect(() => {
    if (documentId) {
      loadCollaborators();
    }
  }, [documentId]);

  const loadCollaborators = async () => {
    setLoading(true);
    try {
      const data = await collaboratorsApi.getCollaborators(documentId);
      setCollaborators(data.map(collab => ({
          ...collab, // Recalcular permissões no frontend pode ser útil se a API não retornar os booleanos canEdit etc.
          canEdit: collab.permission === 'READ_WRITE' || collab.permission === 'FULL_ACCESS',
          canComment: collab.permission !== 'READ_ONLY',
          canManageCollaborators: collab.permission === 'FULL_ACCESS' || (collab.role === 'PRIMARY_STUDENT' || collab.role === 'PRIMARY_ADVISOR'),
          isPrimary: collab.role === 'PRIMARY_STUDENT' || collab.role === 'PRIMARY_ADVISOR',
          // canSubmitDocument e canApproveDocument dependem mais do papel, já definidos no DTO do backend
      })));
    } catch (error) {
      toast.error('Erro ao carregar colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorToRemove: DocumentCollaborator) => {
    if (!window.confirm(`Tem certeza que deseja remover ${collaboratorToRemove.userName} como colaborador?`)) {
      return;
    }
    try {
      await collaboratorsApi.removeCollaborator(documentId, collaboratorToRemove.id);
      toast.success('Colaborador removido com sucesso!');
      loadCollaborators();
    } catch (error) {
      // O toast de erro já é tratado pelo api.tsx
    }
  };
  
  const openEditModal = (collaborator: DocumentCollaborator) => {
    setEditingCollaborator(collaborator);
    setSelectedPermission(collaborator.permission);
    setSelectedRole(collaborator.role);
    setIsEditModalOpen(true);
  };

  const handleSaveChangesToCollaborator = async () => {
    if (!editingCollaborator) return;

    let updated = false;
    try {
      if (selectedPermission !== editingCollaborator.permission) {
        await collaboratorsApi.updatePermissions(documentId, editingCollaborator.id, selectedPermission);
        updated = true;
      }
      if (selectedRole !== editingCollaborator.role) {
        // Validação extra: Não permitir rebaixar o último principal sem promover outro.
        // Essa lógica mais complexa pode precisar ser gerenciada com cuidado.
        const isChangingToNonPrimary = selectedRole !== 'PRIMARY_STUDENT' && selectedRole !== 'PRIMARY_ADVISOR';
        if (editingCollaborator.isPrimary && isChangingToNonPrimary) {
            const primaryOfTypeCount = collaborators.filter(c => c.active && c.role === editingCollaborator.role).length;
            if (primaryOfTypeCount <= 1) {
                 toast.error(`Não é possível rebaixar o último colaborador principal (${editingCollaborator.role}). Promova outro primeiro.`);
                 return;
            }
        }
        await collaboratorsApi.updateRole(documentId, editingCollaborator.id, selectedRole);
        updated = true;
      }

      if (updated) {
        toast.success('Colaborador atualizado com sucesso!');
      }
      setIsEditModalOpen(false);
      setEditingCollaborator(null);
      loadCollaborators();
    } catch (error) {
       // O toast de erro já é tratado pelo api.tsx
    }
  };


  const handlePromoteToPrimary = async (collaboratorToPromote: DocumentCollaborator) => {
    if (!window.confirm(`Tem certeza que deseja promover ${collaboratorToPromote.userName} para colaborador principal? Esta ação pode rebaixar o principal atual.`)) {
      return;
    }
    try {
      await collaboratorsApi.promoteToPrimary(documentId, collaboratorToPromote.id);
      toast.success(`${collaboratorToPromote.userName} promovido para principal!`);
      loadCollaborators();
    } catch (error) {
      // O toast de erro já é tratado pelo api.tsx
    }
  };

  const getRoleInfo = (role: string) => {
    const roles: Record<string, { label: string; color: string; icon: React.ElementType }> = {
      PRIMARY_STUDENT: { label: 'Estudante Principal', color: 'bg-blue-100 text-blue-800', icon: CrownIcon },
      SECONDARY_STUDENT: { label: 'Estudante Colaborador', color: 'bg-blue-50 text-blue-700', icon: UserIcon },
      CO_STUDENT: { label: 'Co-autor', color: 'bg-blue-50 text-blue-700', icon: UserIcon },
      PRIMARY_ADVISOR: { label: 'Orientador Principal', color: 'bg-purple-100 text-purple-800', icon: CrownIcon },
      SECONDARY_ADVISOR: { label: 'Orientador Colaborador', color: 'bg-purple-50 text-purple-700', icon: AcademicCapIcon },
      CO_ADVISOR: { label: 'Co-orientador', color: 'bg-purple-50 text-purple-700', icon: AcademicCapIcon },
      EXTERNAL_ADVISOR: { label: 'Orientador Externo', color: 'bg-teal-50 text-teal-700', icon: AcademicCapIcon },
      EXAMINER: { label: 'Banca Examinadora', color: 'bg-yellow-100 text-yellow-800', icon: EyeIcon },
      REVIEWER: { label: 'Revisor', color: 'bg-indigo-100 text-indigo-800', icon: EyeIcon },
      OBSERVER: { label: 'Observador', color: 'bg-gray-100 text-gray-800', icon: EyeIcon },
    };
    return roles[role] || { label: role, color: 'bg-gray-100 text-gray-800', icon: UserIcon };
  };

  const getPermissionInfo = (permission: string) => {
    const permissions: Record<string, { label: string; color: string; description: string }> = {
      READ_ONLY: { label: 'Leitura', color: 'bg-gray-100 text-gray-700', description: 'Pode visualizar o documento e comentários.' },
      READ_COMMENT: { label: 'Comentar', color: 'bg-blue-100 text-blue-700', description: 'Pode visualizar e adicionar comentários.' },
      READ_WRITE: { label: 'Editar', color: 'bg-green-100 text-green-700', description: 'Pode editar o conteúdo do documento.' },
      FULL_ACCESS: { label: 'Total', color: 'bg-red-100 text-red-700', description: 'Pode gerenciar colaboradores e configurações.' },
    };
    return permissions[permission] || { label: permission, color: 'bg-gray-100 text-gray-800', description: 'Permissão customizada.' };
  };
  
  const availableRoles = [ // Baseado em CollaboratorRole.java
    { value: 'PRIMARY_STUDENT', label: 'Estudante Principal', type: 'STUDENT' },
    { value: 'SECONDARY_STUDENT', label: 'Estudante Colaborador', type: 'STUDENT' },
    { value: 'CO_STUDENT', label: 'Co-autor', type: 'STUDENT' },
    { value: 'PRIMARY_ADVISOR', label: 'Orientador Principal', type: 'ADVISOR' },
    { value: 'SECONDARY_ADVISOR', label: 'Orientador Colaborador', type: 'ADVISOR' },
    { value: 'CO_ADVISOR', label: 'Co-orientador', type: 'ADVISOR' },
    { value: 'EXTERNAL_ADVISOR', label: 'Orientador Externo', type: 'ADVISOR' },
    { value: 'EXAMINER', label: 'Banca Examinadora', type: 'OTHER' },
    { value: 'REVIEWER', label: 'Revisor', type: 'OTHER' },
    { value: 'OBSERVER', label: 'Observador', type: 'OTHER' },
  ];

  const availablePermissions = [ // Baseado em CollaboratorPermission.java
    { value: 'READ_ONLY', label: 'Apenas Leitura' },
    { value: 'READ_COMMENT', label: 'Leitura e Comentários' },
    { value: 'READ_WRITE', label: 'Leitura e Escrita' },
    { value: 'FULL_ACCESS', label: 'Acesso Completo' },
  ];


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const canPerformActionOn = (collaborator: DocumentCollaborator) => {
    if (!canManageThisDocument) return false; // Usuário atual não pode gerenciar este documento
    if (collaborator.userId === user?.id) return false; // Não pode alterar a si mesmo
    // Admin pode alterar qualquer um, exceto a si mesmo se for colaborador.
    // Colaboradores principais podem alterar outros, exceto outros principais do mesmo tipo, a menos que seja para promover.
    return true; 
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
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <UserGroupIcon className="h-6 w-6 mr-2 text-primary-600" />
          Colaboradores ({collaborators.length})
        </h3>
        {canManageThisDocument && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Adicionar Colaborador
          </button>
        )}
      </div>

      {collaborators.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum colaborador adicionado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canManageThisDocument ? 'Adicione colaboradores para trabalhar neste documento.' : 'Este documento não possui colaboradores.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborators.map((collaborator) => {
            const roleInfo = getRoleInfo(collaborator.role);
            const permissionInfo = getPermissionInfo(collaborator.permission);
            const RoleIcon = roleInfo.icon;
            const canBeEditedByCurrentUser = canPerformActionOn(collaborator);

            return (
              <div
                key={collaborator.id}
                className={`rounded-lg p-4 shadow-sm transition-all duration-150 ease-in-out ${
                  collaborator.isPrimary ? 'border-2 border-primary-500 bg-primary-50' : 'border border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <RoleIcon className={`h-10 w-10 flex-shrink-0 ${collaborator.isPrimary ? 'text-primary-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900">{collaborator.userName}</span>
                        {collaborator.isPrimary && (<CrownIcon className="h-5 w-5 text-yellow-500" title="Principal" />)}
                        {collaborator.userId === user?.id && (<span className="text-xs text-gray-500">(Você)</span>)}
                      </div>
                      <p className="text-sm text-gray-600">{collaborator.userEmail}</p>
                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleInfo.color}`}>
                          <RoleIcon className="h-3.5 w-3.5 mr-1.5 -ml-0.5" />
                          {roleInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${permissionInfo.color}`}>
                           <ShieldCheckIcon className="h-3.5 w-3.5 mr-1.5 -ml-0.5" />
                          {permissionInfo.label}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                        <p>Adicionado por: {collaborator.addedByName || 'Sistema'} em {formatDate(collaborator.addedAt)}</p>
                        {collaborator.lastAccessAt && (<p>Último acesso: {formatDate(collaborator.lastAccessAt)}</p>)}
                      </div>
                    </div>
                  </div>

                  {/* Actions - only if current user can manage this document AND it's not the current user's own entry */}
                  {canBeEditedByCurrentUser && (
                    <div className="flex items-center space-x-2 mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                       <button
                        onClick={() => openEditModal(collaborator)}
                        className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-primary-50"
                        title="Editar Papel/Permissões"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {!collaborator.isPrimary && (
                        <button
                          onClick={() => handlePromoteToPrimary(collaborator)}
                          className="p-2 text-gray-400 hover:text-yellow-500 rounded-full hover:bg-yellow-50"
                          title="Promover para principal"
                        >
                          <CrownIcon className="h-5 w-5" />
                        </button>
                      )}
                      {!collaborator.isPrimary && ( // Não permitir remover o principal diretamente
                        <button
                          onClick={() => handleRemoveCollaborator(collaborator)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                          title="Remover colaborador"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
      
      {/* Edit Collaborator Modal */}
      <Transition.Root show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                        <PencilIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Editar Colaborador: {editingCollaborator?.userName}
                        </Dialog.Title>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor="editRole" className="block text-sm font-medium text-gray-700">Papel</label>
                            <select 
                              id="editRole" 
                              name="editRole"
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="input-field mt-1"
                              disabled={editingCollaborator?.isPrimary} // Não permitir alterar papel de principal diretamente aqui
                            >
                              {availableRoles.map(role => (
                                <option key={role.value} value={role.value} disabled={editingCollaborator?.isPrimary && role.value !== editingCollaborator.role}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                             {editingCollaborator?.isPrimary && <p className="text-xs text-gray-500 mt-1">Para alterar o papel de um colaborador principal, promova outro usuário para este papel.</p>}
                          </div>
                          <div>
                            <label htmlFor="editPermission" className="block text-sm font-medium text-gray-700">Permissão</label>
                            <select 
                              id="editPermission"
                              name="editPermission"
                              value={selectedPermission}
                              onChange={(e) => setSelectedPermission(e.target.value)}
                              className="input-field mt-1"
                              disabled={editingCollaborator?.isPrimary && selectedRole === editingCollaborator?.role} // Papel principal sempre tem FULL_ACCESS
                            >
                               {availablePermissions.map(perm => (
                                <option key={perm.value} value={perm.value} disabled={editingCollaborator?.isPrimary && perm.value !== 'FULL_ACCESS'}>
                                    {perm.label} ({getPermissionInfo(perm.value).description})
                                </option>
                               ))}
                            </select>
                            {editingCollaborator?.isPrimary && <p className="text-xs text-gray-500 mt-1">Colaboradores principais sempre têm acesso completo.</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button type="button" className="btn btn-primary sm:ml-3" onClick={handleSaveChangesToCollaborator}>Salvar Mudanças</button>
                    <button type="button" className="btn btn-secondary mt-3 sm:mt-0" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

    </div>
  );
};

export default CollaboratorManager;