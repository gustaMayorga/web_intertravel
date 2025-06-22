-- ===============================================
-- SCRIPT DE CORRECCIÓN: ESTRUCTURA DE BASE DE DATOS
-- ===============================================

-- Borrar las tablas problemáticas para recrearlas correctamente
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS transaction_entries CASCADE;
DROP TABLE IF EXISTS accounting_entries CASCADE;
DROP TABLE IF EXISTS accounting_transactions CASCADE;

-- Tabla de órdenes (sin cambios)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  package_id VARCHAR(100) NOT NULL,
  package_title VARCHAR(500) NOT NULL,
  package_destination VARCHAR(255),
  package_duration VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  travelers INTEGER DEFAULT 1,
  payment_method VARCHAR(20) NOT NULL,
  payment_id VARCHAR(255),
  payment_data JSONB,
  special_requests TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  transaction_id VARCHAR(255),
  payment_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT
);

-- Tabla de transacciones de pago (renombrada)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id),
  gateway VARCHAR(20) NOT NULL,
  gateway_transaction_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones contables (diferente)
CREATE TABLE IF NOT EXISTS accounting_transactions (
  id SERIAL PRIMARY KEY,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_date DATE NOT NULL,
  reference VARCHAR(100),
  description TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_by INTEGER,
  approved_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  posted_at TIMESTAMP
);

-- Detalle de asientos contables
CREATE TABLE IF NOT EXISTS accounting_entries (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES accounting_transactions(id),
  account_id INTEGER NOT NULL,
  debit_amount DECIMAL(12,2) DEFAULT 0,
  credit_amount DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de destinos para el admin
CREATE TABLE IF NOT EXISTS destinations (
    id SERIAL PRIMARY KEY,
    destination_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    category VARCHAR(50) DEFAULT 'Cultura',
    coordinates JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0}',
    packages_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    source VARCHAR(50) DEFAULT 'admin',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices corregidos
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_accounting_transactions_number ON accounting_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_date ON accounting_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_accounting_transactions_status ON accounting_transactions(status);

CREATE INDEX IF NOT EXISTS idx_accounting_entries_transaction ON accounting_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_account ON accounting_entries(account_id);

-- Índices para destinos
CREATE INDEX IF NOT EXISTS idx_destinations_country ON destinations(country);
CREATE INDEX IF NOT EXISTS idx_destinations_category ON destinations(category);
CREATE INDEX IF NOT EXISTS idx_destinations_status ON destinations(status);
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON destinations(is_featured);
CREATE INDEX IF NOT EXISTS idx_destinations_source ON destinations(source);
CREATE INDEX IF NOT EXISTS idx_destinations_coordinates ON destinations USING GIN(coordinates);

-- Insertar destinos por defecto si la tabla está vacía
INSERT INTO destinations (destination_id, name, country, description, price, category, coordinates, packages_count, is_featured, source)
SELECT * FROM (VALUES
    ('paris_default', 'París', 'Francia', 'La Ciudad de la Luz te espera con su arte, cultura y romance', 1299.00, 'Romance', '{"lat": 48.8566, "lng": 2.3522}', 15, true, 'admin_default'),
    ('tokyo_default', 'Tokio', 'Japón', 'Modernidad y tradición se encuentran en la capital japonesa', 2199.00, 'Cultura', '{"lat": 35.6762, "lng": 139.6503}', 8, true, 'admin_default'),
    ('cancun_default', 'Cancún', 'México', 'Playas de arena blanca y aguas cristalinas del Caribe', 1494.00, 'Playa', '{"lat": 21.1619, "lng": -86.8515}', 22, true, 'admin_default'),
    ('cusco_default', 'Cusco', 'Perú', 'La antigua capital del Imperio Inca y puerta a Machu Picchu', 1890.00, 'Aventura', '{"lat": -13.5319, "lng": -71.9675}', 12, true, 'admin_default'),
    ('london_default', 'Londres', 'Reino Unido', 'Historia milenaria en una ciudad vibrante y multicultural', 1799.00, 'Cultura', '{"lat": 51.5074, "lng": -0.1278}', 18, true, 'admin_default'),
    ('dubai_default', 'Dubái', 'Emiratos Árabes Unidos', 'Lujo y modernidad en el desierto árabe', 2599.00, 'Romance', '{"lat": 25.2048, "lng": 55.2708}', 7, true, 'admin_default'),
    ('rome_default', 'Roma', 'Italia', 'La Ciudad Eterna con más de 2,000 años de historia', 1599.00, 'Cultura', '{"lat": 41.9028, "lng": 12.4964}', 14, false, 'admin_default'),
    ('sydney_default', 'Sidney', 'Australia', 'Icónica ciudad australiana entre el puerto y las playas', 2890.00, 'Aventura', '{"lat": -33.8688, "lng": 151.2093}', 6, false, 'admin_default'),
    ('newyork_default', 'Nueva York', 'Estados Unidos', 'La Gran Manzana, ciudad que nunca duerme', 2299.00, 'Cultura', '{"lat": 40.7128, "lng": -74.0060}', 11, false, 'admin_default'),
    ('bangkok_default', 'Bangkok', 'Tailandia', 'Templos dorados y mercados flotantes en la capital tailandesa', 1899.00, 'Cultura', '{"lat": 13.7563, "lng": 100.5018}', 9, false, 'admin_default'),
    ('rio_default', 'Río de Janeiro', 'Brasil', 'Playas de Copacabana e Ipanema bajo el Cristo Redentor', 1650.00, 'Playa', '{"lat": -22.9068, "lng": -43.1729}', 13, false, 'admin_default'),
    ('buenosaires_default', 'Buenos Aires', 'Argentina', 'Tango, asado y cultura porteña en la capital argentina', 999.00, 'Cultura', '{"lat": -34.6118, "lng": -58.3960}', 16, true, 'admin_default')
) AS v(destination_id, name, country, description, price, category, coordinates, packages_count, is_featured, source)
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE destinations.destination_id = v.destination_id);

-- Crear trigger para updated_at en destinos
CREATE OR REPLACE FUNCTION update_destinations_updated_at()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_destinations_updated_at ON destinations;
CREATE TRIGGER trigger_destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW
    EXECUTE FUNCTION update_destinations_updated_at();

-- Verificar que todo esté correcto
SELECT 
    'Corrección completada' as status,
    COUNT(*) as total_destinations
FROM destinations;
