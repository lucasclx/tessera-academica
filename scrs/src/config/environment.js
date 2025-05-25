// frontend/src/config/environment.js
export const config = {
  // API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8080/api/ws',
  
  // App
  appName: import.meta.env.VITE_APP_NAME || 'Tessera Acadêmica',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appDescription: import.meta.env.VITE_APP_DESCRIPTION || 'Sistema de Gestão de Monografias',
  
  // Development
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  enableLogs: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
  
  // Timeouts
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  websocketReconnectDelay: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_DELAY) || 5000,
  websocketMaxReconnectAttempts: parseInt(import.meta.env.VITE_WEBSOCKET_MAX_RECONNECT_ATTEMPTS) || 5,
  
  // Features
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE
};

export default config;