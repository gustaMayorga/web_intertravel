-- ===============================================
-- SCHEMA COMPLETO PARA GESTIÓN DE USUARIOS
-- Base de datos para sistema admin InterTravel
-- ===============================================

-- Tabla principal de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    
    -- Información personal
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(255),
    
    -- Autenticación
    password_hash VARCHAR(255) NOT NULL,
    
    -- Roles y permisos
    role VARCHAR(50) DEFAULT 'customer',
    status VARCHAR(20) DEFAULT 'pending',
    permissions JSONB DEFAULT '[]',
    
    -- Datos de agencia (para rol agency)
    agency_data JSONB DEFAULT NULL,
    
    -- Métricas de uso
    last_login TIMESTAMP NULL,
    login_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    
    -- Notas administrativas
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones activas
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de permisos disponibles (para referencia)
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp en users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at_column();

-- ===============================================
-- DATOS DE PERMISOS DISPONIBLES
-- ===============================================

INSERT INTO permissions (name, description, module) VALUES 
-- Usuarios
('users:view', 'Ver usuarios', 'users'),
('users:create', 'Crear usuarios', 'users'),
('users:update', 'Editar usuarios', 'users'),
('users:delete', 'Eliminar usuarios', 'users'),
('users:reset_password', 'Resetear contraseñas', 'users'),

-- Clientes
('clients:view', 'Ver clientes', 'clients'),
('clients:create', 'Crear clientes', 'clients'),
('clients:update', 'Editar clientes', 'clients'),
('clients:delete', 'Eliminar clientes', 'clients'),
('clients:export', 'Exportar clientes', 'clients'),

-- Reservas
('bookings:view', 'Ver reservas', 'bookings'),
('bookings:create', 'Crear reservas', 'bookings'),
('bookings:update', 'Editar reservas', 'bookings'),
('bookings:delete', 'Eliminar reservas', 'bookings'),
('bookings:cancel', 'Cancelar reservas', 'bookings'),

-- Paquetes
('packages:view', 'Ver paquetes', 'packages'),
('packages:create', 'Crear paquetes', 'packages'),
('packages:update', 'Editar paquetes', 'packages'),
('packages:delete', 'Eliminar paquetes', 'packages'),
('packages:publish', 'Publicar paquetes', 'packages'),

-- Reportes
('reports:view', 'Ver reportes', 'reports'),
('reports:create', 'Crear reportes', 'reports'),
('reports:export', 'Exportar reportes', 'reports'),

-- Sistema
('system:config', 'Configurar sistema', 'system'),
('system:backup', 'Hacer backups', 'system'),
('system:audit', 'Ver auditoría', 'system'),
('system:security', 'Gestión de seguridad', 'system')

ON CONFLICT (name) DO NOTHING;

-- ===============================================
-- DATOS DE USUARIOS DE EJEMPLO
-- ===============================================

INSERT INTO users (
    name, email, phone, role, status, location, password_hash,
    permissions, agency_data, notes, login_count, bookings_count
) VALUES 

-- Super Admin
(
    'Diego Administrador',
    'diego@intertravel.com',
    '+54 9 261 555-0001',
    'super_admin',
    'active',
    'Mendoza, Argentina',
    '$2b$10$rQ7UaBF8z8YR7K3NX.ZYoOgZj2UZ8vPWpJ8VwqV0eFKzK5lNH6W1G', -- admin123
    '["*"]',
    NULL,
    'Usuario administrador principal del sistema',
    234,
    0
),

-- Admin
(
    'Roberto Admin',
    'roberto@intertravel.com',
    '+54 9 11 9876-5432',
    'admin',
    'active',
    'Buenos Aires, Argentina',
    '$2b$10$rQ7UaBF8z8YR7K3NX.ZYoOgZj2UZ8vPWpJ8VwqV0eFKzK5lNH6W1G', -- admin123
    '["users:view", "users:create", "users:update", "clients:view", "clients:create", "clients:update", "clients:delete", "bookings:view", "bookings:create", "bookings:update", "bookings:cancel", "packages:view", "packages:create", "packages:update", "reports:view", "reports:create"]',
    NULL,
    'Administrador de operaciones',
    156,
    0
),

-- Agencia
(
    'María González',
    'maria@travelagency.com',
    '+54 9 11 1234-5678',
    'agency',
    'active',
    'Buenos Aires, Argentina',
    '$2b$10$rQ7UaBF8z8YR7K3NX.ZYoOgZj2UZ8vPWpJ8VwqV0eFKzK5lNH6W1G', -- admin123
    '["bookings:view", "bookings:create", "clients:view", "clients:create", "packages:view", "reports:view"]',
    '{"name": "Travel Dreams Agency", "code": "TDA001", "commission": 12, "contact_person": "María González", "address": "Av. Corrientes 1234, Buenos Aires"}',
    'Agencia partner premium',
    89,
    15
),

-- Manager
(
    'Luis Manager',
    'luis@intertravel.com',
    '+54 9 261 444-0001',
    'manager',
    'active',
    'Mendoza, Argentina',
    '$2b$10$rQ7UaBF8z8YR7K3NX.ZYoOgZj2UZ8vPWpJ8VwqV0eFKzK5lNH6W1G', -- admin123
    '["clients:view", "clients:create", "clients:update", "bookings:view", "bookings:create", "bookings:update", "packages:view", "reports:view"]',
    NULL,
    'Manager de operaciones diarias',
    78,
    0
),

-- Operador
(
    'Carlos Operador',
    'carlos@intertravel.com',
    '+54 9 261 555-0123',
    'operator',
    'active',
    'Mendoza, Argentina',
    '$2b$10$rQ7UaBF8z8YR7K3NX.ZYoOgZj2UZ8vPWpJ8VwqV0eFKzK5lNH6W1G', -- admin123
    '["bookings:view", "bookings:create", "clients:view", "clients:create", "packages:view"]',
    NULL,
    'Operador de reservas',
    45,
    67
),

-- Cliente
(
    'Ana Silva',
    'ana@example.com',
    '+55 21 99999-8888',
    'customer',
    'pending',
    'Río de Janeiro, Brasil',
    '$2b$10$rQ7UaBF8z8YR7K3NX.ZYoOgZj2UZ8vPWpJ8VwqV0eFKzK5lNH6W1G', -- admin123
    '["bookings:view", "packages:view"]',
    NULL,
    'Cliente nuevo pendiente de activación',
    0,
    0
)

ON CONFLICT (email) DO NOTHING;

-- ===============================================
-- VISTAS ÚTILES PARA REPORTING
-- ===============================================

-- Vista de usuarios activos con estadísticas
CREATE OR REPLACE VIEW users_active_stats AS
SELECT 
    id,
    name,
    email,
    role,
    status,
    location,
    login_count,
    bookings_count,
    CASE 
        WHEN login_count > 100 THEN 'Alto'
        WHEN login_count > 20 THEN 'Medio'
        ELSE 'Bajo'
    END as activity_level,
    CASE 
        WHEN role = 'agency' THEN 'B2B Partner'
        WHEN role IN ('super_admin', 'admin', 'manager') THEN 'Staff'
        ELSE 'Cliente'
    END as user_type,
    DATE_PART('day', NOW() - created_at) as days_since_registration,
    created_at
FROM users 
WHERE status = 'active'
ORDER BY login_count DESC, created_at DESC;

-- Vista de estadísticas por rol
CREATE OR REPLACE VIEW users_role_stats AS
SELECT 
    role,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE status = 'active') as active_users,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_users,
    AVG(login_count) as avg_logins,
    SUM(bookings_count) as total_bookings,
    MIN(created_at) as first_user_date,
    MAX(created_at) as latest_user_date
FROM users 
WHERE status != 'deleted'
GROUP BY role
ORDER BY total_users DESC;

-- Vista de agencias con detalles
CREATE OR REPLACE VIEW agencies_details AS
SELECT 
    u.id,
    u.name as contact_name,
    u.email,
    u.phone,
    u.status,
    u.login_count,
    u.bookings_count,
    (u.agency_data->>'name') as agency_name,
    (u.agency_data->>'code') as agency_code,
    (u.agency_data->>'commission')::numeric as commission_rate,
    (u.agency_data->>'address') as agency_address,
    u.created_at
FROM users u
WHERE u.role = 'agency'
ORDER BY u.bookings_count DESC, u.created_at DESC;

-- Función para buscar usuarios
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(20),
    match_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        (
            CASE WHEN u.name ILIKE '%' || search_term || '%' THEN 3 ELSE 0 END +
            CASE WHEN u.email ILIKE '%' || search_term || '%' THEN 2 ELSE 0 END +
            CASE WHEN u.location ILIKE '%' || search_term || '%' THEN 1 ELSE 0 END
        )::REAL as match_score
    FROM users u
    WHERE 
        u.status != 'deleted' AND
        (
            u.name ILIKE '%' || search_term || '%' OR
            u.email ILIKE '%' || search_term || '%' OR
            u.location ILIKE '%' || search_term || '%'
        )
    ORDER BY match_score DESC, u.name;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- FUNCIONES DE SEGURIDAD
-- ===============================================

-- Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar tokens de reset expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===============================================

COMMENT ON TABLE users IS 'Tabla principal de usuarios del sistema InterTravel';
COMMENT ON COLUMN users.permissions IS 'Permisos específicos del usuario en formato JSON';
COMMENT ON COLUMN users.agency_data IS 'Datos de la agencia (solo para rol agency) en formato JSON';
COMMENT ON TABLE user_sessions IS 'Sesiones activas de usuarios para gestión de autenticación';
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperación de contraseñas';
COMMENT ON TABLE permissions IS 'Catálogo de permisos disponibles en el sistema';

-- Verificación final
SELECT 'Schema de usuarios creado exitosamente' as status;

-- Mostrar estadísticas finales
SELECT 
    'Usuarios creados: ' || COUNT(*) as info
FROM users
UNION ALL
SELECT 
    'Permisos disponibles: ' || COUNT(*) as info
FROM permissions;