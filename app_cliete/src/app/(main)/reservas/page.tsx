"use client";

/**
 *  MIS RESERVAS - APP CLIENTE INTERTRAVEL
 * =========================================
 * 
 *  Vista completa de reservas del cliente desde backend
 *  Estados en tiempo real
 *  Detalles de viaje y pagos reales
 *  Comunicación directa con InterTravel
 */

import { useState, useEffect } from 'react';
import { bookingsService } from "@/services/bookings-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Phone,
  MessageCircle,
  Download,
  Eye,
  Plane,
  DollarSign,
  RefreshCw,
  Calendar as CalendarIcon,
  Loader2,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
// import { useBookingsService } from '@/services/bookings-service'; //  REMOVIDO
import { type Booking, type UserStats } from '@/services/api-client';

export default function ReservasPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  // const bookingsService = useBookingsService(); //  No existe
  
  //  Usar instancia directa:
  // import { bookingsService } from "@/services/bookings-service";
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadUserData();
    } else {
      setLoading(false);
      setError('Usuario no autenticado');
    }
  }, [isAuthenticated, currentUser]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(' Cargando reservas del usuario...');
      console.log(' bookingsService:', bookingsService); // DEBUG
      
      if (!bookingsService) {
        throw new Error('bookingsService is undefined');
      }
      
      // Cargar reservas
      const bookingsResult = await bookingsService.getUserBookings();
      if (bookingsResult.success && bookingsResult.bookings) {
        setBookings(bookingsResult.bookings);
        console.log(` ${bookingsResult.bookings.length} reservas cargadas`);
      } else {
        throw new Error(bookingsResult.error || 'Error cargando reservas');
      }
      
      // Cargar estadísticas
      const statsResult = await bookingsService.getUserStats();
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
      
    } catch (error) {
      console.error(' Error cargando datos:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      toast({
        title: "Error cargando reservas",
        description: "No se pudieron cargar tus reservas. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3 mb-8">
          <Calendar className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Mis Reservas</h2>
            <p className="text-blue-100">Cargando tus viajes...</p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white/90">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3 mb-8">
          <Calendar className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Mis Reservas</h2>
            <p className="text-blue-100">Gestiona tus viajes y reservas.</p>
          </div>
        </div>
        
        <Alert variant="destructive" className="bg-red-50/90 backdrop-blur">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={loadUserData} variant="outline" className="bg-white/90">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  // No bookings state
  if (bookings.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-10 w-10 text-primary" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Mis Reservas</h2>
              <p className="text-blue-100">
                {currentUser ? `Bienvenido ${currentUser.firstName}` : 'Gestiona tus viajes y reservas.'}
              </p>
            </div>
          </div>
          <Button onClick={loadUserData} variant="outline" size="sm" className="bg-white/90">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
        
        <Card className="shadow-lg bg-white/95 backdrop-blur">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Plane className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aún no tienes reservas
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              ¡Es hora de planificar tu próxima aventura! Explora nuestros increíbles paquetes de viaje.
            </p>
            <div className="space-y-3">
              <Link href="/packages">
                <Button className="mr-3">
                  <MapPin className="h-4 w-4 mr-2" />
                  Explorar Paquetes
                </Button>
              </Link>
              <Link href="/support">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contactar Asesor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content with bookings
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-10 w-10 text-primary" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Mis Reservas</h2>
            <p className="text-blue-100">
              {currentUser ? `Bienvenido ${currentUser.firstName} - ${bookings.length} reservas` : 'Gestiona tus viajes y reservas.'}
            </p>
          </div>
        </div>
        <Button onClick={loadUserData} variant="outline" size="sm" className="bg-white/90">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/90 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookingsService.formatCurrency(stats.totalSpent)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookingsService.formatCurrency(stats.avgBookingValue)}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => {
          const daysUntilTravel = bookingsService.getDaysUntilTravel(booking.travelDate);
          const isUpcoming = daysUntilTravel > 0;
          const destinationImage = bookingsService.getDestinationImage(booking.destination);
          
          return (
            <Card key={booking.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/95 backdrop-blur">
              {/* Image Header */}
              <div className="relative h-48">
                <Image
                  src={destinationImage}
                  alt={booking.destination}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className={bookingsService.getStatusColor(booking.status)}>
                    {bookingsService.getStatusText(booking.status)}
                  </Badge>
                  <Badge className={bookingsService.getPaymentStatusColor(booking.paymentStatus)}>
                    {bookingsService.getPaymentStatusText(booking.paymentStatus)}
                  </Badge>
                </div>
                
                {/* Countdown */}
                {isUpcoming && (
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1">
                    <p className="text-xs font-medium text-gray-900">
                      {daysUntilTravel === 1 ? '¡Mañana!' : `${daysUntilTravel} días`}
                    </p>
                  </div>
                )}
                
                {/* Destination Title */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {booking.packageTitle}
                  </h3>
                  <div className="flex items-center text-white/90">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{booking.destination}, {booking.country}</span>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Travel Dates */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {bookingsService.formatShortDate(booking.travelDate)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{booking.durationDays} días</p>
                    </div>
                  </div>
                  
                  {/* Travelers & Amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {booking.travelersCount} {booking.travelersCount === 1 ? 'viajero' : 'viajeros'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {bookingsService.formatCurrency(booking.totalAmount, booking.currency)}
                      </p>
                      {booking.paidAmount > 0 && (
                        <p className="text-xs text-green-600">
                          Pagado: {bookingsService.formatCurrency(booking.paidAmount, booking.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Detalles
                    </Button>
                    
                    {booking.status === 'confirmed' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Voucher
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedBooking.packageTitle}</CardTitle>
                  <CardDescription>
                    Reserva #{selectedBooking.bookingReference}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status Section */}
              <div className="flex gap-3">
                <Badge className={bookingsService.getStatusColor(selectedBooking.status)}>
                  {bookingsService.getStatusText(selectedBooking.status)}
                </Badge>
                <Badge className={bookingsService.getPaymentStatusColor(selectedBooking.paymentStatus)}>
                  {bookingsService.getPaymentStatusText(selectedBooking.paymentStatus)}
                </Badge>
              </div>
              
              {/* Travel Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Destino</p>
                  <p className="text-lg">{selectedBooking.destination}, {selectedBooking.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duración</p>
                  <p className="text-lg">{selectedBooking.durationDays} días</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de salida</p>
                  <p className="text-lg">{bookingsService.formatDate(selectedBooking.travelDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de regreso</p>
                  <p className="text-lg">{bookingsService.formatDate(selectedBooking.returnDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Viajeros</p>
                  <p className="text-lg">{selectedBooking.travelersCount} personas</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-lg font-bold">
                    {bookingsService.formatCurrency(selectedBooking.totalAmount, selectedBooking.currency)}
                  </p>
                </div>
              </div>
              
              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Solicitudes Especiales</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Voucher
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contactar Asesor
                </Button>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
