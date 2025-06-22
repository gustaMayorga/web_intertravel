'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, ArrowLeft, Building2 } from 'lucide-react';
import DemoCredentials from '@/components/ui/DemoCredentials';
import { useLoginRedirect } from '@/lib/auth-security';

export default function AgencyLoginPage() {
  const router = useRouter();
  
  // Usar hook de seguridad para redirigir si ya está autenticado
  useLoginRedirect('agency');
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/agency-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar token de agencia
        localStorage.setItem('agencyToken', data.token);
        localStorage.setItem('agency', JSON.stringify(data.agency));
        localStorage.setItem('agencyUser', JSON.stringify(data.user));
        
        // Redirigir al dashboard de agencias
        router.push('/agency/dashboard');
      } else {
        setErrors({ submit: data.error || 'Error en el login' });
      }
    } catch (error) {
      setErrors({ submit: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back button */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="text-center">
              <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Portal de Agencias
              </CardTitle>
              <CardDescription className="text-gray-600">
                Acceso exclusivo para agencias de viaje
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Usuario de Agencia</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="nombre_agencia"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="h-11"
                  required
                />
                {errors.username && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña de agencia"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Acceder al Portal'}
              </Button>
            </form>

            {/* Features */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Portal de Agencias incluye:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Tarifas especiales para agencias</li>
                <li>• Gestión de comisiones</li>
                <li>• Dashboard de ventas</li>
                <li>• Soporte prioritario</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center">
              <p className="text-sm text-gray-800 font-medium">
                ¿No tienes acceso? 
                <br />
                <Link 
                  href="/contacto" 
                  className="text-blue-700 hover:text-blue-800 hover:underline font-bold"
                >
                  Contacta con nosotros
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo credentials - Solo en desarrollo */}
        <DemoCredentials type="agency" />

        {/* User Portal Link */}
        <div className="text-center">
          <p className="text-sm text-white font-medium">
            ¿Eres un cliente?{' '}
            <Link href="/auth/login" className="text-blue-300 hover:text-blue-200 hover:underline font-bold">
              Ir al portal de clientes
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
