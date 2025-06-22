// DIAGNÓSTICO TRAVEL COMPOSITOR - INTERTRAVEL
const axios = require('axios');

const diagnosticoTravelCompositor = async () => {
  console.log('🔍 DIAGNÓSTICO TRAVEL COMPOSITOR - INTERTRAVEL');
  console.log('==============================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');
  
  const config = {
    baseURL: 'https://online.travelcompositor.com',
    timeout: 30000, // 30 segundos
    headers: {
      'User-Agent': 'InterTravel-Diagnostic/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  
  // Test 1: Conectividad básica
  console.log('1️⃣ Testing conectividad básica...');
  try {
    const start = Date.now();
    const response = await axios.get('/', config);
    const duration = Date.now() - start;
    console.log(`✅ Conectividad OK - Status: ${response.status} - Tiempo: ${duration}ms`);
  } catch (error) {
    console.log(`❌ Error conectividad: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
    }
  }
  console.log('');
  
  // Test 2: Endpoints comunes de health/status
  const healthEndpoints = [
    '/api/health',
    '/api/status', 
    '/api/v1/status',
    '/status',
    '/health',
    '/ping'
  ];
  
  console.log('2️⃣ Testing endpoints de health...');
  for (const endpoint of healthEndpoints) {
    try {
      const start = Date.now();
      const response = await axios.get(endpoint, config);
      const duration = Date.now() - start;
      console.log(`✅ ${endpoint} - Status: ${response.status} - Tiempo: ${duration}ms`);
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.response?.status || error.message}`);
    }
  }
  console.log('');
  
  // Test 3: Endpoints de autenticación
  console.log('3️⃣ Testing endpoints de autenticación...');
  const authTests = [
    { url: '/api/auth/login', data: { username: 'ApiUser1', password: 'Veoveo77*', microsite: 'intertravelgroup' } },
    { url: '/api/v1/auth', data: { apiUser: 'ApiUser1', apiKey: 'Veoveo77*', micrositeId: 'intertravelgroup' } }
  ];
  
  for (const test of authTests) {
    try {
      const start = Date.now();
      const response = await axios.post(test.url, test.data, config);
      const duration = Date.now() - start;
      console.log(`✅ ${test.url} - Status: ${response.status} - Tiempo: ${duration}ms`);
    } catch (error) {
      console.log(`❌ ${test.url} - Error: ${error.response?.status || error.message}`);
    }
  }
  console.log('');
  
  console.log('📊 DIAGNÓSTICO COMPLETADO');
  console.log('Incluir estos resultados en el email a Travel Compositor');
};

// Ejecutar diagnóstico
diagnosticoTravelCompositor().catch(console.error);