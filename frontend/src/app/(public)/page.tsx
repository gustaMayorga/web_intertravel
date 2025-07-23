'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Shield, 
  Star, 
  MapPin, 
  Users, 
  Award,
  ArrowRight,
  CheckCircle,
  Phone,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  Heart
} from 'lucide-react';
import SchemaOrg from '@/components/SchemaOrg';
import { useAnalytics } from '@/components/Analytics';
import EditableTestimonials from '@/components/EditableTestimonials';
import UnifiedSearchSystem from '@/components/UnifiedSearchSystem';
import PackageDetailsModal from '@/components/PackageDetailsModal';
import AppSection from '@/components/AppSection';

// API Configuration
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

export default function HomePage() {
  const router = useRouter();
  const { trackEvent, trackPageView } = useAnalytics();
  
  // Estados del componente
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [recommendedPackages, setRecommendedPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedPackageData, setSelectedPackageData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Media del Hero simplificado para móvil
  const heroMedia = [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format&q=80',
      title: 'Destinos Únicos',
      subtitle: 'Tu próxima aventura te espera'
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format&q=80',
      title: 'Experiencias Reales',
      subtitle: '23K+ horas cumpliendo sueños'
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&auto=format&q=80',
      title: 'Servicio Premium',
      subtitle: 'EVyT 15.566 Certificado'
    }
  ];

  // Rotación automática del hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % heroMedia.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos
  useEffect(() => {
    fetchFeaturedDestinations();
    fetchRecommendedPackages();
    trackPageView('landing');
  }, []);

  const fetchFeaturedDestinations = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/destinations?limit=3`);
      const data = await response.json();
      
      if (data.success && data.destinations.length > 0) {
        setFeaturedDestinations(data.destinations.slice(0, 3));
      } else {
        // Fallback: destinos por defecto
        setFeaturedDestinations([
          { 
            id: 1, 
            name: 'Perú Mágico', 
            description: 'Machu Picchu y Cusco', 
            country: 'Perú',
            packageCount: 18,
            image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=300&fit=crop'
          },
          { 
            id: 2, 
            name: 'Mendoza Wine', 
            description: 'Capital del vino argentino', 
            country: 'Argentina',
            packageCount: 12,
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
          },
          { 
            id: 3, 
            name: 'Europa Clásica', 
            description: 'París, Roma, Londres', 
            country: 'Europa',
            packageCount: 25,
            image: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=400&h=300&fit=crop&auto=format&q=80'
          }
        ]);
      }
    } catch (error) {
      console.error('❌ Error cargando destinos:', error);
      setFeaturedDestinations([]);
    }
  };

  const fetchRecommendedPackages = async () => {
    try {
      const response = await fetch(`${API_BASE}/packages/featured?limit=6`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setRecommendedPackages(data.data);
      } else {
        const fallbackResponse = await fetch(`${API_BASE}/packages?limit=6`);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success) {
          setRecommendedPackages(fallbackData.data || []);
        }
      }
    } catch (error) {
      console.error('❌ Error cargando paquetes recomendados:', error);
      setRecommendedPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const openPackageModal = (packageData) => {
    setSelectedPackageData(packageData);
    setSelectedPackageId(packageData.id);
    setIsModalOpen(true);
  };

  const closePackageModal = () => {
    setIsModalOpen(false);
    setSelectedPackageId(null);
    setSelectedPackageData(null);
  };

  const currentMedia = heroMedia[currentMediaIndex];

  return (
    <div className="min-h-screen bg-white">
      {/* Schema.org Markup */}
      <SchemaOrg />

      {/* ===== HERO SIMPLIFICADO MOBILE-FIRST ===== */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        {/* Media Background - Optimizada para móvil */}
        <div className="absolute inset-0">
          <img
            src={currentMedia.url}
            alt={currentMedia.title}
            className="w-full h-full object-cover"
          />
          {/* Overlay más fuerte para legibilidad en móvil */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Contenido Principal */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-6 max-w-6xl mx-auto w-full">
          
          {/* Hero Content */}
          <div className="text-center text-white mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {currentMedia.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 font-light max-w-2xl mx-auto">
              {currentMedia.subtitle}
            </p>

            {/* Sistema de Búsqueda Unificado - Optimizado para móvil */}
            <div className="mb-8">
              <UnifiedSearchSystem
                mode="landing"
                onSearch={(query, filters) => {
                  trackEvent('advanced_search', {
                    search_term: query,
                    filters: filters,
                    source: 'homepage_hero'
                  });
                  router.push(`/paquetes?q=${encodeURIComponent(query)}`);
                }}
                className="max-w-2xl mx-auto"
                showFilters={false} // Simplificado para móvil
                autoFocus={false}
              />
            </div>

            {/* Navegación del carousel */}
            <div className="flex justify-center gap-2 mb-8">
              {heroMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                    index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Controles del carousel - Solo desktop */}
        <button
          onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + heroMedia.length) % heroMedia.length)}
          className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 text-white transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % heroMedia.length)}
          className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 text-white transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* ===== CARDS DE OFERTAS ESPECIALES ===== */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              🔥 Ofertas Especiales
            </h2>
            <p className="text-gray-600">¡Aprovecha estas oportunidades únicas!</p>
          </div>

          {/* Cards responsivas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Oferta Flash */}
            <div className="group bg-gradient-to-br from-red-500 to-red-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1">
              <div className="relative h-32 sm:h-40 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&auto=format&q=80"
                  alt="Mendoza Wine"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent"></div>
                <div className="absolute top-2 right-2 bg-yellow-400 text-red-900 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                  ¡FLASH!
                </div>
                <div className="absolute bottom-2 left-3 text-white">
                  <h3 className="text-base sm:text-lg font-bold mb-1">🔥 MENDOZA WINE</h3>
                  <p className="text-white/90 text-xs sm:text-sm">¡Solo por 48 horas!</p>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-xl sm:text-2xl font-bold">20% OFF</div>
                    <div className="text-xs opacity-90">Era $2,500 → $2,000</div>
                  </div>
                  <div className="bg-white text-red-600 px-3 py-1 rounded-lg font-bold text-sm hover:bg-red-50 transition-colors">
                    ¡COMPRÁ!
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Últimas Plazas */}
            <div className="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1">
              <div className="relative h-32 sm:h-40 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=200&fit=crop&auto=format&q=80"
                  alt="Perú Machu Picchu"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 to-transparent"></div>
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-bounce">
                  ⚡ URGENTE
                </div>
                <div className="absolute bottom-2 left-3 text-white">
                  <h3 className="text-base sm:text-lg font-bold mb-1">⚡ PERÚ MÁGICO</h3>
                  <p className="text-white/90 text-xs sm:text-sm">Solo quedan 3 lugares</p>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-lg sm:text-xl font-bold">ÚLTIMAS PLAZAS</div>
                    <div className="text-xs opacity-90">Salida 15 de Agosto</div>
                  </div>
                  <div className="bg-white text-orange-600 px-3 py-1 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors">
                    ¡RESERVÁ!
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Oferta Especial */}
            <div className="group bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="relative h-32 sm:h-40 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1549144511-f099e773c147?w=400&h=200&fit=crop&auto=format&q=80"
                  alt="Europa Clásica"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent"></div>
                <div className="absolute top-2 right-2 bg-yellow-400 text-green-900 px-2 py-1 rounded-full text-xs font-bold">
                  🎯 ESPECIAL
                </div>
                <div className="absolute bottom-2 left-3 text-white">
                  <h3 className="text-base sm:text-lg font-bold mb-1">🎯 EUROPA PREMIUM</h3>
                  <p className="text-white/90 text-xs sm:text-sm">12 cuotas sin interés</p>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="text-lg sm:text-xl font-bold">SIN INTERÉS</div>
                    <div className="text-xs opacity-90">Hasta 12 cuotas</div>
                  </div>
                  <div className="bg-white text-green-600 px-3 py-1 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors">
                    ¡FINANCIÁ!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DESTINOS MÁS SOLICITADOS ===== */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Destinos Más Solicitados
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre los destinos favoritos de nuestros viajeros
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredDestinations.map((destination) => (
              <div
                key={destination.id}
                className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                onClick={() => router.push(`/paquetes?search=${encodeURIComponent(destination.name)}`)}
              >
                <div className="relative h-48 sm:h-64 overflow-hidden">
                  <img
                    src={destination.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl sm:text-2xl font-bold mb-1">{destination.name}</h3>
                    <p className="text-white/90 text-sm sm:text-base">{destination.description}</p>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm sm:text-base">{destination.country}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <span className="font-semibold text-sm sm:text-base">{destination.packageCount} paquetes</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PAQUETES RECOMENDADOS ===== */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Paquetes Recomendados
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Los mejores paquetes seleccionados por nuestros expertos
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {recommendedPackages.slice(0, 6).map((pkg) => (
                <div
                  key={pkg.id}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                  onClick={() => openPackageModal(pkg)}
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img
                      src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {pkg.featured && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Destacado
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 text-white transition-all">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {pkg.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm sm:text-base">
                      {typeof pkg.description === 'object' ? pkg.description.short || pkg.description.full || '' : pkg.description || ''}
                    </p>
                    <div className="flex items-center justify-between mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{typeof pkg.duration === 'object' ? pkg.duration.days || pkg.duration : pkg.duration || '7'} días</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-gray-600">
                          {pkg.rating?.average || '4.8'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl sm:text-2xl font-bold text-blue-600">
                          ${typeof pkg.price === 'object' ? pkg.price.amount?.toLocaleString() || '2,299' : pkg.price?.toLocaleString() || '2,299'}
                        </span>
                        <span className="text-gray-500 ml-1 text-sm">{typeof pkg.price === 'object' ? pkg.price.currency || 'USD' : pkg.currency || 'USD'}</span>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base">
                        Ver Detalles
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={() => router.push('/paquetes')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Ver Todos Los Paquetes
            </button>
          </div>
        </div>
      </section>

      {/* ===== POR QUÉ ELEGIRNOS ===== */}
      <section className="py-12 sm:py-20 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              ¿Por Qué Elegir InterTravel?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              23K+ horas cumpliendo sueños de viajeros
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Certificados</h3>
              <p className="text-gray-600 text-sm sm:text-base">Tour Operador EVyT 15.566</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">200+ Agencias</h3>
              <p className="text-gray-600 text-sm sm:text-base">Red nacional</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">3000+ Clientes</h3>
              <p className="text-gray-600 text-sm sm:text-base">Viajeros satisfechos</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">24/7 Soporte</h3>
              <p className="text-gray-600 text-sm sm:text-base">Siempre disponibles</p>
            </div>
          </div>

          {/* Certificaciones */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Certificaciones Oficiales
              </h3>
              <p className="text-gray-600">
                Operamos bajo las más altas regulaciones turísticas
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="flex items-center gap-4 bg-blue-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl">
                <Award className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">EVyT 15.566</div>
                  <div className="text-gray-700 text-sm sm:text-base">Empresa de Viajes y Turismo</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-green-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl">
                <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">Legajo 15.566</div>
                  <div className="text-gray-700 text-sm sm:text-base">Registro Nacional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== B2B CORPORATIVO - Simplificado para móvil ===== */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-white order-2 lg:order-1">
              <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6">
                Soluciones Corporativas
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8">
                Únete a nuestra red de 200+ agencias partners
              </p>
              
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100 text-sm sm:text-base">Comisiones competitivas</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100 text-sm sm:text-base">Soporte dedicado 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100 text-sm sm:text-base">Plataforma B2B integral</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/b2b')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Users className="w-5 h-5" />
                  Únete a Nuestra Red
                </button>
                <a
                  href="tel:+5492615555558"
                  className="bg-white text-blue-600 border-2 border-blue-500 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Contacto Comercial
                </a>
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop&auto=format"
                alt="Agencias de Viajes"
                className="rounded-xl sm:rounded-2xl shadow-2xl w-full"
              />
              <div className="absolute -bottom-4 -left-4 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">200+</div>
                  <div className="text-gray-600 text-sm sm:text-base">Agencias Partners</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN APP CLIENTE ===== */}
      <AppSection />

      {/* ===== TESTIMONIOS ===== */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
              Experiencias de Usuarios Reales
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre lo que dicen nuestros clientes
            </p>
          </div>

          <EditableTestimonials />
        </div>
      </section>

      {/* Modal de detalles del paquete */}
      <PackageDetailsModal
        packageId={selectedPackageId}
        packageData={selectedPackageData}
        isOpen={isModalOpen}
        onClose={closePackageModal}
      />

      {/* Estilos adicionales para mobile-first */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Optimizaciones móvil */
        @media (max-width: 640px) {
          .text-shadow {
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          }
        }
      `}</style>
    </div>
  );
}