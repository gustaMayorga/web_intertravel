import { NextRequest, NextResponse } from 'next/server';

// Función para verificar autenticación
function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  return authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
}

// Mock data storage (en producción esto iría a la base de datos)
let mockKeywords = [
  { id: 1, keyword: 'charter', priority: 1, category: 'transport', active: true, description: 'Vuelos charter prioritarios' },
  { id: 2, keyword: 'perú', priority: 2, category: 'destination', active: true, description: 'Destino Perú prioritario' },
  { id: 3, keyword: 'MSC', priority: 3, category: 'cruise', active: true, description: 'Cruceros MSC prioritarios' },
  { id: 4, keyword: 'intertravel', priority: 1, category: 'agency', active: true, description: 'Paquetes InterTravel' },
  { id: 5, keyword: 'enzo.vingoli', priority: 1, category: 'agency', active: true, description: 'Paquetes enzo.vingoli' },
  { id: 6, keyword: 'premium', priority: 4, category: 'category', active: true, description: 'Paquetes premium' },
  { id: 7, keyword: 'luxury', priority: 5, category: 'category', active: true, description: 'Paquetes de lujo' },
  { id: 8, keyword: 'wine', priority: 6, category: 'experience', active: true, description: 'Tours de vino' },
  { id: 9, keyword: 'mendoza', priority: 3, category: 'destination', active: true, description: 'Destino Mendoza' },
  { id: 10, keyword: 'patagonia', priority: 4, category: 'destination', active: true, description: 'Destino Patagonia' }
];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request);
    console.log('PUT priority-keywords - Token:', token ? '✅ Present' : '❌ Missing');
    
    const id = parseInt(params.id);
    const updates = await request.json();

    // Intentar actualizar en el backend primero
    try {
      const backendResponse = await fetch(`http://localhost:3002/api/admin/priority-keywords/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || process.env.ADMIN_TOKEN || 'demo-token'}`
        },
        body: JSON.stringify(updates)
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback');
    }

    // Fallback: actualizar en mock data
    const keywordIndex = mockKeywords.findIndex(k => k.id === id);
    
    if (keywordIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Palabra clave no encontrada'
      }, { status: 404 });
    }

    // Aplicar actualizaciones
    const updatedKeyword = { ...mockKeywords[keywordIndex], ...updates };
    mockKeywords[keywordIndex] = updatedKeyword;

    console.log(`✏️ Palabra clave actualizada: ID ${id} - ${updatedKeyword.keyword}`);

    return NextResponse.json({
      success: true,
      keyword: updatedKeyword,
      message: 'Palabra clave actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error updating keyword:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(request);
    console.log('DELETE priority-keywords - Token:', token ? '✅ Present' : '❌ Missing');
    
    const id = parseInt(params.id);

    // Intentar eliminar en el backend primero
    try {
      const backendResponse = await fetch(`http://localhost:3002/api/admin/priority-keywords/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || process.env.ADMIN_TOKEN || 'demo-token'}`
        }
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback');
    }

    // Fallback: eliminar de mock data
    const keywordIndex = mockKeywords.findIndex(k => k.id === id);
    
    if (keywordIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Palabra clave no encontrada'
      }, { status: 404 });
    }

    const deletedKeyword = mockKeywords[keywordIndex];
    mockKeywords.splice(keywordIndex, 1);

    console.log(`🗑️ Palabra clave eliminada: ID ${id} - ${deletedKeyword.keyword}`);

    return NextResponse.json({
      success: true,
      message: 'Palabra clave eliminada exitosamente',
      deleted: deletedKeyword
    });

  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}