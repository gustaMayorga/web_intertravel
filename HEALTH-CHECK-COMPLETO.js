// HEALTH-CHECK-COMPLETO.js - Verificación completa del sistema InterTravel
// Ejecutar: node HEALTH-CHECK-COMPLETO.js

const http = require('http');
const https = require('https');

console.log('🏥 HEALTH CHECK COMPLETO - INTERTRAVEL');
console.log('======================================');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Función para hacer requests HTTP
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InterTravel-HealthCheck/1.0'
      },
      timeout: 5000
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const lib = urlObj.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Tests específicos
const tests = [
  {
    name: 'Backend Base',
    url: 'http://localhost:3002',
    expected: 200
  },
  {
    name: 'Backend Health',
    url: 'http://localhost:3002/api/health',
    expected: 200
  },
  {
    name: 'App Client Health',
    url: 'http://localhost:3002/api/app/health',
    expected: 200
  },
  {
    name: 'Admin Health',
    url: 'http://localhost:3002/api/admin/health',
    expected: 200
  },
  {
    name: 'Frontend App Cliente',
    url: 'http://localhost:3009',
    expected: 200
  }
];

// Función principal de testing
async function runHealthCheck() {
  console.log(`${colors.blue}Iniciando health check...${colors.reset}\n`);
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      console.log(`🔍 Probando: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const result = await makeRequest(test.url);
      
      if (result.status === test.expected) {
        console.log(`   ${colors.green}✅ PASS${colors.reset} - Status: ${result.status}`);
        passedTests++;
      } else {
        console.log(`   ${colors.red}❌ FAIL${colors.reset} - Status: ${result.status} (esperado: ${test.expected})`);
      }
      
      // Mostrar data si es relevante
      if (result.data && typeof result.data === 'object') {
        console.log(`   Data: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ${colors.red}❌ ERROR${colors.reset} - ${error.message}`);
    }
    
    console.log('');
  }
  
  // Test de autenticación
  console.log(`${colors.blue}🔐 PROBANDO AUTENTICACIÓN...${colors.reset}`);
  try {
    const loginData = {
      email: 'test@test.com',
      password: '123456'
    };
    
    console.log('🔍 Probando login con credenciales de prueba...');
    const loginResult = await makeRequest('http://localhost:3002/api/app/auth/login', 'POST', loginData);
    
    if (loginResult.status === 200 && loginResult.data && loginResult.data.data && loginResult.data.data.token) {
      console.log(`${colors.green}✅ LOGIN OK${colors.reset} - Token recibido`);
      console.log(`   Token: ${loginResult.data.data.token.substring(0, 20)}...`);
      passedTests++;
    } else {
      console.log(`${colors.yellow}⚠️ LOGIN PARCIAL${colors.reset} - Status: ${loginResult.status}`);
      console.log(`   Response: ${JSON.stringify(loginResult.data).substring(0, 150)}...`);
    }
    totalTests++;
  } catch (error) {
    console.log(`${colors.red}❌ LOGIN ERROR${colors.reset} - ${error.message}`);
    totalTests++;
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.blue}RESUMEN DEL HEALTH CHECK${colors.reset}`);
  console.log('='.repeat(50));
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  const status = percentage >= 80 ? 'EXCELENTE' : percentage >= 60 ? 'BUENO' : percentage >= 40 ? 'REGULAR' : 'CRÍTICO';
  const statusColor = percentage >= 80 ? colors.green : percentage >= 60 ? colors.yellow : colors.red;
  
  console.log(`Tests pasados: ${passedTests}/${totalTests}`);
  console.log(`Porcentaje: ${percentage}%`);
  console.log(`Estado: ${statusColor}${status}${colors.reset}`);
  
  if (percentage >= 80) {
    console.log(`\n${colors.green}🎉 SISTEMA FUNCIONANDO CORRECTAMENTE${colors.reset}`);
    console.log('✅ El sistema InterTravel está operativo y listo para usar');
  } else if (percentage >= 60) {
    console.log(`\n${colors.yellow}⚠️ SISTEMA PARCIALMENTE FUNCIONAL${colors.reset}`);
    console.log('🔧 Algunos servicios pueden necesitar atención');
  } else {
    console.log(`\n${colors.red}🚨 SISTEMA CON PROBLEMAS CRÍTICOS${colors.reset}`);
    console.log('❌ Revisar logs y configuración del sistema');
  }
  
  console.log('\n📋 ACCESOS RÁPIDOS:');
  console.log('• Frontend: http://localhost:3009');
  console.log('• Backend: http://localhost:3002');
  console.log('• API Docs: http://localhost:3002/api/health');
  
  console.log('\n🔍 COMANDOS DE VERIFICACIÓN:');
  console.log('• Logs Backend: cd backend && npm run dev');
  console.log('• Logs Frontend: cd app_cliete && npm run dev');
  console.log('• Verificar DB: node database.js');
}

// Ejecutar el health check
runHealthCheck().catch(console.error);