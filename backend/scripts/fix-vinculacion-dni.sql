-- ===============================================
-- FIX VINCULACIÓN DNI - INTERTRAVEL
-- ===============================================
-- Solución para vincular usuarios con reservas por DNI

-- 1. AGREGAR DNI/DOCUMENTO A TABLA USERS
-- ===============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) DEFAULT 'DNI',
ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);

-- 2. AGREGAR VINCULACIÓN USERS ↔ CUSTOMERS
-- ===============================================
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);

-- 3. CREAR ÍNDICES PARA PERFORMANCE
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_users_document ON users(document_number);
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document_number);

-- 4. AGREGAR RESTRICCIÓN ÚNICA PARA DNI
-- ===============================================
-- Solo si no existe ya
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_users_document_number'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_users_document_number UNIQUE (document_number);
    END IF;
END $$;

-- 5. MIGRAR DATOS EXISTENTES (VINCULAR POR EMAIL)
-- ===============================================
-- Vincular customers y users existentes por email cuando coincidan
UPDATE customers SET user_id = (
    SELECT id FROM users 
    WHERE users.email = customers.email
    AND users.email IS NOT NULL
    AND customers.email IS NOT NULL
) WHERE user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.email = customers.email
    AND users.email IS NOT NULL
);

-- 6. FUNCIÓN PARA VINCULACIÓN AUTOMÁTICA
-- ===============================================
CREATE OR REPLACE FUNCTION vincular_cliente_por_dni(
    p_document_number VARCHAR(50),
    p_user_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_customer_id INTEGER;
BEGIN
    -- Buscar customer existente con ese DNI
    SELECT id INTO v_customer_id 
    FROM customers 
    WHERE document_number = p_document_number 
    AND user_id IS NULL;
    
    -- Si existe, vincularlo
    IF v_customer_id IS NOT NULL THEN
        UPDATE customers 
        SET user_id = p_user_id 
        WHERE id = v_customer_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN PARA OBTENER RESERVAS POR USER
-- ===============================================
CREATE OR REPLACE FUNCTION get_user_bookings(p_user_id INTEGER)
RETURNS TABLE(
    booking_id INTEGER,
    booking_reference VARCHAR(50),
    package_title VARCHAR(500),
    travel_date DATE,
    status VARCHAR(50),
    total_amount DECIMAL(10,2),
    currency VARCHAR(3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.booking_reference,
        p.title,
        b.travel_date,
        b.status,
        b.total_amount,
        b.currency
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    LEFT JOIN packages p ON b.package_id = p.id
    WHERE c.user_id = p_user_id
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. DATOS DE PRUEBA PARA TESTING
-- ===============================================
-- Insertar customer de prueba con DNI
INSERT INTO customers (
    email, 
    first_name, 
    last_name, 
    document_type, 
    document_number,
    phone,
    country
) VALUES (
    'cliente.prueba@email.com',
    'Juan Carlos',
    'Test Cliente',
    'DNI',
    '12345678',
    '+54 9 261 123-4567',
    'Argentina'
) ON CONFLICT (email) DO NOTHING;

-- Insertar booking de prueba para ese customer
INSERT INTO bookings (
    booking_reference,
    customer_id,
    travelers_count,
    total_amount,
    currency,
    status,
    travel_date
) VALUES (
    'ITV-TEST-001',
    (SELECT id FROM customers WHERE document_number = '12345678'),
    2,
    599.00,
    'USD',
    'confirmed',
    '2025-08-15'
) ON CONFLICT (booking_reference) DO NOTHING;

-- 9. CONFIGURACIÓN PARA FEATURED PACKAGES
-- ===============================================
-- Marcar paquetes como destacados para landing
UPDATE packages SET is_featured = true 
WHERE id IN (
    SELECT id FROM packages 
    WHERE is_active = true 
    ORDER BY rating_average DESC, price_amount ASC 
    LIMIT 3
);

-- Insertar configuración de landing
INSERT INTO system_config (category, key, value, description, data_type, is_public) VALUES
('landing', 'featured_title', '"Nuestros Mejores Destinos"', 'Título de sección destacados', 'string', true),
('landing', 'featured_subtitle', '"Experiencias únicas que no puedes perderte"', 'Subtítulo destacados', 'string', true),
('landing', 'featured_count', '3', 'Cantidad de paquetes destacados', 'number', false)
ON CONFLICT (category, key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- 10. VERIFICACIONES FINALES
-- ===============================================
-- Verificar que las columnas fueron agregadas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'document_number'
    ) THEN
        RAISE NOTICE '✅ Campo document_number agregado a users';
    ELSE
        RAISE EXCEPTION '❌ ERROR: No se pudo agregar document_number a users';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE '✅ Campo user_id agregado a customers';
    ELSE
        RAISE EXCEPTION '❌ ERROR: No se pudo agregar user_id a customers';
    END IF;
END $$;

-- Contar vinculaciones existentes
DO $$
DECLARE
    v_vinculados INTEGER;
    v_total_customers INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_vinculados FROM customers WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO v_total_customers FROM customers;
    
    RAISE NOTICE '📊 ESTADÍSTICAS:';
    RAISE NOTICE '   Total customers: %', v_total_customers;
    RAISE NOTICE '   Customers vinculados: %', v_vinculados;
    RAISE NOTICE '   Customers sin vincular: %', (v_total_customers - v_vinculados);
END $$;

RAISE NOTICE '🎯 VINCULACIÓN DNI CONFIGURADA EXITOSAMENTE';
RAISE NOTICE '📋 Próximo paso: Implementar endpoints en backend';
