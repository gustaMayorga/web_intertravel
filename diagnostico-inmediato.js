// ===============================================
// DIAGNÓSTICO INMEDIATO DEL SISTEMA INTERTRAVEL
// ===============================================

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO DIAGNÓSTICO INMEDIATO DEL SISTEMA...\n');

// Verificar estructura
console.log('📋 1. VERIFICANDO ESTRUCTURA DE ARCHIVOS:');
const projectPath = process.cwd();
console.log(`📂 Directorio actual: ${projectPath}`);

const requiredDirs = [
  'frontend/src/app/admin',
  'frontend/src/app/api/admin', 
  'backend/routes',
  'backend/server.js'
];

requiredDirs.forEach(dir => {
  const fullPath = path.join(projectPath, dir);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${dir}`);
});

console.log('\n📦 2. VERIFICANDO APIS DEL FRONTEND:');
try {
  const adminApiPath = path.join(projectPath, 'frontend/src/app/api/admin');
  const apiDirs = fs.readdirSync(adminApiPath);
  console.log(`   📁 Encontrados ${apiDirs.length} módulos API:`);
  apiDirs.forEach(dir => {
    const routePath = path.join(adminApiPath, dir, 'route.ts');
    const hasRoute = fs.existsSync(routePath);
    console.log(`      ${hasRoute ? '✅' : '⚠️ '} ${dir} ${hasRoute ? '(route.ts)' : '(sin route.ts)'}`);
  });
} catch (error) {
  console.log(`   ❌ Error leyendo APIs: ${error.message}`);
}

console.log('\n🛤️  3. VERIFICANDO RUTAS DEL BACKEND:');
try {
  const backendRoutesPath = path.join(projectPath, 'backend/routes');
  const routeFiles = fs.readdirSync(backendRoutesPath).filter(f => f.endsWith('.js'));
  console.log(`   📁 Encontrados ${routeFiles.length} archivos de rutas:`);
  routeFiles.forEach(file => {
    console.log(`      📄 ${file}`);
  });
} catch (error) {
  console.log(`   ❌ Error leyendo rutas: ${error.message}`);
}

console.log('\n🔧 4. VERIFICANDO CONFIGURACIÓN:');
const envFiles = [
  'frontend/.env.local',
  'backend/.env'
];

envFiles.forEach(envFile => {
  const envPath = path.join(projectPath, envFile);
  const exists = fs.existsSync(envPath);
  console.log(`   ${exists ? '✅' : '❌'} ${envFile}`);
});

console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
console.log('========================================');
