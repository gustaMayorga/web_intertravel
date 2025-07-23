-- SOLUCION PASO 1: CREAR TABLA ADMIN_USERS Y USUARIO REAL

-- Crear tabla separada para administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'super_admin',
  full_name VARCHAR(255),
  permissions JSONB DEFAULT '["all"]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Crear usuario admin real para Gustavo
INSERT INTO admin_users (username, email, password_hash, role, full_name, permissions, is_active)
VALUES (
  'gustavo.mayorga@intertravel.com.ar',
  'gustavo.mayorga@intertravel.com.ar', 
  '$2b$10$vIUFTrgTGvXyVIx9nUzb3e9PRmklRttpglxSGdoDAhiK9F7gElVjK',
  'super_admin',
  'Gustavo Mayorga',
  '["all", "users", "bookings", "agencies", "reports", "settings"]',
  true
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = CURRENT_TIMESTAMP;

-- Verificar que se creo correctamente
SELECT id, username, email, role, full_name, is_active, created_at 
FROM admin_users 
WHERE email = 'gustavo.mayorga@intertravel.com.ar';
