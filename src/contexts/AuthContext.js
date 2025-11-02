import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Token validation function
  const validateToken = async (token) => {
    try {
      // Set token in headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to make a test API call to validate token
      const response = await api.get('/auth/validate'); // හෝ ඔබේ protected endpoint එකක්
      return response.status === 200;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        console.log('Found token in localStorage, validating...');
        
        // Validate token with backend
        const isValid = await validateToken(token);
        
        if (isValid) {
          setIsAuthenticated(true);
          setUser({ username: 'admin' }); // Backend එකෙන් user data ගන්න පුළුවන්
          console.log('Token is valid, user authenticated');
        } else {
          // Token invalid නම් clear කරන්න
          console.log('Token is invalid, clearing localStorage');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Attempting login for user:', username);
      const response = await api.post('/auth/login', { username, password });
      
      console.log('Full login response:', response.data);

      // Check different possible property names for the token
      const token = response.data.token ||
                   response.data.accessToken ||
                   response.data.jwt ||
                   response.data.authToken;

      console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

      if (token) {
        // Save token
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user data
        const userData = response.data.user || { username };
        setUser(userData);
        setIsAuthenticated(true);

        console.log('Login successful');
        return { success: true };
      } else {
        console.error('No token found in response. Response data:', response.data);
        return {
          success: false,
          message: 'Login failed - no token received from server'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error scenarios
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Network error
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  // Axios interceptor for handling token expiry
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && isAuthenticated) {
          console.log('Token expired or invalid, logging out');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [isAuthenticated]);

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};