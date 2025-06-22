-- ===============================================
-- BUSINESS INTELLIGENCE SCHEMA - AGENTE 6
-- Estructuras de base de datos para BI avanzado
-- ===============================================

-- Tabla de métricas de BI
CREATE TABLE IF NOT EXISTS bi_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'revenue', 'conversion', 'count', 'percentage'
    category VARCHAR(50) NOT NULL, -- 'sales', 'marketing', 'operations', 'customer'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de eventos de analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- 'page_view', 'booking_start', 'payment_complete', etc.
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(255),
    properties JSONB, -- Datos adicionales del evento
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Tabla de cohortes de usuarios
CREATE TABLE IF NOT EXISTS user_cohorts (
    id SERIAL PRIMARY KEY,
    cohort_period VARCHAR(20) NOT NULL, -- '2024-01', '2024-02', etc.
    user_id INTEGER REFERENCES users(id),
    first_purchase_date DATE,
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_activity_date DATE,
    cohort_month INTEGER, -- Mes relativo desde el primer purchase (0, 1, 2, ...)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de predicciones de churn
CREATE TABLE IF NOT EXISTS churn_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    churn_probability DECIMAL(5,4), -- 0.0000 a 1.0000
    risk_level VARCHAR(20), -- 'low', 'medium', 'high'
    factors JSONB, -- Factores que contribuyen al riesgo
    predicted_ltv DECIMAL(10,2),
    prediction_date DATE DEFAULT CURRENT_DATE,
    model_version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de optimizaciones de precios
CREATE TABLE IF NOT EXISTS price_optimizations (
    id SERIAL PRIMARY KEY,
    package_id VARCHAR(255) NOT NULL,
    current_price DECIMAL(10,2) NOT NULL,
    recommended_price DECIMAL(10,2) NOT NULL,
    confidence_score INTEGER, -- 0-100
    expected_impact VARCHAR(50), -- '+23% revenue', etc.
    demand_factor DECIMAL(5,2),
    seasonality_factor DECIMAL(5,2),
    competition_factor DECIMAL(5,2),
    implementation_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'implemented', 'rejected'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de forecasting de demanda
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id SERIAL PRIMARY KEY,
    destination VARCHAR(100) NOT NULL,
    forecast_month INTEGER NOT NULL, -- Meses en el futuro (1, 2, 3, ...)
    predicted_bookings INTEGER NOT NULL,
    confidence_level INTEGER, -- 0-100
    seasonal_factor DECIMAL(5,2),
    trend_factor DECIMAL(5,2),
    model_accuracy DECIMAL(5,2),
    forecast_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de segmentación de clientes
CREATE TABLE IF NOT EXISTS customer_segments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    segment_name VARCHAR(50) NOT NULL, -- 'VIP', 'High_Value', 'At_Risk', etc.
    segment_score DECIMAL(5,2),
    characteristics JSONB, -- Características del segmento
    assigned_date DATE DEFAULT CURRENT_DATE,
    expires_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de alertas de BI
CREATE TABLE IF NOT EXISTS bi_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'threshold', 'anomaly', 'trend'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    metric_name VARCHAR(100),
    threshold_value DECIMAL(15,2),
    actual_value DECIMAL(15,2),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de configuración de BI
CREATE TABLE IF NOT EXISTS bi_configuration (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'alerts', 'models', 'thresholds'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de dashboards personalizados
CREATE TABLE IF NOT EXISTS custom_dashboards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    dashboard_name VARCHAR(100) NOT NULL,
    dashboard_config JSONB NOT NULL, -- Configuración de widgets, filtros, etc.
    is_default BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de KPIs tracking
CREATE TABLE IF NOT EXISTS kpi_tracking (
    id SERIAL PRIMARY KEY,
    kpi_name VARCHAR(100) NOT NULL,
    kpi_value DECIMAL(15,2) NOT NULL,
    target_value DECIMAL(15,2),
    unit VARCHAR(20), -- 'USD', '%', 'count'
    period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    record_date DATE NOT NULL,
    variance_percentage DECIMAL(5,2),
    status VARCHAR(20), -- 'on_target', 'above_target', 'below_target'
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- ÍNDICES PARA PERFORMANCE
-- ===============================================

-- Índices para bi_metrics
CREATE INDEX IF NOT EXISTS idx_bi_metrics_name_period ON bi_metrics(metric_name, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_bi_metrics_category ON bi_metrics(category);
CREATE INDEX IF NOT EXISTS idx_bi_metrics_type ON bi_metrics(metric_type);

-- Índices para analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- Índices para user_cohorts
CREATE INDEX IF NOT EXISTS idx_user_cohorts_period ON user_cohorts(cohort_period);
CREATE INDEX IF NOT EXISTS idx_user_cohorts_user ON user_cohorts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cohorts_month ON user_cohorts(cohort_month);

-- Índices para churn_predictions
CREATE INDEX IF NOT EXISTS idx_churn_predictions_user ON churn_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk ON churn_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_date ON churn_predictions(prediction_date);

-- Índices para price_optimizations
CREATE INDEX IF NOT EXISTS idx_price_optimizations_package ON price_optimizations(package_id);
CREATE INDEX IF NOT EXISTS idx_price_optimizations_status ON price_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_price_optimizations_date ON price_optimizations(implementation_date);

-- Índices para demand_forecasts
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_destination ON demand_forecasts(destination);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_month ON demand_forecasts(forecast_month);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON demand_forecasts(forecast_date);

-- Índices para customer_segments
CREATE INDEX IF NOT EXISTS idx_customer_segments_user ON customer_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_name ON customer_segments(segment_name);
CREATE INDEX IF NOT EXISTS idx_customer_segments_active ON customer_segments(is_active);

-- Índices para bi_alerts
CREATE INDEX IF NOT EXISTS idx_bi_alerts_type ON bi_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_bi_alerts_severity ON bi_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_bi_alerts_resolved ON bi_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_bi_alerts_created ON bi_alerts(created_at);

-- Índices para kpi_tracking
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_name ON kpi_tracking(kpi_name);
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_date ON kpi_tracking(record_date);
CREATE INDEX IF NOT EXISTS idx_kpi_tracking_period ON kpi_tracking(period_type);

-- ===============================================
-- VISTAS PARA ANÁLISIS RÁPIDO
-- ===============================================

-- Vista de métricas principales del último mes
CREATE OR REPLACE VIEW v_monthly_metrics AS
SELECT 
    metric_name,
    metric_value,
    metric_type,
    category,
    period_start,
    period_end
FROM bi_metrics 
WHERE period_start >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY period_start DESC, metric_name;

-- Vista de usuarios de alto valor
CREATE OR REPLACE VIEW v_high_value_users AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    COUNT(r.id) as total_bookings,
    SUM(r.total_amount) as total_spent,
    AVG(r.user_rating) as avg_rating,
    MAX(r.created_at) as last_booking_date
FROM users u
LEFT JOIN reservations r ON u.id = r.user_id
WHERE r.status = 'confirmed'
GROUP BY u.id, u.full_name, u.email
HAVING SUM(r.total_amount) > 5000 OR COUNT(r.id) >= 3
ORDER BY total_spent DESC;

-- Vista de performance de agencias
CREATE OR REPLACE VIEW v_agency_performance AS
SELECT 
    a.id,
    a.name,
    a.code,
    a.commission_rate,
    COUNT(r.id) as total_assignments,
    COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as completed_bookings,
    SUM(CASE WHEN r.status = 'confirmed' THEN r.total_amount * (a.commission_rate / 100) END) as earned_commission,
    AVG(CASE WHEN r.status = 'confirmed' THEN r.total_amount END) as avg_booking_value,
    ROUND(
        CASE 
            WHEN COUNT(r.id) > 0 
            THEN (COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) * 100.0 / COUNT(r.id))
            ELSE 0 
        END, 2
    ) as conversion_rate
FROM agencies a
LEFT JOIN reservations r ON a.id = r.assigned_agency_id
WHERE a.status = 'active'
GROUP BY a.id, a.name, a.code, a.commission_rate
ORDER BY conversion_rate DESC, earned_commission DESC;

-- Vista de análisis de conversión
CREATE OR REPLACE VIEW v_conversion_funnel AS
WITH funnel_data AS (
    SELECT 
        COUNT(DISTINCT ae.session_id) as total_sessions,
        COUNT(DISTINCT CASE WHEN ae.event_type = 'package_view' THEN ae.session_id END) as package_views,
        COUNT(DISTINCT CASE WHEN ae.event_type = 'booking_start' THEN ae.session_id END) as booking_starts,
        COUNT(DISTINCT CASE WHEN ae.event_type = 'payment_complete' THEN ae.session_id END) as conversions
    FROM analytics_events ae
    WHERE ae.timestamp >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    'Visitantes únicos' as step_name,
    total_sessions as count,
    100.0 as percentage,
    NULL as conversion_rate
FROM funnel_data
UNION ALL
SELECT 
    'Vieron paquetes' as step_name,
    package_views as count,
    ROUND((package_views * 100.0 / total_sessions), 2) as percentage,
    ROUND((package_views * 100.0 / total_sessions), 2) as conversion_rate
FROM funnel_data
UNION ALL
SELECT 
    'Iniciaron reserva' as step_name,
    booking_starts as count,
    ROUND((booking_starts * 100.0 / total_sessions), 2) as percentage,
    ROUND((booking_starts * 100.0 / package_views), 2) as conversion_rate
FROM funnel_data
UNION ALL
SELECT 
    'Completaron compra' as step_name,
    conversions as count,
    ROUND((conversions * 100.0 / total_sessions), 2) as percentage,
    ROUND((conversions * 100.0 / booking_starts), 2) as conversion_rate
FROM funnel_data;

-- ===============================================
-- FUNCIONES STORED PROCEDURES
-- ===============================================

-- Función para calcular score de customer
CREATE OR REPLACE FUNCTION calculate_customer_score(user_id_param INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_spent DECIMAL(10,2) := 0;
    total_bookings INTEGER := 0;
    avg_rating DECIMAL(3,2) := 0;
    recency_days INTEGER := 0;
    score DECIMAL(5,2) := 0;
BEGIN
    -- Obtener métricas del usuario
    SELECT 
        COALESCE(SUM(total_amount), 0),
        COUNT(*),
        COALESCE(AVG(user_rating), 0),
        COALESCE(EXTRACT(DAYS FROM (CURRENT_DATE - MAX(created_at::date))), 365)
    INTO total_spent, total_bookings, avg_rating, recency_days
    FROM reservations 
    WHERE user_id = user_id_param AND status = 'confirmed';
    
    -- Calcular score basado en múltiples factores
    score := (
        LEAST(total_spent / 100, 50) +  -- Hasta 50 puntos por gasto
        LEAST(total_bookings * 10, 30) + -- Hasta 30 puntos por frecuencia
        (avg_rating * 4) + -- Hasta 20 puntos por rating
        GREATEST(20 - (recency_days / 10), 0) -- Hasta 20 puntos por recencia
    );
    
    RETURN LEAST(score, 100); -- Máximo 100 puntos
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar métricas de BI
CREATE OR REPLACE FUNCTION update_bi_metrics()
RETURNS VOID AS $$
DECLARE
    current_period_start DATE := DATE_TRUNC('month', CURRENT_DATE);
    current_period_end DATE := current_period_start + INTERVAL '1 month' - INTERVAL '1 day';
BEGIN
    -- Actualizar revenue mensual
    INSERT INTO bi_metrics (metric_name, metric_value, metric_type, category, period_start, period_end)
    SELECT 
        'monthly_revenue',
        COALESCE(SUM(total_amount), 0),
        'revenue',
        'sales',
        current_period_start,
        current_period_end
    FROM reservations 
    WHERE status = 'confirmed' 
    AND created_at >= current_period_start 
    AND created_at <= current_period_end + INTERVAL '1 day'
    ON CONFLICT (metric_name, period_start, period_end) 
    DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        updated_at = NOW();
    
    -- Actualizar booking count mensual
    INSERT INTO bi_metrics (metric_name, metric_value, metric_type, category, period_start, period_end)
    SELECT 
        'monthly_bookings',
        COUNT(*),
        'count',
        'sales',
        current_period_start,
        current_period_end
    FROM reservations 
    WHERE status = 'confirmed' 
    AND created_at >= current_period_start 
    AND created_at <= current_period_end + INTERVAL '1 day'
    ON CONFLICT (metric_name, period_start, period_end) 
    DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        updated_at = NOW();
    
    -- Actualizar average order value
    INSERT INTO bi_metrics (metric_name, metric_value, metric_type, category, period_start, period_end)
    SELECT 
        'avg_order_value',
        COALESCE(AVG(total_amount), 0),
        'revenue',
        'sales',
        current_period_start,
        current_period_end
    FROM reservations 
    WHERE status = 'confirmed' 
    AND created_at >= current_period_start 
    AND created_at <= current_period_end + INTERVAL '1 day'
    ON CONFLICT (metric_name, period_start, period_end) 
    DO UPDATE SET 
        metric_value = EXCLUDED.metric_value,
        updated_at = NOW();
        
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- DATOS INICIALES DE CONFIGURACIÓN
-- ===============================================

-- Configuraciones de alertas
INSERT INTO bi_configuration (config_key, config_value, category, description) VALUES
('alert_thresholds', '{
    "revenue_drop": -10,
    "conversion_drop": -5,
    "high_churn_risk": 0.7,
    "low_satisfaction": 3.5
}', 'alerts', 'Umbrales para alertas automáticas'),

('forecast_models', '{
    "demand_forecast": {
        "algorithm": "linear_regression_seasonal",
        "confidence_threshold": 0.75,
        "update_frequency": "daily"
    },
    "price_optimization": {
        "algorithm": "elasticity_based",
        "test_ratio": 0.15,
        "confidence_threshold": 0.80
    }
}', 'models', 'Configuración de modelos predictivos'),

('dashboard_defaults', '{
    "refresh_interval": 30,
    "default_period": "30d",
    "charts": ["sales_trend", "conversion_funnel", "top_destinations"],
    "alerts_visible": true
}', 'dashboards', 'Configuración por defecto de dashboards');

-- KPIs iniciales para tracking
INSERT INTO kpi_tracking (kpi_name, kpi_value, target_value, unit, period_type, record_date, status) VALUES
('monthly_revenue', 186500, 200000, 'USD', 'monthly', CURRENT_DATE, 'below_target'),
('conversion_rate', 29.1, 30.0, '%', 'monthly', CURRENT_DATE, 'below_target'),
('customer_satisfaction', 4.2, 4.5, 'score', 'monthly', CURRENT_DATE, 'below_target'),
('avg_response_time', 2.5, 2.0, 'hours', 'monthly', CURRENT_DATE, 'above_target');

-- ===============================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ===============================================

-- Trigger para actualizar métricas cuando se crea una reserva
CREATE OR REPLACE FUNCTION trigger_update_bi_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el estado cambió a 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
        PERFORM update_bi_metrics();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_reservation_bi_update ON reservations;
CREATE TRIGGER trg_reservation_bi_update
    AFTER INSERT OR UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_bi_metrics();

-- ===============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===============================================

COMMENT ON TABLE bi_metrics IS 'Almacena métricas calculadas para Business Intelligence';
COMMENT ON TABLE analytics_events IS 'Eventos de analytics para tracking de comportamiento';
COMMENT ON TABLE user_cohorts IS 'Análisis de cohortes de usuarios por período';
COMMENT ON TABLE churn_predictions IS 'Predicciones de abandono de clientes';
COMMENT ON TABLE price_optimizations IS 'Recomendaciones de optimización de precios';
COMMENT ON TABLE demand_forecasts IS 'Predicciones de demanda por destino';
COMMENT ON TABLE customer_segments IS 'Segmentación automática de clientes';
COMMENT ON TABLE bi_alerts IS 'Alertas automáticas del sistema de BI';
COMMENT ON TABLE bi_configuration IS 'Configuraciones del sistema de Business Intelligence';
COMMENT ON TABLE custom_dashboards IS 'Dashboards personalizados por usuario';
COMMENT ON TABLE kpi_tracking IS 'Seguimiento histórico de KPIs principales';

-- Final del script
SELECT 'Business Intelligence schema creado exitosamente' as result;