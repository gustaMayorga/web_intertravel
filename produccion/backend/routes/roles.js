// Rutas para manejo de roles - Backend
const express = require('express');
const router = express.Router();

// Middleware de autenticación
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const user = req.app.locals.activeTokens?.get(token);
  
  if (!user || Date.now() > user.expiresAt) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }
  
  req.user = user;
  next();
}

// Roles predefinidos
const systemRoles = [
  {
    id: 1,
    name: 'super_admin',
    displayName: 'Super Administrador',
    description: 'Acceso completo al sistema',
    level: 1,
    color: '#DC2626',
    isActive: true,
    permissions: ['*']
  },
  {
    id: 2,
    name: 'admin_agencia',
    displayName: 'Admin Agencia',
    description: 'Administrador de agencia',
    level: 2,
    color: '#2563EB',
    isActive: true,
    permissions: ['dashboard:view', 'packages:view', 'bookings:view', 'users:view']
  },
  {
    id: 3,
    name: 'operador',
    displayName: 'Operador',
    description: 'Operaciones diarias',
    level: 3,
    color: '#059669',
    isActive: true,
    permissions: ['dashboard:view', 'packages:view', 'bookings:create']
  },
  {
    id: 4,
    name: 'analista',
    displayName: 'Analista',
    description: 'Análisis y reportes',
    level: 4,
    color: '#7C3AED',
    isActive: true,
    permissions: ['dashboard:view', 'analytics:view', 'reports:view']
  },
  {
    id: 5,
    name: 'contador',
    displayName: 'Contador',
    description: 'Gestión contable',
    level: 5,
    color: '#EA580C',
    isActive: true,
    permissions: ['dashboard:view', 'accounting:view', 'invoices:manage']
  }
];

// GET /api/admin/roles - Obtener todos los roles
router.get('/roles', requireAuth, async (req, res) => {
  try {
    console.log(`📋 ${req.user.username} solicitando roles del sistema`);
    
    res.json({
      success: true,
      roles: systemRoles,
      total: systemRoles.length,
      message: 'Roles obtenidos exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/users/stats - Estadísticas de usuarios
router.get('/users/stats', requireAuth, async (req, res) => {
  try {
    const stats = {
      total: 12,
      active: 10,
      inactive: 2,
      byRole: {
        super_admin: 2,
        admin_agencia: 3,
        operador: 4,
        analista: 2,
        contador: 1
      },
      recentlyCreated: 3,
      lastLogin24h: 8
    };
    
    res.json({
      success: true,
      stats: stats,
      message: 'Estadísticas obtenidas exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/users - Obtener usuarios (mock)
router.get('/users', requireAuth, async (req, res) => {
  try {
    const mockUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@intertravel.com',
        firstName: 'Administrador',
        lastName: 'Principal',
        role: 'super_admin',
        roleName: 'Super Administrador',
        roleColor: '#DC2626',
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-15T10:00:00Z',
        lastLogin: '2025-01-02T08:30:00Z',
        department: 'Sistemas'
      },
      {
        id: 2,
        username: 'agencia_admin',
        email: 'agencia@intertravel.com',
        firstName: 'Admin',
        lastName: 'Agencia',
        role: 'admin_agencia',
        roleName: 'Admin Agencia',
        roleColor: '#2563EB',
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-20T14:00:00Z',
        lastLogin: '2025-01-01T16:45:00Z',
        department: 'Ventas'
      },
      {
        id: 3,
        username: 'maria.gonzalez',
        email: 'maria@intertravel.com',
        firstName: 'María',
        lastName: 'González',
        phone: '+54 261 123-4567',
        role: 'operador',
        roleName: 'Operador',
        roleColor: '#059669',
        isActive: true,
        isVerified: true,
        createdAt: '2024-02-01T09:00:00Z',
        lastLogin: '2024-12-30T11:20:00Z',
        department: 'Operaciones'
      },
      {
        id: 4,
        username: 'carlos.rodriguez',
        email: 'carlos@intertravel.com',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        phone: '+54 261 987-6543',
        role: 'analista',
        roleName: 'Analista',
        roleColor: '#7C3AED',
        isActive: true,
        isVerified: false,
        createdAt: '2024-03-15T11:30:00Z',
        department: 'Analytics'
      },
      {
        id: 5,
        username: 'ana.martinez',
        email: 'ana@intertravel.com',
        firstName: 'Ana',
        lastName: 'Martínez',
        role: 'contador',
        roleName: 'Contador',
        roleColor: '#EA580C',
        isActive: false,
        isVerified: true,
        createdAt: '2024-04-10T13:15:00Z',
        lastLogin: '2024-12-15T09:45:00Z',
        department: 'Contabilidad'
      }
    ];
    
    console.log(`👥 ${req.user.username} solicitando lista de usuarios`);
    
    res.json({
      success: true,
      users: mockUsers,
      total: mockUsers.length,
      message: 'Usuarios obtenidos exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/users - Crear usuario
router.post('/users', requireAuth, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, roleId, department, isActive } = req.body;
    
    if (!username || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: username, email, password, roleId'
      });
    }
    
    const role = systemRoles.find(r => r.id === parseInt(roleId));
    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Rol no válido'
      });
    }
    
    const newUser = {
      id: Date.now(),
      username,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      role: role.name,
      roleName: role.displayName,
      roleColor: role.color,
      department: department || '',
      isActive: isActive !== undefined ? isActive : true,
      isVerified: false,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    console.log(`✅ Usuario creado: ${username} (${role.displayName}) por ${req.user.username}`);
    
    res.status(201).json({
      success: true,
      user: newUser,
      message: 'Usuario creado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === 1) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el usuario administrador principal'
      });
    }
    
    console.log(`🗑️ Usuario ${userId} eliminado por ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;