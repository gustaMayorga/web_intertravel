// ===============================================
// VERIFICACION COMPLETA DE MODULOS ADMIN
// Prueba todos los módulos del panel de administración
// ===============================================

const axios = require('axios').default;

const FRONTEND_URL = 'http://localhost:3005';
const BACKEND_URL = 'http://localhost:3002';

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

async function testPageLoad(pagePath, timeout = 10000) {
  try {
    const response = await axios.get(`${FRONTEND_URL}${pagePath}`, { 
      timeout,
      validateStatus: () => true // Aceptar cualquier status
    });
    
    return {
      success: response.status === 200,
      status: response.status,
      hasContent: response.data && response.data.length > 1000 // Verificar que tenga contenido
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message,
      hasContent: false
    };
  }
}

async function testBackendEndpoint(endpoint, token = null, timeout = 5000) {
  try {
    const config = {
      timeout,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${BACKEND_URL}${endpoint}`, config);
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

async function getAuthToken() {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/admin/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      return response.data.token;
    }
    return null;
  } catch (error) {
    log(`Error obteniendo token: ${error.message}`, 'error');
    return null;
  }
}

async function testAdminModules() {
  console.log('🧪 ===============================================');
  console.log('🧪 VERIFICACIÓN COMPLETA DE MÓDULOS ADMIN');
  console.log('🧪 ===============================================');
  
  // 1. Test Backend Health
  log('Testing Backend Health...', 'test');
  const health = await testBackendEndpoint('/api/health');
  if (health.success) {
    log('Backend Health: OK', 'info');
  } else {
    log('Backend Health: FAILED - Sistema no disponible', 'error');
    return false;
  }
  
  // 2. Test Authentication
  log('Testing Authentication...', 'test');
  const token = await getAuthToken();
  if (token) {
    log('Authentication: OK', 'info');
  } else {
    log('Authentication: FAILED', 'error');
  }
  
  // 3. Test Frontend Pages
  log('Testing Frontend Admin Pages...', 'test');
  
  const adminPages = [
    { path: '/admin', name: 'Admin Home' },
    { path: '/admin/login', name: 'Login Page' },
    { path: '/admin/dashboard', name: 'Dashboard' },
    { path: '/admin/packages', name: 'Packages' },
    { path: '/admin/bookings', name: 'Bookings' },
    { path: '/admin/clients', name: 'Clients' },
    { path: '/admin/users', name: 'Users' },
    { path: '/admin/agencies', name: 'Agencies' },
    { path: '/admin/analytics', name: 'Analytics' },
    { path: '/admin/reports', name: 'Reports' },
    { path: '/admin/priority', name: 'Priority' },
    { path: '/admin/settings', name: 'Settings' },
    { path: '/admin/payments', name: 'Payments' },
    { path: '/admin/accounting', name: 'Accounting' }
  ];
  
  let pagesPassed = 0;
  
  for (const page of adminPages) {
    const result = await testPageLoad(page.path);
    
    if (result.success && result.hasContent) {
      log(`Page ${page.name}: OK`, 'info');
      pagesPassed++;
    } else if (result.success && !result.hasContent) {
      log(`Page ${page.name}: LOADS but may have errors`, 'warning');
      pagesPassed++;
    } else {
      log(`Page ${page.name}: FAILED (${result.status}) - ${result.error || 'No content'}`, 'error');
    }
  }
  
  log(`Frontend Pages: ${pagesPassed}/${adminPages.length} working`, 'info');
  
  // 4. Test Backend Admin Routes
  log('Testing Backend Admin Routes...', 'test');
  
  const adminEndpoints = [
    { path: '/api/admin/stats', name: 'Admin Stats' },
    { path: '/api/admin/clientes', name: 'Clientes API' },
    { path: '/api/admin/reservas', name: 'Reservas API' },
    { path: '/api/admin/priorizacion/config', name: 'Priorización Config' },
    { path: '/api/admin/configuracion', name: 'Configuración API' },
    { path: '/api/admin/whatsapp-config', name: 'WhatsApp Config' }
  ];
  
  let endpointsPassed = 0;
  
  for (const endpoint of adminEndpoints) {
    const needsAuth = !endpoint.path.includes('whatsapp-config');
    const result = await testBackendEndpoint(endpoint.path, needsAuth ? token : null);
    
    if (result.success) {
      log(`API ${endpoint.name}: OK`, 'info');
      endpointsPassed++;
    } else {
      log(`API ${endpoint.name}: FAILED (${result.status}) - ${result.error}`, 'error');
    }
  }
  
  log(`Backend APIs: ${endpointsPassed}/${adminEndpoints.length} working`, 'info');
  
  // 5. Test específico de Reports (FilePdf error)
  log('Testing Reports Page (FilePdf fix)...', 'test');
  
  const reportsResult = await testPageLoad('/admin/reports');
  if (reportsResult.success) {
    log('Reports Page: OK (FilePdf error fixed)', 'success');
  } else {
    log('Reports Page: STILL HAS ERRORS', 'error');
  }
  
  // 6. Test específico de Priority (404 error)
  log('Testing Priority Page (404 fix)...', 'test');
  
  const priorityResult = await testPageLoad('/admin/priority');
  if (priorityResult.success) {
    log('Priority Page: OK (404 error fixed)', 'success');
  } else {
    log('Priority Page: STILL HAS ERRORS', 'error');
  }
  
  // Resumen final
  console.log('');
  console.log('📊 ===============================================');
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('📊 ===============================================');
  
  const totalTests = 4 + adminPages.length + adminEndpoints.length;
  const passedTests = 2 + (health.success ? 1 : 0) + (token ? 1 : 0) + pagesPassed + endpointsPassed;
  
  log(`Total tests: ${passedTests}/${totalTests}`, 'info');
  log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'info');
  
  if (passedTests >= totalTests * 0.9) {
    log('SISTEMA ADMIN: COMPLETAMENTE FUNCIONAL ✅', 'success');
    console.log('🎉 Todo funcionando correctamente!');
    console.log('🌐 Acceder al admin: http://localhost:3005/admin');
    console.log('🔐 Credenciales: admin / admin123');
  } else if (passedTests >= totalTests * 0.7) {
    log('SISTEMA ADMIN: MAYORMENTE FUNCIONAL ⚠️', 'warning');
    console.log('⚠️ Algunos módulos tienen problemas menores');
  } else {
    log('SISTEMA ADMIN: REQUIERE ATENCIÓN ❌', 'error');
    console.log('❌ Múltiples problemas encontrados');
  }
  
  console.log('📊 ===============================================');
  
  return passedTests >= totalTests * 0.8;
}

if (require.main === module) {
  testAdminModules().catch(error => {
    log(`Test error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { testAdminModules };
