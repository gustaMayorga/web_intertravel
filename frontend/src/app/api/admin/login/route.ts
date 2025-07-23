import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Credenciales válidas para desarrollo
const VALID_CREDENTIALS = {
  'admin': { 
    password: 'admin123', 
    role: 'super_admin', 
    name: 'Administrador Principal',
    email: 'admin@intertravel.com'
  },
  'intertravel': { 
    password: 'travel2024', 
    role: 'admin', 
    name: 'InterTravel Admin',
    email: 'intertravel@intertravel.com'
  },
  'supervisor': { 
    password: 'super2024', 
    role: 'supervisor', 
    name: 'Supervisor',
    email: 'supervisor@intertravel.com'
  }
};

// POST /api/admin/login - Autenticación de administradores
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    console.log('🔐 POST /api/admin/login - Intento de login:', username);

    // Validar que se proporcionen credenciales
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      }, { status: 400 });
    }

    // Intentar autenticación con backend primero
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Login exitoso con backend');
        return NextResponse.json(data);
      } else {
        console.log('❌ Backend login falló, intentando credenciales locales');
      }
    } catch (backendError: any) {
      console.log('⚠️ Backend no disponible, usando credenciales locales');
    }

    // Fallback: verificar credenciales locales
    const userCredentials = VALID_CREDENTIALS[username as keyof typeof VALID_CREDENTIALS];
    
    if (!userCredentials || userCredentials.password !== password) {
      console.log('❌ Credenciales inválidas:', username);
      return NextResponse.json({
        success: false,
        error: 'Usuario o contraseña incorrectos'
      }, { status: 401 });
    }

    // Login exitoso - crear respuesta
    console.log('✅ Login exitoso con credenciales locales:', username);
    
    const userData = {
      id: 1,
      username: username,
      name: userCredentials.name,
      email: userCredentials.email,
      role: userCredentials.role,
      permissions: userCredentials.role === 'super_admin' ? ['all'] : ['read', 'write'],
      loginTime: new Date().toISOString()
    };

    // Generar token simple para desarrollo
    const token = `admin_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      token: token,
      user: userData,
      expiresIn: 86400, // 24 horas
      source: 'local-credentials'
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/admin/login:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

// GET /api/admin/login - Verificar estado de login actual
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/login - Verificando estado de auth');
    
    const authHeader = request.headers.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: 'No token provided'
      });
    }

    // Verificar token (en desarrollo, cualquier token válido es aceptado)
    if (token.startsWith('admin_token_')) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        message: 'Token válido',
        user: {
          username: 'admin',
          role: 'super_admin',
          name: 'Administrador'
        }
      });
    }

    return NextResponse.json({
      success: false,
      authenticated: false,
      message: 'Token inválido'
    }, { status: 401 });

  } catch (error: any) {
    console.error('❌ Error en GET /api/admin/login:', error);
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Error verificando autenticación'
    }, { status: 500 });
  }
}
