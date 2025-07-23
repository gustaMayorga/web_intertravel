import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// GET /api/admin/payments/[id] - Obtener payment específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/payments/${params.id}`, {
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
    console.error('Error en GET /api/admin/payments/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payments/[id] - Actualizar payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/admin/payments/${params.id}`, {
      method: 'PUT',
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
    console.error('Error en PUT /api/admin/payments/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error actualizando payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payments/[id] - Eliminar payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/payments/${params.id}`, {
      method: 'DELETE',
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
    console.error('Error en DELETE /api/admin/payments/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error eliminando payment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
