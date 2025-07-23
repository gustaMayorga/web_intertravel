-- =====================================================
-- ESQUEMA COMPLETO BASE DE DATOS INTERTRAVEL
-- =====================================================
-- Creado: 2025-07-18
-- Propósito: Esquema completo y bien planificado
-- NO MÁS ERRORES DE COLUMNAS FALTANTES
-- =====================================================

-- Eliminar base de datos existente y crear limpia
DROP DATABASE IF EXISTS intertravel_db;
CREATE DATABASE intertravel_db 
    WITH ENCODING 'UTF8' 
    LC_COLLATE='Spanish_Argentina.1252' 
    LC_CTYPE='Spanish_Argentina.1252';

\c intertravel_db;

-- =====================================================
-- 1. TABLA USUARIOS
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent', 'agency')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    profile_image VARCHAR(500),
    birth_date DATE,
    gender VARCHAR(10),
    document_type VARCHAR(20),
    document_number VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    preferences JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. TABLA AGENCIAS
-- =====================================================
CREATE TABLE agencies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    contact_person VARCHAR(200),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logo_url VARCHAR(500),
    website VARCHAR(500),
    description TEXT,
    business_license VARCHAR(100),
    tax_id VARCHAR(50)
);

-- =====================================================
-- 3. TABLA PAQUETES TURÍSTICOS
-- =====================================================
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    package_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(300) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    destination VARCHAR(200) NOT NULL,
    duration_days INTEGER NOT NULL,
    duration_nights INTEGER,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    max_passengers INTEGER DEFAULT 10,
    min_passengers INTEGER DEFAULT 1,
    category VARCHAR(50), -- premium, standard, economy
    type VARCHAR(50), -- individual, grupal, familiar
    includes TEXT[], -- Array de incluidos
    excludes TEXT[], -- Array de no incluidos
    itinerary JSONB,
    images TEXT[], -- Array de URLs de imágenes
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    availability_start DATE,
    availability_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agency_id INTEGER REFERENCES agencies(id),
    tags VARCHAR(100)[],
    difficulty_level VARCHAR(20),
    age_restrictions VARCHAR(100),
    special_requirements TEXT,
    cancellation_policy TEXT,
    priority_score INTEGER DEFAULT 0,
    external_id VARCHAR(100), -- Para Travel Compositor
    provider VARCHAR(100) -- travel_compositor, internal, etc
);

-- =====================================================
-- 4. TABLA RESERVAS/BOOKINGS
-- =====================================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    package_id VARCHAR(100) NOT NULL, -- Referencia al package_id, no FK por flexibilidad
    package_name VARCHAR(300) NOT NULL, -- ESTA ERA LA COLUMNA FALTANTE
    user_id INTEGER REFERENCES users(id),
    agency_id INTEGER REFERENCES agencies(id),
    
    -- Datos del cliente principal
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_document VARCHAR(50),
    
    -- Detalles de la reserva
    passenger_count INTEGER NOT NULL DEFAULT 1,
    travel_date DATE NOT NULL,
    return_date DATE,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    
    -- Estado y pagos
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'paid', 'cancelled', 
        'completed', 'refunded', 'expired'
    )),
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'partial', 'paid', 'refunded', 'failed'
    )),
    payment_method VARCHAR(50),
    
    -- Fechas importantes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Datos adicionales
    passengers JSONB, -- Array de pasajeros con sus datos
    special_requests TEXT,
    notes TEXT,
    internal_notes TEXT,
    commission_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Referencias externas
    external_booking_id VARCHAR(100),
    provider_reference VARCHAR(100)
);

-- =====================================================
-- 5. TABLA PASAJEROS
-- =====================================================
CREATE TABLE passengers (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_type VARCHAR(20),
    document_number VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(20),
    emergency_contact VARCHAR(200),
    emergency_phone VARCHAR(20),
    dietary_requirements TEXT,
    medical_conditions TEXT,
    is_main_passenger BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. TABLA PAGOS
-- =====================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50), -- mercadopago, stripe, transfer
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 
        'cancelled', 'refunded', 'expired'
    )),
    provider_transaction_id VARCHAR(200),
    provider_response JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    notes TEXT
);

-- =====================================================
-- 7. TABLA REVIEWS/RESEÑAS
-- =====================================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    user_id INTEGER REFERENCES users(id),
    package_id VARCHAR(100) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    helpful_votes INTEGER DEFAULT 0,
    images TEXT[],
    travel_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_from_agency TEXT,
    response_date TIMESTAMP
);

-- =====================================================
-- 8. TABLA CONFIGURACIÓN DEL SISTEMA
-- =====================================================
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. TABLA KEYWORDS PARA PRIORIZACIÓN
-- =====================================================
CREATE TABLE priority_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    priority_score INTEGER DEFAULT 1,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. TABLA LOGS DE ACTIVIDAD
-- =====================================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- booking, package, user, etc
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. TABLA SESIONES DE USUARIO
-- =====================================================
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(255),
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Usuarios
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Agencias
CREATE INDEX idx_agencies_code ON agencies(code);
CREATE INDEX idx_agencies_active ON agencies(is_active);

-- Paquetes
CREATE INDEX idx_packages_package_id ON packages(package_id);
CREATE INDEX idx_packages_destination ON packages(destination);
CREATE INDEX idx_packages_active ON packages(is_active);
CREATE INDEX idx_packages_featured ON packages(is_featured);
CREATE INDEX idx_packages_price ON packages(price);
CREATE INDEX idx_packages_dates ON packages(availability_start, availability_end);

-- Reservas
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_package_id ON bookings(package_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_travel_date ON bookings(travel_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Pagos
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_status ON payments(status);

-- Reviews
CREATE INDEX idx_reviews_package_id ON reviews(package_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_published ON reviews(is_published);

-- Sesiones
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- =====================================================
-- DATOS INICIALES BÁSICOS
-- =====================================================

-- Usuario administrador por defecto
INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, email_verified) 
VALUES 
('Admin', 'Sistema', 'admin@intertravel.com', '$2b$10$rN8.5i7bKYrU4f8uFWvPGOHy5XgY2QK.YAjX3nF8HgP4sW7vB2E6W', 'admin', true, true),
('Gustavo', 'Mayorga', 'test@mail.com', '$2b$10$rN8.5i7bKYrU4f8uFWvPGOHy5XgY2QK.YAjX3nF8HgP4sW7vB2E6W', 'user', true, true);

-- Agencia por defecto
INSERT INTO agencies (name, code, email, contact_person, is_active)
VALUES ('InterTravel Group', 'ITG', 'info@intertravelgroup.com', 'Administrador', true);

-- Keywords de priorización
INSERT INTO priority_keywords (keyword, priority_score, category, is_active) VALUES
('mendoza', 5, 'destination', true),
('premium', 4, 'category', true),
('familiar', 3, 'type', true),
('aventura', 4, 'activity', true),
('relax', 3, 'activity', true),
('cultura', 3, 'activity', true),
('gastronomía', 4, 'activity', true),
('naturaleza', 4, 'activity', true),
('ciudad', 2, 'type', true),
('montaña', 3, 'destination', true);

-- Configuración básica del sistema
INSERT INTO system_config (config_key, config_value, config_type, description, is_public) VALUES
('site_name', 'InterTravel', 'string', 'Nombre del sitio', true),
('currency_default', 'ARS', 'string', 'Moneda por defecto', true),
('booking_expiry_hours', '24', 'number', 'Horas para expirar reserva sin pagar', false),
('commission_rate_default', '10.00', 'number', 'Comisión por defecto para agencias', false),
('max_passengers_default', '10', 'number', 'Máximo de pasajeros por defecto', false);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
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
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
-- Este esquema incluye TODAS las tablas y columnas necesarias
-- NO MÁS ERRORES de "columna no existe"
-- Base de datos completamente planificada y estructurada
-- =====================================================