'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, ArrowLeft, Building2, Shield, Users, Award, Star, CheckCircle, Phone, Mail } from 'lucide-react';
import DemoCredentials from '@/components/ui/DemoCredentials';

export default function AgencyLoginPage() {
  const router = useRouter();
  
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
      console.log('🔐 Intentando login de agencia con endpoint correcto...');
      
      const response = await fetch('/api/auth/agency-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('📥 Respuesta del servidor:', data);

      if (data.success) {
        localStorage.clear();
        
        localStorage.setItem('agencyToken', data.token);
        localStorage.setItem('agencyUser', JSON.stringify(data.user));
        localStorage.setItem('agency_lastActivity', Date.now().toString());
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('✅ Login exitoso, datos guardados');
        console.log('👤 Usuario:', data.user);
        
        if (data.user.role === 'admin_agencia') {
          console.log('🔄 Redirigiendo a dashboard de agencias...');
          router.push('/agency/dashboard');
        } else {
          setErrors({ submit: 'Este usuario no tiene permisos de agencia' });
        }
        
      } else {
        setErrors({ submit: data.error || 'Error en el login' });
      }
    } catch (error) {
      console.error('❌ Error de login:', error);
      setErrors({ submit: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 50%, #121c2e 100%)'}}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(179, 129, 68, 0.2) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              
              <Link href="/" className="flex items-center space-x-3">
                <img 
                  src="/logo-intertravel.png" 
                  alt="InterTravel Logo" 
                  className="h-10 w-auto"
                />
                <div className="hidden sm:block">
                  <div className="text-lg font-bold text-white">InterTravel</div>
                  <div className="text-xs text-blue-300">Portal de Agencias</div>
                </div>
              </Link>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-white/80">¿Eres cliente?</div>
              <Link href="/auth/login" className="text-blue-300 hover:text-blue-200 font-semibold text-sm">
                Portal Clientes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Info */}
          <div className="text-white space-y-8">
            <div>
              <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-6">
                <Building2 className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">Portal Exclusivo B2B</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Acceso a Tarifas
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  Preferenciales
                </span>
              </h1>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Únete a nuestra red de agencias partners y accede a herramientas exclusivas,
                comisiones atractivas y soporte especializado.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="font-semibold">Comisiones hasta 15%</span>
                </div>
                <p className="text-white/70 text-sm">
                  Márgenes competitivos para maximizar tus ganancias
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="font-semibold">Plataforma B2B</span>
                </div>
                <p className="text-white/70 text-sm">
                  Herramientas especializadas para agencias
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="font-semibold">Soporte Personalizado</span>
                </div>
                <p className="text-white/70 text-sm">
                  Atención prioritaria y asesoramiento comercial
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="font-semibold">Material Promocional</span>
                </div>
                <p className="text-white/70 text-sm">
                  Catálogos, folletos y contenido gratuito
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-xl p-6 border border-yellow-400/30">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-yellow-400" />
                ¿Necesitas ayuda?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-yellow-400" />
                  <span>+54 261 XXX-XXXX</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <span>agencias@intertravel.com.ar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-md border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-black" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Accede a tu portal de agencia
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Username */}
    <div className="space-y-2">
      <Label htmlFor="username" className="text-gray-700 font-medium">
        Usuario de Agencia
      </Label>
      <div className="relative">
        <Input
          id="username"
          type="text"
          placeholder="agencia_admin"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          className="h-12 pl-4 pr-10 border-black focus:border-blue-500 focus:ring-blue-500 text-black placeholder-gray-500"
          required
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Users className="h-5 w-5 text-black" />
        </div>
      </div>
      {errors.username && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors.username}
        </p>
      )}
    </div>

    {/* Password */}
    <div className="space-y-2">
      <Label htmlFor="password" className="text-gray-700 font-medium">
        Contraseña
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="agencia123"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="h-12 pl-4 pr-10 border-black focus:border-blue-500 focus:ring-blue-500 text-black placeholder-gray-500"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-700"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {errors.submit}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Ingresando...
                      </>
                    ) : (
                      'Acceder al Portal'
                    )}
                  </Button>
                </form>

                {/* Demo Credentials */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Credenciales de Prueba
                  </h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div><strong>Usuario:</strong> agencia_admin</div>
                    <div><strong>Contraseña:</strong> agencia123</div>
                  </div>
                </div>

                {/* Features Info */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    Tu portal incluye:
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Dashboard de ventas y comisiones
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Catálogo completo de paquetes
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Herramientas de gestión B2B
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Reportes y analíticas
                    </div>
                  </div>
                </div>

                {/* Contact Link */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    ¿No tienes acceso?
                  </p>
                  <Link 
                    href="/contacto" 
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    Solicita tu cuenta de agencia
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-white/60 text-sm">
            <p>
              © 2025 InterTravel Group. Portal exclusivo para agencias de viaje.
            </p>
            <p className="mt-1">
              EVyT 15.566 | Legajo 15566 | Disposición 2194/2009
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
