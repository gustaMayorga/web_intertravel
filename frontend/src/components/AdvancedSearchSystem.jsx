'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Plane, 
  Star, 
  TrendingUp,
  Clock,
  Filter,
  X,
  ArrowRight,
  Globe,
  Heart,
  Zap
} from 'lucide-react';

// Simulamos un servicio de búsqueda inteligente
const searchService = {
  // Destinos populares
  popularDestinations: [
    { id: 'europa', name: 'Europa Clásica', country: 'Multi-país', price: 2299, type: 'destination' },
    { id: 'peru', name: 'Perú Mágico', country: 'Perú', price: 1890, type: 'destination' },
    { id: 'bariloche', name: 'Bariloche', country: 'Argentina', price: 899, type: 'destination' },
    { id: 'cancun', name: 'Cancún', country: 'México', price: 1599, type: 'destination' },
    { id: 'paris', name: 'París', country: 'Francia', price: 2100, type: 'destination' },
    { id: 'roma', name: 'Roma', country: 'Italia', price: 1950, type: 'destination' },
    { id: 'tokyo', name: 'Tokio', country: 'Japón', price: 3200, type: 'destination' },
    { id: 'new-york', name: 'Nueva York', country: 'Estados Unidos', price: 2800, type: 'destination' },
  ],

  // Categorías de viaje
  categories: [
    { id: 'cultural', name: 'Cultural', description: 'Historia y tradiciones', count: 45 },
    { id: 'aventura', name: 'Aventura', description: 'Deportes y adrenalina', count: 32 },
    { id: 'familiar', name: 'Familiar', description: 'Para toda la familia', count: 28 },
    { id: 'gastronomico', name: 'Gastronómico', description: 'Sabores del mundo', count: 22 },
    { id: 'romantico', name: 'Romántico', description: 'Luna de miel', count: 18 },
    { id: 'playa', name: 'Playa', description: 'Sol y mar', count: 35 },
  ],

  // Búsquedas recientes
  recentSearches: [
    'Europa Clásica',
    'Perú Machu Picchu',
    'Cruceros Mediterráneo',
    'Asia Oriental'
  ],

  // Sugerencias inteligentes
  getSuggestions: (query) => {
    if (!query || query.length < 2) return [];
    
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Buscar en destinos
    searchService.popularDestinations.forEach(dest => {
      if (dest.name.toLowerCase().includes(queryLower) || 
          dest.country.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `dest-${dest.id}`,
          type: 'destination',
          title: dest.name,
          subtitle: dest.country,
          price: dest.price,
          icon: 'MapPin'
        });
      }
    });

    // Buscar en categorías
    searchService.categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(queryLower) || 
          cat.description.toLowerCase().includes(queryLower)) {
        suggestions.push({
          id: `cat-${cat.id}`,
          type: 'category',
          title: `Viajes ${cat.name}`,
          subtitle: cat.description,
          count: cat.count,
          icon: 'Star'
        });
      }
    });

    // Sugerencias específicas basadas en palabras clave
    const keywordSuggestions = [
      { keywords: ['playa', 'sol', 'mar'], title: 'Destinos de Playa', subtitle: 'Caribe, Riviera Maya, Cancún', icon: 'Globe' },
      { keywords: ['europa', 'european'], title: 'Tours por Europa', subtitle: 'París, Roma, Londres', icon: 'Plane' },
      { keywords: ['cultura', 'historia'], title: 'Viajes Culturales', subtitle: 'Museos, sitios históricos', icon: 'Star' },
      { keywords: ['familia', 'niños'], title: 'Viajes Familiares', subtitle: 'Actividades para toda la familia', icon: 'Users' },
      { keywords: ['aventura', 'deporte'], title: 'Turismo Aventura', subtitle: 'Trekking, deportes extremos', icon: 'Zap' },
    ];

    keywordSuggestions.forEach(suggestion => {
      if (suggestion.keywords.some(keyword => queryLower.includes(keyword))) {
        suggestions.push({
          id: `keyword-${suggestion.title}`,
          type: 'suggestion',
          title: suggestion.title,
          subtitle: suggestion.subtitle,
          icon: suggestion.icon
        });
      }
    });

    return suggestions.slice(0, 8);
  }
};

const AdvancedSearchSystem = ({ type = 'landing', onSearch, className = '' }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ searches: 0, lastQuery: '' });
  
  // Filtros avanzados (para tipo 'packages')
  const [filters, setFilters] = useState({
    destination: '',
    category: '',
    priceRange: [0, 5000],
    duration: '',
    departure: '',
    travelers: 2
  });
  const [showFilters, setShowFilters] = useState(false);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounce para sugerencias
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      const newSuggestions = searchService.getSuggestions(query);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery = query, filterData = filters) => {
    if (!searchQuery.trim()) return;

    const searchData = {
      query: searchQuery.trim(),
      filters: filterData,
      type: type,
      timestamp: new Date().toISOString()
    };

    setSearchStats(prev => ({
      searches: prev.searches + 1,
      lastQuery: searchQuery.trim()
    }));

    setShowSuggestions(false);
    
    // Navegación basada en el tipo
    if (type === 'landing') {
      window.location.href = `/paquetes?q=${encodeURIComponent(searchQuery.trim())}`;
    } else {
      onSearch?.(searchData);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    
    if (suggestion.type === 'destination') {
      handleSearch(suggestion.title);
    } else if (suggestion.type === 'category') {
      window.location.href = `/paquetes?category=${suggestion.id.replace('cat-', '')}`;
    } else {
      handleSearch(suggestion.title);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getIcon = (iconName) => {
    const icons = {
      MapPin: MapPin,
      Star: Star,
      Globe: Globe,
      Plane: Plane,
      Users: Users,
      Zap: Zap
    };
    const IconComponent = icons[iconName] || MapPin;
    return <IconComponent className="w-5 h-5" />;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Renderizado para landing (búsqueda simple)
  if (type === 'landing') {
    return (
      <div className={`relative ${className}`}>
        {/* Input Principal */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="¿A dónde quieres viajar? Busca destinos, países o experiencias..."
            className="w-full pl-14 pr-14 py-6 text-xl border-2 border-white/20 rounded-2xl focus:border-white focus:ring-4 focus:ring-white/20 bg-white/95 backdrop-blur-md shadow-2xl placeholder-gray-500 text-gray-900 transition-all"
          />
          
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-6 w-6" />
            </button>
          )}
          
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <ArrowRight className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Sugerencias Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">
                  Resultados para "{query}"
                </span>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{suggestions.length} sugerencias</span>
                  {searchStats.searches > 0 && (
                    <span>• {searchStats.searches} búsquedas realizadas</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de sugerencias */}
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-6 py-4 cursor-pointer transition-all ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border-r-4 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        suggestion.type === 'destination' ? 'bg-blue-100 text-blue-600' :
                        suggestion.type === 'category' ? 'bg-green-100 text-green-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {getIcon(suggestion.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-lg">
                          {suggestion.title}
                        </div>
                        <div className="text-gray-600">
                          {suggestion.subtitle}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {suggestion.price && (
                        <div className="font-bold text-blue-600 text-lg">
                          {formatPrice(suggestion.price)}
                        </div>
                      )}
                      {suggestion.count && (
                        <div className="text-sm text-gray-500">
                          {suggestion.count} paquetes
                        </div>
                      )}
                      {suggestion.type === 'suggestion' && (
                        <div className="flex items-center text-purple-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span className="text-sm">Sugerencia</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer con acciones rápidas */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="flex items-center">
                    <Search className="w-4 h-4 mr-1" />
                    Buscar "{query}" en todos los paquetes
                  </span>
                </div>
                <button
                  onClick={() => handleSearch()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver todos los resultados
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Búsquedas populares cuando no hay query */}
        {!query && (
          <div className="mt-6 text-center">
            <p className="text-white/80 mb-4 text-lg">Destinos populares:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {searchService.popularDestinations.slice(0, 6).map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => {
                    setQuery(dest.name);
                    handleSearch(dest.name);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-all backdrop-blur-sm border border-white/20 hover:border-white/40"
                >
                  {dest.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Renderizado para página de paquetes (búsqueda avanzada)
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Búsqueda principal */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Buscar destinos, países o experiencias..."
          className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm"
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Botón de filtros */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {suggestions.length > 0 && `${suggestions.length} sugerencias`}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros avanzados</span>
        </button>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-4">Filtros de búsqueda</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de viaje
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Todos los tipos</option>
                {searchService.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración
              </label>
              <select
                value={filters.duration}
                onChange={(e) => setFilters(prev => ({...prev, duration: e.target.value}))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Cualquier duración</option>
                <option value="1-3">1-3 días</option>
                <option value="4-7">4-7 días</option>
                <option value="8-14">8-14 días</option>
                <option value="15+">15+ días</option>
              </select>
            </div>

            {/* Viajeros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Viajeros
              </label>
              <select
                value={filters.travelers}
                onChange={(e) => setFilters(prev => ({...prev, travelers: Number(e.target.value)}))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              >
                {Array.from({length: 10}, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'viajero' : 'viajeros'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rango de precios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rango de precio: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
            </label>
            <div className="flex space-x-4">
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={filters.priceRange[0]}
                onChange={(e) => setFilters(prev => ({
                  ...prev, 
                  priceRange: [Number(e.target.value), prev.priceRange[1]]
                }))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={filters.priceRange[1]}
                onChange={(e) => setFilters(prev => ({
                  ...prev, 
                  priceRange: [prev.priceRange[0], Number(e.target.value)]
                }))}
                className="flex-1"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={() => handleSearch(query, filters)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Aplicar filtros</span>
            </button>
            <button
              onClick={() => {
                setFilters({
                  destination: '',
                  category: '',
                  priceRange: [0, 5000],
                  duration: '',
                  departure: '',
                  travelers: 2
                });
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Sugerencias para página de paquetes */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`p-3 cursor-pointer rounded-lg transition-all ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {getIcon(suggestion.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {suggestion.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {suggestion.subtitle}
                    </div>
                  </div>
                  {suggestion.price && (
                    <div className="text-blue-600 font-semibold">
                      {formatPrice(suggestion.price)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchSystem;
