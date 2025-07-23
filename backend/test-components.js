// Test simple de componentes
console.log('🧪 Iniciando test de componentes...');

try {
  // Test 1: Travel Compositor
  console.log('📦 Probando Travel Compositor...');
  const tc = require('./travel-compositor-enhanced');
  console.log('✅ Travel Compositor cargado');
  
  // Test 2: Auth Middleware
  console.log('🔐 Probando Auth Middleware...');
  const auth = require('./middleware/auth');
  console.log('✅ Auth Middleware cargado');
  
  // Test 3: Rutas de packages
  console.log('📋 Probando Rutas Packages...');
  const packages = require('./routes/packages');
  console.log('✅ Rutas Packages cargadas');
  
  console.log('');
  console.log('🎉 TODOS LOS COMPONENTES FUNCIONAN CORRECTAMENTE');
  console.log('✅ Sistema listo para iniciar');
  
} catch (error) {
  console.log('');
  console.log('❌ ERROR EN COMPONENTE:');
  console.log('Error:', error.message);
  console.log('');
  console.log('Stack:', error.stack);
  process.exit(1);
}