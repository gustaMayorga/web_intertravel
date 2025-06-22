// WorldMap.tsx - MAPA CON CONVERSIÓN DE COORDENADAS REAL
'use client';

import React, { useState, useEffect } from 'react';

interface TravelDestination {
  id: string;
  name: string;
  country: string;
  emoji: string;
  price: number;
  description: string;
  category: string;
  x: number;
  y: number;
  tcData?: any;
  coordinates?: { lat: number; lon: number };
}

export default function WorldMap() {
  const [destinations, setDestinations] = useState<TravelDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<TravelDestination | null>(null);
  const [hoveredDestination, setHoveredDestination] = useState<TravelDestination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para convertir coordenadas lat/lon a posición en el mapa (0-100%)
  const coordsToMapPosition = (lat: number, lon: number) => {
    // Conversión simple de coordenadas geográficas a porcentaje del mapa
    // Latitud: -90 a 90 -> 100% a 0% (invertido porque Y=0 está arriba)
    // Longitud: -180 a 180 -> 0% a 100%
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    
    // Limitar valores entre 5% y 95% para mantener marcadores dentro del contenedor
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(10, Math.min(90, y))
    };
  };

  const getCountryEmoji = (country: string): string => {
    const emojiMap = {
      'Francia': '🇫🇷', 'Reino Unido': '🇬🇧', 'Italia': '🇮🇹', 'España': '🇪🇸',
      'Países Bajos': '🇳🇱', 'Japón': '🇯🇵', 'Tailandia': '🇹🇭', 'Emiratos Árabes Unidos': '🇦🇪',
      'Singapur': '🇸🇬', 'Estados Unidos': '🇺🇸', 'México': '🇲🇽', 'Perú': '🇵🇪',
      'Brasil': '🇧🇷', 'Argentina': '🇦🇷', 'Alemania': '🇩🇪', 'Austria': '🇦🇹',
      'Australia': '🇦🇺', 'Canadá': '🇨🇦', 'Chile': '🇨🇱', 'Colombia': '🇨🇴'
    };
    return emojiMap[country] || '🌍';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Romance': 'bg-pink-500',
      'Cultura': 'bg-purple-500',
      'Playa': 'bg-blue-500',
      'Aventura': 'bg-green-500',
      'Negocios': 'bg-yellow-500',
      'Gastronomía': 'bg-orange-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  // Cargar destinos desde la API
  useEffect(() => {
    const loadDestinations = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/travel-compositor/destinations');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.destinations) {
            // Convertir coordenadas a posiciones de mapa
            const mappedDestinations = data.destinations.map((dest: any) => {
              let mapPosition;
              
              if (dest.coordinates && dest.coordinates.lat && dest.coordinates.lon) {
                // Usar coordenadas reales y convertirlas
                mapPosition = coordsToMapPosition(dest.coordinates.lat, dest.coordinates.lon);
              } else {
                // Coordenadas reales y precisas para fallback
                const realCoordinates = {
                  // Argentina
                  'Buenos Aires': { lat: -34.6118, lon: -58.3960 },
                  'Bariloche': { lat: -41.1335, lon: -71.3103 },
                  'Mendoza': { lat: -32.8895, lon: -68.8458 },
                  'Córdoba': { lat: -31.4201, lon: -64.1888 },
                  'Ushuaia': { lat: -54.8019, lon: -68.3030 },
                  'El Calafate': { lat: -50.3374, lon: -72.2647 },
                  
                  // Europa
                  'París': { lat: 48.8566, lon: 2.3522 },
                  'Londres': { lat: 51.5074, lon: -0.1278 },
                  'Roma': { lat: 41.9028, lon: 12.4964 },
                  'Barcelona': { lat: 41.3851, lon: 2.1734 },
                  'Madrid': { lat: 40.4168, lon: -3.7038 },
                  'Amsterdam': { lat: 52.3676, lon: 4.9041 },
                  
                  // Asia
                  'Tokio': { lat: 35.6762, lon: 139.6503 },
                  'Bangkok': { lat: 13.7563, lon: 100.5018 },
                  'Dubái': { lat: 25.2048, lon: 55.2708 },
                  'Singapur': { lat: 1.3521, lon: 103.8198 },
                  
                  // América
                  'Nueva York': { lat: 40.7128, lon: -74.0060 },
                  'Miami': { lat: 25.7617, lon: -80.1918 },
                  'Cancún': { lat: 21.1619, lon: -86.8515 },
                  'Lima': { lat: -12.0464, lon: -77.0428 },
                  'Cusco': { lat: -13.5319, lon: -71.9675 },
                  'Río de Janeiro': { lat: -22.9068, lon: -43.1729 },
                  
                  // Oceanía
                  'Sidney': { lat: -33.8688, lon: 151.2093 }
                };
                
                const fallbackCoords = realCoordinates[dest.name] || 
                                     realCoordinates[dest.city] || 
                                     { lat: 0, lon: 0 };
                
                mapPosition = fallbackCoords.lat !== 0 ? 
                  coordsToMapPosition(fallbackCoords.lat, fallbackCoords.lon) : 
                  { x: 50, y: 50 };
              }
              
              return {
                id: dest.id,
                name: dest.name,
                country: dest.country,
                emoji: getCountryEmoji(dest.country),
                price: dest.price,
                description: dest.description,
                category: dest.category,
                x: mapPosition.x,
                y: mapPosition.y,
                tcData: dest.tcData,
                coordinates: dest.coordinates
              };
            });
            
            setDestinations(mappedDestinations);
            setError(data.connected ? null : 'Modo offline - usando datos locales');
            console.log(`✅ Cargados ${mappedDestinations.length} destinos (${data.source})`);
          }
        } else {
          throw new Error('Error del servidor');
        }
        
      } catch (error) {
        console.error('Error cargando destinos:', error);
        setError('Error de conexión');
        setDestinations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDestinations();
  }, []);

  const handleDestinationClick = (destination: TravelDestination) => {
    setSelectedDestination(destination);
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'destination_click', {
        destination_name: destination.name,
        destination_country: destination.country,
        source: 'world_map_coords'
      });
    }
  };

  const handleViewPackages = (destination: TravelDestination) => {
    const tcId = destination.tcData?.id;
    const queryParams = tcId 
      ? `tc_id=${tcId}&destination=${destination.name}` 
      : `destination=${destination.name}&country=${destination.country}`;
    
    window.location.href = `/paquetes?${queryParams}`;
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[80vh] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando destinos...</p>
          <p className="text-white/60 text-sm">Conectando con Travel Compositor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[80vh] bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Título */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          🌍 Explora el Mundo
        </h2>
        <p className="text-white/80 text-sm md:text-base">
          {error ? '(Modo offline)' : '(Datos actualizados)'} - Haz click en cualquier destino
        </p>
      </div>

      {/* FONDO DE MAPA REAL */}
      <div className="absolute inset-0 opacity-40">
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg')",
            filter: 'brightness(0.6) contrast(1.2)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-purple-900/60"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Marcadores de destinos */}
      {destinations.map((destination) => (
        <div
          key={destination.id}
          className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ 
            left: `${destination.x}%`, 
            top: `${destination.y}%` 
          }}
          onClick={() => handleDestinationClick(destination)}
          onMouseEnter={() => setHoveredDestination(destination)}
          onMouseLeave={() => setHoveredDestination(null)}
        >
          {/* Pulso animado */}
          <div className={`absolute inset-0 w-6 h-6 ${getCategoryColor(destination.category)} rounded-full animate-ping opacity-75`}></div>
          
          {/* Marcador principal */}
          <div className={`relative w-6 h-6 ${getCategoryColor(destination.category)} rounded-full border-2 border-white shadow-lg hover:scale-150 transition-all duration-300 flex items-center justify-center group`}>
            <span className="text-xs group-hover:text-sm transition-all">{destination.emoji}</span>
          </div>

          {/* Tooltip en hover */}
          {hoveredDestination?.id === destination.id && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-4 py-3 rounded-xl text-sm whitespace-nowrap shadow-xl z-30">
              <div className="font-bold text-base">{destination.name}</div>
              <div className="text-gray-300">{destination.country}</div>
              <div className="text-yellow-400 font-bold">Desde ${destination.price}</div>
              <div className="text-gray-400 text-xs">{destination.description}</div>
              {destination.coordinates && (
                <div className="text-green-400 text-xs">📍 {destination.coordinates.lat.toFixed(2)}, {destination.coordinates.lon.toFixed(2)}</div>
              )}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
            </div>
          )}
        </div>
      ))}

      {/* Leyenda */}
      <div className="absolute bottom-6 left-6 bg-black/20 backdrop-blur-sm rounded-xl p-4 text-white text-sm z-30">
        <h4 className="font-bold mb-3">Categorías:</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            <span>Romance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Cultura</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Playa</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Aventura</span>
          </div>
        </div>
        {error && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="text-yellow-400 text-xs">⚠️ {error}</div>
          </div>
        )}
      </div>

      {/* Contador */}
      <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-center z-30">
        <div className="text-2xl font-bold text-yellow-400">{destinations.length}</div>
        <div className="text-sm">Destinos</div>
        <div className="text-xs opacity-75">
          {error ? 'Offline' : 'Conectado'}
        </div>
      </div>

      {/* Modal */}
      {selectedDestination && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">{selectedDestination.emoji}</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedDestination.name}</h3>
              <p className="text-gray-600 text-lg mb-1">{selectedDestination.country}</p>
              <p className="text-gray-500 mb-6">{selectedDestination.description}</p>
              
              <div className={`inline-block px-4 py-2 rounded-full text-white font-bold mb-6 ${getCategoryColor(selectedDestination.category)}`}>
                {selectedDestination.category}
              </div>

              {selectedDestination.coordinates && (
                <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs mb-4 inline-block">
                  📍 {selectedDestination.coordinates.lat.toFixed(4)}, {selectedDestination.coordinates.lon.toFixed(4)}
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl mb-6">
                <div className="text-sm opacity-90">Paquetes desde</div>
                <div className="text-4xl font-bold">${selectedDestination.price}</div>
                <div className="text-sm opacity-90">por persona</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-bold"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleViewPackages(selectedDestination)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-bold"
                >
                  Ver Paquetes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
