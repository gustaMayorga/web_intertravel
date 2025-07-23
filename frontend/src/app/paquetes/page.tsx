'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UnifiedSearchSystem from '@/components/UnifiedSearchSystem';
import SearchService, { SearchResult } from '@/lib/search-service';
import PackageDetailsModal from '@/components/PackageDetailsModal';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Star, 
  Filter,
  Heart,
  Share2,
  Plane,
  Zap,
  Database
} from 'lucide-react';
import WhatsAppReserveButton from '@/components/WhatsAppReserveButton';

// API Configuration
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

interface Package {
  id: string;
  title: string;
  destination: string;
  country: string;
  price: {
    amount: number;
    currency: string;
  };
  originalPrice?: {
    amount: number;
    currency: string;
  };
  duration: {
    days: number;
    nights: number;
  };
  category: string;
  description: {
    short: string;
    full: string;
  };
  images: {
    main: string;
  };
  rating: {
    average: number;
    count: number;
  };
  features: string[];
  featured: boolean;
}

// Función de paquetes de ejemplo como fallback
const getFallbackPackages = (): Package[] => {
  return [
    {
      id: '1',
      title: 'Europa Clásica - París, Roma, Londres',
      destination: 'Europa Occidental',
      country: 'Francia, Italia, Reino Unido',
      price: { amount: 2299, currency: 'USD' },
      originalPrice: { amount: 2799, currency: 'USD' },
      duration: { days: 12, nights: 11 },
      category: 'Cultural',
      description: {
        short: 'Descubre los tesoros de Europa en un viaje inolvidable por París, Roma y Londres.',
        full: 'Un recorrido completo por las capitales más emblemáticas de Europa.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop'
      },
      rating: { average: 4.8, count: 156 },
      features: ['Vuelos incluidos', 'Hoteles 4*', 'Desayunos', 'Guía en español'],
      featured: true
    },
    {
      id: '2',
      title: 'Perú Mágico - Cusco y Machu Picchu',
      destination: 'Cusco',
      country: 'Perú',
      price: { amount: 1890, currency: 'USD' },
      duration: { days: 8, nights: 7 },
      category: 'Cultural',
      description: {
        short: 'Descubre las maravillas del Imperio Inca en este viaje inolvidable.',
        full: 'Un recorrido completo por la historia de los Incas.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop'
      },
      rating: { average: 4.9, count: 234 },
      features: ['Vuelos incluidos', 'Hoteles 4*', 'Guía especializado', 'Tren a Machu Picchu'],
      featured: true
    },
    {
      id: '3',
      title: 'RIDE Bariloche Clásico',
      destination: 'Bariloche',
      country: 'Argentina',
      price: { amount: 899, currency: 'USD' },
      duration: { days: 7, nights: 6 },
      category: 'ride',
      description: {
        short: 'El clásico viaje de egresados a Bariloche con todas las actividades.',
        full: 'Aventura, diversión y experiencias únicas en la Patagonia.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop'
      },
      rating: { average: 4.9, count: 156 },
      features: ['Coordinadores 24/7', 'Actividades incluidas', 'Seguro integral', 'Disco'],
      featured: true
    }
  ];
};

export default function PackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchService = SearchService.getInstance();
  
  const [packages, setPackages] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [searchResults, setSearchResults] = useState<{
    results: SearchResult[];
    total: number;
    source: string;
    processingTime: number;
  } | null>(null);
  
  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [departureDate, setDepartureDate] = useState(searchParams.get('departure') || '');
  const [returnDate, setReturnDate] = useState(searchParams.get('return') || '');
  const [priceRange, setPriceRange] = useState({
    min: parseInt(searchParams.get('minPrice') || '0'),
    max: parseInt(searchParams.get('maxPrice') || '5000')
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'featured');
  const [travelers, setTravelers] = useState(parseInt(searchParams.get('travelers') || '2'));
  
  // Estado para el modal de detalles
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPackageData, setSelectedPackageData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Función para abrir el modal
  const openPackageModal = (packageId: string, packageData?: any) => {
    console.log('🎯 Abriendo modal para:', packageId, packageData);
    setSelectedPackageId(packageId);
    setSelectedPackageData(packageData || null);
    setIsModalOpen(true);
  };
  
  // Función para cerrar el modal
  const closePackageModal = () => {
    setSelectedPackageId(null);
    setSelectedPackageData(null);
    setIsModalOpen(false);
  };

  useEffect(() => {
    loadPackages(true); // true = reset
  }, []);

  // Scroll infinito
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 &&
        !loading &&
        !loadingMore &&
        hasMorePages
      ) {
        loadMorePackages();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMorePages]);

  // Función para manejar la búsqueda inteligente
  const handleSmartSearch = async (query: string) => {
    setSearchTerm(query);
    await loadPackages(true); // Reset y buscar
  };

  // Función para manejar la búsqueda avanzada
  const handleAdvancedSearch = async (searchData: any) => {
    console.log('🔍 Búsqueda avanzada:', searchData);
    
    // Aplicar filtros de la búsqueda avanzada
    setSearchTerm(searchData.query);
    if (searchData.filters.category) {
      setSelectedCategory(searchData.filters.category);
    }
    if (searchData.filters.priceRange) {
      setPriceRange({
        min: searchData.filters.priceRange[0],
        max: searchData.filters.priceRange[1]
      });
    }
    if (searchData.filters.travelers) {
      setTravelers(searchData.filters.travelers);
    }
    
    await loadPackages(true); // Reset y buscar con nuevos filtros
  };

  const loadPackages = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
        setPackages([]);
      }
      
      // Usar endpoint de búsqueda del backend con paginación
      const url = new URL(`${API_BASE}/packages/search`);
      url.searchParams.append('page', reset ? '1' : currentPage.toString());
      url.searchParams.append('pageSize', '20');
      
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (selectedCountry) url.searchParams.append('country', selectedCountry);
      if (selectedCategory) url.searchParams.append('category', selectedCategory);
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success) {
        const newPackages = data.data.map((pkg: any, index: number) => ({
          id: pkg.id || `fallback-${Date.now()}-${index}`,
          title: pkg.title,
          description: pkg.description?.short || pkg.description,
          destination: pkg.destination,
          country: pkg.country,
          price: pkg.price,
          duration: pkg.duration,
          category: pkg.category,
          images: pkg.images,
          rating: pkg.rating,
          features: pkg.features,
          source: pkg._source || 'backend',
          priority: pkg.featured ? 100 : 50,
          featured: pkg.featured,
          uniqueKey: `${pkg.id || `pkg-${index}`}-${pkg._source || 'backend'}-${Date.now()}`
        }));
        
        if (reset) {
          setPackages(newPackages);
        } else {
          setPackages(prev => [...prev, ...newPackages]);
        }
        
        setHasMorePages(data.pagination?.hasMore || false);
        
        setSearchResults({
          results: newPackages,
          total: data.pagination?.total || newPackages.length,
          source: data.source || 'backend',
          processingTime: 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error cargando paquetes:', error);
      
      if (reset) {
        // Fallback: usar datos locales solo en reset
        const fallbackResults = {
          results: convertPackagesToSearchResults(getFallbackPackages()),
          total: getFallbackPackages().length,
          source: 'fallback-local',
          processingTime: 0
        };
        
        setSearchResults(fallbackResults);
        setPackages(fallbackResults.results);
        setHasMorePages(false);
      }
    } finally {
      if (reset) {
        setLoading(false);
      }
    }
  };

  const loadMorePackages = async () => {
    if (loadingMore || !hasMorePages) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    try {
      const url = new URL(`${API_BASE}/packages/search`);
      url.searchParams.append('page', nextPage.toString());
      url.searchParams.append('pageSize', '20');
      
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (selectedCountry) url.searchParams.append('country', selectedCountry);
      if (selectedCategory) url.searchParams.append('category', selectedCategory);
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const newPackages = data.data.map((pkg: any, index: number) => ({
          id: pkg.id || `more-${Date.now()}-${index}`,
          title: pkg.title,
          description: pkg.description?.short || pkg.description,
          destination: pkg.destination,
          country: pkg.country,
          price: pkg.price,
          duration: pkg.duration,
          category: pkg.category,
          images: pkg.images,
          rating: pkg.rating,
          features: pkg.features,
          source: pkg._source || 'backend',
          priority: pkg.featured ? 100 : 50,
          featured: pkg.featured,
          uniqueKey: `${pkg.id || `more-${index}`}-${pkg._source || 'backend'}-${Date.now()}-${currentPage}`
        }));
        
        setPackages(prev => [...prev, ...newPackages]);
        setHasMorePages(data.pagination?.hasMore || false);
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('❌ Error cargando más paquetes:', error);
      setHasMorePages(false);
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Función auxiliar para convertir Package[] a SearchResult[]
  const convertPackagesToSearchResults = (packages: Package[]): SearchResult[] => {
    return packages.map((pkg, index) => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description.short,
      destination: pkg.destination,
      country: pkg.country,
      price: pkg.price,
      duration: pkg.duration,
      category: pkg.category,
      images: pkg.images,
      rating: pkg.rating,
      features: pkg.features,
      source: 'intertravel' as const,
      priority: pkg.featured ? 100 : 50,
      featured: pkg.featured,
      uniqueKey: `fallback-${pkg.id}-${index}-${Date.now()}`
    }));
  };

  const getUniqueCountries = () => {
    return [...new Set(packages.map(pkg => pkg.country))].sort();
  };

  const getUniqueCategories = () => {
    return [...new Set(packages.map(pkg => pkg.category))].sort();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedCategory('');
    setDepartureDate('');
    setReturnDate('');
    setPriceRange({ min: 0, max: 5000 });
    setSortBy('featured');
    setTravelers(2);
    
    router.push('/paquetes');
    loadPackages(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="flex items-center justify-center min-h-[400px] pt-20">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Search */}
      <div className="py-16 pt-28" style={{background: 'linear-gradient(135deg, #121c2e 0%, #1a2742 50%, #121c2e 100%)', color: 'white'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Encuentra tu Próximo Destino
            </h1>
            <div className="flex items-center justify-center space-x-4 text-xl text-blue-100">
              <span>{packages.length} paquetes disponibles</span>
              {searchResults && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-2">
                    {searchResults.source === 'intertravel' && (
                      <Star className="w-5 h-5 text-yellow-400" />
                    )}
                    {searchResults.source === 'travel-compositor' && (
                      <Zap className="w-5 h-5 text-blue-400" />
                    )}
                    {searchResults.source === 'fallback-local' && (
                      <Database className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-sm">
                      {searchResults.source === 'intertravel' && 'Catálogo InterTravel'}
                      {searchResults.source === 'travel-compositor' && 'Travel Compositor'}
                      {searchResults.source === 'fallback-local' && 'Catálogo Local'}
                    </span>
                    <span className="text-xs text-blue-300">
                      ({searchResults.processingTime}ms)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
              {/* Sistema de Búsqueda Unificado */}
              <UnifiedSearchSystem
                mode="packages"
                onSearch={(query, filters) => {
                  setSearchTerm(query);
                  if (filters) {
                    if (filters.category) setSelectedCategory(filters.category);
                    if (filters.priceRange) setPriceRange({
                      min: filters.priceRange[0],
                      max: filters.priceRange[1]
                    });
                    if (filters.travelers) setTravelers(filters.travelers);
                  }
                  loadPackages(true);
                }}
                className="mb-0"
                showFilters={true}
                initialValue={searchTerm}
              />
              
              {/* Filtros adicionales */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full h-12 px-3 border border-gray-200 rounded-md text-gray-900 bg-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Todos los países</option>
                    {getUniqueCountries().map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-12 px-3 border border-gray-200 rounded-md text-gray-900 bg-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Todas las categorías</option>
                    <option value="ride">RIDE - Egresados</option>
                    {getUniqueCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-12 px-3 border border-gray-200 rounded-md text-gray-900 bg-white focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="featured">Destacados</option>
                    <option value="price-asc">Precio: menor a mayor</option>
                    <option value="price-desc">Precio: mayor a menor</option>
                    <option value="rating">Mejor valorados</option>
                  </select>
                </div>
                <div>
                  <Input
                    type="number"
                    value={travelers}
                    onChange={(e) => setTravelers(parseInt(e.target.value) || 2)}
                    min="1"
                    max="20"
                    placeholder="Viajeros"
                    className="h-12 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Button 
                    onClick={() => handleSmartSearch(searchTerm)}
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Filter className="w-5 h-5 mr-2" />
                        Filtrar
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Filtros de fecha y precio */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ida</label>
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-10 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vuelta</label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departureDate || new Date().toISOString().split('T')[0]}
                    className="h-10 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mínimo</label>
                  <Input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                    className="h-10 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="$0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Máximo</label>
                  <Input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                    className="h-10 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="$5000"
                  />
                </div>
              </div>
              
              {/* Botón de limpiar filtros */}
              {(searchTerm || selectedCountry || selectedCategory || departureDate || returnDate || priceRange.min > 0 || priceRange.max < 5000) && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Filtros activos: {[searchTerm, selectedCountry, selectedCategory, departureDate, returnDate].filter(Boolean).length + (priceRange.min > 0 ? 1 : 0) + (priceRange.max < 5000 ? 1 : 0)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensaje de fuente de datos */}
        {packages.length > 0 && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">
                {packages.length === 0 
                  ? 'No se encontraron resultados para tu búsqueda'
                  : `Mostrando ${packages.length} paquetes ${searchTerm ? `para "${searchTerm}"` : 'disponibles'}`
                }
              </span>
            </div>
          </div>
        )}
        
        {packages.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron paquetes
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar tus filtros de búsqueda
            </p>
            <Button onClick={clearFilters}>
              Ver todos los paquetes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, index) => (
              <Card key={pkg.uniqueKey || `${pkg.id}-${index}-${pkg.source}`} className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white border border-gray-200 hover:border-blue-300">
                <div className="relative">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={pkg.images.main}
                      alt={pkg.title || 'Paquete de viaje'}
                      fill
                      priority={index < 3}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Badge destacado */}
                    <div className="absolute top-4 left-4">
                      {pkg.featured && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold px-3 py-1 shadow-lg">
                          ⭐ Destacado
                        </Badge>
                      )}
                    </div>
                    {/* Botones de acción */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/80 hover:bg-white backdrop-blur-sm">
                        <Heart className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-white/80 hover:bg-white backdrop-blur-sm">
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                    {/* Overlay de gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                </div>

                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold line-clamp-2 text-blue-900 group-hover:text-blue-700 transition-colors mb-2">
                        {pkg.title || 'Experiencia única de viaje'}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1 text-gray-600">
                        <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                        {pkg.destination || 'Destino'}, {pkg.country || 'País'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Información de duración y rating */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
                    <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                      <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                      <span className="text-blue-800 font-medium">{pkg.duration?.days || 7} días / {pkg.duration?.nights || 6} noches</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                      <span className="font-medium text-gray-700">{(pkg.rating?.average || 4.5).toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({pkg.rating?.count || 0})</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 px-4 pb-4">
                  {/* Descripción */}
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {pkg.description || 'Experiencia única de viaje diseñada especialmente para ti.'}
                  </p>

                  {/* Categoría */}
                  <div className="mb-4">
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                      {pkg.category || 'Viaje'}
                    </Badge>
                  </div>

                  {/* Precio y botones */}
                  <div className="flex items-end justify-between">
                    {/* Sección de precio */}
                    <div className="flex-1">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg inline-block">
                        <div className="text-xs font-medium uppercase tracking-wide mb-1">Desde</div>
                        <div className="text-xl font-bold">
                          ${pkg.price?.amount?.toLocaleString() || '1,550'}
                        </div>
                        <div className="text-xs opacity-90">
                          por persona
                        </div>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="space-y-2 ml-4">
                      <Button 
                        onClick={() => openPackageModal(pkg.id, pkg)} // Pasar también los datos del paquete
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-sm px-4 py-2"
                      >
                        Ver Detalles
                      </Button>
                      <WhatsAppReserveButton
                        packageData={{
                          id: pkg.id,
                          title: pkg.title || 'Experiencia única de viaje',
                          destination: pkg.destination || 'Destino',
                          price: pkg.price,
                          duration: pkg.duration
                        }}
                        variant="outline"
                        size="sm"
                        trackingSource="package_results"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Indicador de carga para más paquetes */}
        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Cargando más paquetes...</span>
          </div>
        )}
        
        {/* Mensaje de final de resultados */}
        {!loading && !loadingMore && !hasMorePages && packages.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Has visto todos los paquetes disponibles</p>
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              variant="outline"
              className="mt-4"
            >
              Volver al inicio
            </Button>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Nuestros expertos en viajes pueden crear un paquete personalizado para ti
          </p>
          <div className="space-x-4">
            <Link href="/contacto">
              <Button size="lg" variant="secondary">
                Contactar Asesor
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Crear Cuenta
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Modal de detalles del paquete */}
      <PackageDetailsModal
        packageId={selectedPackageId}
        packageData={selectedPackageData}
        isOpen={isModalOpen}
        onClose={closePackageModal}
      />
    </div>
  );
}