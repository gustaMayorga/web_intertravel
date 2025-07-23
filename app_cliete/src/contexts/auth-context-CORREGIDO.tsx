// Fixed Auth Context - Eliminando bucles de redirección
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, type AuthResult } from '@/services/auth-service';
import { User } from '@/services/api-client';
import { ExtendedUser } from '@/types';

interface AuthContextType {
  currentUser: ExtendedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (firstName: string, lastName: string, email: string, phone: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  signOut: () => void;
  refreshUser: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Inicializar autenticacion al cargar
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log(' AuthContext: Inicializando autenticacion...');
      setLoading(true);
      
      const user = await authService.initialize();
      
      if (user) {
        setCurrentUser(user);
        console.log(' AuthContext: Usuario autenticado:', user.email);
      } else {
        setCurrentUser(null);
        console.log(' AuthContext: No hay usuario autenticado');
      }
    } catch (error) {
      console.error(' AuthContext: Error en inicializacion:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
      console.log(' AuthContext: Inicialización completada');
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      console.log(' AuthContext: Iniciando login para', email);
      setLoading(true);
      
      const result = await authService.login({ email, password });
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        console.log(' AuthContext: Login exitoso');
        
        // Redirigir al dashboard SIN usar router.push para evitar bucles
        window.location.href = '/dashboard';
      } else {
        console.error(' AuthContext: Error en login:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error(' AuthContext: Error en login:', error);
      return {
        success: false,
        error: 'Error de conexion'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    phone: string, 
    password: string
  ): Promise<AuthResult> => {
    try {
      console.log(' AuthContext: Iniciando registro para', email);
      setLoading(true);
      
      const result = await authService.register({
        firstName,
        lastName,
        email,
        phone,
        password
      });
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        console.log(' AuthContext: Registro exitoso');
        
        // Redirigir al dashboard SIN usar router.push para evitar bucles
        window.location.href = '/dashboard';
      } else {
        console.error(' AuthContext: Error en registro:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error(' AuthContext: Error en registro:', error);
      return {
        success: false,
        error: 'Error de conexion'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log(' AuthContext: Cerrando sesion...');
    
    authService.logout();
    setCurrentUser(null);
    
    // Usar window.location para forzar recarga y evitar problemas de estado
    window.location.href = '/login';
    
    console.log(' AuthContext: Sesion cerrada');
  };

  // Alias para compatibilidad con componentes existentes
  const signOut = logout;

  const refreshUser = async (): Promise<boolean> => {
    try {
      console.log(' AuthContext: Refrescando datos de usuario...');
      
      const success = await authService.refreshUserData();
      
      if (success) {
        const userData = authService.getCurrentUser();
        setCurrentUser(userData);
        console.log(' AuthContext: Datos actualizados');
        return true;
      } else {
        console.log(' AuthContext: Error refrescando, cerrando sesion');
        logout();
        return false;
      }
    } catch (error) {
      console.error(' AuthContext: Error en refresh:', error);
      logout();
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    signOut,
    refreshUser,
    isAuthenticated: !!currentUser && !loading
  };

  console.log(' AuthContext State:', { 
    isAuthenticated: !!currentUser && !loading, 
    loading, 
    hasUser: !!currentUser 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
