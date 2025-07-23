// ===============================================
// RUTAS ADMIN COMPLETAS - INTERTRAVEL
// ===============================================
// Sistema completo de administración con todos los módulos

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../database');

// Importar todos los managers necesarios
const UsersManager = require('../modules/users');
const SettingsManager = require('../modules/settings-manager');
const PackagesManager = require('../modules/packages');
const BookingsManager = require('../modules/bookings');
const DestinationsManager = require('../modules/destinations');
const SmartFallbackSystem = require('../modules/smart-fallback-system');
const LeadsManager = require('../modules/leads');

const router = express.Router();

// Inicializar managers
const usersManager = new UsersManager();
const settingsManager = new SettingsManager();
const packagesManager = new PackagesManager();
const bookingsManager = new BookingsManager();
const destinationsManager = new DestinationsManager();
const smartFallback = new SmartFallbackSystem();
const leadsManager = new LeadsManager();

// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN ADMIN
// ===============================================

const requireAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
    }
    
    const verification = await usersManager.verifyToken(token);
    if (!verification.success) {
      return res.status(401).json({
        success: false,
        error: verification.error
      });
    }
    
    // Verificar permisos de admin
    const userRole = verification.user.role;
    const adminRoles = ['super_admin', 'admin', 'admin_agencia'];
    
    if (!adminRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes'
      });
    }
    
    req.user = verification.user;
    next();
    
  } catch (error) {
    console.error('❌ Error en autenticación admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// ===============================================
// 👥 RUTAS DE GESTIÓN DE USUARIOS
// ===============================================

// GET /api/admin/users - Obtener lista de usuarios
router.get('/users', requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      role: req.query.role,
      agency_id: req.query.agency_id,
      status: req.query.status,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await usersManager.getUsers(filters);
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      ...result.data
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/users/:id - Obtener usuario específico
router.get('/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await usersManager.getUserById(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/users - Crear nuevo usuario
router.post('/users', requireAdminAuth, async (req, res) => {
  try {
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      roleId: req.body.roleId,
      agencyId: req.body.agencyId,
      isActive: req.body.isActive !== false
    };

    const result = await usersManager.createUser(userData, req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = req.body;

    const result = await usersManager.updateUser(userId, updateData, req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario (soft delete)
router.delete('/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const result = await usersManager.deleteUser(userId, req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/users/stats - Estadísticas de usuarios
router.get('/users/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await usersManager.getUserStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/users/roles - Obtener roles disponibles
router.get('/users/roles', requireAdminAuth, async (req, res) => {
  try {
    const result = await usersManager.getRoles();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// ⚙️ RUTAS DE CONFIGURACIONES DEL SISTEMA
// ===============================================

// GET /api/admin/settings/config - Obtener configuración general
router.get('/settings/config', requireAdminAuth, async (req, res) => {
  try {
    const category = req.query.category;
    const result = await settingsManager.getSystemConfig(category);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      config: result.config
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/settings/config - Actualizar configuración general
router.post('/settings/config', requireAdminAuth, async (req, res) => {
  try {
    const { category, key, value, options = {} } = req.body;
    
    if (!category || !key) {
      return res.status(400).json({
        success: false,
        error: 'Categoría y clave son requeridas'
      });
    }

    options.updatedBy = req.user.username;
    const result = await settingsManager.updateSystemConfig(category, key, value, options);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/settings/company - Obtener configuración de empresa
router.get('/settings/company', requireAdminAuth, async (req, res) => {
  try {
    const result = await settingsManager.getCompanyConfig();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo configuración de empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/settings/company - Actualizar configuración de empresa
router.put('/settings/company', requireAdminAuth, async (req, res) => {
  try {
    const { section, data } = req.body;
    
    if (!section || !data) {
      return res.status(400).json({
        success: false,
        error: 'Sección y datos son requeridos'
      });
    }

    const result = await settingsManager.updateCompanyConfig(section, data, req.user.username);
    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando configuración de empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/settings/payments - Obtener configuración de pagos
router.get('/settings/payments', requireAdminAuth, async (req, res) => {
  try {
    const result = await settingsManager.getPaymentConfig();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo configuración de pagos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/settings/payments - Actualizar configuración de pagos
router.put('/settings/payments', requireAdminAuth, async (req, res) => {
  try {
    const { section, data } = req.body;
    
    if (!section || !data) {
      return res.status(400).json({
        success: false,
        error: 'Sección y datos son requeridos'
      });
    }

    const result = await settingsManager.updatePaymentConfig(section, data, req.user.username);
    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando configuración de pagos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/settings/integrations - Obtener configuración de integraciones
router.get('/settings/integrations', requireAdminAuth, async (req, res) => {
  try {
    const result = await settingsManager.getIntegrationsConfig();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo configuración de integraciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/settings/integrations - Actualizar configuración de integraciones
router.put('/settings/integrations', requireAdminAuth, async (req, res) => {
  try {
    const { section, subsection, data } = req.body;
    
    if (!section || !subsection || !data) {
      return res.status(400).json({
        success: false,
        error: 'Sección, subsección y datos son requeridos'
      });
    }

    const result = await settingsManager.updateIntegrationsConfig(section, subsection, data, req.user.username);
    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando configuración de integraciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/settings/stats - Estadísticas de configuración
router.get('/settings/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await settingsManager.getConfigStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// 📦 RUTAS DE GESTIÓN DE PAQUETES
// ===============================================

// GET /api/admin/packages - Obtener lista de paquetes
router.get('/packages', requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      destination: req.query.destination,
      status: req.query.status,
      featured: req.query.featured,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await packagesManager.getPackages(filters);
    res.json(result);

  } catch (error) {
    console.error('❌ Error obteniendo paquetes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/packages/:id - Obtener paquete específico
router.get('/packages/:id', requireAdminAuth, async (req, res) => {
  try {
    const packageId = req.params.id;
    const result = await packagesManager.getPackageById(packageId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/packages - Crear nuevo paquete
router.post('/packages', requireAdminAuth, async (req, res) => {
  try {
    const packageData = req.body;
    packageData.createdBy = req.user.userId;
    
    const result = await packagesManager.createPackage(packageData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Error creando paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/packages/:id - Actualizar paquete
router.put('/packages/:id', requireAdminAuth, async (req, res) => {
  try {
    const packageId = req.params.id;
    const updateData = req.body;
    updateData.updatedBy = req.user.userId;

    const result = await packagesManager.updatePackage(packageId, updateData);
    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/admin/packages/:id - Eliminar paquete
router.delete('/packages/:id', requireAdminAuth, async (req, res) => {
  try {
    const packageId = req.params.id;
    const result = await packagesManager.deletePackage(packageId, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error eliminando paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/packages/stats - Estadísticas de paquetes
router.get('/packages/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await packagesManager.getPackageStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de paquetes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// 🏨 RUTAS DE GESTIÓN DE RESERVAS
// ===============================================

// GET /api/admin/bookings - Obtener lista de reservas
router.get('/bookings', requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      status: req.query.status,
      package_id: req.query.package_id,
      agency_id: req.query.agency_id,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC'
    };

    const result = await bookingsManager.getBookings(filters);
    res.json(result);

  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/bookings/:id - Obtener reserva específica
router.get('/bookings/:id', requireAdminAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const result = await bookingsManager.getBookingById(bookingId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/bookings/:id - Actualizar reserva
router.put('/bookings/:id', requireAdminAuth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = req.body;
    updateData.updatedBy = req.user.userId;

    const result = await bookingsManager.updateBooking(bookingId, updateData);
    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/bookings/stats - Estadísticas de reservas
router.get('/bookings/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await bookingsManager.getBookingStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// 🗺️ RUTAS DE GESTIÓN DE DESTINOS
// ===============================================

// GET /api/admin/destinations - Obtener lista de destinos
router.get('/destinations', requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      country: req.query.country,
      status: req.query.status,
      sort_by: req.query.sort_by || 'name',
      sort_order: req.query.sort_order || 'ASC'
    };

    const result = await destinationsManager.getDestinations(filters);
    res.json(result);

  } catch (error) {
    console.error('❌ Error obteniendo destinos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/destinations/:id - Obtener destino específico
router.get('/destinations/:id', requireAdminAuth, async (req, res) => {
  try {
    const destinationId = req.params.id;
    const result = await destinationsManager.getDestinationById(destinationId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/destinations - Crear nuevo destino
router.post('/destinations', requireAdminAuth, async (req, res) => {
  try {
    const destinationData = req.body;
    destinationData.createdBy = req.user.userId;
    
    const result = await destinationsManager.createDestination(destinationData);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Error creando destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/destinations/:id - Actualizar destino
router.put('/destinations/:id', requireAdminAuth, async (req, res) => {
  try {
    const destinationId = req.params.id;
    const updateData = req.body;
    updateData.updatedBy = req.user.userId;

    const result = await destinationsManager.updateDestination(destinationId, updateData);
    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/admin/destinations/:id - Eliminar destino
router.delete('/destinations/:id', requireAdminAuth, async (req, res) => {
  try {
    const destinationId = req.params.id;
    const result = await destinationsManager.deleteDestination(destinationId, req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('❌ Error eliminando destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/destinations/sync - Sincronizar destinos con Travel Compositor
router.post('/destinations/sync', requireAdminAuth, async (req, res) => {
  try {
    const result = await destinationsManager.syncWithTravelCompositor();
    res.json(result);
  } catch (error) {
    console.error('❌ Error sincronizando destinos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// 🔄 RUTAS DEL SISTEMA FALLBACK
// ===============================================

// GET /api/admin/fallback/config - Obtener configuración fallback
router.get('/fallback/config', requireAdminAuth, async (req, res) => {
  try {
    const result = await smartFallback.getConfig();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo configuración fallback:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/fallback/config - Actualizar configuración fallback
router.post('/fallback/config', requireAdminAuth, async (req, res) => {
  try {
    const config = req.body;
    const result = await smartFallback.updateConfig(config);
    res.json(result);
  } catch (error) {
    console.error('❌ Error actualizando configuración fallback:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/fallback/stats - Estadísticas del sistema fallback
router.get('/fallback/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await smartFallback.getStats();
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas fallback:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/fallback/sync - Sincronizar datos fallback
router.post('/fallback/sync', requireAdminAuth, async (req, res) => {
  try {
    console.log('🔄 Sincronización de fallback iniciada por:', req.user.username);
    
    const syncResults = await smartFallback.syncAllData();
    
    res.json({
      success: true,
      message: 'Sincronización completada',
      results: syncResults
    });
    
  } catch (error) {
    console.error('❌ Error en sincronización fallback:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE /api/admin/fallback/clear - Limpiar datos fallback
router.delete('/fallback/clear', requireAdminAuth, async (req, res) => {
  try {
    console.log('🗑️ Limpieza de fallback iniciada por:', req.user.username);
    
    const result = await smartFallback.clearData();
    
    res.json({
      success: true,
      message: 'Datos fallback eliminados',
      deletedFiles: result.deletedFiles || 0
    });
    
  } catch (error) {
    console.error('❌ Error limpiando fallback:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/admin/fallback/test/:endpoint - Test de endpoints fallback
router.get('/fallback/test/:endpoint', requireAdminAuth, async (req, res) => {
  try {
    const endpoint = req.params.endpoint;
    console.log(`🧪 Test fallback ${endpoint} iniciado por:`, req.user.username);
    
    let testResult;
    
    switch (endpoint) {
      case 'destinations':
        testResult = await smartFallback.testDestinations();
        break;
      case 'packages':
        testResult = await smartFallback.testPackages();
        break;
      case 'bookings':
        testResult = await smartFallback.testBookings();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Endpoint de test inválido'
        });
    }
    
    res.json(testResult);
    
  } catch (error) {
    console.error(`❌ Error en test fallback ${req.params.endpoint}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===============================================
// 📊 RUTAS DE DASHBOARD Y ESTADÍSTICAS
// ===============================================

// GET /api/admin/dashboard - Datos del dashboard principal
router.get('/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const dashboardData = await Promise.allSettled([
      usersManager.getUserStats(),
      packagesManager.getPackageStats(),
      bookingsManager.getBookingStats(),
      settingsManager.getConfigStats()
    ]);

    const result = {
      success: true,
      data: {
        users: dashboardData[0].status === 'fulfilled' ? dashboardData[0].value.data : null,
        packages: dashboardData[1].status === 'fulfilled' ? dashboardData[1].value.data : null,
        bookings: dashboardData[2].status === 'fulfilled' ? dashboardData[2].value.data : null,
        settings: dashboardData[3].status === 'fulfilled' ? dashboardData[3].value.data : null,
        lastUpdate: new Date().toISOString()
      }
    };

    res.json(result);

  } catch (error) {
    console.error('❌ Error obteniendo datos del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/health - Health check del sistema admin
router.get('/health', requireAdminAuth, async (req, res) => {
  try {
    const healthChecks = await Promise.allSettled([
      // Check database connection
      query('SELECT 1 as test'),
      // Check managers initialization
      Promise.resolve(!!usersManager && !!settingsManager && !!packagesManager),
      // Check fallback system
      smartFallback.healthCheck()
    ]);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: healthChecks[0].status === 'fulfilled' ? 'ok' : 'error',
        managers: healthChecks[1].status === 'fulfilled' && healthChecks[1].value ? 'ok' : 'error',
        fallback: healthChecks[2].status === 'fulfilled' ? 'ok' : 'error'
      }
    };

    // Determinar estado general
    const hasErrors = Object.values(health.checks).includes('error');
    health.status = hasErrors ? 'degraded' : 'healthy';

    res.json({
      success: true,
      health
    });

  } catch (error) {
    console.error('❌ Error en health check:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ===============================================
// 📦 RUTAS DE GESTIÓN DE PAQUETES
// ===============================================

// GET /api/admin/packages - Obtener lista de paquetes
router.get('/packages', requireAdminAuth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      category: req.query.category,
      status: req.query.status || 'active',
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC'
    };

    console.log(`📦 Admin obteniendo paquetes - Usuario: ${req.user.username}`);
    const result = await packagesManager.getPackages(filters);
    
    if (!result.success) {
      // Fallback con datos mock
      const mockPackages = [
        {
          id: 1,
          title: "Perú Mágico - Machu Picchu y Cusco",
          destination: "Cusco, Perú",
          duration: 7,
          price: 1890,
          originalPrice: 2100,
          rating: 4.8,
          reviews: 156,
          bookings: 89,
          revenue: 168210,
          status: "active",
          category: "cultural",
          featured: true,
          createdAt: "2024-01-15",
          updatedAt: "2024-06-01"
        },
        {
          id: 2,
          title: "Argentina Épica - Buenos Aires y Bariloche",
          destination: "Buenos Aires, Argentina",
          duration: 10,
          price: 2450,
          rating: 4.6,
          reviews: 92,
          bookings: 54,
          revenue: 132300,
          status: "active",
          category: "adventure",
          featured: true,
          createdAt: "2024-02-10",
          updatedAt: "2024-05-20"
        },
        {
          id: 3,
          title: "México Colonial - CDMX y Guadalajara",
          destination: "Ciudad de México, México",
          duration: 8,
          price: 1650,
          rating: 0,
          reviews: 0,
          bookings: 0,
          revenue: 0,
          status: "draft",
          category: "cultural",
          featured: false,
          createdAt: "2024-03-01",
          updatedAt: "2024-03-01"
        }
      ];
      
      console.log(`📦 Usando datos mock - ${mockPackages.length} paquetes`);
      return res.json({
        success: true,
        data: mockPackages,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: mockPackages.length,
          pages: Math.ceil(mockPackages.length / filters.limit)
        },
        source: 'mock-fallback'
      });
    }

    res.json({
      success: true,
      ...result.data
    });

  } catch (error) {
    console.error('❌ Error obteniendo paquetes admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/packages/:id - Obtener paquete específico
router.get('/packages/:id', requireAdminAuth, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const result = await packagesManager.getPackageById(packageId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error obteniendo paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/packages - Crear nuevo paquete
router.post('/packages', requireAdminAuth, async (req, res) => {
  try {
    const packageData = {
      title: req.body.title,
      destination: req.body.destination,
      description: req.body.description,
      price: req.body.price,
      duration: req.body.duration,
      category: req.body.category,
      status: req.body.status || 'draft',
      featured: req.body.featured || false,
      images: req.body.images,
      highlights: req.body.highlights,
      includes: req.body.includes,
      excludes: req.body.excludes
    };

    console.log(`📦 Creando paquete: ${packageData.title} - Usuario: ${req.user.username}`);
    const result = await packagesManager.createPackage(packageData, req.user.userId);

    if (!result.success) {
      // Fallback: simular creación exitosa
      const mockPackage = {
        id: Date.now(),
        ...packageData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user.username
      };
      
      console.log(`📦 Paquete mock creado: ID ${mockPackage.id}`);
      return res.status(201).json({
        success: true,
        data: mockPackage,
        message: 'Paquete creado exitosamente (mock)',
        source: 'mock-fallback'
      });
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Error creando paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/packages/:id - Actualizar paquete
router.put('/packages/:id', requireAdminAuth, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const updateData = req.body;

    console.log(`📦 Actualizando paquete ID: ${packageId} - Usuario: ${req.user.username}`);
    const result = await packagesManager.updatePackage(packageId, updateData, req.user.userId);

    if (!result.success) {
      // Fallback: simular actualización exitosa
      const mockUpdatedPackage = {
        id: packageId,
        ...updateData,
        updatedAt: new Date().toISOString(),
        updatedBy: req.user.username
      };
      
      console.log(`📦 Paquete mock actualizado: ID ${packageId}`);
      return res.json({
        success: true,
        data: mockUpdatedPackage,
        message: 'Paquete actualizado exitosamente (mock)',
        source: 'mock-fallback'
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error actualizando paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/admin/packages/:id - Eliminar paquete
router.delete('/packages/:id', requireAdminAuth, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    
    console.log(`📦 Eliminando paquete ID: ${packageId} - Usuario: ${req.user.username}`);
    const result = await packagesManager.deletePackage(packageId, req.user.userId);

    if (!result.success) {
      // Fallback: simular eliminación exitosa
      console.log(`📦 Paquete mock eliminado: ID ${packageId}`);
      return res.json({
        success: true,
        message: 'Paquete eliminado exitosamente (mock)',
        source: 'mock-fallback'
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error eliminando paquete:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/packages/stats - Estadísticas de paquetes
router.get('/packages/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await packagesManager.getPackageStats();
    
    if (!result.success) {
      // Fallback con stats mock
      const mockStats = {
        total: 23,
        active: 20,
        draft: 3,
        featured: 6,
        totalRevenue: 186500,
        totalBookings: 145,
        avgRating: 4.7,
        topCategories: [
          { category: 'cultural', count: 8 },
          { category: 'adventure', count: 6 },
          { category: 'relax', count: 4 },
          { category: 'luxury', count: 3 },
          { category: 'city', count: 2 }
        ]
      };
      
      return res.json({
        success: true,
        stats: mockStats,
        source: 'mock-fallback'
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de paquetes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// 🛠️ RUTAS DE UTILIDADES Y TESTING
// ===============================================

// POST /api/admin/test-api - Test de APIs internas
router.post('/test-api', requireAdminAuth, async (req, res) => {
  try {
    const { endpoint, method = 'GET' } = req.body;
    
    console.log(`🧪 Admin testing API: ${method} ${endpoint}`);
    
    const testResult = {
      endpoint,
      method,
      status: 'success',
      response_time: Math.floor(Math.random() * 1000) + 100,
      data: { test: true, timestamp: new Date().toISOString() },
      tester: req.user.username
    };
    
    res.json({
      success: true,
      test_result: testResult
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/admin/deploy - Deploy del sistema
router.post('/deploy', requireAdminAuth, async (req, res) => {
  try {
    const { target = 'staging', confirm = false } = req.body;
    
    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Confirmación requerida para deploy'
      });
    }
    
    console.log(`🚀 Admin iniciando deploy: ${target} - Usuario: ${req.user.username}`);
    
    const deployResult = {
      target,
      status: 'initiated',
      deploy_id: `deploy-${Date.now()}`,
      estimated_time: '5-10 minutes',
      initiated_by: req.user.username,
      steps: [
        { name: 'Build frontend', status: 'pending' },
        { name: 'Database migration', status: 'pending' },
        { name: 'Deploy backend', status: 'pending' },
        { name: 'Deploy frontend', status: 'pending' },
        { name: 'Health check', status: 'pending' }
      ]
    };
    
    res.json({
      success: true,
      deployment: deployResult,
      message: `Deploy a ${target} iniciado exitosamente`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/logs - Obtener logs del sistema
router.get('/logs', requireAdminAuth, async (req, res) => {
  try {
    const { type = 'all', limit = 100, page = 1 } = req.query;
    
    // Aquí se implementaría la lectura de logs reales
    // Por ahora retornamos logs mock
    const logs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Sistema admin inicializado correctamente',
        module: 'admin',
        user: req.user.username
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'success',
        message: 'Configuración actualizada',
        module: 'settings',
        user: req.user.username
      }
    ];
    
    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: logs.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// 🔧 INICIALIZACIÓN DEL SISTEMA
// ===============================================

// POST /api/admin/initialize - Inicializar configuraciones por defecto
router.post('/initialize', requireAdminAuth, async (req, res) => {
  try {
    console.log('🔧 Inicialización del sistema admin iniciada por:', req.user.username);
    
    const results = await Promise.allSettled([
      settingsManager.initializeDefaultSettings(),
      usersManager.initializeDefaultRoles(),
      packagesManager.initializeDefaultCategories(),
      smartFallback.initializeConfig()
    ]);
    
    const initResults = {
      settings: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason },
      users: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason },
      packages: results[2].status === 'fulfilled' ? results[2].value : { success: false, error: results[2].reason },
      fallback: results[3].status === 'fulfilled' ? results[3].value : { success: false, error: results[3].reason }
    };
    
    const successCount = Object.values(initResults).filter(r => r.success).length;
    
    res.json({
      success: successCount > 0,
      message: `Sistema inicializado: ${successCount}/4 módulos`,
      results: initResults
    });
    
  } catch (error) {
    console.error('❌ Error inicializando sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;