import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces
interface SearchFilters {
  priceRange: [number, number];
  travelers: number;
  category?: string;
  country?: string;
  dateRange?: { start?: string; end?: string };
  duration?: string;
  features?: string[];
}

interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'destination' | 'package' | 'country' | 'category' | 'experience';
  source: 'intertravel' | 'travel-compositor' | 'ai-suggestion';
  priority: number;
  metadata?: Record<string, any>;
}

interface SearchState {
  query: string;
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  results: any[];
  totalResults: number;
  hasMore: boolean;
  error: string | null;
  searchHistory: string[];
}

// API Configuration
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

export const useUnifiedSearch = () => {
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Estado principal
  const [state, setState] = useState<SearchState>({
    query: '',
    suggestions: [],
    isLoading: false,
    results: [],
    totalResults: 0,
    hasMore: true,
    error: null,
    searchHistory: []
  });

  // Cargar historial desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('intertravel_search_history');
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          setState(prev => ({ ...prev, searchHistory: history }));
        } catch (error) {
          console.error('Error cargando historial de búsqueda:', error);
        }
      }
    }
  }, []);

  // Guardar historial en localStorage
  const saveSearchHistory = useCallback((query: string) => {
    if (typeof window !== 'undefined') {
      setState(prev => {
        const newHistory = [query, ...prev.searchHistory.filter(item => item !== query)].slice(0, 10);
        localStorage.setItem('intertravel_search_history', JSON.stringify(newHistory));
        return { ...prev, searchHistory: newHistory };
      });
    }
  }, []);

  // Obtener sugerencias
  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (query.length < 2) return [];

    try {
      // Cancelar búsqueda anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Crear nuevo AbortController
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${API_BASE}/search/suggestions?q=${encodeURIComponent(query)}&limit=8`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.suggestions) {
        return data.suggestions.map((suggestion: any) => ({
          id: suggestion.id || `suggestion-${Date.now()}`,
          title: suggestion.title || suggestion.name,
          subtitle: suggestion.subtitle || suggestion.description,
          type: suggestion.type || 'destination',
          source: suggestion.source || 'travel-compositor',
          priority: suggestion.priority || 50,
          metadata: suggestion.metadata || {}
        }));
      }

      return [];
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return []; // Búsqueda cancelada, no es un error
      }
      
      console.error('Error obteniendo sugerencias:', error);
      
      // Fallback con sugerencias locales
      return getFallbackSuggestions(query);
    }
  }, []);

  // Sugerencias de fallback
  const getFallbackSuggestions = useCallback((query: string): SearchSuggestion[] => {
    const fallbackSuggestions: SearchSuggestion[] = [
      // Destinos populares
      { id: 'cusco', title: 'Cusco, Perú', type: 'destination', source: 'intertravel', priority: 95 },
      { id: 'paris', title: 'París, Francia', type: 'destination', source: 'travel-compositor', priority: 90 },
      { id: 'tokyo', title: 'Tokio, Japón', type: 'destination', source: 'travel-compositor', priority: 85 },
      { id: 'rome', title: 'Roma, Italia', type: 'destination', source: 'travel-compositor', priority: 80 },
      
      // Categorías
      { id: 'cultural', title: 'Viajes Culturales', type: 'category', source: 'intertravel', priority: 75 },
      { id: 'adventure', title: 'Turismo de Aventura', type: 'category', source: 'travel-compositor', priority: 70 },
      { id: 'beach', title: 'Destinos de Playa', type: 'category', source: 'travel-compositor', priority: 65 },
      { id: 'romantic', title: 'Viajes Románticos', type: 'category', source: 'intertravel', priority: 60 },
      
      // Experiencias IA
      { id: 'ai-europe', title: 'Tour por Europa', subtitle: 'Sugerencia personalizada', type: 'experience', source: 'ai-suggestion', priority: 55 },
      { id: 'ai-asia', title: 'Aventura en Asia', subtitle: 'Recomendado por IA', type: 'experience', source: 'ai-suggestion', priority: 50 }
    ];

    const queryLower = query.toLowerCase();
    return fallbackSuggestions
      .filter(suggestion => 
        suggestion.title.toLowerCase().includes(queryLower)
      )
      .slice(0, 6);
  }, []);

  // Buscar paquetes
  const searchPackages = useCallback(async (
    query: string, 
    filters?: SearchFilters, 
    page: number = 1
  ) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      ...(page === 1 && { results: [], totalResults: 0 })
    }));

    try {
      // Cancelar búsqueda anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Construir parámetros de búsqueda
      const searchParams = new URLSearchParams();
      searchParams.append('page', page.toString());
      searchParams.append('pageSize', '20');
      
      if (query) {
        searchParams.append('q', query);
        searchParams.append('search', query);
      }
      
      if (filters) {
        if (filters.category) searchParams.append('category', filters.category);
        if (filters.country) searchParams.append('country', filters.country);
        if (filters.priceRange[0] > 0) searchParams.append('minPrice', filters.priceRange[0].toString());
        if (filters.priceRange[1] < 10000) searchParams.append('maxPrice', filters.priceRange[1].toString());
        if (filters.travelers !== 2) searchParams.append('travelers', filters.travelers.toString());
        if (filters.dateRange?.start) searchParams.append('departure', filters.dateRange.start);
        if (filters.dateRange?.end) searchParams.append('return', filters.dateRange.end);
        if (filters.duration) searchParams.append('duration', filters.duration);
        if (filters.features?.length) searchParams.append('features', filters.features.join(','));
      }

      const response = await fetch(
        `${API_BASE}/packages/search?${searchParams.toString()}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const newResults = data.data || data.packages || [];
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          results: page === 1 ? newResults : [...prev.results, ...newResults],
          totalResults: data.pagination?.total || data.total || newResults.length,
          hasMore: data.pagination?.hasMore || false,
          error: null
        }));

        return {
          results: newResults,
          total: data.pagination?.total || newResults.length,
          hasMore: data.pagination?.hasMore || false,
          source: data.source || 'backend'
        };
      } else {
        throw new Error(data.message || 'Error en la búsqueda');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return null; // Búsqueda cancelada
      }

      console.error('Error en búsqueda de paquetes:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error realizando la búsqueda',
        hasMore: false
      }));

      // Fallback con datos locales solo en la primera página
      if (page === 1) {
        const fallbackResults = getFallbackPackages(query, filters);
        setState(prev => ({
          ...prev,
          results: fallbackResults,
          totalResults: fallbackResults.length,
          hasMore: false
        }));
        
        return {
          results: fallbackResults,
          total: fallbackResults.length,
          hasMore: false,
          source: 'fallback'
        };
      }

      return null;
    }
  }, []);

  // Paquetes de fallback
  const getFallbackPackages = useCallback((query: string, filters?: SearchFilters) => {
    const fallbackPackages = [
      {
        id: '1',
        title: 'Perú Mágico - Cusco y Machu Picchu',
        description: 'Descubre las maravillas del Imperio Inca en este viaje inolvidable.',
        destination: 'Cusco',
        country: 'Perú',
        price: { amount: 1890, currency: 'USD' },
        duration: { days: 8, nights: 7 },
        category: 'Cultural',
        images: { main: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600' },
        rating: { average: 4.9, count: 234 },
        features: ['Vuelos incluidos', 'Hoteles 4*', 'Guía especializado'],
        source: 'intertravel',
        featured: true
      },
      {
        id: '2',
        title: 'Europa Clásica - París, Roma, Londres',
        description: 'Recorre las capitales más emblemáticas de Europa.',
        destination: 'Europa',
        country: 'Francia, Italia, Reino Unido',
        price: { amount: 2299, currency: 'USD' },
        duration: { days: 12, nights: 11 },
        category: 'Cultural',
        images: { main: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600' },
        rating: { average: 4.8, count: 156 },
        features: ['Vuelos incluidos', 'Hoteles 4*', 'Desayunos'],
        source: 'intertravel',
        featured: true
      },
      {
        id: '3',
        title: 'Circuito Asiático - Tokio, Bangkok, Singapur',
        description: 'Explora la fascinante cultura asiática.',
        destination: 'Asia',
        country: 'Japón, Tailandia, Singapur',
        price: { amount: 2899, currency: 'USD' },
        duration: { days: 15, nights: 14 },
        category: 'Aventura',
        images: { main: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600' },
        rating: { average: 4.6, count: 89 },
        features: ['Vuelos incluidos', 'Hoteles 4*', 'Tours'],
        source: 'travel-compositor',
        featured: false
      }
    ];

    // Aplicar filtros básicos
    let filteredResults = fallbackPackages;

    if (query) {
      const queryLower = query.toLowerCase();
      filteredResults = filteredResults.filter(pkg =>
        pkg.title.toLowerCase().includes(queryLower) ||
        pkg.destination.toLowerCase().includes(queryLower) ||
        pkg.country.toLowerCase().includes(queryLower) ||
        pkg.category.toLowerCase().includes(queryLower)
      );
    }

    if (filters) {
      if (filters.category) {
        filteredResults = filteredResults.filter(pkg =>
          pkg.category.toLowerCase() === filters.category?.toLowerCase()
        );
      }

      if (filters.priceRange) {
        filteredResults = filteredResults.filter(pkg =>
          pkg.price.amount >= filters.priceRange[0] &&
          pkg.price.amount <= filters.priceRange[1]
        );
      }
    }

    return filteredResults;
  }, []);

  // Función principal de búsqueda
  const performSearch = useCallback(async (
    query: string, 
    filters?: SearchFilters,
    navigate: boolean = true
  ) => {
    if (!query.trim()) return;

    // Guardar en historial
    saveSearchHistory(query.trim());

    // Realizar búsqueda
    const result = await searchPackages(query.trim(), filters, 1);

    // Navegar si es necesario
    if (navigate && result) {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query.trim());
      
      if (filters) {
        if (filters.category) searchParams.append('category', filters.category);
        if (filters.country) searchParams.append('country', filters.country);
        if (filters.priceRange[0] > 0) searchParams.append('minPrice', filters.priceRange[0].toString());
        if (filters.priceRange[1] < 10000) searchParams.append('maxPrice', filters.priceRange[1].toString());
        if (filters.travelers !== 2) searchParams.append('travelers', filters.travelers.toString());
        if (filters.dateRange?.start) searchParams.append('departure', filters.dateRange.start);
        if (filters.dateRange?.end) searchParams.append('return', filters.dateRange.end);
      }
      
      router.push(`/paquetes?${searchParams.toString()}`);
    }

    return result;
  }, [router, saveSearchHistory, searchPackages]);

  // Cargar más resultados
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;

    const currentPage = Math.floor(state.results.length / 20) + 1;
    await searchPackages(state.query, undefined, currentPage);
  }, [state.hasMore, state.isLoading, state.results.length, state.query, searchPackages]);

  // Limpiar resultados
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      totalResults: 0,
      hasMore: true,
      error: null
    }));
  }, []);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('intertravel_search_history');
      setState(prev => ({ ...prev, searchHistory: [] }));
    }
  }, []);

  // Actualizar query
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  // Actualizar sugerencias
  const setSuggestions = useCallback((suggestions: SearchSuggestion[]) => {
    setState(prev => ({ ...prev, suggestions }));
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Estado
    ...state,
    
    // Acciones
    performSearch,
    getSuggestions,
    searchPackages,
    loadMore,
    clearResults,
    clearHistory,
    setQuery,
    setSuggestions,
    
    // Utilidades
    saveSearchHistory
  };
};

export type { SearchFilters, SearchSuggestion, SearchState };
