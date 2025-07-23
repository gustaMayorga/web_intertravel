
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agencyId = params.id;
    console.log(`🏢 GET /api/admin/agencies/${agencyId}`);

    const mockAgency = {
      id: parseInt(agencyId),
      name: 'Agencia Mock',
      email: 'agencia@example.com',
      level: 'gold',
      status: 'active',
      commission: 12,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockAgency,
      source: 'mock'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener agencia',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agencyId = params.id;
    const body = await request.json();
    console.log(`🏢 PUT /api/admin/agencies/${agencyId}`);

    return NextResponse.json({
      success: true,
      data: { id: parseInt(agencyId), ...body, updatedAt: new Date().toISOString() },
      message: 'Agencia actualizada exitosamente (simulado)',
      source: 'mock'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar agencia',
      details: error.message
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agencyId = params.id;
    console.log(`🏢 DELETE /api/admin/agencies/${agencyId}`);

    return NextResponse.json({
      success: true,
      message: 'Agencia eliminada exitosamente (simulado)',
      source: 'mock'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al eliminar agencia',
      details: error.message
    }, { status: 500 });
  }
}
