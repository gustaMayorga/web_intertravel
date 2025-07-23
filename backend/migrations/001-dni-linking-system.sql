-- ===============================================
-- MIGRACIÓN: SISTEMA DE VINCULACIÓN POR DNI
-- ===============================================
-- Agregar campos necesarios para vincular usuarios con customers

-- 1. Agregar campo DNI a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_number VARCHAR(50);

-- 2. Crear índice único para DNI
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_document ON users(document_number) WHERE document_number IS NOT NULL;

-- 3. Crear índice en customers para búsqueda rápida por DNI
CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document_number) WHERE document_number IS NOT NULL;

-- 4. Crear función para vincular usuario con customer por DNI
CREATE OR REPLACE FUNCTION link_user_to_customer(user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    user_doc VARCHAR(50);
    customer_record customers%ROWTYPE;
BEGIN
    -- Obtener DNI del usuario
    SELECT document_number INTO user_doc FROM users WHERE id = user_id;
    
    IF user_doc IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar customer con el mismo DNI
    SELECT * INTO customer_record FROM customers WHERE document_number = user_doc LIMIT 1;
    
    IF FOUND THEN
        -- Actualizar email del customer con el del usuario si está vacío
        UPDATE customers 
        SET email = (SELECT email FROM users WHERE id = user_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = customer_record.id AND (email IS NULL OR email = '');
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear vista para reservas vinculadas con usuarios
CREATE OR REPLACE VIEW user_bookings AS
SELECT 
    b.*,
    c.first_name as customer_first_name,
    c.last_name as customer_last_name,
    c.document_number as customer_document,
    u.id as user_id,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name
FROM bookings b
JOIN customers c ON b.customer_id = c.id
LEFT JOIN users u ON c.document_number = u.document_number
WHERE c.document_number IS NOT NULL;

-- 6. Crear función para obtener reservas de un usuario
CREATE OR REPLACE FUNCTION get_user_bookings(user_dni VARCHAR(50))
RETURNS TABLE(
    booking_id INTEGER,
    booking_reference VARCHAR(50),
    package_id INTEGER,
    customer_name VARCHAR(200),
    customer_email VARCHAR(200),
    total_amount DECIMAL(10,2),
    currency VARCHAR(3),
    status VARCHAR(50),
    travel_date DATE,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.booking_reference,
        b.package_id,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email,
        b.total_amount,
        b.currency,
        b.status,
        b.travel_date,
        b.created_at
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    WHERE c.document_number = user_dni
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para vincular automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION auto_link_user_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el usuario tiene DNI
    IF NEW.document_number IS NOT NULL THEN
        PERFORM link_user_to_customer(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_auto_link_user_customer ON users;
CREATE TRIGGER trigger_auto_link_user_customer
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION auto_link_user_customer();

-- 8. Función para buscar cliente por DNI y crear vinculación
CREATE OR REPLACE FUNCTION find_customer_bookings_by_dni(search_dni VARCHAR(50))
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'found', CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
        'customer_data', json_agg(
            json_build_object(
                'customer_id', c.id,
                'first_name', c.first_name,
                'last_name', c.last_name,
                'email', c.email,
                'phone', c.phone,
                'document_number', c.document_number
            )
        ),
        'bookings', json_agg(
            json_build_object(
                'booking_id', b.id,
                'booking_reference', b.booking_reference,
                'package_id', b.package_id,
                'total_amount', b.total_amount,
                'currency', b.currency,
                'status', b.status,
                'travel_date', b.travel_date,
                'created_at', b.created_at
            )
        ),
        'total_bookings', COUNT(b.id)
    ) INTO result
    FROM customers c
    LEFT JOIN bookings b ON c.id = b.customer_id
    WHERE c.document_number = search_dni
    GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.document_number;
    
    RETURN COALESCE(result, '{"found": false, "customer_data": null, "bookings": [], "total_bookings": 0}');
END;
$$ LANGUAGE plpgsql;

-- 9. Actualizar tabla bookings para incluir customer data directamente (compatibility)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name VARCHAR(200);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(200);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_document VARCHAR(50);

-- 10. Trigger para sincronizar datos entre bookings y customers
CREATE OR REPLACE FUNCTION sync_booking_customer_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza customer, actualizar bookings relacionadas
    IF TG_TABLE_NAME = 'customers' THEN
        UPDATE bookings 
        SET 
            customer_name = CONCAT(NEW.first_name, ' ', NEW.last_name),
            customer_email = NEW.email,
            customer_phone = NEW.phone,
            customer_document = NEW.document_number,
            updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = NEW.id;
        RETURN NEW;
    END IF;
    
    -- Si se crea/actualiza booking, sincronizar con customer
    IF TG_TABLE_NAME = 'bookings' THEN
        SELECT 
            CONCAT(c.first_name, ' ', c.last_name),
            c.email,
            c.phone,
            c.document_number
        INTO 
            NEW.customer_name,
            NEW.customer_email,
            NEW.customer_phone,
            NEW.customer_document
        FROM customers c
        WHERE c.id = NEW.customer_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers de sincronización
DROP TRIGGER IF EXISTS trigger_sync_customer_to_bookings ON customers;
CREATE TRIGGER trigger_sync_customer_to_bookings
    AFTER UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION sync_booking_customer_data();

DROP TRIGGER IF EXISTS trigger_sync_booking_customer_data ON bookings;
CREATE TRIGGER trigger_sync_booking_customer_data
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION sync_booking_customer_data();

-- 11. Datos de ejemplo para testing
INSERT INTO customers (email, first_name, last_name, phone, document_type, document_number, country) VALUES
('juan.perez@email.com', 'Juan', 'Pérez', '+54 9 261 555-0001', 'DNI', '12345678', 'Argentina'),
('maria.garcia@email.com', 'María', 'García', '+54 9 261 555-0002', 'DNI', '87654321', 'Argentina'),
('carlos.lopez@email.com', 'Carlos', 'López', '+54 9 261 555-0003', 'DNI', '11223344', 'Argentina')
ON CONFLICT (email) DO NOTHING;

-- 12. Reservas de ejemplo
INSERT INTO bookings 
(booking_reference, package_id, customer_id, travelers_count, total_amount, currency, status, travel_date, special_requests) 
SELECT 
    'IT-2025-' || LPAD((1000 + ROW_NUMBER() OVER())::TEXT, 6, '0'),
    1, -- package_id (ajustar según packages disponibles)
    c.id,
    2,
    1500.00,
    'USD',
    'confirmed',
    CURRENT_DATE + INTERVAL '30 days',
    'Reserva manual cargada por agente'
FROM customers c
WHERE c.document_number IN ('12345678', '87654321', '11223344')
ON CONFLICT (booking_reference) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de vinculación por DNI implementado exitosamente!';
    RAISE NOTICE '📋 Funciones disponibles:';
    RAISE NOTICE '   - link_user_to_customer(user_id)';
    RAISE NOTICE '   - get_user_bookings(dni)';
    RAISE NOTICE '   - find_customer_bookings_by_dni(dni)';
    RAISE NOTICE '🔗 Triggers automáticos activados';
    RAISE NOTICE '👥 Datos de ejemplo creados para testing';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Para probar:';
    RAISE NOTICE '   SELECT find_customer_bookings_by_dni(''12345678'');';
END $$;
