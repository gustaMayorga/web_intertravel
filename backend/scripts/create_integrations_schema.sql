/**
 * 📊 SCHEMA DE BASE DE DATOS PARA INTEGRACIONES - AGENTE 5 (CONTINUACIÓN)
 * =====================================================================
 */

-- Trigger para actualizar puntos automáticamente
DROP TRIGGER IF EXISTS trigger_update_loyalty_points ON loyalty_transactions;
CREATE TRIGGER trigger_update_loyalty_points
    AFTER INSERT ON loyalty_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_points();

-- Función para calcular el tier automáticamente
CREATE OR REPLACE FUNCTION calculate_user_tier(user_loyalty_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    total_spent DECIMAL(10,2);
    new_tier VARCHAR(20);
BEGIN
    -- Obtener el total gastado por el usuario
    SELECT lifetime_spent INTO total_spent
    FROM user_loyalty
    WHERE id = user_loyalty_id;
    
    -- Calcular el tier basado en el gasto total
    IF total_spent >= 10000 THEN
        new_tier := 'Platinum';
    ELSIF total_spent >= 5000 THEN
        new_tier := 'Gold';
    ELSIF total_spent >= 2000 THEN
        new_tier := 'Silver';
    ELSE
        new_tier := 'Bronze';
    END IF;
    
    -- Actualizar el tier del usuario
    UPDATE user_loyalty
    SET tier = new_tier, updated_at = CURRENT_TIMESTAMP
    WHERE id = user_loyalty_id;
    
    RETURN new_tier;
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de referido único
CREATE OR REPLACE FUNCTION generate_referral_code(user_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generar código basado en user_id y timestamp
        code := 'REF' || LPAD(user_id::TEXT, 4, '0') || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));
        
        -- Verificar si el código ya existe
        IF NOT EXISTS (SELECT 1 FROM user_loyalty WHERE referral_code = code) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        IF counter > 10 THEN
            -- Fallback si no podemos generar un código único
            code := 'REF' || user_id || EXTRACT(EPOCH FROM NOW())::INTEGER;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VISTAS ÚTILES PARA REPORTING
-- ============================================

-- Vista de estadísticas de usuarios leales
CREATE OR REPLACE VIEW loyalty_user_stats AS
SELECT 
    ul.user_id,
    u.username,
    u.email,
    ul.total_points,
    ul.tier,
    ul.lifetime_spent,
    ul.referral_code,
    COUNT(DISTINCT r.id) as total_reservations,
    COUNT(DISTINCT lr.id) as total_redemptions,
    SUM(CASE WHEN lt.transaction_type = 'earned' THEN lt.points ELSE 0 END) as total_points_earned,
    SUM(CASE WHEN lt.transaction_type = 'redeemed' THEN ABS(lt.points) ELSE 0 END) as total_points_redeemed,
    ul.created_at as loyalty_member_since
FROM user_loyalty ul
JOIN users u ON ul.user_id = u.id
LEFT JOIN reservations r ON r.user_id = ul.user_id
LEFT JOIN loyalty_redemptions lr ON lr.user_id = ul.user_id
LEFT JOIN loyalty_transactions lt ON lt.user_id = ul.user_id
GROUP BY ul.user_id, u.username, u.email, ul.total_points, ul.tier, ul.lifetime_spent, ul.referral_code, ul.created_at;

-- Vista de resumen de integraciones
CREATE OR REPLACE VIEW integrations_summary AS
SELECT 
    integration_id,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN level = 'error' THEN 1 END) as error_count,
    COUNT(CASE WHEN level = 'warning' THEN 1 END) as warning_count,
    COUNT(CASE WHEN level = 'success' THEN 1 END) as success_count,
    MAX(timestamp) as last_activity,
    DATE_TRUNC('day', MIN(timestamp)) as first_activity
FROM integration_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY integration_id;

-- Vista de actividad de WhatsApp
CREATE OR REPLACE VIEW whatsapp_activity AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    message_type,
    status,
    COUNT(*) as message_count,
    COUNT(DISTINCT phone_number) as unique_recipients
FROM whatsapp_messages
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), message_type, status
ORDER BY date DESC;

-- ============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_type_date 
ON loyalty_transactions(user_id, transaction_type, created_at);

CREATE INDEX IF NOT EXISTS idx_uber_bookings_status_date 
ON uber_bookings(status, created_at);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_status_dates 
ON insurance_policies(status, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status_type_date 
ON whatsapp_messages(status, message_type, created_at);

-- Índice para búsquedas de texto en logs
CREATE INDEX IF NOT EXISTS idx_integration_logs_message_text 
ON integration_logs USING gin(to_tsvector('spanish', message));

-- ============================================
-- DATOS DE EJEMPLO PARA TESTING
-- ============================================

-- Insertar algunos logs de ejemplo
INSERT INTO integration_logs (integration_id, level, message, details, user_id) VALUES
('uber-api', 'success', 'Traslado reservado exitosamente', 'Booking ID: UB-2024-001 - Usuario: María García', 'admin'),
('whatsapp-business', 'info', 'Notificación enviada', 'Confirmación de reserva enviada a +5491112345678', 'system'),
('analytics', 'error', 'Error en conexión a base de datos', 'Connection timeout after 30s', 'system'),
('insurance-api', 'success', 'Póliza emitida automáticamente', 'Póliza #POL-2024-089 - Cobertura completa', 'system'),
('loyalty-system', 'warning', 'Rate limit alcanzado', 'Reduciendo frecuencia de actualización de puntos', 'system'),
('payments', 'success', 'Pago procesado correctamente', 'Transacción ID: TXN-2024-001 - $1,250 USD', 'system')
ON CONFLICT DO NOTHING;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS ÚTILES
-- ============================================

-- Procedimiento para procesar puntos de fidelización automáticamente
CREATE OR REPLACE FUNCTION process_loyalty_points(
    p_user_id INTEGER,
    p_reservation_id INTEGER,
    p_amount DECIMAL(10,2)
)
RETURNS INTEGER AS $$
DECLARE
    points_to_award INTEGER;
    points_per_dollar INTEGER;
    current_balance INTEGER;
    new_balance INTEGER;
    transaction_id INTEGER;
BEGIN
    -- Obtener configuración de puntos por dólar
    SELECT COALESCE(config_value::INTEGER, 1) INTO points_per_dollar
    FROM integration_config
    WHERE integration_id = 'loyalty-system' AND config_key = 'points_per_dollar';
    
    -- Calcular puntos a otorgar
    points_to_award := FLOOR(p_amount * points_per_dollar);
    
    -- Obtener balance actual del usuario
    SELECT COALESCE(total_points, 0) INTO current_balance
    FROM user_loyalty
    WHERE user_id = p_user_id;
    
    -- Calcular nuevo balance
    new_balance := current_balance + points_to_award;
    
    -- Insertar transacción de puntos
    INSERT INTO loyalty_transactions (
        user_id, reservation_id, transaction_type, points, 
        description, balance_before, balance_after
    ) VALUES (
        p_user_id, p_reservation_id, 'earned', points_to_award,
        'Puntos ganados por reserva #' || p_reservation_id,
        current_balance, new_balance
    ) RETURNING id INTO transaction_id;
    
    -- Actualizar o crear registro de fidelización
    INSERT INTO user_loyalty (user_id, total_points, lifetime_spent, created_at)
    VALUES (p_user_id, points_to_award, p_amount, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_points = user_loyalty.total_points + points_to_award,
        lifetime_spent = user_loyalty.lifetime_spent + p_amount,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Recalcular tier del usuario
    PERFORM calculate_user_tier((SELECT id FROM user_loyalty WHERE user_id = p_user_id));
    
    RETURN points_to_award;
END;
$$ LANGUAGE plpgsql;

-- Procedimiento para enviar notificación de WhatsApp
CREATE OR REPLACE FUNCTION send_whatsapp_notification(
    p_user_id INTEGER,
    p_phone_number VARCHAR(20),
    p_message_type VARCHAR(20),
    p_template_name VARCHAR(100),
    p_message_content TEXT,
    p_reservation_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    message_id INTEGER;
BEGIN
    -- Insertar mensaje en la cola
    INSERT INTO whatsapp_messages (
        user_id, reservation_id, phone_number, message_type,
        template_name, message_content, status
    ) VALUES (
        p_user_id, p_reservation_id, p_phone_number, p_message_type,
        p_template_name, p_message_content, 'pending'
    ) RETURNING id INTO message_id;
    
    -- Log de la acción
    INSERT INTO integration_logs (integration_id, level, message, details)
    VALUES (
        'whatsapp-business', 'info', 'Mensaje encolado para envío',
        'Mensaje ID: ' || message_id || ' - Teléfono: ' || p_phone_number
    );
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- Procedimiento para procesar reserva de Uber
CREATE OR REPLACE FUNCTION process_uber_booking(
    p_reservation_id INTEGER,
    p_user_id INTEGER,
    p_pickup_address TEXT,
    p_destination_address TEXT,
    p_vehicle_type VARCHAR(50) DEFAULT 'uberX'
)
RETURNS INTEGER AS $$
DECLARE
    uber_booking_id INTEGER;
    estimated_fare DECIMAL(10,2);
BEGIN
    -- Calcular tarifa estimada (simplificado)
    estimated_fare := RANDOM() * 50 + 10; -- Entre $10 y $60
    
    -- Crear reserva de Uber
    INSERT INTO uber_bookings (
        reservation_id, user_id, pickup_address, destination_address,
        vehicle_type, estimated_fare, status
    ) VALUES (
        p_reservation_id, p_user_id, p_pickup_address, p_destination_address,
        p_vehicle_type, estimated_fare, 'requested'
    ) RETURNING id INTO uber_booking_id;
    
    -- Log de la acción
    INSERT INTO integration_logs (integration_id, level, message, details)
    VALUES (
        'uber-api', 'info', 'Reserva de traslado creada',
        'Uber Booking ID: ' || uber_booking_id || ' - Tarifa estimada: $' || estimated_fare
    );
    
    RETURN uber_booking_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que todas las tablas fueron creadas correctamente
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'integration_logs', 'user_loyalty', 'user_wishlist', 'uber_bookings',
        'insurance_policies', 'whatsapp_messages', 'loyalty_transactions',
        'integration_config', 'loyalty_rewards', 'loyalty_redemptions'
    );
    
    RAISE NOTICE 'Tablas de integraciones creadas: % de 10', table_count;
    
    IF table_count = 10 THEN
        RAISE NOTICE '✅ Todas las tablas de integraciones fueron creadas exitosamente';
    ELSE
        RAISE NOTICE '⚠️ Faltan % tablas por crear', 10 - table_count;
    END IF;
END $$;