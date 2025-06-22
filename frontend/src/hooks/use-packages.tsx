'use client';

import { useState, useEffect } from 'react';

interface UsePackagesOptions {
  featured?: boolean;
  limit?: number;
  enableOffline?: boolean;
  searchParams?: any;
}

interface Package {
  id: string;
  title: string;
  destination: string;
  country: string;
  price: { amount: number; currency: string };
  duration: { days: number; nights: number };
  rating: { average: number; count: number };
  images: { 
    main: string;
    gallery?: string[];
  };
  description: { 
    short: string;
    full: string;
  };
  featured: boolean;
}

export function usePackages(options: UsePackagesOptions = {}) {
  const { 
    featured = false, 
    limit = 12, 
    enableOffline = true,
    searchParams = {}
  } = options;
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Usar datos de fallback por ahora
        const fallbackData = getFallbackPackages();
        let filteredData = fallbackData;

        if (featured) {
          filteredData = fallbackData.filter(pkg => pkg.featured);
        }

        if (limit) {
          filteredData = filteredData.slice(0, limit);
        }

        setPackages(filteredData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        setPackages(getFallbackPackages());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, [featured, limit, enableOffline, JSON.stringify(searchParams)]);

  const refetch = () => {
    setIsLoading(true);
    // Re-trigger useEffect
  };

  return {
    packages,
    isLoading,
    error,
    refetch,
  };
}

export function usePackageDetails(id: string | null) {
  const [package_, setPackage] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPackageDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Buscar en datos de fallback
        const fallbackPackages = getFallbackPackages();
        const fallbackPackage = fallbackPackages.find(pkg => pkg.id === id);
        
        if (fallbackPackage) {
          setPackage(fallbackPackage);
        } else {
          throw new Error('Paquete no encontrado');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
        setPackage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageDetails();
  }, [id]);

  return {
    package: package_,
    isLoading,
    error,
  };
}

// Datos de fallback para cuando la API no esté disponible
function getFallbackPackages(): Package[] {
  return [
    {
      id: 'cusco-magic-2025',
      title: 'Cusco Mágico - Imperio Inca [2025]',
      destination: 'Cusco',
      country: 'Perú',
      price: { amount: 1399, currency: 'USD' },
      duration: { days: 6, nights: 5 },
      rating: { average: 4.8, count: 127 },
      images: { 
        main: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&h=400&fit=crop&auto=format&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=600&fit=crop&auto=format&q=80',
          'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop&auto=format&q=80'
        ]
      },
      description: { 
        short: 'Descubre los secretos del Imperio Inca en esta experiencia transformadora por Cusco y Machu Picchu.',
        full: 'Sumérgete en la historia milenaria del Imperio Inca con nuestro tour completo por Cusco y Machu Picchu. Incluye vuelos, hoteles, guías especializados y todas las excursiones.'
      },
      featured: true
    },
    {
      id: 'cancun-paradise-2025',
      title: 'Cancún Paradise - All Inclusive Premium',
      destination: 'Cancún',
      country: 'México',
      price: { amount: 1799, currency: 'USD' },
      duration: { days: 7, nights: 6 },
      rating: { average: 4.7, count: 93 },
      images: { 
        main: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&auto=format&q=80'
        ]
      },
      description: { 
        short: 'Relájate en las playas más hermosas del Caribe mexicano con todo incluido de lujo.',
        full: 'Una semana de puro relax en resort 5 estrellas con todo incluido premium. Playas paradisíacas, gastronomía internacional y entretenimiento de clase mundial.'
      },
      featured: true
    },
    {
      id: 'madrid-imperial-2025',
      title: 'Madrid Imperial - Capital Española',
      destination: 'Madrid',
      country: 'España',
      price: { amount: 1649, currency: 'USD' },
      duration: { days: 5, nights: 4 },
      rating: { average: 4.6, count: 164 },
      images: { 
        main: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=600&h=400&fit=crop&auto=format&q=80'
      },
      description: { 
        short: 'Sumérgete en la cultura, historia y gastronomía de la capital española.',
        full: 'Tour completo por Madrid con visitas al Palacio Real, Museo del Prado, barrio de Malasaña y experiencias gastronómicas únicas.'
      },
      featured: true
    },
    {
      id: 'paris-romance-2025',
      title: 'París Romántico - Ciudad de la Luz',
      destination: 'París',
      country: 'Francia',
      price: { amount: 2299, currency: 'USD' },
      duration: { days: 6, nights: 5 },
      rating: { average: 4.9, count: 218 },
      images: { 
        main: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=600&h=400&fit=crop&auto=format&q=80'
      },
      description: { 
        short: 'Vive el romance parisino en la ciudad más elegante y sofisticada del mundo.',
        full: 'Experiencia romántica completa en París: Torre Eiffel, Louvre, crucero por el Sena, cenas en restaurantes con estrella Michelin.'
      },
      featured: true
    },
    {
      id: 'bsas-tango-2025',
      title: 'Buenos Aires - Capital del Tango',
      destination: 'Buenos Aires',
      country: 'Argentina',
      price: { amount: 949, currency: 'USD' },
      duration: { days: 4, nights: 3 },
      rating: { average: 4.5, count: 81 },
      images: { 
        main: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&h=400&fit=crop&auto=format&q=80'
      },
      description: { 
        short: 'Descubre la pasión del tango en la París sudamericana con tours exclusivos.',
        full: 'City tour completo por Buenos Aires: San Telmo, La Boca, Palermo, show de tango con cena y clase de baile incluida.'
      },
      featured: false
    },
    {
      id: 'ny-city-2025',
      title: 'New York City - La Gran Manzana',
      destination: 'New York',
      country: 'Estados Unidos',
      price: { amount: 2399, currency: 'USD' },
      duration: { days: 5, nights: 4 },
      rating: { average: 4.8, count: 201 },
      images: { 
        main: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop&auto=format&q=80'
      },
      description: { 
        short: 'Vive la energía infinita de la ciudad que nunca duerme.',
        full: 'Tour completo por NYC: Estatua de la Libertad, Empire State, Central Park, Broadway shows y shopping en Times Square.'
      },
      featured: false
    },
    {
      id: 'rio-carnival-2025',
      title: 'Río de Janeiro - Carnaval y Playas',
      destination: 'Río de Janeiro',
      country: 'Brasil',
      price: { amount: 1599, currency: 'USD' },
      duration: { days: 5, nights: 4 },
      rating: { average: 4.7, count: 156 },
      images: { 
        main: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&h=400&fit=crop&auto=format&q=80'
      },
      description: { 
        short: 'Explora la ciudad maravillosa con sus playas icónicas y cultura vibrante.',
        full: 'Descubre Río: Cristo Redentor, Pan de Azúcar, Copacabana, Ipanema y la energía única carioca.'
      },
      featured: false
    },
    {
      id: 'london-royal-2025',
      title: 'Londres Real - Historia y Modernidad',
      destination: 'Londres',
      country: 'Reino Unido',
      price: { amount: 2199, currency: 'USD' },
      duration: { days: 6, nights: 5 },
      rating: { average: 4.6, count: 189 },
      images: { 
        main: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop&auto=format&q=80'
      },
      description: { 
        short: 'Descubre la majestuosidad británica en la capital del Reino Unido.',
        full: 'Tour real por Londres: Buckingham Palace, Tower Bridge, Big Ben, British Museum y experiencia en pubs tradicionales.'
      },
      featured: false
    }
  ];
}