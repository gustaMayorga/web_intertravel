'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Share2,
  Heart,
  Clock,
  Plane,
  Hotel,
  Car,
  Camera,
  Shield,
  CreditCard,
  Phone,
  Mail,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react';
import WhatsAppReserveButton from '@/components/WhatsAppReserveButton';

interface Package {
  id: string;
  title: string;
  destination: string;
  country: string;
  price: {
    amount: number;
    currency: string;
  };
  originalPrice?: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  category: string;
  description: {
    short: string;
    full: string;
  };
  images: {
    main: string;
  };
  rating: {
    average: number;
    count: number;
  };
  features: string[];
  featured: boolean;
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    travelers: 2,
    departureDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    loadPackage();
  }, [params.id]);

  const loadPackage = async () => {
    try {
      setLoading(true);
      // Usar el backend correcto para obtener detalles
      const API_BASE = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3002/api' 
        : '/api';
      
      const response = await fetch(`${API_BASE}/packages/${params.id}`);
      const data = await response.json();
      
      console.log('📦 Datos del paquete recibidos:', data);

      if (data.success) {
        setPkg(data.package);
      } else {
        console.error('Package not found');
        router.push('/paquetes');
      }
    } catch (error) {
      console.error('Error loading package:', error);
      router.push('/paquetes');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);

    try {
      const response = await fetch('/api/packages/prebooking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: pkg?.id,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone,
          travelers: bookingData.travelers,
          preferredDate: bookingData.departureDate,
          specialRequests: bookingData.specialRequests
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('¡Pre-reserva creada exitosamente! Te contactaremos pronto para confirmar todos los detalles.');
        setShowBookingForm(false);
        setBookingData({
          travelers: 2,
          departureDate: '',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          specialRequests: ''
        });
      } else {
        alert('Error al crear la pre-reserva. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error de conexión. Intenta nuevamente.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Paquete no encontrado</h2>
          <Link href="/paquetes">
            <Button>Volver a Paquetes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = pkg.price.amount * bookingData.travelers;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Link href="/" className="text-2xl font-bold text-blue-600">
                InterTravel
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <Image
          src={pkg.images.main}
          alt={pkg.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 mb-2">
              {pkg.featured && (
                <Badge className="bg-orange-500 text-white">
                  ⭐ Destacado
                </Badge>
              )}
              <Badge variant="outline" className="text-white border-white">
                {pkg.category}
              </Badge>
            </div>
            <h1 className="text-4xl font-bold mb-2">{pkg.title}</h1>
            <div className="flex items-center space-x-4 text-lg">
            <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-1" />
            {pkg.destination}, {pkg.country}
            </div>
            <div className="flex items-center">
            <Calendar className="h-5 w-5 mr-1" />
            {pkg.duration.days} días / {pkg.duration.nights} noches
            </div>
            {pkg.rating && (
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-1 text-yellow-400" />
                {pkg.rating.average} ({pkg.rating.count} reseñas)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Package Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción del Viaje</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {pkg.description.full}
                </p>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="itinerary" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="itinerary">Itinerario</TabsTrigger>
                <TabsTrigger value="includes">Incluye</TabsTrigger>
                <TabsTrigger value="hotels">Hoteles</TabsTrigger>
                <TabsTrigger value="reviews">Reseñas</TabsTrigger>
              </TabsList>

              <TabsContent value="itinerary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Itinerario Detallado</CardTitle>
                    <CardDescription>
                      Día a día de tu aventura en {pkg.destination}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: pkg.duration.days }, (_, i) => (
                      <div key={i} className="border-l-2 border-blue-200 pl-4 pb-4 last:pb-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </div>
                          <h4 className="font-semibold">Día {i + 1}</h4>
                        </div>
                        <p className="text-gray-600 text-sm">
                          {i === 0 ? `Llegada a ${pkg.destination} - Check-in en hotel y bienvenida` :
                           i === pkg.duration.days - 1 ? `Desayuno y traslado al aeropuerto - Vuelo de regreso` :
                           `Exploración de ${pkg.destination} - Tours y actividades incluidas`}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="includes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>¿Qué incluye este paquete?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Incluido
                        </h4>
                        <ul className="space-y-2">
                          {(pkg.features || []).map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Seguro de viaje básico</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Asistencia 24/7</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          No incluido
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Comidas no especificadas</span>
                          </li>
                          <li className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Bebidas alcohólicas</span>
                          </li>
                          <li className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Gastos personales</span>
                          </li>
                          <li className="flex items-start">
                            <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Propinas</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hotels" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Alojamiento</CardTitle>
                    <CardDescription>
                      Hoteles seleccionados para tu estadía
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Hotel className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Hotel Premium {pkg.destination}</h4>
                          <div className="flex items-center space-x-1 my-1">
                            {[...Array(4)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                            <Star className="h-4 w-4 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-600">
                            Hotel 4 estrellas en ubicación céntrica con todas las comodidades
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>• WiFi gratuito</span>
                            <span>• Desayuno incluido</span>
                            <span>• Piscina</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Reseñas de Viajeros</CardTitle>
                    <CardDescription>
                      {pkg.rating ? `${pkg.rating.count} reseñas con promedio de ${pkg.rating.average} estrellas` : 'Sin reseñas aún'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'María G.', rating: 5, comment: 'Excelente viaje, muy bien organizado. Los guías eran muy profesionales.', date: '2024-05-15' },
                      { name: 'Carlos R.', rating: 4, comment: 'Buena experiencia en general, recomendado para familias.', date: '2024-04-22' },
                      { name: 'Ana L.', rating: 5, comment: 'Superó mis expectativas. Definitivamente volveré a viajar con InterTravel.', date: '2024-03-10' }
                    ].map((review, index) => (
                      <div key={index} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h5 className="font-semibold">{review.name}</h5>
                            <div className="flex items-center space-x-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                              {[...Array(5 - review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-gray-300" />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Reservar Ahora</span>
                  {pkg.originalPrice && (
                    <Badge variant="destructive">
                      Oferta
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Asegura tu lugar en este increíble viaje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Display */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  {pkg.originalPrice && (
                    <div className="text-lg text-gray-500 line-through">
                      ${pkg.originalPrice.amount.toLocaleString()}
                    </div>
                  )}
                  <div className="text-3xl font-bold text-blue-600">
                    ${pkg.price.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">por persona</div>
                </div>

                {/* Quick Booking Form */}
                {!showBookingForm ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Número de viajeros</Label>
                      <select
                        value={bookingData.travelers}
                        onChange={(e) => setBookingData(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      >
                        {[1,2,3,4,5,6,7,8].map(num => (
                          <option key={num} value={num}>{num} viajero{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Fecha preferida de salida</Label>
                      <Input
                        type="date"
                        value={bookingData.departureDate}
                        onChange={(e) => setBookingData(prev => ({ ...prev, departureDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span>Total estimado:</span>
                        <span className="text-xl font-bold text-blue-600">
                          ${totalPrice.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-4">
                        * Precio final sujeto a disponibilidad y condiciones
                      </p>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setShowBookingForm(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Reservar Ahora
                    </Button>

                    <WhatsAppReserveButton
                      packageData={{
                        id: pkg.id,
                        title: pkg.title,
                        destination: pkg.destination,
                        price: pkg.price,
                        duration: pkg.duration
                      }}
                      variant="secondary"
                      size="lg"
                      customMessage={`🎯 *CONSULTA PAQUETE - INTERTRAVEL*

📦 *Paquete:* ${pkg.title}
📍 *Destino:* ${pkg.destination}, ${pkg.country}
💰 *Precio:* USD ${pkg.price.amount.toLocaleString()} por persona
📅 *Duración:* ${pkg.duration.days} días / ${pkg.duration.nights} noches
👥 *Viajeros:* ${bookingData.travelers} persona${bookingData.travelers > 1 ? 's' : ''}

¡Hola! Me interesa mucho este paquete y me gustaría recibir información detallada sobre:
• Disponibilidad para ${bookingData.departureDate || 'fechas flexibles'}
• Itinerario completo
• Opciones de pago
• Promociones vigentes

¡Espero su respuesta! 😊`}
                      trackingSource="package_detail"
                    />

                    <div className="text-center">
                      <Button variant="outline" className="w-full">
                        <Phone className="h-4 w-4 mr-2" />
                        Llamar Asesor
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Nombre completo</Label>
                      <Input
                        id="customerName"
                        value={bookingData.customerName}
                        onChange={(e) => setBookingData(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={bookingData.customerEmail}
                        onChange={(e) => setBookingData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Teléfono</Label>
                      <Input
                        id="customerPhone"
                        value={bookingData.customerPhone}
                        onChange={(e) => setBookingData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Solicitudes especiales (opcional)</Label>
                      <textarea
                        id="specialRequests"
                        value={bookingData.specialRequests}
                        onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Dieta especial, ocasión especial, etc."
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm space-y-1 mb-4">
                        <div className="flex justify-between">
                          <span>{bookingData.travelers} viajero{bookingData.travelers > 1 ? 's' : ''}</span>
                          <span>${totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>${totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? 'Procesando...' : 'Confirmar Pre-reserva'}
                    </Button>

                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowBookingForm(false)}
                    >
                      Cancelar
                    </Button>

                    <p className="text-xs text-gray-600 text-center">
                      Esta es una pre-reserva sin costo. Te contactaremos para confirmar disponibilidad y procesar el pago.
                    </p>
                  </form>
                )}

                {/* Trust indicators */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-2 text-green-600" />
                    Pago 100% seguro
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 text-blue-600" />
                    Asistencia 24/7
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Garantía de satisfacción
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-4">
            ¿Tienes preguntas sobre este viaje?
          </h2>
          <p className="text-blue-100 mb-6">
            Nuestros expertos están listos para ayudarte
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Phone className="h-4 w-4 mr-2" />
              +54 261 XXX-XXXX
            </Button>
            <WhatsAppReserveButton
              packageData={{
                id: pkg.id,
                title: pkg.title,
                destination: pkg.destination,
                price: pkg.price,
                duration: pkg.duration
              }}
              variant="outline"
              size="lg"
              customMessage={`👤 *CONSULTA DESDE PÁGINA DE DETALLES*

🎯 Me interesa el paquete: ${pkg.title}
📍 Destino: ${pkg.destination}, ${pkg.country}

¿Podrían brindarme información completa sobre este viaje? 🌍

¡Gracias! 😊`}
              trackingSource="package_detail_cta"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
