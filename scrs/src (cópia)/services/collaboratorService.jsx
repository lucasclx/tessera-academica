// Arquivo: scrs/src (cópia)/services/collaboratorService.jsx
// frontend/src/services/collaboratorService.js
import { api } from './index.js'; // Supondo que api já está configurado em index.js

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
      permission: permission // O backend espera um objeto com a propriedade 'permission'
    });
    return response.data;
  },
  
  // Atualizar papel do colaborador
  updateRole: async (documentId, collaboratorId, role) => {
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/role`, {
        role: role // O backend pode esperar um objeto ou diretamente o valor do enum
    });
    return response.data;
  },

  // Promover colaborador a principal
  promoteToPrimary: async (documentId, collaboratorId) => {
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/promote`);
    return response.data;
  },


  // Migrar documentos existentes (admin)
  migrateExistingDocuments: async () => {
    const response = await api.post('/documents/migrate/collaborators'); // Endpoint de migração
    return response.data;
  },

  // Buscar usuários disponíveis para adicionar como colaboradores
  searchUsers: async (query, role = null, excludeDocumentId = null) => {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (role) params.append('role', role);
    if (excludeDocumentId) params.append('excludeDocument', excludeDocumentId);
    
    const response = await api.get(`/users/search/collaborators?${params.toString()}`);
    return response.data;
  },

  // Verificar se usuário pode gerenciar colaboradores (exemplo, o backend deve implementar)
  canManageCollaborators: async (documentId) => {
    try {
      // Este endpoint é hipotético, o backend precisaria fornecer uma forma de verificar
      // as permissões de gerenciamento do usuário atual para o documento.
      // Poderia ser parte dos dados do documento ou um endpoint específico.
      const response = await api.get(`/documents/${documentId}/collaborators/permissions`); // Exemplo
      return response.data.canManage || false; // Supondo que a resposta tenha um campo 'canManage'
    } catch (error) {
      console.warn("Erro ao verificar permissões de gerenciamento de colaboradores", error);
      return false; // Assumir que não pode gerenciar em caso de erro
    }
  },

  // Obter permissões do usuário atual no documento
  getCurrentUserPermissions: async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/my-permissions`);
      return response.data; // Espera-se um objeto como { canRead: bool, canWrite: bool, canManage: bool }
    } catch (error) {
      console.error("Erro ao buscar permissões do usuário no documento:", error);
      // Retorna um objeto de permissões padrão (sem acesso) em caso de erro.
      return {
        canRead: false,
        canWrite: false,
        canManage: false
      };
    }
  }
};

// Extensão do userService para buscar usuários (poderia estar em seu próprio arquivo userService.js)
export const userService = { // Exportando como userService
  // Buscar estudantes aprovados
  getApprovedStudents: async () => {
    try {
      const response = await api.get('/users/students'); // Endpoint para buscar estudantes aprovados
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estudantes:', error);
      return []; // Retornar array vazio em caso de erro
    }
  },

  // Buscar orientadores aprovados
  getApprovedAdvisors: async () => {
    const response = await api.get('/users/advisors'); // Endpoint para buscar orientadores aprovados
    return response.data;
  },

  // Buscar usuários por termo de pesquisa (exemplo de endpoint genérico)
  searchUsersGeneric: async (searchTerm, role = null) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (role) params.append('role', role); // Ex: 'STUDENT', 'ADVISOR'
    
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
      return response.data; // Espera-se algo como { exists: true, id: 123, name: "Nome" } ou { exists: false }
    } catch (error) {
      // Se o backend retornar 404 para email não encontrado, axios pode lançar erro.
      // Adaptar conforme a resposta do backend para email não existente.
      if (error.response && error.response.status === 404) {
        return { exists: false };
      }
      console.error('Erro ao verificar email:', error);
      return { exists: false, error: true }; // Indicar erro na verificação
    }
  }
};