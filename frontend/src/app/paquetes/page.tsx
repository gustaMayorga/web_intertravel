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
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Filter,
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  DollarSign,
  Plane
} from 'lucide-react';

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
    // ===== EUROPA =====
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
      title: 'Grecia Maravillosa - Atenas y Santorini',
      destination: 'Grecia',
      country: 'Grecia',
      price: { amount: 1899, currency: 'USD' },
      duration: { days: 8, nights: 7 },
      category: 'Cultural',
      description: {
        short: 'Explora la cuna de la civilización occidental y disfruta de las islas griegas.',
        full: 'Historia antigua, playas paradisíacas y la gastronomía mediterránea.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1504512485686-e7e17ddc56f3?w=800&h=600&fit=crop'
      },
      rating: { average: 4.7, count: 98 },
      features: ['Vuelos incluidos', 'Hoteles boutique', 'Excursiones', 'Traslados'],
      featured: false
    },
    {
      id: '3',
      title: 'Alemania y Suiza - Baviera y Alpes',
      destination: 'Europa Central',
      country: 'Alemania, Suiza',
      price: { amount: 2599, currency: 'USD' },
      duration: { days: 10, nights: 9 },
      category: 'Aventura',
      description: {
        short: 'Castillos de cuento, paisajes alpinos y ciudades históricas.',
        full: 'Desde los castillos de Baviera hasta los picos nevados de Suiza.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&h=600&fit=crop'
      },
      rating: { average: 4.6, count: 112 },
      features: ['Vuelos incluidos', 'Hoteles premium', 'Tren panorámico', 'Guías locales'],
      featured: false
    },
    
    // ===== ASIA =====
    {
      id: '4',
      title: 'Circuito Asiático - Tokio, Bangkok, Singapur',
      destination: 'Asia',
      country: 'Japón, Tailandia, Singapur',
      price: { amount: 2899, currency: 'USD' },
      duration: { days: 15, nights: 14 },
      category: 'Aventura',
      description: {
        short: 'Explora la fascinante cultura asiática en este increíble circuito por tres países.',
        full: 'Una experiencia única combinando tradición y modernidad en Asia.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop'
      },
      rating: { average: 4.6, count: 89 },
      features: ['Vuelos incluidos', 'Hoteles 4*', 'Algunas comidas', 'Traslados'],
      featured: false
    },
    {
      id: '5',
      title: 'China Imperial - Pekín y Shanghai',
      destination: 'China',
      country: 'China',
      price: { amount: 2199, currency: 'USD' },
      duration: { days: 12, nights: 11 },
      category: 'Cultural',
      description: {
        short: 'Descubre la milenaria cultura china y sus maravillas arquitectónicas.',
        full: 'Desde la Gran Muralla hasta los rascacielos de Shanghai.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=600&fit=crop'
      },
      rating: { average: 4.5, count: 76 },
      features: ['Vuelos incluidos', 'Hoteles 4*', 'Guía en español', 'Entradas incluidas'],
      featured: false
    },
    {
      id: '6',
      title: 'India Mágica - Delhi, Agra, Jaipur',
      destination: 'India',
      country: 'India',
      price: { amount: 1799, currency: 'USD' },
      duration: { days: 10, nights: 9 },
      category: 'Cultural',
      description: {
        short: 'El triángulo dorado de India con el Taj Mahal y palacios maharajaes.',
        full: 'Una inmersión en la cultura, espiritualidad y arquitectura de India.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&h=600&fit=crop'
      },
      rating: { average: 4.4, count: 134 },
      features: ['Vuelos incluidos', 'Hoteles heritage', 'Guías especializados', 'Experiencias únicas'],
      featured: false
    },
    
    // ===== AMÉRICA =====
    {
      id: '7',
      title: 'Maravillas Americanas - Cusco, Cancún, New York',
      destination: 'América',
      country: 'Perú, México, Estados Unidos',
      price: { amount: 2199, currency: 'USD' },
      duration: { days: 10, nights: 9 },
      category: 'Cultural',
      description: {
        short: 'Un viaje extraordinario por las maravillas del continente americano.',
        full: 'Desde las ruinas de Machu Picchu hasta las luces de Nueva York.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop'
      },
      rating: { average: 4.9, count: 234 },
      features: ['Vuelos incluidos', 'Hoteles premium', 'Guías especializados', 'Entradas incluidas'],
      featured: true
    },
    {
      id: '8',
      title: 'Brasil Espectacular - Río, Iguazú, Salvador',
      destination: 'Brasil',
      country: 'Brasil',
      price: { amount: 1999, currency: 'USD' },
      duration: { days: 9, nights: 8 },
      category: 'Playa',
      description: {
        short: 'Descubre la alegría brasileña, cataratas impresionantes y playas paradisíacas.',
        full: 'Samba, capoeira, naturaleza exuberante y playas de ensueño.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop'
      },
      rating: { average: 4.7, count: 156 },
      features: ['Vuelos incluidos', 'Hoteles 4*', 'Excursiones', 'Shows folclóricos'],
      featured: false
    },
    {
      id: '9',
      title: 'Costa Oeste USA - Los Ángeles, San Francisco, Las Vegas',
      destination: 'Estados Unidos',
      country: 'Estados Unidos',
      price: { amount: 2799, currency: 'USD' },
      duration: { days: 12, nights: 11 },
      category: 'Urbano',
      description: {
        short: 'Hollywood, Golden Gate y los casinos de Las Vegas en un solo viaje.',
        full: 'La experiencia americana completa en la costa oeste.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=800&h=600&fit=crop'
      },
      rating: { average: 4.6, count: 198 },
      features: ['Vuelos incluidos', 'Hoteles 4*', 'Auto rental', 'Entradas parques'],
      featured: false
    },
    
    // ===== CARIBE =====
    {
      id: '10',
      title: 'Caribe Premium - Punta Cana y Bahamas',
      destination: 'Caribe',
      country: 'República Dominicana, Bahamas',
      price: { amount: 1799, currency: 'USD' },
      duration: { days: 8, nights: 7 },
      category: 'Playa',
      description: {
        short: 'Relájate en las mejores playas del Caribe con todo incluido.',
        full: 'Experiencia de lujo en resorts premium del Caribe.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop'
      },
      rating: { average: 4.7, count: 312 },
      features: ['Todo incluido', 'Resorts 5*', 'Actividades acuáticas', 'Spa'],
      featured: false
    },
    {
      id: '11',
      title: 'Cuba Auténtica - La Habana y Varadero',
      destination: 'Cuba',
      country: 'Cuba',
      price: { amount: 1599, currency: 'USD' },
      duration: { days: 7, nights: 6 },
      category: 'Cultural',
      description: {
        short: 'Historia, música y playas en la perla del Caribe.',
        full: 'Coches clásicos, son cubano y playas de arena blanca.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      },
      rating: { average: 4.5, count: 87 },
      features: ['Vuelos incluidos', 'Hoteles históricos', 'Música en vivo', 'Tours clásicos'],
      featured: false
    },
    
    // ===== ÁFRICA =====
    {
      id: '12',
      title: 'Safari Africano - Kenia y Tanzania',
      destination: 'África',
      country: 'Kenia, Tanzania',
      price: { amount: 3299, currency: 'USD' },
      duration: { days: 14, nights: 13 },
      category: 'Aventura',
      description: {
        short: 'Vive la experiencia única del safari africano en estado puro.',
        full: 'Observa la gran migración y los Big Five en su hábitat natural.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=600&fit=crop'
      },
      rating: { average: 4.9, count: 87 },
      features: ['Safaris diarios', 'Lodges premium', 'Guías expertos', 'Vuelos incluidos'],
      featured: true
    },
    {
      id: '13',
      title: 'Egipto Milenario - El Cairo y Crucero por el Nilo',
      destination: 'Egipto',
      country: 'Egipto',
      price: { amount: 2299, currency: 'USD' },
      duration: { days: 10, nights: 9 },
      category: 'Cultural',
      description: {
        short: 'Pirámides, faraones y la magia del antiguo Egipto.',
        full: 'Un viaje por 5000 años de historia navegando el Nilo.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop'
      },
      rating: { average: 4.6, count: 145 },
      features: ['Vuelos incluidos', 'Crucero 5*', 'Guía egiptólogo', 'Entradas incluidas'],
      featured: false
    },
    
    // ===== OCEANÍA =====
    {
      id: '14',
      title: 'Australia y Nueva Zelanda',
      destination: 'Oceanía',
      country: 'Australia, Nueva Zelanda',
      price: { amount: 3899, currency: 'USD' },
      duration: { days: 18, nights: 17 },
      category: 'Aventura',
      description: {
        short: 'Descubre los paisajes más impresionantes de Oceanía.',
        full: 'Un viaje épico por Sydney, Melbourne, Auckland y Queenstown.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      },
      rating: { average: 4.8, count: 156 },
      features: ['Vuelos incluidos', 'Hoteles 4*', 'Actividades opcionales', 'Traslados'],
      featured: false
    },
    
    // ===== ARGENTINA =====
    {
      id: '15',
      title: 'Argentina Completa - Buenos Aires, Mendoza, Bariloche',
      destination: 'Argentina',
      country: 'Argentina',
      price: { amount: 1299, currency: 'USD' },
      duration: { days: 10, nights: 9 },
      category: 'Cultural',
      description: {
        short: 'Tango, vinos y paisajes patagónicos en un recorrido único.',
        full: 'Desde la capital del tango hasta los lagos de la Patagonia.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'
      },
      rating: { average: 4.8, count: 267 },
      features: ['Vuelos domésticos', 'Hoteles boutique', 'Degustación vinos', 'Shows de tango'],
      featured: true
    },
    
    // ===== RIDE - VIAJES DE EGRESADOS =====
    {
      id: '16',
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
    },
    {
      id: '17',
      title: 'RIDE Cancún Paradise',
      destination: 'Cancún',
      country: 'México',
      price: { amount: 1299, currency: 'USD' },
      duration: { days: 8, nights: 7 },
      category: 'ride',
      description: {
        short: 'Playas paradisíacas y diversión sin límites para tu graduación.',
        full: 'Todo incluido en resorts de primera con actividades especiales.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1552931974-7a4aa1c0efe8?w=800&h=600&fit=crop'
      },
      rating: { average: 4.8, count: 89 },
      features: ['Todo incluido', 'Resort 5*', 'Coordinador RIDE', 'Excursiones'],
      featured: true
    },
    {
      id: '18',
      title: 'RIDE Búzios Exclusive',
      destination: 'Búzios',
      country: 'Brasil',
      price: { amount: 1099, currency: 'USD' },
      duration: { days: 6, nights: 5 },
      category: 'ride',
      description: {
        short: 'Brasil paradisíaco para celebrar tu graduación en grande.',
        full: 'Playas de ensueño y la alegría brasileña para egresados.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1618085219724-c59ba48e08cd?w=800&h=600&fit=crop'
      },
      rating: { average: 4.7, count: 67 },
      features: ['Pousadas premium', 'Coordinación especializada', 'Actividades náuticas', 'Fiesta en playa'],
      featured: false
    },
    {
      id: '19',
      title: 'RIDE Villa Carlos Paz',
      destination: 'Villa Carlos Paz',
      country: 'Argentina',
      price: { amount: 699, currency: 'USD' },
      duration: { days: 5, nights: 4 },
      category: 'ride',
      description: {
        short: 'Diversión en las sierras cordobesas con el mejor ambiente.',
        full: 'Aventura, música y actividades en el corazón de Córdoba.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop'
      },
      rating: { average: 4.6, count: 123 },
      features: ['Hoteles céntricos', 'Actividades de aventura', 'Coordinadores RIDE', 'Shows nocturnos'],
      featured: false
    },
    {
      id: '20',
      title: 'RIDE Puerto Madryn - Península Valdés',
      destination: 'Puerto Madryn',
      country: 'Argentina',
      price: { amount: 999, currency: 'USD' },
      duration: { days: 6, nights: 5 },
      category: 'ride',
      description: {
        short: 'Ballenas, naturaleza y aventura patagónica para egresados.',
        full: 'Una experiencia única con fauna marina y paisajes únicos.'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&h=600&fit=crop'
      },
      rating: { average: 4.7, count: 45 },
      features: ['Avistaje de ballenas', 'Península Valdés', 'Coordinación especializada', 'Actividades eco'],
      featured: false
    }
  ];
};

export default function PackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [departureDate, setDepartureDate] = useState(searchParams.get('departure') || '');
  const [returnDate, setReturnDate] = useState(searchParams.get('return') || '');
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: 5000
  });
  const [sortBy, setSortBy] = useState('featured'); // featured, price-asc, price-desc, rating, duration

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [packages, searchTerm, selectedCountry, selectedCategory, departureDate, returnDate, priceRange, sortBy]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      
      // Construir URL con parámetros de búsqueda
      const params = new URLSearchParams();
      
      // Si hay término de búsqueda
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      // Si hay parámetros de la URL
      const urlSearch = searchParams.get('q') || searchParams.get('search');
      const urlCategory = searchParams.get('category');
      const urlCountry = searchParams.get('country');
      
      if (urlSearch) {
        params.append('search', urlSearch);
        setSearchTerm(urlSearch);
      }
      
      if (urlCategory) {
        params.append('category', urlCategory);
        setSelectedCategory(urlCategory);
      }
      
      if (urlCountry) {
        params.append('country', urlCountry);
        setSelectedCountry(urlCountry);
      }
      
      // Construir URL final
      let url = `${API_BASE}/packages`;
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('Loading packages from:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const packageData = data.packages || data.data || [];
        console.log('Loaded packages:', packageData.length);
        setPackages(packageData);
      } else {
        console.error('Error loading packages:', data.error);
        // Fallback: cargar paquetes de ejemplo
        setPackages(getFallbackPackages());
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      // Fallback: cargar paquetes de ejemplo
      setPackages(getFallbackPackages());
    } finally {
      setLoading(false);
    }
  };

  const filterPackages = () => {
    let filtered = [...packages];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(pkg => 
        pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por país
    if (selectedCountry) {
      filtered = filtered.filter(pkg => pkg.country === selectedCountry);
    }

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter(pkg => pkg.category === selectedCategory);
    }

    // Filtro por precio
    filtered = filtered.filter(pkg => 
      pkg.price.amount >= priceRange.min && pkg.price.amount <= priceRange.max
    );

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price.amount - b.price.amount;
        case 'price-desc':
          return b.price.amount - a.price.amount;
        case 'rating':
          return (b.rating?.average || 0) - (a.rating?.average || 0);
        case 'duration':
          return (a.duration?.days || 0) - (b.duration?.days || 0);
        case 'featured':
        default:
          // Destacados primero, luego por rating
          if (a.featured !== b.featured) {
            return b.featured ? 1 : -1;
          }
          return (b.rating?.average || 0) - (a.rating?.average || 0);
      }
    });

    setFilteredPackages(filtered);
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
    
    // Actualizar URL sin parámetros
    router.push('/paquetes');
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Realizando búsqueda en Travel Compositor:', {
        searchTerm,
        selectedCountry,
        selectedCategory,
        departureDate,
        returnDate
      });
      
      // Construir parámetros de búsqueda para Travel Compositor
      const searchParams = new URLSearchParams();
      
      // Parámetros principales de búsqueda
      if (searchTerm) {
        searchParams.append('search', searchTerm);
        searchParams.append('destination', searchTerm); // Para TC específicamente
      }
      
      if (selectedCountry) {
        searchParams.append('country', selectedCountry);
      }
      
      if (selectedCategory) {
        searchParams.append('category', selectedCategory);
      }
      
      if (departureDate) {
        searchParams.append('departure', departureDate);
        searchParams.append('startDate', departureDate); // Para TC
      }
      
      if (returnDate) {
        searchParams.append('return', returnDate);
        searchParams.append('endDate', returnDate); // Para TC
      }
      
      // Agregar límite de resultados
      searchParams.append('limit', '20');
      
      // Hacer llamada a la API de búsqueda
      const searchUrl = `${API_BASE}/packages/search?${searchParams.toString()}`;
      console.log('📡 URL de búsqueda:', searchUrl);
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.success) {
        const searchResults = data.data || data.packages || [];
        console.log(`✅ Búsqueda completada: ${searchResults.length} resultados encontrados`);
        console.log('📋 Fuente de datos:', data._source);
        
        // Actualizar paquetes con los resultados de búsqueda
        setPackages(searchResults);
        
        // Mostrar mensaje de éxito
        if (searchResults.length === 0) {
          console.log('⚠️ No se encontraron resultados para la búsqueda');
        }
      } else {
        console.error('❌ Error en búsqueda:', data.error);
        // En caso de error, mantener paquetes actuales
      }
      
      // Actualizar URL con parámetros de búsqueda
      const urlParams = new URLSearchParams();
      if (searchTerm) urlParams.append('q', searchTerm);
      if (selectedCountry) urlParams.append('country', selectedCountry);
      if (selectedCategory) urlParams.append('category', selectedCategory);
      if (departureDate) urlParams.append('departure', departureDate);
      if (returnDate) urlParams.append('return', returnDate);
      
      const newUrl = urlParams.toString() ? `/paquetes?${urlParams.toString()}` : '/paquetes';
      router.push(newUrl);
      
    } catch (error) {
      console.error('❌ Error realizando búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Loading */}
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
            <p className="text-xl text-blue-100">
              {filteredPackages.length} paquetes de viaje disponibles
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
              {/* Fila 1: Búsqueda principal */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="¿A dónde quieres viajar?"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 h-12 text-gray-900 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
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
                    <option value="duration">Duración</option>
                  </select>
                </div>
                <div>
                  <Button 
                    onClick={handleSearch}
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
                        <Search className="w-5 h-5 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Fila 2: Fechas */}
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
              
              {(searchTerm || selectedCountry || selectedCategory || departureDate || returnDate) && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Filtros activos: {[searchTerm, selectedCountry, selectedCategory, departureDate, returnDate].filter(Boolean).length}
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
                {filteredPackages.length === 0 
                  ? 'No se encontraron resultados para tu búsqueda'
                  : `Mostrando ${filteredPackages.length} paquetes ${searchTerm ? `para "${searchTerm}"` : 'disponibles'}`
                }
              </span>
            </div>
          </div>
        )}
        {filteredPackages.length === 0 ? (
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
            {filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-white border border-gray-200 hover:border-blue-300">
                <div className="relative">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <Image
                      src={pkg.images.main}
                      alt={pkg.title || 'Paquete de viaje'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Badge destacado con diseño dorado */}
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
                    {/* Overlay de gradiente para mejor legibilidad */}
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
                    {pkg.description?.short || 'Experiencia única de viaje diseñada especialmente para ti.'}
                  </p>

                  {/* Categoría */}
                  <div className="mb-4">
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                      {pkg.category || 'Viaje'}
                    </Badge>
                  </div>

                  {/* Precio y botones */}
                  <div className="flex items-end justify-between">
                    {/* Sección de precio mejorada */}
                    <div className="flex-1">
                      {pkg.originalPrice && (
                        <div className="text-sm text-gray-500 line-through mb-1">
                          Antes: ${pkg.originalPrice.amount?.toLocaleString() || '0'}
                        </div>
                      )}
                      {/* Precio principal con "desde" */}
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
                      <Link href={`/paquetes/${pkg.id}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-sm px-4 py-2">
                          Ver Detalles
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="w-full text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50">
                        <Plane className="h-3 w-3 mr-1" />
                        Cotizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
}
