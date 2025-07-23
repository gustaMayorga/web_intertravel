"use client";

import { useFirebaseStatus } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

export default function FirebaseStatusIndicator() {
  const { isFirebaseEnabled, isMockMode, isOfflineMode } = useFirebaseStatus();

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
          <div className="flex items-center gap-2">
            {isFirebaseEnabled ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="default">Firebase Activo</Badge>
              </>
            ) : (
              <>
                {isMockMode ? (
                  <>
                    <Wifi className="h-4 w-4 text-blue-500" />
                    <Badge variant="secondary">Modo Desarrollo</Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-orange-500" />
                    <Badge variant="outline">Sin Firebase</Badge>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-xs">
          {isFirebaseEnabled && (
            <span className="text-green-600">
               Firebase configurado y funcionando correctamente
            </span>
          )}
          {isMockMode && (
            <span className="text-blue-600">
               Modo desarrollo: La app funciona sin Firebase usando datos locales
            </span>
          )}
          {isOfflineMode && !isMockMode && (
            <span className="text-orange-600">
              ️ Firebase no disponible: Funcionalidad limitada sin autenticación
            </span>
          )}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
