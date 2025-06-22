// DestinationGrid.tsx - Grid simple y efectivo
'use client';

import React, { useState } from 'react';

interface Destination {
  id: string;
  name: string;
  country: string;
  emoji: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

const destinations: Destination[] = [
  { 
    id: 'paris', 
    name: 'París', 
    country: 'Francia', 
    emoji: '🇫🇷', 
    price: 1299, 
    description: 'Ciudad del amor y la moda',
    category: 'Romance',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop'
  },
  { 
    id: 'tokyo', 
    name: 'Tokio', 
    country: 'Japón', 
    emoji: '🇯🇵', 
    price: 2199, 
    description: 'Tecnología y tradición',
    category: 'Cultura',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop'
  },
  { 
    id: 'cancun', 
    name: 'Cancún', 
    country: 'México', 
    emoji: '🇲🇽', 
    price: 1494, 
    description: 'Playas paradisíacas',
    category: 'Playa',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop'
  },
  { 
    id: 'cusco', 
    name: 'Cusco', 
    country: 'Perú', 
    emoji: '🇵🇪', 
    price: 1890, 
    description: 'Machu Picchu y aventura',
    category: 'Aventura',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400&h=300&fit=crop'
  },
  { 
    id: 'london', 
    name: 'Londres', 
    country: 'Reino Unido', 
    emoji: '🇬🇧', 
    price: 1799, 
    description: 'Historia y realeza',
    category: 'Cultura',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop'
  },
  { 
    id: 'sydney', 
    name: 'Sydney', 
    country: 'Australia', 
    emoji: '🇦🇺', 
    price: 2890, 
    description: 'Aventura oceánica',
    category: 'Aventura',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
  }
];

const categories = ['Todos', 'Romance', 'Cultura', 'Playa', 'Aventura'];

export default function DestinationGrid() {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null);

  const filteredDestinations = selectedCategory === 'Todos' 
    ? destinations 
    : destinations.filter(dest => dest.category === selectedCategory);

  const handleDestinationClick = (destination: Destination) => {
    window.location.href = `/paquetes?destination=${destination.name}&country=${destination.country}`;
  };

  return (
    <div className="w-full py-8">
      
      {/* Título y filtros */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          🌍 Explora Destinos Increíbles
        </h2>
        <p className="text-white/80 mb-6">
          Descubre los destinos más populares con precios increíbles
        </p>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de destinos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {filteredDestinations.map((destination) => (
          <div
            key={destination.id}
            className="group cursor-pointer"
            onClick={() => handleDestinationClick(destination)}
            onMouseEnter={() => setHoveredDestination(destination.id)}
            onMouseLeave={() => setHoveredDestination(null)}
          >
            <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
              
              {/* Imagen de fondo */}
              <div 
                className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden"
                style={{
                  backgroundImage: `url(${destination.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Emoji país */}
                <div className="absolute top-3 right-3 text-2xl">
                  {destination.emoji}
                </div>
                
                {/* Categoría */}
                <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {destination.category}
                </div>

                {/* Precio destacado */}
                <div className="absolute bottom-3 left-3 bg-yellow-500 text-black px-3 py-1 rounded-full font-bold">
                  ${destination.price}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  {destination.name}
                </h3>
                <p className="text-white/70 text-sm mb-3">
                  {destination.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">
                    {destination.country}
                  </span>
                  
                  <button 
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      hoveredDestination === destination.id
                        ? 'bg-yellow-500 text-black scale-105'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Ver Paquetes →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA final */}
      <div className="text-center mt-12">
        <a
          href="/paquetes"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-full hover:scale-105 transition-all text-lg shadow-xl"
        >
          Ver Todos los Destinos
          <span className="ml-2 text-xl">✈️</span>
        </a>
      </div>
    </div>
  );
}
