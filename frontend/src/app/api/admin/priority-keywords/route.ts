import { NextRequest, NextResponse } from 'next/server';

// Función para verificar autenticación
function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  return authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
}

// Mock data for priority keywords
const mockKeywords = [
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

let keywords = [...mockKeywords];

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    console.log('GET priority-keywords - Token:', token ? '✅ Present' : '❌ Missing');
    
    // Try to fetch from backend first
    try {
      const response = await fetch('http://localhost:3002/api/admin/priority-keywords', {
        headers: {
          'Authorization': `Bearer ${token || process.env.ADMIN_TOKEN || 'demo-token'}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback data');
    }

    // Fallback to mock data
    const categories = [...new Set(keywords.map(k => k.category))];
    
    return NextResponse.json({
      success: true,
      keywords: keywords.sort((a, b) => a.priority - b.priority),
      total: keywords.length,
      categories: categories
    });
  } catch (error) {
    console.error('Error in priority-keywords API:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    console.log('POST priority-keywords - Token:', token ? '✅ Present' : '❌ Missing');
    
    const { keyword, priority, category, description } = await request.json();

    if (!keyword || !priority) {
      return NextResponse.json({
        success: false,
        error: 'Palabra clave y prioridad son requeridos'
      }, { status: 400 });
    }

    // Try to post to backend first
    try {
      const response = await fetch('http://localhost:3002/api/admin/priority-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || process.env.ADMIN_TOKEN || 'demo-token'}`
        },
        body: JSON.stringify({ keyword, priority, category, description })
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback');
    }

    // Fallback: add to mock data
    const newKeyword = {
      id: Math.max(...keywords.map(k => k.id), 0) + 1,
      keyword: keyword.toLowerCase().trim(),
      priority: parseInt(priority),
      category: category || 'general',
      description: description || '',
      active: true,
      created_at: new Date().toISOString()
    };

    keywords.push(newKeyword);

    return NextResponse.json({
      success: true,
      keyword: newKeyword,
      message: 'Palabra clave agregada exitosamente'
    });
  } catch (error) {
    console.error('Error adding keyword:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}