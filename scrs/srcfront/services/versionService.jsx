import api from './api';

const versionService = {
  createVersion: async (versionData) => {
    const response = await api.post('/versions', versionData);
    return response.data;
  },
  
  getVersion: async (id) => {
    const response = await api.get(`/versions/${id}`);
    return response.data;
  },
  
  getVersionsByDocument: async (documentId) => {
    const response = await api.get(`/versions/document/${documentId}`);
    return response.data;
  },
  
  getVersionsByDocumentPaged: async (documentId, page = 0, size = 10) => {
    const response = await api.get(`/versions/document/${documentId}/paged?page=${page}&size=${size}`);
    return response.data;
  },
  
  getVersionHistory: async (documentId) => {
    const response = await api.get(`/versions/document/${documentId}/history`);
    return response.data;
  },
  
  getDiffBetweenVersions: async (v1Id, v2Id) => {
    const response = await api.get(`/versions/diff/${v1Id}/${v2Id}`);
    return response.data;
  }
};

export default versionService;