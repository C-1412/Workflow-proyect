import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AuthResponse, LoginData, User } from '../services/auth';
import { authAPI } from '../services/auth';

interface AuthContextType {
  user: User | null;
  login: (loginData: LoginData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Constants for localStorage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Error messages
const ERROR_MESSAGES = {
  CONTEXT: 'useAuth debe usarse dentro de un AuthProvider',
  AUTH_CHECK: 'Error verificando autenticación',
  LOGIN: 'Error en el proceso de autenticación',
} as const;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(ERROR_MESSAGES.CONTEXT);
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const { user, isAuthenticated, isLoading } = authState;

  const updateAuthState = useCallback((updates: Partial<AuthState>): void => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearAuthData = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }, []);

  const checkAuth = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (!token) {
      updateAuthState({ isLoading: false });
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser();
      updateAuthState({ 
        user: userData, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      console.error(ERROR_MESSAGES.AUTH_CHECK, error);
      clearAuthData();
      updateAuthState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  }, [updateAuthState, clearAuthData]);

  const login = useCallback(async (loginData: LoginData): Promise<void> => {
    try {
      const response: AuthResponse = await authAPI.login(loginData);
      
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh);
      
      updateAuthState({ 
        user: response.user, 
        isAuthenticated: true 
      });
    } catch (error) {
      console.error(ERROR_MESSAGES.LOGIN, error);
      // Clear any potentially stored tokens on login failure
      clearAuthData();
      throw error;
    }
  }, [updateAuthState, clearAuthData]);

  const logout = useCallback((): void => {
    clearAuthData();
    updateAuthState({ 
      user: null, 
      isAuthenticated: false 
    });
  }, [clearAuthData, updateAuthState]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const contextValue = useMemo((): AuthContextType => ({
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    checkAuth,
  }), [
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    checkAuth,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};