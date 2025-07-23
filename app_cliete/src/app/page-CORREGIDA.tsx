"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🔍 HomePage: Auth check', { isAuthenticated, loading });
    
    if (!loading) {
      if (isAuthenticated) {
        console.log('✅ HomePage: Usuario autenticado, redirigiendo a dashboard');
        router.push('/dashboard');
      } else {
        console.log('❌ HomePage: Usuario no autenticado, redirigiendo a login');
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-700">Verificando autenticación...</span>
        </div>
        <p className="text-sm text-gray-500">InterTravel - Tu portal de viajes</p>
      </div>
    </div>
  );
}
