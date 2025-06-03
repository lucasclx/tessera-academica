export const OPTIMIZATION_CONFIG = {
  // Rate Limiting
  RATE_LIMITS: {
    GET: { max: 30, window: 60000 },    // 30 GETs por minuto
    POST: { max: 15, window: 60000 },   // 15 POSTs por minuto  
    PUT: { max: 10, window: 60000 },    // 10 PUTs por minuto
    DELETE: { max: 5, window: 60000 },  // 5 DELETEs por minuto
  },

  // Cache TTLs (em milissegundos)
  CACHE_TTL: {
    STATS: 30000,          // 30 segundos
    USERS: 60000,          // 1 minuto
    DOCUMENTS: 120000,     // 2 minutos
    NOTIFICATIONS: 30000,  // 30 segundos
    DEFAULT: 300000,       // 5 minutos
  },

  // Debounce delays
  DEBOUNCE: {
    SEARCH: 500,           // 500ms para busca
    FORM_VALIDATION: 300,  // 300ms para validação
    AUTO_SAVE: 2000,       // 2s para auto-save
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,   // 1 segundo
    MAX_DELAY: 30000,      // 30 segundos
    BACKOFF_FACTOR: 2,     // Exponential backoff
  },

  // Timeouts
  TIMEOUTS: {
    DEFAULT: 30000,        // 30 segundos
    UPLOAD: 60000,         // 1 minuto para uploads
    HEALTH_CHECK: 5000,    // 5 segundos para health check
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },

  // Performance
  PERFORMANCE: {
    ENABLE_CACHE: true,
    ENABLE_DEBOUNCE: true,
    ENABLE_VIRTUALIZATION: false, // Para listas muito grandes
    LAZY_LOAD_IMAGES: true,
  }
};