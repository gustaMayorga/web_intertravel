'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CreditCard, Globe, Users, Calendar, MapPin, Clock, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderData {
  orderId: string;
  packageId: string;
  packageTitle: string;
  packageDestination: string;
  packageDuration: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  travelers: number;
  status: string;
  createdAt: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      
      // Simulamos datos de la orden para el MVP
      // En producción esto vendría del backend
      const mockOrderData: OrderData = {
        orderId: orderId,
        packageId: 'PKG001',
        packageTitle: 'París: Ciudad de la Luz - 7 días mágicos',
        packageDestination: 'París, Francia',
        packageDuration: '7 días / 6 noches',
        amount: 1850.00,
        currency: 'USD',
        customerName: 'Cliente Demo',
        customerEmail: 'cliente@email.com',
        customerPhone: '+54 261 123-4567',
        travelers: 2,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setOrderData(mockOrderData);
    } catch (err) {
      setError('Error cargando datos de la orden');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentMethod: 'mercadopago' | 'stripe') => {
    if (!orderData) return;
    
    try {
      setPaymentLoading(prev => ({ ...prev, [paymentMethod]: true }));
      
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: orderData.packageId,
          packageTitle: orderData.packageTitle,
          packageDestination: orderData.packageDestination,
          packageDuration: orderData.packageDuration,
          amount: orderData.amount,
          currency: orderData.currency,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          travelers: orderData.travelers,
          paymentMethod: paymentMethod
        })
      });

      const result = await response.json();
      
      if (result.success) {
        if (paymentMethod === 'mercadopago' && result.redirectUrl) {
          // Redirigir a MercadoPago
          window.location.href = result.redirectUrl;
        } else if (paymentMethod === 'stripe' && result.clientSecret) {
          // Para Stripe necesitaríamos integrar Stripe Elements
          // Por ahora simulamos la redirección
          window.location.href = `/checkout/success?orderId=${result.order.orderId}`;
        }
      } else {
        setError(result.error || 'Error procesando el pago');
      }
    } catch (err) {
      setError('Error conectando con el servidor de pagos');
      console.error('Error:', err);
    } finally {
      setPaymentLoading(prev => ({ ...prev, [paymentMethod]: false }));
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de pago...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error || 'Orden no encontrada'}</p>
              <Button onClick={() => window.history.back()}>
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Confirmar Pago
            </h1>
            <p className="text-gray-600">
              Estás a un paso de confirmar tu aventura
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Resumen de la Orden */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Resumen de tu Viaje
                </CardTitle>
                <CardDescription>
                  Orden #{orderData.orderId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {orderData.packageTitle}
                  </h3>
                  <Badge variant="outline" className="mb-3">
                    {orderData.status === 'pending' ? 'Pendiente de Pago' : orderData.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      <strong>Destino:</strong> {orderData.packageDestination}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      <strong>Duración:</strong> {orderData.packageDuration}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      <strong>Pasajeros:</strong> {orderData.travelers} {orderData.travelers === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      <strong>Fecha de reserva:</strong> {new Date(orderData.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total a Pagar:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(orderData.amount, orderData.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Incluye todos los impuestos y comisiones
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Métodos de Pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Métodos de Pago
                </CardTitle>
                <CardDescription>
                  Selecciona tu método de pago preferido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* MercadoPago */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center">
                          <span className="text-white font-bold text-xs">MP</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">MercadoPago</h4>
                          <p className="text-sm text-gray-600">
                            Tarjetas, efectivo, transferencias
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Popular</Badge>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handlePayment('mercadopago')}
                      disabled={paymentLoading.mercadopago}
                    >
                      {paymentLoading.mercadopago ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Procesando...
                        </div>
                      ) : (
                        'Pagar con MercadoPago'
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Stripe */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-purple-500 rounded flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Tarjeta Internacional</h4>
                          <p className="text-sm text-gray-600">
                            Visa, Mastercard, American Express
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Seguro</Badge>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handlePayment('stripe')}
                      disabled={paymentLoading.stripe}
                    >
                      {paymentLoading.stripe ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                          Procesando...
                        </div>
                      ) : (
                        'Pagar con Tarjeta'
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Información de Seguridad */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <h5 className="font-semibold text-green-800 mb-1">
                        Pago 100% Seguro
                      </h5>
                      <p className="text-sm text-green-700">
                        Todos tus datos están protegidos con encriptación SSL. 
                        No almacenamos información de tarjetas de crédito.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Al proceder, aceptas nuestros términos y condiciones</p>
                  <p>• Recibirás tu voucher por email una vez confirmado el pago</p>
                  <p>• Nuestro equipo se contactará contigo dentro de las 24hs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer de Contacto */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">
                  ¿Necesitas ayuda con tu pago?
                </h4>
                <p className="text-gray-600 mb-4">
                  Nuestro equipo está disponible para asistirte
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <a href="https://wa.me/5492611234567" className="text-blue-600 hover:underline">
                    📱 WhatsApp: +54 9 261 XXX-XXXX
                  </a>
                  <a href="mailto:ventas@intertravel.com.ar" className="text-blue-600 hover:underline">
                    📧 ventas@intertravel.com.ar
                  </a>
                  <span className="text-gray-500">
                    📞 +54 261 XXX-XXXX
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}