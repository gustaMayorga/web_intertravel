'use client';

// ✅ LAYOUT ADMIN CON NAVEGACIÓN DINÁMICA BASADA EN PERMISOS
// Este layout obtiene los módulos del usuario y muestra solo los permitidos

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  BarChart3,
  MapPin,
  Star,
  Database,
  Building,
  FileText,
  DollarSign,
  UserCog,
  Zap,
  MessageCircle,
  Bug,
  RefreshCw
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Package,
  Calendar,
  UserCog,
  BarChart3,
  Building,
  FileText,
  DollarSign,
  MapPin,
  Star,
  Settings,
  Shield,
  Zap,
  MessageCircle,
  Database,
  Bug,
  Users
};

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userModules, setUserModules] = useState<UserModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // ✅ SOLO MANEJAR LOGIN PAGE - NADA MÁS
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  useEffect(() => {
    loadUserModules();
  }, []);

  const loadUserModules = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del usuario
      const storedUser = sessionStorage.getItem('auth_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }

      // Obtener módulos del usuario desde la API
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await fetch('/api/auth/user-modules', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setUserModules(data.modules || []);
          console.log(`✅ ${data.modules.length} módulos cargados para navegación`);
        } else {
          console.warn('Error cargando módulos del usuario:', data.error);
          // Fallback a navegación básica
          setUserModules([
            { name: 'dashboard', displayName: 'Dashboard', icon: 'LayoutDashboard', route: '/admin/dashboard', category: 'core', permissions: { view: true }, isEnabled: true, isPinned: false }
          ]);
        }
      }
    } catch (error) {
      console.error('Error cargando módulos:', error);
      // Fallback a navegación básica
      setUserModules([
        { name: 'dashboard', displayName: 'Dashboard', icon: 'LayoutDashboard', route: '/admin/dashboard', category: 'core', permissions: { view: true }, isEnabled: true, isPinned: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    router.push('/admin/login');
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Settings;
    return IconComponent;
  };

  // Organizar módulos por categoría y orden
  const organizedModules = userModules
    .filter(module => module.isEnabled && module.permissions.view)
    .sort((a, b) => {
      // Priorizar módulos pinned
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Ordenar por categoría
      const categoryOrder = ['core', 'business', 'analytics', 'financial', 'admin', 'settings'];
      const aCategoryIndex = categoryOrder.indexOf(a.category);
      const bCategoryIndex = categoryOrder.indexOf(b.category);
      
      if (aCategoryIndex !== bCategoryIndex) {
        return aCategoryIndex - bCategoryIndex;
      }
      
      // Ordenar alfabéticamente dentro de la categoría
      return a.displayName.localeCompare(b.displayName);
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:shadow-sm">
        <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <Shield className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">InterTravel</span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
        </div>
        
        <div className="mt-6 flex flex-col flex-1">
          <nav className="flex-1 px-3 space-y-1">
            {organizedModules.map((module) => {
              const isActive = pathname === module.route || pathname.startsWith(module.route + '/');
              const IconComponent = getIcon(module.icon);
              
              return (
                <Link
                  key={module.name}
                  href={module.route}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="mr-3 h-5 w-5" />
                  {module.displayName}
                  {module.isPinned && (
                    <Star className="ml-auto h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </Link>
              );
            })}
            
            {organizedModules.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No hay módulos disponibles</p>
              </div>
            )}
          </nav>
          
          <div className="px-3 py-4 border-t border-gray-200">
            <div className="mb-3 px-3">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || user?.username || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || 'super_admin'}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
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
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm">
            <nav className="px-4 py-2 space-y-1">
              {organizedModules.map((module) => {
                const isActive = pathname === module.route || pathname.startsWith(module.route + '/');
                const IconComponent = getIcon(module.icon);
                
                return (
                  <Link
                    key={module.name}
                    href={module.route}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="mr-3 h-5 w-5" />
                    {module.displayName}
                    {module.isPinned && (
                      <Star className="ml-auto h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </Link>
                );
              })}
            </nav>
            
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Conectado como:</div>
              <div className="text-sm font-medium text-gray-900">
                {user?.name || user?.username || 'Admin'}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role || 'super_admin'}
              </div>
            </div>
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
