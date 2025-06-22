#!/usr/bin/env node
// Quick Fix para PostgreSQL - InterTravel

require('dotenv').config();
const { Client } = require('pg');

async function quickFix() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'intertravel_dev',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    console.log('🔧 ARREGLANDO POSTGRESQL RAPIDO...');
    
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Limpiar y recrear desde cero
    console.log('🧹 Limpiando base de datos...');
    
    await client.query('DROP TABLE IF EXISTS admin_activity CASCADE');
    await client.query('DROP TABLE IF EXISTS bookings CASCADE');
    await client.query('DROP TABLE IF EXISTS packages CASCADE');
    await client.query('DROP TABLE IF EXISTS leads CASCADE');
    await client.query('DROP TABLE IF EXISTS system_config CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Tablas eliminadas');

    // Crear tablas corregidas
    console.log('🔨 Creando tablas corregidas...');
    
    // Users
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        full_name VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Leads
    await client.query(`
      CREATE TABLE leads (
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
      )
    `);

    // Packages (CON is_featured)
    await client.query(`
      CREATE TABLE packages (
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
      )
    `);

    // Bookings
    await client.query(`
      CREATE TABLE bookings (
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
      )
    `);

    // Admin activity
    await client.query(`
      CREATE TABLE admin_activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(100),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // System config
    await client.query(`
      CREATE TABLE system_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tablas creadas correctamente');

    // Crear índices básicos
    console.log('📊 Creando índices...');
    
    await client.query('CREATE INDEX idx_leads_email ON leads(email)');
    await client.query('CREATE INDEX idx_packages_featured ON packages(is_featured)');
    await client.query('CREATE INDEX idx_bookings_status ON bookings(status)');
    await client.query('CREATE INDEX idx_users_email ON users(email)');
    
    console.log('✅ Índices creados');

    // Crear usuario admin
    console.log('👤 Creando usuario admin...');
    
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
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

    // Datos de configuración
    await client.query(`
      INSERT INTO system_config (key, value, description, is_public)
      VALUES ($1, $2, $3, $4)
    `, [
      'company_info',
      JSON.stringify({
        name: 'InterTravel Group',
        evyt: '15.566',
        phone: '+54 261 XXX-XXXX',
        email: 'ventas@intertravel.com.ar'
      }),
      'Información de la empresa',
      true
    ]);

    console.log('✅ Configuración insertada');

    console.log('\n🎉 ¡POSTGRESQL ARREGLADO EXITOSAMENTE!');
    console.log('==========================================');
    console.log('✅ Todas las tablas creadas correctamente');
    console.log('✅ Usuario admin: admin / admin123');
    console.log('✅ Listo para usar con npm start');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

quickFix();
