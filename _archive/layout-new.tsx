'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard, 
  Package, 
  Users, 
  Calendar,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  User,
  Calculator,
  BarChart3,
  Upload,
  FileText,
  Zap,
  Database,
  MessageCircle,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';

// Configuración de módulos disponibles
const availableModules = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard, 
    description: 'Panel principal con estadísticas básicas',
    category: 'core',
    enabled: true,
    requiredPermissions: ['dashboard:view']
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp Manager', 
    href: '/admin/whatsapp', 
    icon: MessageCircle, 
    description: 'Configuración y gestión de WhatsApp',
    category: 'priority',
    enabled: true,
    requiredPermissions: ['whatsapp:manage']
  },
  { 
    id: 'settings', 
    name: 'Configuración Web', 
    href: '/admin/settings', 
    icon: Settings, 
    description: 'Configuración general y contenido web',
    category: 'core',
    enabled: true,
    requiredPermissions: ['settings:manage']
  },
  { 
    id: 'permissions', 
    name: 'Usuarios y Permisos', 
    href: '/admin/permissions', 
    icon: UserCheck, 
    description: 'Gestión de usuarios y control de acceso',
    category: 'core',
    enabled: true,
    requiredPermissions: ['users:manage']
  },
  { 
    id: 'integrations', 
    name: 'Travel Compositor', 
    href: '/admin/integrations', 
    icon: Zap, 
    description: 'Configuración de Travel Compositor',
    category: 'extended',
    enabled: true,
    requiredPermissions: ['integrations:view']
  },
  { 
    id: 'fallback', 
    name: 'Gestión de Datos', 
    href: '/admin/fallback', 
    icon: Database, 
    description: 'Datos de respaldo y fallback',
    category: 'extended',
    enabled: true,
    requiredPermissions: ['data:manage']
  },
  { 
    id: 'packages', 
    name: 'Gestión de Paquetes', 
    href: '/admin/packages', 
    icon: Package, 
    description: 'Administración de paquetes de viaje',
    category: 'business',
    enabled: true,
    requiredPermissions: ['packages:manage']
  },
  { 
    id: 'bookings', 
    name: 'Gestión de Reservas', 
    href: '/admin/bookings', 
    icon: Calendar, 
    description: 'Administración de reservas y cotizaciones',
    category: 'business',
    enabled: true,
    requiredPermissions: ['bookings:manage']
  },
  { 
    id: 'crm', 
    name: 'CRM Clientes', 
    href: '/admin/crm', 
    icon: Users, 
    description: 'Gestión de relaciones con clientes',
    category: 'business',
    enabled: false,
    requiredPermissions: ['crm:view']
  },
  { 
    id: 'reports', 
    name: 'Reportes Avanzados', 
    href: '/admin/reports', 
    icon: FileText, 
    description: 'Informes y análisis detallados',
    category: 'analytics',
    enabled: false,
    requiredPermissions: ['reports:view']
  },
  { 
    id: 'accounting', 
    name: 'Contabilidad', 
    href: '/admin/accounting', 
    icon: Calculator, 
    description: 'Gestión contable y financiera',
    category: 'analytics',
    enabled: false,
    requiredPermissions: ['accounting:view']
  },
  { 
    id: 'analytics', 
    name: 'Analytics Avanzado', 
    href: '/admin/analytics', 
    icon: BarChart3, 
    description: 'Análisis de datos avanzado',
    category: 'analytics',
    enabled: false,
    requiredPermissions: ['analytics:view']
  },
  { 
    id: 'import', 
    name: 'Importación Masiva', 
    href: '/admin/import', 
    icon: Upload, 
    description: 'Herramientas de importación de datos',
    category: 'tools',
    enabled: false,
    requiredPermissions: ['import:manage']
  }
];

interface AdminLayoutContentProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [moduleConfig, setModuleConfig] = useState(availableModules);
  
  const { user, logout, authInitialized, isAuthenticated } = useAuth();

  // Cargar configuración de módulos desde localStorage o API
  useEffect(() => {
    loadModuleConfiguration();
  }, []);

  const loadModuleConfiguration = async () => {
    try {
      // Intentar cargar desde API primero
      const response = await fetch('/api/admin/modules-config');
      if (response.ok) {
        const config = await response.json();
        if (config.success) {
          setModuleConfig(config.modules);
          return;
        }
      }
    } catch (error) {
      console.log('No se pudo cargar configuración desde API, usando localStorage');
    }
    
    // Fallback a localStorage
    const savedConfig = localStorage.getItem('admin_modules_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setModuleConfig(parsed);
      } catch (error) {
        console.error('Error parsing module config:', error);
      }
    }
  };

  const toggleModule = async (moduleId: string) => {
    const updatedConfig = moduleConfig.map(module => 
      module.id === moduleId 
        ? { ...module, enabled: !module.enabled }
        : module
    );
    
    setModuleConfig(updatedConfig);
    
    // Guardar en localStorage
    localStorage.setItem('admin_modules_config', JSON.stringify(updatedConfig));
    
    // Intentar guardar en API
    try {
      await fetch('/api/admin/modules-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: updatedConfig })
      });
    } catch (error) {
      console.error('Error saving module config to API:', error);
    }
  };

  // Filtrar módulos habilitados y con permisos
  const getEnabledModules = () => {
    return moduleConfig.filter(module => {
      if (!module.enabled) return false;
      
      // Verificar permisos del usuario
      if (!user?.permissions) return true; // Si no hay permisos definidos, permitir acceso
      
      return module.requiredPermissions.some(permission => 
        user.permissions.includes(permission) || 
        user.permissions.includes('admin:all') ||
        user.role === 'super_admin'
      );
    });
  };

  // Categorizar módulos para la configuración
  const getCategorizedModules = () => {
    const categories = {
      core: { name: 'Módulos Principales', modules: [] as typeof availableModules },
      priority: { name: 'Prioridad Alta', modules: [] as typeof availableModules },
      business: { name: 'Gestión de Negocio', modules: [] as typeof availableModules },
      extended: { name: 'Funciones Extendidas', modules: [] as typeof availableModules },
      analytics: { name: 'Análisis y Reportes', modules: [] as typeof availableModules },
      tools: { name: 'Herramientas', modules: [] as typeof availableModules }
    };
    
    moduleConfig.forEach(module => {
      if (categories[module.category as keyof typeof categories]) {
        categories[module.category as keyof typeof categories].modules.push(module);
      }
    });
    
    return categories;
  };

  useEffect(() => {
    setIsClient(true);
    console.log('🔧 ADMIN CLIENT MOUNTED:', {
      isClient: true,
      pathname,
      timestamp: new Date().toISOString()
    });
  }, []);

  console.log('🗂️ ADMIN LAYOUT:', { 
    pathname, 
    authInitialized, 
    isAuthenticated, 
    username: user?.username,
    isClient,
    enabledModules: getEnabledModules().length,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!isClient || !authInitialized || hasNavigated) return;
    
    const isLoginPage = pathname === '/admin/login';
    
    if (!isAuthenticated && !isLoginPage) {
      console.log('🔄 Usuario no autenticado → redirigiendo a login');
      setHasNavigated(true);
      setTimeout(() => router.replace('/admin/login'), 100);
      return;
    }
    
    if (isAuthenticated && isLoginPage) {
      console.log('✅ Usuario autenticado → redirigiendo a dashboard');
      setHasNavigated(true);
      setTimeout(() => router.replace('/admin/dashboard'), 100);
      return;
    }
    
  }, [isClient, authInitialized, isAuthenticated, pathname, router, hasNavigated]);

  useEffect(() => {
    setHasNavigated(false);
  }, [pathname]);

  if (!isClient) {
    return <LoadingScreen message="Cargando aplicación..." />;
  }

  if (!authInitialized) {
    return <LoadingScreen message="Inicializando autenticación..." />;
  }

  if (!user && !isAuthenticated && pathname !== '/admin/login') {
    return <LoadingScreen message="Verificando sesión..." />;
  }

  if (pathname === '/admin/login') {
    if (isAuthenticated && user) {
      return <LoadingScreen message="Acceso autorizado, redirigiendo..." />;
    }
    return <>{children}</>;
  }

  if (!isAuthenticated || !user) {
    return <LoadingScreen message="Verificando credenciales..." />;
  }

  const handleLogout = async () => {
    console.log('🚪 Iniciando logout...');
    setHasNavigated(true);
    
    try {
      await logout();
      setTimeout(() => router.replace('/admin/login'), 100);
    } catch (error) {
      console.error('Error en logout:', error);
      router.replace('/admin/login');
    }
  };

  const enabledModules = getEnabledModules();
  const isModuleConfigPage = pathname === '/admin/module-config';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4">
        <div className="flex items-center flex-shrink-0 px-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
        </div>
        
        <div className="mt-6 flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {enabledModules.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                  {item.category === 'priority' && (
                    <span className="ml-auto">⭐</span>
                  )}
                </Link>
              );
            })}
            
            {/* Separador y configuración de módulos */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <Link
                href="/admin/module-config"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isModuleConfigPage
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Configurar Módulos
                <span className="ml-auto text-xs text-gray-500">
                  {enabledModules.length}/{moduleConfig.length}
                </span>
              </Link>
            </div>
          </nav>
          
          <div className="px-3 py-4 border-t border-gray-200">
            <div className="mb-3 px-2">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName || user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-lg font-bold">Admin</span>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
            <nav className="px-3 py-2 space-y-1">
              {enabledModules.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          {/* Si estamos en la página de configuración de módulos, mostrar interfaz especial */}
          {isModuleConfigPage ? (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Configuración de Módulos</h1>
                  <p className="text-gray-600 mt-2">
                    Habilita o deshabilita módulos según las necesidades de tu equipo
                  </p>
                </div>

                {Object.entries(getCategorizedModules()).map(([key, category]) => (
                  <div key={key} className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">{category.name}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.modules.map((module) => (
                        <div 
                          key={module.id}
                          className={`p-4 border rounded-lg transition-all ${
                            module.enabled 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <module.icon className="h-5 w-5 mr-2 text-gray-600" />
                                <h3 className="font-medium text-gray-900">{module.name}</h3>
                                {module.category === 'priority' && (
                                  <span className="ml-2">⭐</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {module.requiredPermissions.map(permission => (
                                  <span 
                                    key={permission}
                                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                  >
                                    {permission}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleModule(module.id)}
                              className={`ml-4 p-2 rounded-md transition-colors ${
                                module.enabled
                                  ? 'text-green-600 hover:bg-green-100'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                            >
                              {module.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">💡 Información</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Los módulos principales (Core) no se pueden desactivar</li>
                    <li>• Los cambios se guardan automáticamente</li>
                    <li>• Solo los módulos habilitados aparecen en el menú</li>
                    <li>• Los permisos de usuario se verifican automáticamente</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function LoadingScreen({ message }: { message: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{message}</p>
        <p className="text-xs text-gray-400 mt-2">InterTravel Admin Panel</p>
        {mounted && (
          <p className="text-xs text-gray-300 mt-1">
            Sistema iniciado
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AuthProvider>
  );
}
