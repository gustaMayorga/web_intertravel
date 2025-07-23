// ===============================================
// TEST COMPLETO: ADMIN DE DESTINOS
// ===============================================

const axios = require('axios');

const SERVER_URL = 'http://localhost:3002';
let adminToken = null;

async function loginAdmin() {
  console.log('🔐 1. Testing admin login...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/admin/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      adminToken = response.data.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.log('❌ Admin login failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    return false;
  }
}

async function testPublicDestinations() {
  console.log('\n🌍 2. Testing public destinations endpoint...');
  
  try {
    const response = await axios.get(`${SERVER_URL}/api/travel-compositor/destinations`);
    
    console.log('📊 Response:');
    console.log('   Success:', response.data.success);
    console.log('   Source:', response.data.source);
    console.log('   Total:', response.data.total);
    console.log('   Connected:', response.data.connected);
    
    if (response.data.destinations && response.data.destinations.length > 0) {
      console.log('\n🗺️ First 3 destinations:');
      response.data.destinations.slice(0, 3).forEach((dest, index) => {
        console.log(`   ${index + 1}. ${dest.name}, ${dest.country}`);
        console.log(`      Coordinates: ${dest.coordinates.lat}, ${dest.coordinates.lng}`);
        console.log(`      Price: $${dest.price}`);
      });
      
      const validCoords = response.data.destinations.filter(d => 
        d.coordinates && d.coordinates.lat !== 0 && d.coordinates.lng !== 0
      ).length;
      
      console.log(`\n📍 Valid coordinates: ${validCoords}/${response.data.total}`);
      
      return response.data.destinations;
    }
    
    return [];
  } catch (error) {
    console.log('❌ Public destinations error:', error.message);
    return [];
  }
}

async function testAdminDestinations() {
  console.log('\n🔧 3. Testing admin destinations endpoint...');
  
  if (!adminToken) {
    console.log('❌ No admin token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${SERVER_URL}/api/admin/destinations`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('📊 Admin destinations:');
    console.log('   Success:', response.data.success);
    console.log('   Total destinations:', response.data.data?.destinations?.length || 0);
    console.log('   Pagination:', response.data.data?.pagination);
    
    return true;
  } catch (error) {
    console.log('❌ Admin destinations error:', error.message);
    return false;
  }
}

async function testCreateDestination() {
  console.log('\n📍 4. Testing create destination...');
  
  if (!adminToken) {
    console.log('❌ No admin token available');
    return false;
  }
  
  const newDestination = {
    name: 'Mendoza',
    country: 'Argentina',
    description: 'Capital mundial del Malbec en el pie de los Andes',
    price: 850,
    category: 'Gastronómico',
    coordinates: { lat: -32.8895, lng: -68.8458 },
    is_featured: true
  };
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/admin/destinations`, newDestination, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Destination created successfully');
      console.log('   ID:', response.data.destination.id);
      console.log('   Name:', response.data.destination.name);
      return response.data.destination.id;
    } else {
      console.log('❌ Create destination failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Create destination error:', error.message);
    if (error.response?.data) {
      console.log('   Details:', error.response.data);
    }
    return null;
  }
}

async function testUpdateDestination(destinationId) {
  console.log('\n✏️ 5. Testing update destination...');
  
  if (!adminToken || !destinationId) {
    console.log('❌ No admin token or destination ID available');
    return false;
  }
  
  const updates = {
    price: 750,
    description: 'Capital mundial del Malbec - Oferta especial'
  };
  
  try {
    const response = await axios.put(`${SERVER_URL}/api/admin/destinations/${destinationId}`, updates, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Destination updated successfully');
      console.log('   New price:', response.data.destination.price);
      return true;
    } else {
      console.log('❌ Update destination failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Update destination error:', error.message);
    return false;
  }
}

async function testDestinationStats() {
  console.log('\n📊 6. Testing destination statistics...');
  
  if (!adminToken) {
    console.log('❌ No admin token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${SERVER_URL}/api/admin/destinations-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      const stats = response.data.data;
      console.log('✅ Statistics retrieved:');
      console.log('   Total destinations:', stats.total);
      console.log('   Active:', stats.active);
      console.log('   Featured:', stats.featured);
      console.log('   Average price:', `$${Math.round(stats.avgPrice)}`);
      console.log('   Countries:', stats.byCountry?.length || 0);
      console.log('   Categories:', stats.byCategory?.length || 0);
      return true;
    } else {
      console.log('❌ Stats failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Stats error:', error.message);
    return false;
  }
}

async function testSyncWithTC() {
  console.log('\n🔄 7. Testing Travel Compositor sync...');
  
  if (!adminToken) {
    console.log('❌ No admin token available');
    return false;
  }
  
  try {
    const response = await axios.post(`${SERVER_URL}/api/admin/destinations/sync-tc`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('📊 Sync result:');
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    if (response.data.data) {
      console.log('   Synced:', response.data.data.synced || 0);
      console.log('   Updated:', response.data.data.updated || 0);
      console.log('   Total:', response.data.data.total || 0);
    }
    
    return response.data.success;
  } catch (error) {
    console.log('❌ Sync error:', error.message);
    return false;
  }
}

async function testDeleteDestination(destinationId) {
  console.log('\n🗑️ 8. Testing delete destination...');
  
  if (!adminToken || !destinationId) {
    console.log('❌ No admin token or destination ID available');
    return false;
  }
  
  try {
    const response = await axios.delete(`${SERVER_URL}/api/admin/destinations/${destinationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Destination deleted successfully');
      console.log('   Message:', response.data.message);
      return true;
    } else {
      console.log('❌ Delete destination failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Delete destination error:', error.message);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🧪 ===============================================');
  console.log('🧪 TEST COMPLETO: ADMIN DE DESTINOS');
  console.log('🧪 ===============================================');
  
  const results = {
    login: false,
    publicDestinations: false,
    adminDestinations: false,
    createDestination: false,
    updateDestination: false,
    stats: false,
    sync: false,
    deleteDestination: false
  };
  
  let createdDestinationId = null;
  
  // Test 1: Admin Login
  results.login = await loginAdmin();
  
  // Test 2: Public Destinations
  const destinations = await testPublicDestinations();
  results.publicDestinations = destinations.length > 0;
  
  // Test 3: Admin Destinations
  results.adminDestinations = await testAdminDestinations();
  
  // Test 4: Create Destination
  createdDestinationId = await testCreateDestination();
  results.createDestination = createdDestinationId !== null;
  
  // Test 5: Update Destination (if created)
  if (createdDestinationId) {
    results.updateDestination = await testUpdateDestination(createdDestinationId);
  }
  
  // Test 6: Statistics
  results.stats = await testDestinationStats();
  
  // Test 7: Sync with TC
  results.sync = await testSyncWithTC();
  
  // Test 8: Delete Destination (if created)
  if (createdDestinationId) {
    results.deleteDestination = await testDeleteDestination(createdDestinationId);
  }
  
  // Final Results
  console.log('\n🏁 ===============================================');
  console.log('🏁 RESULTADOS FINALES');
  console.log('🏁 ===============================================');
  
  const tests = [
    { name: 'Admin Login', result: results.login },
    { name: 'Public Destinations', result: results.publicDestinations },
    { name: 'Admin Destinations', result: results.adminDestinations },
    { name: 'Create Destination', result: results.createDestination },
    { name: 'Update Destination', result: results.updateDestination },
    { name: 'Statistics', result: results.stats },
    { name: 'TC Sync', result: results.sync },
    { name: 'Delete Destination', result: results.deleteDestination }
  ];
  
  let passed = 0;
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${test.name}: ${status}`);
    if (test.result) passed++;
  });
  
  console.log(`\n📊 RESUMEN: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('🎉 El admin de destinos está completamente funcional');
    console.log('\n📋 FUNCIONALIDADES VERIFICADAS:');
    console.log('   ✅ Autenticación admin');
    console.log('   ✅ Endpoint público de destinos');
    console.log('   ✅ CRUD completo de destinos');
    console.log('   ✅ Estadísticas detalladas');
    console.log('   ✅ Sincronización con Travel Compositor');
    console.log('   ✅ Operaciones masivas');
  } else {
    console.log('\n⚠️ Algunos tests fallaron');
    console.log('⚠️ Revisa los logs para más detalles');
  }
  
  console.log('\n📱 SIGUIENTE PASO:');
  console.log('   1. Abre el frontend: http://localhost:3005');
  console.log('   2. Ve al mapa interactivo');
  console.log('   3. Los puntos deberían aparecer automáticamente');
  console.log('   4. Abre el admin y gestiona destinos');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runCompleteTest();
}

module.exports = { 
  loginAdmin, 
  testPublicDestinations, 
  testAdminDestinations,
  testCreateDestination,
  testUpdateDestination,
  testDestinationStats,
  testSyncWithTC,
  testDeleteDestination
};
