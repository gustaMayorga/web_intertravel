// =====================================================
// RUTAS DE GESTIÓN DE USUARIOS Y MÓDULOS - INTERTRAVEL
// Versión: 1.0
// =====================================================

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Simulación de conexión a base de datos
// En producción, usar el dbManager real
let dbManager = null;
let dbConnected = false;

// Intentar conectar a la base de datos
try {
  const database = require('../database.js');
  dbManager = database.dbManager;
  dbConnected = database.isConnected;
} catch (error) {
  console.warn('⚠️ Base de datos no disponible, usando datos mock:', error.message);
}

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN Y PERMISOS
// =====================================================

// Middleware para verificar autenticación
function requireAuth(req, res, next) {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }
  
  // En producción, validar el token con la base de datos
  // Por ahora usar el sistema simple existente
  const activeTokens = req.app.locals.activeTokens || new Map();
  const user = activeTokens.get(token);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
  
  req.user = user;
  next();
}

// Middleware para verificar permisos de módulo
function requireModulePermission(moduleName, permission = 'view') {
  return async (req, res, next) => {
    try {
      const userId = req.user.id || req.user.username; // Compatibilidad temporal
      
      if (dbConnected && dbManager) {
        // Verificar permisos en base de datos
        const result = await dbManager.query(`
          SELECT check_user_permission($1, $2, $3) as has_permission
        `, [userId, moduleName, permission]);
        
        if (!result.rows[0]?.has_permission) {
          return res.status(403).json({
            success: false,
            error: `Acceso denegado al módulo ${moduleName}`,
            requiredPermission: permission
          });
        }
      } else {
        // Fallback: verificar rol simple
        if (req.user.role !== 'super_admin' && moduleName === 'users') {
          return res.status(403).json({
            success: false,
            error: 'Solo super administradores pueden gestionar usuarios'
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno verificando permisos'
      });
    }
  };
}

// =====================================================
// FUNCIONES AUXILIARES PARA DATOS MOCK
// =====================================================

function generateMockUsers() {
  return [
    {
      id: 1,
      username: 'admin',
      email: 'admin@intertravel.com.ar',
      firstName: 'Administrador',
      lastName: 'Principal',
      role: 'super_admin',
      roleName: 'Super Administrador',
      agency: 'InterTravel',
      department: 'Administración',
      isActive: true,
      isVerified: true,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      modules: ['dashboard', 'packages', 'users', 'analytics', 'settings']
    },
    {
      id: 2,
      username: 'agencia_admin',
      email: 'agencia@intertravel.com.ar',
      firstName: 'María',
      lastName: 'González',
      role: 'admin_agencia',
      roleName: 'Administrador de Agencia',
      agency: 'InterTravel',
      department: 'Operaciones',
      isActive: true,
      isVerified: true,
      lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      createdAt: '2024-02-15T00:00:00Z',
      modules: ['dashboard', 'packages', 'bookings', 'crm', 'reports']
    },
    {
      id: 3,
      username: 'operador1',
      email: 'operador@intertravel.com.ar',
      firstName: 'Carlos',
      lastName: 'López',
      role: 'operador',
      roleName: 'Operador',
      agency: 'InterTravel',
      department: 'Ventas',
      isActive: true,
      isVerified: true,
      lastLogin: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      createdAt: '2024-03-01T00:00:00Z',
      modules: ['dashboard', 'packages', 'bookings', 'crm']
    },
    {
      id: 4,
      username: 'analista1',
      email: 'analista@intertravel.com.ar',
      firstName: 'Ana',
      lastName: 'Martínez',
      role: 'analista',
      roleName: 'Analista',
      agency: 'InterTravel',
      department: 'Analytics',
      isActive: true,
      isVerified: true,
      lastLogin: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      createdAt: '2024-04-01T00:00:00Z',
      modules: ['dashboard', 'analytics', 'reports']
    },
    {
      id: 5,
      username: 'contador1',
      email: 'contador@intertravel.com.ar',
      firstName: 'Luis',
      lastName: 'Rodríguez',
      role: 'contador',
      roleName: 'Contador',
      agency: 'InterTravel',
      department: 'Finanzas',
      isActive: false,
      isVerified: true,
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: '2024-05-01T00:00:00Z',
      modules: ['dashboard', 'accounting', 'payments']
    }
  ];
}

function generateMockModules() {
  return [
    {
      id: 1,
      name: 'dashboard',
      displayName: 'Dashboard Principal',
      description: 'Panel principal con métricas y resumen',
      icon: 'LayoutDashboard',
      route: '/admin/dashboard',
      category: 'core',
      isActive: true,
      isCore: true,
      sortOrder: 1,
      permissions: ['view']
    },
    {
      id: 2,
      name: 'packages',
      displayName: 'Gestión de Paquetes',
      description: 'Crear, editar y gestionar paquetes turísticos',
      icon: 'Package',
      route: '/admin/packages',
      category: 'business',
      isActive: true,
      isCore: false,
      sortOrder: 10,
      permissions: ['view', 'create', 'edit', 'delete', 'export']
    },
    {
      id: 3,
      name: 'bookings',
      displayName: 'Reservas',
      description: 'Gestionar todas las reservas y cotizaciones',
      icon: 'Calendar',
      route: '/admin/bookings',
      category: 'business',
      isActive: true,
      isCore: false,
      sortOrder: 12,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      id: 4,
      name: 'users',
      displayName: 'Gestión de Usuarios',
      description: 'Crear y gestionar usuarios del sistema',
      icon: 'UserCog',
      route: '/admin/users',
      category: 'admin',
      isActive: true,
      isCore: false,
      sortOrder: 40,
      permissions: ['view', 'create', 'edit', 'delete', 'manage']
    },
    {
      id: 5,
      name: 'analytics',
      displayName: 'Analytics BI',
      description: 'Business Intelligence y análisis avanzado',
      icon: 'BarChart3',
      route: '/admin/analytics',
      category: 'analytics',
      isActive: true,
      isCore: false,
      sortOrder: 20,
      permissions: ['view', 'advanced', 'export']
    },
    {
      id: 6,
      name: 'crm',
      displayName: 'CRM',
      description: 'Gestión de clientes, leads y pipeline de ventas',
      icon: 'Building',
      route: '/admin/crm',
      category: 'business',
      isActive: true,
      isCore: false,
      sortOrder: 13,
      permissions: ['view', 'create', 'edit', 'delete']
    },
    {
      id: 7,
      name: 'reports',
      displayName: 'Reportes',
      description: 'Generación y gestión de reportes',
      icon: 'FileText',
      route: '/admin/reports',
      category: 'analytics',
      isActive: true,
      isCore: false,
      sortOrder: 21,
      permissions: ['view', 'create', 'export']
    },
    {
      id: 8,
      name: 'accounting',
      displayName: 'Contabilidad',
      description: 'Gestión contable y financiera',
      icon: 'DollarSign',
      route: '/admin/accounting',
      category: 'financial',
      isActive: true,
      isCore: false,
      sortOrder: 30,
      permissions: ['view', 'create', 'edit']
    },
    {
      id: 9,
      name: 'settings',
      displayName: 'Configuración',
      description: 'Configuración general del sistema',
      icon: 'Settings',
      route: '/admin/settings',
      category: 'settings',
      isActive: true,
      isCore: false,
      sortOrder: 50,
      permissions: ['view', 'edit']
    }
  ];
}

function generateMockRoles() {
  return [
    {
      id: 1,
      name: 'super_admin',
      displayName: 'Super Administrador',
      description: 'Acceso completo al sistema, gestión de usuarios y módulos',
      level: 1,
      color: '#DC2626',
      isActive: true
    },
    {
      id: 2,
      name: 'admin_agencia',
      displayName: 'Administrador de Agencia',
      description: 'Gestión operativa completa de la agencia',
      level: 2,
      color: '#2563EB',
      isActive: true
    },
    {
      id: 3,
      name: 'operador',
      displayName: 'Operador',
      description: 'Operaciones diarias: reservas, clientes, paquetes básicos',
      level: 3,
      color: '#059669',
      isActive: true
    },
    {
      id: 4,
      name: 'analista',
      displayName: 'Analista',
      description: 'Acceso a analytics, reportes y métricas',
      level: 4,
      color: '#7C3AED',
      isActive: true
    },
    {
      id: 5,
      name: 'contador',
      displayName: 'Contador',
      description: 'Gestión contable y financiera',
      level: 4,
      color: '#EA580C',
      isActive: true
    }
  ];
}

// =====================================================
// RUTAS DE GESTIÓN DE USUARIOS
// =====================================================

// Obtener lista de usuarios
router.get('/users', requireAuth, requireModulePermission('users', 'view'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log(`👥 ${req.user.username} solicitando lista de usuarios`);

    if (dbConnected && dbManager) {
      // Implementación con base de datos real
      let query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.avatar_url,
          u.agency,
          u.department,
          u.position,
          u.is_active,
          u.is_verified,
          u.last_login,
          u.created_at,
          r.name as role,
          r.display_name as role_name,
          r.color as role_color
        FROM users_extended u
        LEFT JOIN user_roles r ON u.role_id = r.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        query += ` AND (u.username ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (role) {
        paramCount++;
        query += ` AND r.name = $${paramCount}`;
        params.push(role);
      }

      if (status === 'active') {
        query += ` AND u.is_active = true`;
      } else if (status === 'inactive') {
        query += ` AND u.is_active = false`;
      }

      // Ordenamiento y paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` ORDER BY u.${sortBy} ${sortOrder.toUpperCase()} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(parseInt(limit), offset);

      const result = await dbManager.query(query, params);
      
      // Contar total para paginación
      const countQuery = `SELECT COUNT(*) FROM users_extended u LEFT JOIN user_roles r ON u.role_id = r.id WHERE 1=1`;
      const countResult = await dbManager.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        success: true,
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        source: 'database'
      });

    } else {
      // Fallback con datos mock
      let users = generateMockUsers();

      // Aplicar filtros
      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(u => 
          u.username.toLowerCase().includes(searchLower) ||
          u.firstName.toLowerCase().includes(searchLower) ||
          u.lastName.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
        );
      }

      if (role) {
        users = users.filter(u => u.role === role);
      }

      if (status === 'active') {
        users = users.filter(u => u.isActive);
      } else if (status === 'inactive') {
        users = users.filter(u => !u.isActive);
      }

      // Paginación simple
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedUsers = users.slice(startIndex, startIndex + parseInt(limit));

      console.log(`✅ Enviando ${paginatedUsers.length} usuarios (mock)`);

      res.json({
        success: true,
        users: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length,
          totalPages: Math.ceil(users.length / parseInt(limit))
        },
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener usuario específico
router.get('/users/:id', requireAuth, requireModulePermission('users', 'view'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 ${req.user.username} solicitando usuario ${id}`);

    if (dbConnected && dbManager) {
      const result = await dbManager.query(`
        SELECT 
          u.*,
          r.name as role,
          r.display_name as role_name,
          r.color as role_color,
          creator.username as created_by_username
        FROM users_extended u
        LEFT JOIN user_roles r ON u.role_id = r.id
        LEFT JOIN users_extended creator ON u.created_by = creator.id
        WHERE u.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Obtener módulos del usuario
      const modulesResult = await dbManager.query(`
        SELECT get_user_modules($1) as modules
      `, [id]);

      const user = result.rows[0];
      user.modules = modulesResult.rows[0].modules || [];

      res.json({
        success: true,
        user,
        source: 'database'
      });

    } else {
      // Datos mock
      const users = generateMockUsers();
      const user = users.find(u => u.id === parseInt(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        user,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Crear nuevo usuario
router.post('/users', requireAuth, requireModulePermission('users', 'create'), async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      roleId,
      agency,
      department,
      position,
      isActive = true
    } = req.body;

    console.log(`👤 ${req.user.username} creando usuario: ${username}`);

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email y password son requeridos'
      });
    }

    if (dbConnected && dbManager) {
      // Verificar si el usuario ya existe
      const existingUser = await dbManager.query(
        'SELECT id FROM users_extended WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Usuario o email ya existe'
        });
      }

      // Hashear password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insertar usuario
      const result = await dbManager.query(`
        INSERT INTO users_extended (
          username, email, password_hash, first_name, last_name, 
          phone, role_id, agency, department, position, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        username, email, passwordHash, firstName, lastName,
        phone, roleId, agency, department, position, isActive, req.user.id
      ]);

      const newUserId = result.rows[0].id;

      // Asignar módulos por defecto según el rol
      await assignDefaultModulesForRole(newUserId, roleId);

      console.log(`✅ Usuario ${username} creado con ID ${newUserId}`);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        userId: newUserId
      });

    } else {
      // Simulación mock
      const newUser = {
        id: Date.now(),
        username,
        email,
        firstName,
        lastName,
        phone,
        role: roleId,
        agency,
        department,
        position,
        isActive,
        createdAt: new Date().toISOString()
      };

      console.log(`✅ Usuario mock creado: ${username}`);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente (mock)',
        user: newUser,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar usuario
router.put('/users/:id', requireAuth, requireModulePermission('users', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`👤 ${req.user.username} actualizando usuario ${id}`);

    if (dbConnected && dbManager) {
      // Construir query dinámicamente
      const allowedFields = [
        'first_name', 'last_name', 'email', 'phone', 'agency', 
        'department', 'position', 'is_active', 'role_id'
      ];
      
      const updateFields = [];
      const params = [];
      let paramCount = 0;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          params.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay campos válidos para actualizar'
        });
      }

      paramCount++;
      params.push(req.user.id); // updated_by
      paramCount++;
      params.push(id); // WHERE id

      const query = `
        UPDATE users_extended 
        SET ${updateFields.join(', ')}, updated_by = $${paramCount - 1}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING id
      `;

      const result = await dbManager.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      console.log(`✅ Usuario ${id} actualizado`);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente'
      });

    } else {
      // Simulación mock
      console.log(`✅ Usuario mock ${id} actualizado`);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente (mock)',
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Eliminar usuario
router.delete('/users/:id', requireAuth, requireModulePermission('users', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`👤 ${req.user.username} eliminando usuario ${id}`);

    // No permitir auto-eliminación
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar tu propio usuario'
      });
    }

    if (dbConnected && dbManager) {
      const result = await dbManager.query(
        'DELETE FROM users_extended WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      console.log(`✅ Usuario ${id} eliminado`);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });

    } else {
      // Simulación mock
      console.log(`✅ Usuario mock ${id} eliminado`);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente (mock)',
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// =====================================================
// RUTAS DE GESTIÓN DE MÓDULOS
// =====================================================

// Obtener todos los módulos disponibles
router.get('/modules', requireAuth, async (req, res) => {
  try {
    console.log(`📦 ${req.user.username} solicitando módulos disponibles`);

    if (dbConnected && dbManager) {
      const result = await dbManager.query(`
        SELECT 
          m.*,
          COALESCE(
            json_agg(
              json_build_object(
                'name', mp.permission_name,
                'displayName', mp.display_name,
                'description', mp.description,
                'isDefault', mp.is_default
              )
            ) FILTER (WHERE mp.id IS NOT NULL),
            '[]'
          ) as permissions
        FROM modules m
        LEFT JOIN module_permissions mp ON m.id = mp.module_id
        WHERE m.is_active = true
        GROUP BY m.id
        ORDER BY m.sort_order
      `);

      res.json({
        success: true,
        modules: result.rows,
        source: 'database'
      });

    } else {
      // Datos mock
      const modules = generateMockModules();

      res.json({
        success: true,
        modules,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo módulos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener módulos de un usuario específico
router.get('/users/:id/modules', requireAuth, requireModulePermission('users', 'view'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 ${req.user.username} solicitando módulos del usuario ${id}`);

    if (dbConnected && dbManager) {
      const result = await dbManager.query(`
        SELECT 
          m.id as module_id,
          m.name,
          m.display_name,
          m.description,
          m.icon,
          m.route,
          m.category,
          m.is_core,
          um.permissions,
          um.is_enabled,
          um.is_pinned,
          um.assigned_at
        FROM user_modules um
        JOIN modules m ON um.module_id = m.id
        WHERE um.user_id = $1 AND m.is_active = true
        ORDER BY m.sort_order
      `, [id]);

      res.json({
        success: true,
        userModules: result.rows,
        source: 'database'
      });

    } else {
      // Mock data
      const users = generateMockUsers();
      const user = users.find(u => u.id === parseInt(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const allModules = generateMockModules();
      const userModules = allModules.filter(m => user.modules.includes(m.name));

      res.json({
        success: true,
        userModules,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo módulos del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Asignar módulo a usuario
router.post('/users/:id/modules', requireAuth, requireModulePermission('users', 'manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { moduleId, permissions = {}, isEnabled = true } = req.body;

    console.log(`📦 ${req.user.username} asignando módulo ${moduleId} al usuario ${id}`);

    if (dbConnected && dbManager) {
      // Insertar o actualizar asignación de módulo
      await dbManager.query(`
        INSERT INTO user_modules (user_id, module_id, permissions, is_enabled, assigned_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, module_id) 
        DO UPDATE SET 
          permissions = $3,
          is_enabled = $4,
          updated_by = $5,
          updated_at = NOW()
      `, [id, moduleId, JSON.stringify(permissions), isEnabled, req.user.id]);

      console.log(`✅ Módulo ${moduleId} asignado al usuario ${id}`);

      res.json({
        success: true,
        message: 'Módulo asignado exitosamente'
      });

    } else {
      // Simulación mock
      console.log(`✅ Módulo mock ${moduleId} asignado al usuario ${id}`);

      res.json({
        success: true,
        message: 'Módulo asignado exitosamente (mock)',
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error asignando módulo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Remover módulo de usuario
router.delete('/users/:id/modules/:moduleId', requireAuth, requireModulePermission('users', 'manage'), async (req, res) => {
  try {
    const { id, moduleId } = req.params;

    console.log(`📦 ${req.user.username} removiendo módulo ${moduleId} del usuario ${id}`);

    if (dbConnected && dbManager) {
      // Verificar que no sea un módulo core
      const moduleResult = await dbManager.query(
        'SELECT is_core FROM modules WHERE id = $1',
        [moduleId]
      );

      if (moduleResult.rows[0]?.is_core) {
        return res.status(400).json({
          success: false,
          error: 'No se pueden remover módulos core'
        });
      }

      const result = await dbManager.query(
        'DELETE FROM user_modules WHERE user_id = $1 AND module_id = $2 RETURNING id',
        [id, moduleId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Asignación de módulo no encontrada'
        });
      }

      console.log(`✅ Módulo ${moduleId} removido del usuario ${id}`);

      res.json({
        success: true,
        message: 'Módulo removido exitosamente'
      });

    } else {
      // Simulación mock
      console.log(`✅ Módulo mock ${moduleId} removido del usuario ${id}`);

      res.json({
        success: true,
        message: 'Módulo removido exitosamente (mock)',
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error removiendo módulo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// =====================================================
// RUTAS DE GESTIÓN DE ROLES
// =====================================================

// Obtener todos los roles
router.get('/roles', requireAuth, async (req, res) => {
  try {
    console.log(`🎭 ${req.user.username} solicitando roles disponibles`);

    if (dbConnected && dbManager) {
      const result = await dbManager.query(`
        SELECT * FROM user_roles 
        WHERE is_active = true 
        ORDER BY level ASC
      `);

      res.json({
        success: true,
        roles: result.rows,
        source: 'database'
      });

    } else {
      // Datos mock
      const roles = generateMockRoles();

      res.json({
        success: true,
        roles,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

async function assignDefaultModulesForRole(userId, roleId) {
  if (!dbConnected || !dbManager) return;

  try {
    // Definir módulos por defecto según el rol
    const defaultModulesByRole = {
      1: { // super_admin
        modules: ['dashboard', 'packages', 'bookings', 'users', 'analytics', 'settings'],
        permissions: { view: true, create: true, edit: true, delete: true, manage: true }
      },
      2: { // admin_agencia
        modules: ['dashboard', 'packages', 'bookings', 'crm', 'reports', 'settings'],
        permissions: { view: true, create: true, edit: true, delete: true }
      },
      3: { // operador
        modules: ['dashboard', 'packages', 'bookings', 'crm'],
        permissions: { view: true, create: true, edit: true }
      },
      4: { // analista
        modules: ['dashboard', 'analytics', 'reports'],
        permissions: { view: true, advanced: true, export: true }
      },
      5: { // contador
        modules: ['dashboard', 'accounting', 'reports'],
        permissions: { view: true, create: true, edit: true }
      }
    };

    const config = defaultModulesByRole[roleId];
    if (!config) return;

    for (const moduleName of config.modules) {
      const moduleResult = await dbManager.query(
        'SELECT id FROM modules WHERE name = $1',
        [moduleName]
      );

      if (moduleResult.rows.length > 0) {
        const moduleId = moduleResult.rows[0].id;
        
        await dbManager.query(`
          INSERT INTO user_modules (user_id, module_id, permissions, is_enabled, assigned_by)
          VALUES ($1, $2, $3, true, $4)
          ON CONFLICT (user_id, module_id) DO NOTHING
        `, [userId, moduleId, JSON.stringify(config.permissions), userId]);
      }
    }

    console.log(`✅ Módulos por defecto asignados para rol ${roleId}`);

  } catch (error) {
    console.error('❌ Error asignando módulos por defecto:', error);
  }
}

// =====================================================
// RUTA DE ESTADÍSTICAS DE USUARIOS
// =====================================================

router.get('/users/stats', requireAuth, requireModulePermission('users', 'view'), async (req, res) => {
  try {
    console.log(`📊 ${req.user.username} solicitando estadísticas de usuarios`);

    if (dbConnected && dbManager) {
      const [totalResult, activeResult, rolesResult] = await Promise.all([
        dbManager.query('SELECT COUNT(*) as total FROM users_extended'),
        dbManager.query('SELECT COUNT(*) as active FROM users_extended WHERE is_active = true'),
        dbManager.query(`
          SELECT r.display_name, COUNT(u.id) as count 
          FROM user_roles r 
          LEFT JOIN users_extended u ON r.id = u.role_id 
          GROUP BY r.id, r.display_name
        `)
      ]);

      const stats = {
        total: parseInt(totalResult.rows[0].total),
        active: parseInt(activeResult.rows[0].active),
        inactive: parseInt(totalResult.rows[0].total) - parseInt(activeResult.rows[0].active),
        byRole: rolesResult.rows
      };

      res.json({
        success: true,
        stats,
        source: 'database'
      });

    } else {
      // Stats mock
      const users = generateMockUsers();
      const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        byRole: [
          { display_name: 'Super Administrador', count: 1 },
          { display_name: 'Administrador de Agencia', count: 1 },
          { display_name: 'Operador', count: 1 },
          { display_name: 'Analista', count: 1 },
          { display_name: 'Contador', count: 1 }
        ]
      };

      res.json({
        success: true,
        stats,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
