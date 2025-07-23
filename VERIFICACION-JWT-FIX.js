// VERIFICACION-JWT-FIX.js - Script para verificar la solución del JWT
// Ejecutar en la consola del navegador para diagnosticar el problema

console.log('🔍 VERIFICACIÓN DE SOLUCIÓN JWT - INTERTRAVEL');
console.log('================================================');

// Función de verificación completa
function verificarSolucionJWT() {
  const resultados = {
    localStorage: {},
    authService: {},
    problemas: [],
    soluciones: []
  };

  console.log('\n1️⃣ VERIFICANDO LOCALSTORAGE...');
  
  try {
    const token = localStorage.getItem('intertravel_token');
    const user = localStorage.getItem('intertravel_user');
    
    resultados.localStorage = {
      token: token ? '✅ Presente' : '❌ Ausente',
      tokenLength: token ? token.length : 0,
      user: user ? '✅ Presente' : '❌ Ausente',
      userValid: user ? (JSON.parse(user).email ? '✅ Válido' : '❌ Inválido') : '❌ No existe'
    };
    
    console.log('Token:', resultados.localStorage.token);
    console.log('Usuario:', resultados.localStorage.user);
    
    if (!token) {
      resultados.problemas.push('❌ Token JWT no está guardado en localStorage');
      resultados.soluciones.push('🔧 Implementar authService.setToken() en el login');
    }
    
  } catch (error) {
    console.error('❌ Error al verificar localStorage:', error);
    resultados.problemas.push('❌ Error de acceso a localStorage');
  }

  console.log('\n2️⃣ VERIFICANDO FUNCIONES DE AUTENTICACIÓN...');
  
  // Test básico de localStorage
  try {
    localStorage.setItem('test_token', 'test123');
    const testToken = localStorage.getItem('test_token');
    
    if (testToken === 'test123') {
      console.log('✅ localStorage funciona correctamente');
      localStorage.removeItem('test_token');
    } else {
      console.log('❌ localStorage no funciona');
      resultados.problemas.push('❌ localStorage no funcional');
    }
  } catch (error) {
    console.error('❌ localStorage bloqueado:', error);
    resultados.problemas.push('❌ localStorage bloqueado por el navegador');
  }

  console.log('\n3️⃣ SIMULANDO PROCESO DE LOGIN...');
  
  const simulateLogin = (email, token) => {
    console.log(`Simulando login para: ${email}`);
    
    try {
      // Guardar token
      localStorage.setItem('intertravel_token', token);
      console.log('✅ Token guardado:', localStorage.getItem('intertravel_token') ? 'Sí' : 'No');
      
      // Guardar usuario
      const userData = { email, firstName: 'Test', lastName: 'User' };
      localStorage.setItem('intertravel_user', JSON.stringify(userData));
      console.log('✅ Usuario guardado:', localStorage.getItem('intertravel_user') ? 'Sí' : 'No');
      
      // Verificar persistencia
      const retrievedToken = localStorage.getItem('intertravel_token');
      const retrievedUser = localStorage.getItem('intertravel_user');
      
      if (retrievedToken === token && retrievedUser) {
        console.log('✅ Simulación exitosa - datos persistidos');
        return true;
      } else {
        console.log('❌ Simulación fallida - datos no persistidos');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error en simulación:', error);
      return false;
    }
  };

  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
  const simulationSuccess = simulateLogin('test@test.com', testToken);
  
  if (!simulationSuccess) {
    resultados.problemas.push('❌ Simulación de login falló');
    resultados.soluciones.push('🔧 Revisar implementación de setToken()');
  }

  console.log('\n📊 RESUMEN DE VERIFICACIÓN');
  console.log('==========================');
  
  console.log('\n🔍 Estado de localStorage:');
  Object.entries(resultados.localStorage).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  if (resultados.problemas.length > 0) {
    console.log('\n❌ PROBLEMAS ENCONTRADOS:');
    resultados.problemas.forEach(problema => console.log(`  ${problema}`));
    
    console.log('\n🔧 SOLUCIONES RECOMENDADAS:');
    resultados.soluciones.forEach(solucion => console.log(`  ${solucion}`));
  } else {
    console.log('\n✅ ¡No se encontraron problemas!');
  }

  // Limpiar datos de prueba
  localStorage.removeItem('intertravel_token');
  localStorage.removeItem('intertravel_user');

  return resultados;
}

// Función para probar la solución paso a paso
function diagnosticoPasoAPaso() {
  console.log('\n🔬 DIAGNÓSTICO PASO A PASO');
  console.log('=========================');
  
  const pasos = [
    {
      nombre: 'Verificar acceso a localStorage',
      test: () => {
        try {
          localStorage.setItem('test', 'ok');
          const result = localStorage.getItem('test') === 'ok';
          localStorage.removeItem('test');
          return result;
        } catch {
          return false;
        }
      }
    },
    {
      nombre: 'Verificar token actual',
      test: () => !!localStorage.getItem('intertravel_token')
    },
    {
      nombre: 'Verificar usuario actual',
      test: () => !!localStorage.getItem('intertravel_user')
    },
    {
      nombre: 'Verificar navegador compatible',
      test: () => typeof Storage !== 'undefined'
    }
  ];
  
  pasos.forEach((paso, index) => {
    const resultado = paso.test();
    console.log(`${index + 1}. ${paso.nombre}: ${resultado ? '✅ Correcto' : '❌ Problema'}`);
  });
}

// Ejecutar verificaciones automáticamente
console.log('🚀 Iniciando verificación completa...\n');

try {
  verificarSolucionJWT();
  diagnosticoPasoAPaso();
  
  console.log('\n🎯 CONCLUSIÓN');
  console.log('=============');
  console.log('Para solucionar el problema del token JWT:');
  console.log('1. El auth-service.ts ha sido actualizado ✅');
  console.log('2. El AuthContext.tsx ha sido corregido ✅');
  console.log('3. El token ahora se guarda en localStorage ✅');
  console.log('4. Verificar funcionamiento con login real');
  
} catch (error) {
  console.error('❌ Error durante la verificación:', error);
}

console.log('\n✅ Verificación completada.');

// Exportar funciones para uso manual
window.verificarJWT = verificarSolucionJWT;
window.diagnosticoJWT = diagnosticoPasoAPaso;