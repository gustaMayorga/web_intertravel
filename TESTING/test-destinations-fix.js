// ===============================================
// SCRIPT DE PRUEBA: ENDPOINT DE DESTINOS CORREGIDO
// ===============================================

const axios = require('axios');

const SERVER_URL = 'http://localhost:3002';

async function testDestinationsEndpoint() {
  console.log('🧪 ===============================================');
  console.log('🧪 TESTING: ENDPOINT DE DESTINOS CORREGIDO');
  console.log('🧪 ===============================================');
  
  try {
    console.log('\n1️⃣ Testing la nueva ruta de destinos...');
    
    const response = await axios.get(`${SERVER_URL}/api/travel-compositor/destinations`, {
      timeout: 10000
    });
    
    console.log('📊 RESPUESTA RECIBIDA:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Source:', response.data.source);
    console.log('   Connected:', response.data.connected);
    console.log('   Total destinos:', response.data.total);
    console.log('   Error:', response.data.error || 'Ninguno');
    
    if (response.data.destinations && response.data.destinations.length > 0) {
      console.log('\n🗺️ PRIMEROS 3 DESTINOS:');
      response.data.destinations.slice(0, 3).forEach((dest, index) => {
        console.log(`   ${index + 1}. ${dest.name}, ${dest.country}`);
        console.log(`      Coordenadas: ${dest.coordinates.lat}, ${dest.coordinates.lng}`);
        console.log(`      Precio desde: $${dest.price}`);
        console.log(`      Paquetes: ${dest.packages || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log('\n✅ DESTINOS OBTENIDOS EXITOSAMENTE');
    
    // Verificar que tengan coordenadas válidas
    const destinationsWithCoords = response.data.destinations.filter(d => 
      d.coordinates && d.coordinates.lat !== 0 && d.coordinates.lng !== 0
    );
    
    console.log(`\n📍 COORDENADAS VÁLIDAS: ${destinationsWithCoords.length}/${response.data.total}`);
    
    if (destinationsWithCoords.length === response.data.total) {
      console.log('✅ TODOS LOS DESTINOS TIENEN COORDENADAS VÁLIDAS');
    } else {
      console.log('⚠️ Algunos destinos no tienen coordenadas válidas');
    }
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR TESTING DESTINOS:');
    console.error('   Message:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    return false;
  }
}

async function testPackagesStillWork() {
  console.log('\n2️⃣ Verificando que los paquetes sigan funcionando...');
  
  try {
    const response = await axios.get(`${SERVER_URL}/api/packages/featured?limit=5`, {
      timeout: 10000
    });
    
    console.log('📦 PAQUETES:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Total:', response.data.total);
    console.log('   Source:', response.data._source);
    
    console.log('✅ PAQUETES SIGUEN FUNCIONANDO CORRECTAMENTE');
    return true;
    
  } catch (error) {
    console.error('❌ ERROR CON PAQUETES:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('\n🚀 INICIANDO PRUEBAS COMPLETAS...\n');
  
  const results = {
    destinations: await testDestinationsEndpoint(),
    packages: await testPackagesStillWork()
  };
  
  console.log('\n🏁 ===============================================');
  console.log('🏁 RESULTADOS FINALES:');
  console.log('🏁 ===============================================');
  console.log(`   Destinos: ${results.destinations ? '✅ FUNCIONANDO' : '❌ FALLÓ'}`);
  console.log(`   Paquetes: ${results.packages ? '✅ FUNCIONANDO' : '❌ FALLÓ'}`);
  
  if (results.destinations && results.packages) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('🎉 Los puntos del mapa ahora deberían aparecer correctamente');
  } else {
    console.log('\n❌ Algunas pruebas fallaron');
  }
  
  console.log('\n📋 SIGUIENTE PASO:');
  console.log('   1. Reinicia el servidor backend');
  console.log('   2. Abre el frontend y verifica el mapa');
  console.log('   3. Los puntos deberían aparecer automáticamente');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runFullTest();
}

module.exports = { testDestinationsEndpoint, testPackagesStillWork };
