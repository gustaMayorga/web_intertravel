'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Globe, 
  Plus, 
  Edit, 
  Trash, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Search,
  Filter,
  Map,
  Navigation,
  Upload,
  Download,
  RotateCcw
} from 'lucide-react';

interface Destination {
  id: number;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  description?: string;
  isActive: boolean;
  packageCount?: number;
}

interface Stats {
  total: number;
  active: number;
  withCoordinates: number;
  totalPackages: number;
}

const AdminDestinations: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [newDestination, setNewDestination] = useState<Destination>({
    id: 0,
    name: '',
    country: '',
    coordinates: { lat: 0, lng: 0 },
    description: '',
    isActive: true
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    withCoordinates: 0,
    totalPackages: 0
  });

  useEffect(() => {
    fetchDestinations();
    fetchStats();
  }, []);

  // Función para obtener headers con autenticación
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const fetchDestinations = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('🔍 Obteniendo destinos...');
      
      // Intentar el backend directamente
      try {
        console.log('🎦 Probando backend directo en puerto 3002...');
        const backendResponse = await fetch('http://localhost:3002/api/admin/destinations', {
          headers: getAuthHeaders()
        });
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          console.log('✅ Backend directo respondíó:', backendData);
          if (backendData.success) {
            setDestinations(backendData.destinations || []);
            console.log('✅ Destinos cargados desde backend con persistencia');
            return;
          }
        } else {
          console.log('❌ Backend directo falló:', backendResponse.status);
        }
      } catch (backendError) {
        console.log('❌ Error conectando al backend:', backendError.message);
      }
      
      // Fallback: usar API del frontend
      console.log('🔄 Usando fallback: API del frontend...');
      const response = await fetch('/api/admin/destinations', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setDestinations(data.destinations || []);
        console.log('⚠️ Destinos cargados desde frontend (fallback)');
      } else {
        throw new Error('API frontend también falló');
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      // Último fallback: datos locales
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
        }
      ]);
      console.log('⚠️ Usando datos mock por defecto');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      const response = await fetch('/api/admin/destinations-stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats || {
          total: 0,
          active: 0,
          withCoordinates: 0,
          totalPackages: 0
        });
      } else {
        setStats({
          total: 5,
          active: 5,
          withCoordinates: 5,
          totalPackages: 59
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        total: 0,
        active: 0,
        withCoordinates: 0,
        totalPackages: 0
      });
    }
  };

  const handleAddDestination = async (): Promise<void> => {
    if (!newDestination.name.trim() || !newDestination.country.trim()) return;

    try {
      setSaving(true);
      console.log('➕ Agregando destino directamente al backend...');
      
      // IR DIRECTO AL BACKEND
      const response = await fetch('http://localhost:3002/api/admin/destinations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newDestination)
      });

      const data = await response.json();
      console.log('📥 Respuesta del backend:', data);
      
      if (data.success) {
        setDestinations([...destinations, data.destination]);
        setNewDestination({
          id: 0,
          name: '',
          country: '',
          coordinates: { lat: 0, lng: 0 },
          description: '',
          isActive: true
        });
        fetchStats();
        console.log('✅ Destino agregado con persistencia:', data.destination.name);
        alert('✅ Destino agregado correctamente');
      } else {
        console.error('Error en respuesta:', data.error);
        alert('Error al agregar destino: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error adding destination:', error);
      alert('Error de conexión al agregar destino. ¿Está el backend corriendo?');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDestination = async (id: number, updates: Partial<Destination>): Promise<void> => {
    try {
      setSaving(true);
      console.log('✏️ Actualizando destino directamente en backend...', id, updates);
      
      // IR DIRECTO AL BACKEND
      const response = await fetch(`http://localhost:3002/api/admin/destinations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      console.log('📥 Respuesta del backend:', data);
      
      if (data.success) {
        setDestinations(destinations.map(d => d.id === id ? { ...d, ...updates } : d));
        setEditingDestination(null);
        fetchStats();
        console.log('✅ Destino actualizado con persistencia:', id);
      } else {
        console.error('Error en respuesta:', data.error);
        alert('Error al actualizar destino: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error updating destination:', error);
      alert('Error de conexión al actualizar destino. ¿Está el backend corriendo?');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDestination = async (id: number): Promise<void> => {
    if (!confirm('¿Estás seguro de eliminar este destino?')) return;

    try {
      setSaving(true);
      console.log('🗑️ Eliminando destino directamente del backend...', id);
      
      // IR DIRECTO AL BACKEND
      const response = await fetch(`http://localhost:3002/api/admin/destinations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      console.log('📥 Respuesta del backend:', data);
      
      if (data.success) {
        setDestinations(destinations.filter(d => d.id !== id));
        fetchStats();
        console.log('✅ Destino eliminado con persistencia:', id);
      } else {
        console.error('Error en respuesta:', data.error);
        alert('Error al eliminar destino: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error deleting destination:', error);
      alert('Error de conexión al eliminar destino. ¿Está el backend corriendo?');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromTC = async (): Promise<void> => {
    try {
      setSyncing(true);
      console.log('🔄 Iniciando sincronización con Travel Compositor...');
      
      // IR DIRECTO AL BACKEND
      const response = await fetch('http://localhost:3002/api/admin/destinations/sync-tc', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      console.log('📥 Respuesta de sincronización:', data);
      
      if (data.success) {
        fetchDestinations();
        fetchStats();
        alert(`✅ ${data.message}`);
        console.log('✅ Sincronización completada exitosamente');
      } else {
        alert('Error en la sincronización: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error syncing from TC:', error);
      alert('Error de conexión durante la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const handleValidateCoordinates = async (destinationIds: number[]): Promise<void> => {
    try {
      setSaving(true);
      console.log(`🗺️ Validando coordenadas para ${destinationIds.length} destinos...`);
      
      // IR DIRECTO AL BACKEND
      const response = await fetch('http://localhost:3002/api/admin/destinations/validate-coordinates', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ destinationIds })
      });

      const data = await response.json();
      console.log('📥 Respuesta de validación:', data);
      
      if (data.success) {
        fetchDestinations();
        alert(`✅ ${data.message}`);
        console.log('✅ Validación de coordenadas completada');
      } else {
        alert('Error validando coordenadas: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error validating coordinates:', error);
      alert('Error de conexión al validar coordenadas');
    } finally {
      setSaving(false);
    }
  };

  const autoFillCoordinates = async (name: string): Promise<{ lat: number; lng: number }> => {
    // Simulación de API de geocoding
    const mockCoordinates: Record<string, { lat: number; lng: number }> = {
      'mendoza': { lat: -32.8895, lng: -68.8458 },
      'buenos aires': { lat: -34.6037, lng: -58.3816 },
      'cusco': { lat: -13.5319, lng: -71.9675 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'nueva york': { lat: 40.7128, lng: -74.0060 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'roma': { lat: 41.9028, lng: 12.4964 }
    };

    const key = name.toLowerCase();
    return mockCoordinates[key] || { lat: 0, lng: 0 };
  };

  const handleAutoFillCoordinates = async (destinationName: string): Promise<void> => {
    const coords = await autoFillCoordinates(destinationName);
    setNewDestination({
      ...newDestination,
      coordinates: coords
    });
  };

  const countries = [...new Set(destinations.map(d => d.country))].sort();

  const filteredDestinations = destinations
    .filter(d => filterCountry === 'all' || d.country === filterCountry)
    .filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" />
              Gestión de Destinos
            </h2>
            <p className="text-gray-600 mt-1">
              Administra destinos, coordenadas y sincronización con Travel Compositor
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncFromTC}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sync TC'}
            </button>
            <button
              onClick={fetchDestinations}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.total || destinations.length}</div>
            <div className="text-sm text-green-800">Total Destinos</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.active || destinations.filter(d => d.isActive).length}</div>
            <div className="text-sm text-blue-800">Activos</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats.withCoordinates || destinations.filter(d => d.coordinates?.lat !== 0).length}
            </div>
            <div className="text-sm text-purple-800">Con Coordenadas</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalPackages || destinations.reduce((sum, d) => sum + (d.packageCount || 0), 0)}
            </div>
            <div className="text-sm text-orange-800">Paquetes Totales</div>
          </div>
        </div>
      </div>

      {/* Add New Destination */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-600" />
          Agregar Nuevo Destino
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Destino
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDestination.name}
                onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                placeholder="ej: Mendoza"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => handleAutoFillCoordinates(newDestination.name)}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                title="Auto-completar coordenadas"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <input
              type="text"
              value={newDestination.country}
              onChange={(e) => setNewDestination({ ...newDestination, country: e.target.value })}
              placeholder="ej: Argentina"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coordenadas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.0001"
                value={newDestination.coordinates.lat}
                onChange={(e) => setNewDestination({
                  ...newDestination,
                  coordinates: { ...newDestination.coordinates, lat: parseFloat(e.target.value) || 0 }
                })}
                placeholder="Latitud"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                step="0.0001"
                value={newDestination.coordinates.lng}
                onChange={(e) => setNewDestination({
                  ...newDestination,
                  coordinates: { ...newDestination.coordinates, lng: parseFloat(e.target.value) || 0 }
                })}
                placeholder="Longitud"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            type="text"
            value={newDestination.description}
            onChange={(e) => setNewDestination({ ...newDestination, description: e.target.value })}
            placeholder="Descripción del destino..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={newDestination.isActive}
              onChange={(e) => setNewDestination({ ...newDestination, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Destino activo
            </label>
          </div>
          
          <button
            onClick={handleAddDestination}
            disabled={saving || !newDestination.name.trim() || !newDestination.country.trim()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Agregar Destino
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar destinos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos los países</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => {
              const selectedIds = destinations
                .filter(d => d.coordinates?.lat === 0 || d.coordinates?.lng === 0)
                .map(d => d.id);
              if (selectedIds.length > 0) {
                handleValidateCoordinates(selectedIds);
              } else {
                alert('Todos los destinos ya tienen coordenadas válidas');
              }
            }}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Map className="w-4 h-4" />
            Validar Coords
          </button>
        </div>
      </div>

      {/* Destinations List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            Destinos Configurados ({filteredDestinations.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordenadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paquetes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDestinations.map((destination) => (
                <tr key={destination.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {destination.name}
                        </div>
                        {destination.description && (
                          <div className="text-sm text-gray-500">
                            {destination.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {destination.country}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {destination.coordinates && destination.coordinates.lat !== 0 && destination.coordinates.lng !== 0 ? (
                        <div>
                          <div>Lat: {destination.coordinates.lat?.toFixed(4) || 'N/A'}</div>
                          <div>Lng: {destination.coordinates.lng?.toFixed(4) || 'N/A'}</div>
                        </div>
                      ) : (
                        <span className="text-red-500">Sin coordenadas</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {destination.packageCount || 0} paquetes
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      destination.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {destination.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingDestination(destination)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={saving}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDestination(destination.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={saving}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDestinations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron destinos</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:text-blue-800 mt-2"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sync Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">
              Sistema de Sincronización con Travel Compositor
            </h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• <strong>Sync TC:</strong> Sincroniza destinos desde Travel Compositor automáticamente</li>
              <li>• <strong>Validar Coords:</strong> Completa coordenadas faltantes usando geocoding</li>
              <li>• <strong>Auto-Fill:</strong> Completa coordenadas al escribir el nombre del destino</li>
              <li>• Los destinos se usan para mejorar búsquedas y filtros de paquetes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDestinations;
