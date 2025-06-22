'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "SOMOS MULTIDESTINO",
      subtitle: "Tour Operador Mayorista con más de 15 años conectando Argentina con el mundo",
      description: "Vuelos chárter, paquetes exclusivos y experiencias únicas para agencias y viajeros",
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop&auto=format&q=80",
      cta: {
        primary: { text: "Explorar Destinos", href: "/paquetes" },
        secondary: { text: "Ser Agencia Socia", href: "/agencias" }
      }
    },
    {
      id: 2,
      title: "FOZ DO IGUAZÚ",
      subtitle: "Vuelo chárter directo desde Mendoza",
      description: "Pasajes + Hotel en Brasil + Media pensión. Una experiencia inolvidable te espera",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&h=1080&fit=crop&auto=format&q=80",
      cta: {
        primary: { text: "Reservar Ahora", href: "/paquetes/foz-iguazu" },
        secondary: { text: "Ver Itinerario", href: "/paquetes" }
      }
    },
    {
      id: 3,
      title: "PERÚ MÁGICO",
      subtitle: "Cusco, Valle Sagrado y Machu Picchu",
      description: "Descubre la magia del imperio Inca en un viaje de 8 días inolvidable",
      image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1920&h=1080&fit=crop&auto=format&q=80",
      cta: {
        primary: { text: "Conocer Más", href: "/paquetes/peru-magico" },
        secondary: { text: "Consultar Precio", href: "/contacto" }
      }
    },
    {
      id: 4,
      title: "VIAJES DE 15",
      subtitle: "Egresados 2025 - Experiencias únicas",
      description: "Paquetes especiales para viajes de egresados con financiación sin tarjeta",
      image: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=1920&h=1080&fit=crop&auto=format&q=80",
      cta: {
        primary: { text: "Ver Paquetes 2025", href: "/viajes-de-15" },
        secondary: { text: "Solicitar Cotización", href: "/contacto" }
      }
    },
    {
      id: 5,
      title: "AGENCIAS SOCIAS",
      subtitle: "Únete a nuestro programa de socios",
      description: "Planes Oro, Plata y Bronce con comisiones preferenciales y soporte integral",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1920&h=1080&fit=crop&auto=format&q=80",
      cta: {
        primary: { text: "Ser Socio", href: "/agencias" },
        secondary: { text: "Ver Beneficios", href: "/agencias#beneficios" }
      }
    },
    {
      id: 6,
      title: "MENDOZA TIERRA DE SOL Y VINO",
      subtitle: "Descubrí los encantos de nuestra provincia",
      description: "Tours, bodegas, aventura y gastronomía en el corazón de la cordillera",
      image: "https://images.unsplash.com/photo-1586783033026-47d37d22d122?w=1920&h=1080&fit=crop&auto=format&q=80",
      cta: {
        primary: { text: "Descubrir Mendoza", href: "/mendoza" },
        secondary: { text: "Tours Locales", href: "/paquetes" }
      }
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Animated Content */}
            <div
              key={currentSlide}
              className="animate-fade-in-up"
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                {slides[currentSlide].title}
              </h1>
              <h2 className="text-xl md:text-2xl text-intertravel-gold mb-4 font-semibold">
                {slides[currentSlide].subtitle}
              </h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed">
                {slides[currentSlide].description}
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={slides[currentSlide].cta.primary.href}
                  className="btn-intertravel inline-flex items-center justify-center text-center"
                >
                  {slides[currentSlide].cta.primary.text}
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href={slides[currentSlide].cta.secondary.href}
                  className="btn-intertravel-outline inline-flex items-center justify-center text-center"
                >
                  {slides[currentSlide].cta.secondary.text}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-intertravel-gold scale-125'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Arrow Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Profile Selector Overlay */}
      <div className="absolute bottom-24 right-8 z-20 hidden lg:block">
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-white text-lg font-semibold mb-4 text-center">
            Elegí tu perfil y comenzá tu experiencia
          </h3>
          <div className="space-y-3">
            <Link
              href="/agencias"
              className="flex items-center space-x-3 bg-intertravel-gold/20 hover:bg-intertravel-gold/30 p-4 rounded-xl transition-all duration-300 group"
            >
              <div className="text-2xl">💼</div>
              <div>
                <div className="text-white font-semibold">Agencia</div>
                <div className="text-white/80 text-sm">de viajes</div>
              </div>
              <svg className="w-5 h-5 text-intertravel-gold group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/viajeros"
              className="flex items-center space-x-3 bg-intertravel-gold/20 hover:bg-intertravel-gold/30 p-4 rounded-xl transition-all duration-300 group"
            >
              <div className="text-2xl">✈️</div>
              <div>
                <div className="text-white font-semibold">Viajero</div>
                <div className="text-white/80 text-sm">individual</div>
              </div>
              <svg className="w-5 h-5 text-intertravel-gold group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 z-20 lg:right-80 hidden md:block">
        <div className="flex flex-col items-center text-white/80">
          <span className="text-sm mb-2 writing-mode-vertical">Descubrí más</span>
          <div className="w-px h-16 bg-gradient-to-b from-white/60 to-transparent"></div>
          <svg className="w-4 h-4 animate-bounce mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;