// AuthContext.tsx - Context y Hook para gestión de autenticación
// CORREGIDO: Integración completa con auth-service mejorado

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth-service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => void;
  // Compatibilidad con componentes existentes
  currentUser: User | null;
  loading: boolean;
  signOut: () => void;
  refreshUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verificar autenticación al cargar - SOLO UNA VEZ
  useEffect(() => {
    checkAuth();
  }, []); // Sin dependencias para evitar re-ejecuciones

  const checkAuth = async () => {
    // SOLO EJECUTAR SI NO ESTAMOS YA CARGANDO
    if (isLoading) return;
    
    console.log(' AuthContext: Verificando autenticación...');
    setIsLoading(true);
    
    try {
      const storedToken = authService.getToken();
      const storedUser = authService.getUser();
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        console.log(' AuthContext: Usuario autenticado desde localStorage');
      } else {
        // Limpiar datos si no hay token válido
        authService.clearAuth();
        setToken(null);
        setUser(null);
        console.log('️ AuthContext: No hay autenticación válida');
      }
    } catch (error) {
      console.error(' AuthContext: Error al verificar autenticación:', error);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log(' AuthContext: Iniciando login desde contexto...');
      
      const response = await authService.login(email, password);
      
      // Actualizar estado del contexto
      setToken(response.token);
      setUser(response.user);
      
      console.log(' AuthContext: Login completado en contexto');
      
      // Redirección inmediata después del login exitoso
      setTimeout(() => {
        console.log(' Redirigiendo al dashboard...');
        window.location.href = '/dashboard';
      }, 500); // Aumentar tiempo para evitar race conditions
      
    } catch (error) {
      console.error(' AuthContext: Error en login desde contexto:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log(' AuthContext: Iniciando registro desde contexto...');
      
      await authService.register(userData);
      
      console.log(' AuthContext: Registro completado en contexto');
      return { success: true };
    } catch (error: any) {
      console.error(' AuthContext: Error en registro desde contexto:', error);
      return { success: false, error: error.message || 'Error en el registro' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    console.log(' AuthContext: Logout desde contexto...');
    
    authService.logout();
    setToken(null);
    setUser(null);
    
    console.log(' AuthContext: Logout completado en contexto');
  };

  // Métodos de compatibilidad
  const refreshUser = async (): Promise<boolean> => {
    try {
      await checkAuth();
      return !!user;
    } catch (error) {
      console.error(' AuthContext: Error en refresh:', error);
      return false;
    }
  };

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    // Compatibilidad con componentes existentes
    currentUser: user,
    loading: isLoading,
    signOut: logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// ==========================================
// COMPONENTE DE RUTA PROTEGIDA
// ==========================================

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return <>{children}</>;
};

// ==========================================
// COMPONENTE DE VERIFICACIÓN DE AUTH
// ==========================================

export const AuthChecker: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2"> Estado de Autenticación</h3>
      <div className="space-y-1 text-xs">
        <div className={`flex items-center gap-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
          <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {isAuthenticated ? 'Autenticado' : 'No autenticado'}
        </div>
        <div className="text-gray-600">
          Usuario: {user ? `${user.firstName} ${user.lastName}` : 'Ninguno'}
        </div>
        <div className="text-gray-600">
          Token: {token ? 'Presente' : 'Ausente'}
        </div>
        <div className="text-gray-600">
          LocalStorage Token: {typeof window !== 'undefined' && localStorage.getItem('intertravel_token') ? 'Presente' : 'Ausente'}
        </div>
      </div>
    </div>
  );
};