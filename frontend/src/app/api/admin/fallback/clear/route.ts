import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// DELETE /api/admin/fallback/clear - Limpiar datos de fallback
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const response = await fetch(`${BACKEND_URL}/api/admin/fallback/clear?type=${type}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error clearing fallback data:', error);
    return NextResponse.json(
      { error: 'Error al limpiar datos de fallback', details: error.message },
      { status: 500 }
    );
  }
}
