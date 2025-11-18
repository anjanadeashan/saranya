/**
 * Application Configuration
 * Centralizes all environment variables and app settings
 */

const config = {
  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'https://api.saranyainternational.online',
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  },

  // Application Settings
  app: {
    name: process.env.REACT_APP_NAME || 'Saranya International',
    version: process.env.REACT_APP_VERSION || '1.0.0',
  },

  // Authentication Settings
  auth: {
    tokenStorageKey: process.env.REACT_APP_TOKEN_STORAGE_KEY || 'token',
    sessionTimeout: parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 24, // hours
  },

  // Feature Flags
  features: {
    enableDebugLogging: process.env.REACT_APP_ENABLE_DEBUG_LOGGING === 'true',
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  },

  // UI Settings
  ui: {
    toastAutoClose: parseInt(process.env.REACT_APP_TOAST_AUTO_CLOSE) || 3000,
    paginationSize: parseInt(process.env.REACT_APP_PAGINATION_SIZE) || 10,
  },

  // Environment Detection
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  }
};

// Validation function
export const validateConfig = () => {
  const errors = [];
  
  if (!config.api.baseURL) {
    errors.push('API Base URL is required');
  }
  
  if (!config.api.baseURL.startsWith('http')) {
    errors.push('API Base URL must start with http or https');
  }
  
  if (config.api.timeout < 1000) {
    errors.push('API timeout should be at least 1000ms');
  }
  
  return errors;
};

// Debug helper
export const debugLog = (message, data) => {
  if (config.features.enableDebugLogging) {
    console.log(`[${config.app.name}] ${message}`, data);
  }
};

export default config;