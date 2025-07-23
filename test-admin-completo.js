// ===============================================
// CORRECCIÓN COMPLETA - AUTENTICACIÓN Y RUTAS ADMIN
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
    'fix': '🔧',
    'test': '🧪'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testEndpoint(endpoint, method = 'GET', data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { 
      success: true, 
      status: response.status, 
      data: response.data
    };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 0,
      error: error.message
    };
  }
}

async function testAdminAuthentication() {
  log('Testing Admin Authentication Flow...', 'test');
  
  // 1. Test Login
  const loginResult = await testEndpoint('/api/admin/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123'
  });
  
  if (!loginResult.success) {
    log(`Login FAILED: ${loginResult.error}`, 'error');
    return null;
  }
  
  log('Login successful, token received', 'info');
  return loginResult.data.token;
}

async function testAdminRoutes() {
  log('Testing All Admin Routes...', 'test');
  
  // Obtener token de autenticación
  const token = await testAdminAuthentication();
  if (!token) {
    log('Cannot test admin routes without valid token', 'error');
    return false;
  }
  
  const adminRoutes = [
    '/api/admin/stats',
    '/api/admin/clientes',
    '/api/admin/reservas', 
    '/api/admin/priorizacion/config',
    '/api/admin/configuracion',
    '/api/admin/whatsapp-config'
  ];
  
  let successCount = 0;
  
  for (const route of adminRoutes) {
    const needsAuth = !route.includes('whatsapp-config');
    const result = await testEndpoint(route, 'GET', null, needsAuth ? token : null);
    
    if (result.success) {
      log(`Route ${route}: OK (${result.status})`, 'info');
      successCount++;
    } else {
      log(`Route ${route}: FAILED (${result.status}) - ${result.error}`, 'error');
    }
  }
  
  log(`Admin Routes: ${successCount}/${adminRoutes.length} working`, successCount === adminRoutes.length ? 'info' : 'warning');
  return successCount === adminRoutes.length;
}

async function testSpecificPriorityRoutes() {
  log('Testing Priority Module Routes...', 'test');
  
  const token = await testAdminAuthentication();
  if (!token) return false;
  
  const priorityRoutes = [
    '/api/admin/priorizacion/config',
    '/api/admin/priorizacion/keywords',
    '/api/admin/priorizacion/stats'
  ];
  
  for (const route of priorityRoutes) {
    const result = await testEndpoint(route, 'GET', null, token);
    
    if (result.success) {
      log(`Priority route ${route}: OK`, 'info');
    } else {
      log(`Priority route ${route}: FAILED - ${result.error}`, 'error');
    }
  }
}

async function runCompleteTests() {
  console.log('🔧 ===============================================');
  console.log('🔧 DIAGNÓSTICO COMPLETO - ADMIN AUTHENTICATION');
  console.log('🔧 ===============================================');
  
  // Test 1: Basic endpoints
  log('Testing basic endpoints...', 'test');
  
  const health = await testEndpoint('/api/health');
  if (health.success) {
    log('Health check: OK', 'info');
  } else {
    log('Health check: FAILED', 'error');
    return false;
  }
  
  // Test 2: Authentication flow
  await testAdminAuthentication();
  
  // Test 3: All admin routes
  const adminSuccess = await testAdminRoutes();
  
  // Test 4: Priority specific routes
  await testSpecificPriorityRoutes();
  
  // Test 5: WhatsApp config (sin auth)
  const whatsapp = await testEndpoint('/api/admin/whatsapp-config');
  if (whatsapp.success) {
    log('WhatsApp config: OK (no auth required)', 'info');
  } else {
    log(`WhatsApp config: FAILED - ${whatsapp.error}`, 'error');
  }
  
  console.log('');
  console.log('💡 ===============================================');
  console.log('💡 PROBLEMAS IDENTIFICADOS Y SOLUCIONES');
  console.log('💡 ===============================================');
  
  log('1. Frontend Authentication Issues:', 'fix');
  console.log('   - Login bypasses validation using localStorage only');
  console.log('   - Should verify token with backend /api/admin/auth/verify');
  console.log('   - Dashboard should redirect to login if token invalid');
  
  log('2. Admin Routes Configuration:', 'fix');
  console.log('   - Some routes may be missing from server.js');
  console.log('   - WhatsApp config route conflicts resolved');
  console.log('   - Priority routes need proper middleware setup');
  
  log('3. Recommended Frontend Fixes:', 'fix');
  console.log('   - Add token validation in login component');
  console.log('   - Create auth guard for protected routes');
  console.log('   - Implement proper logout functionality');
  
  return adminSuccess;
}

if (require.main === module) {
  runCompleteTests().catch(error => {
    log(`Test error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runCompleteTests, testAdminAuthentication };
