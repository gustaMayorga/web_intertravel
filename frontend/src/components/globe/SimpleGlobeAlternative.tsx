// SimpleGlobeAlternative.tsx - Mapa simple que SÍ funciona
'use client';

import React, { useState } from 'react';

interface Destination {
  id: string;
  name: string;
  country: string;
  emoji: string;
  price: number;
  description: string;
  x: number; // Posición en el mapa (%)
  y: number; // Posición en el mapa (%)
}

const destinations: Destination[] = [
  { id: 'paris', name: 'París', country: 'Francia', emoji: '🇫🇷', price: 1299, description: 'Ciudad del amor', x: 48, y: 35 },
  { id: 'tokyo', name: 'Tokio', country: 'Japón', emoji: '🇯🇵', price: 2199, description: 'Cultura milenaria', x: 85, y: 42 },
  { id: 'cancun', name: 'Cancún', country: 'México', emoji: '🇲🇽', price: 1494, description: 'Playas paradisíacas', x: 18, y: 50 },
  { id: 'cusco', name: 'Cusco', country: 'Perú', emoji: '🇵🇪', price: 1890, description: 'Machu Picchu', x: 25, y: 70 },
  { id: 'london', name: 'Londres', country: 'Reino Unido', emoji: '🇬🇧', price: 1799, description: 'Historia viva', x: 46, y: 32 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', emoji: '🇦🇺', price: 2890, description: 'Aventura oceánica', x: 88, y: 85 }
];

export default function SimpleGlobeAlternative() {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [hoveredDestination, setHoveredDestination] = useState<Destination | null>(null);

  const handleDestinationClick = (destination: Destination) => {
    setSelectedDestination(destination);
  };

  const handleViewPackages = (destination: Destination) => {
    // Redirigir a paquetes con filtro
    window.location.href = `/paquetes?destination=${destination.name}&country=${destination.country}`;
  };

  return (
    <div className="relative w-full h-[70vh] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Título */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          🌍 Destinos Populares
        </h2>
        <p className="text-white/80 text-sm">
          Haz click en cualquier destino para ver paquetes
        </p>
      </div>

      {/* Mapa de fondo estilizado */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Continentes estilizados */}
      <div className="absolute inset-0">
        {/* Europa */}
        <div className="absolute top-[25%] left-[45%] w-16 h-12 bg-green-500/30 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🏰</span>
        </div>
        
        {/* Asia */}
        <div className="absolute top-[35%] right-[15%] w-20 h-16 bg-red-500/30 rounded-lg flex items-center justify-center">
          <span className="text-3xl">🏯</span>
        </div>
        
        {/* América */}
        <div className="absolute top-[45%] left-[20%] w-18 h-20 bg-yellow-500/30 rounded-lg flex items-center justify-center">
          <span className="text-3xl">🗿</span>
        </div>
        
        {/* Oceanía */}
        <div className="absolute bottom-[15%] right-[12%] w-14 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
          <span className="text-2xl">🏄‍♂️</span>
        </div>
      </div>

      {/* Destinos interactivos */}
      {destinations.map((destination) => (
        <div
          key={destination.id}
          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ 
            left: `${destination.x}%`, 
            top: `${destination.y}%` 
          }}
          onClick={() => handleDestinationClick(destination)}
          onMouseEnter={() => setHoveredDestination(destination)}
          onMouseLeave={() => setHoveredDestination(null)}
        >
          {/* Pulso animado */}
          <div className="absolute inset-0 w-6 h-6 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          
          {/* Marcador principal */}
          <div className="relative w-6 h-6 bg-yellow-500 rounded-full border-2 border-white shadow-lg hover:scale-125 transition-all duration-300 flex items-center justify-center">
            <span className="text-xs">{destination.emoji}</span>
          </div>

          {/* Tooltip en hover */}
          {hoveredDestination?.id === destination.id && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
              <div className="font-bold">{destination.name}</div>
              <div className="text-yellow-400">${destination.price}</div>
            </div>
          )}
        </div>
      ))}

      {/* Modal de destino seleccionado */}
      {selectedDestination && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-3">{selectedDestination.emoji}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedDestination.name}
              </h3>
              <p className="text-gray-600 mb-4">{selectedDestination.description}</p>
              
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl mb-6">
                <div className="text-sm opacity-90">Desde</div>
                <div className="text-3xl font-bold">${selectedDestination.price}</div>
                <div className="text-sm opacity-90">por persona</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleViewPackages(selectedDestination)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Ver Paquetes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Destinos disponibles</span>
        </div>
        <div className="text-xs opacity-75">Haz click para más información</div>
      </div>
    </div>
  );
}
