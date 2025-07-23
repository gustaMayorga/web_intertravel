'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, Plus, Edit, Trash2, Eye, Star, MapPin, Calendar, DollarSign,
  Users, Camera, Settings, BarChart3, TrendingUp, Filter, Search, Download,
  Upload, CheckCircle, Clock, AlertCircle, Globe, Award, Target, Save, X, Loader2
} from 'lucide-react';

// Importar estilos responsive
import '../../../styles/admin-responsive.css';

// ===============================================
// FORMULARIO CRUD RESPONSIVE DE PAQUETES
// ===============================================
const PackageForm = ({ package: pkg = null, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: pkg?.title || '',
    destination: pkg?.destination || '',
    duration: pkg?.duration || 7,
    price: pkg?.price || 0,
    original_price: pkg?.original_price || '',
    description: pkg?.description || '',
    category: pkg?.category || 'cultural',
    status: pkg?.status || 'draft',
    featured: pkg?.featured || false,
    max_people: pkg?.max_people || 20,
    min_age: pkg?.min_age || 0,
    difficulty: pkg?.difficulty || 'easy',
    includes: pkg?.includes || [],
    excludes: pkg?.excludes || [],
    keywords: pkg?.keywords ? (Array.isArray(pkg.keywords) ? pkg.keywords.join(', ') : pkg.keywords) : '',
    seo_title: pkg?.seo_title || '',
    seo_description: pkg?.seo_description || ''
  });

  const [saving, setSaving] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayAdd = (field, value) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value.trim()]
      }));
    }
  };

  const handleArrayRemove = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.destination || !formData.price) {
      alert('Título, destino y precio son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const packageData = {
        ...formData,
        keywords: typeof formData.keywords === 'string' ? formData.keywords.split(',').map(k => k.trim()) : formData.keywords,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        duration: parseInt(formData.duration),
        max_people: parseInt(formData.max_people),
        min_age: parseInt(formData.min_age)
      };

      const url = isEditing ? `/api/admin/packages/${pkg.id}` : '/api/admin/packages';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      });

      const result = await response.json();

      if (result.success) {
        await onSave(result.data);
        alert(`✅ Paquete ${isEditing ? 'actualizado' : 'creado'} exitosamente`);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Error saving package:', error);
      alert('❌ Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mobile-padding space-y-6" data-admin="true">
      {/* Header Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Package className="mr-3 h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            {isEditing ? 'Editar Paquete' : 'Nuevo Paquete'}
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {isEditing ? 'Modifica los detalles del paquete' : 'Crea un nuevo paquete turístico'}
          </p>
        </div>
        
        <div className="button-group-responsive">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="touch-target">
            <X className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Cancelar</span>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 touch-target"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">
              {saving ? 'Guardando...' : 'Guardar Paquete'}
            </span>
          </Button>
        </div>
      </div>

      {/* Formulario Principal Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Información General</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Datos básicos del paquete turístico
          </CardDescription>
        </CardHeader>
        <CardContent className="form-fields-responsive">
          {/* Título */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">Título del Paquete *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ej: Perú Mágico - Machu Picchu y Cusco"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
            />
          </div>

          {/* Destino */}
          <div>
            <label className="block text-sm font-medium mb-2">Destino Principal *</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              placeholder="Ej: Cusco, Perú"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium mb-2">Precio (USD) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
              min="0"
              step="0.01"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
            />
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium mb-2">Duración (días)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
              min="1"
              max="30"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium mb-2">Categoría</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
            >
              <option value="cultural">Cultural</option>
              <option value="adventure">Aventura</option>
              <option value="relax">Relax</option>
              <option value="luxury">Lujo</option>
              <option value="city">Ciudad</option>
              <option value="nature">Naturaleza</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="archived">Archivado</option>
            </select>
          </div>

          {/* Descripción - Full Width */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe las experiencias únicas que ofrece este paquete..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
            />
          </div>

          {/* Destacado */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
                className="w-5 h-5 text-blue-600 touch-target"
              />
              <label htmlFor="featured" className="text-sm font-medium">
                Marcar como destacado
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servicios Incluidos/Excluidos - Responsive */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Qué Incluye</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.includes.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 p-2 bg-green-50 rounded text-sm">{item}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleArrayRemove('includes', index)}
                    className="touch-target"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ej: Alojamiento 4 estrellas"
                  className="flex-1 p-2 border rounded touch-target"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleArrayAdd('includes', e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    const input = e.target.closest('.flex').querySelector('input');
                    handleArrayAdd('includes', input.value);
                    input.value = '';
                  }}
                  className="touch-target"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No Incluye</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.excludes.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 p-2 bg-red-50 rounded text-sm">{item}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleArrayRemove('excludes', index)}
                    className="touch-target"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ej: Vuelos internacionales"
                  className="flex-1 p-2 border rounded touch-target"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleArrayAdd('excludes', e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    const input = e.target.closest('.flex').querySelector('input');
                    handleArrayAdd('excludes', input.value);
                    input.value = '';
                  }}
                  className="touch-target"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ===============================================
// COMPONENTE PRINCIPAL - GESTIÓN DE PAQUETES RESPONSIVE
// ===============================================
export default function PackagesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all'
  });

  // ===============================================
  // CARGAR PAQUETES DESDE API REAL
  // ===============================================
  const loadPackages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50',
        search: filters.search,
        category: filters.category === 'all' ? '' : filters.category,
        status: filters.status === 'all' ? '' : filters.status
      });
      
      const response = await fetch(`/api/admin/packages?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data || []);
      } else {
        throw new Error(data.message || 'Error al cargar paquetes');
      }
    } catch (error) {
      console.error('❌ Error cargando paquetes:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/packages/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
    }
  };

  const deletePackage = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este paquete? Esta acción no se puede deshacer.')) return;
    
    try {
      const response = await fetch(`/api/admin/packages/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPackages(prev => prev.filter(pkg => pkg.id !== id));
        alert('🗑️ Paquete eliminado exitosamente');
        await loadStats();
      } else {
        throw new Error(data.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('❌ Error eliminando paquete:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const handleSave = async (packageData) => {
    try {
      if (editingPackage) {
        setPackages(prev => prev.map(p => p.id === packageData.id ? packageData : p));
      } else {
        setPackages(prev => [packageData, ...prev]);
      }
      
      setShowForm(false);
      setEditingPackage(null);
      await loadStats();
      
    } catch (error) {
      console.error('Error handling save:', error);
    }
  };

  useEffect(() => {
    loadPackages();
    loadStats();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPackages();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // ===============================================
  // MOSTRAR FORMULARIO SI ESTÁ ACTIVO
  // ===============================================
  if (showForm) {
    return (
      <PackageForm
        package={editingPackage}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingPackage(null);
        }}
        isEditing={!!editingPackage}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 mobile-padding" data-admin="true">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="stats-responsive">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded loading-skeleton"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mobile-padding space-y-6" data-admin="true">
      {/* Header Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Package className="mr-3 h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Gestión de Paquetes
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            CRUD completo conectado a base de datos real
          </p>
        </div>
        
        <div className="button-group-responsive">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              loadPackages();
              loadStats();
            }}
            className="touch-target"
          >
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Recargar</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 touch-target"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Paquete</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">⚠️ {error} - API con fallback habilitado</p>
        </div>
      )}

      {/* Stats Cards Responsive */}
      <div className="stats-responsive">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Paquetes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats?.total || packages.length}</p>
                <p className="text-xs sm:text-sm text-blue-600 flex items-center mt-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats?.active || packages.filter(p => p.status === 'active').length} activos
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  ${(stats?.totalRevenue || packages.reduce((sum, p) => sum + (p.revenue || 0), 0)).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats?.totalBookings || packages.reduce((sum, p) => sum + (p.bookings_count || 0), 0)} reservas
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Rating Promedio</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {(stats?.avgRating || 4.7).toFixed(1)}
                </p>
                <div className="flex items-center mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star 
                      key={i} 
                      className={`h-3 w-3 ${
                        i < Math.floor(stats?.avgRating || 4.7) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <Star className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Destacados</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats?.featured || packages.filter(p => p.featured).length}
                </p>
                <p className="text-xs sm:text-sm text-purple-600 flex items-center mt-1">
                  <Award className="h-3 w-3 mr-1" />
                  {stats?.draft || packages.filter(p => p.status === 'draft').length} borradores
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 rounded-full">
                <Award className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Responsive */}
      <div className="filters-responsive">
        <div className="relative flex-1 sm:flex-none sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paquetes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
          />
        </div>
        
        <select 
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="draft">Borradores</option>
          <option value="archived">Archivados</option>
        </select>

        <select 
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 touch-target"
        >
          <option value="all">Todas las categorías</option>
          <option value="adventure">Aventura</option>
          <option value="cultural">Cultural</option>
          <option value="luxury">Lujo</option>
          <option value="relax">Relax</option>
          <option value="city">Ciudad</option>
          <option value="nature">Naturaleza</option>
        </select>

        <Button size="sm" onClick={() => setShowForm(true)} className="touch-target sm:w-auto">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nuevo Paquete</span>
        </Button>
      </div>

      {/* Packages Grid Responsive */}
      <div className="card-list-responsive">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <Globe className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-medium px-2">{pkg.destination}</p>
                </div>
              </div>
              
              <div className="absolute top-2 right-2 flex flex-col sm:flex-row gap-1">
                {pkg.featured && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Destacado</span>
                  </Badge>
                )}
                <Badge className={pkg.status === 'active' ? 'bg-green-100 text-green-800 text-xs' : 'bg-yellow-100 text-yellow-800 text-xs'}>
                  {pkg.status === 'active' ? 'Activo' : 'Borrador'}
                </Badge>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 leading-tight text-sm sm:text-base">
                    {pkg.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-600">{pkg.destination}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-600">Duración:</span>
                    <div className="font-medium flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {pkg.duration} días
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Precio:</span>
                    <div className="font-bold text-blue-600">
                      ${pkg.price?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Description - Hidden on mobile */}
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {pkg.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setEditingPackage(pkg);
                        setShowForm(true);
                      }}
                      className="touch-target"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="touch-target">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 touch-target"
                    onClick={() => deletePackage(pkg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {packages.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <Package className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay paquetes</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Comienza creando tu primer paquete turístico.
            </p>
            <Button onClick={() => setShowForm(true)} className="touch-target">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Paquete
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <div className="text-xs text-gray-500 text-center">
        🔗 API: {error ? '❌ Error' : '✅ Conectado'} | 
        📦 Total: {packages.length} | 
        🕒 {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}