'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Package,
  Shield,
  Award,
  CheckCircle,
  ArrowUpRight,
  Download,
  Eye,
  Search,
  Filter
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
    console.log('🔍 Inicializando dashboard de agencias...');
    
    const token = localStorage.getItem('agencyToken') || localStorage.getItem('token');
    const userData = localStorage.getItem('agencyUser') || localStorage.getItem('user');
    
    if (!token || !userData) {
      console.log('❌ No hay token o datos de usuario');
      router.push('/agency/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('👤 Usuario encontrado:', parsedUser);
      
      if (parsedUser.role !== 'admin_agencia') {
        console.log('❌ Usuario no es admin de agencia');
        router.push('/agency/login');
        return;
      }

      setUser(parsedUser);
      loadMockData(parsedUser);
      
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      router.push('/agency/login');
    }
  }, [router]);

  const loadMockData = (userData: any) => {
    console.log('📊 Cargando datos mock para dashboard...');
    
    const mockAgency: Agency = {
      id: '1',
      name: 'Viajes Total Premium',
      code: 'VTP_001',
      email: 'comercial@viajestotal.com.ar',
      phone: '+54 261 425-8900',
      address: 'Av. San Martín 1234, Local 5, Mendoza Capital',
      commissionRate: 12.50,
      status: 'active'
    };

    const mockSales: Sale[] = [
      {
        id: 'VTP-2025-001',
        clientName: 'María Elena González',
        packageTitle: 'Europa Clásica - París, Roma, Londres',
        destination: 'Europa Occidental',
        amount: 2299,
        commission: 287.38,
        date: '2025-06-20',
        status: 'confirmed'
      },
      {
        id: 'VTP-2025-002',
        clientName: 'Carlos Alberto López',
        packageTitle: 'Circuito Asiático - Tokio, Bangkok, Singapur',
        destination: 'Asia',
        amount: 2899,
        commission: 362.38,
        date: '2025-06-18',
        status: 'confirmed'
      },
      {
        id: 'VTP-2025-003',
        clientName: 'Ana Patricia Rodríguez',
        packageTitle: 'Safari Africano - Kenia y Tanzania',
        destination: 'África',
        amount: 3299,
        commission: 412.38,
        date: '2025-06-15',
        status: 'pending'
      },
      {
        id: 'VTP-2025-004',
        clientName: 'Roberto Silva Montenegro',
        packageTitle: 'Maravillas Americanas - Cusco, Cancún, NY',
        destination: 'América',
        amount: 2199,
        commission: 274.88,
        date: '2025-06-12',
        status: 'confirmed'
      },
      {
        id: 'VTP-2025-005',
        clientName: 'Patricia Fernández',
        packageTitle: 'Brasil Espectacular - Río, Iguazú, Salvador',
        destination: 'Brasil',
        amount: 1999,
        commission: 249.88,
        date: '2025-06-10',
        status: 'confirmed'
      }
    ];

    const mockStats = {
      totalSales: 42890,
      totalCommission: 5361.25,
      monthlyClients: 28,
      conversionRate: 34.5
    };

    setAgency(mockAgency);
    setSales(mockSales);
    setStats(mockStats);
    setLoading(false);
    
    console.log('✅ Datos mock cargados exitosamente');
  };

  const handleLogout = () => {
    console.log('🚪 Cerrando sesión de agencia...');
    localStorage.clear();
    router.push('/agency/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 50%, #121c2e 100%)'}}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-xl">Cargando dashboard de agencias...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-2" style={{borderBottomColor: '#b38144'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-3">
                <img 
                  src="/logo-intertravel.png" 
                  alt="InterTravel Logo" 
                  className="h-10 w-auto"
                />
                <div>
                  <div className="text-xl font-bold" style={{color: '#121c2e'}}>InterTravel</div>
                  <div className="text-sm" style={{color: '#b38144'}}>Portal de Agencias</div>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 text-right">
                <div className="font-semibold">{user.name}</div>
                <div className="capitalize" style={{color: '#b38144'}}>{user.role?.replace('_', ' ')}</div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-2 text-gray-900 hover:bg-gray-100"
                style={{borderColor: '#b38144'}}
              >
                <Settings className="h-4 w-4 mr-2" />
                Config
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="border-2 border-red-400 text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="rounded-2xl p-8 text-white mb-8" style={{background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 50%, #121c2e 100%)'}}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                ¡Bienvenido, {agency?.name}! 🏢
              </h1>
              <p className="text-blue-100 text-lg">
                Panel de control para gestionar tus ventas y comisiones
              </p>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl font-bold" style={{color: '#b38144'}}>{agency?.commissionRate}%</div>
                <div className="text-sm text-blue-200">Tu Comisión</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center border border-white/20">
                <div className="text-2xl font-bold flex items-center">
                  <CheckCircle className="w-6 h-6 mr-1 text-green-300" />
                  Activa
                </div>
                <div className="text-sm text-blue-200">Estado Cuenta</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mb-6 border-2" style={{borderColor: '#b38144'}}>
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 100%)'}}>
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl" style={{color: '#121c2e'}}>{agency?.name}</CardTitle>
                <CardDescription style={{color: '#b38144'}}>{agency?.code}</CardDescription>
                <Badge className="mt-2 text-white" style={{background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'}}>
                  <Shield className="h-3 w-3 mr-1" />
                  Agencia Verificada
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center rounded-xl p-4" style={{backgroundColor: 'rgba(18, 28, 46, 0.05)'}}>
                  <div className="text-3xl font-bold" style={{color: '#121c2e'}}>{agency?.commissionRate}%</div>
                  <div className="text-sm font-semibold" style={{color: '#b38144'}}>Comisión Actual</div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-700">
                    <Mail className="h-4 w-4 mr-2" style={{color: '#121c2e'}} />
                    <span className="font-medium">{agency?.email}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-4 w-4 mr-2" style={{color: '#121c2e'}} />
                    <span className="font-medium">{agency?.phone}</span>
                  </div>
                  <div className="flex items-start text-gray-700">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" style={{color: '#121c2e'}} />
                    <span className="text-sm font-medium">{agency?.address}</span>
                  </div>
                </div>
                
                <div className="space-y-2 pt-4 border-t" style={{borderColor: '#b38144'}}>
                  <Button variant="outline" className="w-full justify-start border-2 hover:bg-blue-50" style={{borderColor: '#121c2e', color: '#121c2e'}}>
                    <Package className="h-4 w-4 mr-2" />
                    Catálogo
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-2 hover:bg-green-50" style={{borderColor: '#16a34a', color: '#16a34a'}}>
                    <FileText className="h-4 w-4 mr-2" />
                    Reportes
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-2 hover:bg-yellow-50" style={{borderColor: '#b38144', color: '#b38144'}}>
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
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4" style={{borderLeftColor: '#16a34a'}}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                        <p className="text-2xl font-bold" style={{color: '#121c2e'}}>${stats.totalSales.toLocaleString()}</p>
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          +15.3% vs mes anterior
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(22, 163, 74, 0.1)'}}>
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4" style={{borderLeftColor: '#b38144'}}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Comisiones</p>
                        <p className="text-2xl font-bold" style={{color: '#121c2e'}}>${stats.totalCommission.toLocaleString()}</p>
                        <p className="text-xs flex items-center mt-1" style={{color: '#b38144'}}>
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          +8.2% vs mes anterior
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(179, 129, 68, 0.1)'}}>
                        <CreditCard className="h-6 w-6" style={{color: '#b38144'}} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4" style={{borderLeftColor: '#121c2e'}}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Clientes Mes</p>
                        <p className="text-2xl font-bold" style={{color: '#121c2e'}}>{stats.monthlyClients}</p>
                        <p className="text-xs flex items-center mt-1" style={{color: '#121c2e'}}>
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          +12 nuevos clientes
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(18, 28, 46, 0.1)'}}>
                        <Users className="h-6 w-6" style={{color: '#121c2e'}} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Conversión</p>
                        <p className="text-2xl font-bold" style={{color: '#121c2e'}}>{stats.conversionRate}%</p>
                        <p className="text-xs text-orange-600 flex items-center mt-1">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Excelente performance
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Tabs */}
              <Tabs defaultValue="sales" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sales" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Ventas Recientes
                  </TabsTrigger>
                  <TabsTrigger value="commissions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Comisiones
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Clientes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle style={{color: '#121c2e'}}>Ventas Recientes</CardTitle>
                        <CardDescription>
                          Últimas ventas realizadas por tu agencia
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-2" style={{borderColor: '#b38144', color: '#b38144'}}>
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                        <Button variant="outline" size="sm" className="border-2" style={{borderColor: '#121c2e', color: '#121c2e'}}>
                          <Filter className="h-4 w-4 mr-2" />
                          Filtrar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sales.map((sale) => (
                          <div key={sale.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors border-gray-200 hover:border-blue-300">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-semibold" style={{color: '#121c2e'}}>{sale.packageTitle}</h3>
                                  <Badge className={`border ${getStatusColor(sale.status)}`}>
                                    {getStatusText(sale.status)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" style={{color: '#121c2e'}} />
                                    {sale.clientName}
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" style={{color: '#121c2e'}} />
                                    {sale.destination}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" style={{color: '#121c2e'}} />
                                    {new Date(sale.date).toLocaleDateString('es-ES')}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold" style={{color: '#121c2e'}}>
                                  ${sale.amount.toLocaleString()}
                                </div>
                                <div className="text-sm font-medium" style={{color: '#16a34a'}}>
                                  Comisión: ${sale.commission.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {sale.id}
                                </div>
                                <Button variant="ghost" size="sm" className="mt-2" style={{color: '#121c2e'}}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver detalles
                                </Button>
                              </div>
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
                      <CardTitle style={{color: '#121c2e'}}>Resumen de Comisiones</CardTitle>
                      <CardDescription>
                        Detalle de comisiones por período
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="rounded-xl p-4" style={{backgroundColor: 'rgba(22, 163, 74, 0.1)'}}>
                            <h3 className="font-semibold text-green-800">Este Mes</h3>
                            <p className="text-2xl font-bold text-green-900">${stats.totalCommission.toLocaleString()}</p>
                            <p className="text-sm text-green-600">+12.5% vs mes anterior</p>
                          </div>
                          <div className="rounded-xl p-4" style={{backgroundColor: 'rgba(18, 28, 46, 0.1)'}}>
                            <h3 className="font-semibold" style={{color: '#121c2e'}}>Promedio Mensual</h3>
                            <p className="text-2xl font-bold" style={{color: '#121c2e'}}>${(stats.totalCommission * 0.85).toLocaleString()}</p>
                            <p className="text-sm" style={{color: '#121c2e'}}>Últimos 6 meses</p>
                          </div>
                          <div className="rounded-xl p-4" style={{backgroundColor: 'rgba(179, 129, 68, 0.1)'}}>
                            <h3 className="font-semibold" style={{color: '#b38144'}}>Próximo Pago</h3>
                            <p className="text-2xl font-bold" style={{color: '#b38144'}}>${(stats.totalCommission * 0.7).toLocaleString()}</p>
                            <p className="text-sm" style={{color: '#b38144'}}>15 Julio 2025</p>
                          </div>
                        </div>
                        
                        <div className="border rounded-xl p-4">
                          <h4 className="font-medium mb-3" style={{color: '#121c2e'}}>Comisiones por Venta</h4>
                          <div className="space-y-2">
                            {sales.filter(sale => sale.status === 'confirmed').map((sale) => (
                              <div key={sale.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                <div>
                                  <p className="font-medium" style={{color: '#121c2e'}}>{sale.clientName}</p>
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
                      <CardTitle style={{color: '#121c2e'}}>Base de Clientes</CardTitle>
                      <CardDescription>
                        Gestión de clientes de tu agencia
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sales.map((sale, index) => (
                            <div key={index} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-semibold" style={{color: '#121c2e'}}>{sale.clientName}</h5>
                                  <p className="text-sm text-gray-600">Último viaje: {sale.destination}</p>
                                  <p className="text-xs text-gray-500">{new Date(sale.date).toLocaleDateString('es-ES')}</p>
                                  <div className="mt-2 flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      Cliente Recurrente
                                    </Badge>
                                    <div className="flex items-center">
                                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                      <span className="text-xs text-gray-600 ml-1">4.9</span>
                                    </div>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" style={{color: '#121c2e'}}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
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
