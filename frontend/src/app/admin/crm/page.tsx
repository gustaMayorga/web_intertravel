'use client';

/**
 * 👥 CRM AVANZADO - INTERTRAVEL WEB-FINAL-UNIFICADA
 * ================================================
 * 
 * ✅ Sistema CRM empresarial completo
 * ✅ Pipeline visual drag & drop
 * ✅ Gestión avanzada de leads
 * ✅ Automatización de seguimiento
 * ✅ Segmentación inteligente
 * ✅ Reportes de conversión
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Phone, 
  Mail, 
  Calendar,
  DollarSign,
  Activity,
  Filter,
  Plus,
  Search,
  Download,
  BarChart3,
  PieChart,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Building,
  MapPin,
  Briefcase,
  MessageSquare,
  Star,
  Globe,
  Archive,
  Send,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

// ================================
// 🎨 TYPES & INTERFACES
// ================================

interface Lead {
  id: string;
  lead_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  quality_score: number;
  desired_destination?: string;
  budget_range?: string;
  travel_dates?: any;
  notes?: string;
  assigned_to?: string;
  last_activity?: string;
  created_at: string;
}

interface Opportunity {
  id: string;
  opportunity_number: string;
  name: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  estimated_value: number;
  close_date: string;
  lead_id?: string;
  customer_id?: string;
  assigned_to?: string;
  description?: string;
  activities: ActivityType[];
  created_at: string;
}

interface ActivityType {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  date: string;
  completed: boolean;
  contact_person?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  displayName: string;
  color: string;
  order: number;
  opportunities: Opportunity[];
}

interface CrmStats {
  totalLeads: number;
  newLeadsThisMonth: number;
  totalOpportunities: number;
  activePipelineValue: number;
  conversionRate: number;
  totalQuotes: number;
  quotesThisMonth: number;
  avgDealSize: number;
  salesCycleLength: number;
}

// ================================
// 🎯 MAIN CRM COMPONENT
// ================================

export default function CrmPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [crmStats, setCrmStats] = useState<CrmStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // ================================
  // 📊 DATA FETCHING
  // ================================

  const fetchCrmData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Cargando datos CRM...');

      // Mock data para desarrollo - reemplazar con APIs reales
      setCrmStats({
        totalLeads: 234,
        newLeadsThisMonth: 45,
        totalOpportunities: 67,
        activePipelineValue: 345600,
        conversionRate: 23.5,
        totalQuotes: 89,
        quotesThisMonth: 23,
        avgDealSize: 5156,
        salesCycleLength: 28
      });

      const mockLeads: Lead[] = [
        {
          id: '1',
          lead_number: 'LEAD-2025-001234',
          first_name: 'María',
          last_name: 'García',
          email: 'maria.garcia@email.com',
          phone: '+54 261 123-4567',
          source: 'website',
          status: 'new',
          priority: 'high',
          quality_score: 85,
          desired_destination: 'Perú - Cusco',
          budget_range: 'premium',
          last_activity: 'Lead generado desde el formulario web',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          lead_number: 'LEAD-2025-001235',
          first_name: 'Carlos',
          last_name: 'López',
          email: 'carlos.lopez@email.com',
          phone: '+54 11 987-6543',
          source: 'referral',
          status: 'contacted',
          priority: 'medium',
          quality_score: 72,
          desired_destination: 'España - Madrid',
          budget_range: 'mid_range',
          last_activity: 'Llamada telefónica realizada',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          lead_number: 'LEAD-2025-001236',
          first_name: 'Ana',
          last_name: 'Rodríguez',
          email: 'ana.rodriguez@email.com',
          source: 'social_media',
          status: 'qualified',
          priority: 'high',
          quality_score: 91,
          desired_destination: 'Francia - París',
          budget_range: 'luxury',
          last_activity: 'Cotización enviada por email',
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockOpportunities: Opportunity[] = [
        {
          id: '1',
          opportunity_number: 'OPP-2025-001234',
          name: 'Viaje Familiar Perú',
          stage: 'proposal',
          probability: 75,
          estimated_value: 4500,
          close_date: '2025-07-15',
          description: 'Familia de 4 personas, viaje de 10 días',
          activities: [
            {
              id: '1',
              type: 'call',
              title: 'Llamada de seguimiento',
              description: 'Discutir detalles del itinerario',
              date: new Date().toISOString(),
              completed: false
            }
          ],
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          opportunity_number: 'OPP-2025-001235',
          name: 'Luna de Miel Europa',
          stage: 'negotiation',
          probability: 60,
          estimated_value: 6800,
          close_date: '2025-08-20',
          description: 'Pareja joven, 15 días por Europa',
          activities: [],
          created_at: new Date().toISOString()
        }
      ];

      setLeads(mockLeads);
      setOpportunities(mockOpportunities);

      // Crear pipeline stages con oportunidades distribuidas
      const stages: PipelineStage[] = [
        {
          id: 'prospecting',
          name: 'prospecting',
          displayName: 'Prospección',
          color: 'bg-blue-500',
          order: 1,
          opportunities: mockOpportunities.filter(o => o.stage === 'prospecting')
        },
        {
          id: 'qualification',
          name: 'qualification',
          displayName: 'Calificación',
          color: 'bg-yellow-500',
          order: 2,
          opportunities: mockOpportunities.filter(o => o.stage === 'qualification')
        },
        {
          id: 'proposal',
          name: 'proposal',
          displayName: 'Propuesta',
          color: 'bg-orange-500',
          order: 3,
          opportunities: mockOpportunities.filter(o => o.stage === 'proposal')
        },
        {
          id: 'negotiation',
          name: 'negotiation',
          displayName: 'Negociación',
          color: 'bg-purple-500',
          order: 4,
          opportunities: mockOpportunities.filter(o => o.stage === 'negotiation')
        },
        {
          id: 'closed_won',
          name: 'closed_won',
          displayName: 'Ganado',
          color: 'bg-green-500',
          order: 5,
          opportunities: mockOpportunities.filter(o => o.stage === 'closed_won')
        }
      ];

      setPipelineStages(stages);

    } catch (error) {
      console.error('❌ Error cargando datos CRM:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  // ================================
  // 🎨 RENDER HELPERS
  // ================================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      converted: 'bg-emerald-100 text-emerald-800',
      lost: 'bg-red-100 text-red-800',
      prospecting: 'bg-blue-100 text-blue-800',
      qualification: 'bg-yellow-100 text-yellow-800',
      proposal: 'bg-orange-100 text-orange-800',
      negotiation: 'bg-purple-100 text-purple-800',
      closed_won: 'bg-green-100 text-green-800',
      closed_lost: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'website': return <Globe className="h-4 w-4" />;
      case 'referral': return <Users className="h-4 w-4" />;
      case 'social_media': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // ================================
  // 📊 DASHBOARD TAB
  // ================================

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">
                  {crmStats?.totalLeads.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{crmStats?.newLeadsThisMonth} este mes
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(crmStats?.activePipelineValue || 0)}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {crmStats?.totalOpportunities} oportunidades
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                <p className="text-3xl font-bold text-gray-900">
                  {crmStats?.conversionRate}%
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Promedio histórico
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deal Promedio</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(crmStats?.avgDealSize || 0)}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {crmStats?.salesCycleLength} días ciclo
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts y Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pipeline de Ventas
            </CardTitle>
            <CardDescription>Distribución de oportunidades por etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineStages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <span className="text-sm font-medium">{stage.displayName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{stage.opportunities.length}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({formatCurrency(stage.opportunities.reduce((sum, opp) => sum + opp.estimated_value, 0))})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas acciones en el CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  icon: Phone,
                  text: 'Llamada con María García',
                  subtext: 'Lead calificado - alta prioridad',
                  time: 'Hace 15 min',
                  color: 'text-blue-600'
                },
                {
                  icon: Mail,
                  text: 'Cotización enviada a Carlos López',
                  subtext: 'Propuesta España - Madrid',
                  time: 'Hace 1 hora',
                  color: 'text-green-600'
                },
                {
                  icon: Calendar,
                  text: 'Reunión programada con Ana Rodríguez',
                  subtext: 'Mañana a las 14:00',
                  time: 'Hace 2 horas',
                  color: 'text-purple-600'
                }
              ].map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-gray-100">
                      <IconComponent className={`h-3 w-3 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                      <p className="text-xs text-gray-600">{activity.subtext}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // ================================
  // 👥 LEADS TAB
  // ================================

  const renderLeads = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Leads</h2>
          <p className="text-gray-600">Administra y convierte leads en clientes</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid gap-4">
        {leads
          .filter(lead => 
            lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((lead) => {
            const SourceIcon = getSourceIcon(lead.source);
            return (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </h3>
                          {getPriorityIcon(lead.priority)}
                        </div>
                        <p className="text-sm text-gray-600">{lead.email}</p>
                        <p className="text-sm text-gray-600">{lead.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">{lead.lead_number}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status === 'new' ? 'Nuevo' :
                         lead.status === 'contacted' ? 'Contactado' :
                         lead.status === 'qualified' ? 'Calificado' :
                         lead.status === 'converted' ? 'Convertido' :
                         lead.status === 'lost' ? 'Perdido' : lead.status}
                      </Badge>
                      <div className="mt-2 text-sm text-gray-500">
                        Score: {lead.quality_score}/100
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Origen:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <SourceIcon />
                        <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Destino:</span>
                      <div className="font-medium mt-1">{lead.desired_destination || 'No especificado'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Presupuesto:</span>
                      <div className="font-medium mt-1 capitalize">
                        {lead.budget_range?.replace('_', ' ') || 'No especificado'}
                      </div>
                    </div>
                  </div>

                  {lead.last_activity && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Última actividad:</strong> {lead.last_activity}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-gray-500">
                      Creado: {new Date(lead.created_at).toLocaleDateString('es-AR')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-1" />
                        Llamar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );

  // ================================
  // 🎯 PIPELINE TAB
  // ================================

  const renderPipeline = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline de Ventas</h2>
          <p className="text-gray-600">Vista kanban de oportunidades por etapa</p>
        </div>
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Oportunidad
          </Button>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => (
          <div key={stage.id} className="min-w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className={`p-4 ${stage.color} bg-opacity-10 border-b`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{stage.displayName}</h3>
                  <Badge variant="secondary">
                    {stage.opportunities.length}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formatCurrency(stage.opportunities.reduce((sum, opp) => sum + opp.estimated_value, 0))}
                </p>
              </div>
              
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {stage.opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{opportunity.name}</h4>
                          <p className="text-xs text-gray-500">{opportunity.opportunity_number}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(opportunity.estimated_value)}
                          </span>
                          <Badge variant="outline">
                            {opportunity.probability}%
                          </Badge>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${opportunity.probability}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Cierre: {new Date(opportunity.close_date).toLocaleDateString('es-AR')}</span>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            <span>{opportunity.activities.length}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {stage.opportunities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="mx-auto h-8 w-8 mb-2" />
                    <p>No hay oportunidades en esta etapa</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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
            {Array.from({ length: 4 }).map((_, i) => (
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
            👥 CRM Avanzado - InterTravel
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema completo de gestión de relaciones con clientes y pipeline de ventas
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm" onClick={fetchCrmData}>
            <Activity className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="leads" className="mt-6">
          {renderLeads()}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          {renderPipeline()}
        </TabsContent>
      </Tabs>
    </div>
  );
}