'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Globe, 
  Shield, 
  Star, 
  MapPin, 
  Plane, 
  Calendar, 
  Users, 
  Award,
  ArrowRight,
  CheckCircle,
  Phone,
  Mail,
  Clock,
  GraduationCap,
  Heart,
  Camera,
  Music,
  PartyPopper
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAnalytics } from '@/components/Analytics';

export default function RidePage() {
  const router = useRouter();
  const { trackEvent, trackPageView } = useAnalytics();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Carrusel de imágenes RIDE
  const carouselImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=1200&h=600&fit=crop&auto=format&q=80',
      title: 'Viajes para Quinceañeras',
      description: 'Experiencias inolvidables para celebrar tus 15 años'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=600&fit=crop&auto=format&q=80',
      title: 'Destinos Increíbles',
      description: 'Los mejores lugares para tu celebración de 15 años'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=600&fit=crop&auto=format&q=80',
      title: 'Momentos Inolvidables',
      description: 'Crea recuerdos que durarán toda la vida'
    }
  ];

  // Destinos RIDE populares
  const rideDestinations = [
    { 
      id: 'bariloche', 
      name: 'Bariloche Clásico', 
      description: 'Aventura en la Patagonia', 
      price: 1299, 
      duration: '7 días',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
    },
    { 
      id: 'cancun', 
      name: 'Cancún Paradise', 
      description: 'Playas y diversión', 
      price: 1899, 
      duration: '8 días',
      image: 'https://images.unsplash.com/photo-1552931974-7a4aa1c0efe8?w=400&h=300&fit=crop'
    },
    { 
      id: 'buzios', 
      name: 'Búzios Exclusive', 
      description: 'Brasil paradisíaco', 
      price: 1599, 
      duration: '6 días',
      image: 'https://images.unsplash.com/photo-1618085219724-c59ba48e08cd?w=400&h=300&fit=crop'
    }
  ];

  // Servicios RIDE
  const rideServices = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Especialistas en Quinceañeras',
      description: 'Más de 15 años organizando viajes únicos para quinceañeras y familias'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Seguridad Total',
      description: 'Coordinadores 24/7 y seguros integrales incluidos'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Experiencias Únicas',
      description: 'Actividades exclusivas diseñadas para quinceañeras y familias'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Grupos Organizados',
      description: 'Coordinación perfecta para grupos grandes'
    }
  ];

  // Auto-play del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  useEffect(() => {
    trackPageView('RIDE', 'landing');
  }, []);

  const handleDestinationClick = (destination: any) => {
    trackEvent('ride_destination_click', {
      destination_name: destination.name,
      source: 'ride_destinations'
    });
    router.push(`/paquetes?category=ride&destination=${destination.id}`);
  };

  const handleContactClick = () => {
    trackEvent('ride_contact_click', { source: 'ride_cta' });
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <Header />
      
      {/* ===== HERO SECTION RIDE ===== */}
      <section className="relative min-h-screen" style={{background: 'linear-gradient(135deg, #3b1c5a 0%, #6d28d9 50%, #8b5cf6 100%)'}}>
        
        {/* Efectos de partículas */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-violet-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
        </div>
        
        {/* Carrusel de fondo */}
        <div className="absolute inset-0">
          {carouselImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${image.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0" style={{background: 'linear-gradient(135deg, rgba(59, 28, 90, 0.85) 0%, rgba(109, 40, 217, 0.8) 50%, rgba(139, 92, 246, 0.85) 100%)'}}></div>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-6xl mx-auto px-4">
            
            {/* Logo RIDE */}
            <div className="flex flex-col items-center mb-12">
              <div className="mb-8">
                <div className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-violet-300 mb-4 drop-shadow-lg">
                  RIDE
                </div>
                <div className="text-xl md:text-2xl text-violet-200 font-semibold tracking-wider">
                  QUINCEAÑERAS Y FAMILIAS
                </div>
              </div>
              
              {/* Badge profesional */}
              <div className="inline-flex items-center space-x-3 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full border border-violet-200/30 shadow-xl mb-8">
                <Heart className="w-5 h-5" style={{color: '#8b5cf6'}} />
                <span className="text-gray-800 font-semibold text-base">Especialistas en Quinceañeras y Familias</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            {/* Título principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 text-white">
              Tu Celebración de 15 Años
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-purple-300">
                Perfecta
              </span>
            </h1>
            
            {/* Descripción dinámica */}
            <p className="text-xl md:text-2xl text-white/90 mb-6 font-light max-w-4xl mx-auto">
              {carouselImages[currentSlide].description}
            </p>
            
            <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              RIDE creando las mejores experiencias de viajes para quinceañeras y familias. 
              Destinos únicos, seguridad total y diversión garantizada.
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push('/paquetes?category=ride')}
                className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-lg"
              >
                <Plane className="w-5 h-5" />
                Ver Destinos RIDE
              </button>
              <a
                href="tel:+5492615555558"
                onClick={handleContactClick}
                className="bg-white/95 text-violet-700 px-8 py-4 rounded-xl font-semibold hover:bg-white transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-lg"
              >
                <Phone className="w-5 h-5" />
                Consultar Ahora
              </a>
            </div>
          </div>
        </div>

        {/* Indicadores del carrusel */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-violet-400 scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ===== SERVICIOS RIDE ===== */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-violet-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ¿Por qué elegir RIDE?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos especialistas en crear el viaje perfecto para quinceañeras y familias! Soporte postventa excepcional!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {rideServices.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-violet-200 group"
              >
                <div className="text-violet-600 mb-6 group-hover:text-violet-700 transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DESTINOS RIDE ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Destinos RIDE Más Elegidos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Los mejores destinos para tu celebración de 15 años
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {rideDestinations.map((destination) => (
              <div
                key={destination.id}
                onClick={() => handleDestinationClick(destination)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <Calendar className="w-4 h-4" />
                      {destination.duration}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {destination.name}
                  </h3>
                  <p className="text-gray-600 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {destination.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-2xl font-bold text-violet-600">
                      USD ${destination.price.toLocaleString()}
                    </div>
                    <button className="bg-violet-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-violet-700 transition-colors flex items-center gap-2">
                      Ver Detalles
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/paquetes?category=ride')}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl text-lg gap-2"
            >
              Ver Todos los Destinos RIDE
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== INFORMACIÓN RIDE ===== */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-purple-50 border-t border-violet-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                ¿Buscas el Mejor Viaje para tus 15 Años?
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Ofrecemos paquetes especiales para quinceañeras y familias, con coordinación completa, 
                seguridad garantizada y precios preferenciales para grupos grandes.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Coordinadores especializados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Seguros integrales incluidos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Actividades exclusivas</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Precios especiales por grupo</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="tel:+5492615555558"
                  onClick={handleContactClick}
                  className="bg-gradient-to-r from-violet-600 to-purple-700 text-white px-8 py-4 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Consultar para Quinceañeras
                </a>
                <a
                  href="mailto:ride@intertravel.com.ar"
                  className="bg-white text-violet-600 border-2 border-violet-500 px-8 py-4 rounded-xl font-semibold hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Enviar Email
                </a>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop&auto=format"
                alt="Grupo de Quinceañeras"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-600"></div>
                  <div className="text-gray-600">La Mejor experiencia, comienza con RIDE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
