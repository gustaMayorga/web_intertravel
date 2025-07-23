// ===============================================
// SISTEMA ADMIN USERS CON PERMISOS GRANULARES
// Gestión completa usuarios admin + roles + permisos
// ===============================================

const fs = require('fs');
const bcrypt = require('bcrypt');

// ===============================================
// SQL SCHEMA ADMIN USERS COMPLETO
// ===============================================

function generateAdminUsersSchema() {
  const adminSchema = `-- ===============================================
-- SISTEMA ADMIN USERS CON PERMISOS GRANULARES
-- ===============================================

-- Tabla principal admin_users (ya creada, pero extendida)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department VARCHAR(50);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Argentina/Mendoza';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Tabla de roles del sistema
CREATE TABLE IF NOT EXISTS admin_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos específicos
CREATE TABLE IF NOT EXISTS admin_permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource, action)
);

-- Tabla de sesiones admin
CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Tabla de logs de actividad admin
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- INSERTAR ROLES PREDEFINIDOS
-- ===============================================

INSERT INTO admin_roles (name, display_name, description, permissions, is_system) VALUES
('super_admin', 'Super Administrador', 'Acceso total al sistema', 
 '["*:*"]', true),

('admin', 'Administrador', 'Gestión operativa completa', 
 '["users:read", "users:create", "users:update", "clients:*", "bookings:*", "packages:read", "packages:update", "analytics:read", "reports:*"]', true),

('manager', 'Manager', 'Supervisión y reportes', 
 '["clients:read", "bookings:read", "bookings:update", "analytics:read", "reports:read", "reports:export"]', true),

('agent', 'Agente de Ventas', 'Operaciones de ventas', 
 '["clients:create", "clients:read", "clients:update", "bookings:create", "bookings:read", "bookings:update", "packages:read"]', true),

('readonly', 'Solo Lectura', 'Acceso de consulta únicamente', 
 '["clients:read", "bookings:read", "packages:read", "analytics:read"]', true),

('marketing', 'Marketing', 'Gestión de marketing y contenido', 
 '["packages:read", "packages:update", "analytics:read", "cms:*", "reports:read"]', true),

('finance', 'Finanzas', 'Gestión financiera y contable', 
 '["bookings:read", "payments:*", "accounting:*", "reports:financial", "analytics:financial"]', true);

-- ===============================================
-- INSERTAR PERMISOS ESPECÍFICOS
-- ===============================================

INSERT INTO admin_permissions (resource, action, description) VALUES
-- Usuarios
('users', 'create', 'Crear nuevos usuarios admin'),
('users', 'read', 'Ver listado y detalles de usuarios'),
('users', 'update', 'Modificar usuarios existentes'),
('users', 'delete', 'Eliminar usuarios'),

-- Clientes
('clients', 'create', 'Crear nuevos clientes'),
('clients', 'read', 'Ver listado y detalles de clientes'),
('clients', 'update', 'Modificar datos de clientes'),
('clients', 'delete', 'Eliminar clientes'),
('clients', 'export', 'Exportar base de datos de clientes'),

-- Reservas
('bookings', 'create', 'Crear nuevas reservas'),
('bookings', 'read', 'Ver listado y detalles de reservas'),
('bookings', 'update', 'Modificar reservas existentes'),
('bookings', 'delete', 'Cancelar/eliminar reservas'),
('bookings', 'confirm', 'Confirmar reservas'),
('bookings', 'export', 'Exportar reportes de reservas'),

-- Paquetes
('packages', 'create', 'Crear nuevos paquetes'),
('packages', 'read', 'Ver paquetes disponibles'),
('packages', 'update', 'Modificar paquetes existentes'),
('packages', 'delete', 'Eliminar paquetes'),
('packages', 'publish', 'Publicar/despublicar paquetes'),

-- Analytics
('analytics', 'read', 'Ver dashboard de analytics'),
('analytics', 'advanced', 'Acceso a analytics avanzados'),
('analytics', 'financial', 'Ver métricas financieras'),

-- Reportes
('reports', 'read', 'Ver reportes predefinidos'),
('reports', 'create', 'Crear reportes personalizados'),
('reports', 'export', 'Exportar reportes'),
('reports', 'financial', 'Reportes financieros'),

-- CMS
('cms', 'read', 'Ver contenido del sitio'),
('cms', 'update', 'Modificar contenido del sitio'),
('cms', 'publish', 'Publicar contenido'),

-- Configuración
('settings', 'read', 'Ver configuraciones del sistema'),
('settings', 'update', 'Modificar configuraciones'),

-- Pagos
('payments', 'read', 'Ver información de pagos'),
('payments', 'process', 'Procesar pagos'),
('payments', 'refund', 'Procesar reembolsos'),

-- Contabilidad
('accounting', 'read', 'Ver información contable'),
('accounting', 'update', 'Modificar registros contables'),
('accounting', 'close', 'Cerrar períodos contables');

-- ===============================================
-- TRIGGER PARA LOGS AUTOMÁTICOS
-- ===============================================

CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO admin_activity_logs (user_id, action, resource, resource_id, details)
        VALUES (
            COALESCE(current_setting('app.current_user_id', true)::INTEGER, NEW.id),
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            json_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO admin_activity_logs (user_id, action, resource, resource_id, details)
        VALUES (
            COALESCE(current_setting('app.current_user_id', true)::INTEGER, NEW.id),
            'CREATE',
            TG_TABLE_NAME,
            NEW.id::TEXT,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO admin_activity_logs (user_id, action, resource, resource_id, details)
        VALUES (
            COALESCE(current_setting('app.current_user_id', true)::INTEGER, null),
            'DELETE',
            TG_TABLE_NAME,
            OLD.id::TEXT,
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a tablas importantes
CREATE TRIGGER admin_users_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER clients_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER bookings_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

-- ===============================================
-- FUNCIONES HELPER PARA PERMISOS
-- ===============================================

-- Verificar si usuario tiene permiso específico
CREATE OR REPLACE FUNCTION user_has_permission(user_id INTEGER, resource TEXT, action TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
    permission_check TEXT;
BEGIN
    -- Obtener permisos del usuario
    SELECT au.permissions INTO user_permissions
    FROM admin_users au
    WHERE au.id = user_id AND au.is_active = true;
    
    IF user_permissions IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar permiso específico
    permission_check := resource || ':' || action;
    
    -- Verificar si tiene permiso específico o wildcard
    RETURN (
        user_permissions ? permission_check OR
        user_permissions ? (resource || ':*') OR
        user_permissions ? '*:*'
    );
END;
$$ LANGUAGE plpgsql;

-- Obtener todos los permisos de un usuario
CREATE OR REPLACE FUNCTION get_user_permissions(user_id INTEGER)
RETURNS TABLE(resource TEXT, action TEXT, has_permission BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ap.resource,
        ap.action,
        user_has_permission(user_id, ap.resource, ap.action) as has_permission
    FROM admin_permissions ap
    ORDER BY ap.resource, ap.action;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- ÍNDICES PARA PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_user ON admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_logs(created_at);
`;

  return adminSchema;
}

// ===============================================
// API ENDPOINTS PARA GESTIÓN ADMIN USERS
// ===============================================

function generateAdminUsersAPI() {
  const adminAPI = `// ===============================================
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
          error: \`No tienes permisos para \${action} en \${resource}\`
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
    
    const result = await query(\`
      SELECT 
        au.id, au.username, au.email, au.role, au.full_name, 
        au.department, au.position, au.is_active, au.created_at,
        au.last_login, ar.display_name as role_display
      FROM admin_users au
      LEFT JOIN admin_roles ar ON au.role = ar.name
      ORDER BY au.created_at DESC
      LIMIT $1 OFFSET $2
    \`, [limit, offset]);
    
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
    const result = await query(\`
      INSERT INTO admin_users 
      (username, email, password_hash, role, full_name, department, position, permissions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, role, full_name, created_at
    \`, [username, email, passwordHash, role, full_name, department, position, JSON.stringify(userPermissions)]);
    
    // Log actividad
    await query(\`
      INSERT INTO admin_activity_logs (user_id, action, resource, resource_id, details)
      VALUES ($1, 'CREATE_USER', 'admin_users', $2, $3)
    \`, [req.user.id, result.rows[0].id, JSON.stringify({ created_user: result.rows[0] })]);
    
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
    const result = await query(\`
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
    \`, [username, email, role, full_name, department, position, 
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
    const result = await query(\`
      SELECT name, display_name, description, permissions
      FROM admin_roles
      ORDER BY name
    \`);
    
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
    
    const result = await query(\`
      SELECT 
        aal.*, au.username, au.full_name
      FROM admin_activity_logs aal
      LEFT JOIN admin_users au ON aal.user_id = au.id
      ORDER BY aal.created_at DESC
      LIMIT $1 OFFSET $2
    \`, [limit, offset]);
    
    res.json({
      success: true,
      logs: result.rows
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;`;

  return adminAPI;
}

// ===============================================
// EJECUTAR IMPLEMENTACIÓN ADMIN USERS COMPLETA
// ===============================================

async function implementCompleteAdminUsers() {
  console.log('👥 IMPLEMENTANDO SISTEMA ADMIN USERS COMPLETO');
  console.log('===========================================');
  
  try {
    // 1. Crear schema SQL
    const adminSchema = generateAdminUsersSchema();
    fs.writeFileSync('./ADMIN-USERS-SCHEMA-COMPLETO.sql', adminSchema);
    
    // 2. Crear API endpoints
    const adminAPI = generateAdminUsersAPI();
    fs.writeFileSync('./backend/routes/admin-users-complete.js', adminAPI);
    
    // 3. Crear middleware de permisos
    const permissionsMiddleware = `// Middleware verificación permisos granulares
const { query } = require('../database');

async function checkPermission(resource, action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const hasPermission = await query(
        'SELECT user_has_permission($1, $2, $3) as has_permission',
        [userId, resource, action]
      );
      
      if (!hasPermission.rows[0].has_permission) {
        return res.status(403).json({
          success: false,
          error: \`Sin permisos para \${action} en \${resource}\`
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error verificando permisos' });
    }
  };
}

module.exports = { checkPermission };`;
    
    fs.writeFileSync('./backend/middleware/permissions.js', permissionsMiddleware);
    
    console.log('\\n✅ ADMIN USERS SISTEMA COMPLETADO');
    console.log('================================');
    console.log('📁 Archivos creados:');
    console.log('   - ADMIN-USERS-SCHEMA-COMPLETO.sql');
    console.log('   - backend/routes/admin-users-complete.js');
    console.log('   - backend/middleware/permissions.js');
    
    console.log('\\n👥 ROLES IMPLEMENTADOS:');
    console.log('   ✅ super_admin - Acceso total');
    console.log('   ✅ admin - Gestión operativa completa');
    console.log('   ✅ manager - Supervisión y reportes');
    console.log('   ✅ agent - Operaciones de ventas');
    console.log('   ✅ readonly - Solo consulta');
    console.log('   ✅ marketing - Gestión marketing');
    console.log('   ✅ finance - Gestión financiera');
    
    console.log('\\n🔑 PERMISOS GRANULARES:');
    console.log('   ✅ users:create/read/update/delete');
    console.log('   ✅ clients:create/read/update/delete/export');
    console.log('   ✅ bookings:create/read/update/delete/confirm');
    console.log('   ✅ packages:create/read/update/delete/publish');
    console.log('   ✅ analytics:read/advanced/financial');
    console.log('   ✅ reports:read/create/export/financial');
    
    return {
      status: 'completed',
      roles: ['super_admin', 'admin', 'manager', 'agent', 'readonly', 'marketing', 'finance'],
      permissions: 25,
      files: [
        'ADMIN-USERS-SCHEMA-COMPLETO.sql',
        'backend/routes/admin-users-complete.js',
        'backend/middleware/permissions.js'
      ]
    };
    
  } catch (error) {
    console.error('❌ Error implementando admin users:', error);
    return { status: 'error', error: error.message };
  }
}

// Ejecutar implementación
if (require.main === module) {
  implementCompleteAdminUsers();
}

module.exports = {
  implementCompleteAdminUsers,
  generateAdminUsersSchema,
  generateAdminUsersAPI
};
