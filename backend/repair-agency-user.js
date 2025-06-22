// ===================================================
// SCRIPT DE REPARACIÓN - USUARIO AGENCIA
// ===================================================
// Recrear usuario agencia_admin para login
// Ejecutar una sola vez para reparar el problema

const { query } = require('./database');
const bcrypt = require('bcrypt');

async function repairAgencyUser() {
  try {
    console.log('🔧 INICIANDO REPARACIÓN DE USUARIO AGENCIA...');
    
    // 1. Verificar si existe la agencia
    console.log('📋 1. Verificando agencia VIAJES_TOTAL...');
    const agencyCheck = await query(`
      SELECT id, code, name FROM agencies WHERE code = 'VIAJES_TOTAL'
    `);
    
    let agencyId;
    
    if (agencyCheck.rows.length === 0) {
      console.log('⚠️ Agencia no existe, creando...');
      
      const agencyResult = await query(`
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
      
      agencyId = agencyResult.rows[0].id;
      console.log(`✅ Agencia creada con ID: ${agencyId}`);
    } else {
      agencyId = agencyCheck.rows[0].id;
      console.log(`✅ Agencia encontrada: ${agencyCheck.rows[0].name} (ID: ${agencyId})`);
    }
    
    // 2. Verificar si existe el usuario
    console.log('📋 2. Verificando usuario agencia_admin...');
    const userCheck = await query(`
      SELECT id, username FROM users WHERE username = 'agencia_admin'
    `);
    
    if (userCheck.rows.length > 0) {
      console.log('⚠️ Usuario existe, eliminando para recrear...');
      await query('DELETE FROM users WHERE username = $1', ['agencia_admin']);
    }
    
    // 3. Crear nuevo usuario
    console.log('📋 3. Creando usuario agencia_admin...');
    const hashedPassword = await bcrypt.hash('agencia123', 10);
    
    const userResult = await query(`
      INSERT INTO users (
        username, email, password_hash, role, full_name, agency_id, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username
    `, [
      'agencia_admin',
      'admin@viajestotal.com.ar',
      hashedPassword,
      'admin_agencia',
      'Administrador Viajes Total',
      agencyId,
      true
    ]);
    
    console.log(`✅ Usuario creado: ${userResult.rows[0].username} (ID: ${userResult.rows[0].id})`);
    
    // 4. Verificar la configuración
    console.log('📋 4. Verificando configuración final...');
    const finalCheck = await query(`
      SELECT 
        u.id, u.username, u.role, u.is_active,
        a.id as agency_id, a.code, a.name, a.status
      FROM users u
      JOIN agencies a ON u.agency_id = a.id
      WHERE u.username = 'agencia_admin'
    `);
    
    if (finalCheck.rows.length > 0) {
      const config = finalCheck.rows[0];
      console.log('✅ CONFIGURACIÓN FINAL:');
      console.log(`   Usuario: ${config.username}`);
      console.log(`   Rol: ${config.role}`);
      console.log(`   Activo: ${config.is_active}`);
      console.log(`   Agencia: ${config.name} (${config.code})`);
      console.log(`   Estado Agencia: ${config.status}`);
      console.log('');
      console.log('🎯 CREDENCIALES PARA LOGIN:');
      console.log('   URL: http://localhost:3002/agency-portal.html');
      console.log('   Usuario: agencia_admin');
      console.log('   Contraseña: agencia123');
      console.log('');
      console.log('✅ REPARACIÓN COMPLETADA EXITOSAMENTE');
    } else {
      throw new Error('No se pudo verificar la configuración final');
    }
    
  } catch (error) {
    console.error('❌ ERROR EN REPARACIÓN:', error.message);
    throw error;
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  const { dbManager } = require('./database');
  
  async function runRepair() {
    try {
      await dbManager.connect();
      await repairAgencyUser();
      await dbManager.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('❌ FALLO EN REPARACIÓN:', error);
      process.exit(1);
    }
  }
  
  runRepair();
}

module.exports = { repairAgencyUser };
