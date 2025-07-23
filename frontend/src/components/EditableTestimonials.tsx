'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Star, 
  Edit, 
  Save, 
  X, 
  Plus,
  Trash2,
  User,
  MessageCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface Review {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar?: string;
  date: string;
  verified: boolean;
  enabled: boolean;
}

interface EditableTestimonialsProps {
  adminMode?: boolean;
  className?: string;
  showAll?: boolean;
  limit?: number;
}

const defaultReviews: Review[] = [
  {
    id: '1',
    name: 'María González',
    location: 'Buenos Aires, Argentina',
    rating: 5,
    comment: 'Excelente servicio! El viaje a Europa superó todas mis expectativas. La atención personalizada y la organización fueron perfectas.',
    date: '2025-01-15',
    verified: true,
    enabled: true
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    location: 'Mendoza, Argentina',
    rating: 5,
    comment: 'InterTravel nos organizó un viaje increíble a Perú. Machu Picchu fue espectacular y todo salió perfecto. Altamente recomendable.',
    date: '2025-01-10',
    verified: true,
    enabled: true
  },
  {
    id: '3',
    name: 'Ana López',
    location: 'Córdoba, Argentina',
    rating: 5,
    comment: 'El mejor operador de viajes! Nos ayudaron con cada detalle y el precio fue muy competitivo. Volveremos a viajar con ellos.',
    date: '2025-01-05',
    verified: true,
    enabled: true
  },
  {
    id: '4',
    name: 'Diego Martín',
    location: 'Rosario, Argentina',
    rating: 5,
    comment: 'Viaje familiar perfecto a Brasil. Los chicos se divirtieron mucho y nosotros pudimos relajarnos. Gracias por todo!',
    date: '2024-12-28',
    verified: true,
    enabled: true
  },
  {
    id: '5',
    name: 'Laura Fernández',
    location: 'La Plata, Argentina',
    rating: 5,
    comment: 'Circuito asiático increíble. Japón y Tailandia fueron destinos de ensueño. La organización fue impecable.',
    date: '2024-12-20',
    verified: true,
    enabled: true
  },
  {
    id: '6',
    name: 'Roberto Silva',
    location: 'Tucumán, Argentina',
    rating: 5,
    comment: 'Luna de miel perfecta en Europa. Cada ciudad fue una experiencia única. Gracias por hacer nuestro sueño realidad.',
    date: '2024-12-15',
    verified: true,
    enabled: true
  }
];

export default function EditableTestimonials({ 
  adminMode = false, 
  className = '',
  showAll = false,
  limit = 6
}: EditableTestimonialsProps) {
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [isEnabled, setIsEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Review | null>(null);

  // Cargar configuración solo del lado del cliente
  useEffect(() => {
    const savedReviews = localStorage.getItem('intertravel_reviews');
    const savedEnabled = localStorage.getItem('intertravel_reviews_enabled');
    
    if (savedReviews) {
      try {
        setReviews(JSON.parse(savedReviews));
      } catch (e) {
        console.error('Error loading reviews:', e);
      }
    }
    
    if (savedEnabled !== null) {
      setIsEnabled(savedEnabled === 'true');
    }
  }, []);

  // Guardar cambios
  const saveData = (newReviews: Review[], enabled?: boolean) => {
    setReviews(newReviews);
    localStorage.setItem('intertravel_reviews', JSON.stringify(newReviews));
    
    if (enabled !== undefined) {
      setIsEnabled(enabled);
      localStorage.setItem('intertravel_reviews_enabled', enabled.toString());
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditForm({ ...review });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editForm) return;
    
    const newReviews = reviews.map(review => 
      review.id === editForm.id ? editForm : review
    );
    saveData(newReviews);
    setEditingId(null);
    setEditForm(null);
  };

  const toggleReviewEnabled = (id: string) => {
    const newReviews = reviews.map(review => 
      review.id === id ? { ...review, enabled: !review.enabled } : review
    );
    saveData(newReviews);
  };

  const deleteReview = (id: string) => {
    if (reviews.length <= 1) {
      alert('Debe haber al menos una reseña');
      return;
    }
    const newReviews = reviews.filter(review => review.id !== id);
    saveData(newReviews);
  };

  const addReview = () => {
    const newReview: Review = {
      id: `review_${Date.now()}`,
      name: 'Nuevo Cliente',
      location: 'Argentina',
      rating: 5,
      comment: 'Excelente servicio de InterTravel.',
      date: new Date().toISOString().split('T')[0],
      verified: true,
      enabled: true
    };
    saveData([...reviews, newReview]);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Vista Admin
  if (adminMode) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Gestionar Testimonios
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Controla las reseñas que aparecen en la homepage
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isEnabled ? 'Sección Activa' : 'Sección Inactiva'}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => saveData(reviews, checked)}
              />
            </div>
            
            <Button onClick={addReview} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Agregar Reseña
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {editingId === review.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={editForm?.name || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                          placeholder="Nombre del cliente"
                        />
                        <Input
                          value={editForm?.location || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, location: e.target.value } : null)}
                          placeholder="Ubicación"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          value={editForm?.rating || 5}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, rating: Number(e.target.value) } : null)}
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {[5, 4, 3, 2, 1].map(num => (
                            <option key={num} value={num}>{num} estrella{num > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                        
                        <Input
                          type="date"
                          value={editForm?.date || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, date: e.target.value } : null)}
                        />
                      </div>
                      
                      <Textarea
                        value={editForm?.comment || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, comment: e.target.value } : null)}
                        placeholder="Comentario del cliente"
                        rows={3}
                      />
                      
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="flex items-center gap-1">
                          <Save className="w-4 h-4" />
                          Guardar
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm" className="flex items-center gap-1">
                          <X className="w-4 h-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="text-lg font-semibold">{review.name}</h4>
                        <span className="text-sm text-gray-500">{review.location}</span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          review.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {review.enabled ? 'Visible' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{review.comment}</p>
                      <p className="text-xs text-gray-400">Fecha: {review.date}</p>
                    </div>
                  )}
                </div>

                {editingId !== review.id && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => toggleReviewEnabled(review.id)}
                      size="sm"
                      variant={review.enabled ? "default" : "outline"}
                    >
                      {review.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button onClick={() => startEdit(review)} size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => deleteReview(review.id)} 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Vista Pública - solo renderizar si está habilitado
  if (!isEnabled) {
    return null;
  }

  const enabledReviews = reviews.filter(review => review.enabled);
  const displayReviews = showAll ? enabledReviews : enabledReviews.slice(0, limit);

  return (
    <section className={`py-20 bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Lo que Dicen Nuestros Clientes
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experiencias reales de viajeros que confiaron en InterTravel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayReviews.map((review) => (
            <Card key={review.id} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                    <p className="text-sm text-gray-500">{review.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(review.rating)}
                  <span className="text-sm text-gray-600 ml-2">({review.rating}.0)</span>
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  "{review.comment}"
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(review.date).toLocaleDateString('es-AR')}</span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Star className="w-3 h-3 fill-current" />
                      Verificado
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!showAll && enabledReviews.length > limit && (
          <div className="text-center mt-12">
            <Button 
              onClick={() => window.location.href = '/opiniones'}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Ver Todas las Opiniones
            </Button>
          </div>
        )}
        
        {/* Estadísticas */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-gray-600 text-sm">Satisfacción</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">3,000+</div>
            <div className="text-gray-600 text-sm">Viajeros Felices</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
            <div className="text-gray-600 text-sm">Presencia AR, CL, BR, PY</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">4.9</div>
            <div className="text-gray-600 text-sm">Rating Promedio</div>
          </div>
        </div>
      </div>
    </section>
  );
}