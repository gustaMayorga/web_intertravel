// ===============================================
// RUTAS ADMIN PRINCIPALES - INDEX UNIFICADO
// ===============================================

const express = require('express');
const router = express.Router();

// ===============================================
// IMPORTAR TODOS LOS MÓDULOS ADMIN
// ===============================================

// 📦 Gestión de paquetes
const packagesRoutes = require('./packages');
router.use('/packages', packagesRoutes);

// 👥 Gestión de usuarios
const usersRoutes = require('./users');
router.use('/users', usersRoutes);

// 📋 Gestión de reservas/bookings
const reservasRoutes = require('./reservas');
router.use('/bookings', reservasRoutes);

// 👤 Gestión de clientes
const clientesRoutes = require('./clientes');
router.use('/clients', clientesRoutes);

// ⚙️ Configuración general
const configuracionRoutes = require('./configuracion');
router.use('/config', configuracionRoutes);

// 📱 Configuración WhatsApp
const whatsappConfigRoutes = require('./whatsapp-config');
router.use('/whatsapp-config', whatsappConfigRoutes);

// 🎯 Priorización de keywords
const priorizacionRoutes = require('./priorizacion');
router.use('/priorizacion', priorizacionRoutes);

// 🎯 Alias para priority-keywords (compatibilidad)
router.use('/priority-keywords', priorizacionRoutes);

// 📊 Ruta de estadísticas básicas
router.get('/stats', async (req, res) => {
  try {
    res.json({
      success: true,
      stats: {
        users: 1,
        packages: 0,
        bookings: 0,
        timestamp: new Date().toISOString()
      },
      message: 'Estadísticas básicas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===============================================
// ENDPOINT DE SALUD/PING
// ===============================================
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API funcionando correctamente',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null
  });
});

// ===============================================
// INFORMACIÓN DEL SISTEMA
// ===============================================
router.get('/system-info', (req, res) => {
  res.json({
    success: true,
    system: {
      name: 'InterTravel Admin API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    },
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      permissions: req.user.permissions
    } : null,
    endpoints: [
      '/api/admin/packages',
      '/api/admin/users', 
      '/api/admin/bookings',
      '/api/admin/clients',
      '/api/admin/config',
      '/api/admin/whatsapp-config',
      '/api/admin/priorizacion',
      '/api/admin/priority-keywords',
      '/api/admin/stats'
    ]
  });
});

// ===============================================
// RUTAS PRINCIPALES/DASHBOARD (AL FINAL)
// ===============================================
// 📊 Rutas principales/dashboard - DEBE IR AL FINAL
try {
  const mainRoutes = require('./main-routes');
  router.use('/', mainRoutes);
  console.log('✅ Main routes configuradas');
} catch (error) {
  console.warn('⚠️ Main routes no disponibles:', error.message);
}

console.log('✅ Admin routes index configurado');

module.exports = router;
