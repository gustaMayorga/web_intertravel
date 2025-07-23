'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPriorityPanel from '@/components/admin/AdminPriorityPanel';

export default function AdminPriorityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar autenticación - USAR LAS CLAVES CORRECTAS
    const token = localStorage.getItem('admin_token'); // CAMBIADO: admin_token en lugar de auth_token
    const user = localStorage.getItem('admin_user');   // CAMBIADO: localStorage en lugar de sessionStorage
    
    if (!token || !user) {
      console.log('❌ Sin token o usuario, redirigiendo al login');
      router.push('/admin/login');
      return;
    }
    
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'admin' || userData.role === 'super_admin') {
        console.log('✅ Usuario autenticado:', userData.username);
        setAuthenticated(true);
      } else {
        console.log('❌ Rol insuficiente:', userData.role);
        router.push('/admin/login');
        return;
      }
    } catch (error) {
      console.log('❌ Error parseando usuario:', error);
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
          <p className="text-gray-600">Cargando panel de priorización...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // ✅ CORRECCIÓN: Eliminar contenedor redundante, dejar que layout.tsx maneje responsive
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminPriorityPanel />
    </div>
  );
}