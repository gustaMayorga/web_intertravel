
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Datos mock robustos para agencias
const MOCK_AGENCIES = [
  {
    id: 1,
    name: 'Travel Dreams Agency',
    email: 'info@traveldreams.com',
    phone: '+54 9 234-5678',
    contactPerson: 'María González',
    level: 'gold',
    levelColor: '#f59e0b',
    commission: 12,
    status: 'active',
    country: 'Argentina',
    city: 'Buenos Aires',
    address: 'Av. Corrientes 1234',
    website: 'www.traveldreams.com',
    taxId: '30-12345678-9',
    createdAt: new Date('2024-01-15').toISOString(),
    lastActivity: new Date('2024-07-01').toISOString(),
    stats: {
      totalBookings: 156,
      totalRevenue: 378000,
      monthlyBookings: 23,
      monthlyRevenue: 55400,
      avgBookingValue: 2423,
      clientSatisfaction: 4.7
    },
    documents: {
      contract: true,
      taxCertificate: true,
      businessLicense: true,
      bankDetails: true
    },
    targets: {
      monthlyBookings: 25,
      monthlyRevenue: 60000,
      achievement: 92.3
    }
  },
  {
    id: 2,
    name: 'Mendoza Tours',
    email: 'ventas@mendozatours.com',
    phone: '+54 261 234-5678',
    contactPerson: 'Roberto Vino',
    level: 'silver',
    levelColor: '#6b7280',
    commission: 10,
    status: 'active',
    country: 'Argentina',
    city: 'Mendoza',
    address: 'San Martín 456',
    website: 'www.mendozatours.com',
    taxId: '30-87654321-2',
    createdAt: new Date('2024-02-10').toISOString(),
    lastActivity: new Date('2024-06-28').toISOString(),
    stats: {
      totalBookings: 98,
      totalRevenue: 245000,
      monthlyBookings: 15,
      monthlyRevenue: 37500,
      avgBookingValue: 2500,
      clientSatisfaction: 4.5
    },
    documents: {
      contract: true,
      taxCertificate: true,
      businessLicense: false,
      bankDetails: true
    },
    targets: {
      monthlyBookings: 20,
      monthlyRevenue: 50000,
      achievement: 75.0
    }
  },
  {
    id: 3,
    name: 'Patagonia Travel',
    email: 'info@patagoniatravel.com',
    phone: '+54 2944 123456',
    contactPerson: 'Ana Aventura',
    level: 'platinum',
    levelColor: '#8b5cf6',
    commission: 15,
    status: 'active',
    country: 'Argentina',
    city: 'Bariloche',
    address: 'Mitre 789',
    website: 'www.patagoniatravel.com',
    taxId: '30-11223344-5',
    createdAt: new Date('2023-11-20').toISOString(),
    lastActivity: new Date('2024-07-02').toISOString(),
    stats: {
      totalBookings: 234,
      totalRevenue: 567000,
      monthlyBookings: 32,
      monthlyRevenue: 78000,
      avgBookingValue: 2423,
      clientSatisfaction: 4.9
    },
    documents: {
      contract: true,
      taxCertificate: true,
      businessLicense: true,
      bankDetails: true
    },
    targets: {
      monthlyBookings: 30,
      monthlyRevenue: 75000,
      achievement: 104.0
    }
  }
];

const MOCK_STATS = {
  total: 23,
  active: 21,
  inactive: 2,
  pending: 3,
  byLevel: {
    bronze: 8,
    silver: 7,
    gold: 5,
    platinum: 3
  },
  byCountry: {
    'Argentina': 18,
    'Chile': 3,
    'Uruguay': 2
  },
  performance: {
    totalRevenue: 1890000,
    avgCommission: 11.5,
    topPerformer: 'Patagonia Travel',
    avgBookingValue: 2350
  },
  growth: {
    newThisMonth: 2,
    upgraded: 3,
    totalBookings: 1247
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || '';
    const status = searchParams.get('status') || '';
    const country = searchParams.get('country') || '';

    console.log('🏢 GET /api/admin/agencies - Obteniendo agencias...');

    // Intentar backend primero
    try {
      const backendUrl = `${BACKEND_URL}/api/admin/agencies?${searchParams.toString()}`;
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
        console.log('✅ Agencias obtenidas del backend');
        return NextResponse.json(data);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible:', backendError.message);
    }
    
    // Fallback con datos mock
    console.log('🔄 Usando agencias mock...');
    let filteredAgencies = [...MOCK_AGENCIES];
    
    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAgencies = filteredAgencies.filter(agency => 
        agency.name.toLowerCase().includes(searchLower) ||
        agency.contactPerson.toLowerCase().includes(searchLower) ||
        agency.city.toLowerCase().includes(searchLower)
      );
    }
    
    if (level && level !== 'all') {
      filteredAgencies = filteredAgencies.filter(agency => agency.level === level);
    }
    
    if (status && status !== 'all') {
      filteredAgencies = filteredAgencies.filter(agency => agency.status === status);
    }
    
    if (country && country !== 'all') {
      filteredAgencies = filteredAgencies.filter(agency => agency.country === country);
    }

    // Paginación
    const total = filteredAgencies.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedAgencies = filteredAgencies.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedAgencies,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      source: 'mock-fallback',
      message: 'Agencias de prueba - Backend no disponible'
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/agencies:', error);
    
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
    console.log('🏢 POST /api/admin/agencies - Creando agencia:', body.name);

    const newAgency = {
      id: Date.now(),
      ...body,
      level: body.level || 'bronze',
      levelColor: getLevelColor(body.level || 'bronze'),
      status: 'pending',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      stats: {
        totalBookings: 0,
        totalRevenue: 0,
        monthlyBookings: 0,
        monthlyRevenue: 0,
        avgBookingValue: 0,
        clientSatisfaction: 0
      },
      documents: {
        contract: false,
        taxCertificate: false,
        businessLicense: false,
        bankDetails: false
      }
    };

    return NextResponse.json({
      success: true,
      data: newAgency,
      message: 'Agencia creada exitosamente (simulado)',
      source: 'mock'
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al crear agencia',
      details: error.message
    }, { status: 500 });
  }
}

function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    'bronze': '#cd7f32',
    'silver': '#6b7280',
    'gold': '#f59e0b',
    'platinum': '#8b5cf6'
  };
  return colors[level] || '#6b7280';
}
