#!/usr/bin/env node

// ===============================================
// ANALIZADOR DE RESPUESTA CRUDA DE TRAVEL COMPOSITOR
// ===============================================

const tcSafe = require('./travel-compositor-safe.js');

async function analyzeRawResponse() {
  console.log('🔍 ===============================================');
  console.log('🔍 ANALIZANDO RESPUESTA CRUDA COMPLETA');
  console.log('🔍 ===============================================');

  try {
    // 1. Autenticar
    console.log('🔑 Autenticando...');
    const auth = await tcSafe.authenticate();
    
    if (!auth.success) {
      console.log('❌ No se pudo autenticar');
      return;
    }

    // 2. Hacer llamada directa a TC para obtener respuesta SIN normalizar
    console.log('📡 Obteniendo respuesta CRUDA de TC...');
    
    const axios = require('axios');
    const response = await axios.get(`${tcSafe.baseUrl}/package/${tcSafe.auth.micrositeId}`, {
      timeout: tcSafe.timeout,
      headers: {
        'auth-token': tcSafe.authToken,
        'Accept': 'application/json'
      },
      params: {
        limit: 3,
        page: 1,
        offset: 0,
        lang: 'es',
        currency: 'USD',
        onlyVisible: true
      }
    });

    console.log('✅ ¡RESPUESTA CRUDA OBTENIDA!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers: ${JSON.stringify(response.headers['content-type'])}`);
    
    // 3. Analizar estructura completa
    const data = response.data;
    console.log('\n🔍 ESTRUCTURA DE RESPUESTA:');
    console.log(`   Tipo: ${typeof data}`);
    console.log(`   Claves principales: ${Object.keys(data).join(', ')}`);
    
    if (data.package && Array.isArray(data.package)) {
      console.log(`   Total packages: ${data.package.length}`);
      
      // 4. Analizar PRIMER paquete completamente
      const firstPackage = data.package[0];
      console.log('\n📦 PRIMER PAQUETE - DATOS CRUDOS COMPLETOS:');
      console.log('==========================================');
      console.log(JSON.stringify(firstPackage, null, 2));
      
      // 5. Extraer campos específicos
      console.log('\n🔍 ANÁLISIS DE CAMPOS ESPECÍFICOS:');
      console.log('=================================');
      
      console.log('\n🌍 DESTINATIONS:');
      if (firstPackage.destinations) {
        console.log('   Estructura destinations:', JSON.stringify(firstPackage.destinations, null, 2));
      } else {
        console.log('   ❌ NO HAY CAMPO "destinations"');
      }
      
      console.log('\n🏷️ THEMES:');
      if (firstPackage.themes) {
        console.log('   Estructura themes:', JSON.stringify(firstPackage.themes, null, 2));
      } else {
        console.log('   ❌ NO HAY CAMPO "themes"');
      }
      
      console.log('\n📍 OTROS CAMPOS DE UBICACIÓN:');
      console.log(`   country: ${firstPackage.country || 'NO EXISTE'}`);
      console.log(`   region: ${firstPackage.region || 'NO EXISTE'}`);
      console.log(`   location: ${firstPackage.location || 'NO EXISTE'}`);
      console.log(`   place: ${firstPackage.place || 'NO EXISTE'}`);
      console.log(`   city: ${firstPackage.city || 'NO EXISTE'}`);
      
      console.log('\n🏷️ OTROS CAMPOS DE CATEGORÍA:');
      console.log(`   category: ${firstPackage.category || 'NO EXISTE'}`);
      console.log(`   type: ${firstPackage.type || 'NO EXISTE'}`);
      console.log(`   theme: ${firstPackage.theme || 'NO EXISTE'}`);
      
      // 6. Buscar TODOS los campos que contengan info de país/ubicación
      console.log('\n🔍 BÚSQUEDA EN TODOS LOS CAMPOS:');
      const searchCountryFields = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'string') {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('peru') || 
                lowerValue.includes('perú') || 
                lowerValue.includes('lima') ||
                lowerValue.includes('cusco') ||
                lowerValue.includes('argentina') ||
                lowerValue.includes('brasil') ||
                lowerValue.includes('mexico')) {
              console.log(`   🎯 ${fullKey}: "${value}"`);
            }
          } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            searchCountryFields(value, fullKey);
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                searchCountryFields(item, `${fullKey}[${index}]`);
              }
            });
          }
        }
      };
      
      searchCountryFields(firstPackage);
      
    } else {
      console.log('❌ No se encontraron packages en la respuesta');
      console.log('📊 Respuesta completa:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('💥 ERROR:', error.message);
    
    if (error.response) {
      console.log(`📡 Status: ${error.response.status}`);
      console.log(`📡 Data:`, JSON.stringify(error.response.data, null, 2).substring(0, 1000));
    }
  }
}

// Ejecutar análisis
analyzeRawResponse();
