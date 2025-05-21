import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    // Decodificar token e retornar usuário
    // Implementação depende da biblioteca específica
    return null;
  }
};

export default authService;