'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import SmartSearch from '@/components/search/SmartSearch';

// URL del mapa mundial (TopoJSON)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json";

// API Configuration
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

// Destinos con coordenadas reales
const destinations = [
  { 
    id: 'paris',
    name: 'París', 
    country: 'Francia', 
    coordinates: [2.3522, 48.8566], 
    price: 1299, 
    packages: 12
  },
  { 
    id: 'tokyo',
    name: 'Tokio', 
    country: 'Japón', 
    coordinates: [139.6917, 35.6895], 
    price: 2199, 
    packages: 8
  },
  { 
    id: 'cusco',
    name: 'Cusco', 
    country: 'Perú', 
    coordinates: [-71.9675, -13.5319], 
    price: 1890, 
    packages: 15
  },
  { 
    id: 'cancun',
    name: 'Cancún', 
    country: 'México', 
    coordinates: [-86.8515, 21.1619], 
    price: 1494, 
    packages: 18
  },
  { 
    id: 'bariloche',
    name: 'Bariloche', 
    country: 'Argentina', 
    coordinates: [-71.3103, -41.1335], 
    price: 899, 
    packages: 10
  }
];

// Carrusel de imágenes (editable desde admin)
const defaultCarouselImages = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&auto=format&q=80',
    title: 'Destinos Únicos',
    description: 'Experiencias premium que transforman vidas'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop&auto=format&q=80',
    title: 'Aventuras Épicas',
    description: 'Vive momentos extraordinarios'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop&auto=format&q=80',
    title: 'Playas Paradisíacas',
    description: 'Relájate en destinos únicos'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=600&fit=crop&auto=format&q=80',
    title: 'Cultura Auténtica',
    description: 'Sumérgete en tradiciones milenarias'
  }
];

const IntelligentQuiz = React.lazy(() => import('@/components/quiz/IntelligentQuiz'));

export default function HomePage() {
  const router = useRouter();
  const [showQuiz, setShowQuiz] = useState(false);
  const [hoveredDestination, setHoveredDestination] = useState(null);
  
  // Estados para carrusel
  const [carouselImages, setCarouselImages] = useState(defaultCarouselImages);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Estados para paquetes
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState(null);
  const [packagesSource, setPackagesSource] = useState('');

  // Cargar imágenes del carrusel desde admin (simulado)
  useEffect(() => {
    loadCarouselFromAdmin();
  }, []);

  // Cargar paquetes desde Travel Compositor
  useEffect(() => {
    loadPackagesFromTravelCompositor();
  }, []);

  // Auto-play del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Función para cargar carrusel desde admin
  const loadCarouselFromAdmin = async () => {
    try {
      // En el futuro esto se conectará al admin panel
      // const response = await fetch(`${API_BASE}/admin/carousel-images`);
      // const data = await response.json();
      // if (data.success) {
      //   setCarouselImages(data.images);
      // }
      
      console.log('🎠 Carrusel cargado desde configuración por defecto');
    } catch (error) {
      console.error('Error cargando carrusel:', error);
    }
  };

  // Función para cargar paquetes desde Travel Compositor
  const loadPackagesFromTravelCompositor = async () => {
    try {
      setPackagesLoading(true);
      setPackagesError(null);
      
      console.log('🔍 Cargando primeros 10 paquetes desde Travel Compositor...');
      
      const response = await fetch(`${API_BASE}/packages/featured?limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Paquetes recibidos:', data);
      
      if (data.success && data.packages && data.packages.length > 0) {
        setPackages(data.packages.slice(0, 10)); // Asegurar solo 10
        setPackagesSource(data._source);
      } else {
        throw new Error('No se encontraron paquetes válidos');
      }
      
    } catch (error) {
      console.error('❌ Error cargando paquetes:', error);
      setPackagesError(error.message);
      setPackages([]); // Limpiar paquetes en caso de error
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleSearch = async (query: string, filters?: any) => {
    console.log('🔍 Búsqueda:', query, filters);
    
    try {
      const params = new URLSearchParams();
      params.set('q', query);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && (Array.isArray(value) ? value.length > 0 : true)) {
            params.set(key, Array.isArray(value) ? value.join(',') : String(value));
          }
        });
      }
      
      router.push(`/paquetes?${params.toString()}`);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }
  };

  const handleDestinationClick = (destination: any) => {
    console.log('🌍 Destino seleccionado:', destination);
    
    const params = new URLSearchParams({
      destination: destination.name,
      country: destination.country,
      lat: destination.coordinates[1].toString(),
      lng: destination.coordinates[0].toString(),
      price: destination.price.toString(),
      packages: destination.packages.toString(),
      source: 'world_map'
    });
    
    router.push(`/paquetes?${params.toString()}`);
  };

  const handleQuizComplete = (result: any) => {
    console.log('🧠 Quiz completado:', result);
    setShowQuiz(false);
    
    const params = new URLSearchParams();
    params.set('style', result.travelStyle);
    params.set('budget', result.budget);
    if (result.duration) params.set('duration', result.duration);
    params.set('source', 'intelligent_quiz');
    
    router.push(`/paquetes?${params.toString()}`);
  };

  const handlePackageClick = (packageId: string) => {
    console.log('📦 Paquete seleccionado:', packageId);
    router.push(`/paquetes/${packageId}`);
  };

  // Funciones del carrusel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#121c2e]/95 backdrop-blur-md border-b border-[#b38144]/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#eeba2b] to-[#b38144] rounded-lg flex items-center justify-center">
              <span className="text-[#121c2e] font-bold text-lg">IT</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg">InterTravel</div>
              <div className="text-[#c0c0c0] text-xs">Tour Operador EVyT 15.566</div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-white hover:text-[#eeba2b] transition-colors font-medium">Inicio</a>
            <a href="/paquetes" className="text-white hover:text-[#eeba2b] transition-colors font-medium">Paquetes</a>
            <a href="/nosotros" className="text-white hover:text-[#eeba2b] transition-colors font-medium">Nosotros</a>
            
            {/* Botón Portal Agencias */}
            <button className="bg-gradient-to-r from-[#eeba2b] to-[#b38144] text-[#121c2e] px-6 py-2 rounded-full font-bold hover:scale-105 transition-all">
              Portal Agencias
            </button>
            
            <a 
              href="https://wa.me/5492611234567" 
              target="_blank"
              className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors font-medium"
            >
              💬 WhatsApp
            </a>
          </nav>
        </div>
      </header>

      {/* HERO SECTION CON CARRUSEL Y MAPA */}
      <section className="min-h-screen relative pt-16">
        
        {/* CARRUSEL DE IMÁGENES EDITABLE DESDE ADMIN */}
        <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
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
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#121c2e]/80 via-[#121c2e]/50 to-transparent"></div>
              
              {/* Contenido del slide */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 w-full">
                  <div className="max-w-2xl">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                      {image.title}
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                      {image.description}
                    </p>
                    <button 
                      onClick={() => router.push('/paquetes')}
                      className="bg-gradient-to-r from-[#eeba2b] to-[#b38144] text-[#121c2e] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all"
                    >
                      Explorar Destinos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Controles del carrusel */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all z-20"
          >
            ‹
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all z-20"
          >
            ›
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-[#eeba2b] scale-125' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* MAPAMUNDI INTERACTIVO EN HERO */}
        <div className="relative h-[40vh] md:h-[50vh] w-full bg-gradient-to-b from-[#1e3a8a] to-[#1e40af]">
          <ComposableMap
            projectionConfig={{
              scale: 130,
              center: [0, 20]
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#2563eb"
                    stroke="#b38144"
                    strokeWidth={0.8}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#1d4ed8" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Marcadores de destinos */}
            {destinations.map((destination) => (
              <Marker
                key={destination.id}
                coordinates={destination.coordinates}
                onMouseEnter={() => setHoveredDestination(destination)}
                onMouseLeave={() => setHoveredDestination(null)}
                onClick={() => handleDestinationClick(destination)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={8}
                  fill="#eeba2b"
                  stroke="#ffffff"
                  strokeWidth={3}
                  className="animate-pulse hover:scale-150 transition-all duration-300"
                />
                <circle
                  r={16}
                  fill="rgba(238, 186, 43, 0.3)"
                  className="animate-ping"
                />
              </Marker>
            ))}
          </ComposableMap>

          {/* Tooltip de destino */}
          {hoveredDestination && (
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-[#eeba2b]/30 rounded-2xl p-6 max-w-sm z-20">
              <h3 className="text-2xl font-bold text-[#eeba2b] mb-2">
                {hoveredDestination.name}
              </h3>
              <p className="text-white/80 mb-4">{hoveredDestination.country}</p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-white/70">Desde:</span>
                  <span className="text-[#eeba2b] font-bold">USD {hoveredDestination.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Paquetes:</span>
                  <span className="text-white">{hoveredDestination.packages} opciones</span>
                </div>
              </div>
              <button
                onClick={() => handleDestinationClick(hoveredDestination)}
                className="w-full bg-gradient-to-r from-[#eeba2b] to-[#b38144] text-[#121c2e] font-bold py-3 rounded-xl hover:scale-105 transition-all duration-300"
              >
                Ver Paquetes
              </button>
            </div>
          )}

          {/* Instrucciones del mapa */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full border border-[#eeba2b]/30">
              <span className="text-[#eeba2b]">💡</span> Explora destinos en el mapa interactivo
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL SIMPLIFICADO */}
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2 z-30 max-w-md">
          {/* Badge oficial */}
          <div className="inline-flex items-center space-x-2 bg-[#b38144]/20 backdrop-blur-md px-4 py-2 rounded-full border border-[#eeba2b]/30 mb-6">
            <span className="text-lg">🏆</span>
            <span className="text-white font-medium text-sm">Tour Operador EVyT 15.566</span>
          </div>
          
          {/* Título */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            <span className="bg-gradient-to-r from-[#eeba2b] via-[#b38144] to-[#c8651b] bg-clip-text text-transparent">
              InterTravel
            </span>
            <br />
            <span className="text-white">Premium</span>
          </h1>
          
          {/* Descripción concisa */}
          <p className="text-lg text-white/90 mb-6">
            Tu destino perfecto te espera
          </p>

          {/* Búsqueda */}
          <div className="mb-6">
            <SmartSearch
              onSearch={handleSearch}
              placeholder="¿A dónde quieres viajar?"
              className="w-full"
            />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowQuiz(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#eeba2b] to-[#b38144] text-[#121c2e] font-bold rounded-full hover:scale-105 transition-all"
            >
              🧠 Quiz Inteligente
            </button>
            
            <a 
              href="/paquetes"
              className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-semibold hover:bg-white/20 transition-all text-center"
            >
              ✈️ Ver Paquetes
            </a>
          </div>
        </div>
      </section>

      {/* PAQUETES DESDE TRAVEL COMPOSITOR - PRIMEROS 10 */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#121c2e] mb-4">
              Paquetes Premium
            </h2>
            <p className="text-xl text-gray-600">
              Los primeros 10 destinos desde Travel Compositor
            </p>
            
            {/* Indicador de fuente */}
            {packagesSource && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm">
                <span className={`mr-2 ${packagesSource === 'travel-compositor' ? 'text-green-600' : 'text-orange-600'}`}>
                  {packagesSource === 'travel-compositor' ? '✅' : '⚠️'}
                </span>
                Fuente: {packagesSource === 'travel-compositor' ? 'Travel Compositor' : 'Fallback Data'}
                <span className="ml-2 text-gray-500">• {packages.length} paquetes</span>
              </div>
            )}
          </div>

          {/* Loading State */}
          {packagesLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b38144] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando paquetes desde Travel Compositor...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {packagesError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Error cargando paquetes</h3>
              <p className="text-red-600 mb-4">No se pudieron cargar los paquetes desde Travel Compositor.</p>
              <p className="text-sm text-red-500 mb-4"><strong>Error:</strong> {packagesError}</p>
              <button
                onClick={loadPackagesFromTravelCompositor}
                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                🔄 Reintentar
              </button>
            </div>
          )}

          {/* Packages Grid */}
          {!packagesLoading && !packagesError && packages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => handlePackageClick(pkg.id)}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  {/* Imagen */}
                  <div 
                    className="h-48 bg-gradient-to-br from-[#121c2e] to-[#1e40af] relative overflow-hidden"
                    style={{
                      backgroundImage: pkg.images?.main ? `url(${pkg.images.main})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Badge de duración */}
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {pkg.duration?.days || 5} días
                    </div>
                    
                    {/* Emoji de destino */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">
                        {pkg.country === 'Francia' ? '🇫🇷' :
                         pkg.country === 'Japón' ? '🇯🇵' :
                         pkg.country === 'Perú' ? '🇵🇪' :
                         pkg.country === 'México' ? '🇲🇽' :
                         pkg.country === 'Argentina' ? '🇦🇷' : '🌍'}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-5">
                    {/* Categoría */}
                    <span className="inline-block bg-[#eeba2b] text-[#121c2e] px-3 py-1 rounded-full text-xs font-bold uppercase mb-3">
                      {pkg.category || 'Premium'}
                    </span>
                    
                    {/* Título */}
                    <h3 className="text-xl font-bold text-[#121c2e] mb-2 line-clamp-2">
                      {pkg.title}
                    </h3>
                    
                    {/* Descripción */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {pkg.description?.short || pkg.description?.full || 'Experiencia única e inolvidable'}
                    </p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-[#b38144]">
                          ${pkg.price?.amount?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pkg.price?.currency || 'USD'} por persona
                        </div>
                      </div>
                      
                      <button className="bg-gradient-to-r from-[#eeba2b] to-[#b38144] text-[#121c2e] px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-all">
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ver todos los paquetes */}
          {!packagesLoading && packages.length > 0 && (
            <div className="text-center mt-12">
              <a
                href="/paquetes"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#eeba2b] to-[#b38144] text-[#121c2e] font-bold rounded-full hover:scale-105 transition-all text-lg"
              >
                Ver Todos los Paquetes
                <span className="ml-2">→</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Quiz Modal */}
      {showQuiz && (
        <React.Suspense fallback={<div>Cargando quiz...</div>}>
          <IntelligentQuiz
            onComplete={handleQuizComplete}
            onClose={() => setShowQuiz(false)}
          />
        </React.Suspense>
      )}
    </div>
  );
}