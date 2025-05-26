import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp > currentTime) {
            const user = {
              id: decodedToken.id,
              name: decodedToken.name,
              email: decodedToken.sub,
              roles: decodedToken.roles.split(',')
            };
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, []);
  
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login(email, password);
      const { token, id, name, roles } = response;
      
      localStorage.setItem('token', token);
      const user = { id, name, email, roles };
      setCurrentUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao realizar login');
      throw error;
    }
  };
  
  const register = async (userData) => {
    setError(null);
    try {
      return await authService.register(userData);
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao realizar cadastro');
      throw error;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };
  
  const hasRole = (role) => {
    return currentUser?.roles?.includes(`ROLE_${role}`) || false;
  };
  
  return (
    <AuthContext.Provider value={{
      currentUser, isAuthenticated, isLoading, error,
      login, register, logout, hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};