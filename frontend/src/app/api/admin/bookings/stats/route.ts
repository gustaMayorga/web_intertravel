import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// GET /api/admin/bookings/stats - Obtener estadísticas de reservas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const groupBy = searchParams.get('groupBy') || 'day';

    const queryParams = new URLSearchParams({
      period,
      groupBy
    });

    const response = await fetch(`${BACKEND_URL}/api/admin/bookings-stats?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de reservas', details: error.message },
      { status: 500 }
    );
  }
}
