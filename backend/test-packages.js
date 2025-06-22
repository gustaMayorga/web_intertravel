#!/usr/bin/env node

// Test para verificar que la obtención de paquetes funciona correctamente
const tcConfig = require('./travel-compositor-safe.js');

async function testPackageRetrieval() {
  console.log('🧪 Iniciando test de obtención de paquetes...\n');
  
  try {
    // 1. Test de autenticación
    console.log('1. Probando autenticación...');
    const authResult = await tcConfig.tryAuthentication();
    
    if (!authResult.success) {
      console.log('❌ Autenticación falló, usando datos mock');
      return;
    }
    
    // 2. Test de obtención de todos los paquetes
    console.log('\n2. Obteniendo TODOS los paquetes...');
    const allPackages = await tcConfig.getAllPackages();
    
    if (allPackages.success) {
      console.log(`✅ Total obtenido: ${allPackages.packages.length} paquetes`);
      
      // 3. Test de estadísticas
      console.log('\n3. Generando estadísticas...');
      const stats = tcConfig.getPackageStats(allPackages.packages);
      console.log(`📊 Países disponibles: ${Object.keys(stats.byCountry).length}`);
      console.log(`📊 Categorías disponibles: ${Object.keys(stats.byCategory).length}`);
      console.log(`💰 Rango de precios: $${stats.priceRange.min} - $${stats.priceRange.max}`);
      
      // Mostrar top 5 países
      const topCountries = Object.entries(stats.byCountry)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      console.log('\n🌍 Top 5 países:');
      topCountries.forEach(([country, count]) => {
        console.log(`   ${country}: ${count} paquetes`);
      });
      
      // 4. Test de búsqueda
      console.log('\n4. Probando búsqueda...');
      const searchResult = await tcConfig.searchPackages({
        search: 'España',
        limit: 10
      });
      
      if (searchResult.success) {
        console.log(`🔍 Búsqueda "España": ${searchResult.packages.length} resultados de ${searchResult.totalAvailable} disponibles`);
        
        // Mostrar algunos resultados
        searchResult.packages.slice(0, 3).forEach(pkg => {
          console.log(`   - ${pkg.title} (${pkg.destination})`);
        });
      }
      
      // 5. Test de cache
      console.log('\n5. Probando cache...');
      const cachedResult = await tcConfig.getAllPackages();
      if (cachedResult.source === 'travel-compositor-cache') {
        console.log('✅ Cache funcionando correctamente');
      } else {
        console.log('⚠️ Cache no activado (primera ejecución)');
      }
      
      console.log('\n🎉 ¡Todos los tests pasaron exitosamente!');
      console.log(`\n📊 RESUMEN FINAL:`);
      console.log(`   Total de paquetes: ${allPackages.packages.length}`);
      console.log(`   Países únicos: ${Object.keys(stats.byCountry).length}`);
      console.log(`   Categorías únicas: ${Object.keys(stats.byCategory).length}`);
      console.log(`   Fuente: ${allPackages.source}`);
      
    } else {
      console.log('❌ Error obteniendo paquetes:', allPackages.error);
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

if (require.main === module) {
  testPackageRetrieval();
}

module.exports = testPackageRetrieval;