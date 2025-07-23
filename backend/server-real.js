// ===============================================
// SERVIDOR BACKEND REAL - CONECTADO A BD
// Migración del emergency server a backend real
// ===============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3002;

// ===============================================
// INICIALIZAR BASE DE DATOS
// ===============================================
const { connect: connectDB, initializeDatabase } = require('./database');

// ===============================================
// MIDDLEWARE BÁSICO
// ===============================================
app.use(cors({
  origin: ['http://localhost:3009', 'http://localhost:3000', 'http://localhost:3005'],
  credentials: true
}));
app.use(express.json());

// Logging mejorado
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ===============================================
// MIDDLEWARE DE AUTH CON BYPASS PARA DESARROLLO
// ===============================================
app.use('/api/admin', (req, res, next) => {
  // Bypass auth en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      id: 1,
      username: 'admin',
      role: 'super_admin',
      email: 'admin@intertravel.com'
    };
    console.log('🔓 Bypass auth aplicado para:', req.originalUrl);
  }
  next();
});

// ===============================================
// RUTAS ADMIN REALES - CONECTADAS A BD
// ===============================================
try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Rutas ADMIN reales cargadas (conectadas a BD)');
} catch (error) {
  console.error('❌ Error cargando rutas admin:', error.message);
  
  // Fallback al emergency admin
  try {
    const emergencyAdminRoutes = require('./emergency-admin');
    app.use('/api/admin', emergencyAdminRoutes);
    console.log('🚨 Rutas ADMIN de emergencia cargadas (mock data)');
  } catch (emergencyError) {
    console.error('❌ Error cargando emergency admin:', emergencyError.message);
  }
}

// ===============================================
// RUTAS APP CLIENTE
// ===============================================
try {
  const appClientRoutes = require('./routes/app-client');
  app.use('/api/app', appClientRoutes);
  console.log('✅ Rutas APP CLIENT cargadas');
} catch (error) {
  console.warn('⚠️ App client routes no disponibles:', error.message);
}

// ===============================================
// RUTAS DE INTEGRACIONES EXTERNAS - FASE 4
// ===============================================
try {
  const integrationsRoutes = require('./routes/integrations');
  app.use('/api/integrations', integrationsRoutes);
  console.log('✅ Rutas INTEGRACIONES cargadas (WhatsApp, Pagos, Analytics)');
} catch (error) {
  console.warn('⚠️ Integration routes no disponibles:', error.message);
}

// ===============================================
// RUTAS DE VINCULACIÓN POR DNI - CRÍTICO PARA LANZAMIENTO
// ===============================================
try {
  const dniLinkingRoutes = require('./routes/dni-linking');
  app.use('/api/app', dniLinkingRoutes);
  app.use('/api/admin', dniLinkingRoutes);
  console.log('✅ Rutas VINCULACIÓN DNI cargadas (CRÍTICO)');
} catch (error) {
  console.warn('⚠️ DNI linking routes no disponibles:', error.message);
}

// ===============================================
// HEALTH CHECK
// ===============================================
app.get('/api/health', async (req, res) => {
  try {
    const { healthCheck } = require('./database');
    const dbHealth = await healthCheck();
    
    res.json({
      success: true,
      message: 'InterTravel Backend Real - Conectado a BD',
      timestamp: new Date().toISOString(),
      version: 'FASE-4-INTEGRACIONES',
      database: dbHealth.healthy ? 'connected' : 'disconnected',
      services: {
        admin_panel: 'active',
        app_client: 'active',
        integrations: 'active',
        database: dbHealth.healthy ? 'connected' : 'error'
      },
      endpoints: {
        admin: '/api/admin/*',
        app_client: '/api/app/*',
        integrations: '/api/integrations/*',
        health: '/api/health'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// ===============================================
// 404 HANDLER
// ===============================================
app.use('/api/*', (req, res) => {
  console.log(`❌ API endpoint no encontrado: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
    availableEndpoints: [
    '/api/health',
    '/api/admin/*',
    '/api/app/*',
      '/api/integrations/*'
      ]
  });
});

// ===============================================
// ERROR HANDLER
// ===============================================
app.use((error, req, res, next) => {
  console.error('❌ Error global:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

// ===============================================
// INICIALIZACIÓN CON BD
// ===============================================
async function startRealServer() {
  try {
    console.log('🚀 ===============================================');
    console.log('🚀 INICIANDO BACKEND REAL - FASE 1');
    console.log('🚀 ===============================================');
    
    // Conectar BD
    console.log('🔧 Conectando a la base de datos...');
    await connectDB();
    console.log('✅ Base de datos conectada');
    
    // Inicializar esquemas
    console.log('🔧 Inicializando esquemas de BD...');
    await initializeDatabase();
    console.log('✅ Base de datos inicializada');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('🚀 ===============================================');
      console.log(`🚀 BACKEND REAL FUNCIONANDO - Puerto ${PORT}`);
      console.log('🚀 FASE 1: Conexión admin→backend→BD COMPLETA');
      console.log('🚀 ===============================================');
      console.log('✅ FUNCIONALIDADES ACTIVAS:');
      console.log(`   👑 Admin Panel: http://localhost:${PORT}/api/admin/*`);
      console.log(`   📱 App Client: http://localhost:${PORT}/api/app/*`);
      console.log(`   🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log('🚀 ===============================================');
      console.log('💾 DATOS REALES desde PostgreSQL');
      console.log('🔄 Emergency server NO necesario');
      console.log('🚀 ===============================================');
    });
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en backend real:', error);
    console.error('📋 Soluciones:');
    console.error('   1. Verificar PostgreSQL está corriendo');
    console.error('   2. Verificar credenciales en .env');
    console.error('   3. Usar emergency server como fallback');
    console.error('');
    console.error('🚨 FALLBACK: Usar emergency server:');
    console.error('   node emergency-server.js');
    process.exit(1);
  }
}

// Exportar para testing
module.exports = app;

// Iniciar si se ejecuta directamente
if (require.main === module) {
  startRealServer();
}
