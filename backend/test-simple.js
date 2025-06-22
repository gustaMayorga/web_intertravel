#!/usr/bin/env node

// Test simple con logging
const axios = require('axios');

async function testWithLogging() {
  console.log('🧪 INICIANDO TEST CON LOGGING...\n');
  
  const baseURL = 'http://localhost:3002';
  
  try {
    // 1. Test health
    console.log('1. Testing health endpoint...');
    const health = await axios.get(baseURL + '/api/health');
    console.log('✅ Health TC:', health.data.services.travelCompositor);
    console.log('✅ Health DB:', health.data.services.database);
    
    // 2. Test packages
    console.log('\n2. Testing packages endpoint...');
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
      
      console.log('\n📊 Análisis de diversidad:');
      console.log('   Países únicos: ' + countries.length);
      console.log('   Categorías únicas: ' + categories.length);
      console.log('   Primeros 5 países: ' + countries.slice(0, 5).join(', '));
      
      const sample = packages.data.packages[0];
      console.log('\n📦 Paquete de muestra:');
      console.log('   ID: ' + sample.id);
      console.log('   Title: ' + sample.title);
      console.log('   Country: ' + sample.country);
      console.log('   Source: ' + sample._source);
    }
    
    console.log('\n🎉 Test completado exitosamente!');
    
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

module.exports = testWithLogging;