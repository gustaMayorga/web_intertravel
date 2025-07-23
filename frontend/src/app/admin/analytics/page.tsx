'use client';

/**
 * 📊 ANALYTICS INTERTRAVEL ADMIN
 * ===============================
 * 
 * ✅ Dashboard de métricas clave
 * ✅ Gráficos y reportes
 * ✅ Análisis de ventas
 * ✅ Comportamiento de usuarios
 * ✅ Performance de paquetes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Bookmark,
  Calendar,
  Globe,
  Target,
  Eye,
  Clock,
  Star,
  Download,
  Filter,
  RefreshCw,
  Settings,
  PieChart,
  LineChart,
  Activity,
  Award,
  MapPin,
  Plane,
  Building
} from 'lucide-react';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30');

  // Cargar analytics
  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/analytics?days=${dateRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
        console.log('✅ Analytics cargados:', data.analytics);
      } else {
        throw new Error(data.error || 'Error al cargar analytics');
      }
    } catch (error) {
      console.error('❌ Error cargando analytics:', error);
      setError(error.message);
      
      // Fallback con datos mock detallados
      setAnalytics({
        overview: {
          totalRevenue: 425680,
          revenueGrowth: 12.5,
          totalBookings: 156,
          bookingsGrowth: 8.3,
          totalUsers: 1247,
          usersGrowth: 15.2,
          conversionRate: 3.8,
          conversionGrowth: -0.2
        },
        sales: {
          daily: [
            { date: '2024-12-16', revenue: 12450, bookings: 8 },
            { date: '2024-12-17', revenue: 15630, bookings: 12 },
            { date: '2024-12-18', revenue: 18900, bookings: 15 },
            { date: '2024-12-19', revenue: 14200, bookings: 9 },
            { date: '2024-12-20', revenue: 22100, bookings: 18 },
            { date: '2024-12-21', revenue: 19800, bookings: 14 },
            { date: '2024-12-22', revenue: 16750, bookings: 11 }
          ],
          byPackage: [
            { name: 'Perú Mágico', revenue: 168210, bookings: 89, percentage: 39.5 },
            { name: 'Argentina Épica', revenue: 132300, bookings: 54, percentage: 31.1 },
            { name: 'Brasil Tropical', revenue: 76850, bookings: 32, percentage: 18.1 },
            { name: 'Chile Andino', revenue: 48320, bookings: 28, percentage: 11.3 }
          ],
          byDestination: [
            { country: 'Perú', bookings: 89, revenue: 168210 },
            { country: 'Argentina', bookings: 54, revenue: 132300 },
            { country: 'Brasil', bookings: 32, revenue: 76850 },
            { country: 'Chile', bookings: 28, revenue: 48320 }
          ]
        },
        users: {
          growth: [
            { month: 'Ago', total: 980, new: 45 },
            { month: 'Sep', total: 1045, new: 65 },
            { month: 'Oct', total: 1123, new: 78 },
            { month: 'Nov', total: 1189, new: 66 },
            { month: 'Dic', total: 1247, new: 58 }
          ],
          byRole: [
            { role: 'Clientes', count: 1201, percentage: 96.3 },
            { role: 'Agencias', count: 23, percentage: 1.8 },
            { role: 'Admins', count: 23, percentage: 1.9 }
          ],
          activity: {
            dailyActive: 156,
            weeklyActive: 423,
            monthlyActive: 892
          }
        },
        performance: {
          topPackages: [
            { name: 'Perú Mágico', views: 2345, bookings: 89, conversion: 3.8, rating: 4.8 },
            { name: 'Argentina Épica', views: 1876, bookings: 54, conversion: 2.9, rating: 4.6 },
            { name: 'Brasil Tropical', views: 1234, bookings: 32, conversion: 2.6, rating: 4.4 },
            { name: 'Chile Andino', views: 987, bookings: 28, conversion: 2.8, rating: 4.5 }
          ],
          traffic: {
            organic: 45.2,
            direct: 32.1,
            social: 12.8,
            paid: 9.9
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6" data-admin="true">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
            Analytics InterTravel
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado del rendimiento y métricas del negocio
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">⚠️ {error} - Usando datos de demostración</p>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(analytics?.overview?.totalRevenue || 0)}
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (analytics?.overview?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(analytics?.overview?.revenueGrowth || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercent(analytics?.overview?.revenueGrowth || 0)} vs periodo anterior
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.overview?.totalBookings || 0}
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (analytics?.overview?.bookingsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(analytics?.overview?.bookingsGrowth || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercent(analytics?.overview?.bookingsGrowth || 0)} vs periodo anterior
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Bookmark className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.overview?.totalUsers || 0}
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (analytics?.overview?.usersGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(analytics?.overview?.usersGrowth || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercent(analytics?.overview?.usersGrowth || 0)} vs periodo anterior
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.overview?.conversionRate || 0}%
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (analytics?.overview?.conversionGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(analytics?.overview?.conversionGrowth || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPercent(analytics?.overview?.conversionGrowth || 0)} vs periodo anterior
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Target className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Overview */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Semana</CardTitle>
                  <CardDescription>
                    Tendencia de ingresos en los últimos {dateRange} días
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Gráfico de líneas - Ingresos diarios</p>
                      <p className="text-xs text-gray-400">Datos de demostración disponibles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reservas por Destino</CardTitle>
                  <CardDescription>
                    Distribución de reservas por países
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.sales?.byDestination?.map((destination, index) => (
                      <div key={destination.country} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">{destination.country}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{destination.bookings}</div>
                          <div className="text-sm text-gray-600">{formatCurrency(destination.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <div className="space-y-6">
            {/* Sales Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas Diarias</CardTitle>
                  <CardDescription>
                    Ingresos y reservas por día
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Gráfico de barras combinado</p>
                      <p className="text-xs text-gray-400">Ingresos (barras) + Reservas (línea)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Paquetes por Ingresos</CardTitle>
                  <CardDescription>
                    Rendimiento de los paquetes más vendidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.sales?.byPackage?.map((pkg, index) => (
                      <div key={pkg.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{pkg.name}</span>
                          <span className="text-sm text-gray-600">{pkg.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-green-500' :
                              index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${pkg.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{pkg.bookings} reservas</span>
                          <span>{formatCurrency(pkg.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Data Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle de Ventas por Día</CardTitle>
                <CardDescription>
                  Información detallada de ventas diarias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-right py-2">Reservas</th>
                        <th className="text-right py-2">Ingresos</th>
                        <th className="text-right py-2">Ticket Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.sales?.daily?.map((day) => (
                        <tr key={day.date} className="border-b">
                          <td className="py-2">
                            {new Date(day.date).toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </td>
                          <td className="text-right py-2 font-medium">{day.bookings}</td>
                          <td className="text-right py-2 font-medium">{formatCurrency(day.revenue)}</td>
                          <td className="text-right py-2">{formatCurrency(day.revenue / day.bookings)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="space-y-6">
            {/* User Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.users?.activity?.dailyActive || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Usuarios Activos Diarios</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.users?.activity?.weeklyActive || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Usuarios Activos Semanales</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics?.users?.activity?.monthlyActive || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Usuarios Activos Mensuales</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Growth and Distribution */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Crecimiento de Usuarios</CardTitle>
                  <CardDescription>
                    Evolución mensual de la base de usuarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Gráfico de crecimiento de usuarios</p>
                      <p className="text-xs text-gray-400">Total y nuevos usuarios por mes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Rol</CardTitle>
                  <CardDescription>
                    Tipos de usuarios en la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.users?.byRole?.map((role, index) => (
                      <div key={role.role} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{role.role}</span>
                          <span className="text-sm text-gray-600">{role.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-green-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${role.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{role.count.toLocaleString()}</span>
                          <span className="text-sm text-gray-600 ml-1">usuarios</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="space-y-6">
            {/* Top Packages Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance de Paquetes</CardTitle>
                <CardDescription>
                  Métricas de rendimiento de los paquetes más populares
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Paquete</th>
                        <th className="text-right py-2">Vistas</th>
                        <th className="text-right py-2">Reservas</th>
                        <th className="text-right py-2">Conversión</th>
                        <th className="text-right py-2">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.performance?.topPackages?.map((pkg) => (
                        <tr key={pkg.name} className="border-b">
                          <td className="py-3">
                            <div className="font-medium text-gray-900">{pkg.name}</div>
                          </td>
                          <td className="text-right py-3 font-medium">{pkg.views.toLocaleString()}</td>
                          <td className="text-right py-3 font-medium">{pkg.bookings}</td>
                          <td className="text-right py-3">
                            <Badge className={`${
                              pkg.conversion >= 3.5 ? 'bg-green-100 text-green-800' :
                              pkg.conversion >= 2.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pkg.conversion}%
                            </Badge>
                          </td>
                          <td className="text-right py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="font-medium">{pkg.rating}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Fuentes de Tráfico</CardTitle>
                <CardDescription>
                  Origen de visitantes y conversiones por canal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Globe className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.performance?.traffic?.organic || 0}%
                    </div>
                    <p className="text-sm text-gray-600">Búsqueda Orgánica</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Activity className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.performance?.traffic?.direct || 0}%
                    </div>
                    <p className="text-sm text-gray-600">Tráfico Directo</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics?.performance?.traffic?.social || 0}%
                    </div>
                    <p className="text-sm text-gray-600">Redes Sociales</p>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Target className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics?.performance?.traffic?.paid || 0}%
                    </div>
                    <p className="text-sm text-gray-600">Publicidad Paga</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}