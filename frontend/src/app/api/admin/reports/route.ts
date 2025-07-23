
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Datos mock robustos para reportes
const MOCK_REPORTS = {
  financial: {
    summary: {
      totalRevenue: 2847500,
      totalCosts: 1423750,
      netProfit: 1423750,
      profitMargin: 50.0,
      periodStart: '2024-01-01',
      periodEnd: '2024-07-02'
    },
    byMonth: [
      { month: 'Enero', revenue: 180000, costs: 90000, profit: 90000, margin: 50.0 },
      { month: 'Febrero', revenue: 220000, costs: 110000, profit: 110000, margin: 50.0 },
      { month: 'Marzo', revenue: 280000, costs: 140000, profit: 140000, margin: 50.0 },
      { month: 'Abril', revenue: 195000, costs: 97500, profit: 97500, margin: 50.0 },
      { month: 'Mayo', revenue: 310000, costs: 155000, profit: 155000, margin: 50.0 },
      { month: 'Junio', revenue: 275000, costs: 137500, profit: 137500, margin: 50.0 },
      { month: 'Julio', revenue: 245000, costs: 122500, profit: 122500, margin: 50.0 }
    ],
    commissions: {
      totalPaid: 284750,
      byAgency: [
        { agency: 'Travel Dreams Agency', commission: 45600, percentage: 12 },
        { agency: 'Patagonia Travel', commission: 85050, percentage: 15 },
        { agency: 'Mendoza Tours', commission: 24500, percentage: 10 }
      ]
    }
  },
  sales: {
    summary: {
      totalBookings: 1247,
      totalRevenue: 2847500,
      avgBookingValue: 2285,
      conversionRate: 14.2,
      repeatCustomers: 34.2
    },
    byProduct: [
      { category: 'Wine Tours', bookings: 456, revenue: 1284750, avgValue: 2817 },
      { category: 'Adventure', bookings: 342, revenue: 987200, avgValue: 2887 },
      { category: 'Cultural', bookings: 289, revenue: 575550, avgValue: 1991 },
      { category: 'Relax', bookings: 160, revenue: 320000, avgValue: 2000 }
    ],
    byDestination: [
      { destination: 'Mendoza', bookings: 456, revenue: 1284750, percentage: 45.1 },
      { destination: 'Patagonia', bookings: 342, revenue: 987200, percentage: 34.7 },
      { destination: 'Cusco', bookings: 289, revenue: 575550, percentage: 20.2 }
    ],
    performance: {
      topSalesperson: { name: 'María González', sales: 342, revenue: 987200 },
      topPackage: { name: 'Mendoza Wine Tour Premium', bookings: 127, revenue: 317500 },
      bestMonth: { month: 'Mayo', bookings: 156, revenue: 310000 }
    }
  },
  agencies: {
    summary: {
      totalAgencies: 23,
      activeAgencies: 21,
      totalCommissionsPaid: 284750,
      avgCommissionRate: 11.5
    },
    performance: [
      { 
        agency: 'Patagonia Travel', 
        level: 'Platinum',
        bookings: 234, 
        revenue: 567000, 
        commission: 85050,
        growth: 15.8,
        satisfaction: 4.9
      },
      { 
        agency: 'Travel Dreams Agency', 
        level: 'Gold',
        bookings: 156, 
        revenue: 378000, 
        commission: 45600,
        growth: 12.3,
        satisfaction: 4.7
      },
      { 
        agency: 'Mendoza Tours', 
        level: 'Silver',
        bookings: 98, 
        revenue: 245000, 
        commission: 24500,
        growth: 8.7,
        satisfaction: 4.5
      }
    ],
    growth: {
      newAgencies: 3,
      upgraded: 2,
      downgraded: 0,
      churned: 1
    }
  },
  operational: {
    summary: {
      totalCustomers: 1247,
      activeCustomers: 1156,
      customerSatisfaction: 4.7,
      supportTickets: 45,
      responseTime: 2.3
    },
    satisfaction: {
      excellent: 67.2,
      good: 24.8,
      average: 6.5,
      poor: 1.2,
      terrible: 0.3
    },
    support: {
      totalTickets: 45,
      resolved: 38,
      pending: 7,
      avgResponseTime: 2.3,
      avgResolutionTime: 24.5,
      categories: {
        booking: 18,
        payment: 12,
        technical: 8,
        general: 7
      }
    },
    system: {
      uptime: 99.8,
      avgLoadTime: 1.2,
      errorRate: 0.05,
      lastIncident: '2024-06-15'
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'financial';
    const period = searchParams.get('period') || 'month';
    const format = searchParams.get('format') || 'json';

    console.log('📈 GET /api/admin/reports - Generando reporte:', type);

    // Intentar backend primero
    try {
      const backendUrl = `${BACKEND_URL}/api/admin/reports?${searchParams.toString()}`;
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
        console.log('✅ Reporte obtenido del backend');
        return NextResponse.json(data);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible:', backendError.message);
    }
    
    // Fallback con datos mock
    console.log('🔄 Usando reportes mock...');

    // Obtener el tipo de reporte solicitado
    const reportData = (MOCK_REPORTS as any)[type] || MOCK_REPORTS.financial;

    // Si se solicita formato de exportación, simular descarga
    if (format !== 'json') {
      return NextResponse.json({
        success: true,
        message: `Reporte ${type} exportado en formato ${format} (simulado)`,
        downloadUrl: `/api/admin/reports/download/${type}-${Date.now()}.${format}`,
        format,
        type,
        timestamp: new Date().toISOString(),
        source: 'mock'
      });
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      type,
      period,
      timestamp: new Date().toISOString(),
      source: 'mock-fallback',
      message: 'Reporte de prueba - Backend no disponible'
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/reports:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      data: MOCK_REPORTS.financial
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, period, filters, format } = body;

    console.log('📈 POST /api/admin/reports - Generando reporte personalizado:', type);

    // Simular generación de reporte personalizado
    const customReport = {
      id: Date.now(),
      type,
      period,
      filters,
      format: format || 'json',
      status: 'completed',
      createdAt: new Date().toISOString(),
      downloadUrl: format !== 'json' ? `/api/admin/reports/download/custom-${Date.now()}.${format}` : null,
      data: (MOCK_REPORTS as any)[type] || MOCK_REPORTS.financial
    };

    return NextResponse.json({
      success: true,
      data: customReport,
      message: 'Reporte personalizado generado exitosamente (simulado)',
      source: 'mock'
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al generar reporte',
      details: error.message
    }, { status: 500 });
  }
}
