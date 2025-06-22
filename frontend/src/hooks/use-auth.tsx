'use client';

/**
 * 🔐 HOOK DE AUTENTICACIÓN CONSOLIDADO - INTERTRAVEL v2.0
 * =====================================================
 * 
 * ✅ Versión final unificada
 * ✅ Sin redirecciones innecesarias  
 * ✅ Compatible con SSR
 * ✅ Sin loops ni referencias circulares
 * 
 * Consolidado automáticamente por script de limpieza
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
  authInitialized: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔧 CREDENCIALES DEMO PARA DESARROLLO
const DEMO_CREDENTIALS = {
  'admin': { password: 'admin123', role: 'super_admin' as const },
  'intertravel': { password: 'travel2024', role: 'admin' as const },
  'supervisor': { password: 'super2024', role: 'admin' as const }
};

// 🔧 FUNCIONES UTILITARIAS
const isClient = typeof window !== 'undefined';

const getStoredToken = () => {
  if (!isClient) return null;
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

const getStoredUser = () => {
  if (!isClient) return null;
  const stored = sessionStorage.getItem('auth_user');
  return stored ? JSON.parse(stored) : null;
};

const setAuthData = (token: string, user: User) => {
  if (!isClient) return;
  localStorage.setItem('auth_token', token);
  sessionStorage.setItem('auth_user', JSON.stringify(user));
};

const clearAuthData = () => {
  if (!isClient) return;
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_user');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // 🔧 INICIALIZACIÓN DE AUTENTICACIÓN
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('🔐 Inicializando autenticación...');
      
      if (!isClient) {
        if (mounted) setAuthInitialized(true);
        return;
      }

      try {
        const token = getStoredToken();
        const storedUser = getStoredUser();

        if (token && storedUser) {
          // ✅ VERIFICAR TOKEN CON BACKEND
          if (!token.startsWith('demo_')) {
            try {
              const response = await fetch('http://localhost:3001/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: AbortSignal.timeout(5000)
              });

              if (response.ok) {
                const result = await response.json();
                if (result.success && result.user && mounted) {
                  console.log('✅ Token válido:', result.user.username);
                  setUser({
                    id: result.user.id.toString(),
                    username: result.user.username,
                    email: result.user.email,
                    role: result.user.role,
                    fullName: result.user.fullName || `${result.user.username} Admin`
                  });
                  return;
                }
              }
              
              // Token inválido
              clearAuthData();
            } catch (err) {
              console.log('⚠️ Backend no disponible, usando datos locales');
              if (mounted) setUser(storedUser);
            }
          } else {
            // Token demo válido
            if (mounted) setUser(storedUser);
          }
        }
      } catch (err) {
        console.error('❌ Error inicializando auth:', err);
        clearAuthData();
      } finally {
        if (mounted) setAuthInitialized(true);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // 🔧 LOGIN
  const login = useCallback(async (credentials: { username: string; password: string }) => {
    console.log('🔐 Iniciando login para:', credentials.username);
    setLoading(true);
    setError(null);

    try {
      // ✅ INTENTAR BACKEND PRIMERO
      try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          signal: AbortSignal.timeout(10000)
        });

        const result = await response.json();

        if (result.success && result.user && result.tokens) {
          const userData: User = {
            id: result.user.id.toString(),
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            fullName: `${result.user.first_name || result.user.username} ${result.user.last_name || 'Admin'}`
          };

          setAuthData(result.tokens.accessToken, userData);
          setUser(userData);
          console.log('✅ Login backend exitoso');
          return { success: true };
        }
        
        throw new Error(result.error || 'Error de autenticación');
      } catch (backendError: any) {
        console.warn('⚠️ Backend no disponible, usando credenciales demo');
        
        // ✅ FALLBACK DEMO
        const cred = DEMO_CREDENTIALS[credentials.username as keyof typeof DEMO_CREDENTIALS];
        
        if (!cred || cred.password !== credentials.password) {
          setError('Credenciales incorrectas');
          return { success: false, error: 'Credenciales incorrectas' };
        }

        const userData: User = {
          id: `demo_${Date.now()}`,
          username: credentials.username,
          email: `${credentials.username}@intertravel.com`,
          role: cred.role,
          fullName: `${credentials.username.charAt(0).toUpperCase() + credentials.username.slice(1)} Admin`
        };

        const demoToken = `demo_${Date.now()}`;
        setAuthData(demoToken, userData);
        setUser(userData);
        console.log('✅ Login demo exitoso');
        return { success: true };
      }
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      setError(error.message || 'Error interno');
      return { success: false, error: error.message || 'Error interno' };
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔧 LOGOUT
  const logout = useCallback(async () => {
    console.log('🚪 Iniciando logout...');
    
    try {
      const token = getStoredToken();
      
      if (token && !token.startsWith('demo_')) {
        try {
          await fetch('http://localhost:3001/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(5000)
          });
        } catch (err) {
          console.log('⚠️ Error logout backend (ignorando)');
        }
      }
    } catch (err) {
      console.log('⚠️ Error durante logout (ignorando)');
    }
    
    setUser(null);
    setError(null);
    clearAuthData();
    console.log('✅ Logout completado');
  }, []);

  const contextValue: AuthContextType = {
    user,
    loading,
    authInitialized,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    error
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
