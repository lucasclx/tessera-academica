import api from './api';

const documentService = {
  createDocument: async (documentData) => {
    const response = await api.post('/documents', documentData);
    return response.data;
  },
  
  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  
  getMyDocuments: async () => {
    const response = await api.get('/documents/student');
    return response.data;
  },
  
  getMyAdvisingDocuments: async () => {
    const response = await api.get('/documents/advisor');
    return response.data;
  },
  
  getMyDocumentsPaged: async (page = 0, size = 10) => {
    const response = await api.get(`/documents/student/paged?page=${page}&size=${size}`);
    return response.data;
  },
  
  getMyAdvisingDocumentsPaged: async (page = 0, size = 10) => {
    const response = await api.get(`/documents/advisor/paged?page=${page}&size=${size}`);
    return response.data;
  },
  
  updateDocument: async (id, documentData) => {
    const response = await api.put(`/documents/${id}`, documentData);
    return response.data;
  },
  
  changeStatus: async (id, status, reason = null) => {
    const response = await api.put(`/documents/${id}/status/${status}`, reason);
    return response.data;
  },
  
  deleteDocument: async (id) => {
    await api.delete(`/documents/${id}`);
  }
};

export default documentService;