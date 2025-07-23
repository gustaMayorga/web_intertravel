'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plane, 
  Hotel, 
  Car, 
  Package,
  MapPin,
  Calendar,
  Users,
  Globe,
  ArrowRight,
  Filter
} from 'lucide-react';

interface ExpandedSearchProps {
  onSearch?: (searchData: SearchData) => void;
  className?: string;
}

interface SearchData {
  type: 'packages' | 'flights' | 'hotels' | 'transfers';
  query: string;
  destination?: string;
  origin?: string;
  checkIn?: string;
  checkOut?: string;
  passengers?: number;
  rooms?: number;
}

const searchTypes = [
  {
    id: 'packages',
    label: 'Paquetes',
    icon: Package,
    color: 'bg-blue-600 hover:bg-blue-700',
    description: 'Viajes todo incluido'
  },
  {
    id: 'flights',
    label: 'Aéreos',
    icon: Plane,
    color: 'bg-green-600 hover:bg-green-700',
    description: 'Vuelos nacionales e internacionales'
  },
  {
    id: 'hotels',
    label: 'Hoteles',
    icon: Hotel,
    color: 'bg-purple-600 hover:bg-purple-700',
    description: 'Alojamientos premium'
  },
  {
    id: 'transfers',
    label: 'Traslados',
    icon: Car,
    color: 'bg-orange-600 hover:bg-orange-700',
    description: 'Transporte y excursiones'
  }
];

export default function ExpandedSearch({ onSearch, className = '' }: ExpandedSearchProps) {
  const [activeType, setActiveType] = useState<'packages' | 'flights' | 'hotels' | 'transfers'>('packages');
  const [searchData, setSearchData] = useState<SearchData>({
    type: 'packages',
    query: '',
    passengers: 2,
    rooms: 1
  });

  const updateSearchData = (field: keyof SearchData, value: any) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: typeof activeType) => {
    setActiveType(type);
    updateSearchData('type', type);
  };

  const handleSearch = () => {
    if (!searchData.query.trim()) {
      alert('Por favor ingresa un destino o término de búsqueda');
      return;
    }
    
    console.log('🔍 Búsqueda expandida:', searchData);
    
    // Redirect basado en el tipo
    switch (activeType) {
      case 'packages':
        window.location.href = `/paquetes?q=${encodeURIComponent(searchData.query)}`;
        break;
      case 'flights':
        window.location.href = `/vuelos?origen=${encodeURIComponent(searchData.origin || '')}&destino=${encodeURIComponent(searchData.destination || searchData.query)}&salida=${searchData.checkIn || ''}&vuelta=${searchData.checkOut || ''}&pasajeros=${searchData.passengers}`;
        break;
      case 'hotels':
        window.location.href = `/hoteles?destino=${encodeURIComponent(searchData.query)}&checkin=${searchData.checkIn || ''}&checkout=${searchData.checkOut || ''}&huespedes=${searchData.passengers}&habitaciones=${searchData.rooms}`;
        break;
      case 'transfers':
        window.location.href = `/traslados?destino=${encodeURIComponent(searchData.query)}&pasajeros=${searchData.passengers}`;
        break;
    }
    
    onSearch?.(searchData);
  };

  const renderSearchForm = () => {
    switch (activeType) {
      case 'packages':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={searchData.query}
                    onChange={(e) => updateSearchData('query', e.target.value)}
                    placeholder="¿A dónde quieres viajar? Ej: Europa, Perú, Asia..."
                    className="pl-12 h-14 text-lg bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={searchData.passengers || 2}
                  onChange={(e) => updateSearchData('passengers', Number(e.target.value))}
                  className="pl-12 h-14 w-full border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 bg-white"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'viajero' : 'viajeros'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'flights':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Plane className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={searchData.origin || ''}
                  onChange={(e) => updateSearchData('origin', e.target.value)}
                  placeholder="Desde (ciudad o aeropuerto)"
                  className="pl-12 h-14 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={searchData.query}
                  onChange={(e) => updateSearchData('query', e.target.value)}
                  placeholder="Hacia (destino)"
                  className="pl-12 h-14 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="date"
                  value={searchData.checkIn || ''}
                  onChange={(e) => updateSearchData('checkIn', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-12 h-14 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="date"
                  value={searchData.checkOut || ''}
                  onChange={(e) => updateSearchData('checkOut', e.target.value)}
                  min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                  className="pl-12 h-14 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={searchData.passengers || 1}
                  onChange={(e) => updateSearchData('passengers', Number(e.target.value))}
                  className="pl-12 h-14 w-full border border-gray-200 rounded-lg focus:border-green-500 focus:ring-green-500 bg-white"
                >
                  {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'pasajero' : 'pasajeros'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'hotels':
        return (
          <div className="space-y-4">
            <div className="relative">
              <Hotel className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                value={searchData.query}
                onChange={(e) => updateSearchData('query', e.target.value)}
                placeholder="Destino (ciudad, hotel o zona)"
                className="pl-12 h-14 text-lg bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="date"
                  value={searchData.checkIn || ''}
                  onChange={(e) => updateSearchData('checkIn', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-12 h-14 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="date"
                  value={searchData.checkOut || ''}
                  onChange={(e) => updateSearchData('checkOut', e.target.value)}
                  min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                  className="pl-12 h-14 bg-white border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={searchData.passengers || 2}
                  onChange={(e) => updateSearchData('passengers', Number(e.target.value))}
                  className="pl-12 h-14 w-full border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 bg-white"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'huésped' : 'huéspedes'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="relative">
                <Hotel className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={searchData.rooms || 1}
                  onChange={(e) => updateSearchData('rooms', Number(e.target.value))}
                  className="pl-12 h-14 w-full border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500 bg-white"
                >
                  {Array.from({ length: 5 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'habitación' : 'habitaciones'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'transfers':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Car className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={searchData.query}
                  onChange={(e) => updateSearchData('query', e.target.value)}
                  placeholder="Destino o servicio de traslado"
                  className="pl-12 h-14 text-lg bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div className="relative">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={searchData.passengers || 2}
                  onChange={(e) => updateSearchData('passengers', Number(e.target.value))}
                  className="pl-12 h-14 w-full border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-orange-500 bg-white"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'pasajero' : 'pasajeros'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const currentType = searchTypes.find(type => type.id === activeType);

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex flex-wrap border-b border-gray-200">
          {searchTypes.map((type) => {
            const Icon = type.icon;
            const isActive = activeType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id as typeof activeType)}
                className={`flex-1 min-w-0 px-4 py-4 flex items-center justify-center gap-2 transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  isActive 
                    ? currentType?.color.includes('blue') 
                      ? 'text-blue-600' 
                      : currentType?.color.includes('green') 
                      ? 'text-green-600' 
                      : currentType?.color.includes('purple') 
                      ? 'text-purple-600' 
                      : 'text-orange-600' 
                    : ''
                }`} />
                <span className="font-semibold text-sm sm:text-base">{type.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Form */}
        <div className="p-6">
          {/* Description */}
          <div className="mb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Buscar {currentType?.label}
            </h3>
            <p className="text-gray-600">
              {currentType?.description}
            </p>
          </div>

          {/* Form Fields */}
          <div className="mb-6">
            {renderSearchForm()}
          </div>

          {/* Search Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSearch}
              disabled={!searchData.query.trim()}
              className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2 min-w-[200px] ${currentType?.color} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Search className="w-5 h-5" />
              Buscar {currentType?.label}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">Búsquedas populares:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { text: 'Europa Clásica', type: 'packages' },
                { text: 'Vuelos a Europa', type: 'flights' },
                { text: 'Hoteles en París', type: 'hotels' },
                { text: 'Traslados Aeropuerto', type: 'transfers' }
              ].map((quick, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleTypeChange(quick.type as typeof activeType);
                    updateSearchData('query', quick.text);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full text-sm transition-colors"
                >
                  {quick.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}