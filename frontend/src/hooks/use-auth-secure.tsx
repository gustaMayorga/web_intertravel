'use client';

// ===============================================
// HOOK DE AUTENTICACIÓN SEGURO - INTERTRAVEL
// Solución para AuthGuard real en frontend
// ===============================================

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================

interface User {
  id: string;
  username: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

// ===============================================
// CONTEXTO DE AUTENTICACIÓN
// ===============================================

const AuthContext = createContext<AuthContextType | null>(null);

// ===============================================
// PROVEEDOR DE AUTENTICACIÓN
// ===============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  // Función para obtener el token del localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  };

  // Función para guardar el token
  const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  };

  // Función para eliminar el token
  const removeToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  };

  // ===============================================
  // FUNCIÓN DE LOGIN
  // ===============================================

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login for:', username);

      const response = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        console.log('✅ Login successful');
        return true;
      } else {
        console.log('❌ Login failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  // ===============================================
  // FUNCIÓN DE LOGOUT
  // ===============================================

  const logout = async () => {
    try {
      const token = getToken();
      
      if (token) {
        // Intentar logout en el backend
        await fetch(`${API_BASE}/api/admin/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Limpiar estado local
      removeToken();
      setUser(null);
      router.push('/admin/login');
      console.log('✅ Logout completed');
    }
  };

  // ===============================================
  // FUNCIÓN DE VERIFICACIÓN DE AUTENTICACIÓN
  // ===============================================

  const checkAuth = async (): Promise<boolean> => {
    const token = getToken();
    
    if (!token) {
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setIsLoading(false);
        return true;
      } else {
        // Token inválido o expirado
        removeToken();
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      removeToken();
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // ===============================================
  // EFECTO DE INICIALIZACIÓN
  // ===============================================

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===============================================
// HOOK PARA USAR AUTENTICACIÓN
// ===============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ===============================================
// COMPONENTE AUTH GUARD
// ===============================================

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export function AuthGuard({ 
  children, 
  requiredRoles = ['admin'], 
  fallback 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('🚫 Not authenticated, redirecting to login');
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir si no está autenticado
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos de rol
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.role === role || user.role === 'super_admin'
    );

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos suficientes para acceder a esta sección.
            </p>
            <p className="text-sm text-gray-500">
              Rol requerido: {requiredRoles.join(', ')} | Tu rol: {user.role}
            </p>
          </div>
        </div>
      );
    }
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
}

// ===============================================
// HOOK PARA REALIZAR REQUESTS AUTENTICADOS
// ===============================================

export function useAuthenticatedFetch() {
  const { logout } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    
    if (!token) {
      logout();
      throw new Error('No authentication token');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Si el token es inválido, hacer logout automático
    if (response.status === 401) {
      console.log('🚫 Token expired, logging out');
      logout();
      throw new Error('Token expired');
    }

    return response;
  };

  return { authenticatedFetch };
}

console.log('✅ Secure auth hooks loaded - Real authentication enforced');
