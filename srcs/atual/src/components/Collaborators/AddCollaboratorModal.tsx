// src/components/Collaborators/AddCollaboratorModal.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  institution?: string;
  isActive: boolean;
}

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
  const [selectedRole, setSelectedRole] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [collaboratorRole, setCollaboratorRole] = useState('');
  const [permission, setPermission] = useState('READ_COMMENT');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'search' | 'configure'>('search');

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm, selectedRole]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<User[]>(`/users/search/collaborators?search=${searchTerm}&role=${selectedRole}&excludeDocumentId=${documentId}`);
      setUsers(data);
    } catch (error) {
      toast.error('Erro ao buscar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setStep('configure');
    
    // Set default role based on user type
    if (user.role === 'STUDENT') {
      setCollaboratorRole('SECONDARY_STUDENT');
    } else if (user.role === 'ADVISOR') {
      setCollaboratorRole('SECONDARY_ADVISOR');
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUser || !collaboratorRole || !permission) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const requestData = {
        userEmail: selectedUser.email,
        role: collaboratorRole,
        permission: permission,
        message: message,
      };

      await api.post(`/documents/${documentId}/collaborators`, requestData);
      toast.success(`${selectedUser.name} foi adicionado como colaborador`);
      onCollaboratorAdded();
    } catch (error) {
      toast.error('Erro ao adicionar colaborador');
    }
  };

  const roles = {
    student: [
      { value: 'SECONDARY_STUDENT', label: 'Estudante Colaborador' },
      { value: 'CO_STUDENT', label: 'Co-autor' },
    ],
    advisor: [
      { value: 'SECONDARY_ADVISOR', label: 'Orientador Colaborador' },
      { value: 'CO_ADVISOR', label: 'Co-orientador' },
      { value: 'EXTERNAL_ADVISOR', label: 'Orientador Externo' },
    ],
    other: [
      { value: 'EXAMINER', label: 'Banca Examinadora' },
      { value: 'REVIEWER', label: 'Revisor' },
      { value: 'OBSERVER', label: 'Observador' },
    ],
  };

  const permissions = [
    { value: 'READ_ONLY', label: 'Apenas Leitura', description: 'Pode visualizar o documento' },
    { value: 'READ_COMMENT', label: 'Leitura e Comentários', description: 'Pode visualizar e comentar' },
    { value: 'READ_WRITE', label: 'Leitura e Escrita', description: 'Pode editar o documento' },
    { value: 'FULL_ACCESS', label: 'Acesso Completo', description: 'Pode gerenciar colaboradores' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {step === 'search' ? 'Buscar Colaborador' : 'Configurar Colaborador'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4">
          {step === 'search' ? (
            /* Search Step */
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar por nome ou email
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o nome ou email do colaborador..."
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por tipo
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="input-field"
                >
                  <option value="">Todos os tipos</option>
                  <option value="STUDENT">Estudantes</option>
                  <option value="ADVISOR">Orientadores</option>
                </select>
              </div>

              {/* Search Results */}
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm.length < 2 
                      ? 'Digite pelo menos 2 caracteres para buscar'
                      : 'Nenhum usuário encontrado'
                    }
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.department && (
                              <div className="text-xs text-gray-400">
                                {user.department} - {user.institution}
                              </div>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'STUDENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {user.role === 'STUDENT' ? 'Estudante' : 'Orientador'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Configure Step */
            <div className="space-y-6">
              {/* Selected User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Colaborador Selecionado</h4>
                <div className="mt-2">
                  <div className="font-medium">{selectedUser?.name}</div>
                  <div className="text-sm text-gray-500">{selectedUser?.email}</div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Papel do Colaborador *
                </label>
                <select
                  value={collaboratorRole}
                  onChange={(e) => setCollaboratorRole(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecione um papel</option>
                  
                  {selectedUser?.role === 'STUDENT' && (
                    <optgroup label="Papéis de Estudante">
                      {roles.student.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {selectedUser?.role === 'ADVISOR' && (
                    <optgroup label="Papéis de Orientador">
                      {roles.advisor.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  <optgroup label="Outros Papéis">
                    {roles.other.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Permission Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Permissão *
                </label>
                <div className="space-y-2">
                  {permissions.map((perm) => (
                    <label key={perm.value} className="flex items-start">
                      <input
                        type="radio"
                        name="permission"
                        value={perm.value}
                        checked={permission === perm.value}
                        onChange={(e) => setPermission(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{perm.label}</div>
                        <div className="text-sm text-gray-500">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mensagem opcional para o convite..."
                  className="input-field"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep('search')}
                  className="btn btn-secondary"
                >
                  Voltar
                </button>
                <div className="space-x-2">
                  <button
                    onClick={onClose}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCollaborator}
                    className="btn btn-primary"
                    disabled={!collaboratorRole || !permission}
                  >
                    Adicionar Colaborador
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCollaboratorModal;