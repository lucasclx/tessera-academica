// frontend/src/services/api.jsx
import axios from 'axios';

// Configurações usando variáveis de ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';
const ENABLE_LOGS = import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Função para log condicional
const conditionalLog = (message, data = null) => {
  if (ENABLE_LOGS) {
    console.log(`[API] ${message}`, data || '');
  }
};

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (DEBUG_MODE) {
      conditionalLog(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    conditionalLog('Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros de resposta
api.interceptors.response.use(
  (response) => {
    if (DEBUG_MODE) {
      conditionalLog(`Response: ${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  (error) => {
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };
    
    conditionalLog('Response Error:', errorInfo);
    
    // Redireciona para login em caso de erro 401
    if (error.response && error.response.status === 401) {
      conditionalLog('Token inválido ou expirado. Redirecionando para login...');
      localStorage.removeItem('token');
      
      // Evitar redirecionamento em loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Rate limiting ou outros erros do servidor
    if (error.response && error.response.status === 429) {
      console.warn('[API] Rate limit atingido. Tente novamente em alguns segundos.');
    }
    
    // Timeout
    if (error.code === 'ECONNABORTED') {
      console.warn(`[API] Timeout após ${API_TIMEOUT}ms`);
    }
    
    return Promise.reject(error);
  }
);

// Exportar configurações para uso em outros lugares
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  debugMode: DEBUG_MODE
};

export default api;