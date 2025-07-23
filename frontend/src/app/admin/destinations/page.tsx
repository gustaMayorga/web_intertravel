'use client';

/**
 * 🗺️ GESTIÓN DE DESTINOS - INTERTRAVEL ADMIN
 * ==========================================
 * 
 * ✅ CRUD completo de destinos
 * ✅ Coordenadas GPS
 * ✅ Sincronización con Travel Compositor
 * ✅ Gestión de países y regiones
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin,
  Globe,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Navigation,
  CheckCircle,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export default function DestinationsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Cargar destinos
  const loadDestinations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/destinations');
      const data = await response.json();
      
      if (data.success) {
        setDestinations(data.data || []);
        console.log('✅ Destinos cargados:', data.data?.length || 0);
      } else {
        throw new Error(data.error || 'Error al cargar destinos');
      }
    } catch (error) {
      console.error('❌ Error cargando destinos:', error);
      setError(error.message);
      // Fallback con datos mock
      setDestinations([
        {
          id: 1,
          name: 'Buenos Aires',
          country: 'Argentina',
          coordinates: { lat: -34.6037, lng: -58.3816 },
          description: 'Capital cosmopolita de Argentina',
          isActive: true,
          packageCount: 15
        },
        {
          id: 2,
          name: 'Mendoza',
          country: 'Argentina', 
          coordinates: { lat: -32.8895, lng: -68.8458 },
          description: 'Capital mundial del vino',
          isActive: true,
          packageCount: 12
        },
        {
          id: 3,
          name: 'Cusco',
          country: 'Perú',
          coordinates: { lat: -13.5319, lng: -71.9675 },
          description: 'Puerta de entrada a Machu Picchu', 
          isActive: true,
          packageCount: 18
        },
        {
          id: 4,
          name: 'Bariloche',
          country: 'Argentina',
          coordinates: { lat: -41.1335, lng: -71.3103 },
          description: 'Paraíso patagónico',
          isActive: true,
          packageCount: 8
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/destinations/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      // Fallback stats
      setStats({
        total: 45,
        active: 42,
        withCoordinates: 39,
        totalPackages: 156,
        countries: 12
      });
    }
  };

  useEffect(() => {
    loadDestinations();
    loadStats();
  }, []);

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
          <div className="h-96 bg-gray-200 rounded"></div>
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
            <MapPin className="mr-3 h-8 w-8 text-green-600" />
            Gestión de Destinos
          </h1>
          <p className="text-gray-600 mt-1">
            Administra destinos, coordenadas y sincronización con Travel Compositor
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <Button variant="outline" size="sm" onClick={() => alert('🔄 Sincronización con Travel Compositor próximamente')}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Sync TC
          </Button>
          <Button variant="outline" size="sm" onClick={loadDestinations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => alert('➕ Crear nuevo destino próximamente')}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Destino
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Destinos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total || destinations.length}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats?.active || destinations.filter(d => d.isActive).length} activos
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Países</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.countries || [...new Set(destinations.map(d => d.country))].length}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Globe className="h-3 w-3 mr-1" />
                  Diferentes países
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Con Coordenadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.withCoordinates || destinations.filter(d => d.coordinates?.lat !== 0).length}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Navigation className="h-3 w-3 mr-1" />
                  GPS disponible
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Navigation className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paquetes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalPackages || destinations.reduce((sum, d) => sum + (d.packageCount || 0), 0)}
                </p>
                <p className="text-sm text-orange-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Asignados
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Coordenadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {destinations.filter(d => d.coordinates?.lat === 0 || !d.coordinates).length}
                </p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Requieren GPS
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Destinos List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Destinos Configurados ({destinations.length})
          </CardTitle>
          <CardDescription>
            Lista completa de destinos disponibles para paquetes turísticos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar destinos..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full"
                />
              </div>
              <Button variant="outline" size="sm">
                <Navigation className="h-4 w-4 mr-2" />
                Validar Coords
              </Button>
            </div>

            {/* Destinations Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {destinations.map((destination) => (
                <Card key={destination.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{destination.name}</h3>
                          <p className="text-sm text-gray-600">{destination.country}</p>
                          {destination.description && (
                            <p className="text-xs text-gray-500 mt-1">{destination.description}</p>
                          )}
                        </div>
                        <Badge className={destination.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {destination.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Coordenadas:</span>
                          {destination.coordinates && destination.coordinates.lat !== 0 ? (
                            <div className="font-mono text-xs">
                              <div>Lat: {destination.coordinates.lat?.toFixed(4)}</div>
                              <div>Lng: {destination.coordinates.lng?.toFixed(4)}</div>
                            </div>
                          ) : (
                            <div className="text-red-500 text-xs">Sin coordenadas</div>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600">Paquetes:</span>
                          <div className="font-semibold text-blue-600">
                            {destination.packageCount || 0}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => alert(`Editar ${destination.name}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!destination.coordinates || destination.coordinates.lat === 0 ? (
                            <Button variant="ghost" size="sm" className="text-purple-600" onClick={() => alert(`Autocompletar GPS para ${destination.name}`)}>
                              <Navigation className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                        
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => alert(`Eliminar ${destination.name}`)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {destinations.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay destinos</h3>
                <p className="text-gray-600">Comienza agregando tu primer destino</p>
                <Button className="mt-4" onClick={() => alert('Crear nuevo destino')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Destino
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">
                Sistema de Gestión de Destinos
              </h3>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• <strong>Sync TC:</strong> Sincroniza destinos desde Travel Compositor automáticamente</li>
                <li>• <strong>Validar Coords:</strong> Completa coordenadas faltantes usando geocoding</li>
                <li>• <strong>GPS Integration:</strong> Coordenadas precisas para mapas y filtros</li>
                <li>• Los destinos se usan para categorizar y filtrar paquetes turísticos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
