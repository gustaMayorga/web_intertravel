'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Package {
  id: string;
  title: string;
  destination: string;
  country: string;
  price: {
    amount: number;
    currency: string;
  };
  originalPrice?: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  category: string;
  description: {
    short: string;
  };
  images: {
    main: string;
    gallery?: string[];
  };
  rating?: {
    average: number;
    count: number;
  };
  features?: string[];
  featured: boolean;
  _source?: string;
}

const FeaturedPackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('todos');

  const categories = [
    { id: 'todos', name: 'Todos los destinos', icon: '🌍' },
    { id: 'playa', name: 'Playa y Relax', icon: '🏖️' },
    { id: 'cultura', name: 'Cultura y Aventura', icon: '🏛️' },
    { id: 'ciudad', name: 'Ciudad y Cultura', icon: '🌆' },
    { id: 'charter', name: 'Vuelos Chárter', icon: '✈️' },
    { id: 'egresados', name: 'Viajes de 15', icon: '🎓' }
  ];

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/packages/featured?limit=12');
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.packages || []);
      } else {
        setError('Error cargando paquetes');
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = selectedCategory === 'todos' 
    ? packages 
    : packages.filter(pkg => 
        pkg.category.toLowerCase().includes(selectedCategory) ||
        pkg.title.toLowerCase().includes(selectedCategory)
      );

  const formatPrice = (price: { amount: number; currency: string }) => {
    return `${price.currency} ${price.amount.toLocaleString()}`;
  };

  const calculateDiscount = (original?: { amount: number }, current?: { amount: number }) => {
    if (!original || !current) return 0;
    return Math.round(((original.amount - current.amount) / original.amount) * 100);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="loading w-12 h-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando paquetes destacados...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">⚠️ {error}</p>
            <button 
              onClick={fetchPackages}
              className="btn-intertravel"
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-intertravel-navy mb-4">
            Paquetes Destacados
          </h2>
          {/* Categories intro */}
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubrí las mejores ofertas y experiencias únicas seleccionadas especialmente para vos
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-intertravel-gold text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:transform hover:scale-105'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredPackages.map((pkg, index) => (
            <div
              key={pkg.id}
              className="card-intertravel group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                  style={{ backgroundImage: `url(${pkg.images.main})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-intertravel-gold text-white px-3 py-1 rounded-full text-sm font-medium">
                    {pkg.category}
                  </span>
                </div>

                {/* Discount Badge */}
                {pkg.originalPrice && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{calculateDiscount(pkg.originalPrice, pkg.price)}%
                    </span>
                  </div>
                )}

                {/* Country Flag */}
                <div className="absolute bottom-3 right-3">
                  <span className="bg-white/90 text-xs px-2 py-1 rounded-full text-gray-800">
                    {pkg.country}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Title and Destination */}
                <h3 className="text-xl font-bold text-intertravel-navy mb-2 group-hover:text-intertravel-gold transition-colors">
                  {pkg.title}
                </h3>
                <p className="text-gray-600 mb-3 flex items-center">
                  <span className="mr-2">📍</span>
                  {pkg.destination}
                </p>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {pkg.description.short}
                </p>

                {/* Duration */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <span className="mr-2">🗓️</span>
                  {pkg.duration.days} días / {pkg.duration.nights} noches
                </div>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {pkg.features.slice(0, 2).map((feature, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {pkg.features.length > 2 && (
                        <span className="text-gray-400 text-xs">
                          +{pkg.features.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Rating */}
                {pkg.rating && (
                  <div className="flex items-center mb-4">
                    <div className="flex text-intertravel-gold">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>
                          {i < Math.floor(pkg.rating!.average) ? '⭐' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">
                      ({pkg.rating.count} reseñas)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-intertravel-gold">
                      {formatPrice(pkg.price)}
                    </span>
                    {pkg.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(pkg.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">por persona</p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href={`/paquetes/${pkg.id}`}
                    className="block w-full bg-intertravel-gold hover:bg-intertravel-gold-light text-white text-center py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Ver detalles
                  </Link>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-intertravel-navy py-2 rounded-xl font-medium transition-all duration-300">
                    💖 Guardar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No results */}
        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron paquetes
            </h3>
            <p className="text-gray-500 mb-6">
              Probá con otra categoría o contactanos para armar un viaje personalizado
            </p>
            <Link href="/contacto" className="btn-intertravel">
              📞 Contactar asesor
            </Link>
          </div>
        )}

        {/* Load More */}
        {filteredPackages.length > 0 && (
          <div className="text-center mt-12">
            <Link
              href="/paquetes"
              className="btn-intertravel-outline inline-flex items-center"
            >
              Ver todos los paquetes
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedPackages;