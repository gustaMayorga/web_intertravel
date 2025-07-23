// ===============================================
// DIAGNÓSTICO Y REPARACIÓN DE CONECTIVIDAD ADMIN
// InterTravel - Agente de Unificación
// ===============================================

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 ===============================================');
console.log('🔍 DIAGNÓSTICO DE CONECTIVIDAD ADMIN INTERTRAVEL');
console.log('🔍 ===============================================\n');

// Configuración
const BACKEND_URL = 'http://localhost:3002';
const FRONTEND_URL = 'http://localhost:3005';
const PROJECT_PATH = process.cwd();

// Variables de estado
let backendRunning = false;
let frontendRunning = false;
let adminApiWorking = false;

// ===============================================
// FASE 1: VERIFICAR SERVICIOS
// ===============================================

async function checkService(url, name) {
  return new Promise((resolve) => {
    const request = http.get(url, (res) => {
      console.log(`✅ ${name}: FUNCIONANDO (${res.statusCode})`);
      resolve(true);
    });
    
    request.on('error', (error) => {
      console.log(`❌ ${name}: NO RESPONDE (${error.code})`);
      resolve(false);
    });
    
    request.setTimeout(3000, () => {
      console.log(`⏱️  ${name}: TIMEOUT (no responde en 3s)`);
      request.destroy();
      resolve(false);
    });
  });
}

async function phase1_checkServices() {
  console.log('🔍 FASE 1: Verificando servicios activos...\n');
  
  // Verificar backend
  console.log('🔍 Verificando backend...');
  backendRunning = await checkService(`${BACKEND_URL}/api/health`, 'Backend (3002)');
  
  // Verificar frontend
  console.log('🔍 Verificando frontend...');
  frontendRunning = await checkService(`${FRONTEND_URL}`, 'Frontend (3005)');
  
  console.log('\n📊 RESULTADO FASE 1:');
  console.log(`   Backend (3002): ${backendRunning ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  console.log(`   Frontend (3005): ${frontendRunning ? '✅ ACTIVO' : '❌ INACTIVO'}\n`);
}

// ===============================================
// FASE 2: VERIFICAR APIS ADMIN
// ===============================================

async function checkAdminApi(endpoint) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}/api/admin/${endpoint}`;
    console.log(`🔍 Testing: ${url}`);
    
    const request = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`   ✅ ${endpoint}: OK (${res.statusCode})`);
          resolve(true);
        } catch (error) {
          console.log(`   ⚠️  ${endpoint}: Responde pero datos inválidos`);
          resolve(false);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log(`   ❌ ${endpoint}: ERROR (${error.code})`);
      resolve(false);
    });
    
    request.setTimeout(3000, () => {
      console.log(`   ⏱️  ${endpoint}: TIMEOUT`);
      request.destroy();
      resolve(false);
    });
  });
}

async function phase2_checkAdminAPIs() {
  console.log('🔍 FASE 2: Verificando APIs Admin...\n');
  
  if (!backendRunning) {
    console.log('⚠️  Backend no está activo, saltando verificación de APIs\n');
    return;
  }
  
  const endpoints = [
    'stats',     // Dashboard stats
    'users',     // Users management
    'packages',  // Packages management
    'bookings',  // Bookings management
    'settings'   // Settings management
  ];
  
  console.log('🔍 Testing endpoints admin...');
  let workingApis = 0;
  
  for (const endpoint of endpoints) {
    const working = await checkAdminApi(endpoint);
    if (working) workingApis++;
  }
  
  adminApiWorking = workingApis > 0;
  
  console.log('\n📊 RESULTADO FASE 2:');
  console.log(`   APIs funcionando: ${workingApis}/${endpoints.length}`);
  console.log(`   Estado general: ${adminApiWorking ? '✅ PARCIAL/COMPLETO' : '❌ NO FUNCIONAN'}\n`);
}

// ===============================================
// FASE 4: DIAGNÓSTICO Y RECOMENDACIONES
// ===============================================

function phase4_diagnosis() {
  console.log('🔍 FASE 4: Diagnóstico y Plan de Acción...\n');
  
  console.log('📋 RESUMEN DEL ESTADO:');
  console.log(`   🖥️  Backend: ${backendRunning ? '✅ Funcionando' : '❌ No responde'}`);
  console.log(`   🌐 Frontend: ${frontendRunning ? '✅ Funcionando' : '❌ No responde'}`);
  console.log(`   🔌 APIs Admin: ${adminApiWorking ? '✅ Funcionando' : '❌ No funcionan'}`);
  console.log('');
  
  // Determinar problema y solución
  if (!backendRunning && !frontendRunning) {
    console.log('🔴 PROBLEMA CRÍTICO: Ningún servicio está ejecutándose');
    console.log('🚀 SOLUCIÓN INMEDIATA:');
    console.log('   1. cd backend && npm start');
    console.log('   2. cd frontend && npm run dev');
    console.log('   3. Ejecutar: INICIAR-SISTEMA-COMPLETO.bat');
  } 
  else if (!backendRunning) {
    console.log('🔴 PROBLEMA: Backend no está ejecutándose');
    console.log('🚀 SOLUCIÓN INMEDIATA:');
    console.log('   1. cd backend');
    console.log('   2. npm install (si es necesario)');
    console.log('   3. npm start');
    console.log('   4. Verificar puerto 3002 no esté ocupado');
  }
  else if (!frontendRunning) {
    console.log('🔴 PROBLEMA: Frontend no está ejecutándose');
    console.log('🚀 SOLUCIÓN INMEDIATA:');
    console.log('   1. cd frontend');
    console.log('   2. npm install (si es necesario)');
    console.log('   3. npm run dev');
  }
  else if (!adminApiWorking) {
    console.log('🟡 PROBLEMA: Servicios activos pero APIs admin no responden');
    console.log('🚀 SOLUCIÓN INMEDIATA:');
    console.log('   1. Verificar autenticación en backend');
    console.log('   2. Revisar middleware de auth');
    console.log('   3. Verificar rutas admin configuradas');
    console.log('   4. Revisar logs del backend');
  }
  else {
    console.log('🟢 ESTADO: Servicios funcionando, verificando integración...');
    console.log('🚀 PRÓXIMOS PASOS:');
    console.log('   1. Verificar que frontend use datos reales');
    console.log('   2. Testing de funcionalidades CRUD');
    console.log('   3. Verificar autenticación de admin');
  }
  
  console.log('\n🔧 COMANDOS ÚTILES:');
  console.log('   • Health check: curl http://localhost:3002/api/health');
  console.log('   • Admin test: curl http://localhost:3002/api/admin/stats');
  console.log('   • Verificar procesos: netstat -an | find "3002"');
  console.log('');
}

// ===============================================
// EJECUTAR DIAGNÓSTICO COMPLETO
// ===============================================

async function runFullDiagnosis() {
  try {
    await phase1_checkServices();
    await phase2_checkAdminAPIs();
    phase4_diagnosis();
    
    console.log('🎯 ===============================================');
    console.log('🎯 DIAGNÓSTICO COMPLETADO');
    console.log('🎯 Ejecutar las acciones recomendadas arriba');
    console.log('🎯 ===============================================');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
runFullDiagnosis();
