-- INTERTRAVEL - CORRECCIÓN FASE 1
-- Tabla admin_users y usuario por defecto
-- Fecha: 2025-07-22T00:50:00.000Z

-- FASE 1: CREAR TABLA admin_users Y USUARIO POR DEFECTO
-- =====================================================

-- 1. Crear tabla admin_users si no existe
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    full_name VARCHAR(255),
    permissions JSONB DEFAULT '["all"]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. Verificar si ya existe un admin, si no, creamos uno
-- (El hash es para password 'admin123' con bcrypt)
INSERT INTO admin_users (username, email, password_hash, role, full_name, is_active)
SELECT 'admin', 'admin@intertravel.com.ar', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrador InterTravel', true
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');

-- 3. Verificar resultado
SELECT id, username, email, role, full_name, is_active, created_at 
FROM admin_users 
WHERE username = 'admin';
