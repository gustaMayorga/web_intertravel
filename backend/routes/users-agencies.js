// Routes para gestión de usuarios y agencias
// ==========================================

const express = require('express');
const router = express.Router();
const UsersManager = require('../modules/users');
const AgenciesManager = require('../modules/agencies');

// Middleware de autenticación
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorización requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido'
      });
    }

    const verification = await UsersManager.verifyToken(token);
    if (!verification.success) {
      return res.status(401).json({
        success: false,
        error: verification.error
      });
    }

    req.user = verification.user;
    next();

  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

// Middleware de permisos
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      // Obtener permisos del usuario
      const userResult = await UsersManager.getUserById(req.user.userId);
      if (!userResult.success) {
        return res.status(403).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const userPermissions = userResult.user.role.permissions || [];
      
      // Verificar permiso específico
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: 'Permisos insuficientes'
        });
      }

      next();

    } catch (error) {
      console.error('❌ Error verificando permisos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  };
}

// ================================
// RUTAS DE AUTENTICACIÓN
// ================================

// Login (ya existe en server.js, pero aquí una versión mejorada)
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username y password son requeridos'
      });
    }

    const result = await UsersManager.authenticate(username, password);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    // Crear sesión con datos del request
    await UsersManager.createSession(result.user.id, result.token, ipAddress, userAgent);

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      expiresIn: result.expiresIn
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Logout
router.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    const authHeader = req.get('Authorization');
    const token = authHeader.split(' ')[1];

    await UsersManager.revokeSession(token);

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar token
router.get('/auth/verify', requireAuth, async (req, res) => {
  try {
    const userResult = await UsersManager.getUserById(req.user.userId);
    
    if (!userResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no válido'
      });
    }

    res.json({
      success: true,
      user: userResult.user,
      valid: true
    });

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ================================
// RUTAS DE USUARIOS
// ================================

// Obtener usuarios
router.get('/users', requireAuth, requirePermission('users.view'), async (req, res) => {
  try {
    const result = await UsersManager.getUsers(req.query);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data.users,
      pagination: result.data.pagination
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener usuario por ID
router.get('/users/:id', requireAuth, requirePermission('users.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UsersManager.getUserById(parseInt(id));
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      user: result.user
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Crear usuario
router.post('/users', requireAuth, requirePermission('users.create'), async (req, res) => {
  try {
    const result = await UsersManager.createUser(req.body, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar usuario
router.put('/users/:id', requireAuth, requirePermission('users.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UsersManager.updateUser(parseInt(id), req.body, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Eliminar usuario
router.delete('/users/:id', requireAuth, requirePermission('users.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await UsersManager.deleteUser(parseInt(id), req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Cambiar contraseña
router.post('/users/:id/change-password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const userId = parseInt(id);

    // Verificar que sea el mismo usuario o que tenga permisos
    if (req.user.userId !== userId) {
      const userResult = await UsersManager.getUserById(req.user.userId);
      if (!userResult.success || !userResult.user.role.permissions.includes('users.edit')) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permisos para cambiar esta contraseña'
        });
      }
    }

    const result = await UsersManager.changePassword(userId, currentPassword, newPassword, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener roles
router.get('/roles', requireAuth, async (req, res) => {
  try {
    const result = await UsersManager.getRoles();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      roles: result.roles
    });

  } catch (error) {
    console.error('❌ Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener permisos
router.get('/permissions', requireAuth, async (req, res) => {
  try {
    const result = await UsersManager.getPermissions();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      permissions: result.permissions,
      grouped: result.groupedPermissions
    });

  } catch (error) {
    console.error('❌ Error obteniendo permisos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Estadísticas de usuarios
router.get('/users/stats', requireAuth, requirePermission('users.view'), async (req, res) => {
  try {
    const result = await UsersManager.getUserStats();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      stats: result.stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ================================
// RUTAS DE AGENCIAS
// ================================

// Obtener agencias
router.get('/agencies', requireAuth, requirePermission('agencies.view'), async (req, res) => {
  try {
    const result = await AgenciesManager.getAgencies(req.query);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data.agencies,
      pagination: result.data.pagination
    });

  } catch (error) {
    console.error('❌ Error obteniendo agencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener agencia por ID
router.get('/agencies/:id', requireAuth, requirePermission('agencies.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AgenciesManager.getAgencyById(parseInt(id));
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json({
      success: true,
      agency: result.agency
    });

  } catch (error) {
    console.error('❌ Error obteniendo agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Crear agencia
router.post('/agencies', requireAuth, requirePermission('agencies.create'), async (req, res) => {
  try {
    const result = await AgenciesManager.createAgency(req.body, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Error creando agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar agencia
router.put('/agencies/:id', requireAuth, requirePermission('agencies.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AgenciesManager.updateAgency(parseInt(id), req.body, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Eliminar agencia
router.delete('/agencies/:id', requireAuth, requirePermission('agencies.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AgenciesManager.deleteAgency(parseInt(id), req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error eliminando agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Cambiar estado de agencia
router.patch('/agencies/:id/status', requireAuth, requirePermission('agencies.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await AgenciesManager.changeAgencyStatus(parseInt(id), status, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error cambiando estado de agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Estadísticas de agencias
router.get('/agencies/stats', requireAuth, requirePermission('agencies.view'), async (req, res) => {
  try {
    const result = await AgenciesManager.getAgencyStats();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      stats: result.stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de agencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Financials de agencia específica
router.get('/agencies/:id/financials', requireAuth, requirePermission('agencies.view'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AgenciesManager.getAgencyFinancials(parseInt(id), req.query);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error obteniendo financials de agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Generar código de agencia
router.post('/agencies/generate-code', requireAuth, requirePermission('agencies.create'), async (req, res) => {
  try {
    const { baseName } = req.body;
    
    if (!baseName) {
      return res.status(400).json({
        success: false,
        error: 'baseName es requerido'
      });
    }

    const result = await AgenciesManager.generateAgencyCode(baseName);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      code: result.code
    });

  } catch (error) {
    console.error('❌ Error generando código de agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener provincias disponibles
router.get('/agencies/provinces', requireAuth, async (req, res) => {
  try {
    const result = await AgenciesManager.getAvailableProvinces();
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      provinces: result.provinces
    });

  } catch (error) {
    console.error('❌ Error obteniendo provincias:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualización masiva de comisiones
router.post('/agencies/bulk-update-commissions', requireAuth, requirePermission('agencies.edit'), async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de actualizaciones'
      });
    }

    const result = await AgenciesManager.bulkUpdateCommissionRates(updates, req.user.userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error en actualización masiva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ================================
// LOGS Y AUDITORÍA
// ================================

// Obtener logs de acceso
router.get('/access-logs', requireAuth, requirePermission('system.logs'), async (req, res) => {
  try {
    const result = await UsersManager.getAccessLogs(req.query);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      logs: result.logs
    });

  } catch (error) {
    console.error('❌ Error obteniendo logs de acceso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
