// Arquivo: scrs/src (cópia)/services/collaboratorService.jsx
import { api } from './index.jsx';

export const collaboratorService = {
  getDocumentCollaborators: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/collaborators`);
    return response.data;
  },

  addCollaborator: async (documentId, collaboratorData) => {
    // Backend espera: userEmail, role, permission, message
    const response = await api.post(`/documents/${documentId}/collaborators`, collaboratorData);
    return response.data;
  },

  removeCollaborator: async (documentId, collaboratorId) => {
    await api.delete(`/documents/${documentId}/collaborators/${collaboratorId}`);
    return { success: true };
  },

  updatePermissions: async (documentId, collaboratorId, permission) => {
    // O backend em DocumentCollaboratorController espera @RequestBody CollaboratorPermission newPermission
    // Isso significa que o payload deve ser a string do enum, não um objeto JSON.
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/permissions`, permission, {
        headers: { 'Content-Type': 'application/json' } // Garantir que o backend entenda como JSON cru
    });
    return response.data;
  },
  
  updateRole: async (documentId, collaboratorId, role) => {
    // Similar ao updatePermissions, o backend espera @RequestBody CollaboratorRole newRole
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/role`, role, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  },

  promoteToPrimary: async (documentId, collaboratorId) => {
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/promote`);
    return response.data;
  },

  searchUsers: async (query, role = null, excludeDocumentId = null) => {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (role) params.append('role', role);
    if (excludeDocumentId) params.append('excludeDocument', excludeDocumentId); // Nome do parâmetro no backend
    
    // Endpoint no backend é /api/users/search/collaborators
    const response = await api.get(`/users/search/collaborators?${params.toString()}`);
    return response.data;
  },

  getCurrentUserPermissions: async (documentId) => {
    try {
      // O backend não possui /my-permissions, mas a lógica de permissão está em Document e DocumentCollaborator.
      // O DocumentDetailDTO já calcula canEdit, canManageCollaborators etc.
      // Para obter essas permissões, uma opção seria buscar o DocumentDetailDTO.
      // Por simplicidade, vamos assumir que o backend adicionará um endpoint /documents/{documentId}/my-permissions
      // ou que essa lógica será adaptada para usar o DocumentDetailDTO.
      // Por ora, simularemos uma resposta ou você precisará adicionar este endpoint no backend.
      // Temporariamente, vamos assumir que o backend pode retornar algo como:
      const response = await api.get(`/documents/${documentId}/my-permissions`); // Este endpoint precisa existir no backend
      return response.data; 
    } catch (error) {
      console.error("Erro ao buscar permissões do usuário no documento:", error);
      // Retorna um objeto de permissões padrão (sem acesso) em caso de erro.
      // Isso pode acontecer se o endpoint /my-permissions não existir.
      const docData = await api.get(`/documents/${documentId}`);
      if (docData?.data?.canManageCollaborators !== undefined) { // Se o DTO principal já tiver
          return {
              canRead: true, // Se conseguiu ler o doc, pode ler
              canWrite: docData.data.canEdit || false,
              canManage: docData.data.canManageCollaborators || false
          };
      }
      return {
        canRead: false,
        canWrite: false,
        canManage: false
      };
    }
  },
  // O userService está dentro deste arquivo, o que é um pouco incomum mas funcional.
  // Se fossem separados, userService.getApprovedAdvisors() seria importado de outro lugar.
  getApprovedAdvisors: async () => {
    const response = await api.get('/users/advisors');
    return response.data;
  },
  getApprovedStudents: async () => {
    const response = await api.get('/users/students');
    return response.data;
  }
};

// userService exportado para uso em outros lugares se necessário, mas getApprovedAdvisors/Students são usados internamente acima.
export const userService = {
  getApprovedAdvisors: collaboratorService.getApprovedAdvisors,
  getApprovedStudents: collaboratorService.getApprovedStudents,
  // Outros métodos do userService podem ser adicionados aqui se migrados de services/index.jsx
};