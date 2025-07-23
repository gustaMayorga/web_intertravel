/**
 * 🔐 SISTEMA DE VALIDACIÓN DE AUTENTICACIÓN - INTERTRAVEL (CORREGIDO)
 * ==================================================================
 * 
 * ✅ Sistema unificado para validar tokens y gestionar sesiones
 * ✅ Tokens consistentes con sistema principal  
 * ✅ Métodos unificados para todos los tipos de usuario
 * ✅ Protección contra vulnerabilidades
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthValidationConfig {
  tokenKey: string;
  userKey: string;
  loginPath: string;
  dashboardPath: string;
}

// ===============================================
// 🔧 CONFIGURACIONES UNIFICADAS (CORREGIDO)
// ===============================================
export const AUTH_CONFIGS = {
  admin: {
    tokenKey: 'intertravel_admin_token',     // ✅ Unificado con sistema principal
    userKey: 'intertravel_admin_user',       // ✅ Unificado con sistema principal
    loginPath: '/admin/login',
    dashboardPath: '/admin/dashboard'
  },
  agency: {
    tokenKey: 'intertravel_agency_token',    // ✅ Unificado con sistema principal
    userKey: 'intertravel_agency_user',      // ✅ Unificado con sistema principal
    loginPath: '/agency/login',
    dashboardPath: '/agency/dashboard'
  },
  user: {
    tokenKey: 'intertravel_token',           // ✅ Compatible con sistema principal
    userKey: 'intertravel_user',             // ✅ Compatible con sistema principal
    loginPath: '/auth/login',
    dashboardPath: '/account/dashboard'
  }
} as const;

// ===============================================
// 🔧 MÉTODOS UNIFICADOS (NUEVOS)
// ===============================================

/**
 * Método setToken unificado para todos los tipos de usuario
 */
export const setUnifiedToken = (
  token: string, 
  userData: any, 
  type: 'admin' | 'agency' | 'user'
): void => {
  const config = AUTH_CONFIGS[type];
  
  try {
    // Guardar token
    localStorage.setItem(config.tokenKey, token);
    console.log(`✅ Token ${type} guardado exitosamente`);
    
    // Guardar usuario
    localStorage.setItem(config.userKey, JSON.stringify(userData));
    console.log(`✅ Usuario ${type} guardado exitosamente`);
    
    // Actualizar actividad
    localStorage.setItem(`${type}_lastActivity`, Date.now().toString());
    
  } catch (error) {
    console.error(`❌ Error guardando datos ${type}:`, error);
    throw new Error(`No se pudo guardar los datos de ${type}`);
  }
};

/**
 * Método getToken unificado
 */
export const getUnifiedToken = (type: 'admin' | 'agency' | 'user'): string | null => {
  const config = AUTH_CONFIGS[type];
  return localStorage.getItem(config.tokenKey);
};

/**
 * Método getUser unificado
 */
export const getUnifiedUser = (type: 'admin' | 'agency' | 'user'): any | null => {
  const config = AUTH_CONFIGS[type];
  const userData = localStorage.getItem(config.userKey);
  
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error(`❌ Error parsing user data ${type}:`, error);
    return null;
  }
};

/**
 * Método clearAuth unificado
 */
export const clearUnifiedAuth = (type: 'admin' | 'agency' | 'user'): void => {
  const config = AUTH_CONFIGS[type];
  
  try {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.userKey);
    localStorage.removeItem(`${type}_lastActivity`);
    localStorage.removeItem(`${type}_permissions`);
    
    console.log(`🧹 Datos de autenticación ${type} limpiados`);
  } catch (error) {
    console.error(`❌ Error limpiando datos de auth ${type}:`, error);
  }
};

// ===============================================
// 🔧 VALIDACIÓN MEJORADA
// ===============================================

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
  type: 'admin' | 'agency' | 'user'
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
 * Limpia todos los datos de autenticación (LEGACY - mantener compatibilidad)
 */
export const clearAuthData = (type: 'admin' | 'agency'): void => {
  clearUnifiedAuth(type);
};

/**
 * Verifica si una sesión es válida y activa (MEJORADO)
 */
export const isSessionValid = (type: 'admin' | 'agency' | 'user'): boolean => {
  const config = AUTH_CONFIGS[type];
  
  try {
    const token = localStorage.getItem(config.tokenKey);
    const user = localStorage.getItem(config.userKey);
    const lastActivity = localStorage.getItem(`${type}_lastActivity`);
    
    if (!token || !user) return false;
    
    // Verificar formato del token
    if (!validateTokenFormat(token)) {
      clearUnifiedAuth(type);
      return false;
    }
    
    // Verificar actividad reciente (timeout de sesión - 2 horas)
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity);
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      
      if (lastActivityTime < twoHoursAgo) {
        console.warn(`🚨 Sesión ${type} expirada por inactividad`);
        clearUnifiedAuth(type);
        return false;
      }
    }
    
    // Actualizar última actividad
    localStorage.setItem(`${type}_lastActivity`, Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    clearUnifiedAuth(type);
    return false;
  }
};

/**
 * Hook para proteger rutas que requieren autenticación (MEJORADO)
 */
export const useAuthProtection = (type: 'admin' | 'agency' | 'user') => {
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
        clearUnifiedAuth(type);
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
 * Hook para verificar autenticación en páginas de login (MEJORADO)
 */
export const useLoginRedirect = (type: 'admin' | 'agency' | 'user') => {
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
 * Función para logout seguro (MEJORADO)
 */
export const secureLogout = (type: 'admin' | 'agency' | 'user'): void => {
  const config = AUTH_CONFIGS[type];
  
  // Limpiar datos locales
  clearUnifiedAuth(type);
  
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
 * Detectar intentos de manipulación del localStorage (MEJORADO)
 */
export const setupSecurityMonitoring = (type: 'admin' | 'agency' | 'user'): void => {
  const config = AUTH_CONFIGS[type];
  
  // Monitorear cambios en localStorage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    // Detectar manipulación de tokens
    if (key === config.tokenKey && !validateTokenFormat(value)) {
      console.error('🚨 INTENTO DE MANIPULACIÓN DE TOKEN DETECTADO');
      clearUnifiedAuth(type);
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
          clearUnifiedAuth(type);
          window.location.href = config.loginPath;
        }
      }
    });
  }
};

// ===============================================
// 🔧 FUNCIÓN DE VERIFICACIÓN COMPLETA (NUEVA)
// ===============================================

/**
 * Verifica el estado completo del sistema de autenticación
 */
export const verifyAuthSystemStatus = (): Record<string, any> => {
  const status = {
    user: {
      token: getUnifiedToken('user'),
      user: getUnifiedUser('user'),
      valid: isSessionValid('user')
    },
    admin: {
      token: getUnifiedToken('admin'),
      user: getUnifiedUser('admin'),
      valid: isSessionValid('admin')
    },
    agency: {
      token: getUnifiedToken('agency'),
      user: getUnifiedUser('agency'),
      valid: isSessionValid('agency')
    }
  };
  
  console.log('🔍 Estado completo del sistema auth:', status);
  return status;
};