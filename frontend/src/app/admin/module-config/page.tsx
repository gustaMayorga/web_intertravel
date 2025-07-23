'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Importación dinámica para evitar problemas de SSR
const ModuleConfigPanel = dynamic(() => import('@/components/admin/ModuleConfigPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando configuración de módulos...</p>
      </div>
    </div>
  )
});

export default function ModuleConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar autenticación y permisos
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const user = typeof window !== 'undefined' ? sessionStorage.getItem('auth_user') : null;
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }
    
    try {
      const userData = JSON.parse(user);
      
      // Solo super_admin puede configurar módulos
      if (userData.role === 'super_admin') {
        setAuthenticated(true);
      } else {
        router.push('/admin/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/admin/login');
      return;
    }
    
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-1">Acceso Denegado</h3>
            <p className="text-red-700">Solo super administradores pueden configurar módulos del sistema.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModuleConfigPanel />
      </div>
    </div>
  );
}
