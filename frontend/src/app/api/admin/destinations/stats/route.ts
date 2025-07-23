import { NextRequest, NextResponse } from 'next/server';

const MOCK_STATS = {
  total: 45,
  active: 42,
  inactive: 3,
  withCoordinates: 39,
  withoutCoordinates: 6,
  totalPackages: 156,
  countries: 12,
  topCountries: [
    { country: 'Argentina', count: 18 },
    { country: 'Perú', count: 8 },
    { country: 'Chile', count: 7 },
    { country: 'Brasil', count: 6 },
    { country: 'Uruguay', count: 4 }
  ],
  byRegion: {
    'América del Sur': 35,
    'Europa': 8,
    'Asia': 2
  },
  recentlyAdded: 5,
  mostPopular: [
    { name: 'Cusco', packages: 18 },
    { name: 'Buenos Aires', packages: 15 },
    { name: 'Mendoza', packages: 12 }
  ]
};

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/admin/destinations/stats');
    
    return NextResponse.json({
      success: true,
      data: MOCK_STATS,
      source: 'mock-fallback',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estadísticas de destinos',
      data: MOCK_STATS
    }, { status: 500 });
  }
}
