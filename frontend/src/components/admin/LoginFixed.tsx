'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

export default function AdminLoginPageFixed() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Verificar autenticación existente CORRECTAMENTE
  useEffect(() => {
    console.log('🔍 Login: Verificando autenticación existente...');
    
    const verifyExistingAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token');
        
        if (!token) {
          console.log('ℹ️ Login: No hay token, mostrando formulario');
          setInitialLoading(false);
          return;
        }

        // Verificar token con backend
        console.log('🔍 Login: Verificando token existente con backend...');
        
        const response = await fetch('http://localhost:3002/api/admin/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Login: Token válido, redirigiendo al dashboard');
          
          // Actualizar localStorage con datos verificados
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          localStorage.setItem('auth_token', token);
          
          router.replace('/admin/dashboard');
        } else {
          console.log('⚠️ Login: Token inválido, limpiando y mostrando formulario');
          
          // Limpiar localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('admin_user');
          
          setInitialLoading(false);
        }
        
      } catch (error) {
        console.error('❌ Login: Error verificando token:', error);
        console.log('ℹ️ Login: Mostrando formulario debido a error de verificación');
        setInitialLoading(false);
      }
    };

    verifyExistingAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Login: Intentando autenticar usuario...', formData.username);
      
      const response = await fetch('http://localhost:3002/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Login: Autenticación exitosa');
        
        // Guardar datos de autenticación
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Limpiar formulario
        setFormData({ username: '', password: '' });
        setError(null);
        
        console.log('🏠 Login: Redirigiendo al dashboard...');
        router.replace('/admin/dashboard');
        
      } else {
        console.log('❌ Login: Credenciales inválidas');
        setError(data.error || 'Credenciales inválidas');
      }
      
    } catch (error) {
      console.error('❌ Login: Error en autenticación:', error);
      setError('Error de conexión. Verifique que el backend esté ejecutándose.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al escribir
    if (error) setError(null);
  };

  // Mostrar loading inicial mientras verifica autenticación
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Panel de Administración
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            InterTravel Group - Acceso Seguro
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Ingrese su usuario"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Ingrese su contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !formData.username || !formData.password}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Autenticando...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Helper Info */}
          <div className="mt-6 text-center">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-700 font-medium">
                💡 Credenciales de prueba:
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Usuario: <span className="font-mono">admin</span> | 
                Contraseña: <span className="font-mono">admin123</span>
              </p>
            </div>
          </div>

          {/* Back to Site */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al sitio web
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 InterTravel Group. Sistema de administración seguro.
          </p>
        </div>
      </div>
    </div>
  );
}
