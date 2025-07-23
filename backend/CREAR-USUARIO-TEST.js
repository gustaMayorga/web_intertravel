// CREAR-USUARIO-TEST.js - Script para crear usuario de prueba para testing
const bcrypt = require('bcrypt');

async function createTestUser() {
  console.log('👤 CREANDO USUARIO DE PRUEBA PARA TESTING');
  console.log('==========================================');
  
  // Intentar conectar con database real
  let query;
  try {
    const { query: dbQuery } = require('./database');
    query = dbQuery;
    console.log('✅ Conectado a base de datos PostgreSQL');
  } catch (error) {
    console.log('❌ Database no disponible:', error.message);
    console.log('⚠️ Necesitas PostgreSQL corriendo');
    return;
  }

  try {
    const email = 'test@intertravel.com';
    const password = 'test123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('🔍 Verificando si usuario test ya existe...');
    
    // Verificar si ya existe
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      console.log('✅ Usuario test ya existe:');
      console.log('   ID:', existing.rows[0].id);
      console.log('   Email:', email);
      console.log('   Password: test123');
      console.log('   🎯 Listo para usar en login');
      return existing.rows[0];
    }
    
    console.log('➕ Creando nuevo usuario test...');
    
    // Crear usuario de prueba
    const result = await query(`
      INSERT INTO users (
        username, email, password_hash, role, full_name, 
        first_name, last_name, phone, is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, full_name, first_name, last_name
    `, [
      email, 
      email, 
      passwordHash, 
      'user', 
      'Test User',
      'Test', 
      'User', 
      '123456789', 
      true, 
      new Date()
    ]);
    
    console.log('✅ Usuario test creado exitosamente:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Email:', result.rows[0].email);
    console.log('   Nombre:', result.rows[0].full_name);
    console.log('   Password: test123');
    console.log('');
    console.log('🔑 CREDENCIALES PARA LOGIN:');
    console.log('   Email: test@intertravel.com');
    console.log('   Password: test123');
    console.log('');
    console.log('🎯 Usa estas credenciales para probar el login en http://localhost:3009');
    
    return result.rows[0];
    
  } catch (error) {
    console.error('❌ Error creando usuario test:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n💡 SOLUCIÓN: Las tablas no existen');
      console.log('   1. Verifica que PostgreSQL esté corriendo');
      console.log('   2. Ejecuta el script de inicialización de DB');
      console.log('   3. O crea las tablas manualmente');
    }
  }
}

if (require.main === module) {
  createTestUser().then(() => {
    console.log('\n🏁 Script completado');
    process.exit(0);
  });
}

module.exports = { createTestUser };