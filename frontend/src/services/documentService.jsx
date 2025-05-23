import api from './api';

const documentService = {
  createDocument: async (documentData) => {
    try {
      console.log('Criando documento:', documentData);
      if (!documentData.title || !documentData.title.trim()) {
        throw new Error('Título do documento é obrigatório');
      }
      if (!documentData.studentId) {
        throw new Error('ID do estudante é obrigatório');
      }
      if (!documentData.advisorId) { // Assumindo que orientador é obrigatório na criação
        throw new Error('Orientador é obrigatório');
      }
      const response = await api.post('/documents', documentData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar documento:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getDocument: async (id) => {
    try {
      if (!id && id !== 0) throw new Error(`ID de documento inválido fornecido: ${id}`);
      if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        throw new Error(`ID de documento string inválido fornecido: "${id}"`);
      }
      const response = await api.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar documento com ID ${id}:`, error.response?.data || error.message);
      throw error; 
    }
  },
  
  // Ajustado para buscar documentos do estudante com filtros, paginação e ordenação
  getMyDocumentsPaged: async (page = 0, size = 10, searchTerm = '', statusFilter = 'ALL', sortBy = 'updatedAt', sortOrder = 'desc') => {
    try {
      const params = new URLSearchParams({
        page,
        size,
        sort: `${sortBy},${sortOrder}`
      });
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      
      console.log(`Buscando documentos do estudante: /documents/student?${params.toString()}`);
      const response = await api.get(`/documents/student?${params.toString()}`);
      return response.data; // Espera-se um objeto Page do Spring (content, totalElements, etc.)
    } catch (error) {
      console.error('Erro ao buscar documentos paginados do estudante:', error.response?.data || error.message);
      throw error;
    }
  },
  
  // Ajustado para buscar documentos de orientação com filtros, paginação e ordenação
  getMyAdvisingDocumentsPaged: async (page = 0, size = 10, searchTerm = '', statusFilter = 'ALL', sortBy = 'updatedAt', sortOrder = 'desc') => {
    try {
      const params = new URLSearchParams({
        page,
        size,
        sort: `${sortBy},${sortOrder}`
      });
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);

      console.log(`Buscando documentos de orientação: /documents/advisor?${params.toString()}`);
      const response = await api.get(`/documents/advisor?${params.toString()}`);
      return response.data; // Espera-se um objeto Page do Spring
    } catch (error) {
      console.error('Erro ao buscar documentos de orientação paginados:', error.response?.data || error.message);
      throw error;
    }
  },
  
  updateDocument: async (id, documentData) => {
    try {
      if (!id && id !== 0) throw new Error(`ID de documento inválido para atualização: ${id}`);
      if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        throw new Error(`ID de documento string inválido para atualização: "${id}"`);
      }
      if (!documentData) throw new Error('Dados do documento são obrigatórios para atualização');
      
      const response = await api.put(`/documents/${id}`, documentData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar documento com ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  changeStatus: async (id, status, reason = null) => {
    try {
      if (!id && id !== 0) throw new Error(`ID de documento inválido para alteração de status: ${id}`);
      if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        throw new Error(`ID de documento string inválido para alteração de status: "${id}"`);
      }
      if (!status || !status.trim()) throw new Error('Status é obrigatório para alteração');
      
      // A API espera /documents/{id}/status/{status}
      // O 'reason' é enviado no corpo se existir.
      const payload = reason ? { reason } : {}; // Spring Boot espera um JSON, mesmo que vazio.
      const response = await api.put(`/documents/${id}/status/${status}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Erro ao alterar status do documento ID ${id} para ${status}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  deleteDocument: async (id) => {
    try {
      if (!id && id !== 0) throw new Error(`ID de documento inválido para exclusão: ${id}`);
      if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        throw new Error(`ID de documento string inválido para exclusão: "${id}"`);
      }
      await api.delete(`/documents/${id}`);
      return { success: true, message: `Documento com ID ${id} excluído com sucesso.` };
    } catch (error) {
      console.error(`Erro ao excluir documento com ID ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }
};

export default documentService;