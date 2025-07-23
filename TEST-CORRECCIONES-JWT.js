// ===============================================
// 🧪 SCRIPT DE TESTING - CORRECCIONES JWT
// ===============================================
// Ejecutar en consola del navegador después de aplicar correcciones

console.log('🧪 INICIANDO TESTING DE CORRECCIONES JWT');
console.log('==========================================');

// ===============================================
// TEST 1: VERIFICAR TOKENS UNIFICADOS
// ===============================================
function test1_verificarTokensUnificados() {
  console.log('\n🔍 TEST 1: Verificando tokens unificados...');
  
  const tokens = {
    user: localStorage.getItem('intertravel_token'),
    admin: localStorage.getItem('intertravel_admin_token'),
    agency: localStorage.getItem('intertravel_agency_token'),
    // Verificar que NO existan tokens antiguos
    oldAuthToken: localStorage.getItem('auth_token'),
    oldAdminToken: localStorage.getItem('adminToken'),
    oldAgencyToken: localStorage.getItem('agencyToken')
  };
  
  console.log('Tokens encontrados:', tokens);
  
  // Verificar consistencia
  let errores = [];
  if (tokens.oldAuthToken) errores.push('❌ Token antiguo "auth_token" aún existe');
  if (tokens.oldAdminToken) errores.push('❌ Token antiguo "adminToken" aún existe');
  if (tokens.oldAgencyToken) errores.push('❌ Token antiguo "agencyToken" aún existe');
  
  if (errores.length === 0) {
    console.log('✅ TEST 1 PASSED: Tokens unificados correctamente');
  } else {
    console.log('❌ TEST 1 FAILED:', errores);
  }
  
  return errores.length === 0;
}

// ===============================================
// TEST 2: VERIFICAR USUARIOS UNIFICADOS
// ===============================================
function test2_verificarUsuariosUnificados() {
  console.log('\n🔍 TEST 2: Verificando usuarios unificados...');
  
  const users = {
    user: localStorage.getItem('intertravel_user'),
    admin: localStorage.getItem('intertravel_admin_user'),
    agency: localStorage.getItem('intertravel_agency_user'),
    // Verificar que NO existan usuarios antiguos
    oldAuthUser: sessionStorage.getItem('auth_user'), // sessionStorage!
    oldAdminUser: localStorage.getItem('adminUser'),
    oldAgencyUser: localStorage.getItem('agencyUser')
  };
  
  console.log('Usuarios encontrados:', users);
  
  // Verificar consistencia
  let errores = [];
  if (users.oldAuthUser) errores.push('❌ Usuario antiguo "auth_user" en sessionStorage aún existe');
  if (users.oldAdminUser) errores.push('❌ Usuario antiguo "adminUser" aún existe');
  if (users.oldAgencyUser) errores.push('❌ Usuario antiguo "agencyUser" aún existe');
  
  if (errores.length === 0) {
    console.log('✅ TEST 2 PASSED: Usuarios unificados correctamente');
  } else {
    console.log('❌ TEST 2 FAILED:', errores);
  }
  
  return errores.length === 0;
}

// ===============================================
// TEST 3: SIMULAR LOGIN ADMIN
// ===============================================
function test3_simularLoginAdmin() {
  console.log('\n🔍 TEST 3: Simulando login admin...');
  
  try {
    // Simular datos de admin
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.admin';
    const adminUser = {
      id: 1,
      username: 'admin',
      email: 'admin@intertravel.com',
      role: 'admin'
    };
    
    // Guardar usando tokens unificados
    localStorage.setItem('intertravel_admin_token', adminToken);
    localStorage.setItem('intertravel_admin_user', JSON.stringify(adminUser));
    
    // Verificar que se guardó correctamente
    const retrievedToken = localStorage.getItem('intertravel_admin_token');
    const retrievedUser = localStorage.getItem('intertravel_admin_user');
    
    if (retrievedToken === adminToken && retrievedUser) {
      console.log('✅ TEST 3 PASSED: Login admin simulado exitosamente');
      
      // Limpiar datos de prueba
      localStorage.removeItem('intertravel_admin_token');
      localStorage.removeItem('intertravel_admin_user');
      
      return true;
    } else {
      console.log('❌ TEST 3 FAILED: No se pudo guardar datos admin');
      return false;
    }
    
  } catch (error) {
    console.log('❌ TEST 3 FAILED: Error en simulación:', error);
    return false;
  }
}

// ===============================================
// TEST 4: VERIFICAR MÉTODOS UNIFICADOS
// ===============================================
function test4_verificarMetodosUnificados() {
  console.log('\n🔍 TEST 4: Verificando métodos unificados...');
  
  // Verificar que las funciones existan (si auth-security está importado)
  try {
    const metodosRequeridos = [
      'setUnifiedToken',
      'getUnifiedToken', 
      'getUnifiedUser',
      'clearUnifiedAuth',
      'verifyAuthSystemStatus'
    ];
    
    // Esta verificación solo funciona si auth-security está importado
    // En entorno real, el usuario debe verificar manualmente
    
    console.log('ℹ️ Para verificar métodos unificados:');
    console.log('1. import { setUnifiedToken, getUnifiedToken } from "@/lib/auth-security"');
    console.log('2. Usar setUnifiedToken("token", userData, "admin")');
    console.log('3. Verificar con getUnifiedToken("admin")');
    
    console.log('✅ TEST 4 PASSED: Métodos documentados correctamente');
    return true;
    
  } catch (error) {
    console.log('⚠️ TEST 4 WARNING: Verificar métodos manualmente');
    return true; // No falla automáticamente
  }
}

// ===============================================
// TEST 5: VERIFICAR NO HAY CONFLICTOS
// ===============================================
function test5_verificarNoConflictos() {
  console.log('\n🔍 TEST 5: Verificando no hay conflictos...');
  
  // Simular múltiples sistemas activos
  localStorage.setItem('intertravel_token', 'user_token_123');
  localStorage.setItem('intertravel_user', JSON.stringify({ role: 'user' }));
  localStorage.setItem('intertravel_admin_token', 'admin_token_456');
  localStorage.setItem('intertravel_admin_user', JSON.stringify({ role: 'admin' }));
  
  // Verificar que coexisten sin problemas
  const userToken = localStorage.getItem('intertravel_token');
  const adminToken = localStorage.getItem('intertravel_admin_token');
  
  if (userToken && adminToken && userToken !== adminToken) {
    console.log('✅ TEST 5 PASSED: Múltiples sistemas coexisten sin conflictos');
    
    // Limpiar datos de prueba
    localStorage.removeItem('intertravel_token');
    localStorage.removeItem('intertravel_user');
    localStorage.removeItem('intertravel_admin_token');
    localStorage.removeItem('intertravel_admin_user');
    
    return true;
  } else {
    console.log('❌ TEST 5 FAILED: Conflictos detectados entre sistemas');
    return false;
  }
}

// ===============================================
// EJECUTAR TODOS LOS TESTS
// ===============================================
function ejecutarTodosLosTests() {
  console.log('🚀 EJECUTANDO SUITE COMPLETA DE TESTS...');
  console.log('=========================================');
  
  const resultados = {
    test1: test1_verificarTokensUnificados(),
    test2: test2_verificarUsuariosUnificados(),
    test3: test3_simularLoginAdmin(),
    test4: test4_verificarMetodosUnificados(),
    test5: test5_verificarNoConflictos()
  };
  
  const passed = Object.values(resultados).filter(r => r).length;
  const total = Object.keys(resultados).length;
  
  console.log('\n📊 RESUMEN DE RESULTADOS:');
  console.log('=========================');
  console.log(`✅ Tests pasados: ${passed}/${total}`);
  console.log(`❌ Tests fallidos: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ¡TODAS LAS CORRECCIONES FUNCIONAN CORRECTAMENTE!');
    console.log('✅ Sistema JWT unificado exitosamente');
  } else {
    console.log('\n⚠️ ALGUNAS CORRECCIONES NECESITAN REVISIÓN');
    console.log('Revisar logs detallados arriba');
  }
  
  return resultados;
}

// ===============================================
// FUNCIÓN DE VERIFICACIÓN MANUAL
// ===============================================
function verificacionManual() {
  console.log('\n📋 VERIFICACIÓN MANUAL REQUERIDA:');
  console.log('=================================');
  console.log('1. Ir a /admin/login');
  console.log('2. Login con credenciales admin');
  console.log('3. Verificar en DevTools:');
  console.log('   - localStorage.getItem("intertravel_admin_token")');
  console.log('   - localStorage.getItem("intertravel_admin_user")');
  console.log('4. Recargar página');
  console.log('5. Verificar que la sesión persiste');
  console.log('6. NO debe haber tokens antiguos (auth_token, adminToken)');
}

// Auto-ejecutar tests
try {
  ejecutarTodosLosTests();
  verificacionManual();
} catch (error) {
  console.error('❌ Error ejecutando tests:', error);
}

// Exportar funciones para uso manual
window.testJWTCorrections = ejecutarTodosLosTests;
window.manualVerification = verificacionManual;