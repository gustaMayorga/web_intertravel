// ===============================================
// INVESTIGADOR DE ENDPOINTS TRAVEL COMPOSITOR
// ===============================================

const axios = require('axios');

class TCEndpointDiscovery {
  constructor() {
    this.baseUrls = [
      'https://online.travelcompositor.com',
      'https://api.travelcompositor.com',
      'https://travelcompositor.com'
    ];
    
    this.possibleEndpoints = [
      // Endpoints de autenticación
      '/api/auth',
      '/api/authenticate',
      '/api/authentication',
      '/authenticate',
      '/auth',
      '/auth/login',
      '/resources/authentication/authenticate',
      '/resources/auth',
      '/login',
      '/api/v1/auth',
      '/api/v2/auth',
      '/webservice/auth',
      '/ws/auth',
      '/oauth/token',
      '/token',
      '/api/token',
      
      // Endpoints de paquetes/viajes
      '/api/packages',
      '/api/package',
      '/api/travel',
      '/api/travelidea',
      '/api/holidays',
      '/api/products',
      '/packages',
      '/package',
      '/travel',
      '/travelidea',
      '/holidays',
      '/products',
      '/resources/package',
      '/resources/travelidea',
      '/resources/travel',
      '/webservice/package',
      '/ws/package',
      
      // Endpoints con microsite
      '/api/package/intertravelgroup',
      '/api/travelidea/intertravelgroup',
      '/resources/package/intertravelgroup',
      '/resources/travelidea/intertravelgroup',
      
      // Endpoints de documentación
      '/swagger',
      '/swagger-ui',
      '/api-docs',
      '/docs',
      '/documentation',
      '/help',
      '/api/help',
      '/resources/help'
    ];
    
    this.credentials = {
      username: 'ApiUser1',
      password: 'Veoveo77*',
      micrositeId: 'intertravelgroup',
      microsite: 'intertravelgroup'
    };
  }

  async testUrl(url, timeout = 5000) {
    try {
      const response = await axios.get(url, {
        timeout,
        validateStatus: () => true // Aceptar cualquier status
      });
      
      return {
        url,
        status: response.status,
        accessible: response.status < 500,
        headers: response.headers,
        data: typeof response.data === 'string' ? 
          response.data.substring(0, 200) : 
          JSON.stringify(response.data).substring(0, 200)
      };
    } catch (error) {
      return {
        url,
        status: 'ERROR',
        accessible: false,
        error: error.code || error.message
      };
    }
  }

  async testAuthEndpoint(baseUrl, endpoint) {
    const fullUrl = `${baseUrl}${endpoint}`;
    
    try {
      // Probar diferentes métodos y payloads
      const authMethods = [
        {
          method: 'POST',
          data: {
            username: this.credentials.username,
            password: this.credentials.password,
            micrositeId: this.credentials.micrositeId
          }
        },
        {
          method: 'POST',
          data: {
            username: this.credentials.username,
            password: this.credentials.password,
            microsite: this.credentials.microsite
          }
        },
        {
          method: 'POST',
          data: {
            user: this.credentials.username,
            pass: this.credentials.password,
            micrositeId: this.credentials.micrositeId
          }
        },
        {
          method: 'GET',
          params: {
            username: this.credentials.username,
            password: this.credentials.password,
            micrositeId: this.credentials.micrositeId
          }
        }
      ];

      for (const authMethod of authMethods) {
        try {
          const config = {
            method: authMethod.method,
            url: fullUrl,
            timeout: 10000,
            validateStatus: () => true,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          };

          if (authMethod.data) {
            config.data = authMethod.data;
          }
          if (authMethod.params) {
            config.params = authMethod.params;
          }

          const response = await axios(config);
          
          const result = {
            url: fullUrl,
            method: authMethod.method,
            status: response.status,
            success: response.status >= 200 && response.status < 300,
            hasToken: false,
            response: null
          };

          if (response.data) {
            result.response = typeof response.data === 'string' ? 
              response.data.substring(0, 300) : 
              JSON.stringify(response.data, null, 2).substring(0, 300);
            
            // Buscar indicios de token
            const dataStr = JSON.stringify(response.data).toLowerCase();
            result.hasToken = dataStr.includes('token') || 
                             dataStr.includes('auth') || 
                             dataStr.includes('bearer') ||
                             dataStr.includes('jwt');
          }

          if (result.success || result.hasToken) {
            return result;
          }

        } catch (error) {
          // Continuar con el siguiente método
        }
      }

      return {
        url: fullUrl,
        status: 'ALL_METHODS_FAILED',
        success: false
      };

    } catch (error) {
      return {
        url: fullUrl,
        status: 'ERROR',
        success: false,
        error: error.message
      };
    }
  }

  async checkDocumentation() {
    console.log('');
    console.log('📚 4. BUSCANDO DOCUMENTACIÓN/SWAGGER...');
    
    const accessibleBases = this.baseUrls.filter(url => {
      // Asumir que las URLs que respondió el test inicial son accesibles
      return true; // Por simplicidad, probar todas
    });
    
    const docEndpoints = this.possibleEndpoints.filter(e => 
      e.includes('swagger') || e.includes('docs') || e.includes('help')
    );
    
    const foundDocs = [];
    
    for (const baseUrl of accessibleBases) {
      console.log(`   Base: ${baseUrl}`);
      
      for (const endpoint of docEndpoints) {
        const result = await this.testUrl(`${baseUrl}${endpoint}`);
        
        if (result.accessible) {
          foundDocs.push(result);
          console.log(`      ${endpoint}: ${result.status} ✅ DOCUMENTACIÓN ENCONTRADA!`);
          
          // Si es swagger, intentar obtener los endpoints
          if (endpoint.includes('swagger') && result.data) {
            try {
              const swaggerData = JSON.parse(result.data);
              if (swaggerData.paths) {
                console.log(`         📝 Endpoints encontrados en Swagger:`);
                Object.keys(swaggerData.paths).slice(0, 10).forEach(path => {
                  console.log(`            ${path}`);
                });
              }
            } catch (e) {
              console.log(`         📝 Swagger detectado (no parseable)`);
            }
          }
        } else {
          const statusIcon = result.status === 404 ? '❌' : '⚠️';
          console.log(`      ${endpoint}: ${result.status} ${statusIcon}`);
        }
      }
    }
    
    return foundDocs;
  }
  async discoverEndpoints() {
    console.log('🕵️ ===============================================');
    console.log('🕵️ INVESTIGANDO ENDPOINTS DE TRAVEL COMPOSITOR');
    console.log('🕵️ ===============================================');
    console.log('');

    const results = {
      baseUrls: [],
      authEndpoints: [],
      packageEndpoints: [],
      otherEndpoints: [],
      documentation: []
    };

    // 1. Probar URLs base
    console.log('🔍 1. PROBANDO URLS BASE...');
    for (const baseUrl of this.baseUrls) {
      const result = await this.testUrl(baseUrl);
      results.baseUrls.push(result);
      
      console.log(`   ${baseUrl}: ${result.status} ${result.accessible ? '✅' : '❌'}`);
    }

    // 2. Encontrar URLs base accesibles
    const accessibleBases = results.baseUrls
      .filter(r => r.accessible)
      .map(r => r.url);

    if (accessibleBases.length === 0) {
      console.log('❌ Ninguna URL base es accesible');
      return results;
    }

    console.log('');
    console.log('🔑 2. PROBANDO ENDPOINTS DE AUTENTICACIÓN...');
    
    // 3. Probar endpoints de autenticación
    for (const baseUrl of accessibleBases) {
      console.log(`   Base: ${baseUrl}`);
      
      for (const endpoint of this.possibleEndpoints.filter(e => 
        e.includes('auth') || e.includes('login'))) {
        
        const result = await this.testAuthEndpoint(baseUrl, endpoint);
        results.authEndpoints.push(result);
        
        const statusIcon = result.success ? '✅' : 
                          result.hasToken ? '🔑' : 
                          result.status === 404 ? '❌' : '⚠️';
        
        console.log(`      ${endpoint}: ${result.status} ${statusIcon}`);
        
        if (result.hasToken) {
          console.log(`         🎯 POSIBLE TOKEN DETECTADO!`);
          console.log(`         Response: ${result.response}`);
        }
      }
    }

    console.log('');
    console.log('📦 3. PROBANDO ENDPOINTS DE PAQUETES...');
    
    // 4. Probar endpoints de paquetes (solo GET)
    for (const baseUrl of accessibleBases) {
      console.log(`   Base: ${baseUrl}`);
      
      for (const endpoint of this.possibleEndpoints.filter(e => 
        e.includes('package') || e.includes('travel') || e.includes('holiday'))) {
        
        const result = await this.testUrl(`${baseUrl}${endpoint}`);
        results.packageEndpoints.push(result);
        
        const statusIcon = result.accessible ? '✅' : 
                          result.status === 401 ? '🔐' : 
                          result.status === 404 ? '❌' : '⚠️';
        
        console.log(`      ${endpoint}: ${result.status} ${statusIcon}`);
        
        if (result.status === 401) {
          console.log(`         🔐 REQUIERE AUTENTICACIÓN (buena señal!)`);
        }
      }
    }

    // 5. Buscar documentación
    results.documentation = await this.checkDocumentation();

    return results;
  }

  async generateReport(results) {
    console.log('');
    console.log('📊 ===============================================');
    console.log('📊 REPORTE DE DESCUBRIMIENTO');
    console.log('📊 ===============================================');
    console.log('');

    // URLs base funcionando
    const workingBases = results.baseUrls.filter(r => r.accessible);
    console.log(`🌐 URLs BASE ACCESIBLES (${workingBases.length}):`);
    workingBases.forEach(r => {
      console.log(`   ✅ ${r.url} (${r.status})`);
    });

    // Endpoints de auth prometedores
    const promisingAuth = results.authEndpoints.filter(r => 
      r.success || r.hasToken || r.status === 401
    );
    console.log('');
    console.log(`🔑 ENDPOINTS DE AUTH PROMETEDORES (${promisingAuth.length}):`);
    promisingAuth.forEach(r => {
      const icon = r.success ? '✅' : r.hasToken ? '🔑' : '🔐';
      console.log(`   ${icon} ${r.method} ${r.url} (${r.status})`);
      if (r.response) {
        console.log(`      Response: ${r.response.substring(0, 100)}...`);
      }
    });

    // Endpoints de paquetes prometedores
    const promisingPackages = results.packageEndpoints.filter(r => 
      r.accessible || r.status === 401
    );
    console.log('');
    console.log(`📦 ENDPOINTS DE PAQUETES PROMETEDORES (${promisingPackages.length}):`);
    promisingPackages.forEach(r => {
      const icon = r.accessible ? '✅' : '🔐';
      console.log(`   ${icon} GET ${r.url} (${r.status})`);
    });

    // Recomendaciones
    console.log('');
    console.log('💡 RECOMENDACIONES:');
    
    if (promisingAuth.length > 0) {
      const bestAuth = promisingAuth[0];
      console.log(`   🔑 Probar autenticación: ${bestAuth.method} ${bestAuth.url}`);
    } else {
      console.log('   ❌ No se encontraron endpoints de auth válidos');
    }
    
    if (promisingPackages.length > 0) {
      const bestPackage = promisingPackages[0];
      console.log(`   📦 Probar paquetes: GET ${bestPackage.url}`);
    } else {
      console.log('   ❌ No se encontraron endpoints de paquetes válidos');
    }

    return {
      bestAuth: promisingAuth[0] || null,
      bestPackage: promisingPackages[0] || null,
      workingBases,
      summary: {
        totalAuthTested: results.authEndpoints.length,
        promisingAuth: promisingAuth.length,
        totalPackagesTested: results.packageEndpoints.length,
        promisingPackages: promisingPackages.length
      }
    };
  }

  async generateFixedConfig(report) {
    if (!report.bestAuth && !report.bestPackage) {
      console.log('\n⚠️ No se encontraron endpoints válidos para generar configuración');
      return;
    }
    
    console.log('\n🔧 GENERANDO CONFIGURACIÓN CORREGIDA...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Leer el archivo actual
    const configPath = path.join(__dirname, '../backend/travel-compositor-safe.js');
    
    try {
      let configContent = await fs.promises.readFile(configPath, 'utf8');
      
      // Actualizar URLs si se encontraron
      if (report.bestAuth) {
        console.log(`✅ Actualizando authUrl: ${report.bestAuth.url}`);
        configContent = configContent.replace(
          /authUrl: '[^']*'/,
          `authUrl: '${report.bestAuth.url}'`
        );
      }
      
      if (report.bestPackage) {
        console.log(`✅ Actualizando baseUrl: ${report.bestPackage.url.replace(/\/[^\/]*$/, '')}`);
        const newBaseUrl = report.bestPackage.url.replace(/\/[^\/]*$/, '');
        configContent = configContent.replace(
          /baseUrl: '[^']*'/,
          `baseUrl: '${newBaseUrl}'`
        );
      }
      
      // Escribir el archivo actualizado
      await fs.promises.writeFile(configPath, configContent, 'utf8');
      
      console.log('✅ Archivo travel-compositor-safe.js actualizado');
      console.log('💡 Reinicia el servidor para aplicar los cambios');
      
    } catch (error) {
      console.log(`❌ Error actualizando configuración: ${error.message}`);
    }
  }

  async runFullDiscovery() {
    const results = await this.discoverEndpoints();
    const report = await this.generateReport(results);
    
    console.log('');
    console.log('🎯 Para usar los resultados, actualiza travel-compositor-safe.js con:');
    if (report.bestAuth) {
      console.log(`   authUrl: '${report.bestAuth.url}'`);
      console.log(`   method: '${report.bestAuth.method}'`);
    }
    if (report.bestPackage) {
      console.log(`   packagesUrl: '${report.bestPackage.url}'`);
    }
    
    // Generar configuración automáticamente
    await this.generateFixedConfig(report);
    
    return report;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const discovery = new TCEndpointDiscovery();
  discovery.runFullDiscovery()
    .then(() => {
      console.log('\\n🎉 Investigación completada!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error en investigación:', error);
      process.exit(1);
    });
}

module.exports = TCEndpointDiscovery;
