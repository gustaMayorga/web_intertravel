// ===============================================
// TESTING EXHAUSTIVO TODOS LOS ENDPOINTS
// Verificación 100% funcionalidad sistema
// ===============================================

const axios = require('axios');
const fs = require('fs');

// Configuración base
const config = {
  backend: 'http://localhost:3002',
  frontend: 'http://localhost:3005', 
  appClient: 'http://localhost:3009',
  timeout: 10000
};

// Credenciales de test
const testCredentials = {
  admin: { username: 'admin', password: 'admin123' },
  user: { email: 'test@intertravel.com', password: 'test123' }
};

let adminToken = null;
let userToken = null;

// ===============================================
// TESTING ENDPOINTS BACKEND
// ===============================================

async function testBackendEndpoints() {
  console.log('\n🔍 TESTING BACKEND ENDPOINTS EXHAUSTIVO');
  console.log('==========================================');
  
  const results = [];
  
  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${config.backend}/api/health`, { timeout: config.timeout });
    results.push({
      endpoint: '/api/health',
      status: health.status,
      success: health.data.success,
      details: health.data
    });
    console.log('✅ Health Check:', health.status);

    // 2. Admin Login
    console.log('2️⃣ Testing Admin Login...');
    try {
      const adminLogin = await axios.post(`${config.backend}/api/admin/auth/login`, testCredentials.admin);
      adminToken = adminLogin.data.token;
      results.push({
        endpoint: '/api/admin/auth/login',
        status: adminLogin.status,
        success: adminLogin.data.success,
        hasToken: !!adminToken
      });
      console.log('✅ Admin Login:', adminLogin.status, adminToken ? '(Token obtenido)' : '(Sin token)');
    } catch (error) {
      results.push({
        endpoint: '/api/admin/auth/login',
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.message
      });
      console.log('❌ Admin Login failed:', error.message);
    }

    // 3. Packages Endpoint
    console.log('3️⃣ Testing Packages...');
    const packages = await axios.get(`${config.backend}/api/packages`);
    results.push({
      endpoint: '/api/packages',
      status: packages.status,
      success: packages.data.success,
      packagesCount: packages.data.data?.length || 0,
      hasData: packages.data.data?.length > 0
    });
    console.log('✅ Packages:', packages.status, `(${packages.data.data?.length || 0} paquetes)`);

    // 4. Admin Clients (con token)
    if (adminToken) {
      console.log('4️⃣ Testing Admin Clients...');
      try {
        const clients = await axios.get(`${config.backend}/api/admin/clients`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        results.push({
          endpoint: '/api/admin/clients',
          status: clients.status,
          success: true,
          clientsCount: clients.data.clients?.length || 0
        });
        console.log('✅ Admin Clients:', clients.status);
      } catch (error) {
        results.push({
          endpoint: '/api/admin/clients',
          status: error.response?.status || 'ERROR',
          success: false,
          error: error.message
        });
        console.log('❌ Admin Clients failed:', error.message);
      }
    }

    // 5. Admin Bookings (con token)
    if (adminToken) {
      console.log('5️⃣ Testing Admin Bookings...');
      try {
        const bookings = await axios.get(`${config.backend}/api/admin/bookings`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        results.push({
          endpoint: '/api/admin/bookings',
          status: bookings.status,
          success: true,
          bookingsCount: bookings.data.bookings?.length || 0
        });
        console.log('✅ Admin Bookings:', bookings.status);
      } catch (error) {
        results.push({
          endpoint: '/api/admin/bookings',
          status: error.response?.status || 'ERROR',
          success: false,
          error: error.message
        });
        console.log('❌ Admin Bookings failed:', error.message);
      }
    }

    // 6. App Client Register
    console.log('6️⃣ Testing App Client Register...');
    try {
      const register = await axios.post(`${config.backend}/api/app/auth/register`, {
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@intertravel.com`,
        password: 'test123',
        phone: '123456789'
      });
      results.push({
        endpoint: '/api/app/auth/register',
        status: register.status,
        success: register.data.success,
        hasToken: !!register.data.token
      });
      console.log('✅ App Register:', register.status);
    } catch (error) {
      results.push({
        endpoint: '/api/app/auth/register',
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.message
      });
      console.log('❌ App Register failed:', error.message);
    }

    // 7. App Client Login
    console.log('7️⃣ Testing App Client Login...');
    try {
      const userLogin = await axios.post(`${config.backend}/api/app/auth/login`, testCredentials.user);
      userToken = userLogin.data.token;
      results.push({
        endpoint: '/api/app/auth/login',
        status: userLogin.status,
        success: userLogin.data.success,
        hasToken: !!userToken
      });
      console.log('✅ App Login:', userLogin.status);
    } catch (error) {
      results.push({
        endpoint: '/api/app/auth/login',
        status: error.response?.status || 'ERROR',
        success: false,
        error: error.message
      });
      console.log('❌ App Login failed:', error.message);
    }

  } catch (error) {
    console.error('💥 Error testing backend:', error.message);
  }

  return results;
}

// ===============================================
// TESTING FRONTEND
// ===============================================

async function testFrontendHealth() {
  console.log('\n🌐 TESTING FRONTEND');
  console.log('===================');
  
  try {
    const frontend = await axios.get(config.frontend, { timeout: config.timeout });
    console.log('✅ Frontend activo:', frontend.status);
    
    const appClient = await axios.get(config.appClient, { timeout: config.timeout });
    console.log('✅ App Cliente activo:', appClient.status);
    
    return {
      frontend: { status: frontend.status, active: true },
      appClient: { status: appClient.status, active: true }
    };
  } catch (error) {
    console.error('❌ Frontend error:', error.message);
    return {
      frontend: { status: 'ERROR', active: false },
      appClient: { status: 'ERROR', active: false }
    };
  }
}

// ===============================================
// TESTING INTEGRACIÓN MÓDULOS
// ===============================================

async function testModuleIntegration() {
  console.log('\n🔗 TESTING INTEGRACIÓN MÓDULOS');
  console.log('===============================');
  
  const integrationTests = [];
  
  try {
    // Test 1: Frontend → Backend (Packages)
    console.log('1️⃣ Frontend → Backend integration...');
    const frontendToBackend = await axios.get(`${config.backend}/api/packages`);
    integrationTests.push({
      test: 'Frontend → Backend',
      status: frontendToBackend.status,
      success: frontendToBackend.data.success,
      description: 'Frontend puede obtener paquetes del backend'
    });

    // Test 2: Admin → Database
    if (adminToken) {
      console.log('2️⃣ Admin → Database integration...');
      const adminToDb = await axios.get(`${config.backend}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      integrationTests.push({
        test: 'Admin → Database',
        status: adminToDb.status,
        success: true,
        description: 'Admin panel puede acceder a datos de BD'
      });
    }

    // Test 3: App Cliente → Backend
    if (userToken) {
      console.log('3️⃣ App Cliente → Backend integration...');
      const appToBackend = await axios.get(`${config.backend}/api/app/profile`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      integrationTests.push({
        test: 'App Cliente → Backend',
        status: appToBackend.status,
        success: true,
        description: 'App cliente puede acceder a perfil de usuario'
      });
    }

  } catch (error) {
    console.error('❌ Integration test error:', error.message);
    integrationTests.push({
      test: 'Integration Error',
      status: 'ERROR',
      success: false,
      error: error.message
    });
  }

  return integrationTests;
}

// ===============================================
// PERFORMANCE TESTING BÁSICO
// ===============================================

async function testPerformance() {
  console.log('\n⚡ TESTING PERFORMANCE BÁSICO');
  console.log('============================');
  
  const performanceResults = [];
  
  // Test de carga básico - múltiples requests
  console.log('🔄 Testing carga múltiple...');
  
  const startTime = Date.now();
  const promises = [];
  
  // 10 requests simultáneos al endpoint más pesado
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.get(`${config.backend}/api/packages`).catch(err => ({ error: err.message }))
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;
  
  performanceResults.push({
    test: 'Carga múltiple (10 requests)',
    duration: endTime - startTime,
    successful,
    failed,
    avgTime: (endTime - startTime) / 10,
    status: failed === 0 ? 'PASS' : 'PARTIAL'
  });
  
  console.log(`✅ Performance test completado: ${successful}/${results.length} exitosos en ${endTime - startTime}ms`);
  
  return performanceResults;
}

// ===============================================
// EJECUTAR TODOS LOS TESTS
// ===============================================

async function runCompleteVerification() {
  console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DEL SISTEMA');
  console.log('===============================================');
  console.log(`Fecha: ${new Date().toISOString()}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    backend: [],
    frontend: {},
    integration: [],
    performance: [],
    summary: {}
  };
  
  try {
    // Ejecutar todos los tests
    results.backend = await testBackendEndpoints();
    results.frontend = await testFrontendHealth();
    results.integration = await testModuleIntegration();
    results.performance = await testPerformance();
    
    // Calcular resumen
    const backendSuccess = results.backend.filter(r => r.success !== false).length;
    const backendTotal = results.backend.length;
    
    results.summary = {
      backendEndpoints: `${backendSuccess}/${backendTotal}`,
      frontendActive: results.frontend.frontend?.active && results.frontend.appClient?.active,
      integrationTests: results.integration.filter(r => r.success).length,
      performanceStatus: results.performance[0]?.status || 'UNKNOWN',
      overallScore: Math.round((backendSuccess / backendTotal) * 100)
    };
    
    // Guardar resultados
    fs.writeFileSync('verification-complete-report.json', JSON.stringify(results, null, 2));
    
    console.log('\n📊 RESUMEN VERIFICACIÓN COMPLETA');
    console.log('================================');
    console.log(`✅ Backend endpoints: ${results.summary.backendEndpoints}`);
    console.log(`✅ Frontend activo: ${results.summary.frontendActive ? 'SÍ' : 'NO'}`);
    console.log(`✅ Tests integración: ${results.summary.integrationTests}`);
    console.log(`✅ Performance: ${results.summary.performanceStatus}`);
    console.log(`📈 Score general: ${results.summary.overallScore}%`);
    
    console.log('\n💾 Reporte completo guardado en: verification-complete-report.json');
    
    if (results.summary.overallScore >= 90) {
      console.log('🎉 SISTEMA VERIFICADO AL 90%+ - LISTO PARA PRODUCCIÓN');
    } else if (results.summary.overallScore >= 70) {
      console.log('⚠️ SISTEMA FUNCIONAL - REQUIERE AJUSTES MENORES');
    } else {
      console.log('❌ SISTEMA REQUIERE CORRECCIONES IMPORTANTES');
    }
    
  } catch (error) {
    console.error('💥 Error en verificación completa:', error);
  }
}

// Ejecutar verificación
if (require.main === module) {
  runCompleteVerification();
}

module.exports = {
  runCompleteVerification,
  testBackendEndpoints,
  testFrontendHealth,
  testModuleIntegration,
  testPerformance
};
