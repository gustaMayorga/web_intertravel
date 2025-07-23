"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  fallbackSrc?: string;
}

export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  placeholder = 'empty',
  fallbackSrc = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&auto=format&q=80'
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      console.log(`Error loading image: ${imgSrc}`);
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  // Si hay error y el fallback también falla, mostrar placeholder
  if (hasError && imgSrc === fallbackSrc) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  const imageProps = {
    src: imgSrc,
    alt: alt,
    className: className,
    onError: handleError,
    sizes: sizes,
    priority: priority,
    placeholder: placeholder,
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
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
