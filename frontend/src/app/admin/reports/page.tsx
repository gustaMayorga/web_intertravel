'use client';

/**
 * 📊 REPORTES Y BUSINESS INTELLIGENCE - INTERTRAVEL ADMIN
 * =========================================================
 * 
 * ✅ Reportes financieros
 * ✅ Reportes de ventas
 * ✅ Reportes de agencias
 * ✅ Reportes operativos
 * ✅ Exportación automática
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Building,
  Package,
  Bookmark,
  Globe,
  Mail,
  Filter,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Award,
  CreditCard,
  Activity,
  RefreshCw,
  Share,
  Printer,
  FileSpreadsheet,
  FileImage,
  File // Reemplazar FilePdf por File
} from 'lucide-react';

// Tipos de reportes disponibles
const REPORT_TYPES = {
  financial: {
    label: 'Financieros',
    icon: DollarSign,
    color: 'bg-green-100 text-green-800',
    reports: [
      { id: 'revenue', name: 'Ingresos por Período', description: 'Análisis detallado de ingresos' },
      { id: 'commissions', name: 'Comisiones de Agencias', description: 'Comisiones pagadas y pendientes' },
      { id: 'profit', name: 'Análisis de Rentabilidad', description: 'Márgenes y costos por servicio' },
      { id: 'taxes', name: 'Reporte Fiscal', description: 'Información para declaraciones' }
    ]
  },
  sales: {
    label: 'Ventas',
    icon: TrendingUp,
    color: 'bg-blue-100 text-blue-800',
    reports: [
      { id: 'sales-summary', name: 'Resumen de Ventas', description: 'Ventas por período y canal' },
      { id: 'packages-performance', name: 'Performance de Paquetes', description: 'Paquetes más vendidos' },
      { id: 'destinations-analysis', name: 'Análisis de Destinos', description: 'Popularidad por destino' },
      { id: 'conversion-funnel', name: 'Embudo de Conversión', description: 'Análisis del proceso de venta' }
    ]
  },
  agencies: {
    label: 'Agencias',
    icon: Building,
    color: 'bg-purple-100 text-purple-800',
    reports: [
      { id: 'agencies-performance', name: 'Performance de Agencias', description: 'Ranking y métricas B2B' },
      { id: 'commissions-detail', name: 'Detalle de Comisiones', description: 'Comisiones por agencia' },
      { id: 'agencies-growth', name: 'Crecimiento de Agencias', description: 'Evolución temporal' },
      { id: 'b2b-analytics', name: 'Analytics B2B', description: 'Métricas del portal B2B' }
    ]
  },
  operational: {
    label: 'Operativos',
    icon: Activity,
    color: 'bg-orange-100 text-orange-800',
    reports: [
      { id: 'bookings-status', name: 'Estado de Reservas', description: 'Seguimiento operativo' },
      { id: 'customer-satisfaction', name: 'Satisfacción del Cliente', description: 'Encuestas y ratings' },
      { id: 'support-tickets', name: 'Tickets de Soporte', description: 'Gestión de incidencias' },
      { id: 'system-health', name: 'Salud del Sistema', description: 'Métricas técnicas' }
    ]
  }
};

// Formatos de exportación
const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF', icon: File, color: 'text-red-600' },
  { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-green-600' },
  { id: 'csv', label: 'CSV', icon: FileText, color: 'text-blue-600' },
  { id: 'png', label: 'PNG', icon: FileImage, color: 'text-purple-600' }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);

  // Cargar estadísticas de reportes
  const loadReportsStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/reports/stats?days=${selectedPeriod}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        console.log('✅ Estadísticas de reportes cargadas:', data.stats);
      } else {
        throw new Error(data.error || 'Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      setError(error.message);
      
      // Fallback con datos mock
      setStats({
        overview: {
          totalRevenue: 425680,
          totalBookings: 156,
          totalAgencies: 23,
          avgRating: 4.7,
          revenueGrowth: 12.5,
          bookingsGrowth: 8.3,
          agenciesGrowth: 15.2,
          ratingGrowth: 2.1
        },
        financial: {
          grossRevenue: 425680,
          netRevenue: 383112,
          commissionsPaid: 42568,
          taxesOwed: 89393,
          profitMargin: 28.5
        },
        sales: {
          directSales: 312450,
          agencySales: 113230,
          topPackage: 'Perú Mágico',
          topDestination: 'Cusco',
          conversionRate: 3.8
        },
        agencies: {
          totalAgencies: 23,
          activeAgencies: 19,
          topPerformer: 'Chile Adventures',
          avgCommission: 11.2,
          totalCommissions: 58695
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generar reporte
  const generateReport = async (reportType, reportId, format = 'pdf') => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: reportType,
          reportId: reportId,
          format: format,
          period: selectedPeriod,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportId}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('✅ Reporte generado y descargado exitosamente');
      } else {
        throw new Error('Error al generar el reporte');
      }
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    loadReportsStats();
  }, [selectedPeriod]);

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
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
            <FileText className="mr-3 h-8 w-8 text-blue-600" />
            Reportes y Business Intelligence
          </h1>
          <p className="text-gray-600 mt-1">
            Reportes ejecutivos y análisis detallado del negocio
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button size="sm" onClick={loadReportsStats}>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financieros
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="agencies" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Agencias
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Operativos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="space-y-6">
            {/* Executive Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats?.overview?.totalRevenue || 0)}
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (stats?.overview?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {formatPercent(stats?.overview?.revenueGrowth || 0)}
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
                        {stats?.overview?.totalBookings || 0}
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (stats?.overview?.bookingsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Bookmark className="h-3 w-3 mr-1" />
                        {formatPercent(stats?.overview?.bookingsGrowth || 0)}
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
                      <p className="text-sm font-medium text-gray-600">Agencias Activas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.overview?.totalAgencies || 0}
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (stats?.overview?.agenciesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Building className="h-3 w-3 mr-1" />
                        {formatPercent(stats?.overview?.agenciesGrowth || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Building className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rating Promedio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.overview?.avgRating || 0}
                      </p>
                      <p className={`text-sm flex items-center mt-1 ${
                        (stats?.overview?.ratingGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Award className="h-3 w-3 mr-1" />
                        {formatPercent(stats?.overview?.ratingGrowth || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Reportes Ejecutivos Rápidos</CardTitle>
                <CardDescription>
                  Genera reportes ejecutivos con un solo clic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button 
                    variant="outline" 
                    className="p-6 h-auto flex flex-col items-center gap-2"
                    onClick={() => generateReport('financial', 'executive-summary')}
                  >
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <span className="font-medium">Resumen Financiero</span>
                    <span className="text-xs text-gray-600">Últimos {selectedPeriod} días</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="p-6 h-auto flex flex-col items-center gap-2"
                    onClick={() => generateReport('sales', 'sales-executive')}
                  >
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <span className="font-medium">Reporte de Ventas</span>
                    <span className="text-xs text-gray-600">Performance completo</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="p-6 h-auto flex flex-col items-center gap-2"
                    onClick={() => generateReport('agencies', 'agencies-summary')}
                  >
                    <Building className="h-8 w-8 text-purple-600" />
                    <span className="font-medium">Resumen B2B</span>
                    <span className="text-xs text-gray-600">Agencias y comisiones</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    className="p-6 h-auto flex flex-col items-center gap-2"
                    onClick={() => generateReport('operational', 'operational-kpis')}
                  >
                    <Activity className="h-8 w-8 text-orange-600" />
                    <span className="font-medium">KPIs Operativos</span>
                    <span className="text-xs text-gray-600">Métricas clave</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts Dashboard */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Ingresos</CardTitle>
                  <CardDescription>
                    Evolución de ingresos en los últimos {selectedPeriod} días
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Gráfico de líneas - Ingresos</p>
                      <p className="text-xs text-gray-400">Datos en tiempo real</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Ventas</CardTitle>
                  <CardDescription>
                    Ventas por canal y tipo de cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm">Gráfico circular - Distribución</p>
                      <p className="text-xs text-gray-400">Directo vs B2B</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {REPORT_TYPES.financial.reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    {report.name}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Período: Últimos {selectedPeriod} días
                    </div>
                    
                    <div className="flex gap-2">
                      {EXPORT_FORMATS.map((format) => (
                        <Button
                          key={format.id}
                          variant="outline"
                          size="sm"
                          onClick={() => generateReport('financial', report.id, format.id)}
                          disabled={isGenerating}
                        >
                          <format.icon className={`h-4 w-4 mr-1 ${format.color}`} />
                          {format.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {REPORT_TYPES.sales.reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {report.name}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Período: Últimos {selectedPeriod} días
                    </div>
                    
                    <div className="flex gap-2">
                      {EXPORT_FORMATS.map((format) => (
                        <Button
                          key={format.id}
                          variant="outline"
                          size="sm"
                          onClick={() => generateReport('sales', report.id, format.id)}
                          disabled={isGenerating}
                        >
                          <format.icon className={`h-4 w-4 mr-1 ${format.color}`} />
                          {format.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Agencies Reports Tab */}
        <TabsContent value="agencies" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {REPORT_TYPES.agencies.reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    {report.name}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Período: Últimos {selectedPeriod} días
                    </div>
                    
                    <div className="flex gap-2">
                      {EXPORT_FORMATS.map((format) => (
                        <Button
                          key={format.id}
                          variant="outline"
                          size="sm"
                          onClick={() => generateReport('agencies', report.id, format.id)}
                          disabled={isGenerating}
                        >
                          <format.icon className={`h-4 w-4 mr-1 ${format.color}`} />
                          {format.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Operational Reports Tab */}
        <TabsContent value="operational" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {REPORT_TYPES.operational.reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    {report.name}
                  </CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Período: Últimos {selectedPeriod} días
                    </div>
                    
                    <div className="flex gap-2">
                      {EXPORT_FORMATS.map((format) => (
                        <Button
                          key={format.id}
                          variant="outline"
                          size="sm"
                          onClick={() => generateReport('operational', report.id, format.id)}
                          disabled={isGenerating}
                        >
                          <format.icon className={`h-4 w-4 mr-1 ${format.color}`} />
                          {format.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Loading Indicator */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 font-medium">Generando reporte...</span>
          </div>
        </div>
      )}
    </div>
  );
}