// ===============================================
// DIAGNÓSTICO COMPLETO TRAVEL COMPOSITOR
// Ruta admin para ver TODOS los paquetes con detalles
// ===============================================

const express = require('express');
const router = express.Router();

// Función para analizar estructura de datos
function analyzePackageStructure(packages) {
  if (!packages || packages.length === 0) {
    return { error: 'No hay paquetes para analizar' };
  }

  const firstPackage = packages[0];
  const allKeys = new Set();
  const keyTypes = {};
  const sampleValues = {};

  // Analizar todas las claves de todos los paquetes
  packages.forEach(pkg => {
    Object.keys(pkg).forEach(key => {
      allKeys.add(key);
      if (!keyTypes[key]) {
        keyTypes[key] = typeof pkg[key];
        sampleValues[key] = pkg[key];
      }
    });
  });

  return {
    totalPackages: packages.length,
    allKeys: Array.from(allKeys).sort(),
    structure: Object.fromEntries(
      Array.from(allKeys).map(key => [
        key,
        {
          type: keyTypes[key],
          sample: typeof sampleValues[key] === 'object' 
            ? JSON.stringify(sampleValues[key]).substring(0, 100) + '...'
            : sampleValues[key]
        }
      ])
    ),
    firstPackageComplete: firstPackage
  };
}

// Ruta para diagnóstico completo
router.get('/travel-compositor/full-analysis', async (req, res) => {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO TRAVEL COMPOSITOR INICIADO');
    console.log('=' .repeat(70));

    // Intentar obtener Travel Compositor
    let travelCompositor = null;
    let tcConnected = false;

    try {
      travelCompositor = require('../travel-compositor-fast.js');
      const authResult = await travelCompositor.tryAuthentication();
      tcConnected = authResult.success;
      console.log(`🔗 Travel Compositor: ${tcConnected ? 'CONECTADO' : 'DESCONECTADO'}`);
    } catch (error) {
      console.log(`❌ Error conectando TC: ${error.message}`);
    }

    const analysis = {
      timestamp: new Date().toISOString(),
      connection: {
        status: tcConnected ? 'connected' : 'disconnected',
        travelCompositorAvailable: !!travelCompositor
      },
      tests: []
    };

    if (tcConnected && travelCompositor) {
      console.log('\n📊 EJECUTANDO ANÁLISIS COMPLETO...');

      // Test 1: Obtener todos los paquetes disponibles
      console.log('\n--- Test 1: getAllPackages() ---');
      try {
        const allPackagesResult = await travelCompositor.getAllPackages();
        console.log(`📋 getAllPackages - Success: ${allPackagesResult.success}`);
        console.log(`📋 getAllPackages - Count: ${allPackagesResult.packages?.length || 0}`);
        
        if (allPackagesResult.success && allPackagesResult.packages?.length > 0) {
          const structure1 = analyzePackageStructure(allPackagesResult.packages);
          analysis.tests.push({
            name: 'getAllPackages',
            success: true,
            count: allPackagesResult.packages.length,
            structure: structure1,
            samplePackages: allPackagesResult.packages.slice(0, 3),
            allPackages: allPackagesResult.packages // TODOS los paquetes
          });
          
          console.log(`✅ Estructura analizada: ${structure1.allKeys.length} propiedades encontradas`);
          console.log(`📊 Primeras 5 propiedades: ${structure1.allKeys.slice(0, 5).join(', ')}`);
        } else {
          analysis.tests.push({
            name: 'getAllPackages',
            success: false,
            error: allPackagesResult.error || 'No packages returned'
          });
        }
      } catch (error) {
        console.log(`❌ Error en getAllPackages: ${error.message}`);
        analysis.tests.push({
          name: 'getAllPackages',
          success: false,
          error: error.message
        });
      }

      // Test 2: Obtener paquetes limitados
      console.log('\n--- Test 2: getPackages(50) ---');
      try {
        const limitedResult = await travelCompositor.getPackages(50);
        console.log(`📋 getPackages(50) - Success: ${limitedResult.success}`);
        console.log(`📋 getPackages(50) - Count: ${limitedResult.packages?.length || 0}`);
        
        if (limitedResult.success && limitedResult.packages?.length > 0) {
          const structure2 = analyzePackageStructure(limitedResult.packages);
          analysis.tests.push({
            name: 'getPackages_limited',
            success: true,
            count: limitedResult.packages.length,
            structure: structure2,
            samplePackages: limitedResult.packages.slice(0, 3)
          });
        } else {
          analysis.tests.push({
            name: 'getPackages_limited',
            success: false,
            error: limitedResult.error || 'No packages returned'
          });
        }
      } catch (error) {
        console.log(`❌ Error en getPackages: ${error.message}`);
        analysis.tests.push({
          name: 'getPackages_limited',
          success: false,
          error: error.message
        });
      }

      // Test 3: Verificar métodos disponibles
      console.log('\n--- Test 3: Métodos Disponibles ---');
      const tcMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(travelCompositor))
        .filter(name => typeof travelCompositor[name] === 'function')
        .filter(name => !name.startsWith('_'));
      
      console.log(`🔧 Métodos disponibles: ${tcMethods.join(', ')}`);
      analysis.tests.push({
        name: 'available_methods',
        success: true,
        methods: tcMethods
      });

      // Test 4: Información de autenticación
      console.log('\n--- Test 4: Info de Autenticación ---');
      const authInfo = {
        hasAuth: !!travelCompositor.auth,
        authKeys: travelCompositor.auth ? Object.keys(travelCompositor.auth) : [],
        micrositeId: travelCompositor.auth?.micrositeId || 'N/A',
        username: travelCompositor.auth?.username || 'N/A'
      };
      
      console.log(`🔑 Auth Info: ${JSON.stringify(authInfo, null, 2)}`);
      analysis.tests.push({
        name: 'auth_info',
        success: true,
        data: authInfo
      });

    } else {
      analysis.tests.push({
        name: 'connection_failed',
        success: false,
        error: 'Travel Compositor no disponible'
      });
    }

    // Test 5: Análisis de datos mock para comparación
    console.log('\n--- Test 5: Datos Mock de Comparación ---');
    const { generateMockPackages } = require('../server.js');
    // Como no podemos importar la función directamente, crear mock aquí
    const mockPackages = [
      {
        id: 'mock-001',
        title: 'Mock Package 1',
        source: 'mock'
      }
    ];
    
    analysis.tests.push({
      name: 'mock_comparison',
      success: true,
      mockStructure: analyzePackageStructure(mockPackages)
    });

    console.log('\n🎉 ANÁLISIS COMPLETO TERMINADO');
    console.log('=' .repeat(70));

    // Respuesta para el admin
    res.json({
      success: true,
      analysis: analysis,
      recommendations: [
        'Verificar que Travel Compositor esté devolviendo datos',
        'Analizar la estructura de datos para encontrar campos únicos de InterTravel',
        'Comparar con datos mock para entender diferencias',
        'Verificar si hay campos como micrositeId, agency, provider'
      ]
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico completo:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Ruta para obtener SOLO la lista completa de paquetes (más limpia)
router.get('/travel-compositor/all-packages', async (req, res) => {
  try {
    console.log('📋 Solicitando TODOS los paquetes de Travel Compositor...');

    let travelCompositor = null;
    let tcConnected = false;

    try {
      travelCompositor = require('../travel-compositor-fast.js');
      const authResult = await travelCompositor.tryAuthentication();
      tcConnected = authResult.success;
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    if (!tcConnected || !travelCompositor) {
      return res.status(503).json({
        success: false,
        error: 'Travel Compositor no disponible'
      });
    }

    // Obtener TODOS los paquetes
    const result = await travelCompositor.getAllPackages();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    console.log(`✅ ${result.packages.length} paquetes obtenidos`);

    // Análisis básico
    const analysis = analyzePackageStructure(result.packages);

    res.json({
      success: true,
      total: result.packages.length,
      packages: result.packages,
      structure: analysis.structure,
      metadata: {
        keys: analysis.allKeys,
        samplePackage: analysis.firstPackageComplete
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo todos los paquetes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para buscar paquetes específicos por criterios
router.get('/travel-compositor/search-packages', async (req, res) => {
  try {
    const { 
      searchTerm = '',
      limit = 20,
      includeDetails = false 
    } = req.query;

    console.log(`🔍 Buscando paquetes con: "${searchTerm}"`);

    let travelCompositor = null;
    let tcConnected = false;

    try {
      travelCompositor = require('../travel-compositor-fast.js');
      const authResult = await travelCompositor.tryAuthentication();
      tcConnected = authResult.success;
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: `Travel Compositor error: ${error.message}`
      });
    }

    if (!tcConnected) {
      return res.status(503).json({
        success: false,
        error: 'Travel Compositor no conectado'
      });
    }

    // Obtener todos los paquetes y filtrar
    const allResult = await travelCompositor.getAllPackages();
    
    if (!allResult.success) {
      return res.status(500).json({
        success: false,
        error: allResult.error
      });
    }

    let filteredPackages = allResult.packages;

    // Aplicar filtro de búsqueda si se proporciona
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredPackages = allResult.packages.filter(pkg => 
        (pkg.title && pkg.title.toLowerCase().includes(searchLower)) ||
        (pkg.destination && pkg.destination.toLowerCase().includes(searchLower)) ||
        (pkg.country && pkg.country.toLowerCase().includes(searchLower)) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchLower))
      );
    }

    // Aplicar límite
    const limitedPackages = filteredPackages.slice(0, parseInt(limit));

    console.log(`📊 Resultados: ${limitedPackages.length}/${filteredPackages.length} paquetes`);

    const response = {
      success: true,
      searchTerm,
      total: filteredPackages.length,
      showing: limitedPackages.length,
      packages: limitedPackages
    };

    if (includeDetails === 'true') {
      response.analysis = analyzePackageStructure(limitedPackages);
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;