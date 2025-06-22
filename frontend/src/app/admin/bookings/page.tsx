'use client';

/**
 * 📅 GESTIÓN DE RESERVAS - INTERTRAVEL ADMIN
 * ==========================================
 * 
 * ✅ Panel completo de gestión de reservas
 * ✅ Estados de reserva y pagos
 * ✅ Timeline y seguimiento
 * ✅ Comunicación con clientes
 * ✅ Reportes y analytics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock,
  DollarSign,
  User,
  Package,
  MapPin,
  Plane,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Download,
  Filter,
  Search,
  Plus,
  BarChart3,
  TrendingUp,
  CreditCard,
  FileText,
  Bell,
  Settings,
  RefreshCw,
  Users,
  Globe,
  Star,
  Send
} from 'lucide-react';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      paid: <DollarSign className="h-4 w-4" />,
      in_progress: <Plane className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />
    };
    return icons[status as keyof typeof icons] || <Clock className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
            <Calendar className="mr-3 h-8 w-8 text-blue-600" />
            Gestión de Reservas
          </h1>
          <p className="text-gray-600 mt-1">
            Panel completo para gestionar todas las reservas de InterTravel
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Reportes
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reservas</p>
                <p className="text-2xl font-bold text-gray-900">145</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  23 confirmadas
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(186500)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  89 completadas
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
                <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(28750)}</p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  15 pendientes
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(1286)}</p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Por reserva
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                <p className="text-2xl font-bold text-gray-900">94.5%</p>
                <p className="text-sm text-indigo-600 flex items-center mt-1">
                  <Star className="h-3 w-3 mr-1" />
                  Efectividad
                </p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Star className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Lista de Reservas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar reservas..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="paid">Pagadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>

                <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="all">Todos los pagos</option>
                  <option value="pending">Pago pendiente</option>
                  <option value="partial">Pago parcial</option>
                  <option value="paid">Pagado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Bookings Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reserva
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paquete
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fechas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pago
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Mock Booking 1 */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            INT-2025-001234
                          </div>
                          <div className="text-xs text-gray-500">
                            15/06/2025
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                María García
                              </div>
                              <div className="text-xs text-gray-500">maria.garcia@email.com</div>
                              <div className="text-xs text-gray-400">
                                2 viajeros
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            Perú Mágico - Machu Picchu
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            Cusco, Perú
                          </div>
                          <div className="text-xs text-gray-400">
                            7 días
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            15/08/2025
                          </div>
                          <div className="text-xs text-gray-500">
                            al 22/08/2025
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor('confirmed')}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon('confirmed')}
                              confirmada
                            </span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor('partial')}>
                            parcial
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            Pagado: {formatCurrency(1700)}
                          </div>
                          <div className="text-xs text-red-600">
                            Pendiente: {formatCurrency(1700)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(3400)}
                          </div>
                          <div className="text-xs text-gray-500">
                            USD
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Mock Booking 2 */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            INT-2025-001235
                          </div>
                          <div className="text-xs text-gray-500">
                            18/06/2025
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-green-100 rounded-full p-2 mr-3">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Juan Pérez
                              </div>
                              <div className="text-xs text-gray-500">juan.perez@email.com</div>
                              <div className="text-xs text-gray-400">
                                1 viajero
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            Argentina Épica
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            Buenos Aires, Argentina
                          </div>
                          <div className="text-xs text-gray-400">
                            10 días
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            10/09/2025
                          </div>
                          <div className="text-xs text-gray-500">
                            al 20/09/2025
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor('pending')}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon('pending')}
                              pendiente
                            </span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor('pending')}>
                            pendiente
                          </Badge>
                          <div className="text-xs text-red-600 mt-1">
                            Pendiente: {formatCurrency(2775)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(2775)}
                          </div>
                          <div className="text-xs text-gray-500">
                            USD
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Mock Booking 3 */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            INT-2025-001230
                          </div>
                          <div className="text-xs text-gray-500">
                            28/05/2025
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-purple-100 rounded-full p-2 mr-3">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                Laura Martínez
                              </div>
                              <div className="text-xs text-gray-500">laura.martinez@email.com</div>
                              <div className="text-xs text-gray-400">
                                2 viajeros - Luna de miel
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            Perú Mágico - Especial
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            Cusco, Perú
                          </div>
                          <div className="text-xs text-gray-400">
                            7 días
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            20/07/2025
                          </div>
                          <div className="text-xs text-gray-500">
                            al 27/07/2025
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor('completed')}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon('completed')}
                              completada
                            </span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor('paid')}>
                            pagado
                          </Badge>
                          <div className="text-xs text-green-600 mt-1">
                            Total: {formatCurrency(3280)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(3280)}
                          </div>
                          <div className="text-xs text-gray-500">
                            USD
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Star className="h-4 w-4 text-yellow-500" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Reservas</CardTitle>
              <CardDescription>
                Análisis detallado del rendimiento de reservas y tendencias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Detallados</h3>
                <p className="text-gray-600 mb-4">
                  Gráficos de tendencias, conversion rates, patrones estacionales y más.
                </p>
                <p className="text-sm text-gray-500">
                  Funcionalidad en desarrollo - próximamente disponible
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Reservas</CardTitle>
              <CardDescription>
                Configuración global para la gestión de reservas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configuraciones</h3>
                <p className="text-gray-600 mb-4">
                  Estados de reserva, notificaciones automáticas, políticas de cancelación.
                </p>
                <p className="text-sm text-gray-500">
                  Panel de configuración en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}