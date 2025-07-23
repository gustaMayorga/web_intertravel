'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  Share2, 
  Star, 
  MapPin, 
  Calendar, 
  Users, 
  Clock, 
  Wifi, 
  Car, 
  Utensils, 
  Camera,
  Plane,
  Shield,
  CheckCircle,
  Phone,
  MessageCircle,
  Mail,
  ArrowLeft,
  ArrowRight,
  Play
} from 'lucide-react';

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

const PackageDetailsModal = ({ packageId, isOpen, onClose, packageData: initialData }) => {
  const [packageData, setPackageData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // Usar datos iniciales si están disponibles
  useEffect(() => {
    if (initialData) {
      console.log('🎯 Modal: Usando datos iniciales:', initialData);
      setPackageData(initialData);
    } else if (isOpen && packageId) {
      console.log('🎯 Modal: Cargando datos para ID:', packageId);
      fetchPackageDetails();
    }
  }, [isOpen, packageId, initialData]);

  const fetchPackageDetails = async () => {
    if (!packageId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching package details for:', packageId);
      const response = await fetch(`${API_BASE}/packages/${packageId}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Package data received:', data);
      
      if (data.success) {
        setPackageData(data.package);
      } else {
        throw new Error(data.error || 'Error obteniendo detalles');
      }
    } catch (err) {
      console.error('❌ Error fetching package:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPackageData(null);
    setError(null);
    setActiveTab('overview');
    setCurrentImageIndex(0);
    setShowImageGallery(false);
    onClose();
  };

  const handleWhatsAppContact = () => {
    const message = `Hola! Me interesa el paquete "${packageData?.title || 'Paquete de viaje'}" ${packageData?.destination ? `a ${packageData.destination}` : ''}. ¿Podrían darme más información?`;
    const url = `https://wa.me/+5491112345678?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share && packageData) {
      try {
        await navigator.share({
          title: packageData.title,
          text: packageData.description || 'Descubre este increíble paquete de viaje',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const nextImage = () => {
    const images = getImageGallery();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    const images = getImageGallery();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const getImageGallery = () => {
    if (!packageData?.images) {
      return [`https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format&q=80`];
    }
    
    // Si hay un array de imágenes, usarlo
    if (Array.isArray(packageData.images)) {
      return packageData.images;
    }
    
    // Si hay una imagen principal, crear array
    if (packageData.images.main) {
      return [packageData.images.main];
    }
    
    // Si es una string directa
    if (typeof packageData.images === 'string') {
      return [packageData.images];
    }
    
    // Fallback
    return [`https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format&q=80`];
  };

  const formatPrice = (priceData) => {
    console.log('💰 Formateando precio:', priceData);
    
    if (!priceData) {
      console.log('💰 No hay precio, usando fallback');
      return 'Consultar precio';
    }
    
    // Si es un número directo
    if (typeof priceData === 'number') {
      console.log('💰 Precio es número:', priceData);
      return `USD ${priceData.toLocaleString()}`;
    }
    
    // Si es un objeto con amount
    if (priceData.amount) {
      console.log('💰 Precio tiene amount:', priceData.amount);
      return `${priceData.currency || 'USD'} ${priceData.amount.toLocaleString()}`;
    }
    
    // Si es un objeto con pricePerPerson
    if (priceData.pricePerPerson?.amount) {
      console.log('💰 Precio tiene pricePerPerson:', priceData.pricePerPerson.amount);
      return `${priceData.currency || 'USD'} ${priceData.pricePerPerson.amount.toLocaleString()}`;
    }
    
    console.log('💰 No se pudo formatear precio, usando fallback');
    return 'Consultar precio';
  };

  const formatDuration = (duration) => {
    if (!duration) return '7 días / 6 noches';
    
    if (typeof duration === 'string') return duration;
    
    if (duration.days && duration.nights) {
      return `${duration.days} días / ${duration.nights} noches`;
    }
    
    if (duration.days) {
      return `${duration.days} días`;
    }
    
    return '7 días / 6 noches';
  };

  const renderTabContent = () => {
    if (!packageData) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Duración</p>
                <p className="font-semibold text-gray-900">{formatDuration(packageData.duration)}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Grupo</p>
                <p className="font-semibold text-gray-900">Hasta 12 personas</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Rating</p>
                <p className="font-semibold text-gray-900">{packageData.rating?.average || 4.8}/5</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <Shield className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Seguro</p>
                <p className="font-semibold text-gray-900">Incluido</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Descripción del viaje</h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {packageData.description?.full || 
                   packageData.description?.short || 
                   packageData.description ||
                   'Embárcate en una aventura inolvidable que combinará cultura, gastronomía y paisajes espectaculares. Este viaje está diseñado para ofrecerte experiencias auténticas y momentos únicos que recordarás para siempre.'
                  }
                </p>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Lo más destacado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(packageData.features || packageData.highlights || [
                  'Vuelos internacionales incluidos',
                  'Hoteles 4 y 5 estrellas',
                  'Guía especializado en español',
                  'Desayunos y cenas incluidas',
                  'Traslados privados',
                  'Seguro de viaje completo'
                ]).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather & Best Time */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mejor época para viajar</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-blue-900">Temporada Alta</p>
                  <p className="text-sm text-gray-600">Diciembre - Marzo</p>
                  <p className="text-sm text-gray-700">Clima perfecto, más turistas</p>
                </div>
                <div>
                  <p className="font-semibold text-green-900">Temporada Media</p>
                  <p className="text-sm text-gray-600">Abril - Junio</p>
                  <p className="text-sm text-gray-700">Buen clima, precios moderados</p>
                </div>
                <div>
                  <p className="font-semibold text-orange-900">Temporada Baja</p>
                  <p className="text-sm text-gray-600">Julio - Noviembre</p>
                  <p className="text-sm text-gray-700">Mejores precios</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'itinerary':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Itinerario día a día</h3>
            
            {(packageData.itinerary || [
              {
                day: 1,
                title: 'Llegada y primer contacto',
                description: 'Llegada al destino, traslado al hotel y primera exploración de la ciudad.',
                activities: ['Traslado aeropuerto-hotel', 'Check-in en el hotel', 'Cena de bienvenida']
              },
              {
                day: 2,
                title: 'Tour por la ciudad',
                description: 'Recorrido completo por los principales atractivos de la ciudad.',
                activities: ['City tour matutino', 'Almuerzo típico', 'Visita a museos', 'Tiempo libre']
              },
              {
                day: 3,
                title: 'Excursión especial',
                description: 'Día completo de excursión a lugares únicos y especiales.',
                activities: ['Salida temprana', 'Visita guiada', 'Almuerzo incluido', 'Actividades opcionales']
              }
            ]).map((day, index) => (
              <div key={index} className="relative">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">{day.day}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{day.title}</h4>
                      <p className="text-gray-700 mb-4">{day.description}</p>
                      
                      {day.activities && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">Actividades:</h5>
                          <ul className="space-y-1">
                            {day.activities.map((activity, actIndex) => (
                              <li key={actIndex} className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-gray-600 text-sm">{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {index < (packageData.itinerary || []).length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                )}
              </div>
            ))}
          </div>
        );

      case 'included':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Included */}
              <div>
                <h3 className="text-lg font-bold text-green-600 mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Incluido en el paquete
                </h3>
                <div className="space-y-3">
                  {(packageData.included || [
                    'Vuelos internacionales ida y vuelta',
                    'Alojamiento en hoteles 4-5 estrellas',
                    'Desayuno diario buffet',
                    '3 cenas en restaurantes seleccionados',
                    'Traslados aeropuerto-hotel-aeropuerto',
                    'Guía local especializado',
                    'Entradas a todas las atracciones',
                    'Seguro de viaje internacional',
                    'Coordinador de viaje 24/7'
                  ]).map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Not Included */}
              <div>
                <h3 className="text-lg font-bold text-red-600 mb-6 flex items-center">
                  <X className="w-6 h-6 mr-2" />
                  No incluido
                </h3>
                <div className="space-y-3">
                  {(packageData.notIncluded || [
                    'Bebidas alcohólicas',
                    'Propinas para guías y conductores',
                    'Gastos personales',
                    'Actividades opcionales no mencionadas',
                    'Comidas no especificadas',
                    'Documentación (pasaporte, visa)',
                    'Vacunas requeridas'
                  ]).map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Terms */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-amber-800 mb-4">Condiciones de reserva</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">Reserva y pagos</h4>
                  <ul className="space-y-1 text-sm text-amber-800">
                    <li>• Seña: 30% al momento de la reserva</li>
                    <li>• Saldo: 45 días antes del viaje</li>
                    <li>• Financiación disponible</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">Cancelaciones</h4>
                  <ul className="space-y-1 text-sm text-amber-800">
                    <li>• Hasta 60 días: sin penalidad</li>
                    <li>• 59-30 días: 25% de penalidad</li>
                    <li>• Menos de 30 días: 50% de penalidad</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const images = getImageGallery();
  const currentImage = images[currentImageIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
            
            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Cargando detalles del viaje...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 bg-white flex items-center justify-center z-20">
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={fetchPackageDetails}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-10">
              <div className="flex items-center justify-between p-6">
                <div className="flex-1 mr-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {packageData?.title || 'Cargando...'}
                  </h1>
                  {packageData?.destination && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span className="text-lg">{packageData.destination}, {packageData.country}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-3 rounded-full transition-all ${
                      isFavorite 
                        ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={handleClose}
                    className="p-3 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Hero */}
            <div className="relative h-80 bg-gray-900">
              <img
                src={currentImage}
                alt={packageData?.title || 'Viaje'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format&q=80';
                }}
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              {/* Price Overlay */}
              <div className="absolute bottom-4 left-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <p className="text-sm text-gray-600 mb-1">Desde</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(packageData?.price)}
                  </p>
                  <p className="text-sm text-gray-600">por persona</p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="sticky top-[120px] bg-white border-b border-gray-200 z-10">
              <div className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Resumen', icon: Star },
                  { id: 'itinerary', label: 'Itinerario', icon: Calendar },
                  { id: 'included', label: 'Incluye', icon: CheckCircle }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {renderTabContent()}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
                <div className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {formatPrice(packageData?.price)}
                  </div>
                  <p className="text-gray-600">
                    por persona • {formatDuration(packageData?.duration)}
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => window.open('mailto:reservas@intertravel.com.ar', '_blank')}
                    className="flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Más información
                  </button>
                  
                  <button
                    onClick={handleWhatsAppContact}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Reservar por WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailsModal;
