import api from './api';

const commentService = {
  createComment: async (commentData) => {
    const response = await api.post('/comments', commentData);
    return response.data;
  },
  
  getComment: async (id) => {
    const response = await api.get(`/comments/${id}`);
    return response.data;
  },
  
  getCommentsByVersion: async (versionId) => {
    const response = await api.get(`/comments/version/${versionId}`);
    return response.data;
  },
  
  getResolvedCommentsByVersion: async (versionId, resolved = false) => {
    const response = await api.get(`/comments/version/${versionId}/resolved?resolved=${resolved}`);
    return response.data;
  },
  
  getMyComments: async (page = 0, size = 10) => {
    const response = await api.get(`/comments/my?page=${page}&size=${size}`);
    return response.data;
  },
  
  getCommentsByPosition: async (versionId, startPos, endPos) => {
    const response = await api.get(`/comments/version/${versionId}/position?startPos=${startPos}&endPos=${endPos}`);
    return response.data;
  },
  
  updateComment: async (id, commentData) => {
    const response = await api.put(`/comments/${id}`, commentData);
    return response.data;
  },
  
  resolveComment: async (id) => {
    const response = await api.put(`/comments/${id}/resolve`);
    return response.data;
  },
  
  deleteComment: async (id) => {
    await api.delete(`/comments/${id}`);
  }
};

export default commentService;