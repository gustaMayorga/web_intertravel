'use client';

// ===============================================
// BUSCADOR SIMPLE HERO - SOLO DESTINO
// ===============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const destinations = [
  'Bariloche',
  'Cancún',
  'Mendoza', 
  'Europa',
  'Miami',
  'Tokio',
  'París',
  'Roma',
  'Madrid',
  'Buenos Aires',
  'Córdoba',
  'Salta',
  'Ushuaia',
  'Iguazú'
];

export default function HeroSearchSimple() {
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  const handleInputChange = (value) => {
    setDestination(value);
    
    if (value.length > 0) {
      const filtered = destinations.filter(dest =>
        dest.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (selectedDestination = destination) => {
    if (selectedDestination.trim()) {
      // Redirigir a página de paquetes con búsqueda
      router.push(`/packages?search=${encodeURIComponent(selectedDestination.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setDestination(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-full shadow-lg p-2 flex items-center">
        <div className="flex-1 relative">
          <div className="flex items-center px-4 py-3">
            <div className="flex items-center space-x-3 flex-1">
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="¿A dónde querés viajar?"
                value={destination}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 text-lg placeholder-gray-500 bg-transparent border-none outline-none"
              />
            </div>
          </div>

          {/* Sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                >
                  <div className="text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={!destination.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-full font-semibold transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Buscar</span>
        </button>
      </div>

      {/* Sugerencias populares */}
      <div className="mt-4 text-center">
        <p className="text-white text-sm mb-2">Destinos populares:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Bariloche', 'Cancún', 'Europa', 'Mendoza'].map((dest, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(dest)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm transition-colors duration-200 backdrop-blur-sm"
            >
              {dest}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
