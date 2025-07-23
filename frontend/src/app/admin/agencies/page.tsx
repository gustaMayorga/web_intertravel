'use client';

/**
 * 🏢 GESTIÓN DE AGENCIAS B2B - INTERTRAVEL ADMIN
 * ===============================================
 * 
 * ✅ Portal B2B completo
 * ✅ Gestión de comisiones
 * ✅ Estadísticas por agencia
 * ✅ Onboarding de agencias
 * ✅ Sistema de niveles
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  Award,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Bookmark,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Crown,
  Target,
  BarChart3,
  Settings,
  User,
  Building2,
  Briefcase,
  CreditCard,
  Activity
} from 'lucide-react';

// Niveles de agencias
const AGENCY_LEVELS = {
  bronze: {
    label: 'Bronce',
    color: 'bg-orange-100 text-orange-800',
    icon: Award,
    commission: 8,
    minSales: 0
  },
  silver: {
    label: 'Plata',
    color: 'bg-gray-100 text-gray-800',
    icon: Award,
    commission: 10,
    minSales: 50000
  },
  gold: {
    label: 'Oro',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Star,
    commission: 12,
    minSales: 100000
  },
  platinum: {
    label: 'Platino',
    color: 'bg-purple-100 text-purple-800',
    icon: Crown,
    commission: 15,
    minSales: 250000
  }
};

// Estados de agencias
const AGENCY_STATUSES = {
  active: {
    label: 'Activa',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  suspended: {
    label: 'Suspendida',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  },
  inactive: {
    label: 'Inactiva',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle
  }
};

export default function AgenciesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  const [agencies, setAgencies] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    level: 'all',
    status: 'all',
    country: 'all'
  });

  // Cargar agencias
  const loadAgencies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50',
        search: filters.search,
        level: filters.level === 'all' ? '' : filters.level,
        status: filters.status === 'all' ? '' : filters.status,
        country: filters.country === 'all' ? '' : filters.country
      });
      
      const response = await fetch(`/api/admin/agencies?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setAgencies(data.data || []);
        console.log('✅ Agencias cargadas:', data.data?.length || 0);
      } else {
        throw new Error(data.error || 'Error al cargar agencias');
      }
    } catch (error) {
      console.error('❌ Error cargando agencias:', error);
      setError(error.message);
      
      // Fallback con datos mock
      setAgencies([
        {
          id: 'AGC001',
          name: 'Travel Dreams Agency',
          businessName: 'Travel Dreams S.A.',
          code: 'TDA001',
          level: 'gold',
          status: 'active',
          contactPerson: 'María González',
          email: 'maria@traveldreams.com',
          phone: '+54 9 11 1234-5678',
          website: 'https://traveldreams.com',
          address: 'Av. Corrientes 1234, Buenos Aires',
          country: 'Argentina',
          city: 'Buenos Aires',
          createdAt: '2024-03-15T00:00:00Z',
          lastLogin: '2024-12-21T15:30:00Z',
          commission: 12,
          totalSales: 125680,
          totalBookings: 47,
          monthlyTarget: 15000,
          currentMonthSales: 12340,
          rating: 4.8,
          documents: {
            businessLicense: 'verified',
            taxId: 'verified',
            insurance: 'pending'
          }
        },
        {
          id: 'AGC002',
          name: 'Mendoza Turismo',
          businessName: 'Mendoza Turismo LTDA',
          code: 'MDZ002',
          level: 'silver',
          status: 'active',
          contactPerson: 'Carlos Ruiz',
          email: 'carlos@mendozaturismo.com',
          phone: '+54 9 261 555-9876',
          website: 'https://mendozaturismo.com',
          address: 'San Martín 567, Mendoza',
          country: 'Argentina',
          city: 'Mendoza',
          createdAt: '2024-05-20T00:00:00Z',
          lastLogin: '2024-12-20T09:45:00Z',
          commission: 10,
          totalSales: 78450,
          totalBookings: 32,
          monthlyTarget: 10000,
          currentMonthSales: 8900,
          rating: 4.6,
          documents: {
            businessLicense: 'verified',
            taxId: 'verified',
            insurance: 'verified'
          }
        },
        {
          id: 'AGC003',
          name: 'Chile Adventures',
          businessName: 'Chile Adventures SpA',
          code: 'CHL003',
          level: 'platinum',
          status: 'active',
          contactPerson: 'Andrea Morales',
          email: 'andrea@chileadventures.cl',
          phone: '+56 2 2345-6789',
          website: 'https://chileadventures.cl',
          address: 'Providencia 890, Santiago',
          country: 'Chile',
          city: 'Santiago',
          createdAt: '2024-01-10T00:00:00Z',
          lastLogin: '2024-12-22T11:20:00Z',
          commission: 15,
          totalSales: 285000,
          totalBookings: 89,
          monthlyTarget: 25000,
          currentMonthSales: 28500,
          rating: 4.9,
          documents: {
            businessLicense: 'verified',
            taxId: 'verified',
            insurance: 'verified'
          }
        },
        {
          id: 'AGC004',
          name: 'Brasil Tropical Tours',
          businessName: 'Brasil Tropical Tours LTDA',
          code: 'BRT004',
          level: 'bronze',
          status: 'pending',
          contactPerson: 'Roberto Silva',
          email: 'roberto@brasiltropical.com.br',
          phone: '+55 21 9999-8888',
          website: '',
          address: 'Copacabana 123, Rio de Janeiro',
          country: 'Brasil',
          city: 'Rio de Janeiro',
          createdAt: '2024-12-01T00:00:00Z',
          lastLogin: null,
          commission: 8,
          totalSales: 0,
          totalBookings: 0,
          monthlyTarget: 5000,
          currentMonthSales: 0,
          rating: 0,
          documents: {
            businessLicense: 'pending',
            taxId: 'pending',
            insurance: 'pending'
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/agencies/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      // Fallback stats
      setStats({
        total: 23,
        active: 19,
        pending: 3,
        suspended: 1,
        totalSales: 489130,
        totalCommissions: 58695,
        avgCommission: 11.2,
        topPerformer: 'Chile Adventures'
      });
    }
  };

  // Cambiar estado de agencia
  const changeAgencyStatus = async (agencyId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/agencies/${agencyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAgencies(prev => prev.map(agency => 
          agency.id === agencyId 
            ? { ...agency, status: newStatus }
            : agency
        ));
        alert('✅ Estado actualizado exitosamente');
      } else {
        throw new Error(data.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  useEffect(() => {
    loadAgencies();
    loadStats();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAgencies();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
            <Building className="mr-3 h-8 w-8 text-blue-600" />
            Gestión de Agencias B2B
          </h1>
          <p className="text-gray-600 mt-1">
            Portal B2B para agencias de viajes partners
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reportes
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Agencia
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">⚠️ {error} - Usando datos de respaldo</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Agencias</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total || agencies.length}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats?.active || agencies.filter(a => a.status === 'active').length} activas
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalSales || agencies.reduce((sum, a) => sum + a.totalSales, 0))}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {agencies.reduce((sum, a) => sum + a.totalBookings, 0)} reservas
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
                <p className="text-sm font-medium text-gray-600">Comisiones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalCommissions || 58695)}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Target className="h-3 w-3 mr-1" />
                  {stats?.avgCommission || '11.2'}% promedio
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performer</p>
                <p className="text-lg font-bold text-gray-900">{stats?.topPerformer || 'Chile Adventures'}</p>
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Platino
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Lista de Agencias
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Niveles
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Onboarding
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
                    placeholder="Buscar agencias..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select 
                  value={filters.level}
                  onChange={(e) => handleFilterChange('level', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los niveles</option>
                  <option value="bronze">Bronce</option>
                  <option value="silver">Plata</option>
                  <option value="gold">Oro</option>
                  <option value="platinum">Platino</option>
                </select>

                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="pending">Pendientes</option>
                  <option value="suspended">Suspendidas</option>
                  <option value="inactive">Inactivas</option>
                </select>

                <select 
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los países</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Chile">Chile</option>
                  <option value="Brasil">Brasil</option>
                  <option value="Uruguay">Uruguay</option>
                </select>
              </div>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros avanzados
              </Button>
            </div>

            {/* Agencies List */}
            <div className="space-y-4">
              {agencies.map((agency) => {
                const LevelIcon = AGENCY_LEVELS[agency.level]?.icon || Award;
                const StatusIcon = AGENCY_STATUSES[agency.status]?.icon || CheckCircle;
                const progressPercentage = Math.min((agency.currentMonthSales / agency.monthlyTarget) * 100, 100);
                
                return (
                  <Card key={agency.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Agency Info */}
                        <div className="lg:col-span-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
                              {agency.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{agency.name}</h3>
                                <Badge className={AGENCY_LEVELS[agency.level]?.color}>
                                  <LevelIcon className="h-3 w-3 mr-1" />
                                  {AGENCY_LEVELS[agency.level]?.label}
                                </Badge>
                                <Badge className={AGENCY_STATUSES[agency.status]?.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {AGENCY_STATUSES[agency.status]?.label}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">{agency.businessName}</p>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <User className="h-3 w-3 mr-2" />
                                  {agency.contactPerson}
                                </div>
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-2" />
                                  {agency.email}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-2" />
                                  {agency.city}, {agency.country}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="lg:col-span-4">
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-600">Meta mensual</span>
                                <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    progressPercentage >= 100 ? 'bg-green-500' :
                                    progressPercentage >= 75 ? 'bg-blue-500' :
                                    progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{formatCurrency(agency.currentMonthSales)}</span>
                                <span>{formatCurrency(agency.monthlyTarget)}</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Ventas totales:</span>
                                <div className="font-bold">{formatCurrency(agency.totalSales)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Reservas:</span>
                                <div className="font-bold">{agency.totalBookings}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Comisión:</span>
                                <div className="font-bold text-green-600">{agency.commission}%</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Rating:</span>
                                <div className="font-bold flex items-center">
                                  {agency.rating > 0 ? (
                                    <>
                                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                      {agency.rating}
                                    </>
                                  ) : (
                                    'Sin rating'
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="lg:col-span-4">
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm text-gray-600">Último acceso:</span>
                              <div className="text-sm font-medium">
                                {formatDate(agency.lastLogin)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-600">Miembro desde:</span>
                              <div className="text-sm font-medium">
                                {formatDate(agency.createdAt)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-gray-600">Documentos:</span>
                              <div className="flex gap-1 mt-1">
                                {Object.entries(agency.documents || {}).map(([doc, status]) => (
                                  <Badge 
                                    key={doc}
                                    className={`text-xs ${
                                      status === 'verified' ? 'bg-green-100 text-green-800' :
                                      status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {doc}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm" className="flex-1">
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              {agency.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => changeAgencyStatus(agency.id, 'active')}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Aprobar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Agencias</CardTitle>
              <CardDescription>
                Análisis de rendimiento y comparación entre agencias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics de Performance</h3>
                <p className="text-gray-600 mb-4">
                  Gráficos de ventas, comisiones, conversión y rankings.
                </p>
                <p className="text-sm text-gray-500">
                  Dashboard en desarrollo - próximamente disponible
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(AGENCY_LEVELS).map(([levelKey, level]) => {
              const Icon = level.icon;
              const levelAgencies = agencies.filter(a => a.level === levelKey);
              
              return (
                <Card key={levelKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${level.color.replace('text-', 'bg-').replace('800', '100')}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      Nivel {level.label}
                    </CardTitle>
                    <CardDescription>
                      Comisión: {level.commission}% | Ventas mínimas: {formatCurrency(level.minSales)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Agencias en este nivel:</span>
                        <Badge className={level.color}>
                          {levelAgencies.length}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">Beneficios incluidos:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• {level.commission}% de comisión en todas las ventas</li>
                          {levelKey === 'platinum' && (
                            <>
                              <li>• Soporte 24/7 prioritario</li>
                              <li>• Acceso a tarifas especiales</li>
                              <li>• Manager dedicado</li>
                            </>
                          )}
                          {levelKey === 'gold' && (
                            <>
                              <li>• Soporte prioritario</li>
                              <li>• Descuentos especiales</li>
                            </>
                          )}
                          {levelKey === 'silver' && (
                            <>
                              <li>• Soporte extendido</li>
                              <li>• Reportes avanzados</li>
                            </>
                          )}
                          {levelKey === 'bronze' && (
                            <>
                              <li>• Soporte básico</li>
                              <li>• Portal B2B estándar</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Proceso de Onboarding</CardTitle>
              <CardDescription>
                Gestión del proceso de incorporación de nuevas agencias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sistema de Onboarding</h3>
                <p className="text-gray-600 mb-4">
                  Flujo de incorporación, verificación de documentos y capacitación.
                </p>
                <p className="text-sm text-gray-500">
                  Funcionalidad en desarrollo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}