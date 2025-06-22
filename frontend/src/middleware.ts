import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Proteger rutas admin
  if (pathname.startsWith('/admin')) {
    // Permitir acceso a la página de login
    if (pathname === '/admin/login' || pathname === '/admin') {
      return NextResponse.next();
    }
    
    // Verificar autenticación para otras rutas admin
    const adminToken = request.cookies.get('adminToken')?.value;
    const adminStorage = request.headers.get('authorization');
    
    // Si no hay token, redirigir a login
    if (!adminToken && !adminStorage) {
      console.log('🚨 Acceso no autorizado a:', pathname);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  
  // Proteger rutas agency
  if (pathname.startsWith('/agency')) {
    // Permitir acceso a la página de login
    if (pathname === '/agency/login' || pathname === '/agency') {
      return NextResponse.next();
    }
    
    // Verificar autenticación para otras rutas agency
    const agencyToken = request.cookies.get('agencyToken')?.value;
    const agencyStorage = request.headers.get('x-agency-token');
    
    // Si no hay token, redirigir a login
    if (!agencyToken && !agencyStorage) {
      console.log('🚨 Acceso no autorizado a:', pathname);
      return NextResponse.redirect(new URL('/agency/login', request.url));
    }
  }
  
  // Log de accesos para auditoría
  if (pathname.startsWith('/admin') || pathname.startsWith('/agency')) {
    console.log(`🔍 Acceso a: ${pathname} - IP: ${request.ip || 'unknown'}`);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/agency/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};