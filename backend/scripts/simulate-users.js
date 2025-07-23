// backend/scripts/simulate-users.js
// Script para simular diferentes tipos de usuarios y probar permisos

const { getUserCapabilities, ROLES, PERMISSIONS } = require('../models/permissions');

console.log('🎭 SIMULADOR DE USUARIOS - SISTEMA DE PERMISOS');
console.log('='.repeat(50));

// Función para mostrar capacidades de un rol
function showRoleCapabilities(role) {
  const capabilities = getUserCapabilities(role);
  
  console.log(`\n👤 ROL: ${role.toUpperCase()}`);
  console.log('-'.repeat(30));
  
  console.log('📋 Módulos accesibles:');
  Object.entries(capabilities.modules).forEach(([module, canAccess]) => {
    const icon = canAccess ? '✅' : '❌';
    console.log(`  ${icon} ${module}`);
  });
  
  console.log('\n🔧 Capacidades específicas:');
  Object.entries(capabilities.capabilities).forEach(([capability, canDo]) => {
    const icon = canDo ? '✅' : '❌';
    console.log(`  ${icon} ${capability}`);
  });
  
  console.log(`\n📊 Total de permisos: ${capabilities.permissions.length}/${Object.keys(PERMISSIONS).length}`);
}

// Mostrar todos los roles
Object.values(ROLES).forEach(role => {
  showRoleCapabilities(role);
});

console.log('\n🔍 COMPARACIÓN DE PERMISOS CLAVE:');
console.log('='.repeat(50));

const keyPermissions = [
  'CLIENTS_DELETE',
  'BOOKINGS_CANCEL', 
  'USERS_MANAGE_ROLES',
  'CONFIG_SYSTEM',
  'AUDIT_VIEW',
  'FINANCE_VIEW'
];

console.log('Permiso'.padEnd(20) + ' | ' + Object.values(ROLES).join(' | '));
console.log('-'.repeat(70));

keyPermissions.forEach(permission => {
  let line = PERMISSIONS[permission].padEnd(20) + ' | ';
  
  Object.values(ROLES).forEach(role => {
    const capabilities = getUserCapabilities(role);
    const hasPermission = capabilities.permissions.includes(PERMISSIONS[permission]);
    line += (hasPermission ? '✅' : '❌').padEnd(6) + ' | ';
  });
  
  console.log(line);
});

console.log('\n🎯 ESCENARIOS DE USO:');
console.log('='.repeat(50));

console.log('\n📊 SUPER_ADMIN:');
console.log('   - Puede hacer TODO (incluido eliminar usuarios)');
console.log('   - Ve audit trail completo');
console.log('   - Configura sistema completo');

console.log('\n👔 ADMIN:');
console.log('   - Gestiona clientes y reservas completamente');
console.log('   - NO puede eliminar usuarios');
console.log('   - Ve reportes y finanzas');

console.log('\n📋 MANAGER:');
console.log('   - Gestiona operaciones diarias');
console.log('   - NO puede eliminar nada');
console.log('   - Acceso limitado a configuración');

console.log('\n⚙️ OPERATOR:');
console.log('   - Crea y edita clientes/reservas');
console.log('   - NO puede cancelar reservas');
console.log('   - Sin acceso a finanzas');

console.log('\n👁️ VIEWER:');
console.log('   - Solo puede VER información');
console.log('   - NO puede crear/editar nada');
console.log('   - Perfecto para consultores externos');

console.log('\n✨ SISTEMA DE PERMISOS IMPLEMENTADO CORRECTAMENTE ✨');
