#!/usr/bin/env node

// ===============================================
// TRAVEL COMPOSITOR INSPECTOR - MINI SISTEMA MANUAL
// ===============================================

const readline = require('readline');

// Importar los diferentes módulos TC
const tcSafe = require('./travel-compositor-safe.js');
const tcSimple = require('./travel-compositor-simple-fixed.js');

// Logger simple
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [${level}] ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

// Inspector interactivo
class TCInspector {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🔍 ===============================================');
    console.log('🔍 TRAVEL COMPOSITOR INSPECTOR - INTERACTIVO');
    console.log('🔍 ===============================================');
    console.log('');
    
    while (true) {
      await this.showMenu();
    }
  }

  async showMenu() {
    console.log('\n📋 ¿Qué quieres inspeccionar?');
    console.log('');
    console.log('1. 🔑 Probar autenticación TC');
    console.log('2. 📦 Obtener 5 paquetes (safe)');
    console.log('3. 🌊 Obtener TODOS los paquetes (safe)');
    console.log('4. 🔓 Probar sin autenticación (simple)');
    console.log('5. 📊 Analizar respuesta cruda');
    console.log('6. 🔄 Comparar módulos TC');
    console.log('7. 🧪 Test completo');
    console.log('8. 🛠️ Limpiar cache');
    console.log('0. ❌ Salir');
    console.log('');

    const choice = await this.question('Elige una opción (0-8): ');
    
    switch (choice) {
      case '1':
        await this.testAuthentication();
        break;
      case '2':
        await this.getFewPackages();
        break;
      case '3':
        await this.getAllPackages();
        break;
      case '4':
        await this.testNoAuth();
        break;
      case '5':
        await this.analyzeRawResponse();
        break;
      case '6':
        await this.compareModules();
        break;
      case '7':
        await this.fullTest();
        break;
      case '8':
        await this.clearCache();
        break;
      case '0':
        console.log('👋 Adiós!');
        process.exit(0);
        break;
      default:
        console.log('❌ Opción inválida');
    }
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async testAuthentication() {
    console.log('\n🔑 ===============================================');
    console.log('🔑 PROBANDO AUTENTICACIÓN TC');
    console.log('🔑 ===============================================');

    try {
      console.log('📡 Intentando autenticación...');
      
      const start = Date.now();
      const result = await tcSafe.authenticate();
      const duration = Date.now() - start;

      console.log(`⏱️ Duración: ${duration}ms`);
      
      if (result.success) {
        console.log('✅ ¡AUTENTICACIÓN EXITOSA!');
        console.log(`🔑 Token: ${result.token.substring(0, 20)}...`);
        console.log(`⏰ Expira: ${new Date(tcSafe.tokenExpiration).toLocaleString()}`);
        
        // Verificar si el token es válido
        const isValid = tcSafe.isTokenValid();
        console.log(`✔️ Token válido: ${isValid}`);
        
      } else {
        console.log('❌ AUTENTICACIÓN FALLÓ');
        console.log(`❌ Error: ${result.error}`);
      }

    } catch (error) {
      console.log('💥 ERROR EN AUTENTICACIÓN');
      console.log(`💥 ${error.message}`);
    }

    await this.question('\nPresiona Enter para continuar...');
  }

  async getFewPackages() {
    console.log('\n📦 ===============================================');
    console.log('📦 OBTENIENDO POCOS PAQUETES (SAFE)');
    console.log('📦 ===============================================');

    try {
      const start = Date.now();
      console.log('📡 Obteniendo 5 paquetes...');
      
      const result = await tcSafe.getPackages(5);
      const duration = Date.now() - start;

      console.log(`⏱️ Duración: ${duration}ms`);
      
      if (result.success) {
        console.log('✅ ¡PAQUETES OBTENIDOS!');
        console.log(`📊 Total recibido: ${result.packages.length}`);
        console.log(`📊 Fuente: ${result.source}`);
        console.log(`📊 Páginas: ${result.pages || 'N/A'}`);
        
        // Analizar primer paquete
        if (result.packages.length > 0) {
          const first = result.packages[0];
          console.log('\n📋 PRIMER PAQUETE:');
          console.log(`   ID: ${first.id}`);
          console.log(`   Título: ${first.title}`);
          console.log(`   Destino: ${first.destination}`);
          console.log(`   País: ${first.country}`);
          console.log(`   Precio: ${first.price?.amount} ${first.price?.currency}`);
          console.log(`   Categoría: ${first.category}`);
          console.log(`   Fuente: ${first._source}`);
          console.log(`   Tipo: ${first._type}`);
        }
        
        // Analizar diversidad
        const countries = [...new Set(result.packages.map(p => p.country))];
        const categories = [...new Set(result.packages.map(p => p.category))];
        
        console.log('\n🌍 ANÁLISIS DE DIVERSIDAD:');
        console.log(`   Países únicos: ${countries.length}`);
        console.log(`   Países: ${countries.join(', ')}`);
        console.log(`   Categorías únicas: ${categories.length}`);
        console.log(`   Categorías: ${categories.join(', ')}`);
        
      } else {
        console.log('❌ ERROR OBTENIENDO PAQUETES');
        console.log(`❌ ${result.error}`);
      }

    } catch (error) {
      console.log('💥 ERROR EN OBTENCIÓN');
      console.log(`💥 ${error.message}`);
    }

    await this.question('\nPresiona Enter para continuar...');
  }

  async getAllPackages() {
    console.log('\n🌊 ===============================================');
    console.log('🌊 OBTENIENDO TODOS LOS PAQUETES (SAFE)');
    console.log('🌊 ===============================================');

    try {
      const start = Date.now();
      console.log('📡 Obteniendo TODOS los paquetes (puede tardar)...');
      
      const result = await tcSafe.getAllPackages();
      const duration = Date.now() - start;

      console.log(`⏱️ Duración: ${duration}ms (${Math.round(duration/1000)}s)`);
      
      if (result.success) {
        console.log('✅ ¡TODOS LOS PAQUETES OBTENIDOS!');
        console.log(`📊 Total recibido: ${result.packages.length}`);
        console.log(`📊 Fuente: ${result.source}`);
        console.log(`📊 Páginas procesadas: ${result.pages || 'N/A'}`);
        
        // Estadísticas completas
        const stats = tcSafe.getPackageStats(result.packages);
        console.log('\n📊 ESTADÍSTICAS COMPLETAS:');
        console.log(`   Total: ${stats.total}`);
        console.log(`   Países: ${Object.keys(stats.byCountry).length}`);
        console.log(`   Categorías: ${Object.keys(stats.byCategory).length}`);
        console.log(`   Precio promedio: $${stats.priceRange.avg}`);
        console.log(`   Rango precios: $${stats.priceRange.min} - $${stats.priceRange.max}`);
        
        console.log('\n🌍 TOP PAÍSES:');
        const topCountries = Object.entries(stats.byCountry)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
        topCountries.forEach(([country, count]) => {
          console.log(`   ${country}: ${count} paquetes`);
        });
        
        console.log('\n🏷️ TOP CATEGORÍAS:');
        const topCategories = Object.entries(stats.byCategory)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5);
        topCategories.forEach(([category, count]) => {
          console.log(`   ${category}: ${count} paquetes`);
        });
        
      } else {
        console.log('❌ ERROR OBTENIENDO TODOS LOS PAQUETES');
        console.log(`❌ ${result.error}`);
      }

    } catch (error) {
      console.log('💥 ERROR EN OBTENCIÓN MASIVA');
      console.log(`💥 ${error.message}`);
    }

    await this.question('\nPresiona Enter para continuar...');
  }

  async testNoAuth() {
    console.log('\n🔓 ===============================================');
    console.log('🔓 PROBANDO SIN AUTENTICACIÓN (SIMPLE)');
    console.log('🔓 ===============================================');

    try {
      const start = Date.now();
      console.log('📡 Probando endpoints sin autenticación...');
      
      const result = await tcSimple.getPackages(5);
      const duration = Date.now() - start;

      console.log(`⏱️ Duración: ${duration}ms`);
      
      if (result.success) {
        console.log('✅ ¡FUNCIONA SIN AUTENTICACIÓN!');
        console.log(`📊 Total recibido: ${result.packages.length}`);
        console.log(`📊 Endpoint usado: ${result.endpoint}`);
        console.log(`📊 Fuente: ${result.source}`);
        
        // Mostrar primer paquete
        if (result.packages.length > 0) {
          const first = result.packages[0];
          console.log('\n📋 PRIMER PAQUETE:');
          console.log(`   ID: ${first.id}`);
          console.log(`   Título: ${first.title}`);
          console.log(`   Destino: ${first.destination}`);
          console.log(`   País: ${first.country}`);
          console.log(`   Datos raw disponibles: ${!!first._raw}`);
        }
        
      } else {
        console.log('❌ NO FUNCIONA SIN AUTENTICACIÓN');
        console.log(`❌ ${result.error}`);
        console.log(`❌ Intentos: ${result.attempted?.join(', ')}`);
      }

    } catch (error) {
      console.log('💥 ERROR EN MODO SIN AUTH');
      console.log(`💥 ${error.message}`);
    }

    await this.question('\nPresiona Enter para continuar...');
  }

  async analyzeRawResponse() {
    console.log('\n📊 ===============================================');
    console.log('📊 ANALIZANDO RESPUESTA CRUDA');
    console.log('📊 ===============================================');

    try {
      console.log('🔑 Primero autenticando...');
      const auth = await tcSafe.authenticate();
      
      if (!auth.success) {
        console.log('❌ No se pudo autenticar');
        return;
      }

      console.log('📡 Obteniendo UNA página cruda...');
      
      // Obtener respuesta cruda directamente
      const result = await tcSafe.getHolidayPackagesPage(tcSafe.authToken, 3, 1);
      
      if (result.success) {
        console.log('✅ ¡RESPUESTA CRUDA OBTENIDA!');
        console.log(`📊 Paquetes normalizados: ${result.packages.length}`);
        console.log(`📊 Fuente: ${result.source}`);
        
        // Mostrar estructura de primer paquete normalizado
        if (result.packages.length > 0) {
          const first = result.packages[0];
          console.log('\n📋 PAQUETE NORMALIZADO:');
          console.log(JSON.stringify(first, null, 2));
        }
        
      } else {
        console.log('❌ Error obteniendo respuesta cruda');
      }

    } catch (error) {
      console.log('💥 ERROR EN ANÁLISIS CRUDO');
      console.log(`💥 ${error.message}`);
      
      if (error.response) {
        console.log(`📡 Status: ${error.response.status}`);
        console.log(`📡 Headers:`, error.response.headers);
        console.log(`📡 Data:`, JSON.stringify(error.response.data, null, 2).substring(0, 500));
      }
    }

    await this.question('\nPresiona Enter para continuar...');
  }

  async compareModules() {
    console.log('\n🔄 ===============================================');
    console.log('🔄 COMPARANDO MÓDULOS TC');
    console.log('🔄 ===============================================');

    console.log('🔧 Probando módulo SAFE...');
    const safeStart = Date.now();
    const safeResult = await tcSafe.getPackages(5);
    const safeDuration = Date.now() - safeStart;

    console.log('🔓 Probando módulo SIMPLE...');
    const simpleStart = Date.now();
    const simpleResult = await tcSimple.getPackages(5);
    const simpleDuration = Date.now() - simpleStart;

    console.log('\n📊 COMPARACIÓN:');
    console.log('┌─────────────────┬─────────┬─────────┐');
    console.log('│ Métrica         │ SAFE    │ SIMPLE  │');
    console.log('├─────────────────┼─────────┼─────────┤');
    console.log(`│ Éxito           │ ${safeResult.success ? '✅' : '❌'}      │ ${simpleResult.success ? '✅' : '❌'}      │`);
    console.log(`│ Paquetes        │ ${String(safeResult.packages?.length || 0).padEnd(7)} │ ${String(simpleResult.packages?.length || 0).padEnd(7)} │`);
    console.log(`│ Tiempo (ms)     │ ${String(safeDuration).padEnd(7)} │ ${String(simpleDuration).padEnd(7)} │`);
    console.log(`│ Fuente          │ ${String(safeResult.source || 'N/A').substring(0,7).padEnd(7)} │ ${String(simpleResult.source || 'N/A').substring(0,7).padEnd(7)} │`);
    console.log('└─────────────────┴─────────┴─────────┘');

    if (safeResult.success && safeResult.packages.length > 0) {
      const safeFirst = safeResult.packages[0];
      console.log('\n📋 SAFE - Primer paquete:');
      console.log(`   ${safeFirst.title} | ${safeFirst.country} | $${safeFirst.price?.amount}`);
    }

    if (simpleResult.success && simpleResult.packages.length > 0) {
      const simpleFirst = simpleResult.packages[0];
      console.log('\n📋 SIMPLE - Primer paquete:');
      console.log(`   ${simpleFirst.title} | ${simpleFirst.country} | $${simpleFirst.price?.amount}`);
    }

    await this.question('\nPresiona Enter para continuar...');
  }

  async fullTest() {
    console.log('\n🧪 ===============================================');
    console.log('🧪 TEST COMPLETO DE TRAVEL COMPOSITOR');
    console.log('🧪 ===============================================');

    console.log('🔍 Paso 1: Conectividad básica...');
    const connectivity = await tcSimple.testConnection();
    console.log(`   Base URL: ${connectivity.baseUrl ? '✅' : '❌'}`);
    console.log(`   Packages: ${connectivity.packages ? '✅' : '❌'}`);
    
    console.log('\n🔑 Paso 2: Autenticación...');
    const auth = await tcSafe.authenticate();
    console.log(`   Auth: ${auth.success ? '✅' : '❌'}`);
    
    if (auth.success) {
      console.log('\n📦 Paso 3: Obtener paquetes...');
      const packages = await tcSafe.getPackages(10);
      console.log(`   Obtención: ${packages.success ? '✅' : '❌'}`);
      console.log(`   Cantidad: ${packages.packages?.length || 0}`);
      
      if (packages.success && packages.packages.length > 0) {
        console.log('\n🔍 Paso 4: Análisis de calidad...');
        const withCountry = packages.packages.filter(p => p.country && p.country !== 'País').length;
        const withPrice = packages.packages.filter(p => p.price?.amount > 0).length;
        const withImages = packages.packages.filter(p => p.images?.main).length;
        
        console.log(`   Con país válido: ${withCountry}/${packages.packages.length}`);
        console.log(`   Con precio válido: ${withPrice}/${packages.packages.length}`);
        console.log(`   Con imagen: ${withImages}/${packages.packages.length}`);
        
        const qualityScore = ((withCountry + withPrice + withImages) / (packages.packages.length * 3)) * 100;
        console.log(`   📊 Score de calidad: ${Math.round(qualityScore)}%`);
      }
    }

    console.log('\n🎯 RESUMEN:');
    console.log(`   🌐 Conectividad: ${connectivity.baseUrl ? 'OK' : 'FAIL'}`);
    console.log(`   🔑 Autenticación: ${auth.success ? 'OK' : 'FAIL'}`);
    console.log(`   📦 Paquetes: ${auth.success && (await tcSafe.getPackages(1)).success ? 'OK' : 'FAIL'}`);

    await this.question('\nPresiona Enter para continuar...');
  }

  async clearCache() {
    console.log('\n🛠️ ===============================================');
    console.log('🛠️ LIMPIANDO CACHE');
    console.log('🛠️ ===============================================');

    try {
      console.log('🗑️ Limpiando cache de paquetes...');
      
      // Limpiar cache del módulo safe
      tcSafe.packagesCache.data = [];
      tcSafe.packagesCache.lastUpdate = 0;
      
      // Limpiar token
      tcSafe.authToken = null;
      tcSafe.tokenExpiration = null;
      
      console.log('✅ Cache limpiado exitosamente');
      console.log('   📦 Paquetes: ✅');
      console.log('   🔑 Token: ✅');
      
    } catch (error) {
      console.log('❌ Error limpiando cache');
      console.log(`❌ ${error.message}`);
    }

    await this.question('\nPresiona Enter para continuar...');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const inspector = new TCInspector();
  inspector.start().catch(console.error);
}

module.exports = TCInspector;
