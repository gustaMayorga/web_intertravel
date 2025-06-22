-- ===============================================
-- EXTENSIÓN DE BASE DE DATOS INTERTRAVEL
-- Funcionalidades avanzadas para ventas automáticas
-- ===============================================

-- 1. TABLA DE DATOS DE VENTAS AUTOMÁTICAS
CREATE TABLE IF NOT EXISTS sales_data (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) REFERENCES orders(id),
  customer_data JSONB NOT NULL,
  travel_documents JSONB DEFAULT '[]', -- URLs de documentos generados
  checklist_data JSONB DEFAULT '[]',   -- Checklist personalizado por cliente
  reminder_schedule JSONB DEFAULT '[]', -- Programa de recordatorios
  remarketing_data JSONB DEFAULT '{}',  -- Datos para remarketing
  auto_sync_status VARCHAR(20) DEFAULT 'pending',
  sync_attempts INTEGER DEFAULT 0,
  last_sync_at TIMESTAMP,
  error_log TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE RECORDATORIOS AUTOMATIZADOS
CREATE TABLE IF NOT EXISTS automated_reminders (
  id SERIAL PRIMARY KEY,
  sales_data_id INTEGER REFERENCES sales_data(id),
  reminder_type VARCHAR(50) NOT NULL, -- 'pre_trip', 'documents', 'checklist', 'post_trip'
  trigger_date DATE NOT NULL,
  trigger_time TIME DEFAULT '09:00:00',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  delivery_method VARCHAR(20) DEFAULT 'email', -- 'email', 'sms', 'push', 'whatsapp'
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'failed'
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  response_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SISTEMA DE PERMISOS AVANZADO
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL, -- Jerarquía de permisos
  is_system BOOLEAN DEFAULT false, -- Roles del sistema no modificables
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- 'admin', 'agency', 'user', 'system'
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
  resource VARCHAR(50) NOT NULL, -- 'packages', 'bookings', 'users', 'settings'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- 4. SISTEMA DE REFERIDOS AUTOMÁTICO
CREATE TABLE IF NOT EXISTS referral_program (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER REFERENCES agencies(id),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'expired'
  total_referrals INTEGER DEFAULT 0,
  total_referred_sales DECIMAL(12,2) DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  commission_paid DECIMAL(10,2) DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  terms_conditions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_tracking (
  id SERIAL PRIMARY KEY,
  referral_code VARCHAR(20) REFERENCES referral_program(referral_code),
  referrer_agency_id INTEGER REFERENCES agencies(id),
  referred_customer_email VARCHAR(255) NOT NULL,
  referred_customer_name VARCHAR(255),
  referred_customer_phone VARCHAR(20),
  order_id VARCHAR(50) REFERENCES orders(id),
  sale_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'paid', 'cancelled'
  conversion_date TIMESTAMP,
  commission_paid_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. SEPARACIÓN DE CLIENTES
CREATE TABLE IF NOT EXISTS customer_classification (
  id SERIAL PRIMARY KEY,
  customer_email VARCHAR(255) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  classification VARCHAR(20) NOT NULL, -- 'direct', 'agency', 'referral'
  agency_id INTEGER REFERENCES agencies(id), -- NULL para clientes directos
  referrer_agency_id INTEGER REFERENCES agencies(id), -- Para clientes referidos
  acquisition_source VARCHAR(100), -- 'website', 'agency', 'referral', 'social', 'ads'
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  first_purchase_date DATE,
  last_purchase_date DATE,
  preferred_destinations JSONB DEFAULT '[]',
  communication_preferences JSONB DEFAULT '{}',
  remarketing_segments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. SISTEMA DE APROBACIONES ABM
CREATE TABLE IF NOT EXISTS approval_workflows (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'agency_registration', 'user_creation', 'permission_change', 'commission_adjustment'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requested_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  approval_level VARCHAR(20) NOT NULL, -- 'admin', 'super_admin', 'system'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  request_data JSONB NOT NULL,
  approval_data JSONB,
  rejection_reason TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  processed_by INTEGER REFERENCES users(id)
);

-- 7. CONFIGURACIÓN DEL SISTEMA
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'general', 'payments', 'notifications', 'remarketing'
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  display_name VARCHAR(100),
  description TEXT,
  data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json', 'array'
  is_encrypted BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Visible para usuarios no admin
  validation_rules JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, setting_key)
);

-- 8. LOGS DE ACTIVIDAD DETALLADOS
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  severity VARCHAR(10) DEFAULT 'info', -- 'debug', 'info', 'warning', 'error', 'critical'
  source VARCHAR(50) DEFAULT 'web', -- 'web', 'api', 'mobile', 'system'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. MÉTRICAS DE REMARKETING
CREATE TABLE IF NOT EXISTS remarketing_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'email', 'facebook', 'google', 'whatsapp'
  target_segment JSONB NOT NULL, -- Criterios de segmentación
  template_data JSONB NOT NULL,
  schedule_config JSONB, -- Configuración de envío automático
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  cost_per_campaign DECIMAL(10,2) DEFAULT 0,
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  roi DECIMAL(8,2) DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. DOCUMENTOS AUTOMATIZADOS
CREATE TABLE IF NOT EXISTS document_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'voucher', 'itinerary', 'checklist', 'confirmation'
  template_content TEXT NOT NULL, -- HTML template
  variables JSONB DEFAULT '[]', -- Variables disponibles en el template
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generated_documents (
  id SERIAL PRIMARY KEY,
  sales_data_id INTEGER REFERENCES sales_data(id),
  template_id INTEGER REFERENCES document_templates(id),
  document_type VARCHAR(50) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  generation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'generated', 'failed'
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP,
  error_message TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ===============================================

-- Sales Data
CREATE INDEX IF NOT EXISTS idx_sales_data_order_id ON sales_data(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_data_status ON sales_data(auto_sync_status);
CREATE INDEX IF NOT EXISTS idx_sales_data_created_at ON sales_data(created_at DESC);

-- Reminders
CREATE INDEX IF NOT EXISTS idx_reminders_trigger_date ON automated_reminders(trigger_date);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON automated_reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_sales_data ON automated_reminders(sales_data_id);

-- Permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

-- Referrals
CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_program(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_code ON referral_tracking(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_email ON referral_tracking(referred_customer_email);

-- Customer Classification
CREATE INDEX IF NOT EXISTS idx_customer_classification_email ON customer_classification(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_classification_type ON customer_classification(classification);
CREATE INDEX IF NOT EXISTS idx_customer_classification_agency ON customer_classification(agency_id);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ===============================================
-- DATOS INICIALES
-- ===============================================

-- Roles del sistema
INSERT INTO roles (name, display_name, description, level, is_system) VALUES
('super_admin', 'Super Administrador', 'Acceso completo al sistema', 100, true),
('admin', 'Administrador', 'Gestión general del sistema', 80, true),
('agency_admin', 'Administrador de Agencia', 'Gestión de agencia y sus usuarios', 60, true),
('agency_user', 'Usuario de Agencia', 'Operador de agencia', 40, true),
('user', 'Usuario', 'Cliente final', 20, true)
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  level = EXCLUDED.level;

-- Permisos del sistema
INSERT INTO permissions (name, display_name, description, module, action, resource) VALUES
-- Dashboard
('dashboard.view', 'Ver Dashboard', 'Acceso al panel de control', 'admin', 'read', 'dashboard'),

-- Packages
('packages.view', 'Ver Paquetes', 'Consultar catálogo de paquetes', 'system', 'read', 'packages'),
('packages.create', 'Crear Paquetes', 'Crear nuevos paquetes', 'admin', 'create', 'packages'),
('packages.update', 'Editar Paquetes', 'Modificar paquetes existentes', 'admin', 'update', 'packages'),
('packages.delete', 'Eliminar Paquetes', 'Eliminar paquetes', 'admin', 'delete', 'packages'),

-- Bookings
('bookings.view', 'Ver Reservas', 'Consultar reservas', 'system', 'read', 'bookings'),
('bookings.create', 'Crear Reservas', 'Generar nuevas reservas', 'system', 'create', 'bookings'),
('bookings.update', 'Editar Reservas', 'Modificar reservas', 'admin', 'update', 'bookings'),
('bookings.cancel', 'Cancelar Reservas', 'Cancelar reservas', 'admin', 'delete', 'bookings'),

-- Users
('users.view', 'Ver Usuarios', 'Consultar usuarios', 'admin', 'read', 'users'),
('users.create', 'Crear Usuarios', 'Crear nuevos usuarios', 'admin', 'create', 'users'),
('users.update', 'Editar Usuarios', 'Modificar usuarios', 'admin', 'update', 'users'),
('users.delete', 'Eliminar Usuarios', 'Eliminar usuarios', 'admin', 'delete', 'users'),

-- Agencies
('agencies.view', 'Ver Agencias', 'Consultar agencias', 'admin', 'read', 'agencies'),
('agencies.create', 'Crear Agencias', 'Registrar nuevas agencias', 'admin', 'create', 'agencies'),
('agencies.update', 'Editar Agencias', 'Modificar agencias', 'admin', 'update', 'agencies'),
('agencies.manage', 'Gestionar Agencias', 'Gestión completa de agencias', 'admin', 'manage', 'agencies'),

-- Reports
('reports.view', 'Ver Reportes', 'Acceso a reportes generales', 'admin', 'read', 'reports'),
('reports.agency', 'Reportes de Agencia', 'Reportes específicos de agencia', 'agency', 'read', 'reports'),
('reports.financial', 'Reportes Financieros', 'Reportes contables y financieros', 'admin', 'read', 'reports'),

-- Settings
('settings.view', 'Ver Configuración', 'Consultar configuración', 'admin', 'read', 'settings'),
('settings.update', 'Editar Configuración', 'Modificar configuración del sistema', 'admin', 'update', 'settings'),

-- Permissions
('permissions.view', 'Ver Permisos', 'Consultar permisos y roles', 'admin', 'read', 'permissions'),
('permissions.manage', 'Gestionar Permisos', 'Gestión completa de permisos', 'admin', 'manage', 'permissions'),

-- System
('system.manage', 'Gestión Sistema', 'Acceso completo al sistema', 'system', 'manage', 'system')

ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Asignar permisos a roles
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Configuración inicial del sistema
INSERT INTO system_settings (category, setting_key, setting_value, display_name, description, data_type, is_public) VALUES
('general', 'company_name', '"InterTravel Group"', 'Nombre de la Empresa', 'Nombre oficial de la empresa', 'string', true),
('general', 'company_evyt', '"15.566"', 'EVYT', 'Número de EVYT', 'string', true),
('general', 'contact_email', '"ventas@intertravel.com.ar"', 'Email de Contacto', 'Email principal de contacto', 'string', true),
('general', 'contact_phone', '"+54 261 XXX-XXXX"', 'Teléfono de Contacto', 'Teléfono principal', 'string', true),

('payments', 'auto_voucher_generation', 'true', 'Generación Automática de Vouchers', 'Generar vouchers automáticamente al confirmar pago', 'boolean', false),
('payments', 'auto_document_delivery', 'true', 'Entrega Automática de Documentos', 'Enviar documentos automáticamente por email', 'boolean', false),

('notifications', 'reminder_enabled', 'true', 'Recordatorios Habilitados', 'Sistema de recordatorios automáticos activo', 'boolean', false),
('notifications', 'remarketing_enabled', 'true', 'Remarketing Habilitado', 'Campañas de remarketing automáticas activas', 'boolean', false),
('notifications', 'whatsapp_enabled', 'false', 'WhatsApp Habilitado', 'Envío de notificaciones por WhatsApp', 'boolean', false),

('remarketing', 'facebook_pixel_id', '""', 'Facebook Pixel ID', 'ID del pixel de Facebook para tracking', 'string', false),
('remarketing', 'google_ads_id', '""', 'Google Ads ID', 'ID de Google Ads para remarketing', 'string', false),
('remarketing', 'auto_campaign_creation', 'false', 'Creación Automática de Campañas', 'Crear campañas de remarketing automáticamente', 'boolean', false)

ON CONFLICT (category, setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Template de documentos básicos
INSERT INTO document_templates (name, type, template_content, variables, is_active, is_default) VALUES
('Voucher Standard', 'voucher', 
'<h1>Voucher de Reserva - {{company_name}}</h1>
<p><strong>Reserva:</strong> {{booking_reference}}</p>
<p><strong>Cliente:</strong> {{customer_name}}</p>
<p><strong>Destino:</strong> {{destination}}</p>
<p><strong>Fecha de Viaje:</strong> {{travel_date}}</p>
<p><strong>Duración:</strong> {{duration}}</p>
<p><strong>Total:</strong> {{total_amount}}</p>', 
'["company_name", "booking_reference", "customer_name", "destination", "travel_date", "duration", "total_amount"]',
true, true),

('Checklist de Viaje', 'checklist',
'<h2>Lista de Verificación para su Viaje</h2>
<h3>30 días antes:</h3>
<ul>
<li>Verificar vigencia del pasaporte</li>
<li>Consultar requisitos de visa</li>
<li>Contratar seguro de viaje</li>
</ul>
<h3>15 días antes:</h3>
<ul>
<li>Confirmar vuelos</li>
<li>Check-in online</li>
<li>Revisar documentación</li>
</ul>',
'["destination", "travel_date", "customer_name"]',
true, true)

ON CONFLICT DO NOTHING;

-- ===============================================
-- FUNCIONES ÚTILES
-- ===============================================

-- Función para generar código de referido
CREATE OR REPLACE FUNCTION generate_referral_code(agency_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
BEGIN
    code := 'REF-' || agency_id || '-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6));
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular comisión de referido
CREATE OR REPLACE FUNCTION calculate_referral_commission(
    referral_code VARCHAR(20),
    sale_amount DECIMAL(10,2)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    commission_rate DECIMAL(5,2);
    commission_amount DECIMAL(10,2);
BEGIN
    SELECT rp.commission_rate INTO commission_rate
    FROM referral_program rp
    WHERE rp.referral_code = calculate_referral_commission.referral_code
    AND rp.status = 'active';
    
    IF commission_rate IS NULL THEN
        RETURN 0;
    END IF;
    
    commission_amount := sale_amount * (commission_rate / 100);
    RETURN commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que lo necesiten
CREATE TRIGGER update_sales_data_updated_at BEFORE UPDATE ON sales_data FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_referral_program_updated_at BEFORE UPDATE ON referral_program FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customer_classification_updated_at BEFORE UPDATE ON customer_classification FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===============================================
-- VERIFICACIÓN FINAL
-- ===============================================

SELECT 'Database extension completed successfully!' as status;