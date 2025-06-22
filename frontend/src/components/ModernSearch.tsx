'use client';

import { useState } from 'react';

const ModernSearch = () => {
  const [searchData, setSearchData] = useState({
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'roundtrip' // roundtrip, oneway
  });

  const [isSearching, setIsSearching] = useState(false);

  const popularDestinations = [
    { name: 'Foz do Iguazú', country: 'Brasil', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=200&fit=crop&auto=format&q=80' },
    { name: 'Cusco', country: 'Perú', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=300&h=200&fit=crop&auto=format&q=80' },
    { name: 'Buenos Aires', country: 'Argentina', image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=300&h=200&fit=crop&auto=format&q=80' },
    { name: 'Cancún', country: 'México', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&h=200&fit=crop&auto=format&q=80' },
    { name: 'Estambul', country: 'Turquía', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=300&h=200&fit=crop&auto=format&q=80' },
    { name: 'Mendoza', country: 'Argentina', image: 'https://images.unsplash.com/photo-1586783033026-47d37d22d122?w=300&h=200&fit=crop&auto=format&q=80' }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    setIsSearching(true);
    // Simular búsqueda
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSearching(false);
    
    // Redirect to search results
    const params = new URLSearchParams({
      destination: searchData.destination,
      departure: searchData.departureDate,
      return: searchData.returnDate,
      passengers: searchData.passengers.toString(),
      type: searchData.tripType
    });
    
    window.location.href = `/paquetes?${params.toString()}`;
  };

  const handleDestinationClick = (destination: string) => {
    setSearchData(prev => ({
      ...prev,
      destination: destination
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Main Search Card */}
      <div className="glass-effect rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Encontrá tu próximo destino
          </h2>
          <p className="text-white/90 text-lg">
            Buscá entre miles de paquetes conectados con Travel Compositor y encontrá la experiencia perfecta para vos
          </p>
        </div>

        {/* Trip Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 rounded-xl p-1 flex">
            <button
              onClick={() => handleInputChange('tripType', 'roundtrip')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                searchData.tripType === 'roundtrip'
                  ? 'bg-intertravel-gold text-white shadow-lg'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              ✈️ Ida y vuelta
            </button>
            <button
              onClick={() => handleInputChange('tripType', 'oneway')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                searchData.tripType === 'oneway'
                  ? 'bg-intertravel-gold text-white shadow-lg'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              ➡️ Solo ida
            </button>
          </div>
        </div>

        {/* Search Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Destination */}
          <div className="lg:col-span-2">
            <label className="block text-white/90 text-sm font-medium mb-2">
              📍 ¿A dónde querés viajar?
            </label>
            <input
              type="text"
              placeholder="Destino (ej: Foz do Iguazú)"
              value={searchData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-intertravel-navy placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-intertravel-gold font-medium"
            />
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              📅 Fecha de ida
            </label>
            <input
              type="date"
              value={searchData.departureDate}
              onChange={(e) => handleInputChange('departureDate', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-intertravel-navy border-0 focus:outline-none focus:ring-2 focus:ring-intertravel-gold font-medium"
            />
          </div>

          {/* Return Date */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              🔄 Fecha de vuelta
            </label>
            <input
              type="date"
              value={searchData.returnDate}
              onChange={(e) => handleInputChange('returnDate', e.target.value)}
              disabled={searchData.tripType === 'oneway'}
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-intertravel-navy border-0 focus:outline-none focus:ring-2 focus:ring-intertravel-gold font-medium disabled:opacity-50"
            />
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-white/90 text-sm font-medium mb-2">
              👥 Pasajeros
            </label>
            <select
              value={searchData.passengers}
              onChange={(e) => handleInputChange('passengers', parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-intertravel-navy border-0 focus:outline-none focus:ring-2 focus:ring-intertravel-gold font-medium"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Pasajero' : 'Pasajeros'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="text-center">
          <button
            onClick={handleSearch}
            disabled={!searchData.destination || isSearching}
            className="bg-intertravel-gold hover:bg-intertravel-gold-light text-white px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center"
          >
            {isSearching ? (
              <>
                <div className="loading w-5 h-5 mr-3"></div>
                Buscando...
              </>
            ) : (
              <>
                🔍 Buscar Paquetes
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="mt-16">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-white mb-4">
            Destinos populares
          </h3>
          <p className="text-white/80">
            Descubrí los destinos más elegidos por nuestros viajeros
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularDestinations.map((destination, index) => (
            <button
              key={index}
              onClick={() => handleDestinationClick(destination.name)}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] hover:transform hover:scale-105 transition-all duration-300"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${destination.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                <h4 className="text-white font-bold text-sm mb-1 group-hover:text-intertravel-gold transition-colors">
                  {destination.name}
                </h4>
                <p className="text-white/80 text-xs">
                  {destination.country}
                </p>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-intertravel-gold rounded-full p-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-12 text-center">
        <h4 className="text-white font-semibold mb-6">Búsquedas rápidas:</h4>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            'Vuelos chárter',
            'Viajes de egresados',
            'Todo incluido',
            'Turismo aventura',
            'Ciudades europeas',
            'Playas paradisíacas',
            'Circuitos culturales',
            'Escapadas románticas'
          ].map((filter, index) => (
            <button
              key={index}
              onClick={() => handleDestinationClick(filter)}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:transform hover:scale-105 border border-white/20 hover:border-intertravel-gold"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernSearch;