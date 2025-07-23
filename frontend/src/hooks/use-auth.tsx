'use client';

/**
 * 🔐 HOOK DE AUTENTICACIÓN SIMPLIFICADO - ANTI-BUCLES
 * ===============================================
 * ✅ Sistema simplificado sin bucles
 * ✅ Verificaciones mínimas optimizadas
 * ✅ Estados claros y controlados
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// CREDENCIALES DEMO
const DEMO_CREDENTIALS = {
  'admin': { password: 'admin123', role: 'super_admin' as const },
  'demo@intertravel.com': { password: 'demo123', role: 'user' as const },
  'agencia_admin': { password: 'agencia123', role: 'admin' as const }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Hidratación inicial - SOLO UNA VEZ al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedUser = sessionStorage.getItem('auth_user');
        
        if (token && storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('🔑 Usuario recuperado:', userData.username);
          setUser(userData);
        }
      } catch (error) {
        console.log('❌ Error recuperando auth:', error);
        // Limpiar storage corrupto
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      }
      
      setLoading(false);
      setHydrated(true);
    };

    // Ejecutar inmediatamente
    initAuth();
  }, []); // DEPS VACÍAS - solo ejecutar una vez

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    try {
      console.log('🔑 Intentando login:', credentials.username);
      
      // Verificar credenciales
      const cred = DEMO_CREDENTIALS[credentials.username as keyof typeof DEMO_CREDENTIALS];
      
      if (!cred || cred.password !== credentials.password) {
        return { success: false, error: 'Credenciales incorrectas' };
      }

      const userData: User = {
        id: `demo_${Date.now()}`,
        username: credentials.username,
        email: credentials.username.includes('@') ? credentials.username : `${credentials.username}@intertravel.com`,
        role: cred.role,
        fullName: `${credentials.username} User`
      };

      // Guardar en storage
      const token = `demo_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      sessionStorage.setItem('auth_user', JSON.stringify(userData));
      
      setUser(userData);
      console.log('✅ Login exitoso:', userData.username);
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      return { success: false, error: error.message || 'Error de login' };
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('🚪 Cerrando sesión...');
    setUser(null);
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  }, []);

  // No renderizar hasta hidratar
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}

export default AuthContext;
export type { AuthContextType, User };