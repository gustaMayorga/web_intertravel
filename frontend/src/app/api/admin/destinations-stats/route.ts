import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// GET /api/admin/destinations-stats - Obtener estadísticas de destinos
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo estadísticas de destinos...');
    
    // Intentar backend directo primero
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/destinations-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Estadísticas obtenidas del backend');
        return NextResponse.json(data);
      } else {
        console.log('❌ Backend respondió con error:', response.status);
      }
    } catch (backendError: any) {
      console.log('❌ Error conectando al backend:', backendError.message);
    }
    
    // Fallback con estadísticas mock
    console.log('🔄 Usando estadísticas mock...');
    const mockStats = {
      total: 8,
      active: 8,
      withCoordinates: 8,
      totalPackages: 96,
      countries: 5,
      topDestination: {
        name: 'Cusco',
        packageCount: 18
      },
      lastModified: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      stats: mockStats,
      source: 'mock-fallback'
    });

  } catch (error: any) {
    console.error('Error fetching destination stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas', details: error.message },
      { status: 500 }
    );
  }
}