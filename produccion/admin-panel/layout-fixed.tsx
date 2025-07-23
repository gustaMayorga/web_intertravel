'use client';

import React, { useState } from 'react';
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
  Star,
  Database
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Analytics BI', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Paquetes', href: '/admin/packages', icon: Package },
  { name: 'Destinos', href: '/admin/destinations', icon: MapPin },
  { name: 'Priorización', href: '/admin/priority', icon: Star },
  { name: 'Reservas', href: '/admin/bookings', icon: Calendar },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Fallback Config', href: '/admin/fallback', icon: Database },
  { name: 'Configuración', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    router.push('/admin/login');
  };

  let user = null;
  if (typeof window !== 'undefined') {
    try {
      const storedUser = sessionStorage.getItem('auth_user');
      if (storedUser) {
        user = JSON.parse(storedUser);
      }
    } catch (e) {
      // Ignorar errores
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white lg:shadow-lg">
        {/* Logo Header */}
        <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center w-full">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">InterTravel</span>
              <div className="text-xs text-blue-100">Panel Administrativo</div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="mt-6 flex flex-col flex-1">
          <nav className="flex-1 px-3 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md transform scale-105'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
                  }`}
                  style={{
                    boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.15)' : undefined
                  }}
                >
                  <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  
                  {/* Hover Effect - Golden Underline */}
                  {!isActive && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  )}
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-r-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* User Profile */}
          <div className="px-3 py-6 border-t border-gray-200 bg-gray-50">
            <div className="mb-4 px-3">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-2.5 shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.name || user?.username || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-600 capitalize bg-blue-100 px-2 py-0.5 rounded-full inline-block">
                    {user?.role || 'super_admin'}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 group-hover:text-red-600" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">InterTravel</span>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 shadow-lg">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                    }`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">Conectado como:</div>
              <div className="text-sm font-medium text-gray-900">
                {user?.name || user?.username || 'Admin'}
              </div>
              <div className="text-xs text-blue-600 capitalize">
                {user?.role || 'super_admin'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1 bg-gray-50">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        /* Ensure proper text contrast */
        .text-white {
          color: #ffffff !important;
        }
        
        .text-gray-900 {
          color: #111827 !important;
        }
        
        .text-gray-700 {
          color: #374151 !important;
        }
        
        .text-blue-700 {
          color: #1d4ed8 !important;
        }
        
        /* Remove cookie notice */
        [class*="cookie"], 
        [id*="cookie"], 
        .cookie-notice,
        .cookie-banner,
        #cookie-consent {
          display: none !important;
          visibility: hidden !important;
        }
        
        /* Enhanced hover effects */
        .hover-gold-underline {
          position: relative;
        }
        
        .hover-gold-underline::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          transition: width 0.3s ease;
        }
        
        .hover-gold-underline:hover::after {
          width: 100%;
        }
      `}</style>
    </div>
  );
}