
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Datos mock robustos para analytics
const MOCK_ANALYTICS = {
  overview: {
    totalRevenue: 2847500,
    totalBookings: 1247,
    totalUsers: 1247,
    totalPackages: 156,
    growthMetrics: {
      revenueGrowth: 18.5,
      bookingsGrowth: 12.3,
      usersGrowth: 24.7,
      packagesGrowth: 8.9
    }
  },
  revenue: {
    thisMonth: 245000,
    lastMonth: 198000,
    thisYear: 2847500,
    lastYear: 2134000,
    byMonth: [
      { month: 'Ene', revenue: 180000, bookings: 89 },
      { month: 'Feb', revenue: 220000, bookings: 102 },
      { month: 'Mar', revenue: 280000, bookings: 134 },
      { month: 'Abr', revenue: 195000, bookings: 96 },
      { month: 'May', revenue: 310000, bookings: 156 },
      { month: 'Jun', revenue: 275000, bookings: 142 },
      { month: 'Jul', revenue: 245000, bookings: 128 }
    ],
    byCategory: {
      'wine-tour': 1284750,
      'adventure': 987200,
      'cultural': 575550
    }
  },
  bookings: {
    total: 1247,
    confirmed: 789,
    pending: 156,
    completed: 234,
    cancelled: 68,
    byMonth: [
      { month: 'Ene', bookings: 89, conversion: 12.3 },
      { month: 'Feb', bookings: 102, conversion: 14.1 },
      { month: 'Mar', bookings: 134, conversion: 15.8 },
      { month: 'Abr', bookings: 96, conversion: 11.9 },
      { month: 'May', bookings: 156, conversion: 17.2 },
      { month: 'Jun', bookings: 142, conversion: 16.5 },
      { month: 'Jul', bookings: 128, conversion: 15.1 }
    ],
    topPackages: [
      { name: 'Mendoza Wine Tour Premium', bookings: 127, revenue: 317500 },
      { name: 'Patagonia Adventure Trek', bookings: 89, revenue: 284800 },
      { name: 'Cusco y Machu Picchu Clásico', bookings: 245, revenue: 441000 }
    ]
  },
  users: {
    total: 1247,
    active: 1156,
    newThisMonth: 67,
    retention: 84.2,
    byType: {
      customers: 1154,
      agencies: 23,
      admins: 15,
      operators: 55
    },
    engagement: {
      dailyActive: 324,
      weeklyActive: 892,
      monthlyActive: 1098
    }
  },
  traffic: {
    totalVisits: 45670,
    uniqueVisitors: 23450,
    pageViews: 156780,
    avgSessionDuration: 285,
    bounceRate: 34.5,
    topPages: [
      { page: '/paquetes', visits: 12450, conversion: 8.3 },
      { page: '/destinos', visits: 9870, conversion: 5.2 },
      { page: '/paquetes/mendoza', visits: 8650, conversion: 12.8 }
    ],
    sources: {
      organic: 45.2,
      direct: 28.7,
      social: 15.3,
      referral: 10.8
    }
  },
  performance: {
    avgBookingValue: 2285,
    conversionRate: 14.2,
    customerLifetimeValue: 3450,
    customerAcquisitionCost: 125,
    returnOnAdSpend: 4.8,
    customerSatisfaction: 4.7
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const metric = searchParams.get('metric') || 'all';

    console.log('📊 GET /api/admin/analytics - Obteniendo analytics...');

    // Intentar backend primero
    try {
      const backendUrl = `${BACKEND_URL}/api/admin/analytics?${searchParams.toString()}`;
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
        console.log('✅ Analytics obtenidos del backend');
        return NextResponse.json(data);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible:', backendError.message);
    }
    
    // Fallback con datos mock
    console.log('🔄 Usando analytics mock...');

    // Filtrar por métrica específica si se solicita
    let responseData = MOCK_ANALYTICS;
    if (metric !== 'all') {
      responseData = { [metric]: (MOCK_ANALYTICS as any)[metric] };
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      period,
      timestamp: new Date().toISOString(),
      source: 'mock-fallback',
      message: 'Analytics de prueba - Backend no disponible'
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/analytics:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      data: MOCK_ANALYTICS
    }, { status: 500 });
  }
}
