"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Zap, CreditCard, Sparkles, Search, Filter, MapPin, Clock, ChevronDown } from "lucide-react";

interface TravelPackage {
  id: string;
  title: string;
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
  description: {
    short: string;
    full: string;
  };
  images: {
    main: string;
    gallery?: string[];
  };
  rating: {
    average: number;
    count: number;
  };
  featured: boolean;
  _source: string;
}

interface LoadMoreState {
  page: number;
  hasMore: boolean;
  loading: boolean;
}

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loadState, setLoadState] = useState<LoadMoreState>({
    page: 1,
    hasMore: true,
    loading: true
  });
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Para los filtros dinámicos
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadInitialPackages();
  }, []);

  const loadInitialPackages = async () => {
    try {
      setLoadState(prev => ({ ...prev, loading: true }));
      console.log('Loading initial packages...');
      
      const response = await fetch('http://localhost:3002/api/packages?limit=20&page=1');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.packages);
        
        // Extraer países y categorías únicos para filtros
        const uniqueCountries = [...new Set(data.packages.map((pkg: TravelPackage) => pkg.country))].filter(Boolean);
        const uniqueCategories = [...new Set(data.packages.map((pkg: TravelPackage) => pkg.category))].filter(Boolean);
        
        setCountries(uniqueCountries);
        setCategories(uniqueCategories);
        
        setLoadState({
          page: 1,
          hasMore: data.pagination?.hasNext || data.packages.length === 20,
          loading: false
        });
        
        console.log(`Loaded ${data.packages.length} packages`);
        console.log(`Countries: ${uniqueCountries.length}, Categories: ${uniqueCategories.length}`);
      } else {
        throw new Error(data.error || 'Error loading packages');
      }
    } catch (error) {
      console.error('Error loading initial packages:', error);
      setLoadState(prev => ({ ...prev, loading: false, hasMore: false }));
    }
  };

  const loadMorePackages = async () => {
    if (loadState.loading || !loadState.hasMore) return;
    
    try {
      setLoadState(prev => ({ ...prev, loading: true }));
      const nextPage = loadState.page + 1;
      
      console.log(`Loading page ${nextPage}...`);
      
      const response = await fetch(`http://localhost:3002/api/packages?limit=20&page=${nextPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.packages.length > 0) {
        setPackages(prev => [...prev, ...data.packages]);
        setLoadState({
          page: nextPage,
          hasMore: data.pagination?.hasNext || false,
          loading: false
        });
        
        console.log(`Loaded ${data.packages.length} more packages. Total: ${packages.length + data.packages.length}`);
      } else {
        setLoadState(prev => ({ ...prev, loading: false, hasMore: false }));
        console.log('No more packages to load');
      }
    } catch (error) {
      console.error('Error loading more packages:', error);
      setLoadState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSearch = async () => {
    try {
      setLoadState({ page: 1, hasMore: true, loading: true });
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCountry) params.append('country', selectedCountry);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('limit', '20');
      params.append('page', '1');
      
      console.log('Searching with params:', params.toString());
      
      const response = await fetch(`http://localhost:3002/api/packages/search?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.packages);
        setLoadState({
          page: 1,
          hasMore: data.pagination?.hasNext || false,
          loading: false
        });
        
        console.log(`Search returned ${data.packages.length} packages`);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching packages:', error);
      setLoadState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedCategory('');
    loadInitialPackages();
  };

  const handlePackageClick = (packageId: string) => {
    router.push(`/details?id=${packageId}`);
  };

  const handleQuoteClick = (pkg: TravelPackage) => {
    const quoteData = {
      packageId: pkg.id,
      title: pkg.title,
      destination: pkg.destination,
      price: pkg.price.amount,
      duration: pkg.duration
    };
    
    localStorage.setItem('quotePackage', JSON.stringify(quoteData));
    router.push('/cotizar');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight text-foreground">Paquetes de Viaje</h2>
        <p className="text-muted-foreground text-lg">Descubre tu próxima aventura. Te esperan experiencias inolvidables.</p>
      </div>

      {/* Banners Promocionales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card className="shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 flex flex-col justify-center items-center text-center rounded-lg">
          <CreditCard className="h-12 w-12 mb-3 text-accent" />
          <CardTitle className="text-2xl">¡Pagá en Cuotas Fijas!</CardTitle>
          <CardDescription className="text-primary-foreground/80 mt-1">Financia tu próximo viaje con las mejores condiciones.</CardDescription>
        </Card>
        <Card className="shadow-xl bg-secondary/50 p-6 flex flex-col justify-center items-center text-center rounded-lg border-accent border-2">
          <Sparkles className="h-12 w-12 mb-3 text-accent" />
          <CardTitle className="text-2xl text-primary">¡Destacado del Mes!</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">Explora nuestro paquete estrella con beneficios exclusivos.</CardDescription>
          <Button variant="outline" className="mt-4 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            Ver Oferta
          </Button>
        </Card>
      </div>

      {/* Filtros de Búsqueda */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Filtrar Paquetes</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar destino</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar destinos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">País</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los países" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los países</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <div className="flex space-x-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Resultados */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            {packages.length > 0 ? `${packages.length} paquetes encontrados` : 'Cargando paquetes...'}
          </p>
          {packages.length > 0 && (
            <Badge variant="outline">
              Fuente: {packages[0]?._source || 'API'}
            </Badge>
          )}
        </div>

        {/* Grid de Paquetes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative rounded-lg cursor-pointer hover:scale-105"
              onClick={() => handlePackageClick(pkg.id)}
            >
              {pkg.featured && (
                <Badge variant="destructive" className="absolute top-3 right-3 z-10 bg-accent text-accent-foreground border-accent shadow-md">
                  <Zap className="mr-1 h-3 w-3" /> ¡Destacado!
                </Badge>
              )}
              
              <div className="relative w-full h-52">
                <Image
                  src={pkg.images.main}
                  alt={pkg.title}
                  fill
                  className="object-cover rounded-t-lg"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              
              <CardHeader className="pt-4 pb-2">
                <CardTitle className="text-xl text-primary line-clamp-2">{pkg.title}</CardTitle>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{pkg.destination}, {pkg.country}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {pkg.category}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="flex items-center mr-4">
                    <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                    <span>{pkg.rating.average}</span>
                    <span className="text-xs ml-1">({pkg.rating.count})</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{pkg.duration.days} días / {pkg.duration.nights} noches</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow pt-0 pb-3">
                <CardDescription className="line-clamp-3">
                  {pkg.description.short}
                </CardDescription>
              </CardContent>
              
              <CardFooter className="flex justify-between items-center bg-secondary/30 p-4 rounded-b-lg">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ${pkg.price.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{pkg.price.currency} por persona</p>
                </div>
                <Button 
                  variant="default" 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuoteClick(pkg);
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Cotizar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Loading State */}
        {loadState.loading && packages.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando paquetes increíbles...</p>
            </div>
          </div>
        )}

        {/* Botón Cargar Más */}
        {packages.length > 0 && loadState.hasMore && (
          <div className="flex justify-center py-8">
            <Button 
              onClick={loadMorePackages}
              disabled={loadState.loading}
              size="lg"
              variant="outline"
              className="min-w-48"
            >
              {loadState.loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Cargando...
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Cargar más paquetes
                </>
              )}
            </Button>
          </div>
        )}

        {/* No hay más paquetes */}
        {packages.length > 0 && !loadState.hasMore && !loadState.loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">¡Has visto todos los paquetes disponibles!</p>
            <Button variant="outline" onClick={handleClearFilters} className="mt-4">
              Ver todos los paquetes
            </Button>
          </div>
        )}

        {/* No results */}
        {packages.length === 0 && !loadState.loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No se encontraron paquetes con estos filtros</p>
            <Button onClick={handleClearFilters} className="mt-4">
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}