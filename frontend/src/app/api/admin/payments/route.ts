import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// GET /api/admin/payments - Obtener lista de payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    const queryParams = new URLSearchParams({
      page,
      limit,
      search
    });

    const response = await fetch(`${BACKEND_URL}/api/admin/payments?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error del backend: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en GET /api/admin/payments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error conectando con backend',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments - Crear nuevo payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/admin/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Error del backend: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error en POST /api/admin/payments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error creando payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
