'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ===============================================
// PÁGINA PRINCIPAL DEL ADMIN - SUPER SIMPLE
// ===============================================
// Esta página SOLO redirige, NO verifica autenticación
// La verificación se hace en el layout o en cada página específica

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('🎯 /admin - Redirigiendo al dashboard automáticamente');
    
    // Redirigir directamente al dashboard sin verificaciones
    // El dashboard se encargará de verificar si está autenticado
    router.replace('/admin/dashboard');
    
  }, [router]);

  // Mostrar loading simple mientras redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Cargando panel administrativo...</p>
      </div>
    </div>
  );
}
