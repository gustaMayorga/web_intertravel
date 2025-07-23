// =====================================================
// RUTAS DE PERMISOS Y VERIFICACIÓN - INTERTRAVEL
// Versión: 1.0
// =====================================================

const express = require('express');
const router = express.Router();

// Simulación de conexión a base de datos
let dbManager = null;
let dbConnected = false;

try {
  const database = require('../database.js');
  dbManager = database.dbManager;
  dbConnected = database.isConnected;
} catch (error) {
  console.warn('⚠️ Base de datos no disponible, usando datos mock:', error.message);
}

// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN
// =====================================================

function requireAuth(req, res, next) {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }
  
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

// =====================================================
// FUNCIONES AUXILIARES MOCK
// =====================================================

function getMockUserModules(userId) {
  // Datos mock para diferentes usuarios
  const userModulesMap = {
    'admin': {
      modules: [
        { name: 'dashboard', permissions: { view: true } },
        { name: 'packages', permissions: { view: true, create: true, edit: true, delete: true } },
        { name: 'users', permissions: { view: true, create: true, edit: true, delete: true, manage: true } },
        { name: 'analytics', permissions: { view: true, advanced: true, export: true } },
        { name: 'bookings', permissions: { view: true, create: true, edit: true, delete: true } },
        { name: 'crm', permissions: { view: true, create: true, edit: true, delete: true } },
        { name: 'reports', permissions: { view: true, create: true, export: true } },
        { name: 'accounting', permissions: { view: true, create: true, edit: true } },
        { name: 'settings', permissions: { view: true, edit: true } }
      ]
    },
    'agencia_admin': {
      modules: [
        { name: 'dashboard', permissions: { view: true } },
        { name: 'packages', permissions: { view: true, create: true, edit: true } },
        { name: 'bookings', permissions: { view: true, create: true, edit: true } },
        { name: 'crm', permissions: { view: true, create: true, edit: true } },
        { name: 'reports', permissions: { view: true, export: true } },
        { name: 'settings', permissions: { view: true } }
      ]
    },
    'operador1': {
      modules: [
        { name: 'dashboard', permissions: { view: true } },
        { name: 'packages', permissions: { view: true } },
        { name: 'bookings', permissions: { view: true, create: true, edit: true } },
        { name: 'crm', permissions: { view: true, create: true, edit: true } }
      ]
    },
    'analista1': {
      modules: [
        { name: 'dashboard', permissions: { view: true } },
        { name: 'analytics', permissions: { view: true, advanced: true, export: true } },
        { name: 'reports', permissions: { view: true, create: true, export: true } }
      ]
    },
    'contador1': {
      modules: [
        { name: 'dashboard', permissions: { view: true } },
        { name: 'accounting', permissions: { view: true, create: true, edit: true } },
        { name: 'reports', permissions: { view: true, export: true } }
      ]
    }
  };

  return userModulesMap[userId] || { modules: [{ name: 'dashboard', permissions: { view: true } }] };
}

// =====================================================
// RUTAS DE VERIFICACIÓN DE PERMISOS
// =====================================================

// Obtener módulos del usuario actual con permisos
router.get('/user-modules', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;
    console.log(`🔐 ${req.user.username} solicitando sus módulos disponibles`);

    if (dbConnected && dbManager) {
      // Obtener módulos desde la base de datos
      const result = await dbManager.query(`
        SELECT 
          m.name,
          m.display_name,
          m.description,
          m.icon,
          m.route,
          m.category,
          m.sort_order,
          m.is_core,
          um.permissions,
          um.is_enabled,
          um.is_pinned
        FROM user_modules um
        JOIN modules m ON um.module_id = m.id
        WHERE um.user_id = $1 
          AND um.is_enabled = true 
          AND m.is_active = true
        ORDER BY m.sort_order
      `, [userId]);

      const userModules = result.rows.map(row => ({
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        icon: row.icon,
        route: row.route,
        category: row.category,
        sortOrder: row.sort_order,
        isCore: row.is_core,
        permissions: row.permissions || {},
        isEnabled: row.is_enabled,
        isPinned: row.is_pinned
      }));

      console.log(`✅ Enviando ${userModules.length} módulos para ${req.user.username}`);

      res.json({
        success: true,
        modules: userModules,
        user: {
          id: userId,
          username: req.user.username,
          role: req.user.role
        },
        source: 'database'
      });

    } else {
      // Fallback con datos mock
      const mockData = getMockUserModules(req.user.username);
      
      // Enriquecer con información de módulos
      const enrichedModules = mockData.modules.map(m => ({
        name: m.name,
        displayName: getModuleDisplayName(m.name),
        icon: getModuleIcon(m.name),
        route: `/admin/${m.name}`,
        category: getModuleCategory(m.name),
        permissions: m.permissions,
        isEnabled: true,
        isCore: m.name === 'dashboard'
      }));

      console.log(`✅ Enviando ${enrichedModules.length} módulos mock para ${req.user.username}`);

      res.json({
        success: true,
        modules: enrichedModules,
        user: {
          username: req.user.username,
          role: req.user.role
        },
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

// Verificar permiso específico
router.get('/check-permission/:module/:permission', requireAuth, async (req, res) => {
  try {
    const { module, permission } = req.params;
    const userId = req.user.id || req.user.username;

    console.log(`🔐 Verificando permiso ${permission} en módulo ${module} para ${req.user.username}`);

    if (dbConnected && dbManager) {
      // Verificar en base de datos
      const result = await dbManager.query(`
        SELECT check_user_permission($1, $2, $3) as has_permission
      `, [userId, module, permission]);

      const hasPermission = result.rows[0]?.has_permission || false;

      res.json({
        success: true,
        hasPermission,
        module,
        permission,
        user: req.user.username,
        source: 'database'
      });

    } else {
      // Verificación mock
      const mockData = getMockUserModules(req.user.username);
      const moduleData = mockData.modules.find(m => m.name === module);
      const hasPermission = moduleData ? (moduleData.permissions[permission] === true) : false;

      res.json({
        success: true,
        hasPermission,
        module,
        permission,
        user: req.user.username,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error verificando permiso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar múltiples permisos
router.post('/check-permissions', requireAuth, async (req, res) => {
  try {
    const { checks } = req.body; // Array de {module, permission}
    const userId = req.user.id || req.user.username;

    console.log(`🔐 Verificando ${checks.length} permisos para ${req.user.username}`);

    if (dbConnected && dbManager) {
      // Verificar en base de datos
      const results = [];
      
      for (const check of checks) {
        const result = await dbManager.query(`
          SELECT check_user_permission($1, $2, $3) as has_permission
        `, [userId, check.module, check.permission]);

        results.push({
          module: check.module,
          permission: check.permission,
          hasPermission: result.rows[0]?.has_permission || false
        });
      }

      res.json({
        success: true,
        results,
        user: req.user.username,
        source: 'database'
      });

    } else {
      // Verificación mock
      const mockData = getMockUserModules(req.user.username);
      
      const results = checks.map(check => {
        const moduleData = mockData.modules.find(m => m.name === check.module);
        const hasPermission = moduleData ? (moduleData.permissions[check.permission] === true) : false;
        
        return {
          module: check.module,
          permission: check.permission,
          hasPermission
        };
      });

      res.json({
        success: true,
        results,
        user: req.user.username,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error verificando permisos múltiples:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener información completa de permisos del usuario
router.get('/user-permissions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;
    console.log(`🔐 ${req.user.username} solicitando información completa de permisos`);

    if (dbConnected && dbManager) {
      // Obtener información completa desde BD
      const modulesResult = await dbManager.query(`
        SELECT 
          m.name,
          m.display_name,
          m.category,
          m.is_core,
          um.permissions,
          um.is_enabled
        FROM user_modules um
        JOIN modules m ON um.module_id = m.id
        WHERE um.user_id = $1 AND m.is_active = true
        ORDER BY m.sort_order
      `, [userId]);

      const userResult = await dbManager.query(`
        SELECT 
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          r.name as role,
          r.display_name as role_name,
          r.level as role_level
        FROM users_extended u
        LEFT JOIN user_roles r ON u.role_id = r.id
        WHERE u.id = $1
      `, [userId]);

      const userInfo = userResult.rows[0] || {};

      // Construir mapa de permisos
      const permissionsMap = {};
      modulesResult.rows.forEach(row => {
        permissionsMap[row.name] = {
          displayName: row.display_name,
          category: row.category,
          isCore: row.is_core,
          isEnabled: row.is_enabled,
          permissions: row.permissions || {}
        };
      });

      res.json({
        success: true,
        user: {
          id: userId,
          username: userInfo.username,
          firstName: userInfo.first_name,
          lastName: userInfo.last_name,
          email: userInfo.email,
          role: userInfo.role,
          roleName: userInfo.role_name,
          roleLevel: userInfo.role_level
        },
        modules: permissionsMap,
        totalModules: Object.keys(permissionsMap).length,
        source: 'database'
      });

    } else {
      // Información mock
      const mockData = getMockUserModules(req.user.username);
      
      const permissionsMap = {};
      mockData.modules.forEach(m => {
        permissionsMap[m.name] = {
          displayName: getModuleDisplayName(m.name),
          category: getModuleCategory(m.name),
          isCore: m.name === 'dashboard',
          isEnabled: true,
          permissions: m.permissions
        };
      });

      res.json({
        success: true,
        user: {
          username: req.user.username,
          role: req.user.role,
          agency: req.user.agency
        },
        modules: permissionsMap,
        totalModules: Object.keys(permissionsMap).length,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo información de permisos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar acceso a ruta específica
router.get('/check-route-access', requireAuth, async (req, res) => {
  try {
    const { route } = req.query;
    const userId = req.user.id || req.user.username;

    if (!route) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro route es requerido'
      });
    }

    console.log(`🔐 Verificando acceso a ruta ${route} para ${req.user.username}`);

    // Extraer módulo de la ruta
    const routeParts = route.split('/');
    const moduleName = routeParts[2]; // /admin/packages -> packages

    if (!moduleName) {
      return res.status(400).json({
        success: false,
        error: 'Ruta inválida'
      });
    }

    if (dbConnected && dbManager) {
      // Verificar acceso en BD
      const result = await dbManager.query(`
        SELECT 
          m.name,
          um.permissions,
          um.is_enabled
        FROM user_modules um
        JOIN modules m ON um.module_id = m.id
        WHERE um.user_id = $1 AND m.name = $2 AND m.is_active = true
      `, [userId, moduleName]);

      const hasAccess = result.rows.length > 0 && result.rows[0].is_enabled;
      const permissions = result.rows[0]?.permissions || {};

      res.json({
        success: true,
        hasAccess,
        route,
        module: moduleName,
        permissions,
        user: req.user.username,
        source: 'database'
      });

    } else {
      // Verificación mock
      const mockData = getMockUserModules(req.user.username);
      const moduleData = mockData.modules.find(m => m.name === moduleName);
      
      res.json({
        success: true,
        hasAccess: !!moduleData,
        route,
        module: moduleName,
        permissions: moduleData?.permissions || {},
        user: req.user.username,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error verificando acceso a ruta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar configuración personal de módulos
router.put('/user-modules-config', requireAuth, async (req, res) => {
  try {
    const { moduleConfig } = req.body; // Array de {moduleName, isPinned, customSettings}
    const userId = req.user.id || req.user.username;

    console.log(`🔐 ${req.user.username} actualizando configuración de módulos`);

    if (dbConnected && dbManager) {
      // Actualizar en BD
      for (const config of moduleConfig) {
        await dbManager.query(`
          UPDATE user_modules 
          SET 
            is_pinned = $3,
            custom_settings = $4,
            updated_at = NOW()
          FROM modules m
          WHERE user_modules.module_id = m.id 
            AND user_modules.user_id = $1 
            AND m.name = $2
        `, [userId, config.moduleName, config.isPinned, JSON.stringify(config.customSettings || {})]);
      }

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        updatedModules: moduleConfig.length,
        source: 'database'
      });

    } else {
      // Simulación mock
      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente (mock)',
        updatedModules: moduleConfig.length,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error actualizando configuración de módulos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// =====================================================
// RUTAS DE AUDITORÍA
// =====================================================

// Obtener logs de auditoría del usuario
router.get('/audit-logs', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const userId = req.user.id || req.user.username;

    console.log(`📋 ${req.user.username} solicitando logs de auditoría`);

    if (dbConnected && dbManager) {
      let query = `
        SELECT 
          action,
          entity_type,
          entity_id,
          old_values,
          new_values,
          ip_address,
          created_at
        FROM audit_logs
        WHERE user_id = $1
      `;
      
      const params = [userId];
      let paramCount = 1;

      if (action) {
        paramCount++;
        query += ` AND action = $${paramCount}`;
        params.push(action);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

      const result = await dbManager.query(query, params);

      res.json({
        success: true,
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        },
        source: 'database'
      });

    } else {
      // Logs mock
      const mockLogs = [
        {
          action: 'login',
          entity_type: 'session',
          entity_id: 'session_123',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          action: 'view_module',
          entity_type: 'module',
          entity_id: 'packages',
          ip_address: '192.168.1.100',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];

      res.json({
        success: true,
        logs: mockLogs,
        source: 'mock'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo logs de auditoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function getModuleDisplayName(moduleName) {
  const displayNames = {
    dashboard: 'Dashboard Principal',
    packages: 'Gestión de Paquetes',
    bookings: 'Reservas',
    users: 'Gestión de Usuarios',
    analytics: 'Analytics BI',
    crm: 'CRM',
    reports: 'Reportes',
    accounting: 'Contabilidad',
    settings: 'Configuración',
    destinations: 'Destinos',
    priority: 'Priorización'
  };
  return displayNames[moduleName] || moduleName;
}

function getModuleIcon(moduleName) {
  const icons = {
    dashboard: 'LayoutDashboard',
    packages: 'Package',
    bookings: 'Calendar',
    users: 'UserCog',
    analytics: 'BarChart3',
    crm: 'Building',
    reports: 'FileText',
    accounting: 'DollarSign',
    settings: 'Settings',
    destinations: 'MapPin',
    priority: 'Star'
  };
  return icons[moduleName] || 'Settings';
}

function getModuleCategory(moduleName) {
  const categories = {
    dashboard: 'core',
    packages: 'business',
    bookings: 'business',
    users: 'admin',
    analytics: 'analytics',
    crm: 'business',
    reports: 'analytics',
    accounting: 'financial',
    settings: 'settings',
    destinations: 'business',
    priority: 'analytics'
  };
  return categories[moduleName] || 'general';
}

module.exports = router;
