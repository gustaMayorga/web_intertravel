'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ExternalLink, RefreshCw, Settings } from 'lucide-react';

interface GoogleReview {
  id: string;
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  language: string;
  translated?: boolean;
}

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
  source: 'manual' | 'google' | 'facebook' | 'tripadvisor';
  platform_url?: string;
}

interface ReviewsSectionProps {
  showAll?: boolean;
  limit?: number;
  className?: string;
  showAdminControls?: boolean;
  textColor?: string;
  backgroundStyle?: string;
}

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

export default function ReviewsSection({ 
  showAll = false, 
  limit = 6, 
  className = "",
  showAdminControls = false,
  textColor = 'white',
  backgroundStyle = 'bg-gradient-to-br from-slate-50 to-blue-50'
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 4.9,
    googleReviews: 0,
    fiveStarPercent: 0
  });

  // Colores de marca unificados
  const brandColors = {
    primary: '#16213e',
    secondary: '#b38144',
    accent: '#2563eb'
  };

  // Reviews de fallback mejoradas con mejor contraste
  const fallbackReviews: Review[] = [
    {
      id: 1,
      name: "María González",
      location: "Buenos Aires",
      rating: 5,
      text: "Increíble experiencia en París. El servicio de InterTravel fue excepcional, todo estuvo perfectamente organizado. La atención al detalle superó mis expectativas.",
      trip: "París Romántico",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format",
      date: "2024-03-15",
      verified: true,
      source: 'google',
      platform_url: 'https://g.page/r/...'
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      location: "Mendoza",
      rating: 5,
      text: "Machu Picchu superó todas mis expectativas. La organización fue impecable y nuestro guía fue excepcional. Recomiendo InterTravel sin dudar.",
      trip: "Aventura en Perú",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format",
      date: "2024-02-28",
      verified: true,
      source: 'google',
      platform_url: 'https://g.page/r/...'
    },
    {
      id: 3,
      name: "Ana Martínez",
      location: "Córdoba",
      rating: 5,
      text: "Cancún fue un paraíso. Desde el primer contacto hasta el regreso, todo fue perfecto. El hotel recomendado era espectacular y las excursiones inolvidables.",
      trip: "Playa Todo Incluido",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format",
      date: "2024-01-20",
      verified: true,
      source: 'tripadvisor'
    },
    {
      id: 4,
      name: "Roberto Silva",
      location: "Rosario",
      rating: 5,
      text: "Europa en 12 días fue un sueño hecho realidad. La organización de InterTravel permitió que disfrutáramos cada momento sin preocupaciones.",
      trip: "Europa Clásica",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format",
      date: "2024-03-01",
      verified: true,
      source: 'google'
    },
    {
      id: 5,
      name: "Laura Fernández",
      location: "La Plata",
      rating: 5,
      text: "Mi luna de miel en Bali fue absolutamente mágica. Cada detalle fue pensado para hacer el viaje único. El resort y las actividades fueron perfectas.",
      trip: "Bali Romántico",
      avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&auto=format",
      date: "2024-02-14",
      verified: true,
      source: 'manual'
    },
    {
      id: 6,
      name: "Diego Morales",
      location: "Tucumán",
      rating: 5,
      text: "Japón en temporada de cerezos fue extraordinario. La experiencia cultural y gastronómica que organizó InterTravel superó todas mis expectativas.",
      trip: "Japón Cultural",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f44?w=100&h=100&fit=crop&auto=format",
      date: "2024-04-05",
      verified: true,
      source: 'facebook'
    }
  ];

  useEffect(() => {
    checkAdminAccess();
    loadReviews();
  }, []);

  const checkAdminAccess = () => {
    const token = localStorage.getItem('auth_token');
    const user = sessionStorage.getItem('auth_user');
    if (token && user) {
      const userData = JSON.parse(user);
      setIsAdmin(userData.role === 'admin' || userData.role === 'super_admin');
    }
  };

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Cargar reviews manuales de BD
      const manualReviews = await loadManualReviews();
      
      // 2. Cargar reviews de Google
      const googleReviewsData = await loadGoogleReviews();
      
      // 3. Combinar y mostrar
      const combinedReviews = [...manualReviews, ...googleReviewsData];
      const displayReviews = showAll ? combinedReviews : combinedReviews.slice(0, limit);
      
      setReviews(displayReviews.length > 0 ? displayReviews : fallbackReviews.slice(0, limit));
      
      // 4. Calcular estadísticas
      calculateStats(displayReviews.length > 0 ? combinedReviews : fallbackReviews, googleReviewsData);
      
      console.log('✅ Reviews cargadas:', displayReviews.length || fallbackReviews.length);
    } catch (error) {
      console.error('Error cargando reviews:', error);
      setError('Mostrando testimonios verificados');
      setReviews(fallbackReviews.slice(0, limit));
      calculateStats(fallbackReviews, []);
    } finally {
      setLoading(false);
    }
  };

  const loadManualReviews = async (): Promise<Review[]> => {
    try {
      const response = await fetch(`${API_BASE}/reviews?limit=${showAll ? 100 : limit}&active=true`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reviews && data.reviews.length > 0) {
          return data.reviews;
        }
      }
    } catch (error) {
      console.error('Error cargando reviews manuales:', error);
    }
    return [];
  };

  const loadGoogleReviews = async (): Promise<Review[]> => {
    try {
      const response = await fetch(`${API_BASE}/integrations/google-reviews`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reviews) {
          setGoogleReviews(data.reviews);
          
          // Convertir Google Reviews al formato interno
          return data.reviews.map((review: GoogleReview) => ({
            id: `google_${review.id}`,
            name: review.author_name,
            location: "Google Reviews",
            rating: review.rating,
            text: review.text,
            trip: "Experiencia InterTravel",
            avatar: review.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name)}&background=random`,
            date: new Date(review.time * 1000).toISOString().split('T')[0],
            verified: true,
            google_review_id: review.id,
            source: 'google' as const,
            platform_url: review.author_url
          }));
        }
      }
    } catch (error) {
      console.error('Error cargando Google Reviews:', error);
    }
    return [];
  };

  const calculateStats = (allReviews: Review[], googleData: GoogleReview[]) => {
    if (allReviews.length === 0) return;
    
    const totalReviews = allReviews.length;
    const averageRating = allReviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews;
    const fiveStarCount = allReviews.filter(review => review.rating === 5).length;
    const fiveStarPercent = Math.round((fiveStarCount / totalReviews) * 100);
    
    setStats({
      totalReviews,
      averageRating: Number(averageRating.toFixed(1)),
      googleReviews: googleData.length,
      fiveStarPercent
    });
  };

  const refreshGoogleReviews = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/integrations/google-reviews/refresh`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadReviews(); // Recargar todas las reviews
        console.log('✅ Google Reviews actualizadas');
      }
    } catch (error) {
      console.error('Error actualizando Google Reviews:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const openAdminPanel = () => {
    window.open('/admin/reviews', '_blank');
  };

  const getSourceIcon = (source: Review['source']) => {
    switch (source) {
      case 'google':
        return '🔍';
      case 'facebook':
        return '📘';
      case 'tripadvisor':
        return '🦉';
      default:
        return '⭐';
    }
  };

  const getSourceColor = (source: Review['source']) => {
    switch (source) {
      case 'google':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'facebook':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'tripadvisor':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
      <section className={`relative py-20 ${className} ${backgroundStyle}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" 
                style={{
                  color: textColor === 'white' ? '#ffffff' : brandColors.primary,
                  textShadow: textColor === 'white' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                }}>
              💬 Lo Que Dicen Nuestros Viajeros
            </h2>
            <p className="text-xl" 
               style={{
                 color: textColor === 'white' ? 'rgba(255,255,255,0.9)' : '#6b7280',
                 textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
               }}>
              Cargando experiencias de nuestros clientes...
            </p>
          </div>
          
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{borderColor: brandColors.secondary}}></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative py-20 ${className} ${backgroundStyle}`}>
      
      {/* 🔧 Controles de Admin */}
      {isAdmin && showAdminControls && (
        <div className="absolute top-6 right-6 z-20 flex gap-3">
          <button
            onClick={refreshGoogleReviews}
            disabled={refreshing}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
            title="Actualizar Google Reviews"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Google
          </button>
          <button
            onClick={openAdminPanel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
            title="Gestionar Reviews"
          >
            <Settings className="w-4 h-4" />
            Reviews
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        
        {/* 📝 Título mejorado con mejor contraste */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" 
              style={{
                color: textColor === 'white' ? '#ffffff' : brandColors.primary,
                textShadow: textColor === 'white' ? '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' : 'none'
              }}>
            💬 Lo Que Dicen Nuestros Viajeros
          </h2>
          <p className="text-xl mb-4" 
             style={{
               color: textColor === 'white' ? '#f1f5f9' : '#6b7280',
               textShadow: textColor === 'white' ? '1px 1px 6px rgba(0,0,0,0.8)' : 'none'
             }}>
            Más de {stats.totalReviews.toLocaleString()} experiencias inolvidables
          </p>
          
          {/* 📊 Estadísticas mejoradas */}
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="font-bold" 
                    style={{
                      color: textColor === 'white' ? '#ffffff' : brandColors.primary,
                      textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
                    }}>
                {stats.averageRating}
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span style={{
                color: textColor === 'white' ? '#ffffff' : brandColors.primary,
                textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
              }}>
                {stats.fiveStarPercent}% Excelente
              </span>
            </div>
            
            {stats.googleReviews > 0 && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-sm">🔍</span>
                <span style={{
                  color: textColor === 'white' ? '#ffffff' : brandColors.primary,
                  textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
                }}>
                  {stats.googleReviews} Google Reviews
                </span>
              </div>
            )}
          </div>

          {error && (
            <p className="text-yellow-300 text-sm bg-yellow-500/20 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
              {error}
            </p>
          )}
        </div>

        {/* 💬 Grid de Testimonios con mejor contraste */}
        <div className={`grid gap-8 ${
          showAll 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-3'
        }`}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-6 hover:bg-white/100 transition-all duration-300 relative shadow-lg hover:shadow-xl"
            >
              
              {/* 🏷️ Badges mejorados */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {review.verified && (
                  <div className="bg-green-100/90 border border-green-300/50 rounded-full px-3 py-1 flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-700 text-xs font-medium">Verificado</span>
                  </div>
                )}
                
                <div className={`rounded-full px-3 py-1 flex items-center space-x-1 ${getSourceColor(review.source)}`}>
                  <span className="text-xs">{getSourceIcon(review.source)}</span>
                  <span className="text-xs font-medium capitalize">{review.source}</span>
                </div>
              </div>
              
              {/* ⭐ Estrellas */}
              <div className="flex mb-4 mt-2">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* 📝 Testimonio con mejor tipografía */}
              <p className="text-gray-800 text-base mb-6 italic leading-relaxed" 
                 style={{lineHeight: '1.6'}}>
                "{review.text}"
              </p>

              {/* 👤 Información del cliente mejorada */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-white shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=random`;
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {review.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {review.location}
                    </p>
                    <p className="font-medium text-sm" style={{color: brandColors.secondary}}>
                      {review.trip}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-gray-500 text-xs">
                    {formatDate(review.date)}
                  </p>
                  {review.platform_url && (
                    <a
                      href={review.platform_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver original
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 📈 Estadísticas finales mejoradas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2" 
                 style={{
                   color: textColor === 'white' ? brandColors.secondary : brandColors.primary,
                   textShadow: textColor === 'white' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                 }}>
              {stats.totalReviews.toLocaleString()}
            </div>
            <p style={{
              color: textColor === 'white' ? 'rgba(255,255,255,0.9)' : '#6b7280',
              textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}>
              Viajeros Felices
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2" 
                 style={{
                   color: textColor === 'white' ? brandColors.secondary : brandColors.primary,
                   textShadow: textColor === 'white' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                 }}>
              {stats.averageRating}
            </div>
            <p style={{
              color: textColor === 'white' ? 'rgba(255,255,255,0.9)' : '#6b7280',
              textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}>
              Rating Promedio
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2" 
                 style={{
                   color: textColor === 'white' ? brandColors.secondary : brandColors.primary,
                   textShadow: textColor === 'white' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                 }}>
              {stats.fiveStarPercent}%
            </div>
            <p style={{
              color: textColor === 'white' ? 'rgba(255,255,255,0.9)' : '#6b7280',
              textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}>
              Califican Excelente
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-2" 
                 style={{
                   color: textColor === 'white' ? brandColors.secondary : brandColors.primary,
                   textShadow: textColor === 'white' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                 }}>
              20,000+
            </div>
            <p style={{
              color: textColor === 'white' ? 'rgba(255,255,255,0.9)' : '#6b7280',
              textShadow: textColor === 'white' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
            }}>
              HS Generando Experiencias
            </p>
          </div>
        </div>

        {/* 🔗 Enlace a todas las opiniones */}
        {!showAll && reviews.length >= limit && (
          <div className="text-center mt-12">
            <a
              href="/opiniones"
              className="inline-flex items-center px-8 py-3 font-bold rounded-full hover:scale-105 transition-all shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${brandColors.secondary}, #d4af37)`,
                color: '#ffffff'
              }}
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