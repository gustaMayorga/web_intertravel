// ===============================================
// SERVIDOR INTERTRAVEL SEGURO - VERSIÓN 2.0
// ===============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const responseTime = require('response-time');

// Importar módulos de seguridad
const { verifyToken } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

// Importar configuración existente
const { connect: connectDB, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3002;

// ===============================================
// CONFIGURACIÓN DE SEGURIDAD AVANZADA
// ===============================================

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Intenta nuevamente en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Rate limiting específico para admin
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Más requests para admin
  message: {
    error: 'Límite de requests para admin excedido.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  }
});

// ===============================================
// MIDDLEWARE BÁSICO
// ===============================================

// Response time tracking
app.use(responseTime((req, res, time) => {
  const route = req.route?.path || req.path;
  console.log(`⏱️  ${req.method} ${route} - ${time.toFixed(2)}ms`);
  
  // Alert para queries lentas
  if (time > 1000) {
    console.warn(`🐌 SLOW QUERY: ${req.method} ${route} - ${time.toFixed(2)}ms`);
  }
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configurado de forma segura
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3005',  // Frontend admin
      'http://localhost:3009',  // App cliente
      'http://localhost:3000',  // Desarrollo
      'http://localhost:8080',  // Testing
      'http://localhost:8000'   // Alternativo
    ];
    
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// ===============================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ===============================================

// Health check mejorado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0-secure',
    environment: process.env.NODE_ENV || 'development',
    security: {
      authEnabled: true,
      rateLimit: true,
      cors: true,
      helmet: true
    }
  });
});

// Rutas de autenticación (públicas)
app.use('/api/admin/auth', authRoutes);

// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN PARA RUTAS ADMIN
// ===============================================

// Aplicar rate limiting y autenticación a todas las rutas admin
app.use('/api/admin', adminLimiter);
app.use('/api/admin', verifyToken); // ¡AUTENTICACIÓN REACTIVADA!

// ===============================================
// RUTAS ADMIN PROTEGIDAS
// ===============================================

// Stats generales - AHORA REQUIERE AUTENTICACIÓN
app.get('/api/admin/stats', async (req, res) => {
  try {
    console.log('📊 Admin Stats endpoint accessed - SECURED VERSION');
    console.log(`👤 Usuario: ${req.user.email} (${req.user.role})`);
    
    // Stats mejoradas con seguridad
    const stats = {
      clients: {
        total: 145,
        active: 132,
        new_this_month: 23,
        b2c: 98,
        b2b: 47
      },
      bookings: {
        total: 89,
        recent: 12,
        pending: 5,
        confirmed: 67,
        cancelled: 17
      },
      revenue: {
        total: 2450000,
        this_month: 320000,
        last_month: 280000,
        currency: 'ARS',
        growth: '+14.3%'
      },
      system: {
        uptime: process.uptime(),
        last_updated: new Date().toISOString(),
        security_active: true,
        user_logged: req.user.email
      }
    };

    res.json(stats);

  } catch (error) {
    console.error('💥 Error obteniendo stats:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      code: 'STATS_ERROR'
    });
  }
});

// Clientes - PROTEGIDO
app.get('/api/admin/clientes', async (req, res) => {
  try {
    console.log(`👥 Clientes solicitados por: ${req.user.email}`);
    
    const { page = 1, limit = 50, search = '', status = 'active' } = req.query;

    // Datos de ejemplo mejorados
    const clients = [
      {
        id: 1,
        first_name: 'Juan Carlos',
        last_name: 'Pérez González',
        email: 'juan.perez@email.com',
        phone: '+54911234567',
        status: 'active',
        client_type: 'B2C',
        total_bookings: 3,
        total_spent: 180000,
        last_booking: '2025-01-10',
        created_at: '2024-06-15'
      },
      {
        id: 2,
        first_name: 'María Elena',
        last_name: 'González Rodríguez',
        email: 'maria.gonzalez@email.com',
        phone: '+54911234568',
        status: 'active',
        client_type: 'B2C',
        total_bookings: 2,
        total_spent: 145000,
        last_booking: '2025-01-05',
        created_at: '2024-08-20'
      },
      {
        id: 3,
        first_name: 'Carlos Roberto',
        last_name: 'Martínez Silva',
        email: 'carlos.martinez@empresa.com',
        phone: '+54911234569',
        status: 'active',
        client_type: 'B2B',
        total_bookings: 5,
        total_spent: 450000,
        last_booking: '2025-01-12',
        created_at: '2024-03-10'
      }
    ];

    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: clients.length,
        totalPages: Math.ceil(clients.length / limit)
      },
      filters: { search, status },
      requestedBy: req.user.email
    });

  } catch (error) {
    console.error('💥 Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Reservas - PROTEGIDO
app.get('/api/admin/reservas', async (req, res) => {
  try {
    console.log(`📋 Reservas solicitadas por: ${req.user.email}`);
    
    const { page = 1, limit = 50, status = 'all' } = req.query;

    const bookings = [
      {
        id: 1,
        package_name: 'Bariloche Premium 7 días',
        client_id: 1,
        first_name: 'Juan Carlos',
        last_name: 'Pérez González',
        email: 'juan.perez@email.com',
        phone: '+54911234567',
        passenger_count: 2,
        total_amount: 180000,
        currency: 'ARS',
        status: 'confirmed',
        payment_status: 'paid',
        travel_date: '2025-03-15',
        created_at: '2025-01-10T10:30:00Z'
      },
      {
        id: 2,
        package_name: 'Mendoza Wine Experience',
        client_id: 2,
        first_name: 'María Elena',
        last_name: 'González Rodríguez',
        email: 'maria.gonzalez@email.com',
        phone: '+54911234568',
        passenger_count: 1,
        total_amount: 95000,
        currency: 'ARS',
        status: 'pending',
        payment_status: 'pending',
        travel_date: '2025-02-20',
        created_at: '2025-01-05T14:15:00Z'
      }
    ];

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: bookings.length
      },
      filters: { status },
      requestedBy: req.user.email
    });

  } catch (error) {
    console.error('💥 Error obteniendo reservas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Configuración - PROTEGIDO
app.get('/api/admin/configuracion', (req, res) => {
  try {
    console.log(`⚙️ Configuración solicitada por: ${req.user.email}`);

    const config = {
      general: {
        siteName: 'Intertravel',
        contactEmail: 'admin@intertravel.com',
        supportPhone: '+54-261-123-4567',
        timezone: 'America/Argentina/Buenos_Aires',
        currency: 'ARS',
        language: 'es'
      },
      security: {
        sessionTimeout: '8h',
        twoFactorAuth: false,
        passwordPolicy: {
          minLength: 8,
          requireNumbers: true,
          requireSymbols: true
        }
      },
      system: {
        version: '2.0.0-secure',
        environment: process.env.NODE_ENV,
        lastUpdate: new Date().toISOString(),
        authenticationActive: true,
        rateLimitingActive: true
      },
      requestedBy: req.user.email,
      timestamp: new Date().toISOString()
    };

    res.json(config);
  } catch (error) {
    console.error('💥 Error obteniendo configuración:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener información del usuario actual - PROTEGIDO
app.get('/api/admin/user/profile', (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    },
    session: {
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresIn: '8h'
    }
  });
});

// ===============================================
// IMPORTAR RUTAS EXISTENTES COMO PROTEGIDAS
// ===============================================

// Aquí puedes agregar las rutas existentes del proyecto
// Todas estarán automáticamente protegidas por el middleware verifyToken

// ===============================================
// MANEJO DE ERRORES GLOBAL
// ===============================================

// 404 handler
app.use('*', (req, res) => {
  console.warn(`🚫 404: ${req.method} ${req.originalUrl} from ${req.ip}`);
  res.status(404).json({
    error: 'Endpoint no encontrado',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler global
app.use((error, req, res, next) => {
  console.error(`💥 ERROR GLOBAL: ${error.message}`, {
    url: req.url,
    method: req.method,
    user: req.user?.email,
    ip: req.ip,
    stack: error.stack
  });

  // Response según el tipo de error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      code: 'UNAUTHORIZED'
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// INICIALIZACIÓN DEL SERVIDOR
// ===============================================

const startServer = async () => {
  try {
    // Verificar variables de entorno críticas
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no configurado en .env');
    }

    console.log('🔐 JWT_SECRET: CONFIGURADO ✅');

    // Intentar conectar a base de datos
    console.log('🐘 Verificando conexión a base de datos...');
    try {
      await connectDB();
      await initializeDatabase();
      console.log('✅ Base de datos conectada y inicializada');
    } catch (dbError) {
      console.warn('⚠️ Base de datos no disponible - usando datos mock');
      console.log('ℹ️ El sistema funcionará con datos de ejemplo');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n🚀 SERVIDOR INTERTRAVEL INICIADO CON SEGURIDAD COMPLETA');
      console.log('=' .repeat(55));
      console.log(`🌐 Puerto: ${PORT}`);
      console.log(`🔐 Seguridad: ACTIVADA`);
      console.log(`🔒 Autenticación: REQUERIDA`);
      console.log(`📝 Audit trail: ACTIVO`);
      console.log(`⚡ Rate limiting: ACTIVO`);
      console.log(`🛡️ Helmet security: ACTIVO`);
      console.log(`🌐 CORS: CONFIGURADO`);
      console.log('');
      console.log('📋 ENDPOINTS DISPONIBLES:');
      console.log('  ┌─ PÚBLICOS:');
      console.log('  │  GET  /api/health');
      console.log('  │  POST /api/admin/auth/login');
      console.log('  │');
      console.log('  └─ PROTEGIDOS (requieren autenticación):');
      console.log('     POST /api/admin/auth/logout');
      console.log('     GET  /api/admin/auth/verify');
      console.log('     GET  /api/admin/stats');
      console.log('     GET  /api/admin/clientes');
      console.log('     GET  /api/admin/reservas');
      console.log('     GET  /api/admin/configuracion');
      console.log('     GET  /api/admin/user/profile');
      console.log('');
      console.log('🎯 CREDENCIALES DE TESTING:');
      console.log('   📧 Email: admin@intertravel.com');
      console.log('   🔑 Password: admin123');
      console.log('');
      console.log('✨ SISTEMA LISTO - MODO SEGURO ACTIVADO ✨');
      console.log('=' .repeat(55));
    });

  } catch (error) {
    console.error('💥 Error crítico iniciando servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor (Ctrl+C)...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
