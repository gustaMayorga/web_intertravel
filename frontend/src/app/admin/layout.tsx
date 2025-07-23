'use client';

// ✅ LAYOUT ADMIN MOBILE-FIRST RESPONSIVE
// Optimizado completamente para móvil, tablet y desktop

import '../../styles/admin-dark-theme.css';
import '../../styles/admin-responsive.css';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Calculator,
  UserCheck,
  FileText,
  Star,
  Database,
  DollarSign,
  UserPlus
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Analytics BI', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Paquetes', href: '/admin/packages', icon: Package },
  { name: 'Destinos', href: '/admin/destinations', icon: MapPin },
  { name: 'Reservas', href: '/admin/bookings', icon: Calendar },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Clientes', href: '/admin/clients', icon: UserPlus },
  { name: 'Agencias', href: '/admin/agencies', icon: Shield },
  { name: 'Pagos', href: '/admin/payments', icon: DollarSign },
  { name: 'Contabilidad', href: '/admin/accounting', icon: Calculator },
  { name: 'CRM', href: '/admin/crm', icon: UserCheck },
  { name: 'Reportes', href: '/admin/reports', icon: FileText },
  { name: 'Priorización', href: '/admin/priority', icon: Star },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🔧 TODOS LOS HOOKS PRIMERO - ANTES DE CUALQUIER RETURN
  
  // Cerrar menu móvil al cambiar ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Cerrar menu móvil con escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // ✅ MANEJO DE LOGIN PAGE DESPUÉS DE TODOS LOS HOOKS
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  // ✅ OBTENER DATOS DE USUARIO
  let user = null;
  if (typeof window !== 'undefined') {
    try {
      const storedUser = sessionStorage.getItem('auth_user') || sessionStorage.getItem('admin_user');
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn('Error parsing user data:', e);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" data-admin="true">
      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        {/* Overlay Background */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
          {/* Header with Close */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Image 
              src="/logo-intertravel.png" 
              alt="InterTravel Logo" 
              width={120} 
              height={40}
              className="h-8 w-auto"
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 touch-target"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors touch-target ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-4 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* User Info & Logout */}
          <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-full p-2">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.username || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'super_admin'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors touch-target"
            >
              <LogOut className="mr-4 h-6 w-6 flex-shrink-0" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:shadow-sm">
        <div className="flex items-center justify-center flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <Image 
            src="/logo-intertravel.png" 
            alt="InterTravel Logo" 
            width={120} 
            height={40}
            className="h-10 w-auto"
          />
        </div>
        
        <div className="mt-6 flex flex-col flex-1">
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="px-3 py-4 border-t border-gray-200">
            <div className="mb-3 px-3">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username || 'Admin'}
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
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 touch-target"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center justify-center flex-1">
            <Image 
              src="/logo-intertravel.png" 
              alt="InterTravel Logo" 
              width={80} 
              height={27}
              className="h-7 w-auto"
            />
          </div>
          
          <button 
            onClick={handleLogout} 
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 touch-target"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}