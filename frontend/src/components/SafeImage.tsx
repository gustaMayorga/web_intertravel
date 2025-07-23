// ===============================================
// COMPONENTE DE IMAGEN SEGURA - INTERTRAVEL
// ===============================================

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  fallbackSrc?: string;
  priority?: boolean;
  sizes?: string;
}

export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  fallbackSrc,
  priority = false,
  sizes
}: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Fallback por defecto
  const defaultFallback = fallbackSrc || '/placeholder.jpg';

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (fallbackSrc) {
        setImageSrc(fallbackSrc);
      } else {
        // Mostrar placeholder personalizado
        setImageSrc(defaultFallback);
      }
    }
  };

  // Si hay error y no hay fallback, mostrar componente de placeholder
  if (hasError && !fallbackSrc) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width: width || '100%', height: height || '200px' }}
      >
        <div className="text-center text-gray-400">
          <ImageIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">Imagen no disponible</p>
        </div>
      </div>
    );
  }

  const imageProps = {
    src: imageSrc,
    alt,
    className,
    onError: handleError,
    priority,
    sizes
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      width={width || 800}
      height={height || 600}
    />
  );
}

// Componente específico para paquetes de viaje
export function PackageImage({ 
  src, 
  alt, 
  className = "w-full h-48 object-cover" 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
}) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      width={400}
      height={300}
      className={className}
      fallbackSrc="/camboriu.jfif"
    />
  );
}

// Componente específico para avatares
export function AvatarImage({ 
  src, 
  alt, 
  size = 40 
}: { 
  src?: string; 
  alt: string; 
  size?: number; 
}) {
  return (
    <SafeImage
      src={src || '/default-avatar.png'}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover w-${size} h-${size}`}
      fallbackSrc="/default-avatar.png"
    />
  );
}