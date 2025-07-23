'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const BannerDisplay = ({ position = 'hero', className = '', autoSlide = true, slideInterval = 5000 }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadBanners();
  }, [position]);

  useEffect(() => {
    if (autoSlide && banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, slideInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoSlide, banners.length, slideInterval]);

  const loadBanners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/public/banners?position=${position}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Filter active banners and sort by order_index
        const activeBanners = (data.banners || [])
          .filter(banner => banner.active)
          .sort((a, b) => (a.order_index || 1) - (b.order_index || 1));
        
        setBanners(activeBanners);
        console.log(`🎨 ${activeBanners.length} banners cargados para posición "${position}"`);
      } else {
        throw new Error(data.error || 'Error cargando banners');
      }
    } catch (err) {
      console.error('Error loading banners:', err);
      setError(err.message);
      
      // Fallback banners para testing
      if (position === 'hero') {
        setBanners([
          {
            id: 'fallback-hero',
            name: 'hero_main',
            title: 'Descubre el Mundo con InterTravel',
            subtitle: 'Experiencias únicas e inolvidables',
            description: 'Los mejores destinos del mundo te esperan. Paquetes exclusivos con la calidad que nos caracteriza.',
            image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop',
            button_text: 'Ver Paquetes',
            button_url: '/packages',
            background_color: '#1e40af',
            text_color: '#ffffff',
            position: 'hero',
            active: true,
            order_index: 1
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}>
        <div className="h-64 bg-gray-300 rounded-lg"></div>
      </div>
    );
  }

  if (error || banners.length === 0) {
    return null; // No mostrar nada si hay error o no hay banners
  }

  const currentBanner = banners[currentIndex];

  // Render different layouts based on position
  switch (position) {
    case 'hero':
      return (
        <div className={`relative overflow-hidden rounded-lg ${className}`}>
          <div 
            className="relative h-96 lg:h-[500px] flex items-center justify-center transition-all duration-700 ease-in-out"
            style={{ 
              backgroundColor: currentBanner.background_color,
              color: currentBanner.text_color 
            }}
          >
            {/* Background image */}
            {currentBanner.image_url && (
              <div className="absolute inset-0">
                <Image
                  src={currentBanner.image_url}
                  alt={currentBanner.title}
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>
            )}
            
            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                {currentBanner.title}
              </h1>
              
              {currentBanner.subtitle && (
                <p className="text-xl lg:text-2xl mb-6 opacity-90">
                  {currentBanner.subtitle}
                </p>
              )}
              
              {currentBanner.description && (
                <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
                  {currentBanner.description}
                </p>
              )}
              
              {currentBanner.button_text && currentBanner.button_url && (
                <Link 
                  href={currentBanner.button_url}
                  className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {currentBanner.button_text}
                </Link>
              )}
            </div>
            
            {/* Navigation arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                  aria-label="Banner anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                  aria-label="Banner siguiente"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            {/* Indicators */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex 
                        ? 'bg-white' 
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                    aria-label={`Ir al banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case 'sidebar':
      return (
        <div className={`space-y-4 ${className}`}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
              style={{ 
                backgroundColor: banner.background_color,
                color: banner.text_color 
              }}
            >
              {banner.image_url && (
                <div className="h-32 relative">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2">
                  {banner.title}
                </h3>
                
                {banner.subtitle && (
                  <p className="text-sm mb-2 opacity-90 line-clamp-1">
                    {banner.subtitle}
                  </p>
                )}
                
                {banner.description && (
                  <p className="text-sm mb-3 opacity-80 line-clamp-2">
                    {banner.description}
                  </p>
                )}
                
                {banner.button_text && banner.button_url && (
                  <Link 
                    href={banner.button_url}
                    className="inline-block px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-all duration-200"
                  >
                    {banner.button_text}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      );

    case 'card':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105"
              style={{ 
                backgroundColor: banner.background_color,
                color: banner.text_color 
              }}
            >
              {banner.image_url && (
                <div className="h-48 relative">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="p-6">
                <h3 className="font-bold text-xl mb-3">
                  {banner.title}
                </h3>
                
                {banner.subtitle && (
                  <p className="text-lg mb-3 opacity-90">
                    {banner.subtitle}
                  </p>
                )}
                
                {banner.description && (
                  <p className="mb-4 opacity-80 line-clamp-3">
                    {banner.description}
                  </p>
                )}
                
                {banner.button_text && banner.button_url && (
                  <Link 
                    href={banner.button_url}
                    className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition-all duration-200 group"
                  >
                    {banner.button_text}
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      );

    case 'footer':
      return (
        <div className={`${className}`}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="rounded-lg p-6 text-center"
              style={{ 
                backgroundColor: banner.background_color,
                color: banner.text_color 
              }}
            >
              <h3 className="font-bold text-lg mb-2">
                {banner.title}
              </h3>
              
              {banner.subtitle && (
                <p className="mb-3 opacity-90">
                  {banner.subtitle}
                </p>
              )}
              
              {banner.description && (
                <p className="mb-4 opacity-80 max-w-2xl mx-auto">
                  {banner.description}
                </p>
              )}
              
              {banner.button_text && banner.button_url && (
                <Link 
                  href={banner.button_url}
                  className="inline-block px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition-all duration-200"
                >
                  {banner.button_text}
                </Link>
              )}
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className={className}>
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: banner.background_color,
                color: banner.text_color 
              }}
            >
              <h3 className="font-semibold">{banner.title}</h3>
              {banner.subtitle && <p className="text-sm opacity-90">{banner.subtitle}</p>}
            </div>
          ))}
        </div>
      );
  }
};

export default BannerDisplay;