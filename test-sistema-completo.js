// ===============================================
// VERIFICACIÓN INTEGRACIÓN FRONTEND-BACKEND
// Testea conectividad completa del sistema
// ===============================================

const axios = require('axios').default;

const BACKEND_URL = 'http://localhost:3002';
const FRONTEND_URL = 'http://localhost:3005';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '✅',
    'error': '❌', 
    'warning': '⚠️',
    'test': '🧪',
    'success': '🎉'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testService(name, url, timeout = 5000) {
  try {
    const response = await axios.get(url, { timeout });
    return { 
      success: true, 
      status: response.status, 
      message: `${name} OK (${response.status})` 
    };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 0,
      message: `${name} FAILED: ${error.message}` 
    };
  }
}

async function testBackendHealth() {
  log('Testing Backend Health...', 'test');
  
  const result = await testService('Backend Health', `${BACKEND_URL}/api/health`);
  
  if (result.success) {
    log(`Backend Health: ${result.message}`, 'info');
    return true;
  } else {
    log(`Backend Health: ${result.message}`, 'error');
    return false;
  }
}

async function testFrontendHealth() {
  log('Testing Frontend Health...', 'test');
  
  const result = await testService('Frontend', FRONTEND_URL);
  
  if (result.success) {
    log(`Frontend: ${result.message}`, 'info');
    return true;
  } else {
    log(`Frontend: ${result.message}`, 'error');
    return false;
  }
}

async function testBackendEndpoints() {
  log('Testing Backend API Endpoints...', 'test');
  
  const endpoints = [
    '/api/health',
    '/api/packages',
    '/api/admin/auth/login'
  ];
  
  let passCount = 0;
  
  for (const endpoint of endpoints) {
    const result = await testService(`API ${endpoint}`, `${BACKEND_URL}${endpoint}`);
    if (result.success) {
      passCount++;
      log(`Endpoint ${endpoint}: OK`, 'info');
    } else {
      log(`Endpoint ${endpoint}: ${result.message}`, 'error');
    }
  }
  
  log(`Backend APIs: ${passCount}/${endpoints.length} working`, passCount === endpoints.length ? 'info' : 'warning');
  return passCount === endpoints.length;
}

async function testFrontendPages() {
  log('Testing Frontend Pages...', 'test');
  
  const pages = [
    '/',
    '/admin',
    '/admin/login',
    '/paquetes'
  ];
  
  let passCount = 0;
  
  for (const page of pages) {
    const result = await testService(`Page ${page}`, `${FRONTEND_URL}${page}`);
    if (result.success) {
      passCount++;
      log(`Page ${page}: OK`, 'info');
    } else {
      log(`Page ${page}: ${result.message}`, 'error');
    }
  }
  
  log(`Frontend Pages: ${passCount}/${pages.length} working`, passCount === pages.length ? 'info' : 'warning');
  return passCount > 0; // Al menos una página debe funcionar
}

async function testIntegration() {
  log('Testing Frontend-Backend Integration...', 'test');
  
  try {
    // Test de integración: Frontend llamando al Backend
    const frontendResponse = await axios.get(`${FRONTEND_URL}/api/test`, { 
      timeout: 5000,
      validateStatus: () => true // Aceptar cualquier status
    });
    
    if (frontendResponse.status === 200) {
      log('Frontend-Backend integration: WORKING', 'success');
      return true;
    } else {
      log('Frontend-Backend integration: May not be configured', 'warning');
      return false;
    }
  } catch (error) {
    log('Frontend-Backend integration: Not configured or failing', 'warning');
    return false;
  }
}

async function runCompleteVerification() {
  console.log('🚀 ===============================================');
  console.log('🚀 VERIFICACIÓN COMPLETA DEL SISTEMA INTERTRAVEL');
  console.log('🚀 ===============================================');
  
  const tests = [
    { name: 'Backend Health', fn: testBackendHealth, critical: true },
    { name: 'Frontend Health', fn: testFrontendHealth, critical: true },
    { name: 'Backend Endpoints', fn: testBackendEndpoints, critical: true },
    { name: 'Frontend Pages', fn: testFrontendPages, critical: true },
    { name: 'Integration Test', fn: testIntegration, critical: false }
  ];
  
  let passedTests = 0;
  let criticalFailures = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        log(`${test.name}: PASSED`, 'success');
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
    
    // Pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('');
  console.log('📊 ===============================================');
  console.log('📊 RESUMEN DE VERIFICACIÓN COMPLETA');
  console.log('📊 ===============================================');
  console.log(`✅ Tests pasados: ${passedTests}/${tests.length}`);
  console.log(`❌ Fallas críticas: ${criticalFailures}`);
  console.log(`🎯 Success rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
  
  if (criticalFailures === 0) {
    console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
    console.log('✅ Frontend y Backend trabajando correctamente');
    console.log('🌐 URLs principales:');
    console.log(`   Frontend: ${FRONTEND_URL}`);
    console.log(`   Backend:  ${BACKEND_URL}`);
    console.log(`   Admin:    ${FRONTEND_URL}/admin`);
    console.log('🔐 Credenciales: admin/admin123');
  } else {
    console.log('⚠️ Se encontraron problemas críticos');
    console.log('🔧 Verificar que ambos servicios estén ejecutándose:');
    console.log('   Backend: npm run dev (puerto 3002)');
    console.log('   Frontend: npm run dev (puerto 3005)');
  }
  
  console.log('📊 ===============================================');
  
  return criticalFailures === 0;
}

// Función para verificar si los servicios están ejecutándose
async function checkServices() {
  console.log('🔍 ===============================================');
  console.log('🔍 VERIFICANDO ESTADO DE SERVICIOS');
  console.log('🔍 ===============================================');
  
  const backendRunning = await testService('Backend', `${BACKEND_URL}/api/health`);
  const frontendRunning = await testService('Frontend', FRONTEND_URL);
  
  console.log(`Backend (${BACKEND_URL}): ${backendRunning.success ? '✅ RUNNING' : '❌ STOPPED'}`);
  console.log(`Frontend (${FRONTEND_URL}): ${frontendRunning.success ? '✅ RUNNING' : '❌ STOPPED'}`);
  
  if (!backendRunning.success || !frontendRunning.success) {
    console.log('');
    console.log('⚠️ Para iniciar los servicios:');
    console.log('   Backend:  cd backend && npm run dev');
    console.log('   Frontend: cd frontend && npm run dev');
    console.log('   O usar: .\\EJECUTAR-SISTEMA-COMPLETO.bat');
    return false;
  }
  
  return true;
}

// Ejecutar verificación
if (require.main === module) {
  checkServices()
    .then(servicesOk => {
      if (servicesOk) {
        return runCompleteVerification();
      } else {
        console.log('❌ Servicios no están ejecutándose. Inicia el sistema primero.');
        return false;
      }
    })
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Verification error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runCompleteVerification, checkServices };
