/**
 * 🔍 SEARCH SERVICE - INTEGRACIÓN TRAVEL COMPOSITOR
 * =================================================
 * Sistema de búsqueda inteligente con autocompletado
 * Prioriza paquetes InterTravel y se conecta con TC
 */

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'destination' | 'package' | 'country' | 'category';
  source: 'intertravel' | 'travel-compositor';
  priority: number;
  metadata?: {
    country?: string;
    region?: string;
    category?: string;
    price?: number;
  };
}

interface SearchFilters {
  destination?: string;
  country?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  duration?: number;
  travelers?: number;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  destination: string;
  country: string;
  price: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  category: string;
  images: {
    main: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  features: string[];
  source: 'intertravel' | 'travel-compositor';
  priority: number;
  featured: boolean;
  uniqueKey?: string;
}

class SearchService {
  private static instance: SearchService;
  private cache: Map<string, any> = new Map();
  private suggestionCache: Map<string, SearchSuggestion[]> = new Map();
  private readonly API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3002/api' 
    : '/api';

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Obtiene sugerencias de autocompletado
   */
  async getSearchSuggestions(query: string, limit: number = 8): Promise<SearchSuggestion[]> {
    if (query.length < 2) return [];

    const cacheKey = `suggestions_${query.toLowerCase()}_${limit}`;
    
    // Verificar cache
    if (this.suggestionCache.has(cacheKey)) {
      return this.suggestionCache.get(cacheKey)!;
    }

    try {
      console.log('🔍 Obteniendo sugerencias para:', query);
      
      const response = await fetch(`${this.API_BASE}/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();

      if (data.success) {
        const suggestions = this.processSuggestions(data.suggestions || []);
        
        // Cachear por 5 minutos
        this.suggestionCache.set(cacheKey, suggestions);
        setTimeout(() => this.suggestionCache.delete(cacheKey), 5 * 60 * 1000);
        
        return suggestions;
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias:', error);
    }

    // Fallback: sugerencias locales
    return this.getFallbackSuggestions(query, limit);
  }

  /**
   * Búsqueda principal de paquetes
   */
  async searchPackages(query: string, filters: SearchFilters = {}): Promise<{
    results: SearchResult[];
    total: number;
    source: string;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Búsqueda de paquetes:', { query, filters });
      
      // Construir parámetros de búsqueda
      const searchParams = new URLSearchParams();
      
      if (query) {
        searchParams.append('q', query);
        searchParams.append('search', query);
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      
      // Hacer búsqueda en Travel Compositor
      const response = await fetch(`${this.API_BASE}/packages/search?${searchParams.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        const results = this.processSearchResults(data.packages || data.data || []);
        const processingTime = Date.now() - startTime;
        
        console.log(`✅ Búsqueda completada en ${processingTime}ms: ${results.length} resultados`);
        
        return {
          results,
          total: results.length,
          source: data._source || 'travel-compositor',
          processingTime
        };
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    }

    // Fallback: búsqueda local
    return this.getFallbackSearchResults(query, filters);
  }

  /**
   * Procesa las sugerencias priorizando InterTravel
   */
  private processSuggestions(suggestions: any[]): SearchSuggestion[] {
    return suggestions
      .map(suggestion => ({
        id: suggestion.id || suggestion.title?.toLowerCase().replace(/\s+/g, '-'),
        title: suggestion.title || suggestion.name,
        type: suggestion.type || 'destination',
        source: suggestion.source || 'travel-compositor',
        priority: suggestion.source === 'intertravel' ? 100 : suggestion.priority || 50,
        metadata: suggestion.metadata
      }))
      .sort((a, b) => {
        // InterTravel primero
        if (a.source === 'intertravel' && b.source !== 'intertravel') return -1;
        if (b.source === 'intertravel' && a.source !== 'intertravel') return 1;
        
        // Luego por prioridad
        return b.priority - a.priority;
      });
  }

  /**
   * Procesa los resultados de búsqueda priorizando InterTravel
   */
  private processSearchResults(packages: any[]): SearchResult[] {
    return packages
      .map(pkg => ({
        id: pkg.id || pkg._id,
        title: pkg.title || pkg.name,
        description: pkg.description?.short || pkg.description || 'Experiencia única de viaje',
        destination: pkg.destination || pkg.location?.destination,
        country: pkg.country || pkg.location?.country,
        price: {
          amount: pkg.price?.amount || pkg.price || 1500,
          currency: pkg.price?.currency || 'USD'
        },
        duration: {
          days: pkg.duration?.days || 7,
          nights: pkg.duration?.nights || 6
        },
        category: pkg.category || 'Turismo',
        images: {
          main: pkg.images?.main || pkg.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600'
        },
        rating: pkg.rating || { average: 4.5, count: 10 },
        features: pkg.features || ['Todo incluido', 'Guía en español'],
        source: pkg.source || (pkg.provider === 'intertravel' ? 'intertravel' : 'travel-compositor'),
        priority: pkg.source === 'intertravel' ? 100 : 50,
        featured: pkg.featured || pkg.source === 'intertravel'
      }))
      .sort((a, b) => {
        // InterTravel primero
        if (a.source === 'intertravel' && b.source !== 'intertravel') return -1;
        if (b.source === 'intertravel' && a.source !== 'intertravel') return 1;
        
        // Luego destacados
        if (a.featured && !b.featured) return -1;
        if (b.featured && !a.featured) return 1;
        
        // Finalmente por rating
        return (b.rating?.average || 0) - (a.rating?.average || 0);
      });
  }

  /**
   * Sugerencias de fallback cuando no hay conexión con TC
   */
  private getFallbackSuggestions(query: string, limit: number): SearchSuggestion[] {
    const fallbackSuggestions: SearchSuggestion[] = [
      // Destinos populares InterTravel
      { id: 'peru-magico', title: 'Perú Mágico - Cusco y Machu Picchu', type: 'package', source: 'intertravel', priority: 100 },
      { id: 'europa-clasica', title: 'Europa Clásica - París, Roma, Londres', type: 'package', source: 'intertravel', priority: 100 },
      { id: 'brasil-espectacular', title: 'Brasil Espectacular', type: 'package', source: 'intertravel', priority: 100 },
      
      // Destinos
      { id: 'cusco', title: 'Cusco, Perú', type: 'destination', source: 'intertravel', priority: 95 },
      { id: 'paris', title: 'París, Francia', type: 'destination', source: 'travel-compositor', priority: 80 },
      { id: 'roma', title: 'Roma, Italia', type: 'destination', source: 'travel-compositor', priority: 80 },
      { id: 'londres', title: 'Londres, Reino Unido', type: 'destination', source: 'travel-compositor', priority: 80 },
      { id: 'tokio', title: 'Tokio, Japón', type: 'destination', source: 'travel-compositor', priority: 75 },
      { id: 'bangkok', title: 'Bangkok, Tailandia', type: 'destination', source: 'travel-compositor', priority: 75 },
      { id: 'rio', title: 'Río de Janeiro, Brasil', type: 'destination', source: 'travel-compositor', priority: 70 },
      
      // Países
      { id: 'peru', title: 'Perú', type: 'country', source: 'intertravel', priority: 90 },
      { id: 'francia', title: 'Francia', type: 'country', source: 'travel-compositor', priority: 70 },
      { id: 'italia', title: 'Italia', type: 'country', source: 'travel-compositor', priority: 70 },
      { id: 'japon', title: 'Japón', type: 'country', source: 'travel-compositor', priority: 65 },
      { id: 'brasil', title: 'Brasil', type: 'country', source: 'travel-compositor', priority: 65 },
      
      // Categorías
      { id: 'cultural', title: 'Turismo Cultural', type: 'category', source: 'intertravel', priority: 60 },
      { id: 'aventura', title: 'Turismo de Aventura', type: 'category', source: 'travel-compositor', priority: 55 },
      { id: 'playa', title: 'Destinos de Playa', type: 'category', source: 'travel-compositor', priority: 55 },
      { id: 'ride', title: 'RIDE - Viajes de Egresados', type: 'category', source: 'intertravel', priority: 85 }
    ];

    const queryLower = query.toLowerCase();
    
    return fallbackSuggestions
      .filter(suggestion => 
        suggestion.title.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);
  }

  /**
   * Resultados de fallback cuando no hay conexión con TC
   */
  private getFallbackSearchResults(query: string, filters: SearchFilters): {
    results: SearchResult[];
    total: number;
    source: string;
    processingTime: number;
  } {
    const startTime = Date.now();
    
    const fallbackResults: SearchResult[] = [
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
        features: ['Vuelos incluidos', 'Hoteles 4*', 'Guía especializado', 'Tren a Machu Picchu'],
        source: 'intertravel',
        priority: 100,
        featured: true
      },
      {
        id: '2',
        title: 'Europa Clásica - París, Roma, Londres',
        description: 'Recorre las capitales más emblemáticas de Europa.',
        destination: 'Europa Occidental',
        country: 'Francia, Italia, Reino Unido',
        price: { amount: 2299, currency: 'USD' },
        duration: { days: 12, nights: 11 },
        category: 'Cultural',
        images: { main: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600' },
        rating: { average: 4.8, count: 156 },
        features: ['Vuelos incluidos', 'Hoteles 4*', 'Desayunos', 'Guía en español'],
        source: 'intertravel',
        priority: 100,
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
        features: ['Vuelos incluidos', 'Hoteles 4*', 'Traslados', 'Tours'],
        source: 'travel-compositor',
        priority: 50,
        featured: false
      }
    ];

    // Filtrar resultados
    let filteredResults = fallbackResults;

    if (query) {
      const queryLower = query.toLowerCase();
      filteredResults = filteredResults.filter(result =>
        result.title.toLowerCase().includes(queryLower) ||
        result.destination.toLowerCase().includes(queryLower) ||
        result.country.toLowerCase().includes(queryLower) ||
        result.category.toLowerCase().includes(queryLower)
      );
    }

    // Aplicar filtros adicionales
    if (filters.country) {
      filteredResults = filteredResults.filter(result =>
        result.country.toLowerCase().includes(filters.country!.toLowerCase())
      );
    }

    if (filters.category) {
      filteredResults = filteredResults.filter(result =>
        result.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters.minPrice) {
      filteredResults = filteredResults.filter(result =>
        result.price.amount >= filters.minPrice!
      );
    }

    if (filters.maxPrice) {
      filteredResults = filteredResults.filter(result =>
        result.price.amount <= filters.maxPrice!
      );
    }

    const processingTime = Date.now() - startTime;

    return {
      results: filteredResults,
      total: filteredResults.length,
      source: 'fallback-local',
      processingTime
    };
  }

  /**
   * Limpia el cache de búsquedas
   */
  clearCache(): void {
    this.cache.clear();
    this.suggestionCache.clear();
    console.log('🧹 Cache de búsqueda limpiado');
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): { suggestions: number; searches: number } {
    return {
      suggestions: this.suggestionCache.size,
      searches: this.cache.size
    };
  }
}

export default SearchService;
export type { SearchSuggestion, SearchFilters, SearchResult };
