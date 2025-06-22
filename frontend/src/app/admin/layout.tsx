'use client';

/**
 * 🔐 ADMIN LAYOUT CORREGIDO - SIN ERRORES DE HIDRATACION
 * =====================================================
 * 
 * ✅ Layout principal del admin panel
 * ✅ Sin errores de hidratación
 * ✅ Navegación lateral con módulos
 * ✅ Autenticación y protección de rutas
 * ✅ AuthProvider incluido
 */

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
  MessageCircle
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Fallback Inteligente', href: '/admin/fallback', icon: Database },
  { name: 'Integraciones', href: '/admin/integrations', icon: Zap },
  { name: 'WhatsApp Config', href: '/admin/whatsapp', icon: MessageCircle },
  { name: 'Permisos', href: '/admin/permissions', icon: Shield },
  { name: 'Importación', href: '/admin/import', icon: Upload },
  { name: 'CRM', href: '/admin/crm', icon: Users },
  { name: 'Reportes', href: '/admin/reports', icon: FileText },
  { name: 'Contabilidad', href: '/admin/accounting', icon: Calculator },
  { name: 'Paquetes', href: '/admin/packages', icon: Package },
  { name: 'Reservas', href: '/admin/bookings', icon: Calendar },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  const { user, logout, authInitialized, isAuthenticated } = useAuth();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4">
        <div className="flex items-center flex-shrink-0 px-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">InterTravel Admin</span>
        </div>
        
        <div className="mt-6 flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
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
            <span className="ml-2 text-lg font-bold">InterTravel</span>
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
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
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
          {children}
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
        <p className="text-xs text-gray-400 mt-2">InterTravel WEB-FINAL-UNIFICADA</p>
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