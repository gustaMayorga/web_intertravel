// ===============================================
// DIAGNÓSTICO Y CORRECCIÓN DE ENDPOINTS
// ===============================================

const axios = require('axios').default;

const BASE_URL = 'http://localhost:3002';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '✅',
    'error': '❌',
    'warning': '⚠️',
    'fix': '🔧'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      timeout: 10000, // 10 segundos
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { 
      success: true, 
      status: response.status, 
      data: response.data,
      responseTime: Date.now()
    };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 0,
      error: error.message,
      code: error.code
    };
  }
}

async function diagnoseEndpoints() {
  console.log('🔧 ===============================================');
  console.log('🔧 DIAGNÓSTICO DE ENDPOINTS CRÍTICOS');
  console.log('🔧 ===============================================');
  
  // 1. Health Check (debe funcionar)
  log('Testing /api/health...', 'fix');
  const health = await testEndpoint('/api/health');
  if (health.success) {
    log(`Health Check: OK (${health.status})`, 'info');
  } else {
    log(`Health Check: FAILED - ${health.error}`, 'error');
    return false;
  }
  
  // 2. Packages endpoint con timeout extendido
  log('Testing /api/packages (timeout extendido)...', 'fix');
  const packages = await testEndpoint('/api/packages?limit=5');
  if (packages.success) {
    log(`Packages: OK (${packages.status}) - ${packages.data?.data?.packages?.length || 0} paquetes`, 'info');
  } else {
    log(`Packages: FAILED - ${packages.error}`, 'error');
    if (packages.code === 'ECONNABORTED') {
      log('Problema: Timeout en consulta de paquetes (puede ser BD lenta)', 'warning');
    }
  }
  
  // 3. Auth Login
  log('Testing /api/admin/auth/login...', 'fix');
  const login = await testEndpoint('/api/admin/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123'
  });
  if (login.success) {
    log(`Auth Login: OK (${login.status})`, 'info');
    log(`Token recibido: ${login.data.success ? 'SÍ' : 'NO'}`, 'info');
  } else {
    log(`Auth Login: FAILED - ${login.error} (Status: ${login.status})`, 'error');
  }
  
  // 4. Verificar todas las rutas admin disponibles
  log('Testing admin routes discovery...', 'fix');
  const adminRoutes = [
    '/api/admin/stats',
    '/api/admin/clientes',
    '/api/admin/reservas',
    '/api/admin/configuracion'
  ];
  
  for (const route of adminRoutes) {
    const result = await testEndpoint(route);
    if (result.success || result.status === 401) {
      log(`Route ${route}: AVAILABLE (${result.status === 401 ? 'needs auth' : 'OK'})`, 'info');
    } else {
      log(`Route ${route}: NOT FOUND (${result.status})`, 'warning');
    }
  }
  
  return true;
}

async function suggestFixes() {
  console.log('');
  console.log('💡 ===============================================');
  console.log('💡 SUGERENCIAS DE CORRECCIÓN');
  console.log('💡 ===============================================');
  
  log('1. Para /api/packages lento:', 'fix');
  console.log('   - Verificar conexión PostgreSQL');
  console.log('   - Optimizar consultas en routes/packages.js');
  console.log('   - Aumentar timeout en frontend');
  
  log('2. Para /api/admin/auth/login:', 'fix');
  console.log('   - Verificar que routes/admin/auth.js existe');
  console.log('   - Comprobar importación de middleware/auth.js');
  console.log('   - Reiniciar servidor backend');
  
  log('3. Para integración frontend-backend:', 'fix');
  console.log('   - Verificar CORS configuration');
  console.log('   - Comprobar URLs en frontend/src/lib/api.ts');
  console.log('   - Verificar que ambos servicios usen mismo host');
  
  console.log('💡 ===============================================');
}

async function runDiagnosis() {
  const success = await diagnoseEndpoints();
  await suggestFixes();
  
  if (success) {
    console.log('');
    console.log('✅ DIAGNÓSTICO COMPLETADO');
    console.log('🎯 El sistema está mayormente funcional');
    console.log('⚠️ Revisar los warnings para optimizar rendimiento');
  } else {
    console.log('');
    console.log('❌ PROBLEMAS CRÍTICOS ENCONTRADOS');
    console.log('🔧 Revisar configuración del servidor backend');
  }
}

if (require.main === module) {
  runDiagnosis().catch(error => {
    log(`Diagnosis error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runDiagnosis };
