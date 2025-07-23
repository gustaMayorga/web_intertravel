-- ===============================================
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
