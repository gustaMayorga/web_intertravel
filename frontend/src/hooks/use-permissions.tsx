'use client';

import { useState, useEffect } from 'react';

interface UserModule {
  name: string;
  displayName: string;
  icon: string;
  route: string;
  category: string;
  permissions: Record<string, boolean>;
  isEnabled: boolean;
  isPinned: boolean;
}

interface User {
  id?: string;
  username: string;
  role: string;
  roleName?: string;
  roleLevel?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface UsePermissionsReturn {
  user: User | null;
  modules: UserModule[];
  hasPermission: (moduleName: string, permission?: string) => boolean;
  hasModuleAccess: (moduleName: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<UserModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUserPermissions = async () => {
    try {
      setIsLoading(true);
      
      // Verificar autenticación básica
      const token = localStorage.getItem('auth_token');
      const storedUser = sessionStorage.getItem('auth_user');
      
      if (!token || !storedUser) {
        setIsAuthenticated(false);
        setUser(null);
        setModules([]);
        return;
      }

      // Parsear datos del usuario
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsAuthenticated(false);
        return;
      }

      // Obtener módulos y permisos del usuario
      const response = await fetch('/api/auth/user-modules', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setModules(data.modules || []);
        console.log(`✅ Permisos cargados: ${data.modules.length} módulos`);
      } else {
        console.warn('Error cargando permisos:', data.error);
        setModules([]);
      }
      
    } catch (error) {
      console.error('Error en usePermissions:', error);
      setIsAuthenticated(false);
      setUser(null);
      setModules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserPermissions();
  }, []);

  /**
   * Verificar si el usuario tiene un permiso específico en un módulo
   */
  const hasPermission = (moduleName: string, permission: string = 'view'): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // Super admin tiene todos los permisos
    if (user.role === 'super_admin') return true;
    
    const module = modules.find(m => m.name === moduleName);
    if (!module || !module.isEnabled) return false;
    
    return module.permissions[permission] === true;
  };

  /**
   * Verificar si el usuario tiene acceso a un módulo (permiso 'view' mínimo)
   */
  const hasModuleAccess = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'view');
  };

  /**
   * Verificar si el usuario puede acceder a una ruta específica
   */
  const canAccessRoute = (route: string): boolean => {
    if (!isAuthenticated) return false;
    
    // Super admin puede acceder a todo
    if (user?.role === 'super_admin') return true;
    
    // Extraer el módulo de la ruta
    const routeParts = route.split('/');
    if (routeParts.length < 3) return false;
    
    const moduleName = routeParts[2]; // /admin/packages -> packages
    
    return hasModuleAccess(moduleName);
  };

  /**
   * Recargar permisos del usuario
   */
  const refresh = async () => {
    await loadUserPermissions();
  };

  return {
    user,
    modules,
    hasPermission,
    hasModuleAccess,
    canAccessRoute,
    isLoading,
    isAuthenticated,
    refresh
  };
};

/**
 * Hook específico para verificar permisos en componentes
 */
export const useModulePermission = (moduleName: string, permission: string = 'view') => {
  const { hasPermission, isLoading, isAuthenticated } = usePermissions();
  
  return {
    hasPermission: hasPermission(moduleName, permission),
    isLoading,
    isAuthenticated
  };
};

/**
 * Hook para verificar acceso a ruta
 */
export const useRouteAccess = (route: string) => {
  const { canAccessRoute, isLoading, isAuthenticated } = usePermissions();
  
  return {
    canAccess: canAccessRoute(route),
    isLoading,
    isAuthenticated
  };
};

/**
 * HOC para proteger componentes con permisos
 */
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  moduleName: string,
  permission: string = 'view',
  fallback?: React.ComponentType<any>
) => {
  return function PermissionWrapper(props: any) {
    const { hasPermission, isLoading, isAuthenticated } = usePermissions();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando permisos...</p>
          </div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      const FallbackComponent = fallback || (() => (
        <div className="text-center p-8">
          <p className="text-red-600">Acceso no autorizado</p>
        </div>
      ));
      return <FallbackComponent />;
    }
    
    if (!hasPermission(moduleName, permission)) {
      const FallbackComponent = fallback || (() => (
        <div className="text-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-1">Permisos Insuficientes</h3>
            <p className="text-red-700">
              No tienes permisos para acceder a <strong>{moduleName}</strong> con nivel <strong>{permission}</strong>.
            </p>
          </div>
        </div>
      ));
      return <FallbackComponent />;
    }
    
    return <WrappedComponent {...props} />;
  };
};

/**
 * Componente para renderizar condicionalmente basado en permisos
 */
interface ConditionalRenderProps {
  module: string;
  permission?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  module,
  permission = 'view',
  children,
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissions();
  
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
  }
  
  if (hasPermission(module, permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

export default usePermissions;
