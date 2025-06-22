'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 🔄 PÁGINA DE REDIRECCIÓN AUTOMÁTICA - /agency
 * ============================================
 * 
 * Esta página redirige automáticamente a /agency/login
 * para evitar errores 404 cuando los usuarios acceden a /agency
 */

export default function AgencyRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir inmediatamente a la página de login
    router.replace('/agency/login');
  }, [router]);
  
  // Mostrar loader mientras redirige
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo al portal de agencias...</p>
      </div>
    </div>
  );
}