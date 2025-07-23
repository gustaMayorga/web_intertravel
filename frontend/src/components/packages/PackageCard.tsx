'use client';

// ===============================================
// TARJETA DE PAQUETE OPTIMIZADA
// ===============================================

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
  availability: boolean;
  maxOccupancy: number;
  priorityScore: number;
  _source: string;
}

interface PackageCardProps {
  package: Package;
  onClick: () => void;
}

export default function PackageCard({ package: pkg, onClick }: PackageCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'premium': 'bg-purple-100 text-purple-800',
      'familiar': 'bg-green-100 text-green-800',
      'cultural': 'bg-blue-100 text-blue-800',
      'gourmet': 'bg-red-100 text-red-800',
      'urbano': 'bg-gray-100 text-gray-800',
      'aventura': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'premium': 'Premium',
      'familiar': 'Familiar',
      'cultural': 'Cultural',
      'gourmet': 'Gourmet',
      'urbano': 'Urbano',
      'aventura': 'Aventura'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const mainImage = pkg.images && pkg.images.length > 0 ? pkg.images[0] : 
    'https://via.placeholder.com/400x300/6b7280/ffffff?text=' + encodeURIComponent(pkg.destination);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden border border-gray-100"
    >
      {/* Imagen principal */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={mainImage}
          alt={pkg.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {pkg.featured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              ⭐ Destacado
            </span>
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(pkg.category)}`}>
            {getCategoryLabel(pkg.category)}
          </span>
        </div>

        {/* Descuento */}
        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {Math.round((1 - pkg.price / pkg.originalPrice) * 100)}% OFF
          </div>
        )}

        {/* Disponibilidad */}
        <div className="absolute bottom-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            pkg.availability ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {pkg.availability ? 'Disponible' : 'Consultar'}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Título y destino */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {pkg.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{pkg.destination}, {pkg.country}</span>
          </div>
        </div>

        {/* Descripción corta */}
        {pkg.shortDescription && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {pkg.shortDescription}
          </p>
        )}

        {/* Highlights */}
        {pkg.highlights && pkg.highlights.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {pkg.highlights.slice(0, 2).map((highlight, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {highlight}
                </span>
              ))}
              {pkg.highlights.length > 2 && (
                <span className="text-gray-500 text-xs px-2 py-1">
                  +{pkg.highlights.length - 2} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Duración y ocupación */}
        <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{pkg.duration} días</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Hasta {pkg.maxOccupancy} personas</span>
          </div>
        </div>

        {/* Precios */}
        <div className="flex items-center justify-between">
          <div>
            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(pkg.originalPrice, pkg.currency)}
              </div>
            )}
            <div className="text-xl font-bold text-gray-900">
              {formatPrice(pkg.price, pkg.currency)}
            </div>
            <div className="text-xs text-gray-500">
              por persona
            </div>
          </div>

          {/* Botón ver detalles */}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 group-hover:bg-blue-700">
            Ver detalles
          </button>
        </div>

        {/* Indicador de fuente */}
        {pkg._source && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center">
                {pkg._source.includes('api') ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Travel Compositor
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                    Datos locales
                  </>
                )}
              </span>
              {pkg.priorityScore && (
                <span>Prioridad: {pkg.priorityScore}/10</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
