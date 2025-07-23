// FIX-AUTH-SYNC.js - Script para sincronizar auth-service y api-client
// Ejecutar en consola del navegador para arreglar el problema de autenticación

console.log('🔧 SINCRONIZACIÓN AUTH-SERVICE ↔ API-CLIENT');
console.log('=============================================');

function fixAuthSync() {
  console.log('🔍 1. Verificando estado actual...');
  
  // Verificar tokens en localStorage
  const intertravelToken = localStorage.getItem('intertravel_token');
  const authToken = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('intertravel_user');
  
  console.log('Token intertravel_token:', intertravelToken ? '✅ Presente' : '❌ Ausente');
  console.log('Token auth_token:', authToken ? '✅ Presente' : '❌ Ausente');
  console.log('Usuario intertravel_user:', userData ? '✅ Presente' : '❌ Ausente');
  
  // Determinar cual token usar
  let tokenToUse = intertravelToken || authToken;
  
  if (!tokenToUse) {
    console.log('❌ No hay tokens disponibles. Necesitas hacer login.');
    return false;
  }
  
  console.log('🔄 2. Sincronizando tokens...');
  
  // Guardar en ambas ubicaciones
  localStorage.setItem('intertravel_token', tokenToUse);
  localStorage.setItem('auth_token', tokenToUse);
  
  console.log('✅ Tokens sincronizados en localStorage');
  
  // Verificar si api-client está disponible globalmente
  if (typeof window !== 'undefined' && window.apiClient) {
    console.log('🔄 3. Actualizando api-client...');
    window.apiClient.setToken(tokenToUse);
    console.log('✅ api-client actualizado');
  } else {
    console.log('⚠️ api-client no está disponible globalmente');
  }
  
  console.log('🎉 Sincronización completada');
  return true;
}

function testAuthentication() {
  console.log('🧪 PROBANDO AUTENTICACIÓN...');
  console.log('============================');
  
  const token = localStorage.getItem('intertravel_token');
  if (!token) {
    console.log('❌ No hay token para probar');
    return;
  }
  
  // Test de request autenticado
  fetch('http://localhost:3002/api/app/user/bookings', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📡 Response status:', response.status);
    if (response.status === 200) {
      console.log('✅ AUTENTICACIÓN FUNCIONANDO');
      return response.json();
    } else if (response.status === 401) {
      console.log('❌ Token no válido o expirado');
      return response.json();
    } else {
      console.log('⚠️ Otro error:', response.status);
      return response.json();
    }
  })
  .then(data => {
    console.log('📄 Response data:', data);
  })
  .catch(error => {
    console.error('❌ Error de red:', error);
  });
}

function createTestUser() {
  console.log('👤 CREANDO USUARIO DE PRUEBA...');
  console.log('===============================');
  
  const testData = {
    email: 'test@intertravel.com',
    password: 'test123',
    firstName: 'Test',
    lastName: 'User',
    phone: '123456789'
  };
  
  fetch('http://localhost:3002/api/app/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('📝 Registro response:', data);
    if (data.success && data.data && data.data.token) {
      console.log('✅ Usuario de prueba creado');
      console.log('🔑 Token recibido:', data.data.token.substring(0, 20) + '...');
      
      // Guardar el token
      localStorage.setItem('intertravel_token', data.data.token);
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('intertravel_user', JSON.stringify(data.data.user));
      
      console.log('💾 Token y usuario guardados');
    }
  })
  .catch(error => {
    console.error('❌ Error creando usuario:', error);
  });
}

function loginTestUser() {
  console.log('🔑 LOGIN CON USUARIO DE PRUEBA...');
  console.log('=================================');
  
  const loginData = {
    email: 'test@intertravel.com',
    password: 'test123'
  };
  
  fetch('http://localhost:3002/api/app/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('🔍 Login response:', JSON.stringify(data, null, 2));
    
    if (data.success || (data.data && data.data.token)) {
      const responseData = data.data || data;
      
      console.log('✅ Login exitoso');
      console.log('🔑 Token recibido:', responseData.token.substring(0, 20) + '...');
      
      // Guardar el token
      localStorage.setItem('intertravel_token', responseData.token);
      localStorage.setItem('auth_token', responseData.token);
      localStorage.setItem('intertravel_user', JSON.stringify(responseData.user));
      
      console.log('💾 Token y usuario guardados');
      
      // Probar autenticación
      setTimeout(() => {
        testAuthentication();
      }, 1000);
      
    } else {
      console.log('❌ Login falló:', data.error || data.message);
    }
  })
  .catch(error => {
    console.error('❌ Error en login:', error);
  });
}

// Ejecutar automáticamente
console.log('🚀 Iniciando fix automático...');

// Paso 1: Sincronizar
fixAuthSync();

// Paso 2: Probar autenticación actual
setTimeout(() => {
  console.log('\n🧪 Probando autenticación actual...');
  testAuthentication();
}, 1000);

// Paso 3: Intentar login si no hay token válido
setTimeout(() => {
  const token = localStorage.getItem('intertravel_token');
  if (!token) {
    console.log('\n🔑 No hay token válido, intentando login...');
    loginTestUser();
  }
}, 3000);

// Funciones disponibles globalmente
window.fixAuthSync = fixAuthSync;
window.testAuthentication = testAuthentication;
window.createTestUser = createTestUser;
window.loginTestUser = loginTestUser;

console.log('\n📋 FUNCIONES DISPONIBLES:');
console.log('• window.fixAuthSync() - Sincronizar tokens');
console.log('• window.testAuthentication() - Probar auth');
console.log('• window.createTestUser() - Crear usuario test');
console.log('• window.loginTestUser() - Login con usuario test');