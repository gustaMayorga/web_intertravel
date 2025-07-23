"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sun, CalendarCheck, PartyPopper, Plane, Coffee, MountainSnow, 
  BellDot, Lightbulb, MapPin, UtensilsCrossed, Footprints, Languages, 
  Bus, ChevronDown, ChevronUp, Briefcase, Luggage, AlertCircle,
  TrendingUp, Calendar, Users, CreditCard, RefreshCw
} from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { bookingsService } from "@/services/bookings-service";
import type { BookingsResult } from "@/services/bookings-service";
import { BookingCard } from "@/components/BookingCard";
import { Booking, UserStats } from "@/services/api-client";
import { useDashboardSync } from "@/hooks/use-realtime-sync";
import { useNotificationTriggers } from "@/hooks/use-notification-triggers";

import { SyncIndicator } from "@/components/SyncIndicator";
import type { LucideIcon } from 'lucide-react';

// Mantener tips como datos estáticos
interface TravelTip {
  id: string;
  text: string;
  category: string;
  icon: LucideIcon;
}

const travelTips: TravelTip[] = [
  { id: "tip1", text: "Revisa los documentos de viaje y asegúrate de que estén vigentes", icon: MapPin, category: "Documentación" },
  { id: "tip2", text: "Consulta el clima del destino para empacar la ropa adecuada", icon: UtensilsCrossed, category: "Preparación" },
  { id: "tip3", text: "Lleva calzado cómodo para caminar y explorar", icon: Footprints, category: "Equipaje" },
  { id: "tip4", text: "Aprende algunas frases básicas del idioma local", icon: Languages, category: "Cultura Local" },
  { id: "tip5", text: "Investiga las opciones de transporte público en tu destino", icon: Bus, category: "Transporte" },
];

export default function DashboardPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Estados para reservas
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados UI
  const [showAllTips, setShowAllTips] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Hook de sincronización real-time
  const syncHook = useDashboardSync();
  const { syncStatus } = syncHook;
  const manualSync = syncHook.performSync || (() => console.log('Manual sync not available'));

  // Hook de triggers de notificaciones
  const { triggerTravelReminder } = useNotificationTriggers();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cargar reservas del usuario
  const loadUserBookings = async () => {
    try {
      setLoadingBookings(true);
      setError(null);
      
      console.log('🔄 Dashboard: Cargando reservas del usuario');
      
      const result: BookingsResult = await bookingsService.getUserBookings();
      
      if (result.success && result.bookings) {
        setBookings(result.bookings);
        console.log(`✅ Dashboard: ${result.bookings.length} reservas cargadas`);
        
        if (result.bookings.length === 0) {
          toast({
            title: "Sin reservas",
            description: "Aún no tienes reservas registradas. ¡Haz tu primera reserva!",
          });
        }
      } else {
        setError(result.error || 'Error cargando reservas');
        console.error('❌ Dashboard: Error cargando reservas', result.error);
      }
    } catch (error) {
      const errorMessage = 'Error de conexión al cargar reservas';
      setError(errorMessage);
      console.error('❌ Dashboard: Error de conexión', error);
      
      toast({
        title: "Error de conexión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  // Cargar estadísticas del usuario
  const loadUserStats = async () => {
    try {
      setLoadingStats(true);
      
      const result = await bookingsService.getUserStats();
      
      if (result.success && result.stats) {
        setUserStats(result.stats);
        console.log('✅ Dashboard: Estadísticas cargadas');
      } else {
        console.log('⚠️ Dashboard: No se pudieron cargar estadísticas');
      }
    } catch (error) {
      console.error('❌ Dashboard: Error cargando estadísticas', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    console.log('🔍 Dashboard useEffect - isAuthenticated:', isAuthenticated);
    console.log('🔍 Dashboard useEffect - currentUser:', currentUser);
    
    if (isAuthenticated && currentUser) {
      console.log('🚀 Usuario autenticado - cargando datos');
      loadUserBookings();
      loadUserStats();
    } else {
      console.log('⚠️ Usuario NO autenticado - saltando carga de datos');
    }
  }, [isAuthenticated, currentUser]);

  // Función para recargar datos
  const handleRefresh = async () => {
    if (isAuthenticated) {
      console.log('🔄 Dashboard: Recarga manual solicitada');
      await Promise.all([
        loadUserBookings(),
        loadUserStats(),
        manualSync()
      ]);
    }
  };

  // Obtener próximo viaje
  const getUpcomingTrip = (): Booking | null => {
    const upcomingBookings = bookings
      .filter(booking => 
        booking.status === 'confirmed' && 
        bookingsService.getDaysUntilTravel(booking.travelDate) > 0
      )
      .sort((a, b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime());
    
    return upcomingBookings[0] || null;
  };

  const upcomingTrip = getUpcomingTrip();
  const tipsToDisplay = showAllTips ? travelTips : travelTips.slice(0, 2);

  if (!isClient) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-2">Acceso Requerido</h3>
            <p className="text-muted-foreground mb-4">
              Debes iniciar sesión para ver tu dashboard de viajes.
            </p>
            <Link href="/login">
              <Button>Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header personalizado */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary tracking-tight">
          ¡Hola, {currentUser?.firstName || currentUser?.displayName || 'Viajero'}! 👋
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          {upcomingTrip 
            ? `Tu próximo viaje a ${upcomingTrip.destination} se acerca`
            : 'Bienvenido a tu centro de viajes personalizado'
          }
        </p>
      </div>

      {/* Estadísticas rápidas */}
      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Luggage className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{userStats.totalBookings}</div>
              <div className="text-xs text-muted-foreground">Total Viajes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{userStats.confirmedBookings}</div>
              <div className="text-xs text-muted-foreground">Confirmados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">
                {bookingsService.formatCurrency(userStats.totalSpent, 'USD')}
              </div>
              <div className="text-xs text-muted-foreground">Total Invertido</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">
                {userStats.avgBookingValue > 0 
                  ? bookingsService.formatCurrency(userStats.avgBookingValue, 'USD')
                  : '-'
                }
              </div>
              <div className="text-xs text-muted-foreground">Promedio por Viaje</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Próximo viaje destacado */}
      {upcomingTrip && (
        <Card className="shadow-xl text-primary-foreground overflow-hidden relative bg-gradient-to-r from-blue-600 to-purple-600">
          <CardHeader className="text-center relative z-10">
            <div className="flex items-center justify-center text-3xl font-bold mb-2">
              <PartyPopper className="h-10 w-10 mr-3 text-yellow-300 animate-pulse" />
              <CardTitle className="text-white">¡Tu Próximo Viaje!</CardTitle>
              <PartyPopper className="h-10 w-10 ml-3 text-yellow-300 animate-pulse" />
            </div>
            <CardDescription className="text-lg text-white/90">
              {upcomingTrip.destination}, {upcomingTrip.country}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center relative z-10">
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-yellow-300">
                  {bookingsService.getDaysUntilTravel(upcomingTrip.travelDate)}
                </div>
                <div className="text-xs uppercase tracking-wider text-white/90">
                  Días restantes
                </div>
              </div>
              <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-yellow-300">
                  {upcomingTrip.durationDays}
                </div>
                <div className="text-xs uppercase tracking-wider text-white/90">
                  Días de viaje
                </div>
              </div>
            </div>
            
            <div className="text-4xl my-4">✈️</div>
            
            <Link href={`/reservas/${upcomingTrip.id}`}>
              <Button variant="outline" className="bg-white text-blue-600 hover:bg-white/90 border-white shadow-lg">
                <CalendarCheck className="mr-2 h-5 w-5" /> 
                Ver Detalles del Viaje
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Sección de reservas */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-primary flex items-center">
              <Luggage className="h-6 w-6 mr-2" />
              Mis Reservas
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>
                {loadingBookings ? 'Cargando...' : `${bookings.length} reserva${bookings.length !== 1 ? 's' : ''} encontrada${bookings.length !== 1 ? 's' : ''}`}
              </span>
              <SyncIndicator 
                isActive={syncStatus.isActive}
                hasChanges={syncStatus.hasChanges}
                lastSync={syncStatus.lastSync}
                error={syncStatus.error}
              />
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loadingBookings}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingBookings ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {loadingBookings ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
                <Button 
                  variant="link" 
                  className="ml-2 text-red-600 p-0 h-auto"
                  onClick={handleRefresh}
                >
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <Luggage className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Sin reservas aún</h3>
              <p className="text-muted-foreground mb-4">
                Cuando tengas reservas vinculadas a tu DNI, aparecerán aquí.
              </p>
              <Link href="/packages">
                <Button>Explorar Paquetes</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips de viaje y clima */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-primary">
              Consejos de Viaje
            </CardTitle>
            <Lightbulb className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            {tipsToDisplay.length > 0 ? (
              <ul className="space-y-3">
                {tipsToDisplay.map(tip => (
                  <li key={tip.id} className="flex items-start space-x-3 border-b border-border pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0">
                    <tip.icon className="h-5 w-5 text-accent mt-1 shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">{tip.text}</p>
                      <p className="text-xs text-muted-foreground">{tip.category}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No hay consejos disponibles por el momento.</p>
            )}
            {travelTips.length > 2 && (
              <Button
                variant="link"
                className="text-accent px-0 mt-3 flex items-center"
                onClick={() => setShowAllTips(!showAllTips)}
              >
                {showAllTips ? "Ver menos consejos" : "Ver más consejos..."}
                {showAllTips ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
              </Button>
            )}
          </CardContent>
        </Card>

        {upcomingTrip && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-primary">
                Clima en {upcomingTrip.destination.split(',')[0]}
              </CardTitle>
              <Sun className="h-6 w-6 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">22°C</div>
              <p className="text-sm text-muted-foreground mt-1">Soleado con algunas nubes</p>
              <p className="text-xs text-muted-foreground mt-2">
                Información actualizada para tu viaje del {bookingsService.formatShortDate(upcomingTrip.travelDate)}
              </p>
              <Button variant="outline" className="mt-4 text-accent border-accent hover:bg-accent hover:text-accent-foreground">
                Ver Pronóstico Completo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Acciones rápidas */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Acciones Rápidas</CardTitle>
          <CardDescription>Gestiona tus viajes y perfil</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/packages">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <Plane className="h-6 w-6 mb-2" />
              <span>Explorar Paquetes</span>
            </Button>
          </Link>
          <Link href="/reservas">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              <span>Mis Reservas</span>
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span>Mi Perfil</span>
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="outline" className="w-full h-20 flex flex-col">
              <BellDot className="h-6 w-6 mb-2" />
              <span>Soporte</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
