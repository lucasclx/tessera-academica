import api from './api';

const documentService = {
  createDocument: async (documentData) => {
    try {
      console.log('Criando documento:', documentData);
      
      // Validação dos dados antes de enviar
      if (!documentData.title || !documentData.title.trim()) {
        throw new Error('Título do documento é obrigatório');
      }
      
      if (!documentData.studentId) {
        // O ID do estudante geralmente é obtido do token no backend, mas se for enviado explicitamente:
        throw new Error('ID do estudante é obrigatório');
      }
      // Outras validações podem ser adicionadas aqui, como advisorId se for obrigatório
      
      const response = await api.post('/documents', documentData);
      console.log('Documento criado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar documento:', error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error; // Re-lança o erro para ser tratado pelo chamador
    }
  },
  
  getDocument: async (id) => {
    try {
      // Validação do ID antes de fazer a requisição
      if (!id && id !== 0) { // Permite ID 0 se for um caso válido no seu sistema
        console.error(`Tentativa de buscar documento com ID nulo ou undefined: ${id}`);
        throw new Error(`ID de documento inválido fornecido: ${id}`);
      }
      
      if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        console.error(`Tentativa de buscar documento com ID string inválido: "${id}"`);
        throw new Error(`ID de documento string inválido fornecido: "${id}"`);
      }

      console.log(`Buscando documento com ID: ${id}`);
      const response = await api.get(`/documents/${id}`);
      console.log(`Documento com ID ${id} buscado com sucesso:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar documento com ID ${id}:`, error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
        if (error.response.status === 404) {
          throw new Error(`Documento com ID ${id} não encontrado.`);
        }
      }
      throw error; 
    }
  },
  
  getMyDocuments: async () => {
    try {
      console.log('Buscando documentos do estudante autenticado...');
      const response = await api.get('/documents/student');
      console.log('Documentos do estudante buscados com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos do estudante:', error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  getMyAdvisingDocuments: async () => {
    try {
      console.log('Buscando documentos de orientação do orientador autenticado...');
      const response = await api.get('/documents/advisor');
      console.log('Documentos de orientação buscados com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos de orientação:', error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  getMyDocumentsPaged: async (page = 0, size = 10) => {
    try {
      console.log(`Buscando documentos paginados do estudante: página ${page}, tamanho ${size}`);
      const response = await api.get(`/documents/student/paged?page=${page}&size=${size}`);
      console.log('Documentos paginados do estudante buscados com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos paginados do estudante:', error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  getMyAdvisingDocumentsPaged: async (page = 0, size = 10) => {
    try {
      console.log(`Buscando documentos de orientação paginados: página ${page}, tamanho ${size}`);
      const response = await api.get(`/documents/advisor/paged?page=${page}&size=${size}`);
      console.log('Documentos de orientação paginados buscados com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar documentos de orientação paginados:', error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  updateDocument: async (id, documentData) => {
    try {
      if (!id && id !== 0) {
        console.error(`Tentativa de atualizar documento com ID nulo ou undefined: ${id}`);
        throw new Error(`ID de documento inválido fornecido para atualização: ${id}`);
      }
      if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        console.error(`Tentativa de atualizar documento com ID string inválido: "${id}"`);
        throw new Error(`ID de documento string inválido fornecido para atualização: "${id}"`);
      }
      if (!documentData) {
        throw new Error('Dados do documento são obrigatórios para atualização');
      }
      if (documentData.title !== undefined && (documentData.title === null || !documentData.title.trim())) {
        throw new Error('Título do documento não pode ser vazio se fornecido para atualização');
      }
      
      console.log(`Atualizando documento com ID: ${id}, Dados:`, documentData);
      const response = await api.put(`/documents/${id}`, documentData);
      console.log(`Documento com ID ${id} atualizado com sucesso:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar documento com ID ${id}:`, error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  changeStatus: async (id, status, reason = null) => {
    try {
      if (!id && id !== 0) {
        console.error(`Tentativa de alterar status com ID nulo ou undefined: ${id}`);
        throw new Error(`ID de documento inválido fornecido para alteração de status: ${id}`);
      }
      if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        console.error(`Tentativa de alterar status com ID string inválido: "${id}"`);
        throw new Error(`ID de documento string inválido fornecido para alteração de status: "${id}"`);
      }
      if (!status || !status.trim()) {
        throw new Error('Status é obrigatório para alteração');
      }
      
      // A API espera /documents/{id}/status/{status} e o 'reason' no corpo se houver.
      console.log(`Alterando status do documento ID ${id} para ${status}. Motivo: ${reason}`);
      const payload = reason ? { reason } : {};
      const response = await api.put(`/documents/${id}/status/${status}`, payload);
      console.log(`Status do documento ID ${id} alterado com sucesso para ${status}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Erro ao alterar status do documento ID ${id} para ${status}:`, error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  deleteDocument: async (id) => {
    try {
      if (!id && id !== 0) {
        console.error(`Tentativa de excluir documento com ID nulo ou undefined: ${id}`);
        throw new Error(`ID de documento inválido fornecido para exclusão: ${id}`);
      }
       if (typeof id === 'string' && (id.toLowerCase() === 'undefined' || id.toLowerCase() === 'null' || id.trim() === '')) {
        console.error(`Tentativa de excluir documento com ID string inválido: "${id}"`);
        throw new Error(`ID de documento string inválido fornecido para exclusão: "${id}"`);
      }

      console.log(`Excluindo documento com ID: ${id}`);
      await api.delete(`/documents/${id}`);
      console.log(`Documento com ID ${id} excluído com sucesso.`);
      // DELETE requests typically don't return a body in the response,
      // so returning a success message or status might be appropriate if needed by the caller.
      return { success: true, message: `Documento com ID ${id} excluído com sucesso.` };
    } catch (error) {
      console.error(`Erro ao excluir documento com ID ${id}:`, error.response?.data || error.message);
      if (error.response) {
        console.error('Detalhes do erro da API:', error.response.status, error.response.data);
      }
      throw error;
    }
  }
};

export default documentService;