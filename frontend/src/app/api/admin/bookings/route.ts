
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Datos mock robustos para reservas
const MOCK_BOOKINGS = [
  {
    id: 1,
    bookingNumber: 'IT-2024-001247',
    packageId: 1,
    packageTitle: 'Mendoza Wine Tour Premium',
    customerId: 3,
    customerName: 'Carlos Mendoza',
    customerEmail: 'carlos@example.com',
    customerPhone: '+54 9 261 555-0123',
    agencyId: 2,
    agencyName: 'Travel Dreams Agency',
    status: 'confirmed',
    paymentStatus: 'paid',
    totalAmount: 2500,
    currency: 'USD',
    participants: 2,
    travelDate: '2024-08-15',
    returnDate: '2024-08-20',
    createdAt: new Date('2024-07-01').toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Cliente solicita habitación con vista a la montaña',
    specialRequests: ['Dieta vegetariana', 'Aniversario de bodas'],
    documents: {
      voucher: true,
      invoice: true,
      insurance: false
    },
    timeline: [
      { date: '2024-07-01', action: 'Reserva creada', user: 'Sistema' },
      { date: '2024-07-01', action: 'Pago confirmado', user: 'MercadoPago' },
      { date: '2024-07-02', action: 'Voucher generado', user: 'Admin' }
    ]
  },
  {
    id: 2,
    bookingNumber: 'IT-2024-001248',
    packageId: 2,
    packageTitle: 'Patagonia Adventure Trek',
    customerId: 4,
    customerName: 'Ana Silva',
    customerEmail: 'ana@example.com',
    customerPhone: '+55 21 99999-8888',
    agencyId: null,
    agencyName: null,
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: 6400,
    currency: 'USD',
    participants: 2,
    travelDate: '2024-09-10',
    returnDate: '2024-09-18',
    createdAt: new Date('2024-07-02').toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'Primera vez en Patagonia',
    specialRequests: ['Equipamiento para principiantes'],
    documents: {
      voucher: false,
      invoice: false,
      insurance: false
    },
    timeline: [
      { date: '2024-07-02', action: 'Reserva creada', user: 'Cliente' },
      { date: '2024-07-02', action: 'Esperando pago', user: 'Sistema' }
    ]
  },
  {
    id: 3,
    bookingNumber: 'IT-2024-001249',
    packageId: 3,
    packageTitle: 'Cusco y Machu Picchu Clásico',
    customerId: 5,
    customerName: 'Roberto García',
    customerEmail: 'roberto@gmail.com',
    customerPhone: '+54 11 4567-8901',
    agencyId: 3,
    agencyName: 'Mendoza Tours',
    status: 'completed',
    paymentStatus: 'paid',
    totalAmount: 3600,
    currency: 'USD',
    participants: 2,
    travelDate: '2024-06-15',
    returnDate: '2024-06-19',
    createdAt: new Date('2024-05-10').toISOString(),
    updatedAt: new Date('2024-06-25').toISOString(),
    notes: 'Viaje completado satisfactoriamente',
    specialRequests: ['Luna de miel'],
    documents: {
      voucher: true,
      invoice: true,
      insurance: true
    },
    timeline: [
      { date: '2024-05-10', action: 'Reserva creada', user: 'Agencia' },
      { date: '2024-05-15', action: 'Pago confirmado', user: 'Stripe' },
      { date: '2024-06-10', action: 'Documentos enviados', user: 'Admin' },
      { date: '2024-06-25', action: 'Viaje completado', user: 'Cliente' }
    ]
  }
];

const MOCK_STATS = {
  total: 1247,
  byStatus: {
    pending: 156,
    confirmed: 789,
    inProgress: 45,
    completed: 234,
    cancelled: 23
  },
  byPayment: {
    pending: 178,
    paid: 1034,
    refunded: 35
  },
  revenue: {
    total: 2847500,
    thisMonth: 245000,
    thisWeek: 67500,
    today: 12500
  },
  trends: {
    growth: 15.8,
    avgBookingValue: 2285,
    conversionRate: 12.5,
    repeatCustomers: 34.2
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';

    console.log('📋 GET /api/admin/bookings - Obteniendo reservas...');

    // Intentar backend primero
    try {
      const backendUrl = `${BACKEND_URL}/api/admin/bookings?${searchParams.toString()}`;
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
        console.log('✅ Reservas obtenidas del backend');
        return NextResponse.json(data);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible:', backendError.message);
    }
    
    // Fallback con datos mock
    console.log('🔄 Usando reservas mock...');
    let filteredBookings = [...MOCK_BOOKINGS];
    
    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = filteredBookings.filter(booking => 
        booking.bookingNumber.toLowerCase().includes(searchLower) ||
        booking.customerName.toLowerCase().includes(searchLower) ||
        booking.packageTitle.toLowerCase().includes(searchLower)
      );
    }
    
    if (status && status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.status === status);
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.paymentStatus === paymentStatus);
    }

    // Paginación
    const total = filteredBookings.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedBookings = filteredBookings.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedBookings,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      source: 'mock-fallback',
      message: 'Reservas de prueba - Backend no disponible'
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/bookings:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📋 POST /api/admin/bookings - Creando reserva');

    const newBooking = {
      id: Date.now(),
      bookingNumber: `IT-2024-${String(Date.now()).slice(-6)}`,
      ...body,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: { voucher: false, invoice: false, insurance: false },
      timeline: [
        { date: new Date().toISOString(), action: 'Reserva creada', user: 'Admin' }
      ]
    };

    return NextResponse.json({
      success: true,
      data: newBooking,
      message: 'Reserva creada exitosamente (simulado)',
      source: 'mock'
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al crear reserva',
      details: error.message
    }, { status: 500 });
  }
}
