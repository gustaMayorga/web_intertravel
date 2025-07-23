
import { NextRequest, NextResponse } from 'next/server';

const MOCK_STATS = {
  total: 23,
  active: 21,
  inactive: 2,
  pending: 3,
  verified: 18,
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
    topPerformer: { name: 'Patagonia Travel', revenue: 567000 },
    avgBookingValue: 2350,
    totalBookings: 1247
  },
  growth: {
    newThisMonth: 2,
    newThisWeek: 1,
    upgraded: 3,
    monthlyGrowth: 8.7
  },
  targets: {
    achieved: 15,
    onTrack: 5,
    belowTarget: 3
  }
};

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/admin/agencies/stats');
    
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
