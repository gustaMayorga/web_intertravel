// ===============================================
// RUTAS ADMIN EXTENDIDAS - TODOS LOS MÓDULOS
// ===============================================

const express = require('express');
const router = express.Router();

const WebConfigManager = require('../modules/webConfig');
const TCPackagesManager = require('../modules/tcPackages');
const AgenciesManager = require('../modules/agencies');
const LeadsManager = require('../modules/leads');

// Middleware de autenticación (reutilizar el existente)
const adminTokens = new Map();

function requireAdminAuth(req, res, next) {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }
  
  const user = adminTokens.get(token);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
  
  req.user = user;
  next();
}

// ===============================================
// RUTAS: CONFIGURACIÓN WEB
// ===============================================

// Obtener configuración web
router.get('/web-config', requireAdminAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const result = await WebConfigManager.getConfig(category);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar configuración web
router.put('/web-config/:key', requireAdminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category, description } = req.body;
    
    const result = await WebConfigManager.updateConfig(key, value, category, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener configuración por categoría
router.get('/web-config/category/:category', requireAdminAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const result = await WebConfigManager.getByCategory(category);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// RUTAS: PAQUETES TRAVEL COMPOSITOR
// ===============================================

// Sincronizar paquetes de TC
router.post('/tc-packages/sync', requireAdminAuth, async (req, res) => {
  try {
    const result = await TCPackagesManager.syncPackages();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todos los paquetes
router.get('/tc-packages', requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      country: req.query.country,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      isFeatured: req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const result = await TCPackagesManager.getPackages(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar estado de paquete
router.patch('/tc-packages/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await TCPackagesManager.updatePackageStatus(parseInt(id), updates);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estadísticas de paquetes
router.get('/tc-packages/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await TCPackagesManager.getStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// RUTAS: GESTIÓN DE AGENCIAS
// ===============================================

// Crear nueva agencia
router.post('/agencies', requireAdminAuth, async (req, res) => {
  try {
    const result = await AgenciesManager.createAgency(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener todas las agencias
router.get('/agencies', requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      membershipType: req.query.membershipType,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const result = await AgenciesManager.getAgencies(filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar estado de agencia
router.patch('/agencies/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await AgenciesManager.updateAgencyStatus(parseInt(id), status, req.user.username);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agregar cliente a agencia
router.post('/agencies/:id/clients', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AgenciesManager.addClient(parseInt(id), req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener clientes de agencia
router.get('/agencies/:id/clients', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };
    
    const result = await AgenciesManager.getAgencyClients(parseInt(id), filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estadísticas de agencias
router.get('/agencies/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await AgenciesManager.getStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===============================================
// RUTAS: GESTIÓN DE USUARIOS/CREDENCIALES
// ===============================================

// Obtener todos los usuarios
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const { query } = require('../database');
    
    const result = await query(`
      SELECT uc.id, uc.username, uc.email, uc.role, uc.full_name, uc.phone,
             uc.last_login, uc.is_active, uc.created_at,
             a.agency_name, a.agency_code
      FROM user_credentials uc
      LEFT JOIN agencies a ON uc.agency_id = a.id
      ORDER BY uc.created_at DESC
    `);
    
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear nuevo usuario
router.post('/users', requireAdminAuth, async (req, res) => {
  try {
    const { username, email, password, role, fullName, phone, agencyId, permissions } = req.body;
    const bcrypt = require('bcrypt');
    const { query } = require('../database');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(`
      INSERT INTO user_credentials (
        username, email, password_hash, role, full_name, phone, 
        agency_id, permissions, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, username, email, role, full_name, phone, is_active, created_at
    `, [
      username, email, hashedPassword, role, fullName, phone,
      agencyId || null, JSON.stringify(permissions || []), req.user.id || null
    ]);
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar usuario
router.put('/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, fullName, phone, isActive, permissions } = req.body;
    const { query } = require('../database');
    
    const result = await query(`
      UPDATE user_credentials 
      SET email = $1, role = $2, full_name = $3, phone = $4, 
          is_active = $5, permissions = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, username, email, role, full_name, phone, is_active
    `, [email, role, fullName, phone, isActive, JSON.stringify(permissions || []), id]);
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cambiar contraseña
router.post('/users/:id/change-password', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const bcrypt = require('bcrypt');
    const { query } = require('../database');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await query(`
      UPDATE user_credentials 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [hashedPassword, id]);
    
    res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;