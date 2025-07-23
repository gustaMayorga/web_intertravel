// ==============================================
// 🔍 AUDITOR DE COMPLETITUD API - AGENTE 3
// ==============================================
// Verifica que todas las rutas frontend tengan su correspondiente backend

const fs = require('fs').promises;
const path = require('path');

class APICompletenessAuditor {
  constructor() {
    this.frontendAPIPath = 'D:\\Inter\\intertravel-website\\WEB-FINAL-UNIFICADA\\frontend\\src\\app\\api\\admin';
    this.backendPath = 'D:\\Inter\\intertravel-website\\WEB-FINAL-UNIFICADA\\backend';
    this.auditResults = {
      frontendRoutes: [],
      backendModules: [],
      coverage: {
        complete: [],
        partial: [],
        missing: []
      }
    };
  }

  async runAudit() {
    console.log('🔍 ===== AUDITORÍA DE COMPLETITUD API ADMIN =====\n');
    
    try {
      // Escanear rutas del frontend
      await this.scanFrontendRoutes();
      
      // Escanear módulos del backend
      await this.scanBackendModules();
      
      // Analizar coverage
      await this.analyzeCoverage();
      
      // Generar reporte
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Error en auditoría:', error);
      return null;
    }
  }

  async scanFrontendRoutes(dir = this.frontendAPIPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const routePath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanFrontendRoutes(fullPath, routePath);
        } else if (entry.name === 'route.ts') {
          const content = await fs.readFile(fullPath, 'utf8');
          const methods = this.extractHTTPMethods(content);
          
          this.auditResults.frontendRoutes.push({
            path: relativePath || '/',
            methods: methods,
            file: fullPath
          });
        }
      }
    } catch (error) {
      console.error(`Error escaneando ${dir}:`, error.message);
    }
  }

  extractHTTPMethods(content) {
    const methods = [];
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1]);
    }
    
    return methods;
  }

  async scanBackendModules() {
    try {
      const modulesPath = path.join(this.backendPath, 'modules');
      const routesPath = path.join(this.backendPath, 'routes');
      
      // Escanear módulos
      const moduleFiles = await fs.readdir(modulesPath);
      for (const file of moduleFiles) {
        if (file.endsWith('.js')) {
          const moduleName = file.replace('.js', '');
          const filePath = path.join(modulesPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          this.auditResults.backendModules.push({
            name: moduleName,
            type: 'module',
            file: filePath,
            hasClass: content.includes('class '),
            hasExports: content.includes('module.exports')
          });
        }
      }
      
      // Escanear rutas
      const routeFiles = await fs.readdir(routesPath);
      for (const file of routeFiles) {
        if (file.endsWith('.js')) {
          const routeName = file.replace('.js', '');
          const filePath = path.join(routesPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          this.auditResults.backendModules.push({
            name: routeName,
            type: 'route',
            file: filePath,
            hasRouter: content.includes('router.'),
            hasExports: content.includes('module.exports')
          });
        }
      }
      
    } catch (error) {
      console.error('Error escaneando backend:', error.message);
    }
  }

  analyzeCoverage() {
    console.log('📊 Analizando coverage de APIs...\n');
    
    const moduleMap = {
      'users': ['users.js'],
      'packages': ['packages.js', 'tcPackages.js'],
      'bookings': ['bookings.js', 'booking-analytics.js'],
      'settings': ['settings-manager.js'],
      'destinations': ['destinations.js'],
      'fallback': ['smart-fallback-system.js']
    };
    
    this.auditResults.frontendRoutes.forEach(route => {
      const routeName = route.path.split('/')[0] || route.path;
      const expectedModules = moduleMap[routeName] || [];
      
      const hasBackendSupport = expectedModules.some(moduleName => 
        this.auditResults.backendModules.some(module => 
          module.name === moduleName.replace('.js', '')
        )
      );
      
      const coverage = {
        route: route.path,
        methods: route.methods,
        expectedModules: expectedModules,
        hasBackend: hasBackendSupport
      };
      
      if (hasBackendSupport && route.methods.length > 0) {
        this.auditResults.coverage.complete.push(coverage);
      } else if (hasBackendSupport || route.methods.length > 0) {
        this.auditResults.coverage.partial.push(coverage);
      } else {
        this.auditResults.coverage.missing.push(coverage);
      }
    });
  }

  generateReport() {
    console.log('📋 ===== REPORTE DE AUDITORÍA =====\n');
    
    // Estadísticas generales
    const totalRoutes = this.auditResults.frontendRoutes.length;
    const completeRoutes = this.auditResults.coverage.complete.length;
    const partialRoutes = this.auditResults.coverage.partial.length;
    const missingRoutes = this.auditResults.coverage.missing.length;
    
    const completenessRate = totalRoutes > 0 ? ((completeRoutes / totalRoutes) * 100).toFixed(1) : 0;
    
    console.log(`📊 ESTADÍSTICAS GENERALES:`);
    console.log(`   Total rutas frontend: ${totalRoutes}`);
    console.log(`   Rutas completas: ${completeRoutes} (${completenessRate}%)`);
    console.log(`   Rutas parciales: ${partialRoutes}`);
    console.log(`   Rutas faltantes: ${missingRoutes}`);
    console.log(`   Total módulos backend: ${this.auditResults.backendModules.length}\n`);
    
    // Rutas completas
    if (this.auditResults.coverage.complete.length > 0) {
      console.log('✅ RUTAS COMPLETAMENTE IMPLEMENTADAS:');
      this.auditResults.coverage.complete.forEach(route => {
        console.log(`   /${route.route} - Métodos: ${route.methods.join(', ')}`);
      });
      console.log('');
    }
    
    // Rutas parciales
    if (this.auditResults.coverage.partial.length > 0) {
      console.log('⚠️  RUTAS PARCIALMENTE IMPLEMENTADAS:');
      this.auditResults.coverage.partial.forEach(route => {
        console.log(`   /${route.route} - Métodos: ${route.methods.join(', ')} - Backend: ${route.hasBackend ? '✅' : '❌'}`);
      });
      console.log('');
    }
    
    // Rutas faltantes
    if (this.auditResults.coverage.missing.length > 0) {
      console.log('❌ RUTAS CON PROBLEMAS:');
      this.auditResults.coverage.missing.forEach(route => {
        console.log(`   /${route.route} - Métodos: ${route.methods.join(', ') || 'NINGUNO'}`);
      });
      console.log('');
    }
    
    // Módulos backend disponibles
    console.log('🔧 MÓDULOS BACKEND DISPONIBLES:');
    const modules = this.auditResults.backendModules.filter(m => m.type === 'module');
    const routes = this.auditResults.backendModules.filter(m => m.type === 'route');
    
    console.log(`   Módulos (${modules.length}):`);
    modules.forEach(module => {
      console.log(`   - ${module.name} (${module.hasClass ? 'Clase' : 'Funcional'})`);
    });
    
    console.log(`   Rutas (${routes.length}):`);
    routes.forEach(route => {
      console.log(`   - ${route.name} (${route.hasRouter ? 'Router' : 'Basic'})`);
    });
    
    // Estado general
    console.log('\n🎯 ESTADO GENERAL DEL SISTEMA:');
    if (completenessRate >= 90) {
      console.log('🎉 SISTEMA COMPLETAMENTE FUNCIONAL - LISTO PARA PRODUCCIÓN');
    } else if (completenessRate >= 75) {
      console.log('⚠️  SISTEMA MAYORMENTE FUNCIONAL - REVISAR RUTAS FALTANTES');
    } else if (completenessRate >= 50) {
      console.log('🔧 SISTEMA PARCIALMENTE FUNCIONAL - NECESITA TRABAJO');
    } else {
      console.log('🚨 SISTEMA CRÍTICO - REQUIERE DESARROLLO COMPLETO');
    }
    
    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    if (missingRoutes > 0) {
      console.log('• Completar implementación de rutas faltantes');
    }
    if (partialRoutes > 0) {
      console.log('• Revisar integración frontend-backend en rutas parciales');
    }
    console.log('• Ejecutar tests de integración completos');
    console.log('• Validar documentación de APIs');
    
    return {
      totalRoutes,
      completeRoutes,
      partialRoutes,
      missingRoutes,
      completenessRate: parseFloat(completenessRate)
    };
  }
}

// Ejecutar auditoría
if (require.main === module) {
  const auditor = new APICompletenessAuditor();
  auditor.runAudit().catch(console.error);
}

module.exports = APICompletenessAuditor;
