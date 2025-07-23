// ===============================================
// QA TESTING SIMPLE - SIN DEPENDENCIAS EXTERNAS
// Solo usando módulos nativos de Node.js
// ===============================================

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { URL } = require('url');

class SimpleQATester {
  constructor() {
    this.issues = [];
    this.testResults = {};
    this.startTime = new Date();
    
    this.urls = {
      backend: 'http://localhost:3002',
      frontend: 'http://localhost:3005',
      appCliente: 'http://localhost:3009'
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = {
      'info': '✅',
      'error': '❌', 
      'warning': '⚠️',
      'test': '🧪',
      'success': '🎉',
      'critical': '🚨'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testEndpoint(name, urlString, timeout = 5000) {
    return new Promise((resolve) => {
      try {
        const url = new URL(urlString);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          timeout: timeout
        };

        const req = client.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
              this.log(`${name}: OK (${res.statusCode})`, 'success');
              resolve({ success: true, status: res.statusCode, data });
            } else {
              this.log(`${name}: Error ${res.statusCode}`, 'error');
              resolve({ success: false, status: res.statusCode, error: `HTTP ${res.statusCode}` });
            }
          });
        });

        req.on('error', (error) => {
          this.log(`${name}: ${error.message}`, 'error');
          resolve({ success: false, status: 0, error: error.message });
        });

        req.on('timeout', () => {
          req.destroy();
          this.log(`${name}: Timeout`, 'error');
          resolve({ success: false, status: 0, error: 'Timeout' });
        });

        req.end();
      } catch (error) {
        this.log(`${name}: ${error.message}`, 'error');
        resolve({ success: false, status: 0, error: error.message });
      }
    });
  }

  async testBasicConnectivity() {
    this.log('🔍 TESTING CONECTIVIDAD BÁSICA', 'test');
    
    const tests = [
      { name: 'Backend Health', url: `${this.urls.backend}/api/health` },
      { name: 'Backend Root', url: this.urls.backend },
      { name: 'Frontend', url: this.urls.frontend },
      { name: 'App Cliente', url: this.urls.appCliente }
    ];

    let passed = 0;
    
    for (const test of tests) {
      const result = await this.testEndpoint(test.name, test.url);
      if (result.success) {
        passed++;
      }
    }

    this.log(`Conectividad: ${passed}/${tests.length} servicios OK`, passed === tests.length ? 'success' : 'warning');
    return { passed, total: tests.length };
  }

  async testCriticalEndpoints() {
    this.log('🎯 TESTING ENDPOINTS CRÍTICOS', 'test');
    
    const endpoints = [
      `${this.urls.backend}/api/health`,
      `${this.urls.backend}/api/packages`,
      `${this.urls.backend}/api/admin/auth/login`,
      `${this.urls.frontend}/admin`,
      `${this.urls.frontend}/admin/login`
    ];

    let passed = 0;
    
    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(`API ${endpoint.split('/').pop()}`, endpoint);
      if (result.success) {
        passed++;
      }
      // Pausa pequeña entre requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.log(`Endpoints: ${passed}/${endpoints.length} funcionando`, passed >= 3 ? 'success' : 'warning');
    return { passed, total: endpoints.length };
  }

  async generateSimpleReport() {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    this.log('🚀 INICIANDO QA TESTING SIMPLE...', 'test');
    
    const connectivityResult = await this.testBasicConnectivity();
    const endpointsResult = await this.testCriticalEndpoints();
    
    const totalTests = connectivityResult.total + endpointsResult.total;
    const totalPassed = connectivityResult.passed + endpointsResult.passed;
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log('\n📊 ===============================================');
    console.log('📊 RESUMEN QA TESTING SIMPLE');
    console.log('📊 ===============================================');
    console.log(`⏱️ Duración: ${duration} segundos`);
    console.log(`✅ Tests pasados: ${totalPassed}/${totalTests}`);
    console.log(`📈 Success rate: ${successRate}%`);
    
    if (totalPassed >= 6) {
      console.log('\n🎉 ¡SISTEMA BÁSICAMENTE FUNCIONAL!');
      console.log('✅ Servicios principales respondiendo');
      console.log('🔄 Para testing completo ejecute: EJECUTAR-QA-TESTING-COMPLETO.bat');
    } else if (totalPassed >= 3) {
      console.log('\n⚠️ SISTEMA PARCIALMENTE FUNCIONAL');
      console.log('🔧 Algunos servicios necesitan atención');
      console.log('💡 Verificar que todos los servicios estén ejecutándose');
    } else {
      console.log('\n🚨 SISTEMA REQUIERE ATENCIÓN');
      console.log('❌ Servicios principales no responden');
      console.log('🔧 Verificar configuración y servicios');
    }
    
    console.log('\n🌐 URLs del sistema:');
    console.log(`   Backend:  ${this.urls.backend}`);
    console.log(`   Frontend: ${this.urls.frontend}`);
    console.log(`   App:      ${this.urls.appCliente}`);
    console.log(`   Admin:    ${this.urls.frontend}/admin`);
    
    console.log('\n📋 Próximos pasos:');
    if (totalPassed < 6) {
      console.log('   1. Verificar servicios ejecutándose');
      console.log('   2. Instalar dependencias: INSTALAR-DEPENDENCIAS-COMPLETO.bat');
      console.log('   3. Re-ejecutar testing');
    } else {
      console.log('   1. Ejecutar testing completo con dependencias');
      console.log('   2. Verificar base de datos');
      console.log('   3. Proceder con verificación detallada');
    }
    
    console.log('📊 ===============================================\n');
    
    return totalPassed >= 6;
  }
}

// Ejecución
async function main() {
  const tester = new SimpleQATester();
  
  try {
    const success = await tester.generateSimpleReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('💥 Error en testing:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SimpleQATester };
