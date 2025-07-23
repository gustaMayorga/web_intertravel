
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    console.log(`📋 GET /api/admin/bookings/${bookingId}`);

    const mockBooking = {
      id: parseInt(bookingId),
      bookingNumber: `IT-2024-${bookingId.padStart(6, '0')}`,
      packageTitle: 'Reserva Mock',
      customerName: 'Cliente de Prueba',
      status: 'confirmed',
      totalAmount: 2500,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockBooking,
      source: 'mock'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al obtener reserva',
      details: error.message
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();
    console.log(`📋 PUT /api/admin/bookings/${bookingId}`);

    return NextResponse.json({
      success: true,
      data: { id: parseInt(bookingId), ...body, updatedAt: new Date().toISOString() },
      message: 'Reserva actualizada exitosamente (simulado)',
      source: 'mock'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al actualizar reserva',
      details: error.message
    }, { status: 500 });
  }
}
