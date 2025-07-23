const { query } = require('./backend/database');

async function verificarYCrearTablaAdmin() {
  try {
    console.log('🔍 Verificando existencia tabla admin_users...');
    
    // 1. Verificar si tabla existe
    const tableExists = await query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_users'
      )`, []
    );
    
    console.log('Existe tabla admin_users:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      console.log('⚠️ Tabla admin_users NO existe. Creando...');
      
      // 2. Crear tabla admin_users
      await query(`
        CREATE TABLE admin_users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'admin',
          full_name VARCHAR(255),
          permissions JSONB DEFAULT '["all"]',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP
        );
      `, []);
      
      console.log('✅ Tabla admin_users creada exitosamente');
      
      // 3. Migrar usuario admin existente (si existe)
      try {
        const userExists = await query(
          `SELECT username, email, password_hash, role, full_name, is_active 
           FROM users 
           WHERE role IN ('admin', 'super_admin') 
           LIMIT 1`, []
        );
        
        if (userExists.rows.length > 0) {
          const user = userExists.rows[0];
          await query(
            `INSERT INTO admin_users (username, email, password_hash, role, full_name, is_active)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.username, user.email, user.password_hash, user.role, user.full_name, user.is_active]
          );
          console.log('✅ Usuario admin migrado exitosamente');
        } else {
          console.log('ℹ️ No hay usuarios admin en tabla users para migrar');
          await crearUsuarioAdminPorDefecto();
        }
      } catch (migrationError) {
        console.log('ℹ️ Tabla users no existe o no tiene usuarios admin. Creando admin por defecto...');
        await crearUsuarioAdminPorDefecto();
      }
    } else {
      console.log('✅ Tabla admin_users ya existe');
      
      // Verificar cantidad de usuarios
      const count = await query('SELECT COUNT(*) FROM admin_users', []);
      console.log('Total usuarios admin:', count.rows[0].count);
      
      if (count.rows[0].count === '0') {
        console.log('⚠️ No hay usuarios admin. Creando uno por defecto...');
        await crearUsuarioAdminPorDefecto();
      }
    }
    
    console.log('🎉 Verificación tabla admin_users completada');
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando tabla admin_users:', error);
    return false;
  }
}

async function crearUsuarioAdminPorDefecto() {
  try {
    // 4. Crear usuario admin por defecto
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);
    
    await query(
      `INSERT INTO admin_users (username, email, password_hash, role, full_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin', 'admin@intertravel.com.ar', passwordHash, 'admin', 'Administrador InterTravel', true]
    );
    console.log('✅ Usuario admin por defecto creado:');
    console.log('   👤 Usuario: admin');
    console.log('   🔑 Password: admin123');
    console.log('   📧 Email: admin@intertravel.com.ar');
  } catch (error) {
    console.error('❌ Error creando usuario admin por defecto:', error);
  }
}

// Ejecutar script
console.log('🚀 FASE 1: CORRIGIENDO AUTENTICACIÓN ADMIN');
console.log('==========================================');

verificarYCrearTablaAdmin().then((success) => {
  if (success) {
    console.log('');
    console.log('✅ FASE 1 COMPLETADA: Autenticación Admin corregida');
    console.log('🔄 Siguiente paso: Reiniciar backend para aplicar cambios');
    process.exit(0);
  } else {
    console.log('❌ FASE 1 FALLÓ: Error corrigiendo autenticación');
    process.exit(1);
  }
}).catch(err => {
  console.error('💥 Error ejecutando FASE 1:', err);
  process.exit(1);
});
