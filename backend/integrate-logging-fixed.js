#!/usr/bin/env node

// ===============================================
// INTEGRAR LOGGING DETALLADO EN SERVER.JS - CORREGIDO
// ===============================================

const fs = require('fs');
const path = require('path');

console.log('📊 Integrando logging detallado en server.js...\n');

const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// ======================================
// 1. AGREGAR IMPORT DEL LOGGER
// ======================================

const loggerImport = `
// Importaciones de logging
const DetailedLogger = require('./detailed-logger');
const logger = new DetailedLogger();
`;

// Buscar donde agregar el import
const importIndex = serverContent.indexOf('const app = express();');
if (importIndex !== -1) {
  const beforeApp = serverContent.substring(0, importIndex);
  const afterApp = serverContent.substring(importIndex);
  
  serverContent = beforeApp + loggerImport + afterApp;
  console.log('✅ Logger import agregado');
}

// ======================================
// 2. AGREGAR RUTA PARA LOGS DE FRONTEND
// ======================================

const frontendLogsRoute = `
// Ruta para recibir logs del frontend
app.post('/api/frontend-logs', express.json(), (req, res) => {
  try {
    const { sessionId, logs } = req.body;
    
    logger.log('REQUEST', 'Frontend logs recibidos', {
      sessionId,
      logsCount: logs.length,
      firstLog: logs[0],
      lastLog: logs[logs.length - 1]
    });
    
    // Procesar cada log del frontend
    logs.forEach(log => {
      logger.log('FRONTEND', \`[\${log.type}] \${log.message}\`, {
        frontendData: log.data,
        frontendTimestamp: log.timestamp,
        url: log.url
      });
    });
    
    res.json({ success: true, processed: logs.length });
    
  } catch (error) {
    logger.logError(error, { context: 'frontend-logs' });
    res.status(500).json({ success: false, error: error.message });
  }
});`;

// ======================================
// 3. MODIFICAR FUNCIÓN getPackagesFromSource
// ======================================

const newGetPackagesFromSource = `// Función para obtener paquetes (TC -> Mock) - CON LOGGING
async function getPackagesFromSource(options = {}) {
  logger.log('TC_FETCH', 'Iniciando getPackagesFromSource', {
    options,
    tcConnected,
    travelCompositorAvailable: !!travelCompositor
  });
  
  // Primero intentar Travel Compositor
  if (tcConnected && travelCompositor) {
    try {
      logger.logTCOperation('fetch_start', { options });
      console.log('🔍 Obteniendo holiday packages de Travel Compositor...');
      
      // Si se solicitan TODOS los paquetes (sin límite o límite alto)
      if (!options.limit || options.limit > 100) {
        logger.log('TC_FETCH', 'Solicitando TODOS los paquetes', { requestedLimit: options.limit });
        console.log('📦 Solicitando TODOS los paquetes disponibles...');
        
        const result = await travelCompositor.getAllPackages();
        if (result.success && result.packages.length > 0) {
          logger.log('SUCCESS', 'getAllPackages exitoso', {
            total: result.packages.length,
            source: result.source,
            pages: result.pages
          });
          
          // Analizar paquetes obtenidos
          const analysis = logger.logPackageAnalysis(result.packages, result.source);
          
          console.log(\`✅ \${result.packages.length} packages obtenidos de TC (TODOS)\`);
          console.log(\`✅ Travel Compositor: \${result.packages.length} paquetes obtenidos\`);
          
          // Aplicar límite si se especifica
          if (options.limit && options.limit < result.packages.length) {
            logger.log('FILTER', 'Aplicando límite', {
              totalAvailable: result.packages.length,
              limitRequested: options.limit
            });
            
            return {
              success: true,
              packages: result.packages.slice(0, options.limit),
              source: 'travel-compositor',
              total: result.packages.length,
              limitApplied: options.limit
            };
          }
          
          return {
            success: true,
            packages: result.packages,
            source: 'travel-compositor',
            total: result.packages.length
          };
        } else {
          logger.logWarning('getAllPackages falló', result);
        }
      } else {
        // Para límites pequeños, usar el método tradicional
        logger.log('TC_FETCH', 'Usando método tradicional', { limit: options.limit });
        
        const result = await travelCompositor.getPackages(options.limit || 40);
        if (result.success && result.packages.length > 0) {
          logger.log('SUCCESS', 'getPackages tradicional exitoso', {
            requested: options.limit || 40,
            received: result.packages.length,
            source: result.source
          });
          
          // Analizar paquetes
          logger.logPackageAnalysis(result.packages, result.source);
          
          console.log(\`✅ \${result.packages.length} packages obtenidos de TC\`);
          console.log(\`✅ Travel Compositor: \${result.packages.length} paquetes obtenidos\`);
          return {
            success: true,
            packages: result.packages,
            source: 'travel-compositor'
          };
        } else {
          logger.logWarning('getPackages tradicional falló', result);
        }
      }
    } catch (error) {
      logger.logError(error, { context: 'getPackagesFromSource', options });
      console.warn('⚠️ Error obteniendo de TC, usando fallback:', error.message);
    }
  } else {
    logger.logWarning('TC no disponible', { tcConnected, travelCompositorAvailable: !!travelCompositor });
  }
  
  // Fallback a datos mock
  logger.log('TC_FETCH', 'Usando fallback mock', { requestedLimit: options.limit });
  console.log('📦 Usando paquetes mock como fallback');
  const mockPackages = generateMockPackages(options.limit || 40);
  
  logger.logPackageAnalysis(mockPackages, 'mock-fallback');
  
  return {
    success: true,
    packages: mockPackages,
    source: 'mock-fallback'
  };
}`;

// ======================================
// 4. APLICAR CAMBIOS
// ======================================

// Buscar y reemplazar función getPackagesFromSource
const functionStart = serverContent.indexOf('// Función para obtener paquetes (TC -> Mock)');
const functionEnd = serverContent.indexOf('\n}\n\n// Función para búsqueda con Travel Compositor');

if (functionStart !== -1 && functionEnd !== -1) {
  const beforeFunction = serverContent.substring(0, functionStart);
  const afterFunction = serverContent.substring(functionEnd + 3);
  
  serverContent = beforeFunction + newGetPackagesFromSource + '\n}\n\n// Función para búsqueda con Travel Compositor' + afterFunction;
  console.log('✅ Función getPackagesFromSource con logging actualizada');
} else {
  console.log('⚠️ No se encontró la función getPackagesFromSource');
}

// Agregar ruta de frontend logs antes de las rutas admin
const adminIndex = serverContent.indexOf('// ======================================\n// RUTAS ADMIN PROTEGIDAS');
if (adminIndex !== -1) {
  const beforeAdmin = serverContent.substring(0, adminIndex);
  const afterAdmin = serverContent.substring(adminIndex);
  
  serverContent = beforeAdmin + frontendLogsRoute + '\n\n// ======================================\n// RUTAS ADMIN PROTEGIDAS' + afterAdmin;
  console.log('✅ Ruta para logs de frontend agregada');
} else {
  console.log('⚠️ No se encontraron las rutas admin');
}

// ======================================
// 5. GUARDAR ARCHIVO
// ======================================

// Crear backup
const timestamp = Date.now();
const backupPath = path.join(__dirname, 'server.backup.' + timestamp + '.js');
fs.copyFileSync(serverPath, backupPath);

// Escribir archivo actualizado
fs.writeFileSync(serverPath, serverContent);

console.log('✅ server.js actualizado con logging detallado');
console.log('💾 Backup creado: ' + path.basename(backupPath));

// ======================================
// 6. CREAR SCRIPT DE TEST SIMPLE
// ======================================

const testScript = `#!/usr/bin/env node

// Test simple con logging
const axios = require('axios');

async function testWithLogging() {
  console.log('🧪 INICIANDO TEST CON LOGGING...\\n');
  
  const baseURL = 'http://localhost:3002';
  
  try {
    // 1. Test health
    console.log('1. Testing health endpoint...');
    const health = await axios.get(baseURL + '/api/health');
    console.log('✅ Health TC:', health.data.services.travelCompositor);
    console.log('✅ Health DB:', health.data.services.database);
    
    // 2. Test packages
    console.log('\\n2. Testing packages endpoint...');
    const start = Date.now();
    const packages = await axios.get(baseURL + '/api/packages?limit=50');
    const duration = Date.now() - start;
    
    console.log('✅ Packages (' + duration + 'ms):');
    console.log('   Total recibido: ' + packages.data.packages.length);
    console.log('   Source: ' + packages.data.source);
    console.log('   Total disponible: ' + (packages.data.total || 'N/A'));
    
    // 3. Analizar diversidad
    if (packages.data.packages.length > 0) {
      const countries = [...new Set(packages.data.packages.map(p => p.country))];
      const categories = [...new Set(packages.data.packages.map(p => p.category))];
      
      console.log('\\n📊 Análisis de diversidad:');
      console.log('   Países únicos: ' + countries.length);
      console.log('   Categorías únicas: ' + categories.length);
      console.log('   Primeros 5 países: ' + countries.slice(0, 5).join(', '));
      
      const sample = packages.data.packages[0];
      console.log('\\n📦 Paquete de muestra:');
      console.log('   ID: ' + sample.id);
      console.log('   Title: ' + sample.title);
      console.log('   Country: ' + sample.country);
      console.log('   Source: ' + sample._source);
    }
    
    console.log('\\n🎉 Test completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

if (require.main === module) {
  testWithLogging();
}

module.exports = testWithLogging;`;

fs.writeFileSync(path.join(__dirname, 'test-simple.js'), testScript);
console.log('✅ Script de test simple creado');

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. Reiniciar servidor: npm run dev');
console.log('2. Ejecutar diagnóstico: node diagnose-packages.js');
console.log('3. Ejecutar test: node test-simple.js');
console.log('4. Revisar logs en consola del servidor');

console.log('\n📊 CAMBIOS APLICADOS:');
console.log('✅ Sistema de logging integrado');
console.log('✅ Función getPackagesFromSource mejorada');
console.log('✅ Análisis automático de paquetes');
console.log('✅ Ruta para logs de frontend');

process.exit(0);