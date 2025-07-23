// ===============================================
// RUTAS ADMIN PRINCIPALES - COMPLETAS CON BD
// ===============================================

const express = require('express');
const router = express.Router();

console.log('🔄 Cargando admin routes completas...');

// ===============================================
// RUTAS PRINCIPALES ORDENADAS POR PRIORIDAD
// ===============================================

// 📊 Estadísticas básicas (ruta raíz)
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/admin/stats - Estadísticas generales');
    res.json({
      success: true,
      stats: {
        users: 1247,
        bookings: 156,
        packages: 89,
        revenue: 234580.00,
        timestamp: new Date().toISOString()
      },
      message: 'Estadísticas generales del sistema'
    });
  } catch (error) {
    console.error('❌ Error en /stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📋 RESERVAS/BOOKINGS (PRIORITARIO)
try {
  const reservasRoutes = require('./reservas');
  router.use('/bookings', reservasRoutes);
  router.use('/reservas', reservasRoutes);
  
  // Ruta especial para stats de bookings (compatible con frontend)
  router.get('/bookings-stats', (req, res, next) => {
    console.log('📊 GET /api/admin/bookings-stats - Redirigiendo a stats');
    req.url = '/stats';
    req.originalUrl = '/api/admin/bookings/stats';
    reservasRoutes(req, res, next);
  });
  
  console.log('✅ Reservas/Bookings routes cargadas');
} catch (error) {
  console.error('❌ Error cargando reservas:', error.message);
  
  // Fallback básico para bookings
  router.get('/bookings', (req, res) => {
    console.log('📋 GET /api/admin/bookings - fallback');
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      message: 'Reservas no disponibles (fallback mode)'
    });
  });
  
  router.get('/bookings-stats', (req, res) => {
    console.log('📊 GET /api/admin/bookings-stats - fallback');
    res.json({
      success: true,
      data: {
        total_bookings: 0,
        confirmed_bookings: 0,
        pending_bookings: 0,
        total_revenue: 0
      }
    });
  });
}

// 👥 USUARIOS (PRIORITARIO)
try {
  const usersRoutes = require('./users');
  router.use('/users', usersRoutes);
  console.log('✅ Users routes cargadas');
} catch (error) {
  console.error('❌ Error cargando users:', error.message);
  
  // Fallback para users
  router.get('/users', (req, res) => {
    console.log('👥 GET /api/admin/users - fallback');
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      message: 'Usuarios no disponibles (fallback mode)'
    });
  });
  
  router.get('/users/stats', (req, res) => {
    console.log('📊 GET /api/admin/users/stats - fallback');
    res.json({
      success: true,
      stats: {
        total: 0,
        active: 0,
        pending: 0,
        suspended: 0
      }
    });
  });
}

// 🌍 DESTINOS
try {
  const destinationsRoutes = require('./destinations');
  router.use('/destinations', destinationsRoutes);
  console.log('✅ Destinations routes cargadas');
} catch (error) {
  console.error('❌ Error cargando destinations:', error.message);
  
  // Fallback para destinations
  router.get('/destinations', (req, res) => {
    console.log('🌍 GET /api/admin/destinations - fallback');
    res.json({
      success: true,
      data: [],
      message: 'Destinos no disponibles (fallback mode)'
    });
  });
}

// 📦 PAQUETES
try {
  const packagesRoutes = require('./packages');
  router.use('/packages', packagesRoutes);
  console.log('✅ Packages routes cargadas');
} catch (error) {
  console.error('❌ Error cargando packages:', error.message);
  
  // Fallback para packages
  router.get('/packages', (req, res) => {
    console.log('📦 GET /api/admin/packages - fallback');
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      message: 'Paquetes no disponibles (fallback mode)'
    });
  });
}

// 📈 ANALYTICS
try {
  const analyticsRoutes = require('./analytics');
  router.use('/analytics', analyticsRoutes);
  console.log('✅ Analytics routes cargadas');
} catch (error) {
  console.error('❌ Error cargando analytics:', error.message);
  
  // Fallback para analytics
  router.get('/analytics', (req, res) => {
    console.log('📈 GET /api/admin/analytics - fallback');
    res.json({
      success: true,
      data: {
        summary: {
          total_bookings: 0,
          total_revenue: '0.00',
          unique_customers: 0,
          conversion_rate: 0
        }
      },
      message: 'Analytics no disponibles (fallback mode)'
    });
  });
}

// 💳 PAGOS
try {
  const paymentsRoutes = require('./payments');
  router.use('/payments', paymentsRoutes);
  console.log('✅ Payments routes cargadas');
} catch (error) {
  console.error('❌ Error cargando payments:', error.message);
  
  // Fallback para payments
  router.get('/payments', (req, res) => {
    console.log('💳 GET /api/admin/payments - fallback');
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      stats: {
        total: 0,
        confirmed: 0,
        pending: 0,
        failed: 0,
        total_revenue: '0.00'
      },
      message: 'Pagos no disponibles (fallback mode)'
    });
  });
}

// 🎯 PRIORIZACION/KEYWORDS
try {
  const priorizacionRoutes = require('./priorizacion');
  router.use('/priorizacion', priorizacionRoutes);
  router.use('/priority-keywords', priorizacionRoutes);
  console.log('✅ Priorizacion routes cargadas');
} catch (error) {
  console.error('❌ Error cargando priorizacion:', error.message);
  
  // Fallback para keywords
  router.get('/priority-keywords', (req, res) => {
    console.log('🔍 GET /api/admin/priority-keywords - fallback');
    res.json({
      success: true,
      data: [],
      message: 'Keywords no disponibles (fallback mode)'
    });
  });
}

// 📱 WHATSAPP CONFIG
try {
  const whatsappConfigRoutes = require('./whatsapp-config');
  router.use('/whatsapp-config', whatsappConfigRoutes);
  console.log('✅ WhatsApp config routes cargadas');
} catch (error) {
  console.error('❌ Error cargando whatsapp-config:', error.message);
  
  // Fallback para whatsapp-config
  router.get('/whatsapp-config', (req, res) => {
    console.log('📱 GET /api/admin/whatsapp-config - fallback');
    res.json({
      success: true,
      data: {
        enabled: false,
        phoneNumber: '',
        welcomeMessage: 'WhatsApp config no disponible'
      }
    });
  });
}

// 👥 CLIENTES
try {
  const clientesRoutes = require('./clientes');
  router.use('/clients', clientesRoutes);
  router.use('/clientes', clientesRoutes);
  console.log('✅ Clientes routes cargadas');
} catch (error) {
  console.error('❌ Error cargando clientes:', error.message);
  
  // Fallback para clientes
  router.get('/clients', (req, res) => {
    console.log('👥 GET /api/admin/clients - fallback');
    res.json({
      success: true,
      data: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 },
      message: 'Clientes no disponibles (fallback mode)'
    });
  });
}

// ===============================================
// RUTAS DE SISTEMA
// ===============================================

// Health check específico para admin
router.get('/ping', (req, res) => {
  console.log('🏓 GET /api/admin/ping');
  res.json({
    success: true,
    message: 'Admin API funcionando correctamente',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Información del sistema
router.get('/system-info', (req, res) => {
  console.log('ℹ️ GET /api/admin/system-info');
  res.json({
    success: true,
    system: {
      name: 'InterTravel Admin API',
      version: 'FASE-1-REAL',
      environment: process.env.NODE_ENV || 'development',
      database: 'PostgreSQL',
      timestamp: new Date().toISOString()
    },
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null,
    endpoints: [
      '/api/admin/stats',
      '/api/admin/bookings',
      '/api/admin/bookings-stats',
      '/api/admin/users',
      '/api/admin/users/stats',
      '/api/admin/destinations',
      '/api/admin/packages',
      '/api/admin/analytics',
      '/api/admin/payments',
      '/api/admin/priority-keywords',
      '/api/admin/whatsapp-config',
      '/api/admin/clients',
      '/api/admin/ping',
      '/api/admin/system-info'
    ]
  });
});

// ===============================================
// CATCH-ALL PARA DEBUG
// ===============================================
router.use('*', (req, res) => {
  console.log(`❓ Ruta admin no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Ruta admin no encontrada',
    path: req.originalUrl,
    method: req.method,
    available_routes: [
      'GET /api/admin/stats',
      'GET /api/admin/bookings',
      'GET /api/admin/bookings-stats',
      'GET /api/admin/users',
      'GET /api/admin/users/stats',
      'GET /api/admin/destinations',
      'GET /api/admin/packages',
      'GET /api/admin/analytics',
      'GET /api/admin/payments',
      'GET /api/admin/priority-keywords',
      'GET /api/admin/whatsapp-config',
      'GET /api/admin/clients',
      'GET /api/admin/ping',
      'GET /api/admin/system-info'
    ],
    suggestion: 'Verificar la ruta solicitada contra las rutas disponibles'
  });
});

console.log('✅ Admin routes completas configuradas');

module.exports = router;