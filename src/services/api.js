import axios from 'axios';
import { toast } from 'react-toastify';

// Configuration from environment variables
const config = {
  baseURL: process.env.REACT_APP_API_URL || 'https://api.saranyainternational.online',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
  enableDebugLogging: process.env.REACT_APP_ENABLE_DEBUG_LOGGING === 'true',
};

const api = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug logging helper
const debugLog = (message, data) => {
  if (config.enableDebugLogging) {
    console.log(`[API Debug] ${message}`, data);
  }
};


// Add this to your api.js request interceptor
api.interceptors.request.use(
  (config) => {
    const tokenKey = process.env.REACT_APP_TOKEN_STORAGE_KEY || 'token';
    const token = localStorage.getItem(tokenKey);
    
    debugLog('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      debugLog('Authorization header set:', config.headers.Authorization.substring(0, 30) + '...');
    }
    
    debugLog('Request config:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });
    
    return config;
  },
  (error) => {
    debugLog('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    debugLog('Response received:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  (error) => {
    debugLog('Response error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      const tokenKey = process.env.REACT_APP_TOKEN_STORAGE_KEY || 'token';
      localStorage.removeItem(tokenKey);
      window.location.href = '/login';
    } else if (error.response?.status === 500) {
      toast.error('Server error occurred. Please try again.');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export configuration and API instance
export { config };
export default api;