// ===============================================
// ACTUALIZACIÓN BASE DE DATOS - AGENTE 4
// Sistema de Derivación B2B2C
// ===============================================

const { dbManager } = require('./database');

async function createB2B2CTables() {
  try {
    console.log('🔧 Iniciando actualización de base de datos para sistema B2B2C...');

    // 1. Agregar columnas a tabla orders para tracking de agencias
    await dbManager.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'assigned_agency_id'
        ) THEN
          ALTER TABLE orders ADD COLUMN assigned_agency_id INTEGER;
          ALTER TABLE orders ADD COLUMN assigned_agency_code VARCHAR(20);
          ALTER TABLE orders ADD COLUMN assignment_date TIMESTAMP;
        END IF;
      END $$;
    `);

    // 2. Crear tabla de asignaciones de agencias
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS agency_assignments (
        id VARCHAR(100) PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        agency_id INTEGER NOT NULL,
        agency_code VARCHAR(20) NOT NULL,
        agency_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        assignment_score DECIMAL(5,2) DEFAULT 0,
        assignment_data JSONB,
        status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled, reassigned
        performance_score DECIMAL(5,2) DEFAULT 0,
        customer_satisfaction DECIMAL(5,2) DEFAULT 0,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        assigned_by VARCHAR(50) DEFAULT 'automatic',
        reassignment_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Crear tabla de notificaciones para agencias
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS agency_notifications (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER NOT NULL,
        assignment_id VARCHAR(100),
        order_id VARCHAR(50),
        type VARCHAR(50) NOT NULL, -- new_assignment, payment_received, update, reminder
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        status VARCHAR(20) DEFAULT 'unread', -- unread, read, archived
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      )
    `);

    // 4. Crear tabla de comisiones de agencias
    await dbManager.query(`
      CREATE TABLE IF NOT EXISTS agency_commissions (
        id SERIAL PRIMARY KEY,
        assignment_id VARCHAR(100) NOT NULL,
        order_id VARCHAR(50) NOT NULL,
        agency_id INTEGER NOT NULL,
        base_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, cancelled
        approved_at TIMESTAMP,
        paid_at TIMESTAMP,
        payment_reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Crear índices para optimización
    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_assigned_agency_id ON orders(assigned_agency_id);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_assignments_order_id ON agency_assignments(order_id);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_assignments_agency_id ON agency_assignments(agency_id);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_assignments_status ON agency_assignments(status);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_assignments_assigned_at ON agency_assignments(assigned_at DESC);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_notifications_agency_id ON agency_notifications(agency_id);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_notifications_status ON agency_notifications(status);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_notifications_created_at ON agency_notifications(created_at DESC);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_commissions_assignment_id ON agency_commissions(assignment_id);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_commissions_agency_id ON agency_commissions(agency_id);
    `);

    await dbManager.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_commissions_status ON agency_commissions(status);
    `);

    // 6. Agregar foreign keys
    await dbManager.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'orders_assigned_agency_fkey'
        ) THEN
          ALTER TABLE orders 
          ADD CONSTRAINT orders_assigned_agency_fkey 
          FOREIGN KEY (assigned_agency_id) REFERENCES agencies(id);
        END IF;
      END $$;
    `);

    await dbManager.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'agency_assignments_order_fkey'
        ) THEN
          ALTER TABLE agency_assignments 
          ADD CONSTRAINT agency_assignments_order_fkey 
          FOREIGN KEY (order_id) REFERENCES orders(id);
        END IF;
      END $$;
    `);

    await dbManager.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'agency_assignments_agency_fkey'
        ) THEN
          ALTER TABLE agency_assignments 
          ADD CONSTRAINT agency_assignments_agency_fkey 
          FOREIGN KEY (agency_id) REFERENCES agencies(id);
        END IF;
      END $$;
    `);

    await dbManager.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'agency_notifications_agency_fkey'
        ) THEN
          ALTER TABLE agency_notifications 
          ADD CONSTRAINT agency_notifications_agency_fkey 
          FOREIGN KEY (agency_id) REFERENCES agencies(id);
        END IF;
      END $$;
    `);

    await dbManager.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'agency_commissions_assignment_fkey'
        ) THEN
          ALTER TABLE agency_commissions 
          ADD CONSTRAINT agency_commissions_assignment_fkey 
          FOREIGN KEY (assignment_id) REFERENCES agency_assignments(id);
        END IF;
      END $$;
    `);

    await dbManager.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'agency_commissions_agency_fkey'
        ) THEN
          ALTER TABLE agency_commissions 
          ADD CONSTRAINT agency_commissions_agency_fkey 
          FOREIGN KEY (agency_id) REFERENCES agencies(id);
        END IF;
      END $$;
    `);

    console.log('✅ Estructura de base de datos actualizada correctamente');
    console.log('📊 Tablas creadas/actualizadas:');
    console.log('   - orders (columnas agregadas)');
    console.log('   - agency_assignments (nueva)');
    console.log('   - agency_notifications (nueva)');
    console.log('   - agency_commissions (nueva)');
    console.log('🔗 Foreign keys y índices establecidos');

    return { success: true };

  } catch (error) {
    console.error('❌ Error actualizando base de datos:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { createB2B2CTables };

// Ejecutar si se llama directamente
if (require.main === module) {
  (async () => {
    const { connect } = require('./database');
    await connect();
    await createB2B2CTables();
    process.exit(0);
  })();
}
