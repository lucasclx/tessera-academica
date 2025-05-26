// frontend/src/services/collaboratorService.js
import { api } from './index.js';

export const collaboratorService = {
  // Listar colaboradores de um documento
  getDocumentCollaborators: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/collaborators`);
    return response.data;
  },

  // Adicionar colaborador
  addCollaborator: async (documentId, collaboratorData) => {
    const response = await api.post(`/documents/${documentId}/collaborators`, collaboratorData);
    return response.data;
  },

  // Remover colaborador
  removeCollaborator: async (documentId, collaboratorId) => {
    await api.delete(`/documents/${documentId}/collaborators/${collaboratorId}`);
    return { success: true };
  },

  // Atualizar permissões
  updatePermissions: async (documentId, collaboratorId, permission) => {
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/permissions`, {
      permission: permission
    });
    return response.data;
  },

  // Migrar documentos existentes (admin)
  migrateExistingDocuments: async () => {
    const response = await api.post('/documents/migrate/collaborators');
    return response.data;
  },

  // Buscar usuários disponíveis para adicionar como colaboradores
  searchUsers: async (query, role = null) => {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (role) params.append('role', role);
    
    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  },

  // Verificar se usuário pode gerenciar colaboradores
  canManageCollaborators: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/collaborators/permissions`);
      return response.data.canManage || false;
    } catch (error) {
      return false;
    }
  },

  // Obter permissões do usuário atual no documento
  getCurrentUserPermissions: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/my-permissions`);
      return response.data;
    } catch (error) {
      return {
        canRead: false,
        canWrite: false,
        canManage: false
      };
    }
  }
};

// Extensão do userService para buscar usuários
export const extendedUserService = {
  // Buscar estudantes aprovados
  getApprovedStudents: async () => {
    try {
      const response = await api.get('/users/students');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estudantes:', error);
      return [];
    }
  },

  // Buscar orientadores aprovados (já existe no userService)
  getApprovedAdvisors: async () => {
    const response = await api.get('/users/advisors');
    return response.data;
  },

  // Buscar usuários por termo de pesquisa
  searchUsers: async (searchTerm, role = null) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (role) params.append('role', role);
    
    try {
      const response = await api.get(`/users/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  // Verificar se usuário existe por email
  checkUserByEmail: async (email) => {
    try {
      const response = await api.get(`/users/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      return { exists: false };
    }
  }
};