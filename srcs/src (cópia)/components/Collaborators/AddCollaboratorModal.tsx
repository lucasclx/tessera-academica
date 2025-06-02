// src/components/Collaborators/AddCollaboratorModal.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { usersApi, collaboratorsApi, UserSelection, AddCollaboratorPayload } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface AddCollaboratorModalProps {
  documentId: number;
  onClose: () => void;
  onCollaboratorAdded: () => void;
}

const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({
  documentId,
  onClose,
  onCollaboratorAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(''); // Para filtrar busca: STUDENT, ADVISOR
  const [users, setUsers] = useState<UserSelection[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<UserSelection | null>(null);
  const [collaboratorRole, setCollaboratorRole] = useState(''); // Papel no documento
  const [permission, setPermission] = useState('READ_COMMENT'); // Permissão no documento
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'search' | 'configure'>('search');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    // Debounce search
    const handler = setTimeout(() => {
      if (searchTerm.length >= 2 && step === 'search') {
        searchUsers();
      } else if (step === 'search') {
        setUsers([]);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, filterRole, step]);

  const searchUsers = async () => {
    setLoadingSearch(true);
    try {
      const data = await usersApi.searchPotentialCollaborators(searchTerm, filterRole || undefined, documentId);
      setUsers(data);
    } catch (error) {
      toast.error('Erro ao buscar usuários.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectUser = (user: UserSelection) => {
    setSelectedUser(user);
    // Sugestão de papel baseada no papel do sistema do usuário
    if (user.role?.includes('STUDENT')) {
      setCollaboratorRole('SECONDARY_STUDENT'); // Default para estudantes
    } else if (user.role?.includes('ADVISOR')) {
      setCollaboratorRole('SECONDARY_ADVISOR'); // Default para orientadores
    } else {
      setCollaboratorRole('OBSERVER'); // Default para outros
    }
    setPermission('READ_COMMENT'); // Default permission
    setStep('configure');
  };

  const handleAddCollaborator = async () => {
    if (!selectedUser || !collaboratorRole || !permission) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: AddCollaboratorPayload = {
        userEmail: selectedUser.email!,
        role: collaboratorRole,
        permission: permission,
        message: message,
      };
      await collaboratorsApi.addCollaborator(documentId, payload);
      toast.success(`${selectedUser.name} foi adicionado como colaborador!`);
      onCollaboratorAdded(); // Fecha o modal e recarrega a lista no manager
    } catch (error) {
      // Erro já tratado pelo api.tsx
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const documentRoles = [ // Baseado em CollaboratorRole.java
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
  
  const getPermissionDescription = (permValue: string) => {
     const permissionsMap: Record<string, string> = {
        READ_ONLY: 'Pode visualizar o documento e comentários.',
        READ_COMMENT: 'Pode visualizar e adicionar comentários.',
        READ_WRITE: 'Pode editar o conteúdo do documento.',
        FULL_ACCESS: 'Pode gerenciar colaboradores e configurações do documento.',
     };
     return permissionsMap[permValue] || '';
  }

  const availablePermissions = [ // Baseado em CollaboratorPermission.java
    { value: 'READ_ONLY', label: 'Apenas Leitura' },
    { value: 'READ_COMMENT', label: 'Leitura e Comentários' },
    { value: 'READ_WRITE', label: 'Leitura e Escrita' },
    { value: 'FULL_ACCESS', label: 'Acesso Completo (Gerenciar)' },
  ];

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}> {/* z-40 para ficar abaixo do NotificationCenter (z-50) */}
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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                      {step === 'search' ? (
                        <>
                          <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-primary-600" />
                          Buscar Colaborador
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="h-6 w-6 mr-2 text-primary-600" />
                          Configurar Colaborador
                        </>
                      )}
                    </Dialog.Title>
                    <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mt-5">
                    {step === 'search' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Buscar por nome ou email</label>
                                <input
                                type="text"
                                name="searchTerm"
                                id="searchTerm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Digite para buscar..."
                                className="input-field mt-1"
                                />
                            </div>
                            <div>
                                <label htmlFor="filterRole" className="block text-sm font-medium text-gray-700">Filtrar por tipo de usuário</label>
                                <select 
                                    id="filterRole" 
                                    name="filterRole"
                                    value={filterRole}
                                    onChange={(e) => {setFilterRole(e.target.value); setSearchTerm(''); setUsers([]);}}
                                    className="input-field mt-1"
                                >
                                <option value="">Todos os Tipos</option>
                                <option value="STUDENT">Estudante</option>
                                <option value="ADVISOR">Orientador</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="mt-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                          {loadingSearch ? (
                            <div className="p-6 text-center text-gray-500">Buscando...</div>
                          ) : users.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              {searchTerm.length < 2 ? 'Digite ao menos 2 caracteres para buscar.' : 'Nenhum usuário encontrado.'}
                            </div>
                          ) : (
                            <ul className="divide-y divide-gray-200">
                              {users.map((user) => (
                                <li key={user.id} onClick={() => handleSelectUser(user)} className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                  </div>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">{user.role?.replace('ROLE_', '') || 'Usuário'}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : ( // Step 'configure'
                      selectedUser && (
                        <div className="space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-900">Adicionando: {selectedUser.name}</p>
                            <p className="text-xs text-gray-500">{selectedUser.email}</p>
                          </div>
                          <div>
                            <label htmlFor="collaboratorRole" className="block text-sm font-medium text-gray-700">Papel no Documento *</label>
                            <select 
                                id="collaboratorRole" 
                                value={collaboratorRole} 
                                onChange={(e) => setCollaboratorRole(e.target.value)} 
                                className="input-field mt-1"
                                required
                            >
                              <option value="">Selecione um papel...</option>
                              {documentRoles.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label} {role.type !== 'OTHER' ? `(${role.type})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="permission" className="block text-sm font-medium text-gray-700">Nível de Permissão *</label>
                             <select 
                                id="permission" 
                                value={permission} 
                                onChange={(e) => setPermission(e.target.value)} 
                                className="input-field mt-1"
                                required
                            >
                              <option value="">Selecione uma permissão...</option>
                              {availablePermissions.map(perm => (
                                <option key={perm.value} value={perm.value}>
                                  {perm.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">{getPermissionDescription(permission)}</p>
                          </div>
                          <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensagem de Convite (opcional)</label>
                            <textarea
                              id="message"
                              rows={3}
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Ex: Olá, gostaria de te convidar para colaborar neste documento..."
                              className="input-field mt-1"
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:items-center sm:px-6">
                    {step === 'configure' && (
                         <button
                            type="button"
                            className="btn btn-secondary sm:mr-auto inline-flex items-center"
                            onClick={() => {setStep('search'); setSelectedUser(null);}}
                          >
                           <ArrowLeftIcon className="h-4 w-4 mr-1.5"/> Voltar para Busca
                          </button>
                    )}
                  <div className="sm:flex-auto"/> {/* Spacer */}
                  <button
                    type="button"
                    className="btn btn-secondary mt-3 sm:mt-0 w-full sm:w-auto"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  {step === 'configure' && (
                    <button
                      type="button"
                      className="btn btn-primary ml-3 w-full sm:w-auto"
                      onClick={handleAddCollaborator}
                      disabled={isSubmitting || !selectedUser || !collaboratorRole || !permission}
                    >
                      {isSubmitting ? 'Adicionando...' : 'Adicionar Colaborador'}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default AddCollaboratorModal;