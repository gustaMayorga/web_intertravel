import { NextRequest, NextResponse } from 'next/server';

// Datos mock robustos para destinos
const MOCK_DESTINATIONS = [
  {
    id: 1,
    name: 'Buenos Aires',
    country: 'Argentina',
    coordinates: { lat: -34.6037, lng: -58.3816 },
    description: 'Capital cosmopolita de Argentina',
    isActive: true,
    packageCount: 15,
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 2,
    name: 'Mendoza',
    country: 'Argentina', 
    coordinates: { lat: -32.8895, lng: -68.8458 },
    description: 'Capital mundial del vino',
    isActive: true,
    packageCount: 12,
    createdAt: new Date('2024-01-15').toISOString()
  },
  {
    id: 3,
    name: 'Cusco',
    country: 'Perú',
    coordinates: { lat: -13.5319, lng: -71.9675 },
    description: 'Puerta de entrada a Machu Picchu', 
    isActive: true,
    packageCount: 18,
    createdAt: new Date('2024-02-01').toISOString()
  },
  {
    id: 4,
    name: 'Bariloche',
    country: 'Argentina',
    coordinates: { lat: -41.1335, lng: -71.3103 },
    description: 'Paraíso patagónico',
    isActive: true,
    packageCount: 8,
    createdAt: new Date('2024-02-15').toISOString()
  },
  {
    id: 5,
    name: 'Salta',
    country: 'Argentina',
    coordinates: { lat: -24.7821, lng: -65.4232 },
    description: 'La Linda del Norte',
    isActive: true,
    packageCount: 6,
    createdAt: new Date('2024-03-01').toISOString()
  }
];

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const active = searchParams.get('active');

    console.log('🗺️ GET /api/admin/destinations - Obteniendo destinos...');

    // Intentar backend primero
    try {
      const backendUrl = `${BACKEND_URL}/api/admin/destinations?${searchParams.toString()}`;
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Destinos obtenidos del backend');
        return NextResponse.json(data);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible:', backendError.message);
    }
    
    // Fallback con datos mock
    console.log('🔄 Usando destinos mock...');
    let filteredDestinations = [...MOCK_DESTINATIONS];
    
    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredDestinations = filteredDestinations.filter(dest => 
        dest.name.toLowerCase().includes(searchLower) ||
        dest.country.toLowerCase().includes(searchLower) ||
        dest.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (country && country !== 'all') {
      filteredDestinations = filteredDestinations.filter(dest => dest.country === country);
    }
    
    if (active !== null && active !== undefined) {
      filteredDestinations = filteredDestinations.filter(dest => dest.isActive === (active === 'true'));
    }

    return NextResponse.json({
      success: true,
      data: filteredDestinations,
      total: filteredDestinations.length,
      source: 'mock-fallback',
      message: 'Destinos de prueba - Backend no disponible'
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/destinations:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      data: [],
      total: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🗺️ POST /api/admin/destinations - Creando destino:', body.name);

    // Simular creación exitosa
    const newDestination = {
      id: Date.now(),
      ...body,
      isActive: true,
      packageCount: 0,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newDestination,
      message: 'Destino creado exitosamente (simulado)',
      source: 'mock'
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al crear destino',
      details: error.message
    }, { status: 500 });
  }
}
