#!/usr/bin/env node
// Database Initialization Script for InterTravel

require('dotenv').config();
const { dbManager } = require('../database');

async function initializeDatabase() {
  console.log('🚀 INICIALIZANDO BASE DE DATOS INTERTRAVEL');
  console.log('==========================================');

  try {
    // 1. Connect to database
    console.log('\n📡 Paso 1: Conectando a PostgreSQL...');
    const connection = await dbManager.connect();
    
    if (!connection.success) {
      console.error('❌ Error conectando a la base de datos:', connection.error);
      process.exit(1);
    }

    // 2. Initialize database structure
    console.log('\n🔧 Paso 2: Inicializando estructura...');
    const init = await dbManager.initializeDatabase();
    
    if (!init.success) {
      console.error('❌ Error inicializando base de datos:', init.error);
      process.exit(1);
    }

    // 3. Verify connection and show status
    console.log('\n📊 Paso 3: Verificando estado...');
    const status = dbManager.getStatus();
    const health = await dbManager.healthCheck();
    
    console.log('✅ Estado de la base de datos:');
    console.log(`   Conectado: ${status.connected ? '✅' : '❌'}`);
    console.log(`   Entorno: ${status.environment}`);
    console.log(`   Conexiones activas: ${status.totalCount}`);
    console.log(`   Conexiones libres: ${status.idleCount}`);
    console.log(`   Salud: ${health.healthy ? '✅' : '❌'}`);

    // 4. Show database info
    const dbInfo = await dbManager.query(`
      SELECT 
        schemaname, 
        tablename, 
        tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('\n📋 Tablas creadas:');
    dbInfo.rows.forEach(table => {
      console.log(`   📄 ${table.tablename}`);
    });

    // 5. Show sample data counts
    const counts = await Promise.all([
      dbManager.query('SELECT COUNT(*) as count FROM users'),
      dbManager.query('SELECT COUNT(*) as count FROM leads'),
      dbManager.query('SELECT COUNT(*) as count FROM packages'),
      dbManager.query('SELECT COUNT(*) as count FROM bookings'),
      dbManager.query('SELECT COUNT(*) as count FROM system_config')
    ]);

    console.log('\n📈 Registros iniciales:');
    console.log(`   👥 Usuarios: ${counts[0].rows[0].count}`);
    console.log(`   📧 Leads: ${counts[1].rows[0].count}`);
    console.log(`   🎒 Paquetes: ${counts[2].rows[0].count}`);
    console.log(`   📅 Reservas: ${counts[3].rows[0].count}`);
    console.log(`   ⚙️ Configuración: ${counts[4].rows[0].count}`);

    console.log('\n🎉 ¡BASE DE DATOS INICIALIZADA EXITOSAMENTE!');
    console.log('==========================================');
    console.log('🔗 URLs de conexión:');
    console.log(`   Backend: http://localhost:${process.env.PORT || 3002}`);
    console.log(`   Admin: http://localhost:${process.env.PORT || 3002}/admin`);
    console.log(`   Health: http://localhost:${process.env.PORT || 3002}/api/health`);
    console.log('\n🔑 Credenciales por defecto:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dbManager.disconnect();
    process.exit(0);
  }
}

// Execute if run directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
