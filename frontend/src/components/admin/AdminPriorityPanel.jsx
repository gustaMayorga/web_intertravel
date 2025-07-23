'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Plus, 
  Edit, 
  Trash, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Tag,
  Search,
  Filter,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const AdminPriorityPanel = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    priority: 1,
    category: 'destination',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Función para obtener headers con autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token'); // CORREGIDO: admin_token en lugar de auth_token
    console.log('🔑 Token para auth headers:', token ? `presente (${token.substring(0, 20)}...)` : 'ausente');
    console.log('🔑 Token completo para debug:', token);
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
    
    console.log('📤 Headers que se enviarán:', headers);
    return headers;
  };

  const categories = [
    { value: 'destination', label: 'Destinos', color: 'bg-blue-100 text-blue-800' },
    { value: 'transport', label: 'Transporte', color: 'bg-green-100 text-green-800' },
    { value: 'cruise', label: 'Cruceros', color: 'bg-purple-100 text-purple-800' },
    { value: 'agency', label: 'Agencia', color: 'bg-orange-100 text-orange-800' },
    { value: 'category', label: 'Categoría', color: 'bg-pink-100 text-pink-800' },
    { value: 'experience', label: 'Experiencia', color: 'bg-indigo-100 text-indigo-800' }
  ];

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      console.log('🔍 Intentando obtener keywords...');
      
      // Primero intentar el backend directamente
      try {
        console.log('🎯 Probando backend directo en puerto 3002...');
        const backendResponse = await fetch('http://localhost:3002/api/admin/priority-keywords', {
          headers: getAuthHeaders()
        });
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          console.log('✅ Backend directo respondió:', backendData);
          if (backendData.success) {
            setKeywords(backendData.keywords || []);
            console.log('✅ Keywords cargadas desde backend con persistencia');
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
      const response = await fetch('/api/admin/priority-keywords', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setKeywords(data.keywords || []);
        console.log('⚠️ Keywords cargadas desde frontend (sin persistencia)');
      } else {
        // Fallback con datos mock
        setKeywords([
          { id: 1, keyword: 'charter', priority: 1, category: 'transport', active: true, description: 'Vuelos charter prioritarios' },
          { id: 2, keyword: 'perú', priority: 2, category: 'destination', active: true, description: 'Destino Perú prioritario' },
          { id: 3, keyword: 'MSC', priority: 3, category: 'cruise', active: true, description: 'Cruceros MSC prioritarios' },
          { id: 4, keyword: 'intertravel', priority: 1, category: 'agency', active: true, description: 'Paquetes InterTravel' },
          { id: 5, keyword: 'premium', priority: 4, category: 'category', active: true, description: 'Paquetes premium' },
          { id: 6, keyword: 'mendoza', priority: 3, category: 'destination', active: true, description: 'Destino Mendoza' }
        ]);
        console.log('⚠️ Usando datos mock por defecto');
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.keyword.trim()) return;

    try {
      setSaving(true);
      console.log('➕ Agregando keyword directamente al backend...');
      
      // IR DIRECTO AL BACKEND
      const response = await fetch('http://localhost:3002/api/admin/priority-keywords', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newKeyword)
      });

      const data = await response.json();
      console.log('📥 Respuesta del backend:', data);
      
      if (data.success) {
        setKeywords([...keywords, data.keyword]);
        setNewKeyword({ keyword: '', priority: 1, category: 'destination', description: '' });
        console.log('✅ Palabra clave agregada con persistencia:', data.keyword.keyword);
        alert('✅ Palabra clave agregada correctamente');
      } else {
        console.error('Error en respuesta:', data.error);
        alert('Error al agregar palabra clave: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
      alert('Error de conexión al agregar palabra clave. ¿Está el backend corriendo?');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateKeyword = async (id, updates) => {
    try {
      setSaving(true);
      console.log('✏️ Actualizando keyword directamente en backend...', id, updates);
      
      // IR DIRECTO AL BACKEND
      const response = await fetch(`http://localhost:3002/api/admin/priority-keywords/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      console.log('📥 Respuesta del backend:', data);
      
      if (data.success) {
        setKeywords(keywords.map(k => k.id === id ? { ...k, ...updates } : k));
        setEditingKeyword(null);
        console.log('✅ Palabra clave actualizada con persistencia:', id);
      } else {
        console.error('Error en respuesta:', data.error);
        alert('Error al actualizar palabra clave: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error updating keyword:', error);
      alert('Error de conexión al actualizar palabra clave. ¿Está el backend corriendo?');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKeyword = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta palabra clave?')) return;

    try {
      setSaving(true);
      console.log('🗑️ Eliminando keyword directamente del backend...', id);
      
      // IR DIRECTO AL BACKEND
      const response = await fetch(`http://localhost:3002/api/admin/priority-keywords/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      console.log('📥 Respuesta del backend:', data);
      
      if (data.success) {
        setKeywords(keywords.filter(k => k.id !== id));
        console.log('✅ Palabra clave eliminada con persistencia:', id);
      } else {
        console.error('Error en respuesta:', data.error);
        alert('Error al eliminar palabra clave: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      alert('Error de conexión al eliminar palabra clave. ¿Está el backend corriendo?');
    } finally {
      setSaving(false);
    }
  };

  const movePriority = (id, direction) => {
    const keyword = keywords.find(k => k.id === id);
    if (!keyword) return;

    const newPriority = direction === 'up' ? keyword.priority - 1 : keyword.priority + 1;
    if (newPriority < 1) return;

    handleUpdateKeyword(id, { priority: newPriority });
  };

  const createBackup = async () => {
    try {
      setSaving(true);
      const response = await fetch('http://localhost:3002/api/admin/priority-keywords/backup', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Backup creado exitosamente');
        console.log('✅ Backup creado:', data.file);
      } else {
        alert('Error creando backup: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error de conexión al crear backup');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const filteredKeywords = keywords
    .filter(k => filterCategory === 'all' || k.category === filterCategory)
    .filter(k => k.keyword.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 k.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.priority - b.priority);

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
              <Star className="w-6 h-6 text-yellow-500" />
              Gestión de Palabras Clave Prioritarias
            </h2>
            <p className="text-gray-600 mt-1">
              Configura las palabras clave que tendrán prioridad en búsquedas y filtros
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchKeywords}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={createBackup}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Backup
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 priority-stats">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{keywords.length}</div>
            <div className="text-sm text-blue-800">Total Keywords</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {keywords.filter(k => k.active).length}
            </div>
            <div className="text-sm text-green-800">Activas</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {categories.length}
            </div>
            <div className="text-sm text-yellow-800">Categorías</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(...keywords.map(k => k.priority), 0)}
            </div>
            <div className="text-sm text-purple-800">Max Prioridad</div>
          </div>
        </div>
      </div>

      {/* Add New Keyword */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-600" />
          Agregar Nueva Palabra Clave
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 priority-form-grid">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Palabra Clave
            </label>
            <input
              type="text"
              value={newKeyword.keyword}
              onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
              placeholder="ej: mendoza"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <input
              type="number"
              min="1"
              value={newKeyword.priority}
              onChange={(e) => setNewKeyword({ ...newKeyword, priority: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={newKeyword.category}
              onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleAddKeyword}
              disabled={saving || !newKeyword.keyword.trim()}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mobile-touch-btn"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Agregar
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <input
            type="text"
            value={newKeyword.description}
            onChange={(e) => setNewKeyword({ ...newKeyword, description: e.target.value })}
            placeholder="Descripción de la palabra clave..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                placeholder="Buscar palabras clave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Keywords List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            Palabras Clave Configuradas ({filteredKeywords.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full table-responsive">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Palabra Clave
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
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
              {filteredKeywords.map((keyword) => (
                <tr key={keyword.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Prioridad">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {keyword.priority}
                      </span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => movePriority(keyword.id, 'up')}
                          className="text-gray-400 hover:text-gray-600"
                          disabled={saving}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => movePriority(keyword.id, 'down')}
                          className="text-gray-400 hover:text-gray-600"
                          disabled={saving}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Palabra Clave">
                    <div className="font-medium text-gray-900">
                      {keyword.keyword}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Categoría">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(keyword.category)}`}>
                      {getCategoryLabel(keyword.category)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4" data-label="Descripción">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {keyword.description || 'Sin descripción'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Estado">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      keyword.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {keyword.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap" data-label="Acciones">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingKeyword(keyword)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        disabled={saving}
                        title="Editar palabra clave"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          const confirmed = confirm(`¿Estás seguro de eliminar "${keyword.keyword}"?`);
                          if (confirmed) handleDeleteKeyword(keyword.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        disabled={saving}
                        title="Eliminar palabra clave"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateKeyword(keyword.id, { active: !keyword.active })}
                        className={`p-1 rounded ${keyword.active ? 'text-green-600 hover:text-green-800 hover:bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                        disabled={saving}
                        title={keyword.active ? 'Desactivar' : 'Activar'}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredKeywords.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron palabras clave</p>
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

      {/* Usage Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Cómo funciona el sistema de priorización
            </h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Las palabras clave con <strong>prioridad 1</strong> aparecen primero en búsquedas</li>
              <li>• Los paquetes que coincidan con estas keywords tendrán mayor visibilidad</li>
              <li>• El sistema usa estas palabras para mejorar el algoritmo de recomendaciones</li>
              <li>• Se pueden configurar por categoría para mejor organización</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {editingKeyword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 priority-modal">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Palabra Clave
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Palabra Clave
                </label>
                <input
                  type="text"
                  value={editingKeyword.keyword}
                  onChange={(e) => setEditingKeyword({ ...editingKeyword, keyword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingKeyword.priority}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, priority: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editingKeyword.category}
                    onChange={(e) => setEditingKeyword({ ...editingKeyword, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editingKeyword.description}
                  onChange={(e) => setEditingKeyword({ ...editingKeyword, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingKeyword.active}
                  onChange={(e) => setEditingKeyword({ ...editingKeyword, active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Activa
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingKeyword(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const { id, ...updates } = editingKeyword;
                  handleUpdateKeyword(id, updates);
                }}
                disabled={saving || !editingKeyword.keyword.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPriorityPanel;