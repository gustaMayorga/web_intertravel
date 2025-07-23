'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit, Settings } from 'lucide-react';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image_url?: string;
  active: boolean;
  order_index: number;
}

interface EditableCarouselProps {
  className?: string;
  autoPlay?: boolean;
  interval?: number;
  showAdminControls?: boolean;
}

export default function EditableCarousel({ 
  className = '', 
  autoPlay = true, 
  interval = 6000,
  showAdminControls = false 
}: EditableCarouselProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Slides de fallback con contraste perfecto
  const fallbackSlides: CarouselSlide[] = [
    {
      id: 'slide-1',
      title: 'Experiencias Exclusivas',
      subtitle: 'Viajes Premium',
      description: 'Diseñamos viajes únicos para clientes exigentes',
      image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop&auto=format&q=80',
      active: true,
      order_index: 1
    },
    {
      id: 'slide-2', 
      title: 'Destinos Premium',
      subtitle: 'Lugares Únicos',
      description: 'Acceso a lugares extraordinarios del mundo',
      image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&auto=format&q=80',
      active: true,
      order_index: 2
    },
    {
      id: 'slide-3',
      title: 'Servicio Personalizado',
      subtitle: 'Atención 24/7',
      description: 'Atención personalizada durante toda su experiencia',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop&auto=format&q=80',
      active: true,
      order_index: 3
    }
  ];

  useEffect(() => {
    checkAdminAccess();
    loadSlides();
  }, []);

  useEffect(() => {
    if (autoPlay && slides.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, interval);
      return () => clearInterval(intervalId);
    }
  }, [autoPlay, slides.length, interval]);

  const checkAdminAccess = () => {
    const token = localStorage.getItem('auth_token');
    const user = sessionStorage.getItem('auth_user');
    if (token && user) {
      const userData = JSON.parse(user);
      setIsAdmin(userData.role === 'admin' || userData.role === 'super_admin');
    }
  };

  const loadSlides = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/carousel');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.slides && data.slides.length > 0) {
          const activeSlides = data.slides
            .filter((slide: CarouselSlide) => slide.active)
            .sort((a: CarouselSlide, b: CarouselSlide) => a.order_index - b.order_index);
          setSlides(activeSlides);
          console.log('✅ Slides cargados desde BD:', activeSlides.length);
        } else {
          setSlides(fallbackSlides);
          console.log('⚠️ Usando slides de fallback');
        }
      } else {
        setSlides(fallbackSlides);
        console.log('⚠️ Error API, usando slides de fallback');
      }
    } catch (error) {
      console.error('Error cargando slides:', error);
      setSlides(fallbackSlides);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const openAdminPanel = () => {
    window.open('/admin/carousel', '_blank');
  };

  if (loading) {
    return (
      <div className={`relative min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
            <p className="text-white text-lg">Cargando experiencias...</p>
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className={`relative min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">No hay slides disponibles</h2>
            {isAdmin && (
              <button
                onClick={openAdminPanel}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Configurar Carousel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* 🎨 Background con Overlay de Contraste Perfecto */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {slide.image_url ? (
              <>
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Overlay de contraste mejorado - SOLUCIÓN AL PROBLEMA DE VISIBILIDAD */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-blue-900/60 to-black/80"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900"></div>
            )}
          </div>
        ))}
      </div>

      {/* 📝 Contenido Principal con Contraste Optimizado */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-5xl mx-auto px-6">
          
          {/* Título Principal - Texto Blanco con Sombra */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6 animate-fade-in"
              style={{
                color: '#ffffff',
                textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
                letterSpacing: '-0.02em'
              }}>
            {currentSlideData.title}
          </h1>
          
          {/* Subtítulo - Contraste Perfecto */}
          {currentSlideData.subtitle && (
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-light mb-8 animate-fade-in-delay"
                style={{
                  color: '#f1f5f9',
                  textShadow: '1px 1px 6px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em'
                }}>
              {currentSlideData.subtitle}
            </h2>
          )}
          
          {/* Descripción - Texto Optimizado */}
          <p className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed max-w-4xl mx-auto animate-fade-in-delay-2"
             style={{
               color: '#e2e8f0',
               textShadow: '1px 1px 4px rgba(0,0,0,0.8)'
             }}>
            {currentSlideData.description}
          </p>
        </div>
      </div>

      {/* 🎮 Controles de Navegación - Diseño Profesional */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 w-14 h-14 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-xl flex items-center justify-center"
            aria-label="Slide siguiente"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      {/* 🔘 Indicadores - Estilo Moderno */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentSlide 
                  ? 'w-12 h-3 bg-white rounded-full shadow-lg' 
                  : 'w-3 h-3 bg-white/50 hover:bg-white/70 rounded-full'
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* 🔧 Panel de Administración (Solo para Admins) */}
      {isAdmin && showAdminControls && (
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={openAdminPanel}
            className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-all flex items-center gap-2"
            title="Editar Carousel"
          >
            <Edit className="w-4 h-4" />
            Editar Slides
          </button>
        </div>
      )}

      {/* 🎬 Estilos de Animación */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 1s ease-out 0.3s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 1s ease-out 0.6s both;
        }
      `}</style>
    </section>
  );
}