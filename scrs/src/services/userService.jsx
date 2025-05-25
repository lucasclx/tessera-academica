import api from './api';

const userService = {
  getApprovedAdvisors: async () => {
    try {
      // Certifique-se de que o endpoint no backend seja /api/users/advisors
      // ou ajuste aqui conforme o endpoint definido no UserController.java
      const response = await api.get('/users/advisors'); 
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar orientadores aprovados:', error.response?.data || error.message);
      // Lançar o erro para que o componente que chamou possa tratá-lo (ex: exibir toast)
      throw error;
    }
  },

  // Outras funções de serviço relacionadas a usuários podem ser adicionadas aqui
  // Ex: getUserProfile, updateProfile, etc.
};

export default userService;