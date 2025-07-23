const fetch = require('node-fetch');

// ===== TEST FINAL DE VERIFICACIÓN - WEB-FINAL-UNIFICADA =====

console.log('🧪 =======================================================');
console.log('🧪  TEST FINAL - WEB-FINAL-UNIFICADA');
console.log('🧪  Meta: Pasar de 70.8% a 95%+ funcionalidad'); 
console.log('🧪 =======================================================');
console.log('');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

// Configuración para WEB-FINAL-UNIFICADA
const BACKEND_URL = 'http://localhost:3002';
const FRONTEND_URL = 'http://localhost:3005';
const TIMEOUT = 10000; // 10 segundos timeout

// Helper function para tests con timeout
async function testWithTimeout(testName, testFunction, timeout = TIMEOUT) {
    totalTests++;
    try {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), timeout);
        });
        
        const result = await Promise.race([testFunction(), timeoutPromise]);
        
        console.log(`✅ ${testName}: PASSED`);
        passedTests++;
        return result;
    } catch (error) {
        console.log(`❌ ${testName}: FAILED (${error.message})`);
        failedTests.push({ test: testName, error: error.message });
        return null;
    }
}

// Helper para login y obtener token
async function getAuthToken() {
    const response = await fetch(`${BACKEND_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
        })
    });
    
    if (response.ok) {
        const data = await response.json();
        return data.token;
    }
    throw new Error(`Login failed: ${response.status}`);
}

// ===== TESTS BACKEND =====
async function testBackendHealth() {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.status !== 'ok') throw new Error('Health check failed');
}

async function testBackendLogin() {
    const response = await fetch(`${BACKEND_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
        })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.token) throw new Error('Login response invalid');
}

async function testAdminStats() {
    const token = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.data) throw new Error('Stats response invalid');
}

async function testAdminClientes() {
    const token = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/admin/clientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.data) throw new Error('Clientes response invalid');
}

async function testAdminReservas() {
    const token = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/admin/reservas`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.data) throw new Error('Reservas response invalid');
}

async function testAdminPriorizacion() {
    const token = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/admin/priorizacion-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.data) throw new Error('Priorización response invalid');
}

async function testAdminConfiguracion() {
    const token = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/admin/configuracion`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data.success || !data.data) throw new Error('Configuración response invalid');
}

async function testWhatsAppConfig() {
    const response = await fetch(`${BACKEND_URL}/api/admin/whatsapp-config`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// ===== TESTS DE SEGURIDAD =====
async function testAuthSecurity() {
    // Test sin token
    const response1 = await fetch(`${BACKEND_URL}/api/admin/stats`);
    if (response1.status !== 401) {
        throw new Error('Should require authentication');
    }
    
    // Test con token inválido
    const response2 = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: { 'Authorization': 'Bearer invalid_token' }
    });
    if (response2.status !== 401) {
        throw new Error('Should reject invalid token');
    }
}

// ===== TESTS FRONTEND =====
async function testFrontendPages() {
    const pages = [
        { path: '/admin/login', name: 'Login Page' },
        { path: '/admin/dashboard', name: 'Dashboard' },
        { path: '/admin/packages', name: 'Packages' },
        { path: '/admin/clients', name: 'Clients' },
        { path: '/admin/bookings', name: 'Bookings' },
        { path: '/admin/users', name: 'Users' },
        { path: '/admin/analytics', name: 'Analytics' },
        { path: '/admin/reports', name: 'Reports' }
    ];
    
    let pagesPassed = 0;
    
    for (const page of pages) {
        try {
            const response = await fetch(`${FRONTEND_URL}${page.path}`, { 
                timeout: 5000,
                validateStatus: () => true 
            });
            
            if (response.status === 200) {
                console.log(`✅ Frontend Page ${page.name}: OK`);
                pagesPassed++;
            } else {
                console.log(`❌ Frontend Page ${page.name}: FAILED (${response.status})`);
                failedTests.push({ test: `Frontend ${page.name}`, error: `HTTP ${response.status}` });
            }
        } catch (error) {
            console.log(`❌ Frontend Page ${page.name}: FAILED (${error.message})`);
            failedTests.push({ test: `Frontend ${page.name}`, error: error.message });
        }
        totalTests++;
    }
    
    return pagesPassed;
}

// ===== EJECUTAR TODOS LOS TESTS =====
async function runAllTests() {
    console.log('🔍 1. TESTING BACKEND CORE...');
    await testWithTimeout('Backend Health Check', testBackendHealth);
    await testWithTimeout('Backend Login', testBackendLogin);
    
    console.log('\n🔍 2. TESTING ADMIN APIs (LAS QUE ESTABAN FALLANDO)...');
    await testWithTimeout('API Admin Stats', testAdminStats);
    await testWithTimeout('API Admin Clientes', testAdminClientes);
    await testWithTimeout('API Admin Reservas', testAdminReservas);
    await testWithTimeout('API Admin Priorización', testAdminPriorizacion);
    await testWithTimeout('API Admin Configuración', testAdminConfiguracion);
    await testWithTimeout('API WhatsApp Config', testWhatsAppConfig);
    
    console.log('\n🔍 3. TESTING SECURITY...');
    await testWithTimeout('Auth Security', testAuthSecurity);
    
    console.log('\n🔍 4. TESTING FRONTEND PAGES...');
    try {
        await testFrontendPages();
    } catch (error) {
        console.log('⚠️  Frontend testing skipped (server may not be running)');
    }
    
    // ===== RESULTADOS FINALES =====
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RESULTADOS FINALES DEL TESTING - WEB-FINAL-UNIFICADA');
    console.log('='.repeat(70));
    
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`📊 Tests ejecutados: ${totalTests}`);
    console.log(`✅ Tests exitosos: ${passedTests}`);
    console.log(`❌ Tests fallidos: ${totalTests - passedTests}`);
    console.log(`📈 Tasa de éxito: ${successRate}%`);
    
    console.log('\n📋 COMPARACIÓN CON ESTADO ANTERIOR:');
    console.log('   Estado anterior: 70.8% (17/24 tests)');
    console.log(`   Estado actual:   ${successRate}% (${passedTests}/${totalTests} tests)`);
    
    if (parseFloat(successRate) >= 95) {
        console.log('\n🎉 ¡META ALCANZADA! Sistema funcionando al 95%+');
        console.log('✅ Todas las correcciones aplicadas exitosamente');
        console.log('\n🚀 SISTEMA LISTO PARA PRODUCCIÓN:');
        console.log(`   🌐 Frontend: ${FRONTEND_URL}/admin`);
        console.log(`   🔧 Backend:  ${BACKEND_URL}/api/admin`);
        console.log('   🔐 Credenciales: admin / admin123');
    } else if (parseFloat(successRate) > 70.8) {
        console.log('\n📈 ¡MEJORA CONFIRMADA! Progreso significativo detectado');
        console.log('🔧 Algunas correcciones funcionando, revisar tests fallidos');
    } else {
        console.log('\n⚠️  Sin mejora detectada, revisar implementación');
    }
    
    if (failedTests.length > 0) {
        console.log('\n❌ TESTS FALLIDOS PENDIENTES:');
        failedTests.forEach(test => {
            console.log(`   - ${test.test}: ${test.error}`);
        });
        
        console.log('\n🔧 RECOMENDACIONES:');
        if (failedTests.some(t => t.test.includes('API Admin'))) {
            console.log('   - Verificar que backend esté ejecutándose en puerto 3002');
            console.log('   - Comprobar que main-routes.js fue aplicado correctamente');
            console.log('   - Verificar module.exports en main-routes.js');
        }
        if (failedTests.some(t => t.test.includes('Frontend'))) {
            console.log('   - Verificar que frontend esté ejecutándose en puerto 3005');
            console.log('   - Aplicar AuthGuard en páginas admin restantes');
            console.log('   - Reemplazar login component con LoginFixed');
        }
        if (failedTests.some(t => t.test.includes('Auth'))) {
            console.log('   - Verificar authMiddleware en server.js');
            console.log('   - Comprobar configuración JWT');
        }
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    if (parseFloat(successRate) >= 95) {
        console.log('   ✅ Sistema listo para producción');
        console.log('   📝 Documentar cambios realizados');
        console.log('   🚀 Proceder con deploy si corresponde');
    } else {
        console.log('   🔧 Aplicar correcciones para tests fallidos');
        console.log('   🧪 Re-ejecutar testing: node test-final-verification-web-unificada.js');
        console.log('   📋 Objetivo: Alcanzar 95%+ de éxito');
    }
    
    console.log('\n🔄 COMANDOS PARA REINICIAR SISTEMA:');
    console.log('   Backend:  cd backend && npm start');
    console.log('   Frontend: cd frontend && npm run dev');
    
    console.log('\n' + '='.repeat(70));
    console.log(`🏁 TESTING COMPLETADO - ${successRate}% SUCCESS RATE`);
    console.log('🌟 WEB-FINAL-UNIFICADA - Sistema InterTravel');
    console.log('='.repeat(70));
}

// Ejecutar tests
runAllTests().catch(error => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
});
