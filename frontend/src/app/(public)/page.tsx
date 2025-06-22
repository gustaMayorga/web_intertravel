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
  Clock
} from 'lucide-react';
import ReviewsSection from '@/components/ReviewsSection';
import SchemaOrg, { useSchemaOrg } from '@/components/SchemaOrg';
import { useAnalytics } from '@/components/Analytics';

// API Configuration
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

export default function HomePage() {
  const router = useRouter();
  const { trackEvent, trackPageView } = useAnalytics();
  const { generateProductSchema } = useSchemaOrg();
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  // Carrusel de imágenes profesional
  const carouselImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop&auto=format&q=80',
      title: 'Experiencias Exclusivas',
      description: 'Diseñamos viajes únicos para clientes exigentes'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&auto=format&q=80',
      title: 'Destinos Premium',
      description: 'Acceso a lugares extraordinarios del mundo'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=600&fit=crop&auto=format&q=80',
      title: 'Servicio Personalizado',
      description: 'Atención 24/7 durante toda su experiencia'
    }
  ];

  // Destinos principales con iconos profesionales
//  const featuredDestinations = [
//    { 
//      id: 'europe', 
//      name: 'Europa Clásica', 
//      description: 'París, Roma, Londres', 
//      price: 2299, 
//      duration: '12 días',
//      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop'
//    },
//    { 
//      id: 'asia', 
//      name: 'Circuito Asiático', 
//      description: 'Tokio, Bangkok, Singapur', 
//      price: 2899, 
//      duration: '15 días',
//      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop'
//    },
//    { 
//      id: 'america', 
//      name: 'Maravillas Americanas', 
//      description: 'Cusco, Cancún, New York', 
//      price: 2199, 
//      duration: '10 días',
//      image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop'
//    }
//  ];

  // Servicios profesionales
  const services = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Garantía Total',
      description: 'Cobertura completa en todos nuestros paquetes'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Atención 24/7',
      description: 'Soporte permanente durante su viaje'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Calidad Certificada',
      description: 'Tour Operador EVyT 15.566 habilitado'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Grupos Reducidos',
      description: 'Experiencias personalizadas y exclusivas'
    }
  ];

  // Auto-play del carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Cargar paquetes
  useEffect(() => {
    loadPackages();
    trackPageView('Homepage', 'landing');
  }, []);

  const loadPackages = async () => {
    try {
      const response = await fetch(`${API_BASE}/packages/featured?limit=6`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.packages) {
          setPackages(data.packages);
        }
      }
    } catch (error) {
      console.error('Error cargando paquetes:', error);
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      trackEvent('search_packages', {
        search_term: searchQuery.trim(),
        source: 'homepage_search'
      });
      router.push(`/paquetes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleDestinationClick = (destination: any) => {
    trackEvent('destination_click', {
      destination_name: destination.name,
      source: 'homepage_destinations'
    });
    router.push(`/paquetes?category=${destination.id}`);
  };

  const handleQuizStart = () => {
    trackEvent('quiz_start', { source: 'homepage_hero' });
    setShowQuiz(true);
  };

  const handlePackageClick = (pkg: any) => {
    trackEvent('package_click', {
      package_id: pkg.id,
      package_name: pkg.title,
      package_price: pkg.price?.amount,
      source: 'homepage_featured'
    });
    router.push(`/paquetes/${pkg.id}`);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      
      {/* Schema.org for Featured Packages */}
      {packages.length > 0 && (
        <SchemaOrg 
          type="product" 
          data={generateProductSchema(packages[0])}
        />
      )}
      
      {/* Breadcrumb Schema */}
      <SchemaOrg 
        type="breadcrumb" 
        data={[
          { name: 'Inicio', url: 'https://intertravel.com.ar' },
          { name: 'Paquetes de Viaje', url: 'https://intertravel.com.ar/paquetes' }
        ]}
      />

      {/* ===== HERO SECTION PROFESIONAL ===== */}
      <section className="relative min-h-screen" style={{background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 50%, #121c2e 100%)'}}>
        
        {/* Carrusel de fondo con overlay profesional */}
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
              <div className="absolute inset-0" style={{background: 'linear-gradient(135deg, rgba(18, 28, 46, 0.85) 0%, rgba(26, 39, 66, 0.75) 50%, rgba(18, 28, 46, 0.85) 100%)'}}></div>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-6xl mx-auto px-4">
            
            {/* Logo InterTravel */}
            <div className="flex flex-col items-center mb-12">
                            
              {/* Badge profesional - reposicionado */}
              <div className="inline-flex items-center space-x-3 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-lg mb-8">
                <Award className="w-5 h-5" style={{color: '#b38144'}} />
                <span className="text-gray-800 font-semibold text-base">Tour Operador EVyT 15.566</span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
                         
              
            
            {/* Título principal */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8 text-white">
              Experiencias de Viaje
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Excepcionales
              </span>
            </h1>
            
            {/* Descripción dinámica */}
            <p className="text-xl md:text-2xl text-white/90 mb-6 font-light max-w-4xl mx-auto">
              {carouselImages[currentSlide].description}
            </p>
            
            <p className="text-lg text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              creando momentos inolvidables para viajeros exigentes. 
              Descubra destinos únicos con el respaldo de un operador certificado.
            </p>

            {/* Buscador profesional */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-white/20">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Destino, país o tipo de experiencia..."
                      className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all text-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Buscar Viajes
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleQuizStart}
                className="bg-white/95 text-blue-700 px-8 py-4 rounded-xl font-semibold hover:bg-white transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-lg"
              >
                <Globe className="w-5 h-5" />
                Descubrir Mi Viaje Ideal
              </button>
              <a
                href="/agency"
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-lg"
              >
                <Users className="w-5 h-5" />
                Portal Agencias
              </a>
            </div>
          </div>
        </div>

        {/* Indicadores del carrusel profesionales */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-blue-400 scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ===== SERVICIOS PROFESIONALES ===== */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compromiso con la excelencia en cada detalle de su experiencia de viaje
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group"
              >
                <div className="text-blue-600 mb-6 group-hover:text-blue-700 transition-colors">
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

      {/* ===== DESTINOS DESTACADOS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Destinos Más Solicitados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Circuitos cuidadosamente diseñados para brindar experiencias auténticas
            </p>
          </div>



          <div className="text-center mt-12">
            <a
              href="/paquetes"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl text-lg gap-2"
            >
              Ver Todos los Destinos
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ===== PAQUETES DESTACADOS ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Paquetes Recomendados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Selección especial de experiencias con todo incluido
            </p>
          </div>

          {packagesLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.slice(0, 6).map((pkg: any) => (
                <div
                  key={pkg.id}
                  onClick={() => handlePackageClick(pkg)}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 group"
                >
                  <div 
                    className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden"
                    style={{
                      backgroundImage: pkg.images?.main ? `url(${pkg.images.main})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-blue-600/20 group-hover:bg-blue-600/10 transition-colors"></div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold">4.9</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {pkg.title || 'Experiencia Premium'}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {pkg.description?.short || 'Viaje todo incluido con experiencias únicas'}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold text-blue-600">
                        USD ${pkg.price?.amount?.toLocaleString() || '2,499'}
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <Plane className="w-4 h-4" />
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== SECCIÓN DE OPINIONES ===== */}
      <ReviewsSection 
        showAll={false} 
        limit={3} 
        className="bg-gradient-to-br from-slate-50 to-blue-50"
      />

      {/* ===== INFORMACIÓN PARA AGENCIAS ===== */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50 border-t border-amber-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                ¿Eres Agencia de Viajes?
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Únete a nuestra red de agencias partners y accede a tarifas preferenciales, 
                comisiones atractivas y soporte especializado para hacer crecer tu negocio.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Comisiones hasta 15%</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Plataforma B2B exclusiva</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Soporte comercial personalizado</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-gray-700">Material promocional gratuito</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/agency"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Registrar Agencia
                </a>
                <a
                  href="tel:+5492615555558"
                  className="bg-white text-amber-600 border-2 border-amber-500 px-8 py-4 rounded-xl font-semibold hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Llamar Ahora
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
                  <div className="text-3xl font-bold text-amber-600">500+</div>
                  <div className="text-gray-600">Agencias Partners</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== QUIZ MODAL PROFESIONAL ===== */}
      {showQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md">
            <div className="text-center mb-6">
              <Globe className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Descubra Su Destino Ideal
              </h2>
              <p className="text-gray-600">
                Responda unas breves preguntas para recibir recomendaciones personalizadas
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              <p className="text-gray-900 font-semibold">¿Qué tipo de experiencia busca?</p>
              <div className="space-y-3">
                <button className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 rounded-xl text-left transition-all">
                  🏖️ Relajación en destinos paradisíacos
                </button>
                <button className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 rounded-xl text-left transition-all">
                  🏛️ Cultura e historia antigua
                </button>
                <button className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 rounded-xl text-left transition-all">
                  🏔️ Aventura y naturaleza
                </button>
                <button className="w-full p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 rounded-xl text-left transition-all">
                  🍷 Gastronomía y experiencias premium
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowQuiz(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowQuiz(false);
                  router.push('/paquetes?source=quiz');
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

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