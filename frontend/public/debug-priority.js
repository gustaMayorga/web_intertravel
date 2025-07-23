// =============================================
// SCRIPT DE DEBUG PARA PRIORIDADES
// =============================================

console.log('🔧 Iniciando debug de módulo de prioridades...');

// 1. Verificar tokens en localStorage
console.log('📋 Verificando tokens...');
const token = localStorage.getItem('auth_token');
const user = sessionStorage.getItem('auth_user');

console.log('Token:', token ? '✅ Presente' : '❌ No encontrado');
console.log('User:', user ? '✅ Presente' : '❌ No encontrado');

if (user) {
  try {
    const userData = JSON.parse(user);
    console.log('Usuario:', userData);
  } catch (e) {
    console.error('❌ Error parseando usuario:', e);
  }
}

// 2. Función para probar API de prioridades
async function testPriorityAPI() {
  console.log('🔍 Probando API de prioridades...');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  try {
    console.log('📤 Headers enviados:', headers);
    
    const response = await fetch('/api/admin/priority-keywords', { headers });
    const data = await response.json();
    
    console.log('📥 Respuesta:', response.status, data);
    
    if (data.success) {
      console.log('✅ API funcionando correctamente');
    } else {
      console.error('❌ Error en API:', data.error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

// 3. Función para probar actualización
async function testUpdate() {
  console.log('🔄 Probando actualización...');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  try {
    const response = await fetch('/api/admin/priority-keywords/5', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        keyword: 'test-update',
        priority: 10,
        category: 'test',
        description: 'Test de actualización'
      })
    });
    
    const data = await response.json();
    console.log('📥 Respuesta actualización:', response.status, data);
    
  } catch (error) {
    console.error('❌ Error en actualización:', error);
  }
}

// Ejecutar pruebas
testPriorityAPI();

// Agregar funciones globales para usar en consola
window.debugPriority = {
  testAPI: testPriorityAPI,
  testUpdate: testUpdate,
  checkTokens: () => {
    console.log('Token:', localStorage.getItem('auth_token'));
    console.log('User:', sessionStorage.getItem('auth_user'));
  },
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    console.log('✅ Auth limpiado');
  }
};

console.log('✅ Debug cargado. Usa window.debugPriority para probar funciones.');