-- ====================================================
-- ESQUEMA DE BASE DE DATOS PARA GESTIÓN PAQUETE-CLIENTE
-- Sistema completo de relación y seguimiento
-- ====================================================

-- 1. TABLA DE CLIENTES (Mejorada)
-- ====================================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    preferences JSONB DEFAULT '{}',
    communication_preferences JSONB DEFAULT '{}',
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    source VARCHAR(100) DEFAULT 'web',
    acquisition_cost DECIMAL(10,2),
    lifetime_value DECIMAL(10,2) DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    last_booking_date TIMESTAMP,
    last_interaction_date TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_tags ON customers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_customers_preferences ON customers USING GIN(preferences);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_lifetime_value ON customers(lifetime_value DESC);

-- 2. TABLA DE ASIGNACIONES PAQUETE-CLIENTE
-- ====================================================
CREATE TABLE IF NOT EXISTS package_client_assignments (
    id SERIAL PRIMARY KEY,
    package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Información del cliente (redundante para casos sin customer_id)
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Información de la asignación
    assigned_by_user_id INTEGER,
    assignment_type VARCHAR(50) DEFAULT 'manual',
    priority_level VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Comunicación y seguimiento
    notes TEXT,
    follow_up_date TIMESTAMP,
    last_contact_date TIMESTAMP,
    contact_attempts INTEGER DEFAULT 0,
    preferred_contact_method VARCHAR(50),
    
    -- Información comercial
    quoted_price DECIMAL(10,2),
    quoted_currency VARCHAR(10) DEFAULT 'USD',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    commission_percentage DECIMAL(5,2),
    
    -- Fechas importantes
    travel_start_date DATE,
    travel_end_date DATE,
    booking_deadline DATE,
    
    -- Metadatos y configuración
    source VARCHAR(100) DEFAULT 'manual',
    metadata JSONB DEFAULT '{}',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_assignments_package_id ON package_client_assignments(package_id);
CREATE INDEX IF NOT EXISTS idx_assignments_customer_id ON package_client_assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_customer_email ON package_client_assignments(customer_email);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON package_client_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_priority ON package_client_assignments(priority_level);
CREATE INDEX IF NOT EXISTS idx_assignments_follow_up ON package_client_assignments(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_by ON package_client_assignments(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_travel_date ON package_client_assignments(travel_start_date);
CREATE INDEX IF NOT EXISTS idx_assignments_source ON package_client_assignments(source);

-- 3. TABLA DE ACTIVIDADES/HISTORIAL DE ASIGNACIONES
-- ====================================================
CREATE TABLE IF NOT EXISTS assignment_activities (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES package_client_assignments(id) ON DELETE CASCADE,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    previous_value TEXT,
    new_value TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para el historial
CREATE INDEX IF NOT EXISTS idx_activities_assignment_id ON assignment_activities(assignment_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON assignment_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_action ON assignment_activities(action);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON assignment_activities(created_at DESC);

-- 4. TABLA DE INTERACCIONES CON CLIENTES
-- ====================================================
CREATE TABLE IF NOT EXISTS customer_interactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    assignment_id INTEGER REFERENCES package_client_assignments(id) ON DELETE SET NULL,
    user_id INTEGER,
    
    -- Tipo de interacción
    interaction_type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    
    -- Contenido de la interacción
    subject VARCHAR(255),
    content TEXT,
    duration_minutes INTEGER,
    
    -- Resultados
    outcome VARCHAR(100),
    next_action VARCHAR(255),
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    
    -- Fechas
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    follow_up_date TIMESTAMP,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para interacciones
CREATE INDEX IF NOT EXISTS idx_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_interactions_assignment_id ON customer_interactions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON customer_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON customer_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_status ON customer_interactions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_follow_up ON customer_interactions(follow_up_date);

-- 5. TABLA DE COTIZACIONES
-- ====================================================
CREATE TABLE IF NOT EXISTS package_quotes (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES package_client_assignments(id) ON DELETE CASCADE,
    quote_number VARCHAR(100) UNIQUE NOT NULL,
    
    -- Información del paquete cotizado
    package_id INTEGER REFERENCES packages(id) ON DELETE SET NULL,
    package_title VARCHAR(255),
    original_price DECIMAL(10,2),
    quoted_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Descuentos y comisiones
    discount_type VARCHAR(50),
    discount_value DECIMAL(10,2),
    total_discount DECIMAL(10,2),
    commission_percentage DECIMAL(5,2),
    commission_amount DECIMAL(10,2),
    
    -- Personalización del paquete
    customizations JSONB DEFAULT '{}',
    inclusions TEXT[],
    exclusions TEXT[],
    special_conditions TEXT,
    
    -- Fechas y validez
    travel_start_date DATE,
    travel_end_date DATE,
    quote_valid_until DATE,
    payment_terms TEXT,
    
    -- Estado de la cotización
    status VARCHAR(50) DEFAULT 'draft',
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    
    -- Usuario que creó la cotización
    created_by_user_id INTEGER,
    approved_by_user_id INTEGER,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para cotizaciones
CREATE INDEX IF NOT EXISTS idx_quotes_assignment_id ON package_quotes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON package_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_package_id ON package_quotes(package_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON package_quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON package_quotes(quote_valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON package_quotes(created_by_user_id);

-- 6. TABLA DE CONFIGURACIÓN DEL SISTEMA
-- ====================================================
CREATE TABLE IF NOT EXISTS package_client_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuraciones iniciales
INSERT INTO package_client_settings (setting_key, setting_value, description, category) VALUES
('assignment_follow_up_days', '3', 'Días por defecto para programar seguimiento', 'assignment'),
('max_contact_attempts', '5', 'Máximo número de intentos de contacto', 'assignment'),
('auto_status_change_days', '30', 'Días para cambio automático de estado', 'automation'),
('priority_weights', '{"urgent": 100, "high": 75, "medium": 50, "low": 25}', 'Pesos para priorización', 'assignment'),
('commission_default_percentage', '10', 'Porcentaje de comisión por defecto', 'financial'),
('quote_validity_days', '15', 'Días de validez de cotizaciones por defecto', 'quotes'),
('notification_preferences', '{"email": true, "sms": false, "push": true}', 'Preferencias de notificación', 'notification')
ON CONFLICT (setting_key) DO NOTHING;

-- 7. TRIGGERS PARA AUTOMATIZACIÓN
-- ====================================================

-- Trigger para actualizar customer stats cuando hay nuevas asignaciones
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar última fecha de interacción
    UPDATE customers 
    SET last_interaction_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.customer_id OR email = NEW.customer_email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_stats ON package_client_assignments;
CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT OR UPDATE ON package_client_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- Trigger para logging automático de cambios de estado
CREATE OR REPLACE FUNCTION log_assignment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el status cambió
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO assignment_activities (
            assignment_id, 
            action, 
            description, 
            previous_value, 
            new_value,
            metadata
        ) VALUES (
            NEW.id,
            'status_changed',
            'Assignment status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status,
            OLD.status,
            NEW.status,
            jsonb_build_object('automatic', true, 'timestamp', CURRENT_TIMESTAMP)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_status_change ON package_client_assignments;
CREATE TRIGGER trigger_log_status_change
    AFTER UPDATE ON package_client_assignments
    FOR EACH ROW
    EXECUTE FUNCTION log_assignment_status_change();

-- 8. VISTAS ÚTILES PARA CONSULTAS FRECUENTES
-- ====================================================

-- Vista de asignaciones con información completa
CREATE OR REPLACE VIEW v_assignments_complete AS
SELECT 
    pca.*,
    p.title as package_title,
    p.destination as package_destination,
    p.country as package_country,
    p.price_amount as package_original_price,
    p.price_currency as package_currency,
    p.category as package_category,
    p.rating_average as package_rating,
    c.name as customer_full_name,
    c.country as customer_country,
    c.preferences as customer_preferences,
    c.total_bookings as customer_total_bookings,
    c.lifetime_value as customer_lifetime_value,
    u.name as assigned_by_name,
    u.email as assigned_by_email,
    -- Calcular días desde asignación
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - pca.created_at) as days_since_assignment,
    -- Calcular días hasta seguimiento
    EXTRACT(DAY FROM pca.follow_up_date - CURRENT_TIMESTAMP) as days_to_follow_up,
    -- Estado de urgencia basado en follow_up_date
    CASE 
        WHEN pca.follow_up_date < CURRENT_DATE THEN 'overdue'
        WHEN pca.follow_up_date = CURRENT_DATE THEN 'today'
        WHEN pca.follow_up_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'soon'
        ELSE 'scheduled'
    END as follow_up_urgency
FROM package_client_assignments pca
LEFT JOIN packages p ON pca.package_id = p.id
LEFT JOIN customers c ON pca.customer_id = c.id
LEFT JOIN users u ON pca.assigned_by_user_id = u.id;

-- Vista de estadísticas por agente
CREATE OR REPLACE VIEW v_agent_performance AS
SELECT 
    u.id as user_id,
    u.name as agent_name,
    COUNT(pca.id) as total_assignments,
    COUNT(CASE WHEN pca.status = 'active' THEN 1 END) as active_assignments,
    COUNT(CASE WHEN pca.status = 'booked' THEN 1 END) as successful_bookings,
    COUNT(CASE WHEN pca.status = 'cancelled' THEN 1 END) as cancelled_assignments,
    -- Tasa de conversión
    CASE 
        WHEN COUNT(pca.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN pca.status = 'booked' THEN 1 END)::DECIMAL / COUNT(pca.id)) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    -- Valor total de bookings convertidos
    COALESCE(SUM(CASE WHEN pca.status = 'booked' THEN pca.quoted_price END), 0) as total_bookings_value,
    -- Comisiones ganadas
    COALESCE(SUM(CASE WHEN pca.status = 'booked' THEN 
        (pca.quoted_price * pca.commission_percentage / 100) END), 0) as total_commissions,
    -- Tiempo promedio hasta conversión (en días)
    AVG(CASE WHEN pca.status = 'booked' THEN 
        EXTRACT(DAY FROM pca.updated_at - pca.created_at) END) as avg_days_to_conversion
FROM users u
LEFT JOIN package_client_assignments pca ON u.id = pca.assigned_by_user_id
WHERE u.role IN ('agent', 'sales', 'admin')
GROUP BY u.id, u.name
ORDER BY conversion_rate DESC, total_bookings_value DESC;

-- Vista de paquetes más populares en asignaciones
CREATE OR REPLACE VIEW v_popular_packages AS
SELECT 
    p.*,
    COUNT(pca.id) as total_assignments,
    COUNT(CASE WHEN pca.status = 'booked' THEN 1 END) as successful_bookings,
    CASE 
        WHEN COUNT(pca.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN pca.status = 'booked' THEN 1 END)::DECIMAL / COUNT(pca.id)) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    AVG(pca.quoted_price) as avg_quoted_price,
    MAX(pca.created_at) as last_assigned_date
FROM packages p
LEFT JOIN package_client_assignments pca ON p.id = pca.package_id
WHERE p.status = 'active'
GROUP BY p.id
ORDER BY total_assignments DESC, conversion_rate DESC;

-- ====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ====================================================

COMMENT ON TABLE customers IS 'Tabla principal de clientes con información completa y métricas de valor';
COMMENT ON TABLE package_client_assignments IS 'Asignaciones de paquetes a clientes con seguimiento completo';
COMMENT ON TABLE assignment_activities IS 'Historial de todas las actividades en las asignaciones';
COMMENT ON TABLE customer_interactions IS 'Registro de todas las interacciones con clientes';
COMMENT ON TABLE package_quotes IS 'Cotizaciones enviadas a clientes';
COMMENT ON TABLE package_client_settings IS 'Configuración del sistema de gestión paquete-cliente';

COMMENT ON VIEW v_assignments_complete IS 'Vista completa de asignaciones con toda la información relacionada';
COMMENT ON VIEW v_agent_performance IS 'Métricas de rendimiento por agente de ventas';
COMMENT ON VIEW v_popular_packages IS 'Paquetes más populares basados en asignaciones y conversiones';

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'customers', 
    'package_client_assignments', 
    'assignment_activities',
    'customer_interactions',
    'package_quotes',
    'package_client_settings'
)
ORDER BY table_name;

-- Mostrar resumen final
SELECT 'Package-Client Management Schema installed successfully!' as status;
