'use client';

// ===============================================
// GRID DE PAQUETES CON SCROLL INFINITO
// ===============================================

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import PackageCard from './PackageCard';
import PackageModal from './PackageModal';

interface Package {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice?: number;
  currency: string;
  destination: string;
  country: string;
  duration: number;
  category: string;
  featured: boolean;
  images: string[];
  highlights: string[];
  availability: boolean;
  maxOccupancy: number;
  priorityScore: number;
  _source: string;
}

interface PackagesGridProps {
  searchQuery?: string;
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}

export default function PackagesGrid({ searchQuery, filters }: PackagesGridProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [apiSource, setApiSource] = useState<string>('');

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  // Función para cargar paquetes
  const loadPackages = useCallback(async (pageNumber: number, reset: boolean = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      let url = `${API_BASE}/api/packages?page=${pageNumber}&limit=12`;
      
      // Agregar parámetros de búsqueda
      if (searchQuery) {
        url = `${API_BASE}/api/packages/search/simple?destination=${encodeURIComponent(searchQuery)}&limit=12`;
      }
      
      // Agregar filtros
      if (filters?.category) {
        url += `&category=${filters.category}`;
      }
      if (filters?.minPrice) {
        url += `&minPrice=${filters.minPrice}`;
      }
      if (filters?.maxPrice) {
        url += `&maxPrice=${filters.maxPrice}`;
      }

      console.log('🔄 Cargando paquetes:', url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const newPackages = data.data || [];
        
        if (reset) {
          setPackages(newPackages);
        } else {
          setPackages(prev => [...prev, ...newPackages]);
        }
        
        // Actualizar estado de paginación
        if (data.pagination) {
          setHasMore(data.pagination.hasMore || false);
        } else {
          setHasMore(newPackages.length === 12); // Si carga menos de 12, no hay más
        }
        
        setApiSource(data.metadata?.source || 'unknown');
        
        console.log(`✅ Cargados ${newPackages.length} paquetes (página ${pageNumber})`);
        console.log(`📡 Fuente: ${data.metadata?.source}`);
        
      } else {
        throw new Error(data.error || 'Error cargando paquetes');
      }
    } catch (err) {
      console.error('❌ Error cargando paquetes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [API_BASE, searchQuery, filters, loading]);

  // Cargar primera página cuando cambian los filtros o búsqueda
  useEffect(() => {
    setPackages([]);
    setPage(1);
    setHasMore(true);
    loadPackages(1, true);
  }, [searchQuery, filters]);

  // Scroll infinito
  useEffect(() => {
    if (inView && hasMore && !loading && packages.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPackages(nextPage, false);
    }
  }, [inView, hasMore, loading, packages.length, page, loadPackages]);

  // Manejar clic en paquete para mostrar modal
  const handlePackageClick = async (pkg: Package) => {
    try {
      setSelectedPackage(pkg);
      setShowModal(true);
      
      // Cargar detalles completos para el modal
      const response = await fetch(`${API_BASE}/api/packages/${pkg.id}/modal`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedPackage(data.data);
      }
    } catch (error) {
      console.error('Error cargando detalles del paquete:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPackage(null);
  };

  // Mostrar estado de error
  if (error && packages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl mb-4">❌ Error cargando paquetes</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            loadPackages(1, true);
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Mostrar loading inicial
  if (loading && packages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Conectando con Travel Compositor...</p>
      </div>
    );
  }

  // Mostrar mensaje si no hay paquetes
  if (packages.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-xl mb-4">🔍 No se encontraron paquetes</div>
        {searchQuery && (
          <p className="text-gray-600">
            No hay resultados para "{searchQuery}". Intenta con otro destino.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicador de fuente de datos */}
      {apiSource && (
        <div className="text-sm text-gray-500 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            apiSource.includes('api') ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span>
            {apiSource.includes('api') ? 
              '🔗 Conectado a Travel Compositor' : 
              '💾 Datos locales'
            }
          </span>
          <span className="text-gray-400">•</span>
          <span>{packages.length} paquetes cargados</span>
        </div>
      )}

      {/* Grid de paquetes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {packages.map((pkg, index) => (
          <PackageCard
            key={`${pkg.id}-${index}`}
            package={pkg}
            onClick={() => handlePackageClick(pkg)}
          />
        ))}
      </div>

      {/* Loading indicator para scroll infinito */}
      {hasMore && (
        <div ref={ref} className="text-center py-8">
          {loading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Cargando más paquetes...</span>
            </div>
          ) : (
            <div className="text-gray-500">Desplázate para cargar más</div>
          )}
        </div>
      )}

      {/* Mensaje de fin */}
      {!hasMore && packages.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="flex items-center justify-center space-x-2">
            <span>🎯</span>
            <span>Has visto todos los paquetes disponibles</span>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {showModal && selectedPackage && (
        <PackageModal
          package={selectedPackage}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
