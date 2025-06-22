'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { XCircle, RefreshCw, CreditCard, AlertTriangle, HelpCircle, ArrowLeft, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CheckoutFailurePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');
  
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

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
        status: 'failed',
        failureReason: error || 'El pago no pudo ser procesado'
      };
      
      setOrderData(mockOrderData);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    setRetryLoading(true);
    // Redirigir a la página de checkout para reintentar
    window.location.href = `/checkout/${orderId}`;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getErrorMessage = (reason: string) => {
    const commonErrors: { [key: string]: string } = {
      'insufficient_funds': 'Fondos insuficientes en tu tarjeta',
      'card_declined': 'Tu tarjeta fue rechazada por el banco',
      'expired_card': 'Tu tarjeta ha expirado',
      'invalid_card': 'Los datos de la tarjeta son incorrectos',
      'processing_error': 'Error temporal del procesador de pagos',
      'cancelled': 'El pago fue cancelado',
      'timeout': 'El tiempo de la sesión expiró'
    };
    
    return commonErrors[reason] || reason || 'Error no especificado';
  };

  const getSolutions = (reason: string) => {
    const solutions: { [key: string]: string[] } = {
      'insufficient_funds': [
        'Verifica el saldo disponible en tu tarjeta',
        'Intenta con otra tarjeta con fondos suficientes',
        'Contacta a tu banco para verificar límites'
      ],
      'card_declined': [
        'Verifica que los datos ingresados sean correctos',
        'Contacta a tu banco para autorizar la transacción',
        'Intenta con otra tarjeta'
      ],
      'expired_card': [
        'Usa una tarjeta vigente',
        'Actualiza los datos de tu tarjeta'
      ],
      'invalid_card': [
        'Verifica que el número de tarjeta sea correcto',
        'Confirma que el código de seguridad esté bien',
        'Revisa la fecha de vencimiento'
      ],
      'default': [
        'Verifica que tu tarjeta tenga fondos suficientes',
        'Confirma que los datos ingresados sean correctos',
        'Intenta con otra tarjeta o método de pago',
        'Contacta a tu banco si el problema persiste'
      ]
    };
    
    return solutions[reason] || solutions['default'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando información del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header de Error */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Problema con el Pago
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              No pudimos procesar tu pago, pero no te preocupes
            </p>
            <Badge variant="destructive" className="px-4 py-2 text-sm">
              ❌ PAGO FALLIDO
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Información del Error */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  ¿Qué pasó?
                </CardTitle>
                <CardDescription>
                  Detalles del problema con el pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderData && (
                  <>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Error:</strong> {getErrorMessage(orderData.failureReason)}
                      </AlertDescription>
                    </Alert>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Detalles de la Orden
                      </h4>
                      <div className="text-sm text-red-700 space-y-1">
                        <p><strong>Orden:</strong> {orderData.orderId}</p>
                        <p><strong>Paquete:</strong> {orderData.packageTitle}</p>
                        <p><strong>Monto:</strong> {formatCurrency(orderData.amount, orderData.currency)}</p>
                        <p><strong>Estado:</strong> {orderData.status}</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        ¿Cómo solucionarlo?
                      </h5>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {getSolutions(orderData.failureReason || 'default').map((solution, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            {solution}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Opciones de Solución */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">
                  Opciones para Continuar
                </CardTitle>
                <CardDescription>
                  Elige cómo quieres proceder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700" 
                    onClick={handleRetryPayment}
                    disabled={retryLoading}
                  >
                    {retryLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Redirigiendo...
                      </div>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reintentar Pago
                      </>
                    )}
                  </Button>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/checkout/new">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Usar Otro Método de Pago
                    </Link>
                  </Button>

                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver al Inicio
                    </Link>
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-semibold text-gray-800 mb-3">
                    ¿Necesitas ayuda personal?
                  </h5>
                  <div className="space-y-2">
                    <a 
                      href="https://wa.me/5492611234567" 
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">📱</span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">WhatsApp Inmediato</p>
                        <p className="text-sm text-green-600">Te ayudamos a resolver el problema</p>
                      </div>
                    </a>

                    <a 
                      href="tel:+5492611234567"
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800">Llamada Directa</p>
                        <p className="text-sm text-blue-600">+54 261 XXX-XXXX</p>
                      </div>
                    </a>

                    <a 
                      href="mailto:ventas@intertravel.com.ar"
                      className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-800">Email</p>
                        <p className="text-sm text-purple-600">ventas@intertravel.com.ar</p>
                      </div>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información Adicional */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    ¿Por qué falló mi pago?
                  </h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>Los pagos pueden fallar por varios motivos:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Fondos insuficientes en la tarjeta</li>
                      <li>• Datos incorrectos (número, CVV, fecha)</li>
                      <li>• Restricciones del banco emisor</li>
                      <li>• Límites de compra establecidos</li>
                      <li>• Problemas temporales de conectividad</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Tu reserva sigue disponible
                  </h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>Mantuvimos tu reserva por <strong>24 horas</strong> para que puedas completar el pago sin perder tu lugar.</p>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-3">
                      <p className="text-blue-700 font-medium">
                        ⏰ Tiempo restante: 23h 45m
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garantías de Seguridad */}
          <Card className="mt-6">
            <CardContent className="p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-2">
                🔒 Seguridad Garantizada
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Todos nuestros pagos son procesados con encriptación SSL. 
                No almacenamos información de tarjetas de crédito.
              </p>
              <div className="flex justify-center gap-6 text-xs text-gray-500">
                <span>🛡️ SSL Certificado</span>
                <span>🔐 PCI DSS Compliant</span>
                <span>✅ Verificado por MercadoPago</span>
                <span>💳 Stripe Verified</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}