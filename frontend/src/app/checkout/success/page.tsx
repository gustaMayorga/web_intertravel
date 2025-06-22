'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Mail, Calendar, Users, MapPin, DollarSign, Clock, ArrowRight } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      // Verificar estado del pago
      verifyPayment();
    }
  }, [orderId]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      
      // En producción, verificar con el backend
      // const response = await fetch(`/api/payments/verify/${orderId}`);
      // const result = await response.json();
      
      // Por ahora, simulamos datos exitosos
      const mockOrderData = {
        orderId: orderId,
        packageTitle: 'París: Ciudad de la Luz - 7 días mágicos',
        packageDestination: 'París, Francia',
        packageDuration: '7 días / 6 noches',
        amount: 1850.00,
        currency: 'USD',
        customerName: 'Cliente Demo',
        customerEmail: 'cliente@email.com',
        travelers: 2,
        paymentMethod: 'MercadoPago',
        transactionId: 'MP-' + Date.now(),
        confirmedAt: new Date().toISOString()
      };
      
      setOrderData(mockOrderData);
    } catch (error) {
      console.error('Error verificando pago:', error);
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header de Éxito */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ¡Pago Exitoso! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Tu reserva ha sido confirmada
            </p>
            <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm">
              ✅ CONFIRMADO
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Detalles de la Reserva */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">
                  Detalles de tu Reserva
                </CardTitle>
                <CardDescription>
                  Tu aventura está confirmada y lista
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderData && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {orderData.packageTitle}
                      </h3>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span><strong>Destino:</strong> {orderData.packageDestination}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span><strong>Duración:</strong> {orderData.packageDuration}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span><strong>Pasajeros:</strong> {orderData.travelers}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span><strong>Total Pagado:</strong> {formatCurrency(orderData.amount, orderData.currency)}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Información de Pago
                      </h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>Orden:</strong> {orderData.orderId}</p>
                        <p><strong>Método:</strong> {orderData.paymentMethod}</p>
                        <p><strong>ID Transacción:</strong> {orderData.transactionId}</p>
                        <p><strong>Confirmado:</strong> {new Date(orderData.confirmedAt).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Próximos Pasos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">
                  ¿Qué sigue ahora?
                </CardTitle>
                <CardDescription>
                  Pasos para completar tu experiencia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-blue-800 mb-1">
                        Voucher Enviado
                      </h5>
                      <p className="text-sm text-blue-700">
                        Recibirás tu voucher digital por email en los próximos minutos. ¡Revisa tu bandeja de entrada!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-yellow-800 mb-1">
                        Contacto Personalizado
                      </h5>
                      <p className="text-sm text-yellow-700">
                        Nuestro equipo se contactará contigo dentro de las 24hs para coordinar fechas y detalles.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-purple-800 mb-1">
                        Documentación & Tips
                      </h5>
                      <p className="text-sm text-purple-700">
                        Te ayudaremos con toda la documentación necesaria y te daremos tips exclusivos para tu destino.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-xs font-bold">4</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-green-800 mb-1">
                        ¡A Viajar!
                      </h5>
                      <p className="text-sm text-green-700">
                        Tendrás soporte 24/7 durante todo tu viaje. ¡Prepárate para vivir una experiencia inolvidable!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button className="w-full" asChild>
                    <Link href="/account/dashboard">
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Mi Reserva
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">
                      Explorar Más Destinos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información de Contacto */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">
                  ¿Necesitas ayuda o tienes preguntas?
                </h4>
                <p className="text-gray-600 mb-4">
                  Nuestro equipo está disponible para ayudarte en cualquier momento
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <a 
                    href="https://wa.me/5492611234567" 
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    📱 WhatsApp Inmediato
                  </a>
                  <a 
                    href="mailto:ventas@intertravel.com.ar" 
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                  <span className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg">
                    📞 +54 261 XXX-XXXX
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Horario de atención: Lunes a Viernes 9:00 - 18:00 • Sábados 9:00 - 13:00
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Newsletter y Redes Sociales */}
          <Card className="mt-6">
            <CardContent className="p-6 text-center">
              <h4 className="font-semibold text-gray-900 mb-2">
                ¡Síguenos para más aventuras!
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Mantente al día con nuestras ofertas exclusivas y destinos increíbles
              </p>
              <div className="flex justify-center gap-4">
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  📘 Facebook
                </a>
                <a href="#" className="text-pink-600 hover:text-pink-700">
                  📸 Instagram
                </a>
                <a href="#" className="text-red-600 hover:text-red-700">
                  📺 YouTube
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}