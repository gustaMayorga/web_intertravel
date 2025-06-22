'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface Review {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  trip: string;
  avatar: string;
  date: string;
  verified: boolean;
  featured: boolean;
  google_review_id?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

interface ReviewFormData {
  name: string;
  location: string;
  rating: number;
  text: string;
  trip: string;
  avatar: string;
  date: string;
  verified: boolean;
  featured: boolean;
  google_review_id: string;
}

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

export default function AdminReviews() {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    verified: '',
    featured: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    byStatus: { active: 0, inactive: 0, pending: 0 },
    verified: 0,
    featured: 0,
    fromGoogle: 0,
    avgRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  const [formData, setFormData] = useState<ReviewFormData>({
    name: '',
    location: '',
    rating: 5,
    text: '',
    trip: '',
    avatar: '',
    date: new Date().toISOString().split('T')[0],
    verified: true,
    featured: false,
    google_review_id: ''
  });

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [filters, pagination.page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`${API_BASE}/reviews/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            ...data.pagination
          }));
        }
        setError(null);
      } else {
        setError('Error cargando reviews');
      }
    } catch (error) {
      console.error('Error cargando reviews:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/reviews/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error cargando stats:', error);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE}/reviews/admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        resetForm();
        loadReviews();
        loadStats();
        alert('Review creada exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creando review:', error);
      alert('Error de conexión');
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingReview) return;

    try {
      const response = await fetch(`${API_BASE}/reviews/admin/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setEditingReview(null);
        resetForm();
        loadReviews();
        loadStats();
        alert('Review actualizada exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error actualizando review:', error);
      alert('Error de conexión');
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta review?')) return;

    try {
      const response = await fetch(`${API_BASE}/reviews/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        loadReviews();
        loadStats();
        alert('Review eliminada exitosamente');
      } else {
        alert('Error eliminando review');
      }
    } catch (error) {
      console.error('Error eliminando review:', error);
      alert('Error de conexión');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE}/reviews/admin/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        loadReviews();
        loadStats();
      } else {
        alert('Error cambiando estado');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error de conexión');
    }
  };

  const handleFeaturedToggle = async (id: number, featured: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/reviews/admin/${id}/featured`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ featured })
      });

      if (response.ok) {
        loadReviews();
        loadStats();
      } else {
        alert('Error cambiando destaque');
      }
    } catch (error) {
      console.error('Error cambiando destaque:', error);
      alert('Error de conexión');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      rating: 5,
      text: '',
      trip: '',
      avatar: '',
      date: new Date().toISOString().split('T')[0],
      verified: true,
      featured: false,
      google_review_id: ''
    });
  };

  const startEdit = (review: Review) => {
    setEditingReview(review);
    setFormData({
      name: review.name,
      location: review.location,
      rating: review.rating,
      text: review.text,
      trip: review.trip,
      avatar: review.avatar,
      date: review.date,
      verified: review.verified,
      featured: review.featured,
      google_review_id: review.google_review_id || ''
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingReview(null);
    setShowCreateForm(false);
    resetForm();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💬 Gestión de Opiniones</h1>
          <p className="text-gray-600 mt-2">Administra las opiniones y testimonios de clientes</p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Opinión
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-gray-600">Total Opiniones</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{stats.byStatus.active}</div>
          <div className="text-gray-600">Activas</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
          <div className="text-gray-600">Destacadas</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{stats.avgRating.toFixed(1)}</div>
          <div className="text-gray-600">Rating Promedio</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, texto o viaje..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
            <option value="pending">Pendientes</option>
          </select>
          
          <select
            value={filters.verified}
            onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Verificación</option>
            <option value="true">Verificadas</option>
            <option value="false">No verificadas</option>
          </select>
          
          <select
            value={filters.featured}
            onChange={(e) => setFilters(prev => ({ ...prev, featured: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Destacadas</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      {/* Modal de creación/edición */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingReview ? 'Editar Opinión' : 'Nueva Opinión'}
            </h2>
            
            <form onSubmit={editingReview ? handleUpdateReview : handleCreateReview}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating *
                  </label>
                  <select
                    required
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value={5}>5 estrellas</option>
                    <option value={4}>4 estrellas</option>
                    <option value={3}>3 estrellas</option>
                    <option value={2}>2 estrellas</option>
                    <option value={1}>1 estrella</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Viaje *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.trip}
                    onChange={(e) => setFormData(prev => ({ ...prev, trip: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Testimonio *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Escribe aquí la opinión del cliente..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Avatar
                  </label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Review ID (opcional)
                </label>
                <input
                  type="text"
                  value={formData.google_review_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_review_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ID de Google Reviews"
                />
              </div>

              <div className="flex items-center gap-6 mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                    className="mr-2"
                  />
                  Verificada
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="mr-2"
                  />
                  Destacada
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingReview ? 'Actualizar' : 'Crear'} Opinión
                </button>
                
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de opiniones */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Opiniones ({pagination.total})
          </h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No hay opiniones
              </h3>
              <p className="text-gray-500 mb-6">
                Comienza creando tu primera opinión
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Nueva Opinión
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    
                    <div className="flex-1">
                      {/* Header de la review */}
                      <div className="flex items-center mb-3">
                        <img
                          src={review.avatar || 'https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format'}
                          alt={review.name}
                          className="w-12 h-12 rounded-full object-cover mr-4"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format';
                          }}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{review.name}</h4>
                            
                            {review.verified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                ✓ Verificada
                              </span>
                            )}
                            
                            {review.featured && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                ⭐ Destacada
                              </span>
                            )}
                            
                            {review.google_review_id && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                📍 Google
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{review.location}</span>
                            <span>•</span>
                            <span>{review.trip}</span>
                            <span>•</span>
                            <span>{formatDate(review.date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-gray-600">({review.rating}/5)</span>
                      </div>

                      {/* Texto de la review */}
                      <p className="text-gray-700 mb-4 italic">
                        "{review.text}"
                      </p>

                      {/* Status y metadatos */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Estado: 
                          <select
                            value={review.status}
                            onChange={(e) => handleStatusChange(review.id, e.target.value)}
                            className="ml-1 border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="active">Activa</option>
                            <option value="inactive">Inactiva</option>
                            <option value="pending">Pendiente</option>
                          </select>
                        </span>
                        
                        <span>ID: {review.id}</span>
                        
                        <span>Creada: {formatDate(review.created_at)}</span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleFeaturedToggle(review.id, !review.featured)}
                        className={`px-3 py-1 rounded text-sm ${
                          review.featured 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {review.featured ? '⭐ Quitar destaque' : '⭐ Destacar'}
                      </button>
                      
                      <button
                        onClick={() => startEdit(review)}
                        className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 rounded text-sm"
                      >
                        ✏️ Editar
                      </button>
                      
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <span className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  {pagination.page} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
