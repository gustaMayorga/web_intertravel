import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// GET /api/admin/fallback/config - Obtener configuración de fallback
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/fallback/config`, {
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
    console.error('Error fetching fallback config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración de fallback', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/fallback/config - Actualizar configuración de fallback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/admin/fallback/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error updating fallback config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración de fallback', details: error.message },
      { status: 500 }
    );
  }
}
