// ===============================================
// DIAGNÓSTICO RÁPIDO DEL SISTEMA INTERTRAVEL
// ===============================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class SystemDiagnostic {
  constructor() {
    this.baseUrl = 'http://localhost:3002';
    this.frontendUrl = 'http://localhost:3005';
    this.results = {
      backend: {},
      frontend: {},
      travelCompositor: {},
      routes: {},
      files: {}
    };
  }

  async runDiagnostic() {
    console.log('🔍 ===============================================');
    console.log('🔍 DIAGNÓSTICO RÁPIDO INTERTRAVEL SYSTEM');
    console.log('🔍 ===============================================\n');

    await this.checkFiles();
    await this.checkBackendHealth();
    await this.checkCriticalRoutes();
    await this.checkTravelCompositor();
    await this.checkFrontend();
    
    this.generateReport();
  }

  async checkFiles() {
    console.log('📁 Verificando archivos críticos...');
    
    const criticalFiles = [
      'backend/travel-compositor-fixed.js',
      'backend/travel-compositor-enhanced.js',
      'backend/routes/packages.js',
      'backend/routes/packages-fixed.js',
      'backend/routes/admin/whatsapp-config.js',
      'backend/server.js',
      'frontend/next.config.js'
    ];

    for (const file of criticalFiles) {
      try {
        const exists = fs.existsSync(file);
        this.results.files[file] = exists ? '✅ Existe' : '❌ Falta';
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
      } catch (error) {
        this.results.files[file] = `❌ Error: ${error.message}`;
        console.log(`   ❌ ${file} - Error: ${error.message}`);
      }
    }
    console.log('');
  }

  async checkBackendHealth() {
    console.log('🔍 Verificando backend...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, { timeout: 5000 });
      this.results.backend.health = '✅ Funcionando';
      this.results.backend.version = response.data.version || 'unknown';
      console.log('   ✅ Backend health OK');
      console.log(`   📌 Versión: ${response.data.version || 'N/A'}`);
    } catch (error) {
      this.results.backend.health = `❌ Error: ${error.message}`;
      console.log(`   ❌ Backend health FAIL: ${error.message}`);
    }
    console.log('');
  }

  async checkCriticalRoutes() {
    console.log('🔍 Verificando rutas críticas...');
    
    const routes = [
      { path: '/api/packages', name: 'Packages' },
      { path: '/api/packages/featured?limit=6', name: 'Featured Packages' },
      { path: '/api/admin/whatsapp-config', name: 'WhatsApp Config' }
    ];

    for (const route of routes) {
      try {
        const response = await axios.get(`${this.baseUrl}${route.path}`, { timeout: 10000 });
        this.results.routes[route.name] = '✅ OK';
        console.log(`   ✅ ${route.name} - Status: ${response.status}`);
        
        if (route.path.includes('featured')) {
          const dataCount = response.data?.data?.length || 0;
          console.log(`   📊 Paquetes destacados obtenidos: ${dataCount}`);
        }
      } catch (error) {
        this.results.routes[route.name] = `❌ ${error.response?.status || 'Error'}: ${error.message}`;
        console.log(`   ❌ ${route.name} - ${error.response?.status || 'Error'}: ${error.message}`);
      }
    }
    console.log('');
  }

  async checkTravelCompositor() {
    console.log('🔍 Verificando Travel Compositor...');
    
    try {
      // Cargar el módulo directamente
      const tcPath = path.resolve('./backend/travel-compositor-fixed.js');
      if (fs.existsSync(tcPath)) {
        const tc = require(tcPath);
        
        if (typeof tc.testConnection === 'function') {
          const testResult = await tc.testConnection();
          this.results.travelCompositor.connection = testResult.success ? '✅ OK' : `❌ ${testResult.error}`;
          console.log(`   ${testResult.success ? '✅' : '❌'} Conexión TC: ${testResult.message || testResult.error}`);
          
          if (testResult.success) {
            console.log(`   📊 Paquetes de prueba: ${testResult.packagesCount || 0}`);
            console.log(`   📌 Fuente: ${testResult.source || 'unknown'}`);
          }
        } else {
          this.results.travelCompositor.connection = '⚠️ Método testConnection no disponible';
          console.log('   ⚠️ Método testConnection no disponible');
        }

        // Verificar métodos críticos
        const criticalMethods = ['getAllPackages', 'getFeaturedPackages', 'getPackageById'];
        for (const method of criticalMethods) {
          const exists = typeof tc[method] === 'function';
          this.results.travelCompositor[method] = exists ? '✅ Disponible' : '❌ Falta';
          console.log(`   ${exists ? '✅' : '❌'} Método ${method}`);
        }
      } else {
        this.results.travelCompositor.connection = '❌ Archivo travel-compositor-fixed.js no encontrado';
        console.log('   ❌ Archivo travel-compositor-fixed.js no encontrado');
      }
    } catch (error) {
      this.results.travelCompositor.connection = `❌ Error cargando TC: ${error.message}`;
      console.log(`   ❌ Error cargando TC: ${error.message}`);
    }
    console.log('');
  }

  async checkFrontend() {
    console.log('🔍 Verificando frontend...');
    
    try {
      const response = await axios.get(this.frontendUrl, { timeout: 5000 });
      this.results.frontend.status = '✅ Funcionando';
      console.log('   ✅ Frontend accesible');
    } catch (error) {
      this.results.frontend.status = `❌ ${error.message}`;
      console.log(`   ❌ Frontend: ${error.message}`);
    }

    // Verificar next.config.js
    try {
      const nextConfigPath = './frontend/next.config.js';
      if (fs.existsSync(nextConfigPath)) {
        this.results.frontend.config = '✅ next.config.js existe';
        console.log('   ✅ next.config.js configurado');
      } else {
        this.results.frontend.config = '❌ next.config.js falta';
        console.log('   ❌ next.config.js no encontrado');
      }
    } catch (error) {
      this.results.frontend.config = `❌ Error verificando config: ${error.message}`;
      console.log(`   ❌ Error verificando config: ${error.message}`);
    }
    console.log('');
  }

  generateReport() {
    console.log('📋 ===============================================');
    console.log('📋 RESUMEN DEL DIAGNÓSTICO');
    console.log('📋 ===============================================\n');

    // Estado general
    const backendOK = this.results.backend.health?.includes('✅');
    const routesOK = Object.values(this.results.routes).every(r => r.includes('✅'));
    const tcOK = this.results.travelCompositor.connection?.includes('✅');
    const frontendOK = this.results.frontend.status?.includes('✅');

    console.log('🎯 ESTADO GENERAL:');
    console.log(`   Backend: ${backendOK ? '✅ OK' : '❌ PROBLEMA'}`);
    console.log(`   Rutas API: ${routesOK ? '✅ OK' : '❌ PROBLEMA'}`);
    console.log(`   Travel Compositor: ${tcOK ? '✅ OK' : '❌ PROBLEMA'}`);
    console.log(`   Frontend: ${frontendOK ? '✅ OK' : '❌ PROBLEMA'}\n`);

    // Problemas encontrados
    const problems = [];
    
    if (!backendOK) problems.push('Backend no responde');
    if (!routesOK) problems.push('Rutas API con errores');
    if (!tcOK) problems.push('Travel Compositor con problemas');
    if (!frontendOK) problems.push('Frontend no accesible');

    if (problems.length === 0) {
      console.log('🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!');
      console.log('✅ Todos los componentes están operativos\n');
    } else {
      console.log('⚠️ PROBLEMAS ENCONTRADOS:');
      problems.forEach(problem => console.log(`   ❌ ${problem}`));
      console.log('');
    }

    // Recomendaciones
    console.log('💡 RECOMENDACIONES:');
    
    if (!backendOK) {
      console.log('   🔧 Ejecutar: npm start en /backend');
    }
    
    if (!frontendOK) {
      console.log('   🔧 Ejecutar: npm run dev en /frontend');
    }
    
    if (!tcOK) {
      console.log('   🔧 Verificar credenciales Travel Compositor en .env');
      console.log('   🔧 Ejecutar script: APLICAR-CORRECCIONES-COMPLETAS.bat');
    }

    if (problems.length === 0) {
      console.log('   🚀 Sistema listo para uso en producción');
    }

    console.log('\n📋 ===============================================');
    console.log('📋 DIAGNÓSTICO COMPLETADO');
    console.log('📋 ===============================================');
  }
}

// Ejecutar diagnóstico si se llama directamente
if (require.main === module) {
  const diagnostic = new SystemDiagnostic();
  diagnostic.runDiagnostic().catch(error => {
    console.error('❌ Error ejecutando diagnóstico:', error);
    process.exit(1);
  });
}

module.exports = SystemDiagnostic;