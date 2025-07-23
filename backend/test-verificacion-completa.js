// ===============================================
// SCRIPT DE VERIFICACIÓN COMPLETA - INTERTRAVEL
// Testea todos los módulos implementados
// ===============================================

const axios = require('axios').default;

const BASE_URL = 'http://localhost:3002';
let authToken = null;

// ===============================================
// FUNCIONES DE UTILIDAD
// ===============================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '✅',
    'error': '❌',
    'warning': '⚠️',
    'test': '🧪'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function makeRequest(method, endpoint, data = null, useAuth = true) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

// ===============================================
// TESTS DE VERIFICACIÓN
// ===============================================

async function testHealthCheck() {
  log('Testing Health Check...', 'test');
  
  const result = await makeRequest('GET', '/api/health', null, false);
  
  if (result.success) {
    log(`Health Check OK - Version: ${result.data.version}`, 'info');
    log(`Services: ${result.data.services.length} active`, 'info');
    return true;
  } else {
    log(`Health Check FAILED: ${result.error}`, 'error');
    return false;
  }
}

async function testAuthentication() {
  log('Testing Authentication...', 'test');
  
  // Intentar login
  const loginResult = await makeRequest('POST', '/api/admin/auth/login', {
    username: 'admin',
    password: 'admin123'
  }, false);
  
  if (loginResult.success) {
    authToken = loginResult.data.token;
    log(`Login OK - Token received`, 'info');
    log(`User: ${loginResult.data.user.username} (${loginResult.data.user.role})`, 'info');
    
    // Verificar sesión
    const verifyResult = await makeRequest('GET', '/api/admin/auth/verify');
    if (verifyResult.success) {
      log('Session verification OK', 'info');
      return true;
    } else {
      log(`Session verification FAILED: ${verifyResult.error}`, 'error');
      return false;
    }
  } else {
    log(`Login FAILED: ${loginResult.error}`, 'error');
    return false;
  }
}

async function testClientesModule() {
  log('Testing Clientes Module...', 'test');
  
  // Listar clientes
  const listResult = await makeRequest('GET', '/api/admin/clientes?limit=5');
  
  if (listResult.success) {
    log(`Clientes listed: ${listResult.data.data.clients.length} found`, 'info');
    log(`Total clients: ${listResult.data.data.pagination.total}`, 'info');
    
    // Test estadísticas
    const statsResult = await makeRequest('GET', '/api/admin/clientes/stats/summary');
    if (statsResult.success) {
      log(`Client stats OK - Total: ${statsResult.data.data.summary.total_clients}`, 'info');
      return true;
    } else {
      log(`Client stats FAILED: ${statsResult.error}`, 'error');
      return false;
    }
  } else {
    log(`Clientes list FAILED: ${listResult.error}`, 'error');
    return false;
  }
}

async function testReservasModule() {
  log('Testing Reservas Module...', 'test');
  
  // Listar reservas
  const listResult = await makeRequest('GET', '/api/admin/reservas?limit=5');
  
  if (listResult.success) {
    log(`Reservas listed: ${listResult.data.data.reservas.length} found`, 'info');
    log(`Total reservas: ${listResult.data.data.pagination.total}`, 'info');
    
    // Test estadísticas
    const statsResult = await makeRequest('GET', '/api/admin/reservas/stats/dashboard');
    if (statsResult.success) {
      log(`Reservas stats OK - Total: ${statsResult.data.data.summary.total_bookings}`, 'info');
      return true;
    } else {
      log(`Reservas stats FAILED: ${statsResult.error}`, 'error');
      return false;
    }
  } else {
    log(`Reservas list FAILED: ${listResult.error}`, 'error');
    return false;
  }
}

async function testPriorizacionModule() {
  log('Testing Priorización Module...', 'test');
  
  // Obtener configuración
  const configResult = await makeRequest('GET', '/api/admin/priorizacion/config');
  
  if (configResult.success) {
    log('Priorización config OK', 'info');
    
    // Test algoritmo de scoring
    const testResult = await makeRequest('POST', '/api/admin/priorizacion/test-scoring', {
      test_query: '15 años bariloche',
      package_ids: []
    });
    
    if (testResult.success) {
      log(`Scoring test OK - Packages tested: ${testResult.data.data.summary.packages_tested}`, 'info');
      return true;
    } else {
      log(`Scoring test FAILED: ${testResult.error}`, 'error');
      return false;
    }
  } else {
    log(`Priorización config FAILED: ${configResult.error}`, 'error');
    return false;
  }
}

async function testConfiguracionModule() {
  log('Testing Configuración Module...', 'test');
  
  // Listar configuraciones
  const listResult = await makeRequest('GET', '/api/admin/configuracion?category=all');
  
  if (listResult.success) {
    log(`Configuraciones listed: ${listResult.data.data.configs.length} found`, 'info');
    log(`Categories: ${listResult.data.data.summary.categories.join(', ')}`, 'info');
    
    // Test estadísticas
    const statsResult = await makeRequest('GET', '/api/admin/configuracion/stats');
    if (statsResult.success) {
      log(`Config stats OK - Total: ${statsResult.data.data.summary.total_configs}`, 'info');
      return true;
    } else {
      log(`Config stats FAILED: ${statsResult.error}`, 'error');
      return false;
    }
  } else {
    log(`Configuración list FAILED: ${listResult.error}`, 'error');
    return false;
  }
}

async function testPackagesModule() {
  log('Testing Packages Module...', 'test');
  
  const listResult = await makeRequest('GET', '/api/packages?limit=5', null, false);
  
  if (listResult.success) {
    log(`Packages listed: ${listResult.data.data?.packages?.length || 0} found`, 'info');
    return true;
  } else {
    log(`Packages list FAILED: ${listResult.error}`, 'warning');
    return false; // No crítico
  }
}

// ===============================================
// EJECUTAR TODOS LOS TESTS
// ===============================================

async function runAllTests() {
  console.log('🚀 ===============================================');
  console.log('🚀 VERIFICACIÓN COMPLETA - INTERTRAVEL BACKEND');
  console.log('🚀 ===============================================');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck, critical: true },
    { name: 'Authentication', fn: testAuthentication, critical: true },
    { name: 'Clientes Module', fn: testClientesModule, critical: true },
    { name: 'Reservas Module', fn: testReservasModule, critical: true },
    { name: 'Priorización Module', fn: testPriorizacionModule, critical: true },
    { name: 'Configuración Module', fn: testConfiguracionModule, critical: true },
    { name: 'Packages Module', fn: testPackagesModule, critical: false }
  ];
  
  let passedTests = 0;
  let criticalFailures = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        log(`${test.name}: PASSED`, 'info');
      } else {
        if (test.critical) {
          criticalFailures++;
        }
        log(`${test.name}: FAILED`, 'error');
      }
    } catch (error) {
      if (test.critical) {
        criticalFailures++;
      }
      log(`${test.name}: ERROR - ${error.message}`, 'error');
    }
    
    // Pequeña pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  console.log('📊 ===============================================');
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('📊 ===============================================');
  console.log(`✅ Tests pasados: ${passedTests}/${tests.length}`);
  console.log(`❌ Fallas críticas: ${criticalFailures}`);
  console.log(`🎯 Success rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
  
  if (criticalFailures === 0) {
    console.log('🎉 ¡TODOS LOS MÓDULOS CRÍTICOS FUNCIONANDO!');
    console.log('✅ El sistema está listo para producción');
  } else {
    console.log('⚠️ Se encontraron fallas críticas');
    console.log('🔧 Revisar configuración y dependencias');
  }
  
  console.log('📊 ===============================================');
  
  return criticalFailures === 0;
}

// ===============================================
// EJECUTAR VERIFICACIÓN
// ===============================================

if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Verification script error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runAllTests };
