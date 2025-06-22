'use client';

/**
 * 🔐 LOGIN ADMIN - INTERTRAVEL WEB-FINAL-UNIFICADA
 * ===============================================
 * 
 * ✅ Página de login del admin
 * ✅ Autenticación con backend/demo
 * ✅ Redirección automática
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import DemoCredentials from '@/components/ui/DemoCredentials';
import { useLoginRedirect } from '@/lib/auth-security';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading, error: authError } = useAuth();
  
  // Usar hook de seguridad para redirigir si ya está autenticado
  useLoginRedirect('admin');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await login(formData);
      
      if (result.success) {
        console.log('✅ Login exitoso, redirigiendo...');
        router.replace('/admin/dashboard');
      } else {
        setError(result.error || 'Error de autenticación');
      }
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            InterTravel Admin
          </h1>
          <p className="text-gray-600">
            Accede al panel de administración
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-gray-900">
              Iniciar Sesión
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Usuario
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Ingresa tu usuario"
                  className="h-11"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu contraseña"
                    className="h-11 pr-10"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {(error || authError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-800 text-sm font-medium">
                      {error || authError}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading || !formData.username || !formData.password}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Demo Credentials Info - Solo en desarrollo */}
            <DemoCredentials type="admin" />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 InterTravel Group. Todos los derechos reservados.</p>
          <p className="mt-1">WEB-FINAL-UNIFICADA v2.0</p>
        </div>
      </div>
    </div>
  );
}