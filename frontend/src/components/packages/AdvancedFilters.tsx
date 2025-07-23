'use client';

// ===============================================
// FILTROS AVANZADOS PARA PAQUETES
// ===============================================

import { useState, useEffect } from 'react';

interface FilterOptions {
  destinations: Array<{ value: string; label: string; count: number }>;
  categories: Array<{ value: string; label: string; count: number }>;
  countries: Array<{ value: string; label: string; count: number }>;
  priceRange: { min: number; max: number; step: number };
  durationRange: { min: number; max: number; step: number };
}

interface Filters {
  category?: string;
  destination?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  initialFilters?: Filters;
}

export default function AdvancedFilters({ onFiltersChange, initialFilters = {} }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

  // Cargar opciones de filtros
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/packages/filters/options`);
        const data = await response.json();
        
        if (data.success) {
          setOptions(data.data);
        }
      } catch (error) {
        console.error('Error cargando opciones de filtros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, [API_BASE]);

  // Aplicar filtros
  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Limpiar valor si está vacío
    if (value === '' || value === undefined || value === null) {
      delete newFilters[key];
    }
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  // Contar filtros activos
  const activeFiltersCount = Object.keys(filters).length;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading || !options) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header del filtro */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpiar todo
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido de filtros */}
      <div className={`p-4 space-y-6 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {options.categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} ({category.count})
              </option>
            ))}
          </select>
        </div>

        {/* Destino */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destino
          </label>
          <select
            value={filters.destination || ''}
            onChange={(e) => handleFilterChange('destination', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los destinos</option>
            {options.destinations.map((destination) => (
              <option key={destination.value} value={destination.value}>
                {destination.label} ({destination.count})
              </option>
            ))}
          </select>
        </div>

        {/* País */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País
          </label>
          <select
            value={filters.country || ''}
            onChange={(e) => handleFilterChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los países</option>
            {options.countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label} ({country.count})
              </option>
            ))}
          </select>
        </div>

        {/* Rango de precios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rango de precios
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input
                  type="number"
                  placeholder={formatPrice(options.priceRange.min)}
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={options.priceRange.min}
                  max={options.priceRange.max}
                  step={options.priceRange.step}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input
                  type="number"
                  placeholder={formatPrice(options.priceRange.max)}
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={options.priceRange.min}
                  max={options.priceRange.max}
                  step={options.priceRange.step}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Rango: {formatPrice(options.priceRange.min)} - {formatPrice(options.priceRange.max)}
            </div>
          </div>
        </div>

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración del viaje
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Mínimo (días)</label>
                <input
                  type="number"
                  placeholder={options.durationRange.min.toString()}
                  value={filters.minDuration || ''}
                  onChange={(e) => handleFilterChange('minDuration', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={options.durationRange.min}
                  max={options.durationRange.max}
                  step={options.durationRange.step}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Máximo (días)</label>
                <input
                  type="number"
                  placeholder={options.durationRange.max.toString()}
                  value={filters.maxDuration || ''}
                  onChange={(e) => handleFilterChange('maxDuration', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={options.durationRange.min}
                  max={options.durationRange.max}
                  step={options.durationRange.step}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Rango: {options.durationRange.min} - {options.durationRange.max} días
            </div>
          </div>
        </div>

        {/* Filtros activos */}
        {activeFiltersCount > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Filtros activos:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                let displayValue = value.toString();
                if (key === 'minPrice' || key === 'maxPrice') {
                  displayValue = formatPrice(Number(value));
                } else if (key === 'minDuration' || key === 'maxDuration') {
                  displayValue = `${value} días`;
                }
                
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {displayValue}
                    <button
                      onClick={() => handleFilterChange(key as keyof Filters, null)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
