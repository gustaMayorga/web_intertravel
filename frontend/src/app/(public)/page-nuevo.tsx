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
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import ReviewsSection from '@/components/ReviewsSection';
import SchemaOrg, { useSchemaOrg } from '@/components/SchemaOrg';
import { useAnalytics } from '@/components/Analytics';
import EditableDestinations from '@/components/EditableDestinations';
import EditableTestimonials from '@/components/EditableTestimonials';
import AdvancedSearchSystem from '@/components/AdvancedSearchSystem';
import PackageDetailsModal from '@/components/PackageDetailsModal';

// API Configuration
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

export default function HomePage() {
  const router = useRouter();
  const { trackEvent, trackPageView } = useAnalytics();
  const { generateProductSchema } = useSchemaOrg();
  
  // Estados del componente
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [recommendedPackages, setRecommendedPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedPackageData, setSelectedPackageData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NUEVO: Media del Hero (imagen-video-imagen)
  const heroMedia = [
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop&auto=format&q=80',
      title: 'Destinos Únicos',
      subtitle: 'Tu próxima aventura te espera'
    },
    {
      type: 'video',
      url: '/videos/hero-testimonios.mp4', // Video a crear
      poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&auto=format&q=80',
      title: 'Experiencias Reales',
      subtitle: 'Clientes satisfechos desde 2008'
    },
    {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&auto=format&q=80',
      title: 'Servicio Premium',
      subtitle: 'Tour Operador Certificado EVyT 15.566'
    }
  ];

  // Rotación automática del hero cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % heroMedia.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Cargar destinos destacados desde el admin
  useEffect(() => {
    fetchFeaturedDestinations();
    fetchRecommendedPackages();
    trackPageView('landing');
  }, []);

  const fetchFeaturedDestinations = async () => {
    try {
      console.log('🔍 Cargando destinos destacados desde admin...');
      const response = await fetch(`${API_BASE}/admin/destinations?limit=3`);
      const data = await response.json();
      
      if (data.success && data.destinations.length > 0) {
        setFeaturedDestinations(data.destinations.slice(0, 3));
        console.log('✅ Destinos desde admin cargados:', data.destinations.length);
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
            image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop'
          }
        ]);
        console.log('⚠️ Usando destinos fallback');
      }
    } catch (error) {
      console.error('❌ Error cargando destinos:', error);
      setFeaturedDestinations([]);
    }
  };

  const fetchRecommendedPackages = async () => {
    try {
      console.log('📦 Cargando paquetes recomendados desde Travel Compositor...');
      const response = await fetch(`${API_BASE}/packages/featured?limit=6`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setRecommendedPackages(data.data);
        console.log('✅ Paquetes TC cargados:', data.data.length);
      } else {
        console.log('⚠️ Sin paquetes de TC, intentando paquetes generales...');
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

  const handleSearch = (query) => {
    console.log('🔍 Búsqueda desde hero:', query);
    trackEvent('search', 'hero_search', query);
    router.push(`/paquetes?search=${encodeURIComponent(query)}`);
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

      {/* ===== HERO MULTIMEDIA ===== */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Media Background */}
        <div className="absolute inset-0">
          {currentMedia.type === 'video' ? (
            <video
              key={currentMediaIndex}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              poster={currentMedia.poster}
            >
              <source src={currentMedia.url} type="video/mp4" />
              <img src={currentMedia.poster} alt="Video poster" className="w-full h-full object-cover" />
            </video>
          ) : (
            <img
              src={currentMedia.url}
              alt={currentMedia.title}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Overlay sutil para legibilidad */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Contenido del Hero */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {currentMedia.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 font-light">
            {currentMedia.subtitle}
          </p>

          {/* Buscador integrado */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="¿A dónde quieres viajar?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 px-6 rounded-xl bg-white text-gray-900 text-lg font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                />
              </div>
              <button
                onClick={() => handleSearch(searchQuery)}
                className="h-14 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Search className="w-5 h-5" />
                <span className="hidden md:inline">Buscar</span>
              </button>
            </div>
          </div>

          {/* Navegación del carousel */}
          <div className="flex justify-center gap-3">
            {heroMedia.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Controles del carousel */}
        <button
          onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + heroMedia.length) % heroMedia.length)}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 text-white transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % heroMedia.length)}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 text-white transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>

      {/* ===== DESTINOS MÁS SOLICITADOS ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Destinos Más Solicitados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre los destinos favoritos de nuestros viajeros, seleccionados especialmente para ti
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredDestinations.map((destination) => (
              <div
                key={destination.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
                onClick={() => handleSearch(destination.name)}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={destination.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'}
                    alt={destination.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-2xl font-bold mb-1">{destination.name}</h3>
                    <p className="text-white/90">{destination.description}</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{destination.country}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <span className="font-semibold">{destination.packageCount} paquetes</span>
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Paquetes Recomendados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Los mejores paquetes seleccionados por nuestros expertos en viajes
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendedPackages.slice(0, 6).map((pkg) => (
                <div
                  key={pkg.id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100"
                  onClick={() => openPackageModal(pkg)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {pkg.featured && (
                      <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Destacado
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {pkg.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {typeof pkg.description === 'object' ? pkg.description.short || pkg.description.full || '' : pkg.description || ''}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{typeof pkg.duration === 'object' ? pkg.duration.days || pkg.duration : pkg.duration || '7'} días</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">
                          {pkg.rating?.average || '4.8'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-blue-600">
                        ${typeof pkg.price === 'object' ? pkg.price.amount?.toLocaleString() || '2,299' : pkg.price?.toLocaleString() || '2,299'}
                        </span>
                        <span className="text-gray-500 ml-1">{typeof pkg.price === 'object' ? pkg.price.currency || 'USD' : pkg.currency || 'USD'}</span>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        Ver Detalles
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/paquetes')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Ver Todos Los Paquetes
            </button>
          </div>
        </div>
      </section>

      {/* ===== POR QUÉ ELEGIRNOS ===== */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por Qué Elegir InterTravel?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Más de 15 años de experiencia creando viajes inolvidables
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Certificados</h3>
              <p className="text-gray-600">Tour Operador Certificado EVyT 15.566</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">500+ Agencias</h3>
              <p className="text-gray-600">Red de partners en todo el país</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">98% Satisfacción</h3>
              <p className="text-gray-600">Clientes recomiendan nuestros servicios</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 Soporte</h3>
              <p className="text-gray-600">Atención personalizada siempre</p>
            </div>
          </div>

          {/* Certificaciones prominentes */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Certificaciones Oficiales
              </h3>
              <p className="text-gray-600">
                Operamos bajo las más altas regulaciones turísticas
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="flex items-center gap-4 bg-blue-50 px-6 py-4 rounded-xl">
                <Award className="w-12 h-12 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">EVyT 15.566</div>
                  <div className="text-gray-700">Empresa de Viajes y Turismo</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-green-50 px-6 py-4 rounded-xl">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">Legajo 15.566</div>
                  <div className="text-gray-700">Registro Nacional de Turismo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== B2B CORPORATIVO ===== */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-6">
                Soluciones Corporativas
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Programas especializados para agencias de viajes y empresas. 
                Incrementa tus ventas con nuestro catálogo premium.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-blue-100">Comisiones competitivas y transparentes</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-blue-100">Soporte técnico y comercial dedicado</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-blue-100">Plataforma B2B con gestión integral</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-blue-100">Capacitación continua y material promocional</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/b2b')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Users className="w-5 h-5" />
                  Únete a Nuestra Red
                </button>
                <a
                  href="tel:+5492615555558"
                  className="bg-white text-blue-600 border-2 border-blue-500 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Contacto Comercial
                </a>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=400&fit=crop&auto=format"
                alt="Agencias de Viajes"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-gray-600">Agencias Partners</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== EXPERIENCIAS DE USUARIOS REALES ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Experiencias de Usuarios Reales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Descubre lo que dicen nuestros clientes sobre sus viajes con InterTravel
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

      {/* Estilos adicionales */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
