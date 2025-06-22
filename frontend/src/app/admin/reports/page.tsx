'use client';

/**
 * 📊 REPORTES EJECUTIVOS - INTERTRAVEL v2.0
 * ==========================================
 * 
 * ✅ Reportes ejecutivos avanzados
 * ✅ KPIs en tiempo real
 * ✅ Análisis predictivo
 * ✅ Dashboards personalizables
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
  Globe,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Target,
  Activity,
  PieChart,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Package,
  Plus
} from 'lucide-react';

// ================================
// 🎨 TYPES & INTERFACES
// ================================

interface ExecutiveKPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target: number;
  unit: string;
  format: 'currency' | 'percentage' | 'number';
  trend: 'up' | 'down' | 'stable';
  category: 'financial' | 'operational' | 'customer' | 'market';
}

interface PerformanceMetric {
  metric: string;
  current: number;
  target: number;
  benchmark: number;
  variance: number;
}

// ================================
// 🎯 MAIN REPORTS COMPONENT
// ================================

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('executive');
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('last_30_days');
  const [executiveKPIs, setExecutiveKPIs] = useState<ExecutiveKPI[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  // ================================
  // 📊 DATA FETCHING
  // ================================

  const fetchReportsData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando datos de reportes ejecutivos...');

      // Mock data para desarrollo
      setExecutiveKPIs([
        {
          id: '1',
          name: 'Ingresos Totales',
          value: 1250000,
          previousValue: 980000,
          target: 1500000,
          unit: 'USD',
          format: 'currency',
          trend: 'up',
          category: 'financial'
        },
        {
          id: '2',
          name: 'Reservas Totales',
          value: 1847,
          previousValue: 1456,
          target: 2000,
          unit: '',
          format: 'number',
          trend: 'up',
          category: 'operational'
        },
        {
          id: '3',
          name: 'Tasa de Conversión',
          value: 3.2,
          previousValue: 2.8,
          target: 4.0,
          unit: '%',
          format: 'percentage',
          trend: 'up',
          category: 'operational'
        },
        {
          id: '4',
          name: 'Ticket Promedio',
          value: 677,
          previousValue: 673,
          target: 700,
          unit: 'USD',
          format: 'currency',
          trend: 'up',
          category: 'financial'
        },
        {
          id: '5',
          name: 'NPS Score',
          value: 72,
          previousValue: 68,
          target: 75,
          unit: '',
          format: 'number',
          trend: 'up',
          category: 'customer'
        },
        {
          id: '6',
          name: 'Market Share',
          value: 12.8,
          previousValue: 11.2,
          target: 15.0,
          unit: '%',
          format: 'percentage',
          trend: 'up',
          category: 'market'
        }
      ]);

      setPerformanceMetrics([
        { metric: 'Tiempo Respuesta', current: 2.1, target: 2.0, benchmark: 3.2, variance: -5.0 },
        { metric: 'Satisfacción Cliente', current: 4.6, target: 4.5, benchmark: 4.2, variance: 2.2 },
        { metric: 'Retención Clientes', current: 78.5, target: 80.0, benchmark: 72.1, variance: -1.9 },
        { metric: 'Conversión Web', current: 3.2, target: 4.0, benchmark: 2.8, variance: -20.0 },
        { metric: 'Margen Bruto', current: 23.8, target: 25.0, benchmark: 21.5, variance: -4.8 }
      ]);

    } catch (error) {
      console.error('❌ Error cargando datos de reportes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [timeframe]);

  // ================================
  // 🎨 HELPER FUNCTIONS
  // ================================

  const formatValue = (value: number, format: string, unit: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: unit || 'USD',
          minimumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}${unit}`;
      default:
        return `${value.toLocaleString()}${unit ? ' ' + unit : ''}`;
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous * 100);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getKPIColor = (value: number, target: number) => {
    const progress = (value / target) * 100;
    if (progress >= 100) return 'text-green-600 bg-green-100';
    if (progress >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // ================================
  // 🎯 EXECUTIVE DASHBOARD TAB
  // ================================

  const renderExecutiveDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h2>
          <p className="text-gray-600">Vista panorámica de KPIs y métricas clave</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="last_7_days">Últimos 7 días</option>
            <option value="last_30_days">Últimos 30 días</option>
            <option value="last_90_days">Últimos 90 días</option>
            <option value="last_year">Último año</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchReportsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Executive KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {executiveKPIs.map((kpi) => {
          const growth = calculateGrowth(kpi.value, kpi.previousValue);
          const progress = (kpi.value / kpi.target) * 100;
          
          return (
            <Card key={kpi.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-600 text-sm">{kpi.name}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatValue(kpi.value, kpi.format, kpi.unit)}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${getKPIColor(kpi.value, kpi.target)}`}>
                    {getTrendIcon(kpi.trend)}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">vs Anterior:</span>
                    <span className={`font-medium flex items-center gap-1 ${
                      growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(growth).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Meta:</span>
                    <span className="font-medium">
                      {formatValue(kpi.target, kpi.format, kpi.unit)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        progress >= 100 ? 'bg-green-500' : 
                        progress >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {progress.toFixed(1)}% de la meta alcanzada
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance vs Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Performance vs Benchmarks
          </CardTitle>
          <CardDescription>Comparación con objetivos e industria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{metric.metric}</span>
                  <span className={`text-sm font-medium ${
                    metric.variance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.variance >= 0 ? '+' : ''}{metric.variance.toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-gray-600">Actual</div>
                    <div className="font-medium">{metric.current}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Meta</div>
                    <div className="font-medium">{metric.target}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Industria</div>
                    <div className="font-medium">{metric.benchmark}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ================================
  // 📈 FINANCIAL REPORTS TAB
  // ================================

  const renderFinancialReports = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Financieros</h2>
          <p className="text-gray-600">Análisis detallado de performance financiera</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            P&L Statement
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Cash Flow
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Balance Sheet
          </Button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {executiveKPIs.filter(kpi => kpi.category === 'financial').map((kpi) => (
          <Card key={kpi.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{kpi.name}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(kpi.value, kpi.format, kpi.unit)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // ================================
  // 🎯 OPERATIONAL REPORTS TAB
  // ================================

  const renderOperationalReports = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Operacionales</h2>
          <p className="text-gray-600">Métricas de eficiencia y productividad</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Reporte Operacional
          </Button>
        </div>
      </div>

      {/* Operational Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Eficiencia Operacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.metric} className="flex items-center justify-between">
                <span className="font-medium">{metric.metric}</span>
                <div className="text-right">
                  <div className="font-semibold">{metric.current}</div>
                  <div className={`text-xs ${metric.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.variance >= 0 ? '+' : ''}{metric.variance.toFixed(1)}% vs meta
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ================================
  // 📋 CUSTOM REPORTS TAB
  // ================================

  const renderCustomReports = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Personalizados</h2>
          <p className="text-gray-600">Crea y gestiona reportes a medida</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Plantilla
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Reporte
          </Button>
        </div>
      </div>

      {/* Report Builder */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Reporte de Ventas</h3>
            <p className="text-sm text-gray-600">Análisis detallado de ventas por período</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Análisis de Clientes</h3>
            <p className="text-sm text-gray-600">Segmentación y comportamiento</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Análisis de Mercado</h3>
            <p className="text-sm text-gray-600">Tendencias y oportunidades</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Performance Productos</h3>
            <p className="text-sm text-gray-600">Rendimiento por paquete</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">ROI Campaigns</h3>
            <p className="text-sm text-gray-600">Retorno de inversión marketing</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Forecasting</h3>
            <p className="text-sm text-gray-600">Predicciones y tendencias</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ================================
  // 🎯 MAIN RENDER
  // ================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Reportes Ejecutivos - InterTravel
          </h1>
          <p className="text-gray-600 mt-1">
            Dashboard ejecutivo con KPIs, análisis predictivo y reportes personalizados
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm" onClick={fetchReportsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="executive" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Dashboard Ejecutivo
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financiero
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Operacional
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Personalizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-6">
          {renderExecutiveDashboard()}
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          {renderFinancialReports()}
        </TabsContent>

        <TabsContent value="operational" className="mt-6">
          {renderOperationalReports()}
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          {renderCustomReports()}
        </TabsContent>
      </Tabs>
    </div>
  );
}