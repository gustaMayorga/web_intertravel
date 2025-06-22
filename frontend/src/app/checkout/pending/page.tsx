'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw, CheckCircle, AlertTriangle, Mail, Phone } from 'lucide-react';

export default function CheckoutPendingPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos en segundos

  useEffect(() => {
    if (orderId) {
      loadOrderData();
      startStatusChecking();
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      
      // En producción, cargar datos reales del backend
      // const response = await fetch(`/api/payments/verify/${orderId}`);
      // const result = await response.json();
      
      // Por ahora, simulamos datos
      const mockOrderData = {
        orderId: orderId,
        packageTitle: 'París: Ciudad de la Luz - 7 días mágicos',
        packageDestination: 'París, Francia',
        amount: 1850.00,
        currency: 'USD',
        customerName: 'Cliente Demo',
        customerEmail: 'cliente@email.com',
        paymentMethod: 'MercadoPago',
        status: 'pending'
      };
      
      setOrderData(mockOrderData);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const startStatusChecking = () => {
    const interval = setInterval(async () => {
      await checkPaymentStatus();
    }, 10000); // Verificar cada 10 segundos

    // Limpiar después de 5 minutos
    setTimeout(() => {
      clearInterval(interval);
    }, 300000);

    return () => clearInterval(interval);
  };

  const checkPaymentStatus = async () => {
    try {
      setCheckingStatus(true);
      
      // En producción, verificar estado real
      // const response = await fetch(`/api/payments/verify/${orderId}`);
      // const result = await response.json();
      
      // Simular probabilidad de cambio de estado
      const random = Math.random();
      if (random > 0.8) {
        // 20% de probabilidad de éxito
        window.location.href = `/checkout/success?orderId=${orderId}`;
      } else if (random < 0.1) {
        // 10% de probabilidad de fallo
        window.location.href = `/checkout/failure?orderId=${orderId}&error=processing_timeout`;
      }
      
    } catch (error) {
      console.error('Error verificando estado:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header de Pendiente */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Clock className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Pago en Proceso
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Estamos verificando tu pago
            </p>
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 text-sm animate-pulse">
              ⏳ PROCESANDO
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Estado del Pago */}
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <Clock className="h-5 w-5 animate-spin" />
                  Estado del Pago
                </CardTitle>
                <CardDescription>
                  Verificando con {orderData?.paymentMethod}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-yellow-800">
                      Verificación Automática
                    </h4>
                    <div className="flex items-center gap-2">
                      {checkingStatus && (
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      <span className="text-sm text-yellow-700">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Estamos verificando tu pago automáticamente cada 10 segundos. 
                    La confirmación puede tardar hasta 5 minutos.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-700">Pago iniciado correctamente</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-yellow-700">Verificando con el banco...</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Confirmación de reserva</span>
                    </div>
                  </div>
                </div>

                {orderData && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      Detalles de la Transacción
                    </h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Orden:</strong> {orderData.orderId}</p>
                      <p><strong>Método:</strong> {orderData.paymentMethod}</p>
                      <p><strong>Monto:</strong> {formatCurrency(orderData.amount, orderData.currency)}</p>
                      <p><strong>Estado:</strong> {orderData.status}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del Viaje */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">
                  Tu Reserva
                </CardTitle>
                <CardDescription>
                  Detalles de tu viaje seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderData && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {orderData.packageTitle}
                      </h3>
                      <p className="text-gray-600">{orderData.packageDestination}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">
                        ✅ Tu lugar está reservado
                      </h4>
                      <p className="text-sm text-green-700">
                        Mientras procesamos tu pago, hemos reservado tu lugar. 
                        No te preocupes por la disponibilidad.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-semibold text-gray-800">
                        Una vez confirmado el pago:
                      </h5>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          Recibirás tu voucher digital por email
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          Te contactaremos en las próximas 24hs
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          Coordinaremos fechas y detalles del viaje
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          Te ayudaremos con toda la documentación
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Acciones */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h4 className="font-semibold text-gray-900">
                  ¿Qué puedes hacer mientras esperas?
                </h4>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => checkPaymentStatus()}
                    disabled={checkingStatus}
                  >
                    {checkingStatus ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                        Verificando...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Verificar Ahora
                      </>
                    )}
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/account/dashboard">
                      Ver Mi Dashboard
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">
                      Explorar Más Viajes
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ayuda y Contacto */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    ¿Por qué está pendiente mi pago?
                  </h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>Los pagos pueden estar pendientes por:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Verificación adicional del banco</li>
                      <li>• Proceso de autorización en curso</li>
                      <li>• Validación de seguridad rutinaria</li>
                      <li>• Tiempo de procesamiento normal</li>
                    </ul>
                    <p className="text-xs text-gray-500 mt-3">
                      Esto es completamente normal y tu pago está siendo procesado de forma segura.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    ¿Necesitas ayuda inmediata?
                  </h4>
                  <div className="space-y-3">
                    <a 
                      href="https://wa.me/5492611234567" 
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors text-sm"
                    >
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">📱</span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">WhatsApp</p>
                        <p className="text-green-600">Respuesta inmediata</p>
                      </div>
                    </a>

                    <a 
                      href="tel:+5492611234567"
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-sm"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800">Teléfono</p>
                        <p className="text-blue-600">+54 261 XXX-XXXX</p>
                      </div>
                    </a>

                    <a 
                      href="mailto:ventas@intertravel.com.ar"
                      className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-sm"
                    >
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-800">Email</p>
                        <p className="text-purple-600">ventas@intertravel.com.ar</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer informativo */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>
              Esta página se actualiza automáticamente. No es necesario que la recargues.
            </p>
            <p className="mt-1">
              Si el pago no se confirma en 5 minutos, serás redirigido automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}