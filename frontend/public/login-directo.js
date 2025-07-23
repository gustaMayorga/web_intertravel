console.log('🔐 SCRIPT DE LOGIN DIRECTO AL BACKEND');

async function loginDirectoBackend() {
  try {
    console.log('🔍 Probando login directo al backend...');
    
    const response = await fetch('http://localhost:3002/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('📥 Respuesta login:', data);
    
    if (data.success) {
      localStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('auth_user', JSON.stringify(data.user));
      
      console.log('✅ LOGIN EXITOSO');
      console.log('🎫 Token:', data.token);
      console.log('👤 Usuario:', data.user);
      
      // Probar inmediatamente las keywords
      console.log('🔍 Probando keywords con nuevo token...');
      
      const keywordsResponse = await fetch('http://localhost:3002/api/admin/priority-keywords', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const keywordsData = await keywordsResponse.json();
      console.log('📋 Keywords response:', keywordsData);
      
      if (keywordsData.success) {
        console.log('✅ KEYWORDS FUNCIONANDO CON PERSISTENCIA');
        alert('✅ Login exitoso y keywords funcionando con persistencia!');
        location.reload();
      } else {
        console.log('❌ Error en keywords:', keywordsData.error);
      }
    } else {
      console.log('❌ Login falló:', data.error);
      alert('❌ Login falló: ' + data.error);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error);
    alert('❌ Error de conexión. ¿Está el backend corriendo en puerto 3002?');
  }
}

// Ejecutar automáticamente
loginDirectoBackend();

// Agregar funciones globales para debugging
window.debugLogin = {
  login: loginDirectoBackend,
  checkToken: () => {
    console.log('Token:', localStorage.getItem('auth_token'));
    console.log('User:', sessionStorage.getItem('auth_user'));
  },
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    console.log('✅ Auth limpiado');
  }
};

console.log('🛠️ Funciones disponibles: window.debugLogin.login(), window.debugLogin.checkToken(), window.debugLogin.clearAuth()');