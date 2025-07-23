-- ===============================================
-- ESQUEMA COMPLETO BASE DE DATOS INTERTRAVEL
-- ===============================================
-- Sistema production-ready con todas las tablas

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===============================================
-- TABLAS DE USUARIOS Y AUTENTICACIÓN
-- ===============================================

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de agencias
CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(50),
  address TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'active',
  api_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id INTEGER REFERENCES roles(id),
  agency_id INTEGER REFERENCES agencies(id),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- CONFIGURACIÓN DEL SISTEMA
-- ===============================================

CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  data_type VARCHAR(20) DEFAULT 'string',
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  UNIQUE(category, key)
);

-- ===============================================
-- PAQUETES Y DESTINOS
-- ===============================================

-- Tabla de países
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(3) UNIQUE NOT NULL,
  currency VARCHAR(3),
  is_active BOOLEAN DEFAULT true
);

-- Tabla de destinos
CREATE TABLE IF NOT EXISTS destinations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  country_id INTEGER REFERENCES countries(id),
  description TEXT,
  coordinates POINT,
  timezone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías de paquetes
CREATE TABLE IF NOT EXISTS package_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Tabla de paquetes
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(100) UNIQUE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  destination_id INTEGER REFERENCES destinations(id),
  category_id INTEGER REFERENCES package_categories(id),
  price_amount DECIMAL(10,2) NOT NULL,
  price_currency VARCHAR(3) DEFAULT 'USD',
  duration_days INTEGER,
  duration_nights INTEGER,
  max_travelers INTEGER,
  min_travelers INTEGER DEFAULT 1,
  includes JSONB DEFAULT '[]',
  excludes JSONB DEFAULT '[]',
  itinerary JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  highlights JSONB DEFAULT '[]',
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  provider VARCHAR(100),
  provider_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- RESERVAS Y PAGOS
-- ===============================================

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(200) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  document_type VARCHAR(20),
  document_number VARCHAR(50),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  package_id INTEGER REFERENCES packages(id),
  customer_id INTEGER REFERENCES customers(id),
  agency_id INTEGER REFERENCES agencies(id),
  travelers_count INTEGER NOT NULL,
  travelers_data JSONB DEFAULT '[]',
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  deposit_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  travel_date DATE,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  payment_reference VARCHAR(100) UNIQUE,
  provider VARCHAR(50) NOT NULL, -- 'mercadopago', 'stripe', etc.
  provider_transaction_id VARCHAR(200),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_data JSONB,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- SISTEMA B2B2C (AGENCIAS)
-- ===============================================

-- Tabla de asignaciones de agencia
CREATE TABLE IF NOT EXISTS agency_assignments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  agency_id INTEGER REFERENCES agencies(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assignment_score DECIMAL(5,2),
  assignment_criteria JSONB,
  status VARCHAR(50) DEFAULT 'active'
);

-- Tabla de comisiones
CREATE TABLE IF NOT EXISTS agency_commissions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  agency_id INTEGER REFERENCES agencies(id),
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- SISTEMA DE INTEGRACIONES
-- ===============================================

-- Tabla de logs de integraciones
CREATE TABLE IF NOT EXISTS integration_logs (
  id SERIAL PRIMARY KEY,
  integration_name VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  execution_time INTEGER, -- en millisegundos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración de integraciones
CREATE TABLE IF NOT EXISTS integration_config (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- SISTEMA DE FIDELIZACIÓN Y LOYALTY
-- ===============================================

-- Tabla de fidelización de usuarios
CREATE TABLE IF NOT EXISTS user_loyalty (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  points_balance INTEGER DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'bronze',
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones de puntos
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  booking_id INTEGER REFERENCES bookings(id),
  points_earned INTEGER DEFAULT 0,
  points_redeemed INTEGER DEFAULT 0,
  transaction_type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- ÍNDICES PARA PERFORMANCE
-- ===============================================

-- Índices de usuarios
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Índices de configuración
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS idx_system_config_active ON system_config(is_active);

-- Índices de paquetes
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_featured ON packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination_id);
CREATE INDEX IF NOT EXISTS idx_packages_price ON packages(price_amount);

-- Índices de reservas
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agency ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(travel_date);

-- Índices de pagos
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);

-- ===============================================
-- DATOS INICIALES
-- ===============================================

-- Insertar roles por defecto
INSERT INTO roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Administrador', 'Acceso completo al sistema', '["admin:full", "users:full", "settings:full", "packages:full", "bookings:full"]'),
('admin', 'Administrador', 'Administrador general', '["admin:read", "users:manage", "settings:manage", "packages:manage", "bookings:read"]'),
('admin_agencia', 'Admin Agencia', 'Administrador de agencia', '["admin:read", "bookings:manage", "packages:read", "customers:manage"]'),
('user', 'Usuario', 'Usuario estándar', '["dashboard:read", "profile:manage"]')
ON CONFLICT (name) DO NOTHING;

-- Insertar agencia principal
INSERT INTO agencies (name, code, email, commission_rate, api_key) VALUES
('InterTravel', 'INTERTRAVEL', 'admin@intertravel.com', 15.00, 'itv_' || encode(gen_random_bytes(16), 'hex'))
ON CONFLICT (code) DO NOTHING;

-- Insertar usuario admin principal
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, agency_id) VALUES
('admin', 'admin@intertravel.com', crypt('admin123', gen_salt('bf')), 'Admin', 'Principal', 
 (SELECT id FROM roles WHERE name = 'super_admin'), 
 (SELECT id FROM agencies WHERE code = 'INTERTRAVEL'))
ON CONFLICT (username) DO NOTHING;

-- Insertar países principales
INSERT INTO countries (name, code, currency) VALUES
('Argentina', 'ARG', 'ARS'),
('Francia', 'FRA', 'EUR'),
('España', 'ESP', 'EUR'),
('Estados Unidos', 'USA', 'USD'),
('Brasil', 'BRA', 'BRL'),
('Chile', 'CHL', 'CLP'),
('Perú', 'PER', 'PEN'),
('México', 'MEX', 'MXN')
ON CONFLICT (code) DO NOTHING;

-- Insertar destinos principales
INSERT INTO destinations (name, country_id, description) VALUES
('Mendoza', (SELECT id FROM countries WHERE code = 'ARG'), 'Capital mundial del vino'),
('Buenos Aires', (SELECT id FROM countries WHERE code = 'ARG'), 'Capital de Argentina'),
('París', (SELECT id FROM countries WHERE code = 'FRA'), 'Ciudad del amor'),
('Madrid', (SELECT id FROM countries WHERE code = 'ESP'), 'Capital de España'),
('Barcelona', (SELECT id FROM countries WHERE code = 'ESP'), 'Ciudad condal'),
('Nueva York', (SELECT id FROM countries WHERE code = 'USA'), 'La gran manzana'),
('Lima', (SELECT id FROM countries WHERE code = 'PER'), 'Capital gastronómica'),
('Machu Picchu', (SELECT id FROM countries WHERE code = 'PER'), 'Maravilla del mundo')
ON CONFLICT DO NOTHING;

-- Insertar categorías de paquetes
INSERT INTO package_categories (name, description) VALUES
('Aventura', 'Paquetes de aventura y deportes extremos'),
('Cultural', 'Viajes culturales y históricos'),
('Gastronómico', 'Experiencias culinarias'),
('Relax', 'Descanso y spa'),
('Romance', 'Viajes románticos'),
('Familia', 'Viajes familiares'),
('Lujo', 'Experiencias de lujo'),
('Ecoturismo', 'Turismo sustentable')
ON CONFLICT (name) DO NOTHING;

-- Insertar configuraciones por defecto del sistema
INSERT INTO system_config (category, key, value, description, data_type, is_public) VALUES
-- Configuración de empresa
('company', 'name', '"InterTravel"', 'Nombre de la empresa', 'string', true),
('company', 'email', '"info@intertravel.com"', 'Email de contacto', 'string', true),
('company', 'phone', '"+54 9 261 123-4567"', 'Teléfono de contacto', 'string', true),
('company', 'address', '"Mendoza, Argentina"', 'Dirección', 'string', true),
('company', 'website', '"https://intertravel.com"', 'Sitio web', 'string', true),

-- Configuración de pagos
('payments', 'enabled', 'true', 'Pagos habilitados', 'boolean', true),
('payments', 'default_currency', '"USD"', 'Moneda por defecto', 'string', true),
('payments', 'accepted_currencies', '["USD", "ARS", "EUR"]', 'Monedas aceptadas', 'array', true),
('payments', 'require_deposit', 'true', 'Requerir depósito', 'boolean', true),
('payments', 'deposit_percentage', '30', 'Porcentaje de depósito', 'number', true),
('payments', 'tax_percentage', '21', 'Porcentaje de impuestos', 'number', true),

-- MercadoPago (CONFIGURAR CON CLAVES REALES)
('payments', 'mercadopago_enabled', 'true', 'MercadoPago habilitado', 'boolean', false),
('payments', 'mercadopago_public_key', '"TEST-your-public-key"', 'MercadoPago Public Key', 'string', false),
('payments', 'mercadopago_access_token', '"TEST-your-access-token"', 'MercadoPago Access Token', 'string', false),

-- Stripe (CONFIGURAR CON CLAVES REALES)
('payments', 'stripe_enabled', 'false', 'Stripe habilitado', 'boolean', false),
('payments', 'stripe_public_key', '"pk_test_your-key"', 'Stripe Public Key', 'string', false),
('payments', 'stripe_secret_key', '"sk_test_your-key"', 'Stripe Secret Key', 'string', false),

-- Integraciones
('integrations', 'whatsapp_enabled', 'true', 'WhatsApp habilitado', 'boolean', true),
('integrations', 'email_enabled', 'true', 'Email habilitado', 'boolean', true),
('integrations', 'analytics_enabled', 'true', 'Analytics habilitado', 'boolean', true),

-- Travel Compositor (CONFIGURAR CON CREDENCIALES REALES)
('integrations', 'travel_compositor_enabled', 'true', 'Travel Compositor habilitado', 'boolean', false),
('integrations', 'travel_compositor_url', '"https://api.travelcompositor.com"', 'URL de Travel Compositor', 'string', false),
('integrations', 'travel_compositor_username', '"your-username"', 'Usuario Travel Compositor', 'string', false),
('integrations', 'travel_compositor_password', '"your-password"', 'Password Travel Compositor', 'string', false)

ON CONFLICT (category, key) DO NOTHING;

-- ===============================================
-- FUNCIONES Y TRIGGERS
-- ===============================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios en tablas
COMMENT ON TABLE users IS 'Usuarios del sistema con roles y agencias';
COMMENT ON TABLE packages IS 'Paquetes turísticos con toda la información';
COMMENT ON TABLE bookings IS 'Reservas de clientes';
COMMENT ON TABLE payments IS 'Pagos procesados por diferentes proveedores';
COMMENT ON TABLE system_config IS 'Configuración centralizada del sistema';
COMMENT ON TABLE integration_logs IS 'Logs de todas las integraciones externas';

-- Mensaje de finalización
DO $$
BEGIN
    RAISE NOTICE 'Base de datos InterTravel configurada exitosamente!';
    RAISE NOTICE 'Esquema completo con todas las tablas necesarias';
    RAISE NOTICE 'Datos iniciales insertados';
    RAISE NOTICE 'Listo para producción!';
END $$;