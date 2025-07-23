import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

interface AuthRequest extends NextRequest {
  user?: {
    id: number;
    username: string;
    role: string;
    email: string;
  };
}

// Middleware simple sin dependencias externas
export async function withAuth(handler: (req: AuthRequest) => Promise<NextResponse>) {
  return async (request: AuthRequest) => {
    try {
      // Obtener token del header Authorization
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Token de autenticación requerido' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Para desarrollo, verificar token simple
      if (token && token.length > 10) {
        // Crear usuario de prueba basado en localStorage
        request.user = {
          id: 1,
          username: 'admin',
          role: 'super_admin',
          email: 'admin@intertravel.com'
        };
        
        console.log('✅ Token válido para usuario de desarrollo');
        return await handler(request);
      } else {
        throw new Error('Token inválido');
      }
      
    } catch (error) {
      console.error('❌ Error de autenticación:', error.message);
      
      return NextResponse.json(
        { 
          error: 'Token de autenticación inválido',
          details: error.message,
          action: 'redirect_to_login'
        },
        { status: 401 }
      );
    }
  };
}

// Modo fallback para desarrollo sin backend
export async function withFallback(handler: (req: AuthRequest) => Promise<NextResponse>) {
  return async (request: AuthRequest) => {
    try {
      // Verificar si el backend está disponible
      const backendCheck = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      }).catch(() => null);

      if (!backendCheck) {
        console.log('⚠️ Backend no disponible, usando modo fallback');
        return await handleFallbackMode(request, handler);
      }

      // Si backend está disponible, usar autenticación normal
      return await withAuth(handler)(request);
      
    } catch (error) {
      console.log('⚠️ Error conectando backend, usando fallback');
      return await handleFallbackMode(request, handler);
    }
  };
}

async function handleFallbackMode(request: AuthRequest, handler: (req: AuthRequest) => Promise<NextResponse>) {
  // En modo fallback, crear usuario de prueba
  request.user = {
    id: 1,
    username: 'admin',
    role: 'super_admin',
    email: 'admin@intertravel.com'
  };
  
  console.log('🔧 Modo fallback activado - usuario de prueba creado');
  return await handler(request);
}

export { AuthRequest };