'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, Clock, DollarSign, Plane, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchService, { SearchSuggestion } from '@/lib/search-service';

interface SmartSearchProps {
  onSearch: (query: string, filters?: any) => void;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
}

export default function SmartSearch({
  onSearch,
  placeholder = "¿A dónde quieres viajar?",
  className = "",
  showFilters = true,
  autoFocus = false,
  initialValue = ""
}: SmartSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({ count: 0, lastSearch: '' });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchService = SearchService.getInstance();

  // Debounce para las sugerencias
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const suggestions = await searchService.getSearchSuggestions(query, 8);
        setSuggestions(suggestions);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error obteniendo sugerencias:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
      setSearchStats(prev => ({
        count: prev.count + 1,
        lastSearch: query.trim()
      }));
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    onSearch(suggestion.title);
    setSearchStats(prev => ({
      count: prev.count + 1,
      lastSearch: suggestion.title
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  const getSuggestionIcon = (type: string, source: string) => {
    if (source === 'intertravel') {
      return <Star className="w-4 h-4 text-yellow-500 fill-current" />;
    }
    
    switch (type) {
      case 'destination':
        return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'package':
        return <Plane className="w-4 h-4 text-green-500" />;
      case 'country':
        return <MapPin className="w-4 h-4 text-purple-500" />;
      case 'category':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSuggestionBadge = (source: string) => {
    if (source === 'intertravel') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          InterTravel
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        TC
      </span>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Principal */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 h-14 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm"
          autoFocus={autoFocus}
        />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Sugerencias Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
        >
          {/* Header de sugerencias */}
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Sugerencias de búsqueda
              </span>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {searchStats.count > 0 && (
                  <span>{searchStats.count} búsquedas realizadas</span>
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
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-r-2 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {getSuggestionIcon(suggestion.type, suggestion.source)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {suggestion.title}
                      </div>
                      {suggestion.metadata && (
                        <div className="text-sm text-gray-500">
                          {suggestion.metadata.country && (
                            <span>{suggestion.metadata.country}</span>
                          )}
                          {suggestion.metadata.category && (
                            <span className="ml-2 text-blue-600">
                              {suggestion.metadata.category}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getSuggestionBadge(suggestion.source)}
                    {suggestion.source === 'intertravel' && (
                      <div className="text-xs text-yellow-600 font-medium">
                        Destacado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer con stats */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Mostrando {suggestions.length} sugerencias
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
        </div>
      )}

      {/* Mensaje cuando no hay sugerencias */}
      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-6 text-center">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">No se encontraron sugerencias</p>
            <p className="text-sm text-gray-500 mt-1">
              Intenta con otro término de búsqueda
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSearch}
              className="mt-3 text-blue-600 hover:text-blue-700"
            >
              Buscar "{query}" de todas formas
            </Button>
          </div>
        </div>
      )}

      {/* Búsquedas recientes */}
      {query.length === 0 && searchStats.lastSearch && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Búsqueda reciente
            </div>
            <button
              onClick={() => {
                setQuery(searchStats.lastSearch);
                onSearch(searchStats.lastSearch);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>{searchStats.lastSearch}</span>
            </button>
          </div>
        </div>
      )}

      {/* Botón de búsqueda (móvil) */}
      <div className="mt-4 sm:hidden">
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Buscar Viajes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
