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
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  Star,
  Lightbulb,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Activity,
  Building,
  Zap
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
  Legend
} from 'recharts';

interface Alert {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  action?: string;
}

interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  priority: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [biData, setBiData] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<any>(null);

  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444'
  };

  useEffect(() => {
    loadBusinessIntelligenceData();
    generateAlertsAndRecommendations();
    
    // Actualizar métricas en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      updateRealtimeMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadBusinessIntelligenceData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // En desarrollo, generar datos simulados
      const mockBIData = {
        executiveSummary: {
          kpis: {
            totalRevenue: 186500,
            totalBookings: 145,
            conversionRate: 23.8,
            customerSatisfaction: 4.7,
            nps: 67
          },
          trends: {
            revenueGrowth: 23.5,
            bookingGrowth: 12.5,
            conversionImprovement: 2.3
          }
        },
        salesPerformance: {
          data: generateSalesSimulation(),
          summary: {
            totalRevenue: 186500,
            totalBookings: 145,
            avgOrderValue: 1287,
            growthRate: 23.5
          },
          insights: [
            'Las ventas han crecido un 23.5% comparado con el período anterior',
            'El AOV ha aumentado un 15% debido a paquetes premium',
            'Los fines de semana muestran 40% más conversión',
            'Perú sigue siendo el destino más demandado (35% del total)'
          ]
        },
        demandForecast: {
          predictions: generateDemandForecast(),
          insights: [
            'Se espera un pico de demanda en octubre (+45%)',
            'Perú mantendrá el liderazgo con 35% de market share',
            'Los paquetes de aventura crecerán 28% en Q4',
            'Recomendamos incrementar inventory para diciembre'
          ]
        },
        pricingOptimization: {
          optimizations: generatePricingOptimizations(),
          insights: [
            'Los precios de paquetes premium pueden aumentar 8%',
            'La demanda de temporada baja es precio-sensible',
            'Ofertas flash aumentan conversión en 45%'
          ]
        },
        churnAnalysis: {
          predictions: generateChurnPredictions(),
          insights: [
            '15% de clientes están en riesgo alto de churn',
            'Clientes sin actividad por 90+ días tienen 85% churn rate',
            'Programas de fidelización reducen churn en 23%'
          ]
        },
        agencyPerformance: {
          agencies: [
            {
              id: 1,
              name: 'Viajes Total',
              conversion_rate: 34.5,
              performance_score: 87,
              earned_commission: 12450,
              completed_bookings: 23,
              ranking: 1
            },
            {
              id: 2,
              name: 'Turismo Sur',
              conversion_rate: 28.2,
              performance_score: 76,
              earned_commission: 8900,
              completed_bookings: 18,
              ranking: 2
            }
          ]
        },
        customerCohorts: {
          cohortData: generateCohortData()
        }
      };

      setBiData(mockBIData);
      
    } catch (error) {
      console.error('Error loading BI data:', error);
      setError('Error cargando datos de Business Intelligence');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRealtimeMetrics = () => {
    setRealtimeMetrics({
      currentVisitors: 42 + Math.floor(Math.random() * 10),
      activeBookings: 6 + Math.floor(Math.random() * 5),
      revenueToday: 11200 + Math.floor(Math.random() * 2000),
      conversionRateToday: 17.5 + Math.random() * 3
    });
  };

  const generateAlertsAndRecommendations = () => {
    const newAlerts: Alert[] = [
      {
        type: 'success',
        title: 'Meta de Revenue Superada',
        message: 'Has superado la meta mensual en un 23%. ¡Excelente trabajo!',
        action: 'Ver detalles'
      },
      {
        type: 'warning',
        title: 'Conversión Baja en Móvil',
        message: 'La conversión en dispositivos móviles bajó 5% esta semana',
        action: 'Optimizar UX móvil'
      },
      {
        type: 'info',
        title: 'Tendencia Alcista en Perú',
        message: 'Los paquetes a Perú muestran 35% más búsquedas',
        action: 'Aumentar inventory'
      }
    ];

    const newRecs: Recommendation[] = [
      {
        title: 'Pricing Dinámico por Temporada',
        description: 'Ajustar precios automáticamente según demanda proyectada',
        impact: 'high',
        effort: 'high',
        priority: 1
      },
      {
        title: 'Optimizar UX Móvil',
        description: 'Mejorar la experiencia de checkout en dispositivos móviles',
        impact: 'medium',
        effort: 'medium',
        priority: 2
      },
      {
        title: 'Programa de Fidelización',
        description: 'Implementar sistema de puntos para reducir churn',
        impact: 'high',
        effort: 'high',
        priority: 3
      }
    ];

    setAlerts(newAlerts);

    setRecommendations(newRecs);
  };

  // Funciones helper para generar datos simulados
  const generateSalesSimulation = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: 4000 + Math.random() * 3000,
      bookings: 3 + Math.floor(Math.random() * 8),
      avgOrderValue: 1200 + Math.random() * 1000
    }));
  };

  const generateDemandForecast = () => {
    const months = ['Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months.map(month => ({
      month,
      destinations: [
        { destination: 'Perú', predictedBookings: 35 + Math.floor(Math.random() * 20), confidence: 85 },
        { destination: 'Argentina', predictedBookings: 28 + Math.floor(Math.random() * 15), confidence: 78 },
        { destination: 'México', predictedBookings: 22 + Math.floor(Math.random() * 12), confidence: 82 }
      ]
    }));
  };

  const generateCohortData = () => {
    return {
      periods: ['Mes 0', 'Mes 1', 'Mes 2', 'Mes 3', 'Mes 6'],
      cohorts: [
        { cohort: 'Enero 2024', size: 45, retention: [100, 78, 56, 45, 32] },
        { cohort: 'Febrero 2024', size: 52, retention: [100, 82, 61, 48, 35] },
        { cohort: 'Marzo 2024', size: 38, retention: [100, 76, 58, 44, null] }
      ]
    };
  };

  const generateChurnPredictions = () => {
    return [
      {
        customerId: 1,
        customerName: 'María García',
        churnProbability: 0.85,
        riskLevel: 'high',
        estimatedLTV: 4500
      },
      {
        customerId: 2,
        customerName: 'Carlos López',
        churnProbability: 0.65,
        riskLevel: 'medium',
        estimatedLTV: 3200
      }
    ];
  };

  const generatePricingOptimizations = () => {
    return [
      {
        packageId: 'peru-magico',
        currentPrice: 1890,
        recommendedPrice: 2050,
        confidence: 87,
        expectedImpact: '+23% revenue'
      }
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number, showSign = true) => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-500">Necesitas permisos de administrador para acceder al Business Intelligence.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Business Intelligence
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis avanzado, predicciones y insights accionables
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadBusinessIntelligenceData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Alertas Inteligentes */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert, index) => (
            <Card key={index} className={`border-l-4 ${
              alert.type === 'success' ? 'border-l-green-500' :
              alert.type === 'warning' ? 'border-l-yellow-500' :
              alert.type === 'error' ? 'border-l-red-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                  {alert.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
                  {alert.type === 'info' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    {alert.action && (
                      <Button size="sm" variant="outline" className="mt-2">
                        {alert.action}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Métricas en Tiempo Real */}
      {realtimeMetrics && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Métricas en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{realtimeMetrics.currentVisitors || 45}</div>
                <div className="text-sm text-gray-600">Visitantes Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{realtimeMetrics.activeBookings || 8}</div>
                <div className="text-sm text-gray-600">Reservas Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(realtimeMetrics.revenueToday || 12450)}</div>
                <div className="text-sm text-gray-600">Revenue Hoy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{realtimeMetrics.conversionRateToday || '18.5'}%</div>
                <div className="text-sm text-gray-600">Conversión Hoy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Análisis */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="predictive">Predictivo</TabsTrigger>
          <TabsTrigger value="agencies">Agencias</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
        </TabsList>

        {/* Tab Resumen */}
        <TabsContent value="overview" className="space-y-6">
          {biData?.executiveSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(biData.executiveSummary.kpis.totalRevenue)}</div>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +23.5% vs período anterior
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Reservas Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{biData.executiveSummary.kpis.totalBookings}</div>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +12.5% vs período anterior
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{biData.executiveSummary.kpis.conversionRate}%</div>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    +2.3% vs período anterior
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Satisfacción</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{biData.executiveSummary.kpis.customerSatisfaction}/5</div>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${
                        i < Math.floor(biData.executiveSummary.kpis.customerSatisfaction) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{biData.executiveSummary.kpis.nps}</div>
                  <div className="text-xs text-gray-600 mt-1">Net Promoter Score</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recomendaciones */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Recomendaciones Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        rec.impact === 'high' ? 'bg-red-500' :
                        rec.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {rec.priority}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'medium' ? 'default' : 'secondary'}>
                            Impacto: {rec.impact}
                          </Badge>
                          <Badge variant="outline">
                            Esfuerzo: {rec.effort}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm">
                        Implementar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Ventas */}
        <TabsContent value="sales" className="space-y-6">
          {biData?.salesPerformance && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Tendencia de Ventas ({selectedPeriod})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={biData.salesPerformance.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(value as number) : value,
                          name === 'revenue' ? 'Revenue' : name === 'bookings' ? 'Reservas' : 'AOV'
                        ]}
                      />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke={chartColors.primary}
                        fill={chartColors.primary}
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="bookings"
                        stroke={chartColors.secondary}
                        strokeWidth={3}
                        name="Reservas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Insights de Ventas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {biData.salesPerformance.insights?.map((insight, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Métricas Clave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Revenue Total</span>
                        <span className="font-bold">{formatCurrency(biData.salesPerformance.summary.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Reservas</span>
                        <span className="font-bold">{biData.salesPerformance.summary.totalBookings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">AOV Promedio</span>
                        <span className="font-bold">{formatCurrency(biData.salesPerformance.summary.avgOrderValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Crecimiento</span>
                        <span className={`font-bold ${biData.salesPerformance.summary.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(biData.salesPerformance.summary.growthRate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab Predictivo */}
        <TabsContent value="predictive" className="space-y-6">
          {/* Predicción de Demanda */}
          {biData?.demandForecast && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Predicción de Demanda (Próximos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={biData.demandForecast.predictions.map(p => ({
                        month: p.month,
                        peru: p.destinations.find(d => d.destination === 'Perú')?.predictedBookings || 0,
                        argentina: p.destinations.find(d => d.destination === 'Argentina')?.predictedBookings || 0,
                        mexico: p.destinations.find(d => d.destination === 'México')?.predictedBookings || 0
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="peru" stackId="a" fill={chartColors.primary} name="Perú" />
                        <Bar dataKey="argentina" stackId="a" fill={chartColors.secondary} name="Argentina" />
                        <Bar dataKey="mexico" stackId="a" fill={chartColors.accent} name="México" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Insights Predictivos</h4>
                    {biData.demandForecast.insights?.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Optimización de Precios */}
          {biData?.pricingOptimization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Optimización de Precios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {biData.pricingOptimization.optimizations?.map((opt, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Paquete: {opt.packageId}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Precio actual: {formatCurrency(opt.currentPrice)} → 
                            Recomendado: {formatCurrency(opt.recommendedPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">{opt.expectedImpact}</div>
                          <div className="text-xs text-gray-500">Confianza: {opt.confidence}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Análisis de Churn */}
          {biData?.churnAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Análisis de Churn - Clientes en Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {biData.churnAnalysis.predictions?.map((pred, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${
                      pred.riskLevel === 'high' ? 'border-red-200 bg-red-50' :
                      pred.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{pred.customerName}</h4>
                          <p className="text-sm text-gray-600">
                            Probabilidad de churn: {(pred.churnProbability * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-600">
                            LTV estimado: {formatCurrency(pred.estimatedLTV)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            pred.riskLevel === 'high' ? 'destructive' :
                            pred.riskLevel === 'medium' ? 'default' : 'secondary'
                          }>
                            {pred.riskLevel === 'high' ? 'Alto Riesgo' :
                             pred.riskLevel === 'medium' ? 'Riesgo Medio' : 'Bajo Riesgo'}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Acción
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Agencias */}
        <TabsContent value="agencies" className="space-y-6">
          {biData?.agencyPerformance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Performance de Agencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {biData.agencyPerformance.agencies?.map((agency, index) => (
                    <div key={agency.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {agency.name}
                            <Badge variant="outline">#{agency.ranking}</Badge>
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                            <div>
                              <span className="text-gray-600">Conversión:</span>
                              <span className="font-medium ml-1">{agency.conversion_rate.toFixed(1)}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Score:</span>
                              <span className="font-medium ml-1">{agency.performance_score}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Comisiones:</span>
                              <span className="font-medium ml-1">{formatCurrency(agency.earned_commission)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Reservas:</span>
                              <span className="font-medium ml-1">{agency.completed_bookings}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`w-3 h-3 rounded-full ${
                            agency.performance_score >= 85 ? 'bg-green-500' :
                            agency.performance_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Clientes */}
        <TabsContent value="customers" className="space-y-6">
          {biData?.customerCohorts && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Análisis de Cohortes de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Cohorte</th>
                        <th className="text-left p-2">Tamaño</th>
                        {biData.customerCohorts.cohortData.periods.map(period => (
                          <th key={period} className="text-center p-2">{period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {biData.customerCohorts.cohortData.cohorts.map((cohort, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2 font-medium">{cohort.cohort}</td>
                          <td className="p-2">{cohort.size}</td>
                          {cohort.retention.map((retention, retIndex) => (
                            <td key={retIndex} className="text-center p-2">
                              {retention !== null ? (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  retention >= 70 ? 'bg-green-100 text-green-800' :
                                  retention >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                  retention >= 30 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {retention}%
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab CRM */}
        <TabsContent value="crm" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Pipeline de Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span>Nuevos Leads</span>
                    <Badge>23</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span>En Contacto</span>
                    <Badge>15</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span>Propuesta Enviada</span>
                    <Badge>8</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span>Cerrados</span>
                    <Badge>12</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad CRM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">Lead calificado - María García</p>
                      <p className="text-xs text-gray-500">Hace 5 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">Propuesta enviada - Carlos López</p>
                      <p className="text-xs text-gray-500">Hace 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">Venta cerrada - Ana Rodríguez</p>
                      <p className="text-xs text-gray-500">Hace 1 día</p>
                    </div>
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