/**
 * 🔐 SISTEMA DE VALIDACIÓN DE AUTENTICACIÓN - INTERTRAVEL
 * =======================================================
 * 
 * Sistema seguro para validar tokens y gestionar sesiones
 * de admin y agencias con protección contra vulnerabilidades
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthValidationConfig {
  tokenKey: string;
  userKey: string;
  loginPath: string;
  dashboardPath: string;
}

export const AUTH_CONFIGS = {
  admin: {
    tokenKey: 'adminToken',
    userKey: 'adminUser',
    loginPath: '/admin/login',
    dashboardPath: '/admin/dashboard'
  },
  agency: {
    tokenKey: 'agencyToken',
    userKey: 'agencyUser', 
    loginPath: '/agency/login',
    dashboardPath: '/agency/dashboard'
  }
} as const;

/**
 * Valida un token JWT básico (verificación del lado cliente)
 */
export const validateTokenFormat = (token: string): boolean => {
  if (!token) return false;
  
  try {
    // Verificar formato JWT básico (3 partes separadas por puntos)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Verificar que las partes sean válidas base64
    for (const part of parts) {
      if (!part || part.length === 0) return false;
    }
    
    // Decodificar el payload para verificar expiración
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Verificar expiración
    if (payload.exp && payload.exp < currentTime) {
      console.warn('🚨 Token expirado');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('🚨 Token inválido:', error);
    return false;
  }
};

/**
 * Valida token con el servidor (más seguro)
 */
export const validateTokenWithServer = async (
  token: string, 
  type: 'admin' | 'agency'
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/auth/validate-${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.valid === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error validando token con servidor:', error);
    return false;
  }
};

/**
 * Limpia todos los datos de autenticación
 */
export const clearAuthData = (type: 'admin' | 'agency'): void => {
  const config = AUTH_CONFIGS[type];
  
  try {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.userKey);
    localStorage.removeItem(`${type}_lastActivity`);
    localStorage.removeItem(`${type}_permissions`);
    
    // Limpiar cookies también
    document.cookie = `${config.tokenKey}=; max-age=0; path=/; secure; samesite=strict`;
    
    console.log(`🧹 Datos de autenticación ${type} limpiados`);
  } catch (error) {
    console.error('Error limpiando datos de auth:', error);
  }
};

/**
 * Verifica si una sesión es válida y activa
 */
export const isSessionValid = (type: 'admin' | 'agency'): boolean => {
  const config = AUTH_CONFIGS[type];
  
  try {
    const token = localStorage.getItem(config.tokenKey);
    const user = localStorage.getItem(config.userKey);
    const lastActivity = localStorage.getItem(`${type}_lastActivity`);
    
    if (!token || !user) return false;
    
    // Verificar formato del token
    if (!validateTokenFormat(token)) {
      clearAuthData(type);
      return false;
    }
    
    // Verificar actividad reciente (timeout de sesión - 2 horas)
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity);
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      
      if (lastActivityTime < twoHoursAgo) {
        console.warn(`🚨 Sesión ${type} expirada por inactividad`);
        clearAuthData(type);
        return false;
      }
    }
    
    // Actualizar última actividad
    localStorage.setItem(`${type}_lastActivity`, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    clearAuthData(type);
    return false;
  }
};

/**
 * Hook para proteger rutas que requieren autenticación
 */
export const useAuthProtection = (type: 'admin' | 'agency') => {
  const router = useRouter();
  const config = AUTH_CONFIGS[type];
  
  const validateAndRedirect = useCallback(async () => {
    // Verificación básica del lado cliente
    const isValid = isSessionValid(type);
    
    if (!isValid) {
      console.log(`🚨 Sesión ${type} inválida, redirigiendo a login`);
      router.replace(config.loginPath);
      return false;
    }
    
    // Verificación adicional con servidor (opcional para mayor seguridad)
    const token = localStorage.getItem(config.tokenKey);
    if (token) {
      const serverValid = await validateTokenWithServer(token, type);
      if (!serverValid) {
        console.log(`🚨 Token ${type} rechazado por servidor`);
        clearAuthData(type);
        router.replace(config.loginPath);
        return false;
      }
    }
    
    return true;
  }, [type, router, config]);
  
  useEffect(() => {
    validateAndRedirect();
    
    // Verificar cada 5 minutos
    const interval = setInterval(validateAndRedirect, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [validateAndRedirect]);
  
  return { validateAndRedirect };
};

/**
 * Hook para verificar autenticación en páginas de login
 */
export const useLoginRedirect = (type: 'admin' | 'agency') => {
  const router = useRouter();
  const config = AUTH_CONFIGS[type];
  
  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (isSessionValid(type)) {
      console.log(`✅ Usuario ${type} ya autenticado, redirigiendo a dashboard`);
      router.replace(config.dashboardPath);
    }
  }, [type, router, config]);
};

/**
 * Función para logout seguro
 */
export const secureLogout = (type: 'admin' | 'agency'): void => {
  const config = AUTH_CONFIGS[type];
  
  // Limpiar datos locales
  clearAuthData(type);
  
  // Notificar al servidor (opcional)
  const token = localStorage.getItem(config.tokenKey);
  if (token) {
    fetch(`/api/auth/logout-${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      console.warn('Error notificando logout al servidor:', error);
    });
  }
  
  // Redirigir a login
  window.location.href = config.loginPath;
};

/**
 * Detectar intentos de manipulación del localStorage
 */
export const setupSecurityMonitoring = (type: 'admin' | 'agency'): void => {
  const config = AUTH_CONFIGS[type];
  
  // Monitorear cambios en localStorage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    // Detectar manipulación de tokens
    if (key === config.tokenKey && !validateTokenFormat(value)) {
      console.error('🚨 INTENTO DE MANIPULACIÓN DE TOKEN DETECTADO');
      clearAuthData(type);
      window.location.href = config.loginPath;
      return;
    }
    
    return originalSetItem.call(this, key, value);
  };
  
  // Detectar cambios sospechosos en el DOM
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === config.tokenKey && e.newValue) {
        if (!validateTokenFormat(e.newValue)) {
          console.error('🚨 TOKEN MODIFICADO EXTERNAMENTE');
          clearAuthData(type);
          window.location.href = config.loginPath;
        }
      }
    });
  }
};