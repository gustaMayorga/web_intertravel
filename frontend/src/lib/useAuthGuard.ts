// ===============================================
// MIDDLEWARE ANTI-BUCLE PARA AUTENTICACIÓN ADMIN
// ===============================================
// Rompe los bucles de redirección entre login y dashboard

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  error: string | null;
}

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AuthGuard: Verificando autenticación para', pathname);

        // Evitar verificación múltiple
        if (pathname === '/admin/login' && authState.loading) {
          console.log('🔍 AuthGuard: En página de login, verificando si ya está autenticado');
        }

        // Verificar tokens en localStorage
        const authToken = localStorage.getItem('auth_token') || 
                         localStorage.getItem('admin_token');
        
        const authUser = localStorage.getItem('auth_user') || 
                        localStorage.getItem('admin_user');

        if (authToken && authUser) {
          try {
            const user = JSON.parse(authUser);
            
            // Verificar que el token no sea muy viejo (opcional)
            const tokenAge = Date.now() - (user.loginTime ? new Date(user.loginTime).getTime() : 0);
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (tokenAge > maxAge) {
              console.log('⚠️ AuthGuard: Token expirado, limpiando');
              clearAuth();
              return;
            }

            console.log('✅ AuthGuard: Usuario autenticado:', user.username);
            
            setAuthState({
              isAuthenticated: true,
              user: user,
              loading: false,
              error: null
            });

            // Si está en login y ya autenticado, redirigir al dashboard
            if (pathname === '/admin/login') {
              console.log('🎯 AuthGuard: Redirigiendo de login a dashboard');
              router.replace('/admin/dashboard');
            }

            return;
          } catch (parseError) {
            console.log('⚠️ AuthGuard: Error parseando usuario:', parseError);
            clearAuth();
          }
        }

        // No autenticado
        console.log('❌ AuthGuard: Usuario no autenticado');
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null
        });

        // Si no está autenticado y no está en login, redirigir
        if (pathname !== '/admin/login' && pathname.startsWith('/admin')) {
          console.log('🎯 AuthGuard: Redirigiendo a login');
          router.replace('/admin/login');
        }

      } catch (error) {
        console.error('❌ AuthGuard: Error en verificación:', error);
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'Error de autenticación'
        });

        // En caso de error, ir al login
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      }
    };

    // Función para limpiar autenticación
    const clearAuth = () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('admin_user');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('admin_user');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      });
    };

    // Verificar autenticación con delay para evitar bucles
    const timeoutId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, router]);

  // Función para logout
  const logout = () => {
    console.log('🚪 AuthGuard: Cerrando sesión');
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('admin_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('admin_user');
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });

    router.replace('/admin/login');
  };

  return {
    ...authState,
    logout
  };
}

// Hook simplificado para componentes que solo necesitan verificar si están autenticados
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkSimpleAuth = () => {
      try {
        const authToken = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
        const authUser = localStorage.getItem('auth_user') || localStorage.getItem('admin_user');

        if (authToken && authUser) {
          const user = JSON.parse(authUser);
          setIsAuthenticated(true);
          setUser(user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkSimpleAuth();
  }, []);

  return { isAuthenticated, user };
}

export default useAuthGuard;
