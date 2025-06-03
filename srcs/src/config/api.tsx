import { OPTIMIZATION_CONFIG } from './optimization';

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  TIMEOUT: OPTIMIZATION_CONFIG.TIMEOUTS.DEFAULT,
  
  // Endpoints que não devem ser cacheados
  NO_CACHE_ENDPOINTS: [
    '/auth/login',
    '/auth/logout', 
    '/health',
  ],

  // Endpoints que requerem rate limiting mais restritivo
  RESTRICTED_ENDPOINTS: [
    '/admin/users/*/status',
    '/documents/*/collaborators',
  ],

  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
