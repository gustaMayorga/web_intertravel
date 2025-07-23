// VERIFICACION PACKAGEDETAILSMODAL FIX
// Fecha: 14 Julio 2025
// Agente: Claude Assistant

const axios = require('axios');

async function verificarPackageDetailsFix() {
  console.log('=== VERIFICACION PACKAGEDETAILSMODAL FIX ===');
  console.log('Fecha:', new Date().toISOString());
  console.log('');

  const baseUrl = 'http://localhost:3002';
  let testResults = {
    healthCheck: false,
    packagesList: false,
    packageDetails: false,
    summary: 'PENDIENTE'
  };

  try {
    // 1. Verificar Health Check
    console.log('[1/3] Verificando Health Check...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`);
    if (healthResponse.status === 200) {
      testResults.healthCheck = true;
      console.log('✓ Health Check: OK');
    }

    // 2. Verificar lista de paquetes
    console.log('[2/3] Verificando lista de paquetes...');
    const packagesResponse = await axios.get(`${baseUrl}/api/packages`);
    if (packagesResponse.status === 200 && packagesResponse.data.data) {
      testResults.packagesList = true;
      console.log(`✓ Packages List: OK (${packagesResponse.data.data.length} paquetes)`);

      // 3. Verificar detalles de paquete (endpoint corregido)
      if (packagesResponse.data.data.length > 0) {
        const firstPackage = packagesResponse.data.data[0];
        console.log('[3/3] Verificando detalles de paquete...');
        console.log(`Probando con ID: ${firstPackage.id}`);
        
        const detailsResponse = await axios.get(`${baseUrl}/api/packages/${encodeURIComponent(firstPackage.id)}`);
        if (detailsResponse.status === 200 && detailsResponse.data.package) {
          testResults.packageDetails = true;
          console.log('✓ Package Details: OK');
          console.log(`  - Titulo: ${detailsResponse.data.package.title}`);
          console.log(`  - Destino: ${detailsResponse.data.package.destination}`);
          console.log(`  - Precio: ${detailsResponse.data.package.price?.amount} ${detailsResponse.data.package.price?.currency}`);
        }
      }
    }

    // Resumen
    const allPassed = testResults.healthCheck && testResults.packagesList && testResults.packageDetails;
    testResults.summary = allPassed ? 'EXITO' : 'FALLO';

    console.log('');
    console.log('=== RESUMEN ===');
    console.log(`Health Check: ${testResults.healthCheck ? 'PASS' : 'FAIL'}`);
    console.log(`Packages List: ${testResults.packagesList ? 'PASS' : 'FAIL'}`);
    console.log(`Package Details: ${testResults.packageDetails ? 'PASS' : 'FAIL'}`);
    console.log(`RESULTADO FINAL: ${testResults.summary}`);

    if (allPassed) {
      console.log('');
      console.log('✓ FIX PACKAGEDETAILSMODAL: VERIFICADO CORRECTAMENTE');
      console.log('✓ Próximo paso: Continuar con Admin ABM Agencies');
    } else {
      console.log('');
      console.log('✗ PROBLEMAS DETECTADOS - Revisar logs del servidor');
    }

    return testResults;

  } catch (error) {
    console.log('');
    console.log('✗ ERROR EN VERIFICACION:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('  - Servidor no está ejecutándose en puerto 3002');
      console.log('  - Ejecutar: npm start en directorio backend');
    }
    testResults.summary = 'ERROR';
    return testResults;
  }
}

// Ejecutar verificación
if (require.main === module) {
  verificarPackageDetailsFix();
}

module.exports = verificarPackageDetailsFix;
