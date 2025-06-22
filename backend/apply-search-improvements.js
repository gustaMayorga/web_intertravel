#!/usr/bin/env node

// ===============================================
// APLICAR MEJORAS DE BÚSQUEDA Y PAQUETES
// ===============================================

const fs = require('fs');
const path = require('path');

console.log('🔍 Aplicando mejoras de búsqueda y obtención de paquetes...\n');

// ======================================
// 1. BACKUP DEL ARCHIVO ACTUAL
// ======================================

const serverPath = path.join(__dirname, 'server.js');
const tcSafePath = path.join(__dirname, 'travel-compositor-safe.js');
const tcEnhancedPath = path.join(__dirname, 'travel-compositor-enhanced.js');

// Crear backup
const backupPath = path.join(__dirname, `travel-compositor-safe.backup.${Date.now()}.js`);
if (fs.existsSync(tcSafePath)) {
  fs.copyFileSync(tcSafePath, backupPath);
  console.log(`✅ Backup creado: ${path.basename(backupPath)}`);
}

// ======================================
// 2. REEMPLAZAR ARCHIVO DE TC
// ======================================

if (fs.existsSync(tcEnhancedPath)) {
  fs.copyFileSync(tcEnhancedPath, tcSafePath);
  console.log('✅ Travel Compositor mejorado aplicado');
} else {
  console.error('❌ No se encontró travel-compositor-enhanced.js');
  process.exit(1);
}

console.log('\n🎉 MEJORAS APLICADAS EXITOSAMENTE!\n');

console.log('📋 CAMBIOS REALIZADOS:');
console.log('✅ Travel Compositor mejorado para obtener TODOS los paquetes');
console.log('✅ Sistema de cache para evitar llamadas excesivas');
console.log('✅ Búsqueda mejorada con filtros en todos los 840 paquetes');
console.log('✅ Paginación inteligente (hasta 50 páginas × 100 = 5000 paquetes)');
console.log('✅ Eliminación de duplicados automática');

console.log('\n🚀 PRÓXIMOS PASOS:');
console.log('1. Reiniciar servidor: npm run dev');
console.log('2. Probar endpoints:');
console.log('   - GET /api/packages (ahora muestra más paquetes)');
console.log('   - GET /api/packages/search?search=España');
console.log('3. Ejecutar test: node test-packages.js (después de crear)');

console.log('\n📊 RESULTADOS ESPERADOS:');
console.log('🎯 Hasta 840 paquetes disponibles (en lugar de 40)');
console.log('🔍 Búsquedas que funcionan en TODOS los paquetes');
console.log('📄 Paginación automática para cargar más resultados');
console.log('⚡ Cache de 5 minutos para mejor performance');

console.log('\n⚠️ NOTA: El primer request puede tardar más porque obtiene todos los paquetes.');
console.log('Los siguientes requests usarán el cache y serán más rápidos.');

process.exit(0);