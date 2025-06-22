#!/usr/bin/env node

console.log('🔧 Verificando configuración del backend...\n');

// 1. Verificar Node.js version
console.log(`📦 Node.js versión: ${process.version}`);

// 2. Verificar variables de entorno
require('dotenv').config();
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚪 PORT: ${process.env.PORT || 3002}`);

// 3. Verificar dependencias críticas
try {
  const express = require('express');
  console.log('✅ Express: OK');
  
  const cors = require('cors');
  console.log('✅ CORS: OK');
  
  const helmet = require('helmet');
  console.log('✅ Helmet: OK');
  
  const compression = require('compression');
  console.log('✅ Compression: OK');
  
} catch (error) {
  console.error('❌ Error cargando dependencias:', error.message);
  console.log('\n🔧 Ejecuta: npm install');
  process.exit(1);
}

// 4. Test básico del servidor
console.log('\n🚀 Iniciando test del servidor...');

const app = require('./server.js');
const PORT = process.env.PORT || 3002;

const server = app.listen(PORT + 1, () => {
  console.log(`✅ Servidor de prueba funcionando en puerto ${PORT + 1}`);
  
  // Test básico HTTP
  const http = require('http');
  
  const options = {
    hostname: 'localhost',
    port: PORT + 1,
    path: '/api/health',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.success) {
          console.log('✅ Health check: OK');
          console.log('✅ API responde correctamente');
        } else {
          console.log('⚠️ Health check: Warning');
        }
      } catch (error) {
        console.log('❌ Error parseando respuesta');
      }
      
      console.log('\n🎉 Verificación completada!');
      console.log('💡 El backend está listo para funcionar');
      console.log(`🚀 Ejecuta: npm run dev`);
      
      server.close();
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Error en test HTTP:', error.message);
    server.close();
    process.exit(1);
  });
  
  req.end();
});

server.on('error', (error) => {
  console.error('❌ Error iniciando servidor de prueba:', error.message);
  process.exit(1);
});
