// PostgreSQL Configuration for InterTravel
require('dotenv').config();
const { Pool } = require('pg');

// Database configuration
const DB_CONFIG = {
  // PostgreSQL Production (Hostinger/Railway/Supabase)
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'intertravel_prod',
    user: process.env.DB_USER || 'intertravel_user',
    password: process.env.DB_PASSWORD || 'CHANGE_THIS_PASSWORD',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // PostgreSQL Development (local)
  development: {
    host: 'localhost',
    port: 5432,
    database: 'intertravel_dev',
    user: 'postgres',
    password: 'postgres',
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

class PostgreSQLManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.environment = process.env.NODE_ENV || 'development';
  }

  async connect() {
    try {
      const config = this.environment === 'production' ? DB_CONFIG.production : DB_CONFIG.development;
      
      console.log(`🐘 Conectando a PostgreSQL (${this.environment})...`);
      
      this.pool = new Pool(config);
      
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();
      
      this.isConnected = true;
      console.log('✅ PostgreSQL conectado exitosamente');
      console.log(`📊 Versión: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
      console.log(`⏰ Hora servidor: ${result.rows[0].current_time}`);
      
      // Setup error handlers
      this.setupEventHandlers();
      
      return { success: true, environment: this.environment };
      
    } catch (error) {
      console.error('❌ Error conectando PostgreSQL:', error.message);
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  setupEventHandlers() {
    this.pool.on('error', (err) => {
      console.error('❌ PostgreSQL Pool Error:', err);
      this.isConnected = false;
    });

    this.pool.on('connect', () => {
      console.log('🔗 Nueva conexión PostgreSQL establecida');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('🛑 PostgreSQL: Pool de conexiones cerrado');
      this.isConnected = false;
    }
  }

  async query(text, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.log(`⚠️ Consulta lenta (${duration}ms): ${text.substring(0, 100)}...`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Query Error:', error.message);
      console.error('📝 Query:', text);
      console.error('📋 Params:', params);
      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }

  getStatus() {
    return {
      connected: this.isConnected,
      environment: this.environment,
      totalCount: this.pool?.totalCount || 0,
      idleCount: this.pool?.idleCount || 0,
      waitingCount: this.pool?.waitingCount || 0
    };
  }

  // Database initialization and migrations
  async initializeDatabase() {
    try {
      console.log('🔧 Inicializando estructura de base de datos...');
      
      await this.createTables();
      await this.createIndexes();
      await this.insertDefaultData();
      
      console.log('✅ Base de datos inicializada correctamente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      return { success: false, error: error.message };
    }
  }

  async createTables() {
    const tables = [
      // Agencies table (CRÍTICA - faltaba)
      `CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        business_name VARCHAR(255),
        cuit VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        province VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Argentina',
        phone VARCHAR(20),
        email VARCHAR(255) UNIQUE NOT NULL,
        contact_person VARCHAR(255),
        commission_rate DECIMAL(5,2) DEFAULT 10.00,
        credit_limit DECIMAL(10,2) DEFAULT 0.00,
        current_balance DECIMAL(10,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'pending',
        contract_date DATE,
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        updated_by INTEGER
      )`,

      // Users table (agregar agency_id)
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        full_name VARCHAR(255),
        phone VARCHAR(20),
        agency_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )`,

      // Leads table
      `CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        source VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'new',
        conversion_value DECIMAL(10,2),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        contacted_at TIMESTAMP,
        converted_at TIMESTAMP
      )`,

      // Packages table
      `CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        package_id VARCHAR(100) UNIQUE NOT NULL,
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
        status VARCHAR(20) DEFAULT 'active',
        source VARCHAR(50) DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Bookings table
      `CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_reference VARCHAR(50) UNIQUE NOT NULL,
        package_id VARCHAR(100) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        travelers_count INTEGER DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending',
        travel_date DATE,
        special_requests TEXT,
        payment_status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        source VARCHAR(50) DEFAULT 'web',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP,
        cancelled_at TIMESTAMP
      )`,

      // Admin activity log
      `CREATE TABLE IF NOT EXISTS admin_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(100),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // System config
      `CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // === MÓDULO DE PAGOS (AGENTE 3) ===
      // Tabla de órdenes de pago
      `CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        package_id VARCHAR(100) NOT NULL,
        package_title VARCHAR(500) NOT NULL,
        package_destination VARCHAR(255),
        package_duration VARCHAR(100),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        travelers INTEGER DEFAULT 1,
        payment_method VARCHAR(20) NOT NULL, -- 'mercadopago' | 'stripe'
        payment_id VARCHAR(255),
        payment_data JSONB,
        special_requests TEXT,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'confirmed' | 'failed' | 'cancelled'
        transaction_id VARCHAR(255),
        payment_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP,
        failed_at TIMESTAMP,
        failure_reason TEXT
      )`,

      // Tabla de transacciones de pago (renombrada para evitar conflicto)
      `CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id),
        gateway VARCHAR(20) NOT NULL, -- 'mercadopago' | 'stripe'
        gateway_transaction_id VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'cancelled'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de vouchers generados
      `CREATE TABLE IF NOT EXISTS vouchers (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id),
        filename VARCHAR(255) NOT NULL,
        filepath TEXT NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // === MÓDULO CONTABLE ===
      // Plan de cuentas contables
      `CREATE TABLE IF NOT EXISTS financial_accounts (
        id SERIAL PRIMARY KEY,
        account_code VARCHAR(20) UNIQUE NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50) NOT NULL, -- assets, liabilities, equity, revenue, expenses
        parent_account_id INTEGER,
        level INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Transacciones contables (diferente de payment_transactions)
      `CREATE TABLE IF NOT EXISTS accounting_transactions (
        id SERIAL PRIMARY KEY,
        transaction_number VARCHAR(50) UNIQUE NOT NULL,
        transaction_date DATE NOT NULL,
        reference VARCHAR(100),
        description TEXT NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending', -- pending, posted, cancelled
        created_by INTEGER,
        approved_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        posted_at TIMESTAMP
      )`,

      // Detalle de asientos contables
      `CREATE TABLE IF NOT EXISTS accounting_entries (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        debit_amount DECIMAL(12,2) DEFAULT 0,
        credit_amount DECIMAL(12,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Facturación
      `CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        agency_id INTEGER,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
        payment_terms INTEGER DEFAULT 30, -- días
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP
      )`,

      // Líneas de factura
      `CREATE TABLE IF NOT EXISTS invoice_lines (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        line_total DECIMAL(10,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Pagos recibidos
      `CREATE TABLE IF NOT EXISTS payment_records (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_id INTEGER,
        agency_id INTEGER,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL, -- transfer, card, cash, check
        payment_date DATE NOT NULL,
        reference VARCHAR(100),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'confirmed', -- pending, confirmed, rejected
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // === AMPLIACIÓN AGENCIAS ===
      // Solicitudes de alta de agencias
      `CREATE TABLE IF NOT EXISTS agency_applications (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        business_name VARCHAR(255),
        cuit VARCHAR(20),
        contact_person VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        province VARCHAR(100),
        documentation JSONB, -- URLs de documentos subidos
        status VARCHAR(20) DEFAULT 'pending', -- pending, reviewing, approved, rejected
        application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_by INTEGER,
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        commission_rate_proposed DECIMAL(5,2),
        credit_limit_requested DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Sistema de rankings de agencias
      `CREATE TABLE IF NOT EXISTS agency_rankings (
        id SERIAL PRIMARY KEY,
        ranking_name VARCHAR(50) NOT NULL, -- bronze, silver, gold, platinum, diamond
        min_monthly_sales DECIMAL(10,2) NOT NULL,
        base_commission_rate DECIMAL(5,2) NOT NULL,
        bonus_rate DECIMAL(5,2) DEFAULT 0,
        credit_limit_multiplier DECIMAL(3,2) DEFAULT 1.0,
        benefits JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Reglas de comisiones personalizadas
      `CREATE TABLE IF NOT EXISTS commission_rules (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER NOT NULL,
        product_category VARCHAR(100),
        destination VARCHAR(100),
        commission_type VARCHAR(20) NOT NULL, -- percentage, fixed, tiered
        commission_value DECIMAL(8,2) NOT NULL,
        min_amount DECIMAL(10,2),
        max_amount DECIMAL(10,2),
        effective_from DATE NOT NULL,
        effective_until DATE,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Performance de agencias (calculado mensualmente)
      `CREATE TABLE IF NOT EXISTS agency_performance (
        id SERIAL PRIMARY KEY,
        agency_id INTEGER NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        total_sales DECIMAL(12,2) DEFAULT 0,
        total_bookings INTEGER DEFAULT 0,
        commission_earned DECIMAL(10,2) DEFAULT 0,
        ranking_id INTEGER,
        performance_score DECIMAL(5,2) DEFAULT 0,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // === TABLA DE REVIEWS/OPINIONES ===
      `CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        text TEXT NOT NULL,
        trip VARCHAR(255) NOT NULL,
        avatar TEXT,
        date DATE NOT NULL,
        verified BOOLEAN DEFAULT true,
        featured BOOLEAN DEFAULT false,
        google_review_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.query(table);
    }

    console.log('✅ Tablas creadas/verificadas');
    
    // Agregar foreign keys después de crear todas las tablas
    await this.addForeignKeys();
  }

  async addForeignKeys() {
    try {
      // Verificar y agregar foreign key para admin_activity
      const adminActivityConstraint = await this.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'admin_activity' 
        AND constraint_name = 'admin_activity_user_id_fkey'
      `);
      
      if (adminActivityConstraint.rows.length === 0) {
        await this.query(`
          ALTER TABLE admin_activity 
          ADD CONSTRAINT admin_activity_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id)
        `);
      }
      
      // Verificar y agregar foreign key para users -> agencies
      const usersConstraint = await this.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_agency_id_fkey'
      `);
      
      if (usersConstraint.rows.length === 0) {
        await this.query(`
          ALTER TABLE users 
          ADD CONSTRAINT users_agency_id_fkey 
          FOREIGN KEY (agency_id) REFERENCES agencies(id)
        `);
      }
      
      console.log('✅ Foreign keys agregadas');
    } catch (error) {
      console.log('⚠️ Warning: Foreign keys no pudieron ser agregadas:', error.message);
    }
  }

  async createIndexes() {
    const indexes = [
      // Leads indexes
      'CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)',
      'CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source)',
      'CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)',
      'CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)',
      
      // Packages indexes
      'CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination)',
      'CREATE INDEX IF NOT EXISTS idx_packages_country ON packages(country)',
      'CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category)',
      'CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status)',
      'CREATE INDEX IF NOT EXISTS idx_packages_price ON packages(price_amount)',
      'CREATE INDEX IF NOT EXISTS idx_packages_created_at ON packages(created_at DESC)',
      
      // Bookings indexes
      'CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_travel_date ON bookings(travel_date)',
      
      // Users indexes
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_users_agency_id ON users(agency_id)',
      
      // Agencies indexes
      'CREATE INDEX IF NOT EXISTS idx_agencies_code ON agencies(code)',
      'CREATE INDEX IF NOT EXISTS idx_agencies_email ON agencies(email)',
      'CREATE INDEX IF NOT EXISTS idx_agencies_status ON agencies(status)',
      'CREATE INDEX IF NOT EXISTS idx_agencies_city ON agencies(city)',
      'CREATE INDEX IF NOT EXISTS idx_agencies_province ON agencies(province)',
      
      // Activity log indexes
      'CREATE INDEX IF NOT EXISTS idx_activity_user_id ON admin_activity(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_activity_action ON admin_activity(action)',
      'CREATE INDEX IF NOT EXISTS idx_activity_created_at ON admin_activity(created_at DESC)',
      
      // === ÍNDICES MÓDULO DE PAGOS ===
      // Orders indexes
      'CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_orders_package_id ON orders(package_id)',
      
      // Payment Transactions indexes (nueva tabla)
      'CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON payment_transactions(gateway_transaction_id)',
      'CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status)',
      
      // Accounting Transactions indexes (nueva tabla)
      'CREATE INDEX IF NOT EXISTS idx_accounting_transactions_number ON accounting_transactions(transaction_number)',
      'CREATE INDEX IF NOT EXISTS idx_accounting_transactions_date ON accounting_transactions(transaction_date)',
      'CREATE INDEX IF NOT EXISTS idx_accounting_transactions_status ON accounting_transactions(status)',
      
      // Accounting Entries indexes (nueva tabla)
      'CREATE INDEX IF NOT EXISTS idx_accounting_entries_transaction ON accounting_entries(transaction_id)',
      'CREATE INDEX IF NOT EXISTS idx_accounting_entries_account ON accounting_entries(account_id)',
      
      // Vouchers indexes
      'CREATE INDEX IF NOT EXISTS idx_vouchers_order_id ON vouchers(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_vouchers_generated_at ON vouchers(generated_at DESC)',
      
      // === ÍNDICES PARA REVIEWS ===
      'CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_featured ON reviews(featured)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date DESC)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_google_id ON reviews(google_review_id)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_location ON reviews(location)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_name ON reviews(name)'
    ];

    for (const index of indexes) {
      try {
        await this.query(index);
      } catch (error) {
        console.log(`⚠️ Warning: Índice no pudo ser creado: ${error.message}`);
      }
    }

    console.log('✅ Índices creados/verificados');
  }

  async insertDefaultData() {
    try {
      // Check if admin user exists
      const adminExists = await this.query(
        'SELECT id FROM users WHERE username = $1',
        ['admin']
      );

      if (adminExists.rows.length === 0) {
        // Create default admin user
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await this.query(`
          INSERT INTO users (username, email, password_hash, role, full_name, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'admin',
          'admin@intertravel.com',
          hashedPassword,
          'super_admin',
          'Administrador Principal',
          true
        ]);

        console.log('✅ Usuario admin creado');
      }

      // Crear agencia de demo
      const agencyExists = await this.query(
        'SELECT id FROM agencies WHERE code = $1',
        ['VIAJES_TOTAL']
      );

      if (agencyExists.rows.length === 0) {
        const agencyResult = await this.query(`
          INSERT INTO agencies (
            code, name, business_name, email, phone, address, city, province, country,
            contact_person, commission_rate, status, contract_date
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `, [
          'VIAJES_TOTAL',
          'Viajes Total',
          'Viajes Total S.R.L.',
          'info@viajestotal.com.ar',
          '+54 261 4XX-XXXX',
          'Av. San Martín 1234, Local 5',
          'Mendoza',
          'Mendoza',
          'Argentina',
          'Ana García',
          12.50,
          'active',
          '2024-01-15'
        ]);

        const agencyId = agencyResult.rows[0].id;

        // Crear usuario de agencia
        const bcrypt = require('bcrypt');
        const agencyPassword = await bcrypt.hash('agencia123', 10);
        
        await this.query(`
          INSERT INTO users (
            username, email, password_hash, role, full_name, agency_id, is_active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          'agencia_admin',
          'admin@viajestotal.com.ar',
          agencyPassword,
          'admin_agencia',
          'Administrador Viajes Total',
          agencyId,
          true
        ]);

        console.log('✅ Agencia de demo y usuario creados');
      }

      // Insert default system config
      const configs = [
        {
          key: 'company_info',
          value: {
            name: 'InterTravel Group',
            evyt: '15.566',
            phone: '+54 261 XXX-XXXX',
            email: 'ventas@intertravel.com.ar',
            address: 'Chacras Park, Edificio Ceibo, Luján de Cuyo, Mendoza'
          },
          description: 'Información de la empresa',
          is_public: true
        },
        {
          key: 'travel_compositor',
          value: {
            endpoint: 'https://online.travelcompositor.com',
            microsite_id: 'intertravelgroup',
            enabled: true
          },
          description: 'Configuración Travel Compositor',
          is_public: false
        }
      ];

      for (const config of configs) {
        await this.query(`
          INSERT INTO system_config (key, value, description, is_public)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_at = CURRENT_TIMESTAMP
        `, [config.key, JSON.stringify(config.value), config.description, config.is_public]);
      }

      console.log('✅ Configuración por defecto insertada');
      
      // === DATOS INICIALES MÓDULO CONTABLE ===
      // Plan de cuentas básico
      await this.initializeChartOfAccounts();
      
      // Rankings por defecto
      await this.initializeAgencyRankings();
      
      // Reviews de ejemplo
      await this.initializeReviewsData();

    } catch (error) {
      console.error('❌ Error insertando datos por defecto:', error);
    }
  }
  
  async initializeChartOfAccounts() {
    try {
      const accountsExist = await this.query(
        'SELECT COUNT(*) as count FROM financial_accounts'
      );
      
      if (parseInt(accountsExist.rows[0].count) === 0) {
        const accounts = [
          // ACTIVOS
          { code: '1', name: 'ACTIVOS', type: 'assets', level: 1 },
          { code: '1.1', name: 'Activo Corriente', type: 'assets', parent: '1', level: 2 },
          { code: '1.1.1', name: 'Caja y Bancos', type: 'assets', parent: '1.1', level: 3 },
          { code: '1.1.2', name: 'Cuentas por Cobrar', type: 'assets', parent: '1.1', level: 3 },
          { code: '1.1.3', name: 'Cuentas por Cobrar Agencias', type: 'assets', parent: '1.1', level: 3 },
          
          // PASIVOS
          { code: '2', name: 'PASIVOS', type: 'liabilities', level: 1 },
          { code: '2.1', name: 'Pasivo Corriente', type: 'liabilities', parent: '2', level: 2 },
          { code: '2.1.1', name: 'Cuentas por Pagar', type: 'liabilities', parent: '2.1', level: 3 },
          { code: '2.1.2', name: 'Comisiones por Pagar', type: 'liabilities', parent: '2.1', level: 3 },
          
          // PATRIMONIO
          { code: '3', name: 'PATRIMONIO NETO', type: 'equity', level: 1 },
          { code: '3.1', name: 'Capital', type: 'equity', parent: '3', level: 2 },
          { code: '3.2', name: 'Resultados Acumulados', type: 'equity', parent: '3', level: 2 },
          
          // INGRESOS
          { code: '4', name: 'INGRESOS', type: 'revenue', level: 1 },
          { code: '4.1', name: 'Ventas de Paquetes', type: 'revenue', parent: '4', level: 2 },
          { code: '4.2', name: 'Comisiones de Agencias', type: 'revenue', parent: '4', level: 2 },
          { code: '4.3', name: 'Otros Ingresos', type: 'revenue', parent: '4', level: 2 },
          
          // GASTOS
          { code: '5', name: 'GASTOS', type: 'expenses', level: 1 },
          { code: '5.1', name: 'Gastos Operativos', type: 'expenses', parent: '5', level: 2 },
          { code: '5.2', name: 'Gastos de Ventas', type: 'expenses', parent: '5', level: 2 },
          { code: '5.3', name: 'Gastos Administrativos', type: 'expenses', parent: '5', level: 2 }
        ];
        
        // Insertar cuentas padre primero
        const insertedAccounts = new Map();
        
        for (const account of accounts) {
          let parentId = null;
          if (account.parent && insertedAccounts.has(account.parent)) {
            parentId = insertedAccounts.get(account.parent);
          }
          
          const result = await this.query(`
            INSERT INTO financial_accounts (account_code, account_name, account_type, parent_account_id, level)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [account.code, account.name, account.type, parentId, account.level]);
          
          insertedAccounts.set(account.code, result.rows[0].id);
        }
        
        console.log('✅ Plan de cuentas inicializado');
      }
    } catch (error) {
      console.error('❌ Error inicializando plan de cuentas:', error);
    }
  }
  
  async initializeAgencyRankings() {
    try {
      const rankingsExist = await this.query(
        'SELECT COUNT(*) as count FROM agency_rankings'
      );
      
      if (parseInt(rankingsExist.rows[0].count) === 0) {
        const rankings = [
          {
            name: 'Bronze',
            min_sales: 0,
            base_commission: 8.0,
            bonus: 0,
            credit_multiplier: 1.0,
            benefits: { priority_support: false, special_pricing: false }
          },
          {
            name: 'Silver',
            min_sales: 50000,
            base_commission: 10.0,
            bonus: 0.5,
            credit_multiplier: 1.5,
            benefits: { priority_support: true, special_pricing: false }
          },
          {
            name: 'Gold',
            min_sales: 100000,
            base_commission: 12.0,
            bonus: 1.0,
            credit_multiplier: 2.0,
            benefits: { priority_support: true, special_pricing: true, dedicated_manager: false }
          },
          {
            name: 'Platinum',
            min_sales: 200000,
            base_commission: 15.0,
            bonus: 2.0,
            credit_multiplier: 3.0,
            benefits: { priority_support: true, special_pricing: true, dedicated_manager: true }
          },
          {
            name: 'Diamond',
            min_sales: 500000,
            base_commission: 18.0,
            bonus: 3.0,
            credit_multiplier: 5.0,
            benefits: { priority_support: true, special_pricing: true, dedicated_manager: true, vip_events: true }
          }
        ];
        
        for (const ranking of rankings) {
          await this.query(`
            INSERT INTO agency_rankings (ranking_name, min_monthly_sales, base_commission_rate, bonus_rate, credit_limit_multiplier, benefits)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            ranking.name,
            ranking.min_sales,
            ranking.base_commission,
            ranking.bonus,
            ranking.credit_multiplier,
            JSON.stringify(ranking.benefits)
          ]);
        }
        
        console.log('✅ Rankings de agencias inicializados');
      }
    } catch (error) {
      console.error('❌ Error inicializando rankings:', error);
    }
  }
  
  async initializeReviewsData() {
    try {
      const reviewsExist = await this.query(
        'SELECT COUNT(*) as count FROM reviews'
      );
      
      if (parseInt(reviewsExist.rows[0].count) === 0) {
        const sampleReviews = [
          {
            name: 'María González',
            location: 'Buenos Aires',
            rating: 5,
            text: 'Increíble experiencia en París. El servicio de InterTravel fue excepcional, todo estuvo perfectamente organizado.',
            trip: 'París Romántico',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format',
            date: '2024-03-15',
            verified: true,
            featured: true
          },
          {
            name: 'Carlos Rodríguez',
            location: 'Mendoza',
            rating: 5,
            text: 'Machu Picchu superó todas mis expectativas. La atención al detalle y el profesionalismo de InterTravel es incomparable.',
            trip: 'Aventura en Perú',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format',
            date: '2024-02-28',
            verified: true,
            featured: true
          },
          {
            name: 'Ana Martínez',
            location: 'Córdoba',
            rating: 5,
            text: 'Cancún fue un paraíso. Desde el primer contacto hasta el regreso, todo fue perfecto. ¡Ya estamos planeando el próximo viaje!',
            trip: 'Playa Todo Incluido',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format',
            date: '2024-01-20',
            verified: true,
            featured: false
          },
          {
            name: 'Roberto Silva',
            location: 'Rosario',
            rating: 5,
            text: 'La organización fue perfecta, desde los vuelos hasta cada excursión. Recomiendo InterTravel sin dudarlo.',
            trip: 'Europa Clásica',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
            date: '2024-03-01',
            verified: true,
            featured: false
          },
          {
            name: 'Laura Fernández',
            location: 'La Plata',
            rating: 5,
            text: 'Mi luna de miel en Bali fue absolutamente mágica. Cada detalle fue pensado para hacer el viaje único e inolvidable.',
            trip: 'Bali Romántico',
            avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&auto=format',
            date: '2024-02-14',
            verified: true,
            featured: true
          },
          {
            name: 'Diego Morales',
            location: 'Tucumán',
            rating: 5,
            text: 'Japón en temporada de cerezos fue un sueño hecho realidad. La guía cultural y las experiencias auténticas superaron mis expectativas.',
            trip: 'Japón Cultural',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f44?w=100&h=100&fit=crop&auto=format',
            date: '2024-04-05',
            verified: true,
            featured: false
          }
        ];
        
        for (const review of sampleReviews) {
          await this.query(`
            INSERT INTO reviews (name, location, rating, text, trip, avatar, date, verified, featured, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
          `, [
            review.name,
            review.location,
            review.rating,
            review.text,
            review.trip,
            review.avatar,
            review.date,
            review.verified,
            review.featured
          ]);
        }
        
        console.log('✅ Reviews de ejemplo inicializadas');
      }
    } catch (error) {
      console.error('❌ Error inicializando reviews:', error);
    }
  }

  // Utility methods
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');
      return { healthy: true, timestamp: new Date() };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Export singleton instance
const dbManager = new PostgreSQLManager();

module.exports = {
  dbManager,
  query: (text, params) => dbManager.query(text, params),
  getClient: () => dbManager.getClient(),
  connect: () => dbManager.connect(),
  disconnect: () => dbManager.disconnect(),
  initializeDatabase: () => dbManager.initializeDatabase(),
  getStatus: () => dbManager.getStatus(),
  healthCheck: () => dbManager.healthCheck()
};
