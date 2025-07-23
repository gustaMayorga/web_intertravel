'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  MapPin, 
  Star, 
  CreditCard, 
  Settings, 
  LogOut,
  Plane,
  Clock,
  CheckCircle,
  AlertCircle,
  Heart,
  Gift
} from 'lucide-react';
import { getUserProfile, getUserBookings, isAuthenticated, getStoredUser, logoutUser } from '@/lib/api-config';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyLevel: string;
  points: number;
  joinDate: string;
}

interface Booking {
  id: string;
  packageTitle: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  amount: number;
  travelers: number;
}

export default function AccountDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      // Verificar autenticación
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return;
      }

      try {
        // Intentar cargar perfil del backend
        const profileResponse = await getUserProfile();
        
        if (profileResponse.success && profileResponse.data) {
          setUser({
            id: profileResponse.data.id.toString(),
            firstName: profileResponse.data.firstName,
            lastName: profileResponse.data.lastName,
            email: profileResponse.data.email,
            phone: profileResponse.data.phone || '',
            loyaltyLevel: 'Gold', // Por defecto
            points: 2847, // Por defecto
            joinDate: profileResponse.data.memberSince
          });
        } else {
          // Fallback a datos del localStorage
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser({
              id: storedUser.id.toString(),
              firstName: storedUser.firstName,
              lastName: storedUser.lastName,
              email: storedUser.email,
              phone: storedUser.phone || '',
              loyaltyLevel: 'Gold',
              points: 2847,
              joinDate: '2023-01-15'
            });
          }
        }

        // Intentar cargar reservas del backend
        const bookingsResponse = await getUserBookings();
        
        if (bookingsResponse.success && bookingsResponse.data) {
          // Convertir reservas del backend al formato del frontend
          const convertedBookings = bookingsResponse.data.map((booking: any) => ({
            id: booking.id,
            packageTitle: `Paquete ${booking.packageId}`,
            destination: 'Destino por definir', // Necesitaremos mejorar esto
            departureDate: booking.travelDate || '2024-08-15',
            returnDate: booking.travelDate || '2024-08-23',
            status: booking.status === 'confirmed' ? 'confirmed' : 'pending',
            amount: parseFloat(booking.totalAmount) || 0,
            travelers: booking.travelers || 1
          }));
          setBookings(convertedBookings);
        } else {
          // Fallback a datos mock
          loadMockData();
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback a datos mock
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser({
            id: storedUser.id.toString(),
            firstName: storedUser.firstName,
            lastName: storedUser.lastName,
            email: storedUser.email,
            phone: storedUser.phone || '',
            loyaltyLevel: 'Gold',
            points: 2847,
            joinDate: '2023-01-15'
          });
        }
        loadMockData();
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [router]);

  const loadMockData = () => {
    // Datos de ejemplo para el usuario
    const mockUser: User = {
      id: '1',
      firstName: 'María',
      lastName: 'García',
      email: 'maria.garcia@email.com',
      phone: '+54 9 261 555-0123',
      loyaltyLevel: 'Gold',
      points: 2847,
      joinDate: '2023-01-15'
    };

    const mockBookings: Booking[] = [
      {
        id: 'BK-2024-001',
        packageTitle: 'Perú Mágico - Cusco y Machu Picchu',
        destination: 'Cusco, Perú',
        departureDate: '2024-08-15',
        returnDate: '2024-08-23',
        status: 'confirmed',
        amount: 1890,
        travelers: 2
      },
      {
        id: 'BK-2024-002',
        packageTitle: 'Buenos Aires Tango - Capital del Sur',
        destination: 'Buenos Aires, Argentina',
        departureDate: '2024-07-20',
        returnDate: '2024-07-25',
        status: 'completed',
        amount: 899,
        travelers: 1
      },
      {
        id: 'BK-2024-003',
        packageTitle: 'Cancún Paradise - Riviera Maya',
        destination: 'Cancún, México',
        departureDate: '2024-12-10',
        returnDate: '2024-12-17',
        status: 'pending',
        amount: 1299,
        travelers: 2
      }
    ];

    setUser(mockUser);
    setBookings(mockBookings);
    setLoading(false);
  };

  const handleLogout = () => {
    logoutUser();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <Star className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                InterTravel
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Mi Cuenta</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center pb-4">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                  <Star className="h-3 w-3 mr-1" />
                  {user.loyaltyLevel}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.points.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Puntos de fidelidad</div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="h-4 w-4 mr-2" />
                    Lista de Deseos
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Gift className="h-4 w-4 mr-2" />
                    Canjear Puntos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Welcome */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ¡Hola, {user.firstName}! 👋
                </h1>
                <p className="text-gray-600 mt-2">
                  Bienvenido a tu panel de control. Aquí puedes gestionar tus viajes y perfil.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Viajes Totales</p>
                        <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                      </div>
                      <Plane className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Próximos Viajes</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => new Date(b.departureDate) > new Date()).length}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${bookings.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Tabs */}
              <Tabs defaultValue="bookings" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="bookings">Mis Reservas</TabsTrigger>
                  <TabsTrigger value="upcoming">Próximos Viajes</TabsTrigger>
                  <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Todas mis Reservas</CardTitle>
                      <CardDescription>
                        Gestiona todas tus reservas de viajes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{booking.packageTitle}</h3>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {getStatusIcon(booking.status)}
                                    <span className="ml-1 capitalize">{booking.status}</span>
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {booking.destination}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(booking.departureDate).toLocaleDateString('es-ES')}
                                  </div>
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    {booking.travelers} viajero{booking.travelers > 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  ${booking.amount.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {booking.id}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                              <Button size="sm" variant="outline">
                                Ver Detalles
                              </Button>
                              {booking.status === 'confirmed' && (
                                <Button size="sm">
                                  Descargar Voucher
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Viajes</CardTitle>
                      <CardDescription>
                        Viajes confirmados próximos a realizarse
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bookings
                          .filter(booking => 
                            new Date(booking.departureDate) > new Date() && 
                            booking.status === 'confirmed'
                          )
                          .map((booking) => (
                            <div key={booking.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-2">{booking.packageTitle}</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {booking.destination}
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {new Date(booking.departureDate).toLocaleDateString('es-ES')} - {new Date(booking.returnDate).toLocaleDateString('es-ES')}
                                    </div>
                                  </div>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {Math.ceil((new Date(booking.departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Viajes</CardTitle>
                      <CardDescription>
                        Todos tus viajes completados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {bookings
                          .filter(booking => booking.status === 'completed')
                          .map((booking) => (
                            <div key={booking.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-2">{booking.packageTitle}</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {booking.destination}
                                    </div>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {new Date(booking.departureDate).toLocaleDateString('es-ES')}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-green-100 text-green-800 mb-2">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completado
                                  </Badge>
                                  <div className="text-sm text-gray-600">
                                    ${booking.amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex space-x-2">
                                <Button size="sm" variant="outline">
                                  Calificar Viaje
                                </Button>
                                <Button size="sm" variant="outline">
                                  Volver a Reservar
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
