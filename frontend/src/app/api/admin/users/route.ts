import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Datos mock robustos para desarrollo
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@intertravel.com',
    firstName: 'Diego',
    lastName: 'Administrador',
    role: 'super_admin',
    roleName: 'Super Administrador',
    roleColor: '#dc2626',
    agency: 'InterTravel',
    department: 'Sistemas',
    position: 'Administrador de Sistema',
    isActive: true,
    isVerified: true,
    createdAt: new Date('2024-01-01').toISOString(),
    lastLogin: new Date().toISOString(),
    phone: '+54 9 261 555-0001',
    avatar: null,
    permissions: ['all']
  },
  {
    id: 2,
    username: 'maria.gonzalez',
    email: 'maria@travelagency.com',
    firstName: 'María',
    lastName: 'González',
    phone: '+54 9 234-5678',
    role: 'agency',
    roleName: 'Agencia',
    roleColor: '#ea580c',
    agency: 'Travel Dreams Agency',
    department: 'Ventas',
    position: 'Agente de Viajes',
    isActive: true,
    isVerified: true,
    createdAt: new Date('2024-03-15').toISOString(),
    lastLogin: new Date('2024-07-01').toISOString(),
    avatar: null,
    permissions: ['bookings', 'packages']
  },
  {
    id: 3,
    username: 'carlos.mendoza',
    email: 'carlos@example.com',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    phone: '+54 9 261 555-0123',
    role: 'client',
    roleName: 'Cliente',
    roleColor: '#059669',
    agency: null,
    department: null,
    position: 'Cliente Premium',
    isActive: true,
    isVerified: true,
    createdAt: new Date('2024-02-20').toISOString(),
    lastLogin: new Date('2024-06-15').toISOString(),
    avatar: null,
    permissions: ['bookings']
  },
  {
    id: 4,
    username: 'ana.silva',
    email: 'ana@example.com',
    firstName: 'Ana',
    lastName: 'Silva',
    phone: '+55 21 99999-8888',
    role: 'client',
    roleName: 'Cliente',
    roleColor: '#059669',
    agency: null,
    department: null,
    position: 'Cliente',
    isActive: false,
    isVerified: false,
    createdAt: new Date('2024-05-10').toISOString(),
    lastLogin: null,
    avatar: null,
    permissions: []
  }
];

// GET /api/admin/users - Obtener lista de usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    console.log('📋 GET /api/admin/users - Obteniendo usuarios...');

    // Intentar backend primero
    try {
      const backendUrl = `${BACKEND_URL}/api/admin/users?${searchParams.toString()}`;
      console.log('🔗 Probando backend:', backendUrl);
      
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
        console.log('✅ Datos obtenidos del backend');
        return NextResponse.json(data);
      } else {
        console.log('❌ Backend error:', response.status);
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible:', backendError.message);
    }
    
    // Fallback con datos mock
    console.log('🔄 Usando datos mock...');
    let filteredUsers = [...MOCK_USERS];
    
    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.agency?.toLowerCase().includes(searchLower)
      );
    }
    
    if (role && role !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        filteredUsers = filteredUsers.filter(user => user.isActive);
      } else if (status === 'inactive') {
        filteredUsers = filteredUsers.filter(user => !user.isActive);
      }
    }

    // Paginación
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    const response = {
      success: true,
      data: paginatedUsers,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      source: 'mock-fallback',
      message: 'Datos de prueba - Backend no disponible'
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/users:', error);
    
    // Respuesta de error con formato JSON válido
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message,
      data: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0
    }, { status: 500 });
  }
}

// POST /api/admin/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('👤 POST /api/admin/users - Creando usuario:', body.username);

    // Intentar backend primero
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Usuario creado en backend');
        return NextResponse.json(data, { status: 201 });
      } else {
        throw new Error(`Backend error: ${response.status}`);
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible, simulando creación');
    }
    
    // Simular creación exitosa
    const newUser = {
      id: Date.now(),
      username: body.username,
      email: body.email,
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      phone: body.phone || '',
      role: body.role || 'client',
      roleName: getRoleName(body.role),
      roleColor: getRoleColor(body.role),
      agency: body.agency || null,
      department: body.department || null,
      position: body.position || null,
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      avatar: null,
      permissions: getDefaultPermissions(body.role)
    };

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'Usuario creado exitosamente (simulado)',
      source: 'mock'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error en POST /api/admin/users:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error al crear usuario',
      details: error.message
    }, { status: 500 });
  }
}

// Funciones auxiliares
function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador',
    'manager': 'Gerente',
    'agency': 'Agencia',
    'operator': 'Operador',
    'client': 'Cliente'
  };
  return roleNames[role] || 'Usuario';
}

function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    'super_admin': '#dc2626',
    'admin': '#ea580c',
    'manager': '#d97706',
    'agency': '#0891b2',
    'operator': '#059669',
    'client': '#4f46e5'
  };
  return roleColors[role] || '#6b7280';
}

function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    'super_admin': ['all'],
    'admin': ['users', 'bookings', 'packages', 'agencies', 'settings'],
    'manager': ['bookings', 'packages', 'reports'],
    'agency': ['bookings', 'packages'],
    'operator': ['bookings'],
    'client': ['bookings']
  };
  return permissions[role] || [];
}
