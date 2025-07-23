// Test directo para verificar si app-client.js se puede cargar
console.log('🔧 TESTING: Carga directa de app-client.js...\n');

try {
    console.log('1️⃣ Intentando cargar app-client.js...');
    const appClientRoutes = require('./routes/app-client');
    console.log('✅ app-client.js cargado exitosamente');
    console.log('   Tipo:', typeof appClientRoutes);
    console.log('   Es función router:', typeof appClientRoutes === 'function');
    
    console.log('\n2️⃣ Probando crear servidor de prueba...');
    const express = require('express');
    const testApp = express();
    
    testApp.use(express.json());
    testApp.use('/api/app', appClientRoutes);
    
    console.log('✅ Rutas registradas en servidor de prueba');
    
    const server = testApp.listen(3003, () => {
        console.log('✅ Servidor de prueba iniciado en puerto 3003');
        console.log('\n🧪 PRUEBA ESTO EN OTRA TERMINAL:');
        console.log('curl -X GET "http://localhost:3003/api/app/health"');
        console.log('\nSi funciona, el problema está en server.js');
        console.log('Si no funciona, app-client.js tiene errores');
        
        setTimeout(() => {
            server.close();
            console.log('\n✅ Servidor de prueba cerrado');
        }, 30000);
    });
    
} catch (error) {
    console.error('❌ ERROR CARGANDO app-client.js:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    
    console.log('\n🔧 DIAGNÓSTICO:');
    if (error.message.includes('database')) {
        console.log('❌ El problema sigue siendo el módulo database');
        console.log('   Verificando si la corrección se aplicó...');
        
        const fs = require('fs');
        const content = fs.readFileSync('./routes/app-client.js', 'utf8');
        
        if (content.includes('try {') && content.includes('Database not available')) {
            console.log('✅ Corrección aplicada correctamente');
            console.log('❌ Pero hay otro problema en database.js');
        } else {
            console.log('❌ La corrección NO se aplicó correctamente');
            console.log('   El archivo sigue teniendo require directo');
        }
    }
    
    process.exit(1);
}
