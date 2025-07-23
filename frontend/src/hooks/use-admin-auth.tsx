'use client';

/**
 * 🔐 HOOK DE AUTENTICACIÓN ADMIN - INTERTRAVEL (CORREGIDO)
 * ========================================================
 * ✅ Tokens unificados con sistema principal
 * ✅ Solo localStorage (eliminado sessionStorage)
 * ✅ Método setToken() implementado
 * ✅ Consistencia con patrón principal
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, [pathname]);

  // ===============================================
  // 🔧 MÉTODO setToken UNIFICADO (NUEVO)
  // ===============================================
  const setToken = (token: string): void => {
    try {
      localStorage.setItem('intertravel_admin_token', token);
      console.log('✅ Token admin guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando token admin:', error);
      throw new Error('No se pudo guardar el token admin');
    }
  };

  // ===============================================
  // 🔧 MÉTODO setUser UNIFICADO (NUEVO)
  // ===============================================
  const setUserData = (userData: User): void => {
    try {
      localStorage.setItem('intertravel_admin_user', JSON.stringify(userData));
      console.log('✅ Usuario admin guardado exitosamente');
    } catch (error) {
      console.error('❌ Error guardando usuario admin:', error);
      throw new Error('No se pudo guardar el usuario admin');
    }
  };

  const checkAuthentication = () => {
    try {
      // Verificar si estamos en el cliente
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      // Rutas que no requieren autenticación
      const publicRoutes = ['/admin/login', '/admin'];
      
      if (publicRoutes.includes(pathname)) {
        setLoading(false);
        return;
      }

      // ✅ CORREGIDO: Usar tokens unificados
      const token = localStorage.getItem('intertravel_admin_token');
      const storedUser = localStorage.getItem('intertravel_admin_user');
      
      console.log('🔐 Verificando autenticación admin...', { 
        hasToken: !!token, 
        hasUser: !!storedUser, 
        pathname 
      });

      if (!token || !storedUser) {
        console.log('❌ Admin no autenticado, redirigiendo al login');
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        router.push('/admin/login');
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Admin autenticado:', userData.username);
      } catch (parseError) {
        console.error('❌ Error parsing admin user data:', parseError);
        // ✅ CORREGIDO: Limpiar tokens unificados
        localStorage.removeItem('intertravel_admin_token');
        localStorage.removeItem('intertravel_admin_user');
        setIsAuthenticated(false);
        setUser(null);
        router.push('/admin/login');
      }
      
    } catch (error) {
      console.error('❌ Error en verificación de auth admin:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // 🔧 LOGIN CORREGIDO
  // ===============================================
  const login = (userData: User, token: string) => {
    try {
      // ✅ CORREGIDO: Usar métodos unificados
      setToken(token);
      setUserData(userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      console.log('✅ Login admin exitoso:', userData.username);
    } catch (error) {
      console.error('❌ Error en login admin:', error);
      // Limpiar en caso de error
      logout();
      throw error;
    }
  };

  // ===============================================
  // 🔧 LOGOUT CORREGIDO
  // ===============================================
  const logout = () => {
    try {
      // ✅ CORREGIDO: Limpiar tokens unificados
      localStorage.removeItem('intertravel_admin_token');
      localStorage.removeItem('intertravel_admin_user');
      
      setUser(null);
      setIsAuthenticated(false);
      router.push('/admin/login');
      console.log('✅ Logout admin exitoso');
    } catch (error) {
      console.error('❌ Error en logout admin:', error);
    }
  };

  // ===============================================
  // 🔧 MÉTODO PARA OBTENER TOKEN (NUEVO)
  // ===============================================
  const getToken = (): string | null => {
    return localStorage.getItem('intertravel_admin_token');
  };

  // ===============================================
  // 🔧 MÉTODO PARA VERIFICAR SESIÓN VÁLIDA (NUEVO)
  // ===============================================
  const isSessionValid = (): boolean => {
    const token = getToken();
    const user = localStorage.getItem('intertravel_admin_user');
    return !!(token && user);
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthentication,
    getToken,
    isSessionValid,
    // Métodos internos expuestos para testing
    setToken,
    setUserData
  };
}