// ===============================================
// HEALTH CHECK RÁPIDO - INTERTRAVEL SYSTEM
// Verifica que todos los componentes estén funcionando
// ===============================================

const axios = require('axios').default;
const fs = require('fs');
const path = require('path');

console.log('🔍 HEALTH CHECK INTERTRAVEL SYSTEM');
console.log('=====================================');

const FRONTEND_URL = 'http://localhost:3005';
const BACKEND_URL = 'http://localhost:3002';

// Función para logging con timestamp
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '✅',
    'error': '❌', 
    'warning': '⚠️',
    'test': '🧪',
    'success': '🎉'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
}

// Test individual de servicio
async function testService(name, url, timeout = 5000) {
  try {
    const response = await axios.get(url, { 
      timeout,
      validateStatus: () => true // Aceptar cualquier status
    });
    
    return { 
      success: response.status < 400, 
      status: response.status, 
      message: `${name} - Status ${response.status}`,
      data: response.data
    };
  } catch (error) {
    return { 
      success: false, 
      status: 0,
      message: `${name} - ERROR: ${error.message}`,
      error: error.message
    };
  }
}

// Test de autenticación admin
async function testAdminAuth() {
  try {
    log('🔐 Testing admin authentication...', 'test');
    
    const response = await axios.post(`${BACKEND_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    if (response.data.success && response.data.token) {
      log('Admin auth successful - JWT token received', 'success');
      return { success: true, token: response.data.token };
    } else {
      log(`Admin auth failed: ${response.data.error || 'Unknown error'}`, 'error');
      return { success: false };
    }
  } catch (error) {
    log(`Admin auth error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Test de API protegida
async function testProtectedAPI(token) {
  try {
    log('🛡️ Testing protected API with token...', 'test');
    
    // Probar primero con la ruta de prueba temporal
    let response;
    try {
      response = await axios.get(`${BACKEND_URL}/api/admin/test-protected`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
    } catch (error) {
      // Fallback a priorizacion si falla
      try {
        response = await axios.get(`${BACKEND_URL}/api/admin/priorizacion`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
      } catch (error2) {
        // Fallback final a priority-keywords si falla
        response = await axios.get(`${BACKEND_URL}/api/admin/priority-keywords`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
      }
    }
    
    if (response.status === 200) {
      log('Protected API accessible with valid token', 'success');
      return { success: true, data: response.data };
    } else {
      log(`Protected API returned status ${response.status}`, 'warning');
      return { success: false, status: response.status };
    }
  } catch (error) {
    log(`Protected API error: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Health check completo
async function runHealthCheck() {
  const startTime = Date.now();
  let results = {
    timestamp: new Date().toISOString(),
    services: {},
    summary: { total: 0, passed: 0, failed: 0 }
  };
  
  log('Starting comprehensive health check...', 'info');
  
  // Tests de servicios básicos
  const basicTests = [
    ['Frontend', `${FRONTEND_URL}`],
    ['Backend Health', `${BACKEND_URL}/api/health`],
    ['Admin Login Page', `${FRONTEND_URL}/admin/login`],
    ['Packages Page', `${FRONTEND_URL}/paquetes`],
    ['API Packages', `${BACKEND_URL}/api/packages`]
  ];
  
  // Ejecutar tests básicos
  for (const [name, url] of basicTests) {
    const result = await testService(name, url);
    results.services[name] = result;
    results.summary.total++;
    
    if (result.success) {
      results.summary.passed++;
      log(result.message, 'success');
    } else {
      results.summary.failed++;
      log(result.message, 'error');
    }
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test de autenticación
  const authResult = await testAdminAuth();
  results.services['Admin Auth'] = authResult;
  results.summary.total++;
  
  if (authResult.success) {
    results.summary.passed++;
    
    // Test API protegida si auth exitoso
    const protectedResult = await testProtectedAPI(authResult.token);
    results.services['Protected API'] = protectedResult;
    results.summary.total++;
    
    if (protectedResult.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  } else {
    results.summary.failed++;
  }
  
  // Calcular métricas finales
  const duration = Date.now() - startTime;
  const successRate = Math.round((results.summary.passed / results.summary.total) * 100);
  
  console.log('\n📊 HEALTH CHECK RESULTS');
  console.log('========================');
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📈 Total tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`📊 Success rate: ${successRate}%`);
  
  // Determinar status del sistema
  let systemStatus;
  if (successRate >= 90) {
    systemStatus = 'EXCELLENT';
    log('🎉 System status: EXCELLENT - Ready for production!', 'success');
  } else if (successRate >= 75) {
    systemStatus = 'GOOD';
    log('✅ System status: GOOD - Minor issues detected', 'info');
  } else if (successRate >= 50) {
    systemStatus = 'NEEDS_ATTENTION';
    log('⚠️ System status: NEEDS ATTENTION - Several issues found', 'warning');
  } else {
    systemStatus = 'CRITICAL';
    log('❌ System status: CRITICAL - Major issues detected', 'error');
  }
  
  results.systemStatus = systemStatus;
  results.successRate = successRate;
  results.duration = duration;
  
  // Guardar resultados
  try {
    const reportPath = path.join(__dirname, 'health-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    log(`Health check report saved to: ${reportPath}`, 'info');
  } catch (error) {
    log(`Could not save report: ${error.message}`, 'warning');
  }
  
  // Recomendaciones
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (results.services['Frontend']?.success && results.services['Backend Health']?.success) {
    log('✅ Core services running - Basic functionality available', 'info');
  } else {
    log('❌ Core services not running - Start with EJECUTAR-SISTEMA-COMPLETO.bat', 'error');
  }
  
  if (results.services['Admin Auth']?.success) {
    log('✅ Authentication working - Admin panel accessible', 'info');
  } else {
    log('❌ Authentication issues - Check admin credentials and JWT configuration', 'error');
  }
  
  if (successRate >= 90) {
    log('🚀 System ready for comprehensive testing and staging deployment', 'success');
  } else {
    log('🔧 Address failed tests before proceeding to staging', 'warning');
  }
  
  return results;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runHealthCheck()
    .then(results => {
      process.exit(results.successRate >= 75 ? 0 : 1);
    })
    .catch(error => {
      log(`Health check failed: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runHealthCheck, testService, testAdminAuth };
