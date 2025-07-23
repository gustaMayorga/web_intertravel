// =============================================
// RUTAS MOCK ADMIN USERS - SIN AUTENTICACIÓN
// =============================================
// Rutas de usuarios que siempre funcionan con datos mock

const express = require('express');
const router = express.Router();

// Datos mock de usuarios
const MOCK_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@intertravel.com',
    firstName: 'Diego',
    lastName: 'Administrador',
    phone: '+54 9 261 555-0001',
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
  },
  {
    id: 5,
    username: 'manager.test',
    email: 'manager@intertravel.com',
    firstName: 'Juan',
    lastName: 'Manager',
    phone: '+54 9 261 555-0100',
    role: 'manager',
    roleName: 'Gerente',
    roleColor: '#d97706',
    agency: 'InterTravel',
    department: 'Operaciones',
    position: 'Gerente de Operaciones',
    isActive: true,
    isVerified: true,
    createdAt: new Date('2024-02-01').toISOString(),
    lastLogin: new Date('2024-06-28').toISOString(),
    avatar: null,
    permissions: ['bookings', 'packages', 'reports']
  }
];

// Estadísticas mock
const MOCK_STATS = {
  total: 1247,
  active: 1156,
  inactive: 91,
  verified: 1100,
  pending: 147,
  roles: {
    super_admin: 2,
    admin: 8,
    manager: 15,
    agency: 23,
    operator: 45,
    client: 1154
  },
  agencies: 23,
  newToday: 3,
  newThisWeek: 18,
  newThisMonth: 67,
  lastLogin: {
    today: 324,
    thisWeek: 892,
    thisMonth: 1098
  },
  growth: {
    daily: 2.5,
    weekly: 8.3,
    monthly: 12.1
  },
  topAgencies: [
    { name: 'Travel Dreams Agency', users: 156 },
    { name: 'Mendoza Tours', users: 98 },
    { name: 'Patagonia Travel', users: 87 },
    { name: 'Andes Adventures', users: 76 },
    { name: 'Wine & Travel', users: 65 }
  ],
  byLocation: {
    'Argentina': 890,
    'Chile': 187,
    'Uruguay': 98,
    'Brasil': 72
  },
  deviceStats: {
    desktop: 756,
    mobile: 412,
    tablet: 79
  }
};

// Logging simplificado
function logRequest(req, endpoint) {
  console.log(`📋 MOCK ${req.method} ${endpoint} - Sin autenticación`);
}

// ================================
// RUTAS DE USUARIOS (MOCK)
// ================================

// GET /api/admin/users - Obtener lista de usuarios
router.get('/users', (req, res) => {
  try {
    logRequest(req, '/api/admin/users');
    
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      role = '', 
      status = '' 
    } = req.query;

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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limitNum);
    const offset = (pageNum - 1) * limitNum;
    const paginatedUsers = filteredUsers.slice(offset, offset + limitNum);

    console.log(`✅ Enviando ${paginatedUsers.length} usuarios (${total} total)`);

    res.json({
      success: true,
      data: paginatedUsers,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      source: 'mock-backend',
      message: 'Datos de usuarios mock - Backend funcionando'
    });

  } catch (error) {
    console.error('❌ Error en mock users:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor mock',
      details: error.message
    });
  }
});

// GET /api/admin/users/stats - Obtener estadísticas de usuarios
router.get('/users/stats', (req, res) => {
  try {
    logRequest(req, '/api/admin/users/stats');

    console.log('✅ Enviando estadísticas mock de usuarios');

    res.json({
      success: true,
      data: MOCK_STATS,
      source: 'mock-backend',
      message: 'Estadísticas mock - Backend funcionando',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en mock stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor mock',
      details: error.message
    });
  }
});

// GET /api/admin/users/:id - Obtener usuario por ID
router.get('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    logRequest(req, `/api/admin/users/${id}`);

    const user = MOCK_USERS.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        id: id
      });
    }

    console.log(`✅ Enviando usuario: ${user.username}`);

    res.json({
      success: true,
      user: user,
      source: 'mock-backend'
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario mock:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor mock'
    });
  }
});

// POST /api/admin/users - Crear usuario
router.post('/users', (req, res) => {
  try {
    logRequest(req, '/api/admin/users [CREATE]');
    const userData = req.body;

    const newUser = {
      id: Date.now(),
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      phone: userData.phone || '',
      role: userData.role || 'client',
      roleName: getRoleName(userData.role),
      roleColor: getRoleColor(userData.role),
      agency: userData.agency || null,
      department: userData.department || null,
      position: userData.position || null,
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      avatar: null,
      permissions: getDefaultPermissions(userData.role)
    };

    console.log(`✅ Usuario mock creado: ${newUser.username}`);

    res.status(201).json({
      success: true,
      user: newUser,
      message: 'Usuario creado exitosamente (mock)',
      source: 'mock-backend'
    });

  } catch (error) {
    console.error('❌ Error creando usuario mock:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor mock'
    });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    logRequest(req, `/api/admin/users/${id} [UPDATE]`);

    const user = MOCK_USERS.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Simular actualización
    const updatedUser = { ...user, ...req.body, id: parseInt(id) };

    console.log(`✅ Usuario mock actualizado: ${updatedUser.username}`);

    res.json({
      success: true,
      user: updatedUser,
      message: 'Usuario actualizado exitosamente (mock)',
      source: 'mock-backend'
    });

  } catch (error) {
    console.error('❌ Error actualizando usuario mock:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor mock'
    });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    logRequest(req, `/api/admin/users/${id} [DELETE]`);

    const user = MOCK_USERS.find(u => u.id === parseInt(id));
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    console.log(`✅ Usuario mock eliminado: ${user.username}`);

    res.json({
      success: true,
      message: `Usuario ${user.username} eliminado exitosamente (mock)`,
      source: 'mock-backend'
    });

  } catch (error) {
    console.error('❌ Error eliminando usuario mock:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor mock'
    });
  }
});

// ================================
// FUNCIONES AUXILIARES
// ================================

function getRoleName(role) {
  const roleNames = {
    'super_admin': 'Super Administrador',
    'admin': 'Administrador',
    'manager': 'Gerente',
    'agency': 'Agencia',
    'operator': 'Operador',
    'client': 'Cliente'
  };
  return roleNames[role] || 'Usuario';
}

function getRoleColor(role) {
  const roleColors = {
    'super_admin': '#dc2626',
    'admin': '#ea580c',
    'manager': '#d97706',
    'agency': '#0891b2',
    'operator': '#059669',
    'client': '#4f46e5'
  };
  return roleColors[role] || '#6b7280';
}

function getDefaultPermissions(role) {
  const permissions = {
    'super_admin': ['all'],
    'admin': ['users', 'bookings', 'packages', 'agencies', 'settings'],
    'manager': ['bookings', 'packages', 'reports'],
    'agency': ['bookings', 'packages'],
    'operator': ['bookings'],
    'client': ['bookings']
  };
  return permissions[role] || [];
}

module.exports = router;
