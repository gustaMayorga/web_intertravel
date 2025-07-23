// DIAGNOSTICO-POSTGRESQL.js - Verificar estado de la base de datos
console.log('🔍 DIAGNÓSTICO DE POSTGRESQL - INTERTRAVEL');
console.log('==========================================');

const { dbManager } = require('./backend/database');

async function diagnosticoCompleto() {
  console.log('🚀 Iniciando diagnóstico de PostgreSQL...\n');
  
  // 1. Verificar configuración
  console.log('📊 CONFIGURACIÓN:');
  console.log('- Ambiente:', process.env.NODE_ENV || 'development');
  console.log('- Host:', process.env.DB_HOST || 'localhost');
  console.log('- Puerto:', process.env.DB_PORT || 5432);
  console.log('- Base de datos:', process.env.DB_NAME || 'intertravel_dev');
  console.log('- Usuario:', process.env.DB_USER || 'postgres');
  console.log('- SSL:', process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled');
  
  // 2. Intentar conexión
  console.log('\n🔌 PRUEBA DE CONEXIÓN:');
  try {
    const connectionResult = await dbManager.connect();
    
    if (connectionResult.success) {
      console.log('✅ Conexión PostgreSQL exitosa');
      
      // 3. Verificar usuario específico
      console.log('\n👤 VERIFICAR USUARIO admin@test.com:');
      try {
        const userQuery = await dbManager.query(
          'SELECT id, username, email, role, is_active, created_at FROM users WHERE email = $1',
          ['admin@test.com']
        );
        
        if (userQuery.rows.length > 0) {
          const user = userQuery.rows[0];
          console.log('✅ Usuario encontrado en base de datos:');
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Email: ${user.email}`);
          console.log(`   - Username: ${user.username}`);
          console.log(`   - Role: ${user.role}`);
          console.log(`   - Activo: ${user.is_active}`);
          console.log(`   - Creado: ${user.created_at}`);
          
          // 4. Verificar contraseña (no mostrar el hash)
          console.log('\n🔑 VERIFICAR HASH DE CONTRASEÑA:');
          const passwordQuery = await dbManager.query(
            'SELECT password_hash FROM users WHERE email = $1',
            ['admin@test.com']
          );
          
          if (passwordQuery.rows[0].password_hash) {
            console.log('✅ Hash de contraseña existe en la base de datos');
            
            // Test de bcrypt (necesitarías la contraseña para verificar)
            console.log('\n💡 SOLUCIÓN:');
            console.log('1. El usuario existe en PostgreSQL');
            console.log('2. El problema es que el backend no está conectando a PostgreSQL');
            console.log('3. Está usando modo fallback con credenciales demo');
            console.log('4. ACCIÓN: Reiniciar backend para forzar reconexión a PostgreSQL');
            
          } else {
            console.log('❌ Hash de contraseña faltante');
          }
          
        } else {
          console.log('❌ Usuario admin@test.com NO encontrado en base de datos');
          console.log('💡 NECESITAS: Registrar el usuario primero en 3009/register');
        }
        
      } catch (userError) {
        console.error('❌ Error consultando usuario:', userError.message);
      }
      
      // 5. Estadísticas generales
      console.log('\n📊 ESTADÍSTICAS DE BASE DE DATOS:');
      try {
        const userCount = await dbManager.query('SELECT COUNT(*) as count FROM users');
        const clientCount = await dbManager.query('SELECT COUNT(*) as count FROM clients');
        const bookingCount = await dbManager.query('SELECT COUNT(*) as count FROM bookings');
        
        console.log(`- Usuarios registrados: ${userCount.rows[0].count}`);
        console.log(`- Clientes: ${clientCount.rows[0].count}`);
        console.log(`- Reservas: ${bookingCount.rows[0].count}`);
      } catch (statsError) {
        console.log('⚠️ No se pudieron obtener estadísticas');
      }
      
    } else {
      console.log('❌ Error de conexión PostgreSQL:', connectionResult.error);
      console.log('\n🚨 PROBLEMA IDENTIFICADO:');
      console.log('- PostgreSQL no está corriendo o no es accesible');
      console.log('- Backend está usando modo fallback');
      console.log('- Solo acepta credenciales demo: demo@intertravel.com / demo123');
      console.log('\n💡 SOLUCIONES:');
      console.log('1. INMEDIATA: Usar demo@intertravel.com / demo123 para testing');
      console.log('2. PERMANENTE: Configurar PostgreSQL correctamente');
      console.log('3. ALTERNATIVA: Habilitar sistema de usuarios en memoria');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
  
  console.log('\n🏁 Diagnóstico completado');
}

// Ejecutar diagnóstico
diagnosticoCompleto().catch(console.error);
