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
    const response = await api.put(`/documents/${documentId}/collaborators/${collaboratorId}/permissions`, permission);
    return response.data;
  },

  // Migrar documentos existentes (admin)
  migrateExistingDocuments: async () => {
    const response = await api.post('/documents/migrate/collaborators');
    return response.data;
  }
};