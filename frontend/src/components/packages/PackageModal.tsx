'use client';

// ===============================================
// MODAL DE DETALLES DE PAQUETE CON WHATSAPP
// ===============================================

import { useEffect } from 'react';
import Image from 'next/image';

interface Package {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  currency: string;
  destination: string;
  country: string;
  duration: number;
  category: string;
  featured: boolean;
  images: string[];
  highlights: string[];
  inclusions?: string[];
  itinerary?: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  availability: boolean;
  maxOccupancy: number;
  whatsappInfo?: {
    number: string;
    message: string;
  };
  _source: string;
}

interface PackageModalProps {
  package: Package;
  onClose: () => void;
}

export default function PackageModal({ package: pkg, onClose }: PackageModalProps) {
  
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleWhatsAppClick = () => {
    const whatsappNumber = pkg.whatsappInfo?.number || '+5411987654321';
    const message = pkg.whatsappInfo?.message || 
      `Hola! Me interesa el paquete "${pkg.title}" de ${pkg.duration} días a ${pkg.destination} por ${formatPrice(pkg.price, pkg.currency)}. ¿Podrían darme más información y disponibilidad?`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'premium': 'bg-purple-100 text-purple-800 border-purple-200',
      'familiar': 'bg-green-100 text-green-800 border-green-200',
      'cultural': 'bg-blue-100 text-blue-800 border-blue-200',
      'gourmet': 'bg-red-100 text-red-800 border-red-200',
      'urbano': 'bg-gray-100 text-gray-800 border-gray-200',
      'aventura': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fondo difuminado */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          
          {/* Header con botón cerrar */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="overflow-y-auto max-h-[90vh]">
            
            {/* Galería de imágenes */}
            <div className="relative h-80">
              {pkg.images && pkg.images.length > 0 ? (
                <Image
                  src={pkg.images[0]}
                  alt={pkg.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{pkg.destination}</span>
                </div>
              )}

              {/* Badges superpuestos */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                {pkg.featured && (
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ⭐ Destacado
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getCategoryColor(pkg.category)}`}>
                  {pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1)}
                </span>
              </div>

              {/* Descuento */}
              {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                <div className="absolute top-4 right-16 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {Math.round((1 - pkg.price / pkg.originalPrice) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Contenido principal */}
            <div className="p-6">
              
              {/* Header del paquete */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{pkg.title}</h1>
                    <div className="flex items-center text-gray-600 mb-3">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-lg">{pkg.destination}, {pkg.country}</span>
                    </div>
                  </div>

                  {/* Precio y disponibilidad */}
                  <div className="text-right">
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                      <div className="text-lg text-gray-500 line-through mb-1">
                        {formatPrice(pkg.originalPrice, pkg.currency)}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {formatPrice(pkg.price, pkg.currency)}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">por persona</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      pkg.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {pkg.availability ? 'Disponible' : 'Consultar disponibilidad'}
                    </span>
                  </div>
                </div>

                {/* Información básica */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{pkg.duration}</div>
                    <div className="text-sm text-gray-600">días</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{pkg.maxOccupancy}</div>
                    <div className="text-sm text-gray-600">personas máx.</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{pkg.highlights?.length || 0}</div>
                    <div className="text-sm text-gray-600">actividades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">⭐</div>
                    <div className="text-sm text-gray-600">premium</div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {pkg.description && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed">{pkg.description}</p>
                </div>
              )}

              {/* Lo que incluye */}
              {pkg.inclusions && pkg.inclusions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">✅ Incluye</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pkg.inclusions.map((inclusion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{inclusion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights/Actividades */}
              {pkg.highlights && pkg.highlights.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">🎯 Actividades destacadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {pkg.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerario */}
              {pkg.itinerary && pkg.itinerary.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">📅 Itinerario</h3>
                  <div className="space-y-4">
                    {pkg.itinerary.map((day, index) => (
                      <div key={index} className="flex space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {day.day}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{day.title}</h4>
                          <p className="text-gray-700 text-sm">{day.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de reserva WhatsApp */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 -m-6 mt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="text-center sm:text-left">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(pkg.price, pkg.currency)}
                    </div>
                    <div className="text-sm text-gray-600">por persona • {pkg.duration} días</div>
                  </div>
                  
                  <button
                    onClick={handleWhatsAppClick}
                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    <span>Reservar por WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
