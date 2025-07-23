"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { BriefcaseBusiness, Loader2, FileText, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, AlertCircle, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

interface DNICheckResult {
  document_number: string;
  user_registered: boolean;
  has_bookings: boolean;
  bookings_count: number;
  can_register: boolean;
  should_link: boolean;
  existing_user?: {
    email: string;
    name: string;
  };
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterDNIPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Estados principales
  const [step, setStep] = useState<'dni' | 'register'>('dni');
  const [isLoading, setIsLoading] = useState(false);
  const [dni, setDni] = useState('');
  const [dniResult, setDniResult] = useState<DNICheckResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Datos de registro
  const [registerData, setRegisterData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar DNI (8 dígitos)
  const isValidDNI = (dni: string) => {
    return /^\d{8}$/.test(dni);
  };

  // Verificar DNI
  const handleDNICheck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setErrors({});
    
    // Validaciones
    if (!dni.trim()) {
      setErrors({ dni: 'El DNI es requerido' });
      return;
    }
    
    if (!isValidDNI(dni)) {
      setErrors({ dni: 'El DNI debe tener 8 dígitos' });
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log('🔍 Verificando DNI:', dni);
      
      const response = await fetch('http://localhost:3002/api/app/auth/check-dni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_number: dni })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result: DNICheckResult = await response.json();
      console.log('✅ Resultado DNI:', result);
      
      setDniResult(result);
      
      if (result.user_registered) {
        toast({
          title: "Usuario ya registrado",
          description: `Este DNI ya está asociado a ${result.existing_user?.email}. Por favor, inicia sesión.`,
          variant: "destructive",
        });
      } else if (result.can_register) {
        setStep('register');
        if (result.should_link && result.has_bookings) {
          toast({
            title: "¡Excelente!",
            description: `Encontramos ${result.bookings_count} reserva(s) asociada(s) a tu DNI. Al registrarte, podrás acceder a toda tu información.`,
          });
        } else {
          toast({
            title: "DNI verificado",
            description: "Procede con el registro para crear tu cuenta.",
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error verificando DNI:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo verificar el DNI. Verifica tu conexión e intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setErrors({});
    
    // Validaciones
    const newErrors: {[key: string]: string} = {};
    
    if (!registerData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    
    if (!registerData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    
    if (!registerData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!isValidEmail(registerData.email)) {
      newErrors.email = 'Formato de email inválido';
    }
    
    if (!registerData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      setIsLoading(true);
      
      console.log('📝 Registrando usuario con DNI:', dni);
      
      const response = await fetch('http://localhost:3002/api/app/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registerData.email,
          document_number: dni,
          first_name: registerData.firstName,
          last_name: registerData.lastName,
          password: registerData.password,
          phone: registerData.phone
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Registro exitoso:', result);
      
      toast({
        title: "¡Registro exitoso!",
        description: dniResult?.should_link 
          ? "Tu cuenta ha sido creada y vinculada con tus reservas anteriores."
          : "Tu cuenta ha sido creada exitosamente.",
      });
      
      // Redirigir al login
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      toast({
        title: "Error en el registro",
        description: error instanceof Error ? error.message : "Error al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BriefcaseBusiness className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">InterTravel</h1>
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Registro con DNI
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            {step === 'dni' 
              ? 'Primero verificaremos tu DNI para vincular tus reservas anteriores.'
              : 'Completa tus datos para finalizar el registro.'
            }
          </p>
        </div>

        {/* Progreso */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${step === 'dni' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'dni' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'dni' ? '1' : <CheckCircle className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium">Verificar DNI</span>
          </div>
          <div className={`w-8 h-1 ${step === 'register' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center space-x-2 ${step === 'register' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Crear Cuenta</span>
          </div>
        </div>

        {/* Contenido principal */}
        <Card className="shadow-xl border-0">
          {step === 'dni' ? (
            /* PASO 1: VERIFICACIÓN DNI */
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Verificación de DNI
                </CardTitle>
                <CardDescription>
                  Ingresa tu número de DNI para verificar si tienes reservas anteriores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDNICheck} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dni">Número de DNI</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="dni"
                        type="text"
                        placeholder="12345678"
                        value={dni}
                        onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className={`pl-10 ${errors.dni ? 'border-red-500' : ''}`}
                        maxLength={8}
                      />
                    </div>
                    {errors.dni && (
                      <p className="text-sm text-red-500">{errors.dni}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Solo números, sin puntos ni espacios.
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando DNI...
                      </>
                    ) : (
                      'Verificar DNI'
                    )}
                  </Button>
                </form>
                
                {/* Resultado DNI */}
                {dniResult && (
                  <div className="mt-4 space-y-3">
                    <Separator />
                    
                    {dniResult.user_registered ? (
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <strong>Usuario ya registrado:</strong> Este DNI ya está asociado a una cuenta.
                          <br />
                          <Link href="/login" className="underline text-amber-900 hover:text-amber-700">
                            Ir al Login
                          </Link>
                        </AlertDescription>
                      </Alert>
                    ) : dniResult.should_link && dniResult.has_bookings ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>¡Genial!</strong> Encontramos {dniResult.bookings_count} reserva(s) asociada(s) a tu DNI.
                          Al registrarte, podrás acceder a toda tu información de viajes.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-blue-200 bg-blue-50">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>DNI verificado:</strong> Puedes proceder con el registro.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            /* PASO 2: REGISTRO */
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  Completar Registro
                </CardTitle>
                <CardDescription>
                  DNI: <strong>{dni}</strong> verificado. 
                  {dniResult?.should_link && (
                    <span className="text-green-600"> • {dniResult.bookings_count} reserva(s) serán vinculadas</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Juan"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                        className={errors.firstName ? 'border-red-500' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Pérez"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                        className={errors.lastName ? 'border-red-500' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono (opcional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+54 9 11 1234-5678"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repite tu contraseña"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep('dni')}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        'Crear Cuenta'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
        
        {/* Footer */}
        <div className="space-y-3">
          {step === 'dni' && (
            <p className="text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                Iniciar Sesión
              </Link>
            </p>
          )}
          
          <p className="text-center text-xs text-gray-500">
            Al continuar, aceptas nuestros{" "}
            <Link href="#" className="font-medium text-blue-600 hover:underline">
              Términos y Condiciones
            </Link>
            {" "}y{" "}
            <Link href="#" className="font-medium text-blue-600 hover:underline">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
