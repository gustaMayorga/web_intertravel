// Extensión de las tablas para sistema de agencias completo
// =======================================================

const { dbManager } = require('../database');

async function createExtendedTables() {
  try {
    console.log('🔧 Creando tablas extendidas para sistema de agencias...');

    // Tabla de comisiones
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id),
        agency_id INTEGER REFERENCES agencies(id),
        user_id INTEGER REFERENCES users(id),
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        base_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'ARS',
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, cancelled
        paid_date TIMESTAMP NULL,
        paid_by INTEGER REFERENCES users(id),
        payment_reference VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de niveles de servicio
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS service_levels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        commission_bonus DECIMAL(5,2) DEFAULT 0,
        credit_multiplier DECIMAL(5,2) DEFAULT 1,
        min_revenue DECIMAL(10,2) DEFAULT 0,
        min_commission_rate DECIMAL(5,2) DEFAULT 0,
        features JSONB DEFAULT '[]',
        benefits JSONB DEFAULT '[]',
        color VARCHAR(7) DEFAULT '#666666',
        icon VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insertar niveles de servicio por defecto
    await dbManager.query(`
      INSERT INTO service_levels (name, display_name, description, commission_bonus, credit_multiplier, min_revenue, min_commission_rate, features, benefits, color)
      VALUES 
        ('bronze', 'Bronce', 'Nivel inicial para nuevas agencias', 0, 1, 0, 0, '["Panel básico", "Ventas estándar", "Soporte email"]', '["Acceso básico", "Comisiones estándar"]', '#CD7F32'),
        ('silver', 'Plata', 'Nivel intermedio con beneficios adicionales', 2, 1.5, 50000, 8, '["Panel avanzado", "Comisiones mejoradas", "Soporte prioritario", "Reportes mensuales"]', '["Comisión +2%", "Crédito 50% extra", "Soporte prioritario"]', '#C0C0C0'),
        ('gold', 'Oro', 'Nivel premium con acceso completo', 5, 2, 200000, 12, '["Panel premium", "Comisiones gold", "Soporte 24/7", "Reportes semanales", "API acceso"]', '["Comisión +5%", "Crédito doble", "API acceso", "Reportes avanzados"]', '#FFD700'),
        ('platinum', 'Platino', 'Nivel elite con máximos beneficios', 8, 3, 500000, 15, '["Panel completo", "Comisiones premium", "Soporte dedicado", "Reportes diarios", "API completa", "White label"]', '["Comisión +8%", "Crédito triple", "Soporte dedicado", "White label"]', '#E5E4E2')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Tabla de configuraciones de agencia
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS agency_settings (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER REFERENCES agencies(id) UNIQUE,
        service_level_id INTEGER REFERENCES service_levels(id),
        logo_url VARCHAR(500),
        brand_colors JSONB DEFAULT '{}',
        notification_settings JSONB DEFAULT '{}',
        payment_settings JSONB DEFAULT '{}',
        api_settings JSONB DEFAULT '{}',
        custom_fields JSONB DEFAULT '{}',
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de estados de cuenta
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS account_statements (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER REFERENCES agencies(id),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_revenue DECIMAL(10,2) DEFAULT 0,
        total_commission DECIMAL(10,2) DEFAULT 0,
        paid_commission DECIMAL(10,2) DEFAULT 0,
        pending_commission DECIMAL(10,2) DEFAULT 0,
        adjustments DECIMAL(10,2) DEFAULT 0,
        final_amount DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, closed
        generated_by INTEGER REFERENCES users(id),
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_date TIMESTAMP NULL,
        payment_reference VARCHAR(100),
        notes TEXT,
        file_url VARCHAR(500)
      );
    `);

    // Tabla de actividad de agencias
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS agency_activity_log (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER REFERENCES agencies(id),
        user_id INTEGER REFERENCES users(id),
        activity_type VARCHAR(50) NOT NULL, -- login, sale, commission, setting_change, etc.
        description TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de notificaciones
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER REFERENCES agencies(id),
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL, -- commission_paid, new_booking, level_upgrade, etc.
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP NULL,
        priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla de configuración de servicios por agencia
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS agency_services (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER REFERENCES agencies(id),
        package_id INTEGER REFERENCES packages(id),
        is_available BOOLEAN DEFAULT true,
        custom_price DECIMAL(10,2) NULL,
        custom_commission_rate DECIMAL(5,2) NULL,
        markup_percentage DECIMAL(5,2) DEFAULT 0,
        min_advance_days INTEGER DEFAULT 0,
        max_advance_days INTEGER DEFAULT 365,
        restrictions JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(agency_id, package_id)
      );
    `);

    // Agregar columnas adicionales a tablas existentes
    await dbManager.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS commission_paid_date TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS agency_markup DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS agent_notes TEXT;
    `);

    await dbManager.query(`
      ALTER TABLE agencies 
      ADD COLUMN IF NOT EXISTS service_level_id INTEGER REFERENCES service_levels(id),
      ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_commission DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS api_key VARCHAR(100) UNIQUE,
      ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(500);
    `);

    await dbManager.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS sales_target DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS territory VARCHAR(100),
      ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id);
    `);

    // Índices para optimización
    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_commissions_agency_id ON commissions(agency_id);
      CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
      CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_agency_activity_agency_id ON agency_activity_log(agency_id);
      CREATE INDEX IF NOT EXISTS idx_agency_activity_created_at ON agency_activity_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_agency_id ON notifications(agency_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_agency_services_agency_id ON agency_services(agency_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_commission_paid ON bookings(commission_paid);
    `);

    // Actualizar agencias existentes con nivel Bronze por defecto
    await dbManager.query(`
      UPDATE agencies 
      SET service_level_id = (SELECT id FROM service_levels WHERE name = 'bronze' LIMIT 1)
      WHERE service_level_id IS NULL;
    `);

    console.log('✅ Tablas extendidas creadas exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error creando tablas extendidas:', error);
    return { success: false, error: error.message };
  }
}

// Función para insertar datos de prueba
async function insertSampleData() {
  try {
    console.log('📝 Insertando datos de prueba...');

    // Verificar si ya existen datos
    const existingAgencies = await dbManager.query('SELECT COUNT(*) as count FROM agencies');
    if (existingAgencies.rows[0].count > 0) {
      console.log('ℹ️ Ya existen agencias, saltando inserción de datos de prueba');
      return { success: true };
    }

    // Crear agencias de ejemplo
    const agencyResult = await dbManager.query(`
      INSERT INTO agencies (
        code, name, business_name, cuit, address, city, province, country,
        phone, email, contact_person, commission_rate, credit_limit, 
        status, contract_date, service_level_id
      ) VALUES 
        ('VT001', 'Viajes Mendoza', 'Viajes Mendoza SRL', '20-12345678-9', 
         'Av. San Martín 1234', 'Mendoza', 'Mendoza', 'Argentina',
         '+54 261 423-1234', 'info@viajesmendoza.com', 'Juan Pérez', 
         10.00, 50000.00, 'active', '2024-01-01', 
         (SELECT id FROM service_levels WHERE name = 'silver')),
        ('TU002', 'Turismo Patagonia', 'Turismo Patagonia SA', '30-98765432-1',
         'Ruta 40 Km 567', 'Bariloche', 'Río Negro', 'Argentina',
         '+54 294 442-5678', 'ventas@turismopatagonia.com', 'María González',
         12.00, 100000.00, 'active', '2023-06-15',
         (SELECT id FROM service_levels WHERE name = 'gold')),
        ('EX003', 'Expediciones Norte', 'Expediciones del Norte SAS', '27-11223344-5',
         'Belgrano 890', 'Salta', 'Salta', 'Argentina',
         '+54 387 431-9012', 'contacto@expedicionesnorte.com', 'Carlos López',
         8.00, 25000.00, 'active', '2024-03-10',
         (SELECT id FROM service_levels WHERE name = 'bronze'))
      RETURNING id;
    `);

    console.log('✅ Agencias de ejemplo creadas');

    // Crear usuarios para cada agencia
    const agencies = agencyResult.rows;
    
    for (const agency of agencies) {
      await dbManager.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name,
          role_id, agency_id, is_active, sales_target
        ) VALUES 
          ('admin_${agency.id}', 'admin@agency${agency.id}.com', 
           '$2b$10$example.hash.admin', 'Administrador', 'Agencia',
           (SELECT id FROM roles WHERE name = 'admin_agencia'), ${agency.id}, true, 100000),
          ('vendedor_${agency.id}', 'vendedor@agency${agency.id}.com',
           '$2b$10$example.hash.vendedor', 'Vendedor', 'Principal', 
           (SELECT id FROM roles WHERE name = 'vendedor'), ${agency.id}, true, 50000)
      `);
    }

    console.log('✅ Usuarios de ejemplo creados');

    // Crear configuraciones de agencia
    for (const agency of agencies) {
      await dbManager.query(`
        INSERT INTO agency_settings (agency_id, notification_settings, payment_settings, preferences)
        VALUES (
          ${agency.id},
          '{"email_notifications": true, "sms_notifications": false, "commission_alerts": true}',
          '{"payment_method": "bank_transfer", "payment_frequency": "monthly"}',
          '{"currency": "ARS", "timezone": "America/Argentina/Mendoza", "language": "es"}'
        )
      `);
    }

    console.log('✅ Configuraciones de agencia creadas');

    // Crear algunos bookings de ejemplo
    await dbManager.query(`
      INSERT INTO bookings (
        booking_reference, customer_name, customer_email, customer_phone,
        package_id, total_amount, currency, status, payment_status,
        travel_date, travelers, created_at
      ) VALUES 
        ('BK-2024-001', 'Ana García', 'ana.garcia@email.com', '+54 9 261 123-4567',
         1, 1890.00, 'USD', 'confirmed', 'paid', '2024-08-15', 2, CURRENT_TIMESTAMP - INTERVAL '5 days'),
        ('BK-2024-002', 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '+54 9 294 987-6543',
         2, 1299.00, 'USD', 'confirmed', 'paid', '2024-09-01', 2, CURRENT_TIMESTAMP - INTERVAL '3 days'),
        ('BK-2024-003', 'María López', 'maria.lopez@email.com', '+54 9 387 456-7890',
         3, 2850.00, 'USD', 'pending', 'pending', '2024-10-10', 4, CURRENT_TIMESTAMP - INTERVAL '1 day')
    `);

    console.log('✅ Bookings de ejemplo creados');

    // Crear comisiones para los bookings pagados
    await dbManager.query(`
      INSERT INTO commissions (
        booking_id, agency_id, commission_rate, commission_amount, 
        base_amount, currency, status
      )
      SELECT 
        b.id, 
        (SELECT id FROM agencies ORDER BY id LIMIT 1),
        10.00,
        b.total_amount * 0.10,
        b.total_amount,
        b.currency,
        CASE WHEN b.payment_status = 'paid' THEN 'approved' ELSE 'pending' END
      FROM bookings b
      WHERE b.status = 'confirmed';
    `);

    console.log('✅ Comisiones de ejemplo creadas');

    console.log('🎉 Datos de prueba insertados exitosamente');
    return { success: true };

  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  (async () => {
    try {
      console.log('🚀 Inicializando sistema extendido de agencias...');
      
      // Asegurar conexión a la base de datos
      await dbManager.connect();
      
      const tablesResult = await createExtendedTables();
      if (!tablesResult.success) {
        throw new Error('Error creando tablas: ' + tablesResult.error);
      }
      
      const dataResult = await insertSampleData();
      if (!dataResult.success) {
        console.log('⚠️ Error insertando datos de prueba:', dataResult.error);
      }
      
      console.log('✅ Sistema extendido de agencias inicializado');
      await dbManager.disconnect();
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      await dbManager.disconnect();
      process.exit(1);
    }
  })();
}

module.exports = {
  createExtendedTables,
  insertSampleData
};
