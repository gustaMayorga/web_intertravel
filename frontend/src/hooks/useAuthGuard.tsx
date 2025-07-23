'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ===== AUTH GUARD - PROTECCIÓN REAL SIN BYPASS =====

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  user: {
    username: string;
    role: string;
  } | null;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: null,
    user: null
  });
  
  const router = useRouter();

  useEffect(() => {
    verifyAuthentication();
  }, []);

  const verifyAuthentication = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const userStr = localStorage.getItem('admin_user');
      
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        redirectToLogin();
        return;
      }

      // VERIFICACIÓN REAL CON EL BACKEND - NUNCA CONFIAR SOLO EN LOCALSTORAGE
      console.log('🔍 Verifying token with backend...');
      
      const response = await fetch('http://localhost:3002/api/admin/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = userStr ? JSON.parse(userStr) : null;
        console.log('✅ Authentication verified successfully');
        
        setAuthState({
          isAuthenticated: true,
          loading: false,
          error: null,
          user: userData
        });
      } else {
        console.log('❌ Token verification failed, status:', response.status);
        clearAuthAndRedirect();
      }
      
    } catch (error) {
      console.error('❌ Auth verification error:', error);
      clearAuthAndRedirect();
    }
  };

  const clearAuthAndRedirect = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    setAuthState({
      isAuthenticated: false,
      loading: false,
      error: 'Sesión expirada o inválida',
      user: null
    });
    
    redirectToLogin();
  };

  const redirectToLogin = () => {
    console.log('🔄 Redirecting to login page');
    router.push('/admin/login');
  };

  // Loading state
  if (authState.loading) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Verificando autenticación...
            </h3>
            <p className="text-gray-600">
              Validando credenciales con el servidor
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (authState.error && !authState.isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Acceso Denegado
            </h3>
            <p className="text-gray-600 mb-4">
              {authState.error}
            </p>
            <button
              onClick={redirectToLogin}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!authState.isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sesión No Válida
            </h3>
            <p className="text-gray-600 mb-4">
              Por favor, inicie sesión para acceder al panel de administración
            </p>
            <button
              onClick={redirectToLogin}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  console.log('✅ User authenticated, rendering protected content');
  return <>{children}</>;
}

// ===== HOOK PARA USAR EN COMPONENTES =====
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: null,
    user: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('admin_token');
      const userStr = localStorage.getItem('admin_user');
      
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          loading: false,
          error: null,
          user: null
        });
        return;
      }

      try {
        const response = await fetch('http://localhost:3002/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = userStr ? JSON.parse(userStr) : null;
          setAuthState({
            isAuthenticated: true,
            loading: false,
            error: null,
            user: userData
          });
        } else {
          throw new Error('Token inválido');
        }
      } catch (error) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAuthState({
          isAuthenticated: false,
          loading: false,
          error: 'Sesión expirada',
          user: null
        });
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAuthState({
      isAuthenticated: false,
      loading: false,
      error: null,
      user: null
    });
    window.location.href = '/admin/login';
  };

  return {
    ...authState,
    logout
  };
}

export default AuthGuard;
