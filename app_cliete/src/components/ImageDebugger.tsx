"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ImageStatus {
  src: string;
  status: 'loading' | 'success' | 'error';
  error?: string;
}

export default function ImageDebugger({ packages }: { packages: any[] }) {
  const [imageStatuses, setImageStatuses] = useState<ImageStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const checkImageStatus = async (src: string): Promise<ImageStatus> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ src, status: 'success' });
      img.onerror = (error) => resolve({ 
        src, 
        status: 'error', 
        error: 'Failed to load' 
      });
      img.src = src;
      
      // Timeout después de 5 segundos
      setTimeout(() => {
        resolve({ src, status: 'error', error: 'Timeout' });
      }, 5000);
    });
  };

  const checkAllImages = async () => {
    setIsChecking(true);
    const uniqueImages = [...new Set(packages.map(pkg => pkg.images?.main).filter(Boolean))];
    
    const results = await Promise.all(
      uniqueImages.map(src => checkImageStatus(src))
    );
    
    setImageStatuses(results);
    setIsChecking(false);
  };

  useEffect(() => {
    if (packages.length > 0) {
      checkAllImages();
    }
  }, [packages]);

  const successCount = imageStatuses.filter(img => img.status === 'success').length;
  const errorCount = imageStatuses.filter(img => img.status === 'error').length;

  return (
    <Card className="mb-4 border-l-4 border-l-orange-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Debug: Estado de Imágenes</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              {successCount} OK
            </Badge>
            <Badge variant="outline" className="text-red-600">
              <XCircle className="h-3 w-3 mr-1" />
              {errorCount} Error
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkAllImages}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-xs">
          {isChecking ? (
            <span className="text-blue-600">
              🔍 Verificando {imageStatuses.length} imágenes...
            </span>
          ) : (
            <span>
              📊 Total: {imageStatuses.length} imágenes | 
              ✅ {successCount} cargadas | 
              ❌ {errorCount} con errores
            </span>
          )}
        </CardDescription>
        
        {errorCount > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-xs font-medium text-red-600">Imágenes con errores:</div>
            {imageStatuses
              .filter(img => img.status === 'error')
              .slice(0, 3)
              .map((img, i) => (
                <div key={i} className="text-xs text-red-500 truncate">
                  {img.src}
                </div>
              ))}
            {errorCount > 3 && (
              <div className="text-xs text-muted-foreground">
                ...y {errorCount - 3} más
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
