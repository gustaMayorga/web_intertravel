'use client';

import React, { useState, useEffect } from 'react';

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
  google_review_id?: string;
}

interface ReviewsProps {
  showAll?: boolean;
  limit?: number;
  className?: string;
}

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

export default function ReviewsSection({ showAll = false, limit = 6, className = "" }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Opiniones de fallback (las actuales)
  const fallbackReviews: Review[] = [
    {
      id: 1,
      name: "María González",
      location: "Buenos Aires",
      rating: 5,
      text: "Increíble experiencia en París. El servicio de InterTravel fue excepcional, todo estuvo perfectamente organizado.",
      trip: "París Romántico",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format",
      date: "2024-03-15",
      verified: true
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      location: "Mendoza",
      rating: 5,
      text: "Machu Picchu superó todas mis expectativas. La atención al detalle y el profesionalismo de InterTravel es incomparable.",
      trip: "Aventura en Perú",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format",
      date: "2024-02-28",
      verified: true
    },
    {
      id: 3,
      name: "Ana Martínez",
      location: "Córdoba",
      rating: 5,
      text: "Cancún fue un paraíso. Desde el primer contacto hasta el regreso, todo fue perfecto. ¡Ya estamos planeando el próximo viaje!",
      trip: "Playa Todo Incluido",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format",
      date: "2024-01-20",
      verified: true
    },
    {
      id: 4,
      name: "Roberto Silva",
      location: "Rosario",
      rating: 5,
      text: "La organización fue perfecta, desde los vuelos hasta cada excursión. Recomiendo InterTravel sin dudarlo.",
      trip: "Europa Clásica",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format",
      date: "2024-03-01",
      verified: true
    },
    {
      id: 5,
      name: "Laura Fernández",
      location: "La Plata",
      rating: 5,
      text: "Mi luna de miel en Bali fue absolutamente mágica. Cada detalle fue pensado para hacer el viaje único e inolvidable.",
      trip: "Bali Romántico",
      avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&auto=format",
      date: "2024-02-14",
      verified: true
    },
    {
      id: 6,
      name: "Diego Morales",
      location: "Tucumán",
      rating: 5,
      text: "Japón en temporada de cerezos fue un sueño hecho realidad. La guía cultural y las experiencias auténticas superaron mis expectativas.",
      trip: "Japón Cultural",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f44?w=100&h=100&fit=crop&auto=format",
      date: "2024-04-05",
      verified: true
    }
  ];

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/reviews?limit=${showAll ? 50 : limit}&active=true`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reviews && data.reviews.length > 0) {
          setReviews(data.reviews);
        } else {
          // Si no hay reviews en BD, usar fallback
          setReviews(fallbackReviews.slice(0, limit));
        }
      } else {
        // En caso de error, usar fallback
        setReviews(fallbackReviews.slice(0, limit));
      }
    } catch (error) {
      console.error('Error cargando reviews:', error);
      // En caso de error, usar fallback
      setReviews(fallbackReviews.slice(0, limit));
      setError('Error cargando opiniones, mostrando testimonios verificados');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <section className={`relative py-20 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              💬 Lo Que Dicen Nuestros Viajeros
            </h2>
            <p className="text-xl text-white/80">
              Cargando experiencias de nuestros clientes...
            </p>
          </div>
          
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#B8860B]"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative py-20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            💬 Lo Que Dicen Nuestros Viajeros
          </h2>
          <p className="text-xl text-white/80">
            Más de 5,000 experiencias inolvidables
          </p>
          {error && (
            <p className="text-yellow-400 text-sm mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Grid de testimonios */}
        <div className={`grid gap-8 ${
          showAll 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-3'
        }`}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 relative"
            >
              
              {/* Badge verificado */}
              {review.verified && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1 flex items-center space-x-1">
                    <span className="text-green-400 text-xs">✓</span>
                    <span className="text-green-400 text-xs font-medium">Verificado</span>
                  </div>
                </div>
              )}

              {/* Google Review Badge */}
              {review.google_review_id && (
                <div className="absolute top-4 left-4">
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1 flex items-center space-x-1">
                    <span className="text-blue-400 text-xs">📍</span>
                    <span className="text-blue-400 text-xs font-medium">Google</span>
                  </div>
                </div>
              )}
              
              {/* Estrellas */}
              <div className="flex mb-4 mt-2">
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">⭐</span>
                ))}
              </div>

              {/* Testimonio */}
              <p className="text-white/90 text-lg mb-6 italic">
                "{review.text}"
              </p>

              {/* Información del cliente */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                    onError={(e) => {
                      e.currentTarget.src = `https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format`;
                    }}
                  />
                  <div>
                    <h4 className="text-white font-bold">
                      {review.name}
                    </h4>
                    <p className="text-white/60 text-sm">
                      {review.location}
                    </p>
                    <p className="text-[#B8860B] text-sm font-medium">
                      {review.trip}
                    </p>
                  </div>
                </div>
                
                {/* Fecha */}
                <div className="text-right">
                  <p className="text-white/50 text-xs">
                    {formatDate(review.date)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estadísticas mejoradas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[#B8860B] mb-2">
              5,000+
            </div>
            <p className="text-white/80">Viajeros Felices</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[#B8860B] mb-2">
              50+
            </div>
            <p className="text-white/80">Destinos</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[#B8860B] mb-2">
              15
            </div>
            <p className="text-white/80">Años de Experiencia</p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-[#B8860B] mb-2">
              4.9
            </div>
            <p className="text-white/80">Rating Promedio</p>
          </div>
        </div>

        {/* Enlace a todas las opiniones */}
        {!showAll && reviews.length >= limit && (
          <div className="text-center mt-12">
            <a
              href="/opiniones"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white font-bold rounded-full hover:scale-105 transition-all shadow-xl"
            >
              Ver Todas las Opiniones
              <span className="ml-2">💬</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
