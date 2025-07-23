// PostgreSQL Configuration for InterTravel - PRODUCCIÓN
require('dotenv').config();
const { Pool } = require('pg');

// Configuración optimizada para producción
const DB_CONFIG = {
  production: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'intertravel_prod',
    user: process.env.DB_USER || 'intertravel_user',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
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
      
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as version');
      client.release();
      
      this.isConnected = true;
      console.log('✅ PostgreSQL conectado exitosamente');
      
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
      console.log('🛑 PostgreSQL: Pool cerrado');
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
        console.log(`⚠️ Consulta lenta (${duration}ms)`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Query Error:', error.message);
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
      idleCount: this.pool?.idleCount || 0
    };
  }

  async initializeDatabase() {
    try {
      console.log('🔧 Inicializando base de datos...');
      
      await this.createTables();
      await this.createIndexes();
      await this.insertDefaultData();
      
      console.log('✅ Base de datos inicializada');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      return { success: false, error: error.message };
    }
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )`,

      `CREATE TABLE IF NOT EXISTS packages (
        id SERIAL PRIMARY KEY,
        package_id VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        price_amount DECIMAL(10,2) NOT NULL,
        price_currency VARCHAR(3) DEFAULT 'USD',
        duration_days INTEGER NOT NULL,
        duration_nights INTEGER NOT NULL,
        category VARCHAR(100),
        description_short TEXT,
        images JSONB,
        rating_average DECIMAL(3,2),
        rating_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_reference VARCHAR(50) UNIQUE NOT NULL,
        package_id VARCHAR(100) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending',
        travel_date DATE,
        payment_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

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
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.query(table);
    }

    console.log('✅ Tablas creadas');
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination)',
      'CREATE INDEX IF NOT EXISTS idx_packages_country ON packages(country)',
      'CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference)',
      'CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)'
    ];

    for (const index of indexes) {
      try {
        await this.query(index);
      } catch (error) {
        console.log(`⚠️ Índice no creado: ${error.message}`);
      }
    }

    console.log('✅ Índices creados');
  }

  async insertDefaultData() {
    try {
      // Usuario admin
      const adminExists = await this.query(
        'SELECT id FROM users WHERE username = $1',
        ['admin']
      );

      if (adminExists.rows.length === 0) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        
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

      // Usuario agencia
      const agencyExists = await this.query(
        'SELECT id FROM users WHERE username = $1',
        ['agencia_admin']
      );

      if (agencyExists.rows.length === 0) {
        const bcrypt = require('bcrypt');
        const agencyPassword = await bcrypt.hash(process.env.AGENCY_PASSWORD || 'agencia123', 10);
        
        await this.query(`
          INSERT INTO users (username, email, password_hash, role, full_name, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          'agencia_admin',
          'agencia@intertravel.com',
          agencyPassword,
          'admin_agencia',
          'Administrador Agencia',
          true
        ]);

        console.log('✅ Usuario agencia creado');
      }

      // Configuración del sistema
      const configs = [
        {
          key: 'company_info',
          value: {
            name: 'InterTravel Group',
            phone: '+54 261 XXX-XXXX',
            email: 'ventas@intertravel.com.ar'
          },
          description: 'Información de la empresa',
          is_public: true
        }
      ];

      for (const config of configs) {
        await this.query(`
          INSERT INTO system_config (key, value, description, is_public)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value
        `, [config.key, JSON.stringify(config.value), config.description, config.is_public]);
      }

      // Reviews de ejemplo
      const reviewsExist = await this.query('SELECT COUNT(*) as count FROM reviews');
      
      if (parseInt(reviewsExist.rows[0].count) === 0) {
        const sampleReviews = [
          {
            name: 'María González',
            location: 'Buenos Aires',
            rating: 5,
            text: 'Increíble experiencia en París. El servicio de InterTravel fue excepcional.',
            trip: 'París Romántico',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop',
            date: '2024-03-15'
          },
          {
            name: 'Carlos Rodríguez',
            location: 'Mendoza',
            rating: 5,
            text: 'Machu Picchu superó todas mis expectativas. Altamente recomendado.',
            trip: 'Aventura en Perú',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
            date: '2024-02-28'
          }
        ];
        
        for (const review of sampleReviews) {
          await this.query(`
            INSERT INTO reviews (name, location, rating, text, trip, avatar, date, verified, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'active')
          `, [review.name, review.location, review.rating, review.text, review.trip, review.avatar, review.date]);
        }
        
        console.log('✅ Reviews inicializadas');
      }

      console.log('✅ Datos por defecto insertados');

    } catch (error) {
      console.error('❌ Error insertando datos:', error);
    }
  }

  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');
      return { healthy: true, timestamp: new Date() };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

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