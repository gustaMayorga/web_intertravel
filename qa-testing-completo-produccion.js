// ===============================================
// QA TESTING COMPLETO - SISTEMA INTERTRAVEL
// Verificación integral con registro de problemas
// ===============================================

const axios = require('axios').default;
const fs = require('fs').promises;
const path = require('path');

class QATesterProduccion {
  constructor() {
    this.issues = [];
    this.testResults = {};
    this.startTime = new Date();
    this.reportPath = path.join(__dirname, 'qa-testing-report.json');
    
    // URLs del sistema
    this.urls = {
      backend: 'http://localhost:3002',
      frontend: 'http://localhost:3005',
      appCliente: 'http://localhost:3009'
    };
    
    // Configuración de testing
    this.timeout = 10000; // 10 segundos timeout
    this.retries = 3;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '✅',
      'error': '❌', 
      'warning': '⚠️',
      'test': '🧪',
      'success': '🎉',
      'critical': '🚨'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
  }

  logIssue(severity, component, description, solution = null, url = null) {
    const issue = {
      id: this.issues.length + 1,
      timestamp: new Date().toISOString(),
      severity, // 'critical', 'high', 'medium', 'low'
      component,
      description,
      solution,
      url,
      status: 'open'
    };
    
    this.issues.push(issue);
    
    const emoji = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '⚡',
      'low': '💡'
    }[severity];
    
    this.log(`ISSUE #${issue.id}: ${component} - ${description}`, severity === 'critical' ? 'critical' : 'error');
    if (solution) {
      this.log(`  💡 Solución sugerida: ${solution}`, 'info');
    }
    if (url) {
      this.log(`  🔗 URL afectada: ${url}`, 'info');
    }
  }

  async testEndpoint(name, url, expectedStatus = 200, retries = this.retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, { 
          timeout: this.timeout,
          validateStatus: () => true // No lanzar error por status
        });
        
        if (response.status === expectedStatus) {
          this.log(`${name}: OK (${response.status})`, 'success');
          return { success: true, status: response.status, data: response.data };
        } else {
          if (attempt === retries) {
            this.logIssue('high', name, `Status incorrecto: esperado ${expectedStatus}, recibido ${response.status}`, 
                          'Verificar configuración del endpoint', url);
          }
        }
      } catch (error) {
        if (attempt === retries) {
          this.logIssue('critical', name, `No responde: ${error.message}`, 
                        'Verificar que el servicio esté ejecutándose', url);
        } else {
          this.log(`${name}: Intento ${attempt}/${retries} falló, reintentando...`, 'warning');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        }
      }
    }
    
    return { success: false, status: 0, error: 'Falló después de reintentos' };
  }

  async testComponent(name, testFunction) {
    this.log(`Testing ${name}...`, 'test');
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults[name] = { 
        status: 'pass', 
        result, 
        duration,
        timestamp: new Date().toISOString()
      };
      
      this.log(`${name}: PASSED (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults[name] = { 
        status: 'fail', 
        error: error.message, 
        duration,
        timestamp: new Date().toISOString()
      };
      
      this.logIssue('high', name, error.message, null, null);
      return false;
    }
  }

  // ===============================================
  // FASE 1: INFRAESTRUCTURA CRÍTICA
  // ===============================================
  
  async testInfrastructure() {
    this.log('🏗️ FASE 1: INFRAESTRUCTURA CRÍTICA', 'test');

    // Backend Health Check
    await this.testComponent('Backend Health', async () => {
      const result = await this.testEndpoint('Backend Health', `${this.urls.backend}/api/health`);
      if (!result.success) throw new Error('Backend no responde health check');
      return result;
    });

    // Frontend Health Check
    await this.testComponent('Frontend Health', async () => {
      const result = await this.testEndpoint('Frontend Landing', this.urls.frontend);
      if (!result.success) throw new Error('Frontend no carga');
      return result;
    });

    // App Cliente Health Check
    await this.testComponent('App Cliente Health', async () => {
      const result = await this.testEndpoint('App Cliente', this.urls.appCliente);
      if (!result.success) throw new Error('App Cliente no carga');
      return result;
    });

    // Database Connection Test
    await this.testComponent('Database Connection', async () => {
      const result = await this.testEndpoint('Database Test', `${this.urls.backend}/api/db-test`);
      if (!result.success) {
        // Intentar endpoint alternativo
        const altResult = await this.testEndpoint('Admin Login Test', `${this.urls.backend}/api/admin/auth/test`);
        if (!altResult.success) {
          throw new Error('Base de datos no conectada - verificar PostgreSQL');
        }
      }
      return result;
    });
  }

  // ===============================================
  // FASE 2: APIS EXTERNAS SIN MOCKS
  // ===============================================
  
  async testExternalAPIs() {
    this.log('🌐 FASE 2: APIS EXTERNAS SIN MOCKS', 'test');

    // Travel Compositor API
    await this.testComponent('Travel Compositor', async () => {
      const result = await this.testEndpoint('Packages API', `${this.urls.backend}/api/packages`);
      if (!result.success) throw new Error('Travel Compositor no responde');
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        this.log(`Paquetes cargados: ${result.data.length}`, 'info');
        
        // Verificar estructura de datos
        const firstPackage = result.data[0];
        if (!firstPackage.name || !firstPackage.price) {
          this.logIssue('medium', 'Travel Compositor', 
                       'Estructura de datos incompleta en paquetes', 
                       'Verificar mapeo de datos desde API externa');
        }
      } else {
        this.logIssue('high', 'Travel Compositor', 
                     'No se cargaron paquetes', 
                     'Verificar conexión con APIs externas');
      }
      
      return result;
    });

    // Admin Authentication API
    await this.testComponent('Admin Auth API', async () => {
      const loginData = {
        email: 'admin@intertravel.com',
        password: 'admin123'
      };
      
      try {
        const response = await axios.post(
          `${this.urls.backend}/api/admin/auth/login`, 
          loginData,
          { timeout: this.timeout }
        );
        
        if (response.status === 200 && response.data.token) {
          this.log('Admin authentication: TOKEN GENERADO', 'success');
          return response.data;
        } else {
          throw new Error('No se generó token JWT');
        }
      } catch (error) {
        throw new Error(`Admin auth falló: ${error.message}`);
      }
    });
  }

  // ===============================================
  // FASE 3: SISTEMA ADMIN COMPLETO
  // ===============================================
  
  async testAdminSystem() {
    this.log('🔧 FASE 3: SISTEMA ADMIN COMPLETO', 'test');

    // Admin Dashboard
    await this.testComponent('Admin Dashboard', async () => {
      const result = await this.testEndpoint('Admin Dashboard', `${this.urls.frontend}/admin`);
      if (!result.success) throw new Error('Admin dashboard no carga');
      return result;
    });

    // Admin Login Page
    await this.testComponent('Admin Login Page', async () => {
      const result = await this.testEndpoint('Admin Login', `${this.urls.frontend}/admin/login`);
      if (!result.success) throw new Error('Página de login admin no carga');
      return result;
    });

    // Dashboard Stats API
    await this.testComponent('Dashboard Stats', async () => {
      const result = await this.testEndpoint('Dashboard Stats', `${this.urls.backend}/api/admin/dashboard/stats`);
      if (!result.success) {
        this.logIssue('medium', 'Dashboard Stats', 
                     'Estadísticas no cargan', 
                     'Verificar queries de estadísticas en backend');
      }
      return result;
    });

    // Packages Management
    await this.testComponent('Packages Management', async () => {
      const result = await this.testEndpoint('Packages Admin', `${this.urls.frontend}/admin/packages`);
      if (!result.success) throw new Error('Gestión de paquetes no carga');
      return result;
    });
  }

  // ===============================================
  // FASE 4: APP CLIENTE CON DNI
  // ===============================================
  
  async testClientApp() {
    this.log('📱 FASE 4: APP CLIENTE CON DNI', 'test');

    // App Cliente Landing
    await this.testComponent('App Cliente Landing', async () => {
      const result = await this.testEndpoint('App Cliente Home', this.urls.appCliente);
      if (!result.success) throw new Error('App cliente no carga');
      return result;
    });

    // DNI Authentication Test
    await this.testComponent('DNI Authentication', async () => {
      const testDNI = '12345678';
      const result = await this.testEndpoint(
        'DNI Test', 
        `${this.urls.backend}/api/users/dni/${testDNI}`,
        null // Cualquier status es aceptable para este test
      );
      
      // Este endpoint puede retornar 404 si el DNI no existe, eso es normal
      if (result.status === 404) {
        this.log('DNI endpoint funciona (404 esperado para DNI de prueba)', 'info');
        return { dni_endpoint_working: true };
      } else if (result.status === 200) {
        this.log('DNI encontrado en sistema', 'success');
        return result;
      } else {
        throw new Error(`DNI endpoint error inesperado: ${result.status}`);
      }
    });
  }

  // ===============================================
  // FASE 5: FRONTEND PÚBLICO
  // ===============================================
  
  async testFrontend() {
    this.log('🎨 FASE 5: FRONTEND PÚBLICO', 'test');

    // Landing Page Principal
    await this.testComponent('Landing Page', async () => {
      const result = await this.testEndpoint('Landing Home', this.urls.frontend);
      if (!result.success) throw new Error('Landing page no carga');
      return result;
    });

    // Página de Paquetes
    await this.testComponent('Packages Page', async () => {
      const result = await this.testEndpoint('Packages Page', `${this.urls.frontend}/paquetes`);
      if (!result.success) throw new Error('Página de paquetes no carga');
      return result;
    });

    // Página Nosotros
    await this.testComponent('About Page', async () => {
      const result = await this.testEndpoint('About Page', `${this.urls.frontend}/nosotros`);
      if (!result.success) {
        this.logIssue('low', 'About Page', 
                     'Página nosotros no carga', 
                     'Verificar ruta /nosotros existe');
      }
      return result;
    });
  }

  // ===============================================
  // MÉTODOS DE REPORTE Y ANÁLISIS
  // ===============================================
  
  async generateDetailedReport() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const report = {
      metadata: {
        timestamp: endTime.toISOString(),
        duration_seconds: duration,
        total_tests: Object.keys(this.testResults).length,
        system_urls: this.urls
      },
      summary: {
        total_tests: Object.keys(this.testResults).length,
        passed_tests: Object.values(this.testResults).filter(r => r.status === 'pass').length,
        failed_tests: Object.values(this.testResults).filter(r => r.status === 'fail').length,
        total_issues: this.issues.length,
        critical_issues: this.issues.filter(i => i.severity === 'critical').length,
        high_issues: this.issues.filter(i => i.severity === 'high').length,
        medium_issues: this.issues.filter(i => i.severity === 'medium').length,
        low_issues: this.issues.filter(i => i.severity === 'low').length
      },
      test_results: this.testResults,
      issues: this.issues,
      resolution_paths: this.generateResolutionPaths()
    };

    // Guardar reporte en archivo JSON
    try {
      await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2));
      this.log(`Reporte guardado en: ${this.reportPath}`, 'success');
    } catch (error) {
      this.log(`Error guardando reporte: ${error.message}`, 'error');
    }

    return report;
  }

  generateResolutionPaths() {
    const paths = {
      immediate_actions: [],
      critical_fixes: [],
      high_priority_fixes: [],
      automated_scripts: [
        'REPARAR-ERRORES-COMPLETO.bat',
        'FIX-FRONTEND-ERRORS.bat', 
        'DIAGNOSTICO-POSTGRESQL.bat',
        'CORREGIR-AUTENTICACION-ADMIN.bat'
      ],
      verification_commands: [
        'node qa-testing-completo-produccion.js',
        'node test-sistema-completo.js',
        'node HEALTH-CHECK-COMPLETO.js'
      ]
    };

    // Generar acciones basadas en issues encontrados
    this.issues.forEach(issue => {
      if (issue.severity === 'critical') {
        paths.immediate_actions.push({
          issue_id: issue.id,
          action: `RESOLVER INMEDIATAMENTE: ${issue.component}`,
          description: issue.description,
          solution: issue.solution
        });
      } else if (issue.severity === 'high') {
        paths.critical_fixes.push({
          issue_id: issue.id,
          action: `Resolver en < 24h: ${issue.component}`,
          description: issue.description,
          solution: issue.solution
        });
      }
    });

    return paths;
  }

  printFinalReport(report) {
    console.log('\n📊 ===============================================');
    console.log('📊 REPORTE FINAL QA TESTING PRODUCCIÓN');
    console.log('📊 ===============================================');
    console.log(`⏱️ Duración total: ${report.metadata.duration_seconds} segundos`);
    console.log(`✅ Tests pasados: ${report.summary.passed_tests}/${report.summary.total_tests}`);
    console.log(`❌ Tests fallidos: ${report.summary.failed_tests}/${report.summary.total_tests}`);
    console.log(`📈 Success rate: ${((report.summary.passed_tests / report.summary.total_tests) * 100).toFixed(1)}%`);
    
    // Análisis de issues
    console.log(`\n🐛 ISSUES ENCONTRADOS: ${report.summary.total_issues}`);
    console.log(`🚨 Críticos: ${report.summary.critical_issues}`);
    console.log(`⚠️ Altos: ${report.summary.high_issues}`);
    console.log(`⚡ Medios: ${report.summary.medium_issues}`);
    console.log(`💡 Bajos: ${report.summary.low_issues}`);
    
    // Estado del sistema
    if (report.summary.critical_issues === 0 && report.summary.high_issues === 0) {
      console.log('\n🎉 ¡SISTEMA LISTO PARA PRODUCCIÓN!');
      console.log('✅ No se encontraron issues críticos o altos');
      console.log('🚀 Puede proceder con el deployment');
    } else if (report.summary.critical_issues === 0) {
      console.log('\n⚠️ SISTEMA FUNCIONAL CON ISSUES MENORES');
      console.log('✅ No hay issues críticos');
      console.log('🔧 Resolver issues altos antes del deployment');
    } else {
      console.log('\n🚨 SISTEMA REQUIERE ATENCIÓN INMEDIATA');
      console.log('❌ Issues críticos deben resolverse AHORA');
      console.log('⛔ NO DEPLOYAR hasta resolver issues críticos');
    }

    // Acciones inmediatas
    if (report.resolution_paths.immediate_actions.length > 0) {
      console.log('\n🚨 ACCIONES INMEDIATAS REQUERIDAS:');
      report.resolution_paths.immediate_actions.forEach(action => {
        console.log(`   • ${action.action}`);
        console.log(`     ${action.description}`);
        if (action.solution) {
          console.log(`     💡 ${action.solution}`);
        }
      });
    }

    // Scripts de reparación
    console.log('\n🛠️ SCRIPTS DE REPARACIÓN DISPONIBLES:');
    report.resolution_paths.automated_scripts.forEach(script => {
      console.log(`   • ${script}`);
    });

    console.log('\n📋 PRÓXIMOS PASOS:');
    if (report.summary.critical_issues > 0) {
      console.log('   1. 🚨 RESOLVER ISSUES CRÍTICOS INMEDIATAMENTE');
      console.log('   2. 🔧 Ejecutar scripts de reparación');
      console.log('   3. 🧪 Re-ejecutar testing completo');
      console.log('   4. ✅ Verificar resolución de todos los issues');
    } else {
      console.log('   1. 🔧 Resolver issues altos si los hay');
      console.log('   2. 🧪 Testing final de regresión');
      console.log('   3. 🚀 Preparar deployment a staging');
      console.log('   4. 🎉 Deploy a producción');
    }

    console.log(`\n📄 Reporte completo guardado en: ${this.reportPath}`);
    console.log('📊 ===============================================\n');
  }

  // ===============================================
  // MÉTODO PRINCIPAL DE EJECUCIÓN
  // ===============================================
  
  async runCompleteVerification() {
    this.log('🚀 INICIANDO QA TESTING COMPLETO DE PRODUCCIÓN...', 'test');
    this.log('📁 Directorio: D:\\Inter\\intertravel-website\\WEB-FINAL-UNIFICADA', 'info');
    this.log('🎯 Objetivo: Verificación 100% sin mocks', 'info');
    
    try {
      // Ejecutar todas las fases
      await this.testInfrastructure();
      await this.testExternalAPIs();
      await this.testAdminSystem();
      await this.testClientApp();
      await this.testFrontend();
      
      // Generar reporte final
      const report = await this.generateDetailedReport();
      this.printFinalReport(report);
      
      // Retornar éxito/fallo basado en issues críticos
      return report.summary.critical_issues === 0;
      
    } catch (error) {
      this.log(`Error durante verificación: ${error.message}`, 'critical');
      this.logIssue('critical', 'Testing Framework', 
                   `Error en framework de testing: ${error.message}`, 
                   'Verificar configuración de testing');
      return false;
    }
  }
}

// ===============================================
// EJECUCIÓN DEL SCRIPT
// ===============================================

async function main() {
  const tester = new QATesterProduccion();
  
  console.log('🔍 ===============================================');
  console.log('🔍 QA TESTING INTERTRAVEL - VERIFICACIÓN PRODUCCIÓN');
  console.log('🔍 ===============================================');
  console.log('📅 Fecha:', new Date().toLocaleDateString('es-AR'));
  console.log('⏰ Hora:', new Date().toLocaleTimeString('es-AR'));
  console.log('🎯 Modalidad: SIN MOCKS - Solo conexiones reales');
  console.log('🔍 ===============================================\n');

  const success = await tester.runCompleteVerification();
  
  if (success) {
    console.log('🎉 VERIFICACIÓN EXITOSA - Sistema listo para producción');
    process.exit(0);
  } else {
    console.log('❌ VERIFICACIÓN FALLÓ - Revisar issues y re-ejecutar');
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error crítico en testing:', error);
    process.exit(1);
  });
}

module.exports = { QATesterProduccion };
