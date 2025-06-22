// InteractiveGlobe.tsx - Versión corregida con buscador IA
'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Destination {
  id: string;
  name: string;
  lat: number;
  lon: number;
  info: string;
  url?: string;
  inspired?: boolean;
}

interface InteractiveGlobeProps {
  destinations?: Destination[];
  onDestinationClick?: (destination: Destination) => void;
}

export default function InteractiveGlobe({ 
  destinations = [], 
  onDestinationClick 
}: InteractiveGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResults, setAiResults] = useState([]);

  useEffect(() => {
    // Simular carga del globo (fallback sin Three.js por ahora)
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowAISearch(true); // Mostrar buscador IA automáticamente
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    
    try {
      console.log('Buscando:', aiQuery);
      // Simulación de resultados por ahora
      const mockResults = [
        { id: 1, title: 'Cancún Paradise', price: '$1,200', description: 'Playas cristalinas y diversión' },
        { id: 2, title: 'Machu Picchu Adventure', price: '$980', description: 'Historia y naturaleza' },
        { id: 3, title: 'París Romance', price: '$1,500', description: 'La ciudad del amor' }
      ];
      setAiResults(mockResults);
    } catch (error) {
      console.error('Error en búsqueda IA:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Cargando experiencia interactiva...</p>
          <p className="text-gray-300 text-sm mt-2">Preparando globo 3D y buscador IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      
      {/* Globo 3D Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Simulación del globo */}
          <div className="w-80 h-80 bg-gradient-to-br from-blue-500 to-green-500 rounded-full shadow-2xl animate-pulse">
            <div className="absolute inset-0 bg-blue-600 rounded-full opacity-20 animate-ping"></div>
            <div className="absolute inset-4 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">🌍</div>
                <p className="text-lg font-bold">Globo Interactivo</p>
                <p className="text-sm opacity-80">Click para explorar</p>
              </div>
            </div>
          </div>
          
          {/* Marcadores de destinos */}
          <div className="absolute top-12 left-12 w-4 h-4 bg-yellow-400 rounded-full animate-bounce cursor-pointer" title="París"></div>
          <div className="absolute bottom-16 right-20 w-4 h-4 bg-red-400 rounded-full animate-bounce cursor-pointer" title="Cancún"></div>
          <div className="absolute top-32 right-16 w-4 h-4 bg-green-400 rounded-full animate-bounce cursor-pointer" title="Machu Picchu"></div>
        </div>
      </div>

      {/* Buscador IA Inteligente */}
      {showAISearch && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                🧠 Buscador Inteligente con IA
              </h2>
              <p className="text-gray-200 text-sm">
                Describe tu viaje ideal y la IA encontrará las mejores opciones
              </p>
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ej: Playa tranquila con comida local, aventura en montañas, ciudad europea histórica..."
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
              />
              <button
                onClick={handleAISearch}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                🔍 Buscar
              </button>
            </div>

            {/* Ejemplos de búsqueda */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-gray-300 text-sm">Prueba:</span>
              {[
                'Aventura en selva',
                'Playa todo incluido',
                'Europa cultural',
                'Luna de miel romántica'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setAiQuery(example)}
                  className="px-3 py-1 bg-white/20 text-white text-xs rounded-full hover:bg-white/30 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resultados de búsqueda IA */}
      {aiResults.length > 0 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              ✨ Resultados personalizados para ti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiResults.map((result: any) => (
                <div 
                  key={result.id}
                  className="bg-white/20 rounded-xl p-4 hover:bg-white/30 transition-all cursor-pointer"
                >
                  <h4 className="font-bold text-white mb-2">{result.title}</h4>
                  <p className="text-gray-200 text-sm mb-3">{result.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-bold">{result.price}</span>
                    <button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controles del globo */}
      <div className="absolute bottom-8 left-8 z-50">
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
          >
            ✨ Inspírame
          </button>
          <button
            onClick={() => setShowAISearch(!showAISearch)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
          >
            🧠 Búsqueda IA
          </button>
        </div>
      </div>

      {/* Modal de inspiración */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-200">
          <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-blue-500/30 w-90 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
              ✨ Asistente de Viajes IA
            </h2>
            <p className="text-gray-300 mb-6 text-center">
              Describe el tipo de viaje que sueñas y la IA te dará ideas personalizadas.
            </p>
            <input
              type="text"
              placeholder="Ej: Aventura en la montaña..."
              className="w-full p-3 rounded-lg border border-blue-500 bg-slate-900 text-white mb-6"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
              >
                Cerrar
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setShowAISearch(true);
                }}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-black font-bold rounded-full transition-colors"
              >
                Generar Ideas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
