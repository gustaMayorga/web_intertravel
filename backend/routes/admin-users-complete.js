// ===============================================
// API ADMIN USERS CON PERMISOS GRANULARES
// ===============================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../../database');
const { authenticateAdmin, checkPermission } = require('../../middleware/auth-admin');

const router = express.Router();

// ===============================================
// MIDDLEWARE VERIFICACIÓN PERMISOS
// ===============================================

async function verifyPermission(resource, action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const result = await query(
        'SELECT user_has_permission($1, $2, $3) as has_permission',
        [userId, resource, action]
      );
      
      if (!result.rows[0].has_permission) {
        return res.status(403).json({
          success: false,
          error: `No tienes permisos para ${action} en ${resource}`
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error verificando permisos' });
    }
  };
}

// ===============================================
// RUTAS GESTIÓN ADMIN USERS
// ===============================================

// GET /api/admin/users - Listar usuarios admin
router.get('/', authenticateAdmin, verifyPermission('users', 'read'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const result = await query(`
      SELECT 
        au.id, au.username, au.email, au.role, au.full_name, 
        au.department, au.position, au.is_active, au.created_at,
        au.last_login, ar.display_name as role_display
      FROM admin_users au
      LEFT JOIN admin_roles ar ON au.role = ar.name
      ORDER BY au.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await query('SELECT COUNT(*) FROM admin_users');
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/users - Crear nuevo usuario admin
router.post('/', authenticateAdmin, verifyPermission('users', 'create'), async (req, res) => {
  try {
    const {
      username, email, password, role, full_name,
      department, position, permissions
    } = req.body;
    
    // Validaciones
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, password y role son requeridos'
      });
    }
    
    // Verificar si usuario ya existe
    const existingUser = await query(
      'SELECT id FROM admin_users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Usuario o email ya existe'
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Obtener permisos del rol si no se especifican
    let userPermissions = permissions;
    if (!userPermissions) {
      const roleResult = await query(
        'SELECT permissions FROM admin_roles WHERE name = $1',
        [role]
      );
      userPermissions = roleResult.rows[0]?.permissions || [];
    }
    
    // Crear usuario
    const result = await query(`
      INSERT INTO admin_users 
      (username, email, password_hash, role, full_name, department, position, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, role, full_name, created_at
    `, [username, email, passwordHash, role, full_name, department, position, JSON.stringify(userPermissions)]);
    
    // Log actividad
    await query(`
      INSERT INTO admin_activity_logs (user_id, action, resource, resource_id, details)
      VALUES ($1, 'CREATE_USER', 'admin_users', $2, $3)
    `, [req.user.id, result.rows[0].id, JSON.stringify({ created_user: result.rows[0] })]);
    
    res.status(201).json({
      success: true,
      user: result.rows[0],
      message: 'Usuario admin creado exitosamente'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario admin
router.put('/:id', authenticateAdmin, verifyPermission('users', 'update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const {
      username, email, role, full_name, department,
      position, permissions, is_active
    } = req.body;
    
    // Verificar que usuario existe
    const existingUser = await query(
      'SELECT * FROM admin_users WHERE id = $1',
      [userId]
    );
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Actualizar usuario
    const result = await query(`
      UPDATE admin_users SET
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        full_name = COALESCE($4, full_name),
        department = COALESCE($5, department),
        position = COALESCE($6, position),
        permissions = COALESCE($7, permissions),
        is_active = COALESCE($8, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, username, email, role, full_name, department, position, is_active
    `, [username, email, role, full_name, department, position, 
         permissions ? JSON.stringify(permissions) : null, is_active, userId]);
    
    res.json({
      success: true,
      user: result.rows[0],
      message: 'Usuario actualizado exitosamente'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/users/:id/permissions - Obtener permisos de usuario
router.get('/:id/permissions', authenticateAdmin, verifyPermission('users', 'read'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const result = await query(
      'SELECT * FROM get_user_permissions($1)',
      [userId]
    );
    
    res.json({
      success: true,
      permissions: result.rows
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/roles - Listar roles disponibles
router.get('/roles', authenticateAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT name, display_name, description, permissions
      FROM admin_roles
      ORDER BY name
    `);
    
    res.json({
      success: true,
      roles: result.rows
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/activity-logs - Logs de actividad
router.get('/activity-logs', authenticateAdmin, verifyPermission('users', 'read'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const result = await query(`
      SELECT 
        aal.*, au.username, au.full_name
      FROM admin_activity_logs aal
      LEFT JOIN admin_users au ON aal.user_id = au.id
      ORDER BY aal.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    res.json({
      success: true,
      logs: result.rows
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;