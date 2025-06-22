#!/usr/bin/env node

// ===============================================
// DIAGNÓSTICO DETALLADO DEL PROBLEMA DE PAQUETES
// ===============================================

const DetailedLogger = require('./detailed-logger');
const tcConfig = require('./travel-compositor-safe');

const logger = new DetailedLogger();

async function diagnosticPackageProblem() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DETALLADO...\n');
  
  try {
    // ======================================
    // 1. VERIFICAR AUTENTICACIÓN
    // ======================================
    
    logger.log('TC_AUTH', 'Verificando autenticación TC');
    const authResult = await tcConfig.authenticate();
    
    if (!authResult.success) {
      logger.logError(new Error('Autenticación TC falló'), { result: authResult });
      return;
    }
    
    logger.log('SUCCESS', 'Autenticación TC exitosa');
    
    // ======================================
    // 2. VERIFICAR CACHE ESTADO
    // ======================================
    
    logger.log('TC_CACHE', 'Verificando estado del cache');
    const cacheInfo = {
      hasData: tcConfig.packagesCache.data.length > 0,
      dataCount: tcConfig.packagesCache.data.length,
      lastUpdate: new Date(tcConfig.packagesCache.lastUpdate).toISOString(),
      cacheAge: Date.now() - tcConfig.packagesCache.lastUpdate,
      isExpired: (Date.now() - tcConfig.packagesCache.lastUpdate) > tcConfig.packagesCache.cacheDuration
    };
    
    logger.logCacheOperation('STATUS_CHECK', cacheInfo);
    
    // ======================================
    // 3. OBTENER PÁGINA POR PÁGINA
    // ======================================
    
    logger.log('TC_FETCH', 'Iniciando obtención página por página');
    
    let totalPackages = [];
    let page = 1;
    const maxPages = 10; // Límite para diagnóstico
    
    while (page <= maxPages) {
      logger.log('TC_FETCH', `Obteniendo página ${page}`);
      
      try {
        const token = await tcConfig.getValidToken();
        const pageResult = await tcConfig.getHolidayPackagesPage(token, 100, page);
        
        if (pageResult.success && pageResult.packages.length > 0) {
          logger.log('SUCCESS', `Página ${page}: ${pageResult.packages.length} paquetes`);
          
          // Analizar muestra de esta página
          const samplePackage = pageResult.packages[0];
          logger.log('STATS', `Muestra página ${page}`, {
            id: samplePackage.id,
            title: samplePackage.title,
            destination: samplePackage.destination,
            country: samplePackage.country,
            category: samplePackage.category,
            price: samplePackage.price,
            source: samplePackage._source
          });
          
          totalPackages.push(...pageResult.packages);
          
          if (pageResult.packages.length < 100) {
            logger.log('SUCCESS', `Última página alcanzada en página ${page}`);
            break;
          }
        } else {
          logger.log('WARNING', `Página ${page} vacía o error`);
          break;
        }
        
        page++;
        
      } catch (error) {
        logger.logError(error, { page });
        break;
      }
    }
    
    // ======================================
    // 4. ANÁLISIS DETALLADO
    // ======================================
    
    logger.log('STATS', 'Iniciando análisis detallado');
    const analysis = logger.logPackageAnalysis(totalPackages, 'diagnostic');
    
    // ======================================
    // 5. VERIFICAR MÉTODOS DE OBTENCIÓN
    // ======================================
    
    logger.log('TC_FETCH', 'Probando getAllPackages()');
    const getAllResult = await tcConfig.getAllPackages(true); // Forzar refresh
    
    if (getAllResult.success) {
      logger.log('SUCCESS', 'getAllPackages() exitoso', {
        total: getAllResult.packages.length,
        source: getAllResult.source,
        pages: getAllResult.pages
      });
      
      // Comparar con obtención manual
      logger.log('STATS', 'Comparación métodos', {
        manualPages: totalPackages.length,
        getAllMethod: getAllResult.packages.length,
        difference: Math.abs(totalPackages.length - getAllResult.packages.length)
      });
    } else {
      logger.logError(new Error('getAllPackages() falló'), getAllResult);
    }
    
    // ======================================
    // 6. PROBAR getPackages() CON DIFERENTES LÍMITES
    // ======================================
    
    const limits = [40, 100, 500, 1000];
    
    for (const limit of limits) {
      logger.log('TC_FETCH', `Probando getPackages(${limit})`);
      
      const result = await tcConfig.getPackages(limit);
      
      if (result.success) {
        logger.log('SUCCESS', `getPackages(${limit}) exitoso`, {
          requested: limit,
          received: result.packages.length,
          source: result.source,
          limitApplied: result.limitApplied
        });
      } else {
        logger.logError(new Error(`getPackages(${limit}) falló`), result);
      }
    }
    
    // ======================================
    // 7. VERIFICAR BÚSQUEDA
    // ======================================
    
    logger.log('TC_FETCH', 'Probando búsqueda');
    
    const searchTerms = ['España', 'Francia', 'Italia', 'Estados Unidos'];
    
    for (const term of searchTerms) {
      const searchResult = await tcConfig.searchPackages({
        search: term,
        limit: 50
      });
      
      if (searchResult.success) {
        logger.log('SUCCESS', `Búsqueda "${term}"`, {
          term,
          found: searchResult.packages.length,
          totalAvailable: searchResult.totalAvailable
        });
      } else {
        logger.logError(new Error(`Búsqueda "${term}" falló`), searchResult);
      }
    }
    
    // ======================================
    // 8. REPORTE FINAL
    // ======================================
    
    logger.log('STATS', 'DIAGNÓSTICO COMPLETADO');
    
    const finalReport = {
      authenticationWorking: authResult.success,
      cacheStatus: cacheInfo,
      manualPagination: {
        pagesObtained: page - 1,
        totalPackages: totalPackages.length,
        uniqueCountries: [...new Set(totalPackages.map(p => p.country))].length,
        uniqueCategories: [...new Set(totalPackages.map(p => p.category))].length
      },
      getAllMethod: getAllResult.success ? {
        total: getAllResult.packages.length,
        source: getAllResult.source
      } : null,
      getPackagesTest: `Probado con límites: ${limits.join(', ')}`,
      searchTest: `Probado términos: ${searchTerms.join(', ')}`
    };
    
    console.log('\n🎯 REPORTE DIAGNÓSTICO FINAL:');
    console.log(JSON.stringify(finalReport, null, 2));
    
    // Generar reporte de sesión
    logger.generateSessionReport();
    
    // Identificar problemas
    logger.log('WARNING', 'PROBLEMAS IDENTIFICADOS');
    
    if (totalPackages.length < 500) {
      logger.logWarning('Pocos paquetes obtenidos', { 
        expected: '500+', 
        actual: totalPackages.length 
      });
    }
    
    if (analysis.byCountry && Object.keys(analysis.byCountry).length < 10) {
      logger.logWarning('Poca diversidad de países', { 
        expected: '10+', 
        actual: Object.keys(analysis.byCountry).length 
      });
    }
    
    if (analysis.duplicateIds.length > 0) {
      logger.logWarning('IDs duplicados encontrados', { 
        count: analysis.duplicateIds.length,
        samples: analysis.duplicateIds.slice(0, 5)
      });
    }
    
  } catch (error) {
    logger.logError(error, { context: 'diagnostic_main' });
  }
}

if (require.main === module) {
  diagnosticPackageProblem();
}

module.exports = diagnosticPackageProblem;