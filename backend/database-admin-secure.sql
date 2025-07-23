-- ===============================================
-- BASE DE DATOS ADMINISTRATIVA SEGURA - INTERTRAVEL
-- Solución para fragmentación de arquitectura
-- ===============================================

-- ===============================================
-- TABLA DE USUARIOS ADMINISTRATIVOS
-- ===============================================

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
    permissions JSONB DEFAULT '["read"]',
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- TABLA DE SESIONES ACTIVAS
-- ===============================================

CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- ===============================================
-- TABLA DE AUDITORÍA DE ACCIONES
-- ===============================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- TABLA PARA CONTENIDO CMS
-- ===============================================

CREATE TABLE IF NOT EXISTS cms_content (
    id SERIAL PRIMARY KEY,
    content_key VARCHAR(100) UNIQUE NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    title VARCHAR(200),
    content TEXT,
    metadata JSONB,
    is_published BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES admin_users(id),
    updated_by INTEGER REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- TABLA PARA GESTIÓN DE MEDIOS
-- ===============================================

CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    uploaded_by INTEGER REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- ÍNDICES PARA PERFORMANCE
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active ON admin_sessions(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_user_id ON admin_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_log(action);

CREATE INDEX IF NOT EXISTS idx_cms_content_key ON cms_content(content_key);
CREATE INDEX IF NOT EXISTS idx_cms_content_published ON cms_content(is_published);

CREATE INDEX IF NOT EXISTS idx_media_files_active ON media_files(is_active);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);

-- ===============================================
-- DATOS INICIALES DE ADMINISTRADORES
-- ===============================================

-- Insertar usuario administrador por defecto (password: admin123)
INSERT INTO admin_users (
    username, 
    email, 
    password_hash, 
    role, 
    permissions
) VALUES (
    'admin', 
    'admin@intertravel.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/aAHILCz.3vGWN6p7.', -- admin123
    'super_admin',
    '["read", "write", "delete", "manage_users", "manage_cms", "manage_media"]'
) ON CONFLICT (username) DO NOTHING;

-- Insertar usuario manager por defecto (password: manager123)
INSERT INTO admin_users (
    username, 
    email, 
    password_hash, 
    role, 
    permissions
) VALUES (
    'manager', 
    'manager@intertravel.com', 
    '$2b$12$EixZSuWP1oFaVYzHZ8.CAOvJVCJRO8KQGvWuJ1DQrE4WcHb2Lm7Ka', -- manager123
    'admin',
    '["read", "write", "manage_cms"]'
) ON CONFLICT (username) DO NOTHING;

-- ===============================================
-- CONTENIDO CMS INICIAL
-- ===============================================

INSERT INTO cms_content (
    content_key,
    content_type,
    title,
    content,
    is_published,
    created_by
) VALUES 
(
    'homepage_hero_title',
    'text',
    'Título Hero Homepage',
    'Viajá más, gastá menos con InterTravel',
    true,
    1
),
(
    'homepage_hero_subtitle',
    'text',
    'Subtítulo Hero Homepage',
    'Tu agencia de viajes de confianza desde 2015',
    true,
    1
),
(
    'whatsapp_number',
    'text',
    'Número WhatsApp',
    '+5411987654321',
    true,
    1
),
(
    'whatsapp_message',
    'text',
    'Mensaje WhatsApp por defecto',
    'Hola! Me interesa conocer más sobre los paquetes de viaje',
    true,
    1
),
(
    'featured_packages',
    'json',
    'Paquetes Destacados',
    '["bariloche-2025", "cancun-verano", "europa-clasica"]',
    true,
    1
) ON CONFLICT (content_key) DO NOTHING;

-- ===============================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- ===============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cms_content_updated_at ON cms_content;
CREATE TRIGGER update_cms_content_updated_at
    BEFORE UPDATE ON cms_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- FUNCIÓN PARA LIMPIAR SESIONES EXPIRADAS
-- ===============================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP 
    OR last_activity < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO admin_activity_log (
        user_id, action, details, success
    ) VALUES (
        NULL, 'cleanup_sessions', 
        jsonb_build_object('deleted_sessions', deleted_count),
        true
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ===============================================

COMMENT ON TABLE admin_users IS 'Usuarios administrativos del sistema';
COMMENT ON TABLE admin_sessions IS 'Sesiones activas de usuarios admin';
COMMENT ON TABLE admin_activity_log IS 'Log de auditoría de acciones administrativas';
COMMENT ON TABLE cms_content IS 'Contenido editable desde panel administrativo';
COMMENT ON TABLE media_files IS 'Archivos multimedia gestionados desde admin';

COMMENT ON COLUMN admin_users.role IS 'Roles: super_admin, admin, manager, viewer';
COMMENT ON COLUMN admin_users.permissions IS 'Array JSON de permisos específicos';
COMMENT ON COLUMN admin_sessions.session_token IS 'Token JWT de la sesión';
COMMENT ON COLUMN cms_content.content_key IS 'Clave única para identificar contenido';

-- ===============================================
-- VERIFICACIÓN FINAL
-- ===============================================

SELECT 'Base de datos administrativa creada exitosamente' as status,
       COUNT(*) as admin_users_count
FROM admin_users;
