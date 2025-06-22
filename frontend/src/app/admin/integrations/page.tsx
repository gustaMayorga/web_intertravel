'use client';

/**
 * 🔗 PANEL DE CONTROL DE INTEGRACIONES - AGENTE 5
 * ================================================
 * 
 * Panel de administración centralizado para gestionar todas las integraciones:
 * - Uber API (traslados)
 * - Seguros de viaje
 * - WhatsApp Business
 * - Sistema de fidelización
 * - Pagos (control de estado)
 * 
 * Funcionalidades:
 * ✅ Start/Stop/Pause cada integración
 * ✅ Monitoreo en tiempo real
 * ✅ Configuración de APIs
 * ✅ Logs y diagnósticos
 * ✅ Estadísticas de uso
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Play, 
  Pause, 
  Square, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Car,
  Shield,
  MessageCircle,
  Star,
  CreditCard,
  Activity,
  BarChart3,
  Eye,
  Code,
  Zap,
  Globe,
  Clock,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';

interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  icon: React.ComponentType<any>;
  lastCheck: string;
  uptime: string;
  requestsToday: number;
  errorRate: number;
  apiKey?: string;
  endpoint?: string;
  config?: Record<string, any>;
}

interface IntegrationLogs {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  integration: string;
  message: string;
  details?: string;
}

export default function IntegrationsControlPanel() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [logs, setLogs] = useState<IntegrationLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Inicializar datos
  useEffect(() => {
    loadIntegrationsStatus();
    loadRecentLogs();

    // Auto-refresh cada 30 segundos
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadIntegrationsStatus();
        loadRecentLogs();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadIntegrationsStatus = async () => {
    try {
      setLoading(true);
      
      // Simular carga de APIs (reemplazar por llamadas reales)
      const mockIntegrations: IntegrationStatus[] = [
        {
          id: 'uber-api',
          name: 'Uber API',
          description: 'Servicio de traslados automáticos',
          status: 'active',
          icon: Car,
          lastCheck: '2 min ago',
          uptime: '99.8%',
          requestsToday: 247,
          errorRate: 0.2,
          apiKey: 'sk_test_****',
          endpoint: 'https://api.uber.com/v1.2',
          config: {
            sandbox: true,
            autoAssign: true,
            defaultCity: 'Buenos Aires'
          }
        },
        {
          id: 'insurance-api',
          name: 'Seguros de Viaje',
          description: 'API de seguros integrada',
          status: 'active',
          icon: Shield,
          lastCheck: '1 min ago',
          uptime: '99.9%',
          requestsToday: 89,
          errorRate: 0.1,
          apiKey: 'ins_****',
          endpoint: 'https://api.segurosviajar.com/v2',
          config: {
            coverage: ['medical', 'trip', 'luggage'],
            autoQuote: true
          }
        },
        {
          id: 'whatsapp-business',
          name: 'WhatsApp Business',
          description: 'Notificaciones y chat automático',
          status: 'active',
          icon: MessageCircle,
          lastCheck: '30 sec ago',
          uptime: '100%',
          requestsToday: 156,
          errorRate: 0,
          apiKey: 'wa_****',
          endpoint: 'https://graph.facebook.com/v18.0',
          config: {
            phoneNumber: '+5491112345678',
            webhookEnabled: true,
            catalogEnabled: true
          }
        },
        {
          id: 'loyalty-system',
          name: 'Sistema de Fidelización',
          description: 'Puntos y recompensas',
          status: 'active',
          icon: Star,
          lastCheck: '1 min ago',
          uptime: '100%',
          requestsToday: 203,
          errorRate: 0,
          config: {
            pointsPerDollar: 1,
            tierSystem: true,
            rewardsEnabled: true
          }
        },
        {
          id: 'payments',
          name: 'Pasarelas de Pago',
          description: 'MercadoPago + Stripe + PayPal',
          status: 'active',
          icon: CreditCard,
          lastCheck: '30 sec ago',
          uptime: '99.95%',
          requestsToday: 324,
          errorRate: 0.05,
          config: {
            mercadopago: { enabled: true, webhook: true },
            stripe: { enabled: true, webhook: true },
            paypal: { enabled: false }
          }
        },
        {
          id: 'analytics',
          name: 'Analytics & BI',
          description: 'Recolección de datos y métricas',
          status: 'error',
          icon: BarChart3,
          lastCheck: '5 min ago',
          uptime: '95.2%',
          requestsToday: 1024,
          errorRate: 4.8,
          config: {
            realTimeTracking: true,
            dataRetention: '90 days',
            exportEnabled: true
          }
        }
      ];

      setIntegrations(mockIntegrations);
      
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentLogs = async () => {
    try {
      // Simular logs recientes
      const mockLogs: IntegrationLogs[] = [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          level: 'success',
          integration: 'Uber API',
          message: 'Traslado reservado exitosamente',
          details: 'Booking ID: UB-2024-001 - Usuario: María García'
        },
        {
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          level: 'info',
          integration: 'WhatsApp Business',
          message: 'Notificación enviada',
          details: 'Confirmación de reserva enviada a +5491112345678'
        },
        {
          timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          level: 'error',
          integration: 'Analytics & BI',
          message: 'Error en conexión a base de datos',
          details: 'Connection timeout after 30s'
        },
        {
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          level: 'success',
          integration: 'Seguros de Viaje',
          message: 'Póliza emitida automáticamente',
          details: 'Póliza #POL-2024-089 - Cobertura completa'
        },
        {
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          level: 'warning',
          integration: 'Sistema de Fidelización',
          message: 'Rate limit alcanzado',
          details: 'Reduciendo frecuencia de actualización de puntos'
        }
      ];

      setLogs(mockLogs);
      
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const toggleIntegration = async (integrationId: string, action: 'start' | 'stop' | 'pause') => {
    try {
      console.log(`${action.toUpperCase()} integration: ${integrationId}`);
      
      // Actualizar estado local temporalmente
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              status: action === 'start' ? 'active' : action === 'stop' ? 'inactive' : 'loading'
            }
          : integration
      ));

      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Agregar log de la acción
      const newLog: IntegrationLogs = {
        timestamp: new Date().toISOString(),
        level: 'info',
        integration: integrations.find(i => i.id === integrationId)?.name || integrationId,
        message: `Integración ${action === 'start' ? 'iniciada' : action === 'stop' ? 'detenida' : 'pausada'}`,
        details: `Acción ejecutada por administrador`
      };
      
      setLogs(prev => [newLog, ...prev]);
      
      // Recargar estado
      await loadIntegrationsStatus();
      
    } catch (error) {
      console.error(`Error ${action} integration ${integrationId}:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      loading: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inactive': return <WifiOff className="h-4 w-4 text-gray-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'loading': return <RefreshCw className="h-4 w-4 text-yellow-600 animate-spin" />;
      default: return <Wifi className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      error: 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[level as keyof typeof colors] || colors.info;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            Control de Integraciones
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona todas las integraciones del ecosistema InterTravel
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <div className="flex items-center gap-2">
            <label htmlFor="auto-refresh" className="text-sm font-medium text-gray-700">
              Auto-refresh
            </label>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadIntegrationsStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Integraciones Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con Errores</p>
                <p className="text-2xl font-bold text-red-600">
                  {integrations.filter(i => i.status === 'error').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requests Hoy</p>
                <p className="text-2xl font-bold text-blue-600">
                  {integrations.reduce((sum, i) => sum + i.requestsToday, 0).toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime Promedio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(integrations.reduce((sum, i) => sum + parseFloat(i.uptime), 0) / integrations.length).toFixed(1)}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="logs">Logs & Actividad</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const IconComponent = integration.icon;
              
              return (
                <Card key={integration.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <IconComponent className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(integration.status)}>
                        {getStatusIcon(integration.status)}
                        <span className="ml-1 capitalize">{integration.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Uptime</p>
                        <p className="font-semibold">{integration.uptime}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Requests Hoy</p>
                        <p className="font-semibold">{integration.requestsToday.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Error Rate</p>
                        <p className="font-semibold">{integration.errorRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Último Check</p>
                        <p className="font-semibold">{integration.lastCheck}</p>
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant={integration.status === 'active' ? 'secondary' : 'default'}
                        onClick={() => toggleIntegration(integration.id, 'start')}
                        disabled={integration.status === 'active'}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleIntegration(integration.id, 'pause')}
                        disabled={integration.status !== 'active'}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => toggleIntegration(integration.id, 'stop')}
                        disabled={integration.status === 'inactive'}
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedIntegration(integration.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getLevelColor(log.level)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {log.integration}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium">{log.message}</p>
                        {log.details && (
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Alert>
            <Code className="h-4 w-4" />
            <AlertDescription>
              <strong>Configuración Global de Integraciones</strong><br />
              Ajusta los parámetros globales que afectan a todas las integraciones del sistema.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración Global</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Debug Mode</label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Auto-retry on Failure</label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Rate Limiting</label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Log Retention (30 days)</label>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoreo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Health Check Alerts</label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Performance Monitoring</label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Error Notifications</label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Slack Notifications</label>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}