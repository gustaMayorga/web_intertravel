// Script para agregar usuario a la base de datos
const bcrypt = require('bcrypt');

async function createUserInDB() {
  console.log('🔧 Creando usuario en base de datos...\n');
  
  // Intentar conectar con database real
  let query;
  try {
    const { query: dbQuery } = require('./database');
    query = dbQuery;
    console.log('✅ Conectado a database real');
  } catch (error) {
    console.log('❌ Database no disponible:', error.message);
    console.log('⚠️  Necesitas PostgreSQL corriendo o usar mock data');
    return;
  }

  try {
    const email = 'pruebin@otromail.com';
    const password = '123456';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('🔍 Verificando si usuario ya existe...');
    
    // Verificar si ya existe
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length > 0) {
      console.log('✅ Usuario ya existe en base de datos ID:', existing.rows[0].id);
      console.log('   Email:', email);
      console.log('   Debería aparecer en Admin/Clientes');
      return;
    }
    
    console.log('➕ Creando nuevo usuario...');
    
    // Crear usuario
    const result = await query(`
      INSERT INTO users (
        username, email, password_hash, role, full_name, 
        first_name, last_name, phone, is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, email, full_name
    `, [
      email, 
      email, 
      passwordHash, 
      'user', 
      'Pruebin Usuario',
      'Pruebin', 
      'Usuario', 
      '123456789', 
      true, 
      new Date()
    ]);
    
    console.log('✅ Usuario creado exitosamente:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Email:', result.rows[0].email);
    console.log('   Nombre:', result.rows[0].full_name);
    console.log('\n🎯 Ahora debería aparecer en Admin/Clientes');
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n💡 SOLUCIÓN: Las tablas no existen');
      console.log('   Ejecuta: npm run init-db o crea las tablas manualmente');
    }
  }
}

if (require.main === module) {
  createUserInDB().then(() => {
    console.log('\n🏁 Script completado');
    process.exit(0);
  });
}
