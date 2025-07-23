import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// GET /api/admin/fallback/test/[endpoint] - Probar endpoint específico
export async function GET(
  request: NextRequest,
  { params }: { params: { endpoint: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/fallback/test/${params.endpoint}`, {
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
    console.error('Error testing fallback endpoint:', error);
    return NextResponse.json(
      { error: 'Error al probar endpoint de fallback', details: error.message },
      { status: 500 }
    );
  }
}
