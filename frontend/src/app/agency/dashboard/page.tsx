'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthProtection, secureLogout } from '@/lib/auth-security';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp,
  Calendar,
  MapPin,
  Star,
  Settings,
  LogOut,
  FileText,
  CreditCard,
  Phone,
  Mail,
  BarChart3,
  Package
} from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  commissionRate: number;
  status: string;
}

interface AgencyUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface Sale {
  id: string;
  clientName: string;
  packageTitle: string;
  destination: string;
  amount: number;
  commission: number;
  date: string;
  status: string;
}

export default function AgencyDashboard() {
  const router = useRouter();
  
  // Proteger la ruta con autenticación
  const { validateAndRedirect } = useAuthProtection('agency');
  
  const [agency, setAgency] = useState<Agency | null>(null);
  const [user, setUser] = useState<AgencyUser | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommission: 0,
    monthlyClients: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación de agencia
    const token = localStorage.getItem('agencyToken');
    const agencyData = localStorage.getItem('agency');
    const userData = localStorage.getItem('agencyUser');
    
    if (!token || !agencyData || !userData) {
      router.push('/agency/login');
      return;
    }

    try {
      const parsedAgency = JSON.parse(agencyData);
      const parsedUser = JSON.parse(userData);
      setAgency(parsedAgency);
      setUser(parsedUser);
      
      // Cargar datos de prueba
      loadMockData();
    } catch (error) {
      console.error('Error parsing agency data:', error);
      router.push('/agency/login');
    }
  }, [router]);

  const loadMockData = () => {
    // Datos de ejemplo para la agencia
    const mockAgency: Agency = {
      id: '1',
      name: 'Viajes Total',
      code: 'VIAJES_TOTAL',
      email: 'info@viajestotal.com.ar',
      phone: '+54 261 4XX-XXXX',
      address: 'Av. San Martín 1234, Local 5, Mendoza',
      commissionRate: 12.50,
      status: 'active'
    };

    const mockUser: AgencyUser = {
      id: '1',
      username: 'agencia_admin',
      name: 'Administrador Viajes Total',
      role: 'admin_agencia'
    };

    const mockSales: Sale[] = [
      {
        id: 'V-2024-001',
        clientName: 'María González',
        packageTitle: 'Perú Mágico - Cusco y Machu Picchu',
        destination: 'Cusco, Perú',
        amount: 1890,
        commission: 236.25,
        date: '2024-06-10',
        status: 'confirmed'
      },
      {
        id: 'V-2024-002',
        clientName: 'Carlos López',
        packageTitle: 'Buenos Aires Tango',
        destination: 'Buenos Aires, Argentina',
        amount: 899,
        commission: 112.38,
        date: '2024-06-08',
        status: 'confirmed'
      },
      {
        id: 'V-2024-003',
        clientName: 'Ana Rodríguez',
        packageTitle: 'Cancún Paradise',
        destination: 'Cancún, México',
        amount: 1299,
        commission: 162.38,
        date: '2024-06-05',
        status: 'pending'
      },
      {
        id: 'V-2024-004',
        clientName: 'Roberto Silva',
        packageTitle: 'España Histórica',
        destination: 'Madrid, España',
        amount: 1650,
        commission: 206.25,
        date: '2024-06-03',
        status: 'confirmed'
      }
    ];

    const mockStats = {
      totalSales: 28450,
      totalCommission: 3556.25,
      monthlyClients: 18,
      conversionRate: 23.4
    };

    setAgency(mockAgency);
    setUser(mockUser);
    setSales(mockSales);
    setStats(mockStats);
    setLoading(false);
  };

  const handleLogout = () => {
    secureLogout('agency');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!agency || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-700">
                InterTravel
              </Link>
              <span className="text-gray-700 font-bold">|</span>
              <span className="text-gray-900 font-semibold">Portal Agencias</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-2 border-gray-400 text-gray-900 hover:bg-gray-100">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-2 border-red-400 text-red-700 hover:bg-red-50">
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
                <div className="h-20 w-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl">{agency.name}</CardTitle>
                <CardDescription>{agency.code}</CardDescription>
                <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-blue-500">
                  <Star className="h-3 w-3 mr-1" />
                  Agencia Verificada
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{agency.commissionRate}%</div>
                  <div className="text-sm text-gray-900 font-semibold">Comisión</div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-900">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="font-medium">{agency.email}</span>
                  </div>
                  <div className="flex items-center text-gray-900">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="font-medium">{agency.phone}</span>
                  </div>
                  <div className="flex items-start text-gray-900">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span className="text-sm font-medium">{agency.address}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start border-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Package className="h-4 w-4 mr-2" />
                    Catálogo
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-2 border-green-300 text-green-700 hover:bg-green-50">
                    <FileText className="h-4 w-4 mr-2" />
                    Reportes
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-2 border-purple-300 text-purple-700 hover:bg-purple-50">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Facturación
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
                  ¡Bienvenido, {agency.name}! 🏢
                </h1>
                <p className="text-gray-600 mt-2">
                  Panel de control para gestionar tus ventas y comisiones.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                        <p className="text-2xl font-bold text-gray-900">${stats.totalSales.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Comisiones</p>
                        <p className="text-2xl font-bold text-gray-900">${stats.totalCommission.toLocaleString()}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Clientes Mes</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.monthlyClients}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Conversión</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Tabs */}
              <Tabs defaultValue="sales" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="sales">Ventas Recientes</TabsTrigger>
                  <TabsTrigger value="commissions">Comisiones</TabsTrigger>
                  <TabsTrigger value="clients">Clientes</TabsTrigger>
                  <TabsTrigger value="reports">Reportes</TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ventas Recientes</CardTitle>
                      <CardDescription>
                        Últimas ventas realizadas por tu agencia
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sales.map((sale) => (
                          <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-gray-900">{sale.packageTitle}</h3>
                                  <Badge className={getStatusColor(sale.status)}>
                                    {sale.status === 'confirmed' ? 'Confirmado' : 
                                     sale.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    {sale.clientName}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {sale.destination}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(sale.date).toLocaleDateString('es-ES')}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  ${sale.amount.toLocaleString()}
                                </div>
                                <div className="text-sm text-green-600 font-medium">
                                  Comisión: ${sale.commission.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {sale.id}
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                              <Button size="sm" variant="outline">
                                Ver Detalles
                              </Button>
                              {sale.status === 'confirmed' && (
                                <Button size="sm">
                                  Generar Factura
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="commissions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen de Comisiones</CardTitle>
                      <CardDescription>
                        Detalle de comisiones por período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-green-800">Este Mes</h3>
                            <p className="text-2xl font-bold text-green-900">${stats.totalCommission.toLocaleString()}</p>
                            <p className="text-sm text-green-600">+12.5% vs mes anterior</p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-blue-800">Promedio Mensual</h3>
                            <p className="text-2xl font-bold text-blue-900">${(stats.totalCommission * 0.85).toLocaleString()}</p>
                            <p className="text-sm text-blue-600">Últimos 6 meses</p>
                          </div>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Comisiones por Venta</h4>
                          <div className="space-y-2">
                            {sales.filter(sale => sale.status === 'confirmed').map((sale) => (
                              <div key={sale.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <div>
                                  <p className="font-medium">{sale.clientName}</p>
                                  <p className="text-sm text-gray-600">{sale.packageTitle}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-600">${sale.commission.toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('es-ES')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="clients" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Base de Clientes</CardTitle>
                      <CardDescription>
                        Gestión de clientes de tu agencia
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Clientes Activos</h4>
                          <Button size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            Agregar Cliente
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sales.map((sale, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-semibold">{sale.clientName}</h5>
                                  <p className="text-sm text-gray-600">Último viaje: {sale.destination}</p>
                                  <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('es-ES')}</p>
                                </div>
                                <Badge variant="outline">
                                  Cliente
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reportes y Analytics</CardTitle>
                      <CardDescription>
                        Análisis de rendimiento de tu agencia
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="h-20 flex-col">
                          <BarChart3 className="h-6 w-6 mb-2" />
                          <span>Reporte de Ventas</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col">
                          <CreditCard className="h-6 w-6 mb-2" />
                          <span>Estado de Comisiones</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col">
                          <Users className="h-6 w-6 mb-2" />
                          <span>Análisis de Clientes</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col">
                          <TrendingUp className="h-6 w-6 mb-2" />
                          <span>Tendencias de Mercado</span>
                        </Button>
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
