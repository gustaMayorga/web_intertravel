-- VERIFICAR Y COMPLETAR TODAS LAS TABLAS NECESARIAS

-- 1. Verificar tablas existentes
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar usuarios admin
SELECT COUNT(*) as admin_count FROM admin_users WHERE is_active = true;

-- 3. Verificar usuarios cliente
SELECT COUNT(*) as client_count FROM users;

-- 4. Verificar estructura clients
SELECT COUNT(*) as clients_count FROM clients;

-- 5. Verificar bookings
SELECT COUNT(*) as bookings_count FROM bookings;

-- 6. Verificar agencies
SELECT COUNT(*) as agencies_count FROM agencies;

-- Si las tablas no existen, crearlas:

-- Tabla clients (para vinculacion DNI)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  document_type VARCHAR(10) DEFAULT 'DNI',
  document_number VARCHAR(50),
  country VARCHAR(100) DEFAULT 'Argentina',
  city VARCHAR(100),
  province VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla bookings (reservas)
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  package_id VARCHAR(100),
  package_name VARCHAR(500),
  client_id INTEGER REFERENCES clients(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_document VARCHAR(50),
  travelers_count INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  travel_date DATE,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla agencies (agencias)
CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices importantes
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document_number);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_document ON bookings(customer_document);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Verificacion final
SELECT 
  'admin_users' as tabla,
  COUNT(*) as registros
FROM admin_users
UNION ALL
SELECT 
  'users' as tabla,
  COUNT(*) as registros  
FROM users
UNION ALL
SELECT 
  'clients' as tabla,
  COUNT(*) as registros
FROM clients
UNION ALL
SELECT 
  'bookings' as tabla,
  COUNT(*) as registros
FROM bookings
UNION ALL
SELECT 
  'agencies' as tabla,
  COUNT(*) as registros
FROM agencies;
