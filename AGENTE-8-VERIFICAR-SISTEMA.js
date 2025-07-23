#!/usr/bin/env node

/**
 * 🔍 VERIFICADOR COMPLETO SISTEMA PAQUETE-CLIENTE
 * Agente 8 - InterTravel
 * ===============================================
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔍 ==========================================');
console.log('🔍 VERIFICANDO SISTEMA PAQUETE-CLIENTE');
console.log('🔍 Agente 8 - InterTravel v3.1');
console.log('🔍 ==========================================\n');

const backendPath = path.join(__dirname, 'backend');
const results = {
  files: { passed: 0, total: 0 },
  server: { passed: 0, total: 0 },
  endpoints: { passed: 0, total: 0 },
  database: { passed: 0, total: 0 }
};

// 1. Verificar archivos del sistema
console.log('📁 1. VERIFICACIÓN DE ARCHIVOS');
console.log('================================');

const requiredFiles = [
  'backend/routes/package-client.js',
  'backend/modules/package-client-manager.js',
  'backend/scripts/create_package_client_schema.sql',
  'backend/server.js'
];

requiredFiles.forEach(file => {
  results.files.total++;
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
    results.files.passed++;
  } else {
    console.log(`❌ ${file} - NO ENCONTRADO`);
  }
});

// Verificar contenido del server.js
results.files.total++;
const serverPath = path.join(backendPath, 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  if (serverContent.includes('package-client')) {
    console.log('✅ server.js contiene rutas package-client');
    results.files.passed++;
  } else {
    console.log('❌ server.js NO contiene rutas package-client');
  }
} else {
  console.log('❌ server.js no encontrado');
}

console.log(`\n📊 Archivos: ${results.files.passed}/${results.files.total} ✅\n`);

// 2. Verificar servidor backend
console.log('🌐 2. VERIFICACIÓN DEL SERVIDOR');
console.log('================================');

async function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    results.server.total++;
    const request = http.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${description} - OK (${res.statusCode})`);
        results.server.passed++;
        resolve(true);
      } else {
        console.log(`⚠️ ${description} - Respuesta: ${res.statusCode}`);
        resolve(false);
      }
    });
    
    request.on('error', () => {
      console.log(`❌ ${description} - NO DISPONIBLE`);
      resolve(false);
    });
    
    request.setTimeout(3000, () => {
      console.log(`⏱️ ${description} - TIMEOUT`);
      request.abort();
      resolve(false);
    });
  });
}

async function verifyServer() {
  // Verificar servidor principal
  await checkEndpoint('http://localhost:3002/api/health', 'Servidor principal (puerto 3002)');
  
  // Verificar endpoints del sistema paquete-cliente
  console.log('\n🔗 Endpoints del Sistema Paquete-Cliente:');
  const endpoints = [
    { url: 'http://localhost:3002/api/package-client/health', desc: 'Health Check' },
    { url: 'http://localhost:3002/api/package-client/dashboard', desc: 'Dashboard' },
    { url: 'http://localhost:3002/api/package-client/assignments', desc: 'Asignaciones' },
    { url: 'http://localhost:3002/api/package-client/customers', desc: 'Clientes' },
    { url: 'http://localhost:3002/api/package-client/analytics', desc: 'Analytics' }
  ];
  
  for (const endpoint of endpoints) {
    results.endpoints.total++;
    const available = await checkEndpoint(endpoint.url, endpoint.desc);
    if (available) results.endpoints.passed++;
  }
  
  console.log(`\n📊 Servidor: ${results.server.passed}/${results.server.total} ✅`);
  console.log(`📊 Endpoints: ${results.endpoints.passed}/${results.endpoints.total} ✅\n`);
}

// 3. Verificar base de datos (si es posible)
console.log('🗄️ 3. VERIFICACIÓN DE BASE DE DATOS');
console.log('====================================');

async function verifyDatabase() {
  try {
    const { Client } = require('pg');
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'intertravel',
      user: 'postgres'
    });
    
    await client.connect();
    console.log('✅ Conexión a PostgreSQL exitosa');
    results.database.passed++;
    
    // Verificar tablas del sistema
    const tables = ['customers', 'package_client_assignments', 'assignment_activities', 
                   'customer_interactions', 'package_quotes', 'package_client_settings'];
    
    for (const table of tables) {
      results.database.total++;
      try {
        const result = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = '${table}'`);
        if (result.rows.length > 0) {
          console.log(`✅ Tabla '${table}' existe`);
          results.database.passed++;
        } else {
          console.log(`❌ Tabla '${table}' NO existe`);
        }
      } catch (error) {
        console.log(`❌ Error verificando tabla '${table}':`, error.message);
      }
    }
    
    await client.end();
  } catch (error) {
    console.log('❌ Error conectando a PostgreSQL:', error.message);
    console.log('💡 Asegúrate de que PostgreSQL esté corriendo y configurado correctamente');
  }
  
  results.database.total++; // Para la conexión
}

// 4. Ejecutar verificaciones
async function runVerification() {
  await verifyServer();
  await verifyDatabase();
  
  console.log(`📊 Base de datos: ${results.database.passed}/${results.database.total} ✅\n`);
  
  // 5. Resumen final
  console.log('📋 RESUMEN FINAL');
  console.log('=================');
  
  const totalPassed = results.files.passed + results.server.passed + results.endpoints.passed + results.database.passed;
  const totalTests = results.files.total + results.server.total + results.endpoints.total + results.database.total;
  const percentage = Math.round((totalPassed / totalTests) * 100);
  
  console.log(`\n🎯 ESTADO GENERAL: ${totalPassed}/${totalTests} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
    console.log('✅ El sistema paquete-cliente está correctamente instalado y funcionando');
  } else if (percentage >= 70) {
    console.log('⚠️ SISTEMA PARCIALMENTE FUNCIONAL');
    console.log('💡 Algunos componentes necesitan atención');
  } else {
    console.log('❌ SISTEMA CON PROBLEMAS');
    console.log('🔧 Se requiere intervención para corregir errores');
  }
  
  console.log('\n🚀 PASOS RECOMENDADOS:');
  if (results.server.passed === 0) {
    console.log('   1. Iniciar servidor backend: cd backend && npm start');
  }
  if (results.database.passed < results.database.total) {
    console.log('   2. Ejecutar esquema SQL: psql -d intertravel -f backend/scripts/create_package_client_schema.sql');
  }
  if (results.endpoints.passed < results.endpoints.total) {
    console.log('   3. Verificar que las rutas estén correctamente agregadas al server.js');
  }
  
  console.log('\n📚 DOCUMENTACIÓN:');
  console.log('   📖 README: backend/PACKAGE_CLIENT_SYSTEM_README.md');
  console.log('   🔧 Scripts: backend/scripts/');
  console.log('   📊 Dashboard: http://localhost:3002/api/package-client/dashboard');
  
  console.log('\n🎯 Agente 8 - Verificación completada');
  console.log('==========================================');
}

runVerification().catch(console.error);
