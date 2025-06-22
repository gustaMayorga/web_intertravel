// ===============================================
// NUEVAS TABLAS PARA SISTEMA COMPLETO
// ===============================================

const { dbManager, query } = require('./database');

async function createNewTables() {
  try {
    console.log('🔧 Creando nuevas tablas del sistema...');

    // 1. TABLA PARA CONFIGURACIÓN WEB
    await query(`
      CREATE TABLE IF NOT EXISTS web_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        category VARCHAR(50) DEFAULT 'general',
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. TABLA PARA GESTIÓN DE PAQUETES TRAVEL COMPOSITOR
    await query(`
      CREATE TABLE IF NOT EXISTS tc_packages (
        id SERIAL PRIMARY KEY,
        tc_package_id VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        price_amount DECIMAL(10,2) NOT NULL,
        price_currency VARCHAR(3) DEFAULT 'USD',
        original_price DECIMAL(10,2),
        duration_days INTEGER NOT NULL,
        duration_nights INTEGER NOT NULL,
        category VARCHAR(100),
        description_short TEXT,
        description_full TEXT,
        images JSONB,
        features JSONB,
        rating_average DECIMAL(3,2),
        rating_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. TABLA PARA GESTIÓN DE AGENCIAS
    await query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        agency_code VARCHAR(50) UNIQUE NOT NULL,
        agency_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        country VARCHAR(100),
        membership_type VARCHAR(50) DEFAULT 'basic',
        commission_rate DECIMAL(5,2) DEFAULT 10.00,
        credit_limit DECIMAL(12,2) DEFAULT 0.00,
        current_balance DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'pending',
        approval_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. TABLA PARA CLIENTES DE AGENCIAS
    await query(`
      CREATE TABLE IF NOT EXISTS agency_clients (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER REFERENCES agencies(id),
        client_name VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        client_phone VARCHAR(20),
        client_document VARCHAR(50),
        preferences JSONB,
        total_bookings INTEGER DEFAULT 0,
        total_spent DECIMAL(12,2) DEFAULT 0.00,
        last_booking TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. TABLA PARA GESTIÓN DE USUARIOS/CREDENCIALES
    await query(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        permissions JSONB,
        agency_id INTEGER REFERENCES agencies(id),
        full_name VARCHAR(255),
        phone VARCHAR(20),
        last_login TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES user_credentials(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. TABLA PARA APIs DE PROVEEDORES
    await query(`
      CREATE TABLE IF NOT EXISTS provider_apis (
        id SERIAL PRIMARY KEY,
        provider_name VARCHAR(255) NOT NULL,
        api_name VARCHAR(255) NOT NULL,
        api_type VARCHAR(50) NOT NULL,
        base_url VARCHAR(500) NOT NULL,
        auth_type VARCHAR(50),
        api_key VARCHAR(500),
        username VARCHAR(255),
        password VARCHAR(255),
        headers JSONB,
        endpoints JSONB,
        rate_limit INTEGER,
        timeout_seconds INTEGER DEFAULT 30,
        is_active BOOLEAN DEFAULT true,
        last_tested TIMESTAMP,
        test_status VARCHAR(50),
        documentation_url VARCHAR(500),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. TABLA PARA CONTABILIDAD
    await query(`
      CREATE TABLE IF NOT EXISTS accounting_transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        booking_id INTEGER REFERENCES bookings(id),
        agency_id INTEGER REFERENCES agencies(id),
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_gateway VARCHAR(50),
        gateway_transaction_id VARCHAR(255),
        gateway_response JSONB,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. TABLA PARA CONFIGURACIÓN DE PASARELAS
    await query(`
      CREATE TABLE IF NOT EXISTS payment_gateways (
        id SERIAL PRIMARY KEY,
        gateway_name VARCHAR(100) NOT NULL,
        gateway_type VARCHAR(50) NOT NULL,
        public_key VARCHAR(500),
        private_key VARCHAR(500),
        webhook_url VARCHAR(500),
        webhook_secret VARCHAR(255),
        sandbox_mode BOOLEAN DEFAULT true,
        configuration JSONB,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Todas las nuevas tablas creadas exitosamente');

    // INSERTAR DATOS DE EJEMPLO
    await insertSampleData();

  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    console.log('📦 Insertando datos de ejemplo...');

    // Configuración web inicial
    const webConfigs = [
      {
        key: 'hero_title',
        value: JSON.stringify('Descubre el Mundo con InterTravel'),
        category: 'hero',
        description: 'Título principal del hero'
      },
      {
        key: 'hero_subtitle', 
        value: JSON.stringify('Viajes únicos, experiencias inolvidables. Tu próxima aventura te está esperando.'),
        category: 'hero',
        description: 'Subtítulo del hero'
      },
      {
        key: 'hero_background_image',
        value: JSON.stringify('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&auto=format&q=80'),
        category: 'hero',
        description: 'Imagen de fondo del hero'
      },
      {
        key: 'featured_discount',
        value: JSON.stringify({ percent: 15, text: '15% OFF en tu primer viaje', active: true }),
        category: 'promotions',
        description: 'Descuento destacado'
      },
      {
        key: 'contact_info',
        value: JSON.stringify({
          phone: '+54 261 XXX-XXXX',
          email: 'ventas@intertravel.com.ar',
          whatsapp: '+54 9 261 XXX-XXXX',
          address: 'Chacras Park, Edificio Ceibo, Luján de Cuyo, Mendoza'
        }),
        category: 'contact',
        description: 'Información de contacto'
      }
    ];

    for (const config of webConfigs) {
      await query(`
        INSERT INTO web_config (key, value, category, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key) DO NOTHING
      `, [config.key, config.value, config.category, config.description]);
    }

    // Usuario administrador inicial
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await query(`
      INSERT INTO user_credentials (username, email, password_hash, role, permissions, full_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (username) DO NOTHING
    `, [
      'admin',
      'admin@intertravel.com',
      adminPassword,
      'super_admin',
      JSON.stringify(['all']),
      'Administrador Principal'
    ]);

    // Configuración MercadoPago
    await query(`
      INSERT INTO payment_gateways (gateway_name, gateway_type, sandbox_mode, configuration)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [
      'MercadoPago',
      'mercadopago',
      true,
      JSON.stringify({
        country: 'AR',
        currency: 'ARS',
        supported_methods: ['credit_card', 'debit_card', 'bank_transfer']
      })
    ]);

    console.log('✅ Datos de ejemplo insertados');

  } catch (error) {
    console.error('❌ Error insertando datos:', error);
  }
}

// Ejecutar creación de tablas
createNewTables().catch(console.error);

module.exports = { createNewTables };