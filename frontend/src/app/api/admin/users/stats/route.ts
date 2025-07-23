import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Estadísticas mock robustas para desarrollo
const MOCK_STATS = {
  total: 1247,
  active: 1156,
  inactive: 91,
  verified: 1100,
  pending: 147,
  roles: {
    super_admin: 2,
    admin: 8,
    manager: 15,
    agency: 23,
    operator: 45,
    client: 1154
  },
  agencies: 23,
  newToday: 3,
  newThisWeek: 18,
  newThisMonth: 67,
  lastLogin: {
    today: 324,
    thisWeek: 892,
    thisMonth: 1098
  },
  growth: {
    daily: 2.5,
    weekly: 8.3,
    monthly: 12.1
  },
  topAgencies: [
    { name: 'Travel Dreams Agency', users: 156 },
    { name: 'Mendoza Tours', users: 98 },
    { name: 'Patagonia Travel', users: 87 },
    { name: 'Andes Adventures', users: 76 },
    { name: 'Wine & Travel', users: 65 }
  ],
  byLocation: {
    'Argentina': 890,
    'Chile': 187,
    'Uruguay': 98,
    'Brasil': 72
  },
  deviceStats: {
    desktop: 756,
    mobile: 412,
    tablet: 79
  }
};

// GET /api/admin/users/stats - Obtener estadísticas de usuarios
export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/admin/users/stats - Obteniendo estadísticas...');

    // Intentar backend primero
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Estadísticas obtenidas del backend');
        return NextResponse.json(data);
      } else {
        console.log('❌ Backend error:', response.status);
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible para stats:', backendError.message);
    }
    
    // Fallback con estadísticas mock
    console.log('🔄 Usando estadísticas mock...');
    
    return NextResponse.json({
      success: true,
      data: MOCK_STATS,
      source: 'mock-fallback',
      message: 'Estadísticas de prueba - Backend no disponible',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/users/stats:', error);
    
    // Respuesta de error con JSON válido
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estadísticas',
      details: error.message,
      data: {
        total: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        pending: 0,
        roles: {},
        agencies: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0
      }
    }, { status: 500 });
  }
}
