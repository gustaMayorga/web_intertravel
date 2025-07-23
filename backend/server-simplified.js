// ===============================================
// SERVIDOR INTERTRAVEL - VERSIÓN SIMPLIFICADA Y FUNCIONAL
// ===============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3002;

// ===============================================
// CONFIGURACIÓN BÁSICA
// ===============================================

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3005',    // Frontend web
    'http://localhost:3009',    // App cliente
    'http://localhost:3000',    // Desarrollo
    'http://localhost:8080',    // Testing
    'http://localhost:8000'     // Alternativo
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Basic Middlewares
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.url}`);
  next();
});

// ===============================================
// IMPORTAR BASE DE DATOS
// ===============================================
let dbAvailable = false;
try {
  const { connect: connectDB, initializeDatabase } = require('./database');
  dbAvailable = true;
  console.log('✅ Database module loaded');
} catch (error) {
  console.warn('⚠️ Database not available:', error.message);
}

// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN SIMPLE
// ===============================================
const simpleAuth = (req, res, next) => {
  // Para testing, permitir todas las requests autenticadas
  req.user = {
    id: 1,
    username: 'admin',
    role: 'admin',
    permissions: ['admin']
  };
  next();
};

// ===============================================
// RUTAS ADMIN - DIRECTO SIN ARCHIVOS EXTERNOS
// ===============================================

// 🔓 LOGIN SIN MIDDLEWARE
app.post('/api/admin/auth/login', (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
      res.json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        },
        token: 'mock-jwt-token-for-testing'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error en login'
    });
  }
});

// 🔓 LOGOUT
app.post('/api/admin/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

// 🔐 RUTAS ADMIN CON AUTH (SIMULADO)
app.get('/api/admin/whatsapp-config', simpleAuth, (req, res) => {
  try {
    console.log('📱 WhatsApp config request');
    
    res.json({
      success: true,
      config: {
        enabled: true,
        phoneNumber: process.env.WHATSAPP_NUMBER || '+5491112345678',
        defaultMessage: 'Hola! Estoy interesado en sus paquetes de viaje. ¿Podrían brindarme más información?',
        businessHours: {
          start: '09:00',
          end: '18:00',
          timezone: 'America/Argentina/Buenos_Aires'
        },
        autoResponse: {
          enabled: true,
          message: 'Gracias por contactarnos! Te responderemos a la brevedad durante nuestro horario de atención.'
        }
      }
    });
  } catch (error) {
    console.error('❌ WhatsApp config error:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo configuración WhatsApp'
    });
  }
});

// 🔐 STATS/DASHBOARD
app.get('/api/admin/stats', simpleAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      totalReservas: 42,
      reservasHoy: 8,
      clientesActivos: 156,
      ingresosMes: 45600,
      ocupacionPromedio: 78.5,
      reservasPendientes: 5,
      ultimaActualizacion: new Date().toISOString()
    }
  });
});

// 🔐 PING
app.get('/api/admin/ping', simpleAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Admin API funcionando correctamente',
    timestamp: new Date().toISOString(),
    user: req.user
  });
});

// ===============================================
// RUTAS DE APP CLIENTE (SIMPLIFICADAS)
// ===============================================
app.get('/api/app/packages', (req, res) => {
  res.json({
    success: true,
    packages: [],
    message: 'Paquetes de app cliente'
  });
});

// ===============================================
// RUTAS DE PAQUETES PÚBLICOS
// ===============================================
app.get('/api/packages', (req, res) => {
  res.json({
    success: true,
    packages: [],
    message: 'Paquetes públicos'
  });
});

// ===============================================
// HEALTH CHECK
// ===============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'InterTravel Backend Simplified'
  });
});

// ===============================================
// CATCH ALL - 404
// ===============================================
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint no encontrado',
    method: req.method,
    url: req.originalUrl,
    availableEndpoints: [
      'POST /api/admin/auth/login',
      'GET /api/admin/whatsapp-config',
      'GET /api/admin/stats',
      'GET /api/admin/ping',
      'GET /health'
    ]
  });
});

// ===============================================
// INICIALIZACIÓN DEL SERVIDOR
// ===============================================
async function startServer() {
  try {
    // Intentar conectar base de datos si está disponible
    if (dbAvailable) {
      try {
        const { connect } = require('./database');
        await connect();
        console.log('✅ Database connected');
      } catch (dbError) {
        console.warn('⚠️ Database connection failed, continuing without DB:', dbError.message);
      }
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ===============================================');
      console.log('🚀 INTERTRAVEL BACKEND SIMPLIFICADO INICIADO');
      console.log('🚀 ===============================================');
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🌍 CORS habilitado para puertos: 3000, 3005, 3009, 8080, 8000`);
      console.log('');
      console.log('🎯 ENDPOINTS PRINCIPALES:');
      console.log('POST http://localhost:3002/api/admin/auth/login');
      console.log('GET  http://localhost:3002/api/admin/whatsapp-config');
      console.log('GET  http://localhost:3002/api/admin/stats');
      console.log('GET  http://localhost:3002/api/admin/ping');
      console.log('GET  http://localhost:3002/health');
      console.log('');
      console.log('✅ Servidor listo para recibir requests');
      console.log('===============================================');
    });
    
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
}

startServer();
