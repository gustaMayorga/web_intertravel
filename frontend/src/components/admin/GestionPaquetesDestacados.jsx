import React, { useState, useEffect } from 'react';
import { Star, Package, Edit3, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

const GestionPaquetesDestacados = () => {
  const [packages, setPackages] = useState([]);
  const [featuredPackages, setFeaturedPackages] = useState([]);
  const [landingConfig, setLandingConfig] = useState({
    featured_title: 'Nuestros Mejores Destinos',
    featured_subtitle: 'Experiencias únicas que no puedes perderte'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingConfig, setEditingConfig] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar todos los paquetes
      const packagesResponse = await fetch('/api/admin/packages');
      if (packagesResponse.ok) {
        const packagesData = await packagesResponse.json();
        setPackages(packagesData.packages || []);
      }

      // Cargar paquetes destacados actuales
      const featuredResponse = await fetch('/api/admin/packages/featured');
      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json();
        setFeaturedPackages(featuredData.packages || []);
        setLandingConfig(featuredData.config || landingConfig);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error cargando datos' });
    }
    setLoading(false);
  };

  const handlePackageToggle = (packageId) => {
    if (featuredPackages.find(p => p.id === packageId)) {
      // Quitar de destacados
      setFeaturedPackages(prev => prev.filter(p => p.id !== packageId));
    } else {
      // Agregar a destacados (máximo 3)
      if (featuredPackages.length < 3) {
        const packageToAdd = packages.find(p => p.id === packageId);
        if (packageToAdd) {
          setFeaturedPackages(prev => [...prev, packageToAdd]);
        }
      } else {
        setMessage({ type: 'warning', text: 'Máximo 3 paquetes destacados permitidos' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const featuredIds = featuredPackages.map(p => p.id);
      
      const response = await fetch('/api/admin/packages/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featuredPackages: featuredIds,
          landingConfig
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Paquetes destacados actualizados exitosamente' });
        await loadData(); // Recargar datos
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Error guardando cambios' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    }
    setSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Cargando paquetes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Paquetes Destacados
        </h1>
        <p className="text-gray-600">
          Selecciona hasta 3 paquetes para mostrar en la página principal
        </p>
      </div>

      {/* Mensajes */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-yellow-50 border border-yellow-200 text-yellow-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> :
           <AlertCircle className="h-5 w-5 mr-2" />}
          {message.text}
        </div>
      )}

      {/* Configuración de Landing */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de Sección
          </h2>
          <button
            onClick={() => setEditingConfig(!editingConfig)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            {editingConfig ? <X className="h-4 w-4 mr-1" /> : <Edit3 className="h-4 w-4 mr-1" />}
            {editingConfig ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {editingConfig ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título Principal
              </label>
              <input
                type="text"
                value={landingConfig.featured_title}
                onChange={(e) => setLandingConfig(prev => ({ 
                  ...prev, 
                  featured_title: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtítulo
              </label>
              <input
                type="text"
                value={landingConfig.featured_subtitle}
                onChange={(e) => setLandingConfig(prev => ({ 
                  ...prev, 
                  featured_subtitle: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {landingConfig.featured_title}
            </h3>
            <p className="text-gray-600">
              {landingConfig.featured_subtitle}
            </p>
          </div>
        )}
      </div>

      {/* Paquetes Destacados Actuales */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="h-5 w-5 text-yellow-500 mr-2" />
          Paquetes Destacados Seleccionados ({featuredPackages.length}/3)
        </h2>
        
        {featuredPackages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay paquetes destacados seleccionados
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredPackages.map((pkg) => (
              <div key={pkg.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {pkg.title}
                  </h3>
                  <button
                    onClick={() => handlePackageToggle(pkg.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {pkg.destination_name}
                </p>
                <p className="text-lg font-bold text-green-600">
                  ${pkg.price_amount} {pkg.price_currency}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Todos los Paquetes */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="h-5 w-5 text-blue-500 mr-2" />
          Todos los Paquetes Disponibles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const isFeatured = featuredPackages.find(p => p.id === pkg.id);
            return (
              <div 
                key={pkg.id} 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isFeatured 
                    ? 'border-yellow-400 bg-yellow-50 shadow-md' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
                onClick={() => handlePackageToggle(pkg.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {pkg.title}
                  </h3>
                  {isFeatured && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {pkg.destination_name}
                </p>
                
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-green-600">
                    ${pkg.price_amount} {pkg.price_currency}
                  </p>
                  
                  <button
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      isFeatured
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {isFeatured ? 'Destacado' : 'Seleccionar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center text-lg font-medium"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GestionPaquetesDestacados;
