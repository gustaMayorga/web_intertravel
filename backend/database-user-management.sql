-- =====================================================
-- SISTEMA DE GESTIÓN DE USUARIOS Y MÓDULOS - INTERTRAVEL
-- Versión: 1.0
-- Fecha: 2025-01-02
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA DE MÓDULOS DISPONIBLES
-- =====================================================
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,           -- dashboard, packages, bookings, etc.
    display_name VARCHAR(200) NOT NULL,          -- "Dashboard Principal"
    description TEXT,
    icon VARCHAR(50),                            -- lucide icon name
    route VARCHAR(200),                          -- /admin/dashboard
    category VARCHAR(100) DEFAULT 'general',     -- core, business, reports, settings
    sort_order INTEGER DEFAULT 999,
    is_active BOOLEAN DEFAULT true,
    is_core BOOLEAN DEFAULT false,               -- módulos core no se pueden desactivar
    required_role VARCHAR(50),                   -- rol mínimo requerido
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLA DE PERMISOS POR MÓDULO
-- =====================================================
CREATE TABLE IF NOT EXISTS module_permissions (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,       -- view, create, edit, delete, manage, export
    display_name VARCHAR(200) NOT NULL,          -- "Ver", "Crear", "Editar"
    description TEXT,
    is_default BOOLEAN DEFAULT false,            -- permiso por defecto para el módulo
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, permission_name)
);

-- =====================================================
-- TABLA DE ROLES DE USUARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,           -- super_admin, admin_agencia, operador
    display_name VARCHAR(200) NOT NULL,          -- "Super Administrador"
    description TEXT,
    level INTEGER NOT NULL DEFAULT 1,            -- nivel jerárquico (1=más alto)
    color VARCHAR(7) DEFAULT '#3B82F6',          -- color para UI
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLA DE USUARIOS EXTENDIDA
-- =====================================================
CREATE TABLE IF NOT EXISTS users_extended (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Información de roles y estado
    role_id INTEGER REFERENCES user_roles(id),
    agency VARCHAR(200) DEFAULT 'InterTravel',
    department VARCHAR(100),
    position VARCHAR(100),
    
    -- Estado y configuración
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    must_change_password BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    last_activity TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    
    -- Configuración personal
    language VARCHAR(10) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Mendoza',
    theme VARCHAR(20) DEFAULT 'light',
    
    -- Auditoría
    created_by INTEGER REFERENCES users_extended(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES users_extended(id),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLA DE MÓDULOS ASIGNADOS A USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_modules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_extended(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    
    -- Permisos específicos (JSON)
    permissions JSONB DEFAULT '{}',               -- {"view": true, "edit": false, "create": true}
    
    -- Configuración del módulo para el usuario
    is_enabled BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,              -- módulo marcado como favorito
    custom_settings JSONB DEFAULT '{}',           -- configuraciones personalizadas
    
    -- Auditoría
    assigned_by INTEGER REFERENCES users_extended(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES users_extended(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, module_id)
);

-- =====================================================
-- TABLA DE SESIONES DE USUARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS user_sessions_extended (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_extended(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    token_type VARCHAR(50) DEFAULT 'access',     -- access, refresh
    
    -- Información de la sesión
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),                     -- desktop, mobile, tablet
    browser VARCHAR(100),
    os VARCHAR(100),
    location_country VARCHAR(2),
    location_city VARCHAR(100),
    
    -- Vigencia
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABLA DE LOGS DE AUDITORÍA
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_extended(id),
    action VARCHAR(100) NOT NULL,                -- login, logout, create_user, assign_module
    entity_type VARCHAR(100),                    -- user, module, permission
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices en modules
CREATE INDEX IF NOT EXISTS idx_modules_name ON modules(name);
CREATE INDEX IF NOT EXISTS idx_modules_active ON modules(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_category ON modules(category);

-- Índices en users_extended
CREATE INDEX IF NOT EXISTS idx_users_username ON users_extended(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users_extended(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users_extended(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users_extended(role_id);

-- Índices en user_modules
CREATE INDEX IF NOT EXISTS idx_user_modules_user ON user_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_module ON user_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_enabled ON user_modules(is_enabled);

-- Índices en user_sessions_extended
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions_extended(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions_extended(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions_extended(is_active);

-- Índices en audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS PARA AUDITORÍA AUTOMÁTICA
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_extended_updated_at BEFORE UPDATE ON users_extended 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_modules_updated_at BEFORE UPDATE ON user_modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES: ROLES DE USUARIO
-- =====================================================
INSERT INTO user_roles (name, display_name, description, level, color) VALUES
    ('super_admin', 'Super Administrador', 'Acceso completo al sistema, gestión de usuarios y módulos', 1, '#DC2626'),
    ('admin_agencia', 'Administrador de Agencia', 'Gestión operativa completa de la agencia', 2, '#2563EB'),
    ('operador', 'Operador', 'Operaciones diarias: reservas, clientes, paquetes básicos', 3, '#059669'),
    ('analista', 'Analista', 'Acceso a analytics, reportes y métricas', 4, '#7C3AED'),
    ('contador', 'Contador', 'Gestión contable y financiera', 4, '#EA580C'),
    ('solo_lectura', 'Solo Lectura', 'Acceso de solo lectura a módulos asignados', 5, '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: MÓDULOS DEL SISTEMA
-- =====================================================
INSERT INTO modules (name, display_name, description, icon, route, category, sort_order, is_core, required_role) VALUES
    -- Módulos Core (obligatorios)
    ('dashboard', 'Dashboard Principal', 'Panel principal con métricas y resumen', 'LayoutDashboard', '/admin/dashboard', 'core', 1, true, null),
    ('profile', 'Mi Perfil', 'Configuración personal del usuario', 'User', '/admin/profile', 'core', 2, true, null),
    
    -- Módulos de Negocio
    ('packages', 'Gestión de Paquetes', 'Crear, editar y gestionar paquetes turísticos', 'Package', '/admin/packages', 'business', 10, false, null),
    ('destinations', 'Gestión de Destinos', 'Administrar destinos y coordenadas', 'MapPin', '/admin/destinations', 'business', 11, false, null),
    ('bookings', 'Reservas', 'Gestionar todas las reservas y cotizaciones', 'Calendar', '/admin/bookings', 'business', 12, false, null),
    ('crm', 'CRM', 'Gestión de clientes, leads y pipeline de ventas', 'Building', '/admin/crm', 'business', 13, false, null),
    ('passengers', 'Pasajeros', 'Gestión de información de pasajeros', 'Users', '/admin/passengers', 'business', 14, false, null),
    
    -- Módulos de Analytics
    ('analytics', 'Analytics BI', 'Business Intelligence y análisis avanzado', 'BarChart3', '/admin/analytics', 'analytics', 20, false, 'analista'),
    ('reports', 'Reportes', 'Generación y gestión de reportes', 'FileText', '/admin/reports', 'analytics', 21, false, null),
    ('priority', 'Priorización', 'Gestión de palabras clave y prioridades', 'Star', '/admin/priority', 'analytics', 22, false, 'admin_agencia'),
    
    -- Módulos Financieros
    ('accounting', 'Contabilidad', 'Gestión contable y financiera', 'DollarSign', '/admin/accounting', 'financial', 30, false, 'contador'),
    ('payments', 'Pagos', 'Gestión de pagos y transacciones', 'CreditCard', '/admin/payments', 'financial', 31, false, 'contador'),
    ('commissions', 'Comisiones', 'Cálculo y gestión de comisiones', 'TrendingUp', '/admin/commissions', 'financial', 32, false, 'contador'),
    
    -- Módulos de Administración
    ('users', 'Gestión de Usuarios', 'Crear y gestionar usuarios del sistema', 'UserCog', '/admin/users', 'admin', 40, false, 'super_admin'),
    ('permissions', 'Permisos', 'Configuración de permisos y accesos', 'Shield', '/admin/permissions', 'admin', 41, false, 'super_admin'),
    ('module_config', 'Configuración de Módulos', 'Gestionar módulos disponibles', 'Settings', '/admin/module-config', 'admin', 42, false, 'super_admin'),
    
    -- Módulos de Configuración
    ('settings', 'Configuración', 'Configuración general del sistema', 'Settings', '/admin/settings', 'settings', 50, false, 'admin_agencia'),
    ('integrations', 'Integraciones', 'Gestión de integraciones externas', 'Zap', '/admin/integrations', 'settings', 51, false, 'admin_agencia'),
    ('whatsapp', 'WhatsApp', 'Configuración de WhatsApp Business', 'MessageCircle', '/admin/whatsapp', 'settings', 52, false, null),
    ('fallback', 'Fallback Config', 'Configuración de datos de fallback', 'Database', '/admin/fallback', 'settings', 53, false, 'admin_agencia'),
    
    -- Módulos de Debug (solo desarrollo)
    ('debug', 'Debug', 'Herramientas de desarrollo y debug', 'Bug', '/admin/debug', 'debug', 60, false, 'super_admin')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- DATOS INICIALES: PERMISOS POR MÓDULO
-- =====================================================
INSERT INTO module_permissions (module_id, permission_name, display_name, description, is_default) 
SELECT 
    m.id,
    p.permission_name,
    p.display_name,
    p.description,
    p.is_default
FROM modules m
CROSS JOIN (
    VALUES 
        ('view', 'Ver', 'Acceso de lectura al módulo', true),
        ('create', 'Crear', 'Crear nuevos elementos', false),
        ('edit', 'Editar', 'Modificar elementos existentes', false),
        ('delete', 'Eliminar', 'Eliminar elementos', false),
        ('export', 'Exportar', 'Exportar datos', false),
        ('manage', 'Gestionar', 'Gestión completa del módulo', false)
) AS p(permission_name, display_name, description, is_default)
WHERE m.name IN ('packages', 'destinations', 'bookings', 'crm', 'passengers', 'reports', 'accounting', 'payments', 'users', 'settings')
ON CONFLICT (module_id, permission_name) DO NOTHING;

-- Permisos específicos para analytics
INSERT INTO module_permissions (module_id, permission_name, display_name, description, is_default)
SELECT m.id, 'view', 'Ver Analytics', 'Ver dashboards y métricas', true
FROM modules m WHERE m.name = 'analytics'
ON CONFLICT (module_id, permission_name) DO NOTHING;

INSERT INTO module_permissions (module_id, permission_name, display_name, description, is_default)
SELECT m.id, 'advanced', 'Analytics Avanzado', 'Acceso a métricas avanzadas y BI', false
FROM modules m WHERE m.name = 'analytics'
ON CONFLICT (module_id, permission_name) DO NOTHING;

-- Permisos para módulos core (solo view)
INSERT INTO module_permissions (module_id, permission_name, display_name, description, is_default)
SELECT m.id, 'view', 'Acceso', 'Acceso al módulo', true
FROM modules m WHERE m.name IN ('dashboard', 'profile')
ON CONFLICT (module_id, permission_name) DO NOTHING;

-- =====================================================
-- USUARIO SUPER ADMIN INICIAL
-- =====================================================
INSERT INTO users_extended (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role_id, 
    is_active, 
    is_verified,
    created_at
) VALUES (
    'admin',
    'admin@intertravel.com.ar',
    '$2b$10$rOhzN.vlXO9H1Zt1j0BxVeQVvLxGbdYFgfrBwfvEOcTQOqIQBYhPS', -- admin123
    'Administrador',
    'Principal',
    (SELECT id FROM user_roles WHERE name = 'super_admin'),
    true,
    true,
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- ASIGNAR TODOS LOS MÓDULOS AL SUPER ADMIN
-- =====================================================
INSERT INTO user_modules (user_id, module_id, permissions, is_enabled, assigned_by, assigned_at)
SELECT 
    u.id,
    m.id,
    '{"view": true, "create": true, "edit": true, "delete": true, "export": true, "manage": true, "advanced": true}',
    true,
    u.id,
    NOW()
FROM users_extended u
CROSS JOIN modules m
WHERE u.username = 'admin'
ON CONFLICT (user_id, module_id) DO NOTHING;

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener módulos de un usuario
CREATE OR REPLACE FUNCTION get_user_modules(p_user_id INTEGER)
RETURNS TABLE(
    module_name VARCHAR,
    display_name VARCHAR,
    icon VARCHAR,
    route VARCHAR,
    permissions JSONB,
    is_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name,
        m.display_name,
        m.icon,
        m.route,
        um.permissions,
        um.is_enabled
    FROM user_modules um
    JOIN modules m ON um.module_id = m.id
    WHERE um.user_id = p_user_id 
      AND um.is_enabled = true 
      AND m.is_active = true
    ORDER BY m.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_module_name VARCHAR,
    p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    SELECT 
        COALESCE((um.permissions->>p_permission)::boolean, false)
    INTO has_permission
    FROM user_modules um
    JOIN modules m ON um.module_id = m.id
    WHERE um.user_id = p_user_id 
      AND m.name = p_module_name
      AND um.is_enabled = true
      AND m.is_active = true;
    
    RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Crear comentarios en las tablas
COMMENT ON TABLE modules IS 'Módulos disponibles en el sistema';
COMMENT ON TABLE module_permissions IS 'Permisos disponibles por módulo';
COMMENT ON TABLE user_roles IS 'Roles de usuario con diferentes niveles de acceso';
COMMENT ON TABLE users_extended IS 'Usuarios del sistema con información extendida';
COMMENT ON TABLE user_modules IS 'Asignación de módulos a usuarios con permisos específicos';
COMMENT ON TABLE user_sessions_extended IS 'Sesiones activas de usuarios con información detallada';
COMMENT ON TABLE audit_logs IS 'Logs de auditoría para todas las acciones del sistema';

-- Mostrar resumen
SELECT 'Base de datos de gestión de usuarios y módulos creada exitosamente' AS status;
SELECT COUNT(*) AS total_modules FROM modules;
SELECT COUNT(*) AS total_roles FROM user_roles;
SELECT COUNT(*) AS total_permissions FROM module_permissions;
