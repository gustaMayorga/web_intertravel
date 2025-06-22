'use client';

import React from 'react';

interface Destination {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  price: number;
  packages: number;
  category: string;
}

interface GlobeTooltipProps {
  destination: Destination | null;
  onViewPackages: (destination: Destination) => void;
  onClose: () => void;
}

export default function GlobeTooltip({ destination, onViewPackages, onClose }: GlobeTooltipProps) {
  if (!destination) return null;

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'Romance': '💕',
      'Aventura': '🏔️',
      'Playa': '🏖️',
      'Cultura': '🏛️',
      'Premium': '⭐'
    };
    return icons[category] || '🌍';
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Romance': 'from-pink-500 to-rose-500',
      'Aventura': 'from-orange-500 to-red-500',
      'Playa': 'from-cyan-500 to-blue-500',
      'Cultura': 'from-purple-500 to-indigo-500',
      'Premium': 'from-yellow-500 to-amber-500'
    };
    return colors[category] || 'from-blue-500 to-purple-500';
  };

  return (
    <div className="absolute top-4 left-4 right-4 md:top-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-2xl animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          ×
        </button>

        {/* Destination info */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{getCategoryIcon(destination.category)}</span>
            <div>
              <h3 className="text-2xl font-bold">{destination.name}</h3>
              <p className="text-white/80">{destination.country}</p>
            </div>
          </div>

          {/* Category badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-4 bg-gradient-to-r ${getCategoryColor(destination.category)}`}>
            {destination.category}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              ${destination.price.toLocaleString()}
            </div>
            <div className="text-sm text-white/70">Desde USD</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {destination.packages}
            </div>
            <div className="text-sm text-white/70">Paquetes</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onViewPackages(destination)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Ver Paquetes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-white/70 text-center">
            Coordenadas: {destination.lat.toFixed(2)}, {destination.lng.toFixed(2)}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}