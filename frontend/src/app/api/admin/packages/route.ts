
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Datos mock robustos para paquetes
const MOCK_PACKAGES = [
  {
    id: 1,
    title: 'Mendoza Wine Tour Premium',
    description: 'Experiencia premium en las mejores bodegas de Mendoza',
    price: 2500,
    currency: 'USD',
    duration: 5,
    category: 'wine-tour',
    destination: 'Mendoza',
    country: 'Argentina',
    status: 'active',
    featured: true,
    difficulty: 'easy',
    minPeople: 2,
    maxPeople: 12,
    images: ['/images/mendoza-wine.jpg'],
    includes: ['Transporte', 'Degustaciones', 'Almuerzo gourmet'],
    highlights: ['Bodega Catena Zapata', 'Bodega Norton', 'Vista a los Andes'],
    itinerary: [
      { day: 1, title: 'Llegada y primera bodega', description: 'Recepción y visita a Bodega Catena Zapata' },
      { day: 2, title: 'Valle de Uco', description: 'Exploración del prestigioso Valle de Uco' }
    ],
    rating: 4.8,
    reviews: 127,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
    provider: 'InterTravel',
    commission: 15
  },
  {
    id: 2,
    title: 'Patagonia Adventure Trek',
    description: 'Aventura extrema en la Patagonia argentina',
    price: 3200,
    currency: 'USD',
    duration: 8,
    category: 'adventure',
    destination: 'Patagonia',
    country: 'Argentina',
    status: 'active',
    featured: true,
    difficulty: 'hard',
    minPeople: 4,
    maxPeople: 8,
    images: ['/images/patagonia.jpg'],
    includes: ['Guía especializado', 'Equipamiento', 'Camping'],
    highlights: ['Glaciar Perito Moreno', 'Fitz Roy', 'Torres del Paine'],
    itinerary: [
      { day: 1, title: 'Llegada a El Calafate', description: 'Recepción y briefing' },
      { day: 2, title: 'Glaciar Perito Moreno', description: 'Trekking sobre hielo' }
    ],
    rating: 4.9,
    reviews: 89,
    createdAt: new Date('2024-02-20').toISOString(),
    updatedAt: new Date().toISOString(),
    provider: 'Travel Compositor',
    commission: 12
  },
  {
    id: 3,
    title: 'Cusco y Machu Picchu Clásico',
    description: 'Tour clásico a la ciudadela inca',
    price: 1800,
    currency: 'USD',
    duration: 4,
    category: 'cultural',
    destination: 'Cusco',
    country: 'Perú',
    status: 'active',
    featured: false,
    difficulty: 'moderate',
    minPeople: 1,
    maxPeople: 20,
    images: ['/images/machu-picchu.jpg'],
    includes: ['Tren a Machu Picchu', 'Entradas', 'Guía certificado'],
    highlights: ['Machu Picchu', 'Valle Sagrado', 'Cusco colonial'],
    itinerary: [
      { day: 1, title: 'City tour Cusco', description: 'Exploración del centro histórico' },
      { day: 2, title: 'Valle Sagrado', description: 'Pisac y Ollantaytambo' }
    ],
    rating: 4.7,
    reviews: 245,
    createdAt: new Date('2024-03-10').toISOString(),
    updatedAt: new Date().toISOString(),
    provider: 'Travel Compositor',
    commission: 10
  }
];

const MOCK_STATS = {
  total: 156,
  active: 142,
  inactive: 14,
  featured: 23,
  categories: {
    'wine-tour': 45,
    'adventure': 38,
    'cultural': 42,
    'relax': 31
  },
  destinations: {
    'Mendoza': 45,
    'Patagonia': 38,
    'Cusco': 35,
    'Buenos Aires': 28,
    'Salta': 10
  },
  avgPrice: 2150,
  totalRevenue: 425000,
  bestRated: { title: 'Patagonia Adventure Trek', rating: 4.9 },
  mostBooked: { title: 'Mendoza Wine Tour Premium', bookings: 127 }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const destination = searchParams.get('destination') || '';

    console.log('📦 GET /api/admin/packages - Obteniendo paquetes...');

    // Intentar backend primero
    try {
      const backendUrl = `${BACKEND_URL}/api/admin/packages?${searchParams.toString()}`;
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
        console.log('✅ Paquetes obtenidos del backend');
        return NextResponse.json(data);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible:', backendError.message);
    }
    
    // Fallback con datos mock
    console.log('🔄 Usando paquetes mock...');
    let filteredPackages = [...MOCK_PACKAGES];
    
    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.title.toLowerCase().includes(searchLower) ||
        pkg.description.toLowerCase().includes(searchLower) ||
        pkg.destination.toLowerCase().includes(searchLower)
      );
    }
    
    if (category && category !== 'all') {
      filteredPackages = filteredPackages.filter(pkg => pkg.category === category);
    }
    
    if (status && status !== 'all') {
      filteredPackages = filteredPackages.filter(pkg => pkg.status === status);
    }
    
    if (destination && destination !== 'all') {
      filteredPackages = filteredPackages.filter(pkg => pkg.destination === destination);
    }

    // Paginación
    const total = filteredPackages.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedPackages = filteredPackages.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedPackages,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      source: 'mock-fallback',
      message: 'Paquetes de prueba - Backend no disponible'
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/packages:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 POST /api/admin/packages - Creando paquete:', body.title);

    // Simular creación exitosa
    const newPackage = {
      id: Date.now(),
      ...body,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      reviews: 0,
      provider: 'InterTravel'
    };

    return NextResponse.json({
      success: true,
      data: newPackage,
      message: 'Paquete creado exitosamente (simulado)',
      source: 'mock'
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al crear paquete',
      details: error.message
    }, { status: 500 });
  }
}
