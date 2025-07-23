
import { NextRequest, NextResponse } from 'next/server';

const MOCK_STATS = {
  total: 156,
  active: 142,
  inactive: 14,
  featured: 23,
  draft: 8,
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
  pricing: {
    avgPrice: 2150,
    minPrice: 450,
    maxPrice: 8500,
    totalValue: 335400
  },
  performance: {
    totalRevenue: 425000,
    totalBookings: 1247,
    avgBookingsPerPackage: 8,
    conversionRate: 12.5
  },
  ratings: {
    avgRating: 4.6,
    totalReviews: 2847,
    distribution: {
      5: 1580,
      4: 912,
      3: 285,
      2: 58,
      1: 12
    }
  },
  topPerformers: [
    { id: 1, title: 'Mendoza Wine Tour Premium', bookings: 127, revenue: 317500 },
    { id: 2, title: 'Patagonia Adventure Trek', bookings: 89, revenue: 284800 },
    { id: 3, title: 'Cusco y Machu Picchu Clásico', bookings: 245, revenue: 441000 }
  ],
  recent: {
    newThisWeek: 3,
    newThisMonth: 12,
    updatedToday: 8
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/admin/packages/stats');
    
    return NextResponse.json({
      success: true,
      data: MOCK_STATS,
      source: 'mock-fallback',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener estadísticas',
      data: MOCK_STATS
    }, { status: 500 });
  }
}
