'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Filter,
  Star,
  Plane,
  Heart,
  TrendingUp,
  Clock,
  DollarSign,
  Globe,
  Zap,
  X,
  ArrowRight,
  Sparkles,
  Target,
  ChevronDown,
  Settings
} from 'lucide-react';

// Tipos TypeScript
interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'destination' | 'package' | 'country' | 'category' | 'experience';
  source: 'intertravel' | 'travel-compositor' | 'ai-suggestion';
  priority: number;
  icon?: string;
  price?: number;
  count?: number;
  metadata?: Record<string, any>;
}

interface SearchFilters {
  destination?: string;
  country?: string;
  category?: string;
  priceRange: [number, number];
  dateRange: { start?: string; end?: string };
  travelers: number;
  duration?: string;
  experience?: string;
}

interface UnifiedSearchProps {
  mode: 'landing' | 'packages' | 'compact';
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
}

// Datos simulados mejorados
const TRENDING_DESTINATIONS = [
  { id: 'cusco', name: 'Cusco, Perú', icon: '🏔️', trend: '+25%', price: 1890 },
  { id: 'paris', name: 'París, Francia', icon: '🗼', trend: '+18%', price: 2299 },
  { id: 'tokyo', name: 'Tokio, Japón', icon: '🏯', trend: '+32%', price: 3200 },
  { id: 'bali', name: 'Bali, Indonesia', icon: '🏝️', trend: '+41%', price: 1650 },
  { id: 'iceland', name: 'Islandia', icon: '🌋', trend: '+28%', price: 2800 },
  { id: 'dubai', name: 'Dubái, EAU', icon: '🏙️', trend: '+15%', price: 2400 }
];

const EXPERIENCE_CATEGORIES = [
  { id: 'cultural', name: 'Cultural', icon: '🏛️', color: 'blue' },
  { id: 'adventure', name: 'Aventura', icon: '🏔️', color: 'green' },
  { id: 'beach', name: 'Playa', icon: '🏖️', color: 'cyan' },
  { id: 'romantic', name: 'Romántico', icon: '💕', color: 'pink' },
  { id: 'family', name: 'Familiar', icon: '👨‍👩‍👧‍👦', color: 'orange' },
  { id: 'luxury', name: 'Lujo', icon: '💎', color: 'purple' },
  { id: 'food', name: 'Gastronómico', icon: '🍷', color: 'red' },
  { id: 'wellness', name: 'Wellness', icon: '🧘', color: 'emerald' }
];

const AI_SMART_SUGGESTIONS = [
  'Viaje romántico a Europa por 10 días',
  'Aventura familiar en la Patagonia',
  'Tour gastronómico por Asia',
  'Escapada de spa y wellness',
  'Crucero por el Mediterráneo',
  'Safari en África Oriental',
  'Trekking en los Himalayas',
  'Playas paradisíacas del Caribe'
];

export default function UnifiedSearchSystem({
  mode = 'landing',
  onSearch,
  placeholder,
  className = '',
  showFilters = true,
  autoFocus = false,
  initialValue = ''
}: UnifiedSearchProps) {
  // Estados principales
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Estados de filtros
  const [filters, setFilters] = useState<SearchFilters>({
    priceRange: [0, 5000],
    dateRange: {},
    travelers: 2
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Referencias
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Funciones de utilidad
  const getPlaceholderText = () => {
    if (placeholder) return placeholder;
    
    switch (mode) {
      case 'landing':
        return "¿A dónde quieres viajar? Ej: 'París en pareja'";
      case 'packages':
        return "Buscar destinos, experiencias o paquetes...";
      case 'compact':
        return "Buscar viajes...";
      default:
        return "¿A dónde quieres viajar?";
    }
  };

  const generateSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Simular API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockSuggestions: SearchSuggestion[] = [];
    const queryLower = searchQuery.toLowerCase();
    
    // Sugerencias basadas en destinos trending
    TRENDING_DESTINATIONS.forEach(dest => {
      if (dest.name.toLowerCase().includes(queryLower)) {
        mockSuggestions.push({
          id: `dest-${dest.id}`,
          title: dest.name,
          subtitle: `Desde $${dest.price.toLocaleString()} • ${dest.trend} popularidad`,
          type: 'destination',
          source: 'intertravel',
          priority: 90,
          icon: dest.icon,
          price: dest.price
        });
      }
    });
    
    // Sugerencias de categorías
    EXPERIENCE_CATEGORIES.forEach(cat => {
      if (cat.name.toLowerCase().includes(queryLower)) {
        mockSuggestions.push({
          id: `cat-${cat.id}`,
          title: `Viajes ${cat.name}`,
          subtitle: 'Experiencias curadas por expertos',
          type: 'category',
          source: 'intertravel',
          priority: 80,
          icon: cat.icon
        });
      }
    });
    
    // Sugerencias inteligentes de IA
    AI_SMART_SUGGESTIONS.forEach((suggestion, index) => {
      if (suggestion.toLowerCase().includes(queryLower)) {
        mockSuggestions.push({
          id: `ai-${index}`,
          title: suggestion,
          subtitle: 'Sugerencia personalizada por IA',
          type: 'experience',
          source: 'ai-suggestion',
          priority: 70,
          icon: '🤖'
        });
      }
    });
    
    // Ordenar por prioridad y fuente
    const sortedSuggestions = mockSuggestions
      .sort((a, b) => {
        if (a.source === 'intertravel' && b.source !== 'intertravel') return -1;
        if (b.source === 'intertravel' && a.source !== 'intertravel') return 1;
        return b.priority - a.priority;
      })
      .slice(0, 8);
    
    setSuggestions(sortedSuggestions);
    setIsLoading(false);
  }, []);

  // Efectos
  useEffect(() => {
    if (query.length >= 2) {
      generateSuggestions(query);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, generateSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejadores de eventos
  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    // Guardar en historial
    setSearchHistory(prev => {
      const newHistory = [searchQuery, ...prev.filter(item => item !== searchQuery)].slice(0, 5);
      return newHistory;
    });

    onSearch(searchQuery.trim(), filters);
    setShowSuggestions(false);
    setIsExpanded(false);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    handleSearch(suggestion.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
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

  const handleFocus = () => {
    setIsExpanded(true);
    if (query.length === 0 && searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    if (suggestion.icon) return suggestion.icon;
    
    switch (suggestion.type) {
      case 'destination': return '📍';
      case 'package': return '✈️';
      case 'category': return '🎯';
      case 'experience': return '✨';
      default: return '🔍';
    }
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      'intertravel': { text: 'InterTravel', color: 'bg-yellow-100 text-yellow-800', icon: '⭐' },
      'travel-compositor': { text: 'TC', color: 'bg-blue-100 text-blue-800', icon: '🌐' },
      'ai-suggestion': { text: 'IA', color: 'bg-purple-100 text-purple-800', icon: '🤖' }
    };
    
    const badge = badges[source as keyof typeof badges] || badges['travel-compositor'];
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  // Renderizado principal
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input principal con animaciones */}
      <motion.div
        initial={false}
        animate={{
          boxShadow: isExpanded 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : mode === 'landing'
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        transition={{ duration: 0.2 }}
        className={`relative bg-white rounded-xl overflow-hidden border-2 ${
          isExpanded ? 'border-blue-500' : 'border-gray-200'
        } ${mode === 'landing' ? 'bg-white/95 backdrop-blur-md' : ''}`}
      >
        <div className="flex items-center">
          {/* Icono de búsqueda */}
          <div className="flex-shrink-0 p-3">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Input principal */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={getPlaceholderText()}
            autoFocus={autoFocus}
            className={`flex-1 placeholder-gray-400 focus:outline-none ${
              mode === 'landing' 
                ? 'text-lg py-4 font-medium' 
                : mode === 'packages' 
                  ? 'text-base py-3' 
                  : 'py-2'
            }`}
          />

          {/* Acciones del input */}
          <div className="flex items-center p-3 space-x-2">
            {query && (
              <button
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            {showFilters && mode !== 'compact' && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showAdvancedFilters 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || isLoading}
              className={`font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                mode === 'landing'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 shadow-lg hover:shadow-xl'
                  : 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'compact' ? 'Buscar' : 'Buscar Viajes'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Indicador de procesamiento inteligente */}
        {query.length > 10 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-2 border-t border-gray-100"
          >
            <div className="flex items-center text-sm text-blue-600">
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              <span>IA analizando tu consulta para mejores resultados...</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Filtros avanzados */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 z-40"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tipo de experiencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Experiencia
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_CATEGORIES.slice(0, 4).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        filters.category === cat.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="block text-lg mb-1">{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Viajeros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Viajeros
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, travelers: Math.max(1, prev.travelers - 1) }))}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">{filters.travelers}</span>
                  </div>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, travelers: Math.min(20, prev.travelers + 1) }))}
                    className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Rango de precio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presupuesto (USD)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                    }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            {/* Acciones de filtros */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setFilters({ priceRange: [0, 5000], dateRange: {}, travelers: 2 })}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Limpiar filtros
              </button>
              <button
                onClick={() => {
                  handleSearch();
                  setShowAdvancedFilters(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Aplicar filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown de sugerencias */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            {/* Header de sugerencias */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {query.length === 0 ? '🕒 Búsquedas recientes' : '💡 Sugerencias inteligentes'}
                </span>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>Powered by</span>
                  <Zap className="w-3 h-3 text-blue-500" />
                  <span className="font-medium">InterTravel AI</span>
                </div>
              </div>
            </div>

            {/* Lista de sugerencias */}
            <div className="max-h-80 overflow-y-auto">
              {query.length === 0 && searchHistory.length > 0 ? (
                // Mostrar historial de búsquedas
                searchHistory.map((item, index) => (
                  <motion.button
                    key={`history-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{item}</span>
                  </motion.button>
                ))
              ) : (
                // Mostrar sugerencias de búsqueda
                suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                      index === selectedIndex 
                        ? 'bg-blue-50 border-r-2 border-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-xl">{getSuggestionIcon(suggestion)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{suggestion.title}</div>
                        {suggestion.subtitle && (
                          <div className="text-sm text-gray-600">{suggestion.subtitle}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {suggestion.price && (
                        <span className="text-blue-600 font-semibold">
                          ${suggestion.price.toLocaleString()}
                        </span>
                      )}
                      {getSourceBadge(suggestion.source)}
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer con estadísticas */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {suggestions.length > 0 
                    ? `${suggestions.length} sugerencias encontradas`
                    : searchHistory.length > 0 
                      ? `${searchHistory.length} búsquedas recientes`
                      : 'Empieza a escribir para ver sugerencias'
                  }
                </span>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                    InterTravel
                  </span>
                  <span className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    Travel Compositor
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESTINOS TRENDING TEMPORALMENTE COMENTADO
      {mode === 'landing' && !isExpanded && !query && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              🔥 Destinos Trending
            </h3>
            <p className="text-white/80">Los más buscados esta semana</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TRENDING_DESTINATIONS.slice(0, 6).map((dest, index) => (
              <motion.button
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  setQuery(dest.name);
                  handleSearch(dest.name);
                }}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-xl transition-all border border-white/20 hover:border-white/40 group"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                  {dest.icon}
                </div>
                <div className="text-sm font-medium mb-1">{dest.name}</div>
                <div className="text-xs text-white/80 flex items-center justify-between">
                  <span>${dest.price.toLocaleString()}</span>
                  <span className="bg-green-500 px-2 py-1 rounded-full text-white font-medium">
                    {dest.trend}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
      */}
    </div>
  );
}
