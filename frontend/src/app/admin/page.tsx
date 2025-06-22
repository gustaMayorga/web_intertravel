'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 🔄 PÁGINA DE REDIRECCIÓN AUTOMÁTICA - /admin
 * ============================================
 * 
 * Esta página redirige automáticamente a /admin/login
 * para evitar errores 404 cuando los usuarios acceden a /admin
 */

export default function AdminRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir inmediatamente a la página de login
    router.replace('/admin/login');
  }, [router]);
  
  // Mostrar loader mientras redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al panel de administración...</p>
      </div>
    </div>
  );
}