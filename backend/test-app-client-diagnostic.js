const path = require('path');

console.log('🔧 DIAGNÓSTICO ESPECÍFICO - RUTAS APP CLIENTE\n');

// Test 1: Verificar que el archivo existe y es válido
console.log('1️⃣ Verificando archivo app-client.js...');
try {
    const appClientPath = path.join(__dirname, 'routes', 'app-client.js');
    const appClientModule = require('./routes/app-client');
    console.log('✅ Archivo app-client.js cargado correctamente');
    console.log('   Tipo de export:', typeof appClientModule);
    console.log('   Es función router:', typeof appClientModule === 'function');
} catch (error) {
    console.error('❌ Error cargando app-client.js:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
}

// Test 2: Verificar dependencias críticas
console.log('\n2️⃣ Verificando dependencias...');
try {
    const express = require('express');
    console.log('✅ Express disponible');
    
    const bcrypt = require('bcrypt');
    console.log('✅ Bcrypt disponible');
    
    const jwt = require('jsonwebtoken');
    console.log('✅ JWT disponible');
} catch (error) {
    console.error('❌ Error en dependencias:', error.message);
}

// Test 3: Verificar módulo de base de datos
console.log('\n3️⃣ Verificando módulo de base de datos...');
try {
    const { query } = require('./database');
    console.log('✅ Módulo database disponible');
    console.log('   Función query:', typeof query);
} catch (error) {
    console.error('❌ Error en módulo database:', error.message);
    console.error('   Esto puede estar causando el problema!');
}

// Test 4: Simular registro de rutas
console.log('\n4️⃣ Simulando registro de rutas...');
try {
    const express = require('express');
    const app = express();
    
    console.log('   Creando app Express...');
    app.use(express.json());
    
    console.log('   Intentando registrar rutas app-client...');
    const appClientRoutes = require('./routes/app-client');
    app.use('/api/app', appClientRoutes);
    console.log('✅ Rutas registradas exitosamente en simulación');
    
    // Test básico de endpoint
    console.log('   Verificando que las rutas están disponibles...');
    const request = require('supertest');
    
    request(app)
        .get('/api/app/health')
        .expect(200)
        .end((err, res) => {
            if (err) {
                console.error('❌ Error en test de health endpoint:', err.message);
            } else {
                console.log('✅ Health endpoint funciona correctamente');
                console.log('   Respuesta:', res.body.message);
            }
        });
        
} catch (error) {
    console.error('❌ Error en simulación de rutas:', error.message);
    console.error('   Stack completo:', error.stack);
}

console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
console.log('Si ves errores arriba, especialmente en el módulo database,');
console.log('ese es probablemente el problema que impide que las rutas se registren.');
console.log('\nSoluciones posibles:');
console.log('1. Verificar que PostgreSQL esté corriendo');
console.log('2. Verificar variables de entorno de DB');
console.log('3. Verificar que database.js exporta correctamente');
