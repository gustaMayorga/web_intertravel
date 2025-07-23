'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  ArrowUp,
  ArrowDown,
  Activity,
  MapPin,
  Clock,
  Star
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface BookingMetrics {
  summary: {
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    conversionRate: number;
    uniqueCustomers: number;
    avgBookingValue: number;
  };
  trends: {
    daily: Array<{
      period: string;
      bookings: number;
      revenue: number;
      confirmed: number;
    }>;
    weekday: Array<{
      dayName: string;
      bookings: number;
      revenue: number;
    }>;
    hourly: Array<{
      hour: number;
      bookings: number;
      revenue: number;
    }>;
    growth: {
      periodOverPeriod: number;
      overall: number;
      trend: string;
    };
  };
  sources: {
    sources: Array<{
      source: string;
      bookings: number;
      totalRevenue: number;
      conversionRate: number;
      marketShare: number;
    }>;
  };
  geographic: {
    destinations: Array<{
      destination: string;
      country: string;
      bookings: number;
      revenue: number;
      marketShare: number;
    }>;
  };
  customers: {
    segments: {
      vip: { count: number };
      loyal: { count: number };
      valuable: { count: number };
      regular: { count: number };
      new: { count: number };
    };
    topCustomers: Array<{
      name: string;
      totalBookings: number;
      totalSpent: number;
    }>;
  };
  packages: {
    topPerformers: {
      byBookings: Array<{
        title: string;
        totalBookings: number;
        totalRevenue: number;
        conversionRate: number;
      }>;
      byRevenue: Array<{
        title: string;
        totalRevenue: number;
        totalBookings: number;
      }>;
    };
  };
  insights: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string;
  }>;
}

interface RealtimeData {
  realtime: {
    todayBookings: number;
    todayRevenue: number;
    lastHourBookings: number;
    weekBookings: number;
  };
  recentActivity: Array<{
    reference: string;
    customerName: string;
    amount: number;
    status: string;
    packageTitle: string;
    destination: string;
    createdAt: string;
  }>;
}

export default function BookingAnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  
  const [bookingMetrics, setBookingMetrics] = useState<BookingMetrics | null>(null);
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const loadBookingMetrics = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/booking-analytics/metrics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setBookingMetrics(result.data);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error cargando métricas de booking:', error);
      setError(`Error cargando métricas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealtimeData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/booking-analytics/realtime', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRealtimeData(result.data);
        }
      }
    } catch (error) {
      console.error('Error cargando datos en tiempo real:', error);
    }
  };

  const loadHealthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/booking-analytics/health', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHealthStatus(result.data);
        }
      }
    } catch (error) {
      console.error('Error cargando estado de salud:', error);
    }
  };

  useEffect(() => {
    loadBookingMetrics();
    loadRealtimeData();
    loadHealthStatus();

    // Actualizar datos en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      loadRealtimeData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'strong_growth':
      case 'moderate_growth':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'strong_decline':
      case 'moderate_decline':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInsightIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span>Cargando analytics de reservas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Error cargando Analytics</h3>
                <p className="text-red-600">{error}</p>
                <Button 
                  onClick={() => {
                    setError('');
                    loadBookingMetrics();
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Analytics de Reservas</h1>
          <p className="text-gray-600">Análisis completo del rendimiento de reservas</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último año</option>
          </select>
          
          <Button
            onClick={() => {
              loadBookingMetrics();
              loadRealtimeData();
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tiempo Real Cards */}
      {realtimeData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold">{realtimeData.realtime.todayBookings}</p>
                  <p className="text-xs text-gray-500">reservas</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue Hoy</p>
                  <p className="text-2xl font-bold">{formatCurrency(realtimeData.realtime.todayRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Última Hora</p>
                  <p className="text-2xl font-bold">{realtimeData.realtime.lastHourBookings}</p>
                  <p className="text-xs text-gray-500">reservas</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Esta Semana</p>
                  <p className="text-2xl font-bold">{realtimeData.realtime.weekBookings}</p>
                  <p className="text-xs text-gray-500">reservas</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="sources">Fuentes</TabsTrigger>
          <TabsTrigger value="geographic">Geográfico</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="packages">Paquetes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {bookingMetrics && (
            <>
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Reservas</p>
                        <p className="text-3xl font-bold">{bookingMetrics.summary.totalBookings}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {getTrendIcon(bookingMetrics.trends.growth.trend)}
                          <span className="text-sm">{formatPercentage(bookingMetrics.trends.growth.periodOverPeriod)}</span>
                        </div>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Revenue Total</p>
                        <p className="text-3xl font-bold">{formatCurrency(bookingMetrics.summary.totalRevenue)}</p>
                        <p className="text-sm text-gray-500">
                          Confirmado: {formatCurrency(bookingMetrics.summary.totalRevenue * (bookingMetrics.summary.conversionRate / 100))}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tasa Conversión</p>
                        <p className="text-3xl font-bold">{bookingMetrics.summary.conversionRate}%</p>
                        <p className="text-sm text-gray-500">
                          {bookingMetrics.summary.confirmedBookings} de {bookingMetrics.summary.totalBookings}
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights Inteligentes */}
              {bookingMetrics.insights && bookingMetrics.insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      💡 Insights Inteligentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bookingMetrics.insights.slice(0, 5).map((insight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          {getInsightIcon(insight.severity)}
                          <div className="flex-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <p className="text-sm text-gray-600 mb-1">{insight.description}</p>
                            <p className="text-sm text-blue-600 font-medium">{insight.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actividad Reciente */}
              {realtimeData && realtimeData.recentActivity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🕒 Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {realtimeData.recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              activity.status === 'confirmed' ? 'bg-green-500' :
                              activity.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                            }`} />
                            <div>
                              <p className="font-medium">{activity.customerName}</p>
                              <p className="text-sm text-gray-600">{activity.packageTitle}</p>
                              <p className="text-xs text-gray-500">{activity.destination}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(activity.amount)}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {bookingMetrics && bookingMetrics.trends && (
            <>
              {/* Tendencia Temporal */}
              <Card>
                <CardHeader>
                  <CardTitle>📈 Tendencia de Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={bookingMetrics.trends.daily}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="bookings" stroke="#3b82f6" name="Reservas" />
                      <Line type="monotone" dataKey="confirmed" stroke="#10b981" name="Confirmadas" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Día de la Semana */}
              <Card>
                <CardHeader>
                  <CardTitle>📅 Performance por Día de la Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bookingMetrics.trends.weekday}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dayName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#3b82f6" name="Reservas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Hora del Día */}
              <Card>
                <CardHeader>
                  <CardTitle>🕐 Performance por Hora del Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={bookingMetrics.trends.hourly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Reservas" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          {bookingMetrics && bookingMetrics.sources && (
            <Card>
              <CardHeader>
                <CardTitle>🌐 Fuentes de Tráfico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingMetrics.sources.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold capitalize">{source.source}</h4>
                        <p className="text-sm text-gray-600">
                          {source.bookings} reservas • {source.marketShare}% share
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(source.totalRevenue)}</p>
                        <p className="text-sm text-green-600">{source.conversionRate}% conversión</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          {bookingMetrics && bookingMetrics.geographic && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Destinos Más Populares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingMetrics.geographic.destinations.map((dest, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{dest.destination}</h4>
                        <p className="text-sm text-gray-600">{dest.country}</p>
                        <p className="text-sm text-blue-600">{dest.marketShare}% del total</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{dest.bookings} reservas</p>
                        <p className="text-sm text-gray-600">{formatCurrency(dest.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          {bookingMetrics && bookingMetrics.customers && (
            <>
              {/* Segmentos de Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle>👥 Segmentación de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{bookingMetrics.customers.segments.vip.count}</p>
                      <p className="text-sm text-purple-700">VIP</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{bookingMetrics.customers.segments.loyal.count}</p>
                      <p className="text-sm text-blue-700">Leales</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{bookingMetrics.customers.segments.valuable.count}</p>
                      <p className="text-sm text-green-700">Valiosos</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{bookingMetrics.customers.segments.regular.count}</p>
                      <p className="text-sm text-yellow-700">Regulares</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-600">{bookingMetrics.customers.segments.new.count}</p>
                      <p className="text-sm text-gray-700">Nuevos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Top Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookingMetrics.customers.topCustomers.slice(0, 5).map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{customer.name}</h4>
                          <p className="text-sm text-gray-600">{customer.totalBookings} reservas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
                          <p className="text-sm text-gray-500">total gastado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          {bookingMetrics && bookingMetrics.packages && (
            <>
              {/* Top Paquetes por Reservas */}
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Top Paquetes por Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookingMetrics.packages.topPerformers.byBookings.slice(0, 5).map((pkg, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{pkg.title}</h4>
                          <p className="text-sm text-gray-600">{pkg.totalBookings} reservas</p>
                          <p className="text-sm text-green-600">{pkg.conversionRate}% conversión</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(pkg.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Paquetes por Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle>💰 Top Paquetes por Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookingMetrics.packages.topPerformers.byRevenue.slice(0, 5).map((pkg, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{pkg.title}</h4>
                          <p className="text-sm text-gray-600">{pkg.totalBookings} reservas</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(pkg.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Health Status */}
      {healthStatus && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏥 Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${healthStatus.database.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>Base de Datos: {healthStatus.database.connected ? 'Conectada' : 'Desconectada'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${healthStatus.analytics.module === 'operational' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>Analytics: {healthStatus.analytics.module}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Cache: {healthStatus.cache.entries} entradas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
