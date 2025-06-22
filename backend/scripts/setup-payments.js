// ===============================================
// MIGRACIÓN DE TABLA ORDERS - INTERTRAVEL
// Sistema de órdenes de pago completo
// ===============================================

const { query } = require('../database');

async function createOrdersTable() {
  try {
    console.log('🗄️ Creando tabla de órdenes...');

    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        package_id VARCHAR(255) NOT NULL,
        package_title VARCHAR(500) NOT NULL,
        package_destination VARCHAR(255),
        package_duration VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        travelers INTEGER DEFAULT 1,
        payment_method VARCHAR(50) NOT NULL,
        payment_id VARCHAR(255),
        payment_data JSONB,
        payment_response JSONB,
        transaction_id VARCHAR(255),
        special_requests TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        confirmed_at TIMESTAMP WITH TIME ZONE,
        failed_at TIMESTAMP WITH TIME ZONE,
        failure_reason TEXT
      )
    `);

    // Crear índices para optimizar consultas
    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
    `);

    console.log('✅ Tabla orders creada exitosamente');

    // Crear tabla de logs de transacciones para auditoría
    await query(`
      CREATE TABLE IF NOT EXISTS transaction_logs (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) REFERENCES orders(id),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        provider VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_order_id ON transaction_logs(order_id);
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_transaction_logs_event_type ON transaction_logs(event_type);
    `);

    console.log('✅ Tabla transaction_logs creada exitosamente');

    return {
      success: true,
      message: 'Tablas de pagos creadas exitosamente'
    };

  } catch (error) {
    console.error('❌ Error creando tablas de pagos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para insertar datos de prueba
async function seedOrdersData() {
  try {
    console.log('🌱 Insertando datos de prueba en orders...');

    const sampleOrders = [
      {
        id: 'ORDER-1234567890-001',
        package_id: 'f2619e65-86c1-43c6-b546-00994fe0ad8c',
        package_title: 'Perú Mágico - Cusco y Machu Picchu',
        package_destination: 'Cusco, Perú',
        package_duration: '8 días, 7 noches',
        amount: 1890.00,
        currency: 'USD',
        customer_name: 'María García',
        customer_email: 'maria.garcia@email.com',
        customer_phone: '+54 9 261 555-0001',
        travelers: 2,
        payment_method: 'mercadopago',
        status: 'confirmed',
        confirmed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        transaction_id: 'MP-12345678'
      },
      {
        id: 'ORDER-1234567890-002',
        package_id: 'd4567890-12ab-cdef-4567-890123abcdef',
        package_title: 'Tokio Futurista - Tradición y Modernidad',
        package_destination: 'Tokio, Japón',
        package_duration: '10 días, 9 noches',
        amount: 2850.00,
        currency: 'USD',
        customer_name: 'Carlos López',
        customer_email: 'carlos.lopez@email.com',
        customer_phone: '+54 9 261 555-0002',
        travelers: 1,
        payment_method: 'stripe',
        status: 'confirmed',
        confirmed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
        transaction_id: 'pi_1234567890abcdef'
      },
      {
        id: 'ORDER-1234567890-003',
        package_id: 'e7934b25-15c8-4f2e-b947-22405da2ef7a',
        package_title: 'Cancún Paradise - Riviera Maya Todo Incluido',
        package_destination: 'Cancún, México',
        package_duration: '7 días, 6 noches',
        amount: 1299.00,
        currency: 'USD',
        customer_name: 'Ana Rodríguez',
        customer_email: 'ana.rodriguez@email.com',
        customer_phone: '+54 9 261 555-0003',
        travelers: 2,
        payment_method: 'mercadopago',
        status: 'pending'
      },
      {
        id: 'ORDER-1234567890-004',
        package_id: 'b2345678-90ab-cdef-2345-678901abcdef',
        package_title: 'París Romántico - Ciudad de la Luz',
        package_destination: 'París, Francia',
        package_duration: '7 días, 6 noches',
        amount: 1850.00,
        currency: 'USD',
        customer_name: 'Diego Martínez',
        customer_email: 'diego.martinez@email.com',
        customer_phone: '+54 9 261 555-0004',
        travelers: 2,
        payment_method: 'stripe',
        status: 'failed',
        failed_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
        failure_reason: 'Insufficient funds'
      }
    ];

    for (const order of sampleOrders) {
      await query(`
        INSERT INTO orders (
          id, package_id, package_title, package_destination, package_duration,
          amount, currency, customer_name, customer_email, customer_phone,
          travelers, payment_method, status, confirmed_at, failed_at, 
          failure_reason, transaction_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO NOTHING
      `, [
        order.id,
        order.package_id,
        order.package_title,
        order.package_destination,
        order.package_duration,
        order.amount,
        order.currency,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.travelers,
        order.payment_method,
        order.status,
        order.confirmed_at || null,
        order.failed_at || null,
        order.failure_reason || null,
        order.transaction_id || null
      ]);
    }

    console.log('✅ Datos de prueba insertados en orders');

    // Insertar logs de transacciones de ejemplo
    const sampleLogs = [
      {
        order_id: 'ORDER-1234567890-001',
        event_type: 'payment_created',
        event_data: { provider: 'mercadopago', amount: 1890 },
        provider: 'mercadopago'
      },
      {
        order_id: 'ORDER-1234567890-001',
        event_type: 'payment_confirmed',
        event_data: { transaction_id: 'MP-12345678', status: 'approved' },
        provider: 'mercadopago'
      },
      {
        order_id: 'ORDER-1234567890-002',
        event_type: 'payment_created',
        event_data: { provider: 'stripe', amount: 2850 },
        provider: 'stripe'
      },
      {
        order_id: 'ORDER-1234567890-002',
        event_type: 'payment_confirmed',
        event_data: { payment_intent_id: 'pi_1234567890abcdef', status: 'succeeded' },
        provider: 'stripe'
      }
    ];

    for (const log of sampleLogs) {
      await query(`
        INSERT INTO transaction_logs (order_id, event_type, event_data, provider)
        VALUES ($1, $2, $3, $4)
      `, [
        log.order_id,
        log.event_type,
        JSON.stringify(log.event_data),
        log.provider
      ]);
    }

    console.log('✅ Logs de transacciones insertados');

    return {
      success: true,
      message: 'Datos de prueba insertados exitosamente'
    };

  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para obtener estadísticas de la tabla
async function getOrdersStats() {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders,
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'confirmed' THEN amount ELSE NULL END) as avg_order_value,
        COUNT(CASE WHEN payment_method = 'mercadopago' THEN 1 END) as mercadopago_orders,
        COUNT(CASE WHEN payment_method = 'stripe' THEN 1 END) as stripe_orders
      FROM orders
    `);

    const recentActivity = await query(`
      SELECT 
        o.id,
        o.package_title,
        o.customer_name,
        o.amount,
        o.currency,
        o.status,
        o.payment_method,
        o.created_at
      FROM orders o
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    return {
      success: true,
      stats: stats.rows[0],
      recentActivity: recentActivity.rows
    };

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createOrdersTable,
  seedOrdersData,
  getOrdersStats
};