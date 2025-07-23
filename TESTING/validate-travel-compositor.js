#!/usr/bin/env node

/**
 * VALIDADOR TRAVEL COMPOSITOR - INTERTRAVEL
 * ==========================================
 * 
 * Script de validación automática para verificar que todas las APIs
 * de Travel Compositor estén funcionando correctamente.
 */

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:3002';
const TIMEOUT = 10000;

// Configurar axios
const client = axios.create({
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'InterTravel-Validator/1.0'
  }
});

console.log('\n🔧 VALIDADOR TRAVEL COMPOSITOR - INTERTRAVEL'.bold.blue);
console.log('=' .repeat(60).blue);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testEndpoint(name, url, expectedData = null) {
  try {
    console.log(`\n🧪 Testing: ${name}`.yellow);
    console.log(`   URL: ${url}`.gray);
    
    const startTime = Date.now();
    const response = await client.get(url);
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ Status: ${response.status} (${duration}ms)`.green);
    
    if (expectedData) {
      for (const [key, expectedValue] of Object.entries(expectedData)) {
        const actualValue = response.data[key];
        if (actualValue === expectedValue) {
          console.log(`   ✅ ${key}: ${actualValue}`.green);
        } else {
          console.log(`   ❌ ${key}: expected ${expectedValue}, got ${actualValue}`.red);
        }
      }
    }
    
    return {
      success: true,
      status: response.status,
      duration,
      data: response.data
    };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`.red);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`.red);
    }
    
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

async function main() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  console.log('\n🚀 Iniciando validación completa...\n');
  
  // Test 1: Health Check
  const health = await testEndpoint(
    'Health Check',
    `${API_BASE}/api/health`,
    { success: true }
  );
  results.tests.push({ name: 'Health Check', ...health });
  if (health.success) results.passed++; else results.failed++;
  
  // Test 2: Travel Compositor Auth
  const auth = await testEndpoint(
    'Travel Compositor Authentication',
    `${API_BASE}/api/travel-compositor/auth-test`
  );
  results.tests.push({ name: 'TC Authentication', ...auth });
  if (auth.success) results.passed++; else results.failed++;
  
  // Test 3: Travel Compositor Packages
  const packages = await testEndpoint(
    'Travel Compositor Packages',
    `${API_BASE}/api/travel-compositor/packages-test?limit=3`
  );
  results.tests.push({ name: 'TC Packages', ...packages });
  if (packages.success) results.passed++; else results.failed++;
  
  // Test 4: Complete TC Test
  const complete = await testEndpoint(
    'Travel Compositor Complete Test',
    `${API_BASE}/api/travel-compositor/test`
  );
  results.tests.push({ name: 'TC Complete', ...complete });
  if (complete.success) results.passed++; else results.failed++;
  
  // Test 5: Featured Packages (Public API)
  const featured = await testEndpoint(
    'Featured Packages API',
    `${API_BASE}/api/packages/featured?limit=3`,
    { success: true }
  );
  results.tests.push({ name: 'Featured Packages', ...featured });
  if (featured.success) results.passed++; else results.failed++;
  
  // Test 6: Search API
  const search = await testEndpoint(
    'Search Packages API',
    `${API_BASE}/api/packages/search?destination=peru&limit=3`,
    { success: true }
  );
  results.tests.push({ name: 'Search API', ...search });
  if (search.success) results.passed++; else results.failed++;
  
  // Resumen final
  console.log('\n' + '='.repeat(60).blue);
  console.log('📊 RESUMEN DE VALIDACIÓN'.bold.blue);
  console.log('=' .repeat(60).blue);
  
  console.log(`\n✅ Tests pasados: ${results.passed}`.green);
  console.log(`❌ Tests fallidos: ${results.failed}`.red);
  console.log(`📊 Total de tests: ${results.tests.length}`);
  
  const successRate = Math.round((results.passed / results.tests.length) * 100);
  console.log(`📈 Tasa de éxito: ${successRate}%`);
  
  // Detalles por test
  console.log('\n📋 DETALLE POR TEST:');
  results.tests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    const duration = test.duration ? `(${test.duration}ms)` : '';
    console.log(`   ${status} ${test.name} ${duration}`);
  });
  
  // Análisis de Travel Compositor
  console.log('\n🔍 ANÁLISIS TRAVEL COMPOSITOR:');
  
  const tcTests = results.tests.filter(t => t.name.includes('TC'));
  const tcPassed = tcTests.filter(t => t.success).length;
  
  if (tcPassed === tcTests.length) {
    console.log('   ✅ Travel Compositor completamente funcional'.green);
  } else if (tcPassed > 0) {
    console.log('   ⚠️  Travel Compositor parcialmente funcional'.yellow);
  } else {
    console.log('   ❌ Travel Compositor no funcional - usando fallbacks'.red);
  }
  
  // Análisis de APIs públicas
  console.log('\n🌐 ANÁLISIS APIs PÚBLICAS:');
  
  const publicTests = results.tests.filter(t => 
    t.name.includes('Featured') || t.name.includes('Search')
  );
  const publicPassed = publicTests.filter(t => t.success).length;
  
  if (publicPassed === publicTests.length) {
    console.log('   ✅ APIs públicas completamente funcionales'.green);
  } else {
    console.log('   ❌ Problemas en APIs públicas'.red);
  }
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  
  if (successRate === 100) {
    console.log('   🎉 ¡Perfecto! Todo funciona correctamente.'.green);
    console.log('   🚀 El sistema está listo para usar.'.green);
  } else if (successRate >= 80) {
    console.log('   ⚠️  Sistema mayormente funcional.'.yellow);
    console.log('   🔧 Revisar tests fallidos para optimización.'.yellow);
  } else {
    console.log('   🚨 Sistema requiere atención.'.red);
    console.log('   🔧 Revisar configuración y conectividad.'.red);
  }
  
  // URLs útiles
  console.log('\n🔗 URLS ÚTILES:');
  console.log(`   📊 Panel de diagnóstico: file:///${__dirname}/travel-compositor-diagnostic.html`);
  console.log(`   🏥 Health check: ${API_BASE}/api/health`);
  console.log(`   🔧 TC Test: ${API_BASE}/api/travel-compositor/test`);
  console.log(`   🌟 Featured: ${API_BASE}/api/packages/featured`);
  
  console.log('\n' + '='.repeat(60).blue);
  
  // Exit code basado en resultados
  process.exit(results.failed > 0 ? 1 : 0);
}

// Manejo de errores
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Verificar que el servidor esté corriendo
console.log('🔍 Verificando conectividad del servidor...');
client.get(`${API_BASE}/api/health`)
  .then(() => {
    console.log('✅ Servidor detectado, iniciando validación...');
    main();
  })
  .catch(() => {
    console.log('❌ Servidor no está corriendo en puerto 3002'.red);
    console.log('💡 Ejecuta primero: INICIAR-TRAVEL-COMPOSITOR-TESTING.bat'.yellow);
    process.exit(1);
  });
