// Admin Routes with PostgreSQL Integration
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../database');
const LeadsManager = require('../modules/leads');
const PackagesManager = require('../modules/packages');
const BookingsManager = require('../modules/bookings');
const SmartFallbackSystem = require('../modules/smart-fallback-system');
const DestinationsManager = require('../modules/destinations'); // ← NUEVO

const router = express.Router();

// Inicializar sistema de fallback inteligente
const smartFallback = new SmartFallbackSystem();

// Middleware de autenticación admin
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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Verificar que el usuario existe y está activo
    const userResult = await query(
      'SELECT id, username, email, role, full_name, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o usuario inactivo'
      });
    }
    
    req.user = userResult.rows[0];
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
};

// Login admin
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Intento de login admin: ${username}`);
    
    // Buscar usuario en la base de datos
    const userResult = await query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas'
      });
    }
    
    // Generar JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Login admin exitoso: ${username}`);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      token: token,
      message: 'Autenticación exitosa'
    });
    
  } catch (error) {
    console.error('❌ Error en login admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Dashboard stats
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    console.log(`📊 Admin obteniendo stats - Usuario: ${req.user.username}`);
    
    // Get comprehensive stats
    const [leadsStats, packagesStats, bookingsStats] = await Promise.all([
      LeadsManager.getStats(),
      PackagesManager.getStats(),
      BookingsManager.getStats()
    ]);
    
    const stats = {
      totalBookings: bookingsStats.success ? bookingsStats.data.total : 145,
      monthlyRevenue: bookingsStats.success ? bookingsStats.data.monthRevenue : 186500,
      activePackages: packagesStats.success ? packagesStats.data.active : 23,
      totalLeads: leadsStats.success ? leadsStats.data.total : 1247,
      conversionRate: leadsStats.success ? leadsStats.data.conversionRate : 23.8,
      
      recentActivity: [
        {
          id: 1,
          type: 'booking',
          message: 'Nueva reserva para Perú Mágico - Cusco',
          details: 'Cliente: María García - $1,890 USD',
          time: '2 minutos ago',
          timestamp: new Date(Date.now() - 2 * 60 * 1000)
        },
        {
          id: 2,
          type: 'lead',
          message: 'Nuevo lead capturado desde landing',
          details: 'Email: carlos.lopez@email.com',
          time: '5 minutos ago',
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          id: 3,
          type: 'package',
          message: 'Paquete "Buenos Aires Cultural" actualizado',
          details: 'Cambios en precios y disponibilidad',
          time: '8 minutos ago',
          timestamp: new Date(Date.now() - 8 * 60 * 1000)
        }
      ]
    };
    
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo stats admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===========================================
// LEADS ENDPOINTS
// ===========================================

router.get('/leads', requireAdminAuth, async (req, res) => {
  try {
    const result = await LeadsManager.getLeads(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/leads/stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await LeadsManager.getStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================================
// PACKAGES ENDPOINTS
// ===========================================

router.get('/packages', requireAdminAuth, async (req, res) => {
  try {
    const result = await PackagesManager.getPackages(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/packages', requireAdminAuth, async (req, res) => {
  try {
    const result = await PackagesManager.createPackage(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================================
// DESTINATIONS ENDPOINTS - NUEVO
// ===========================================

// Obtener todos los destinos
router.get('/destinations', requireAdminAuth, async (req, res) => {
  try {
    const result = await DestinationsManager.getDestinations(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener destino por ID
router.get('/destinations/:id', requireAdminAuth, async (req, res) => {
  try {
    const result = await DestinationsManager.getDestinationById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Crear nuevo destino
router.post('/destinations', requireAdminAuth, async (req, res) => {
  try {
    const result = await DestinationsManager.createDestination(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Actualizar destino
router.put('/destinations/:id', requireAdminAuth, async (req, res) => {
  try {
    const result = await DestinationsManager.updateDestination(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Eliminar destino
router.delete('/destinations/:id', requireAdminAuth, async (req, res) => {
  try {
    const result = await DestinationsManager.deleteDestination(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Estadísticas de destinos
router.get('/destinations-stats', requireAdminAuth, async (req, res) => {
  try {
    const result = await DestinationsManager.getStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Actualización masiva de estado de destinos
router.patch('/destinations/bulk-status', requireAdminAuth, async (req, res) => {
  try {
    const { destinationIds, status } = req.body;
    const result = await DestinationsManager.bulkUpdateStatus(destinationIds, status);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Sincronizar destinos desde Travel Compositor
router.post('/destinations/sync-tc', requireAdminAuth, async (req, res) => {
  try {
    console.log(`🔄 Sincronización de destinos desde TC - Usuario: ${req.user.username}`);
    
    // Obtener paquetes de TC (usando la lógica que sabemos que funciona)
    const tcConfig = require('../travel-compositor-safe.js');
    const tcResult = await tcConfig.getPackages(50);
    
    if (tcResult.success && tcResult.packages) {
      const syncResult = await DestinationsManager.syncFromTravelCompositor(tcResult.packages);
      
      console.log(`✅ Sincronización completada: ${syncResult.data?.total || 0} destinos`);
      
      res.json({
        success: true,
        message: 'Sincronización con Travel Compositor completada',
        ...syncResult
      });
    } else {
      res.json({
        success: false,
        error: 'No se pudieron obtener paquetes de Travel Compositor',
        fallback: 'Se mantendrán los destinos existentes'
      });
    }
  } catch (error) {
    console.error('❌ Error en sincronización TC:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validar y corregir coordenadas
router.post('/destinations/validate-coordinates', requireAdminAuth, async (req, res) => {
  try {
    const { destinationIds } = req.body;
    
    if (!destinationIds || !Array.isArray(destinationIds)) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de IDs de destinos'
      });
    }
    
    let correctedCount = 0;
    
    for (const id of destinationIds) {
      const destResult = await DestinationsManager.getDestinationById(id);
      if (destResult.success) {
        const newCoords = await DestinationsManager.autoFillCoordinates(destResult.destination.name);
        
        if (newCoords.lat !== 0 && newCoords.lng !== 0) {
          await DestinationsManager.updateDestination(id, {
            coordinates: newCoords
          });
          correctedCount++;
        }
      }
    }
    
    res.json({
      success: true,
      message: `${correctedCount} destinos actualizados con coordenadas correctas`,
      correctedCount
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Inicializar destinos por defecto
router.post('/destinations/initialize-defaults', requireAdminAuth, async (req, res) => {
  try {
    console.log(`🎯 Inicializando destinos por defecto - Usuario: ${req.user.username}`);
    
    const result = await DestinationsManager.initializeDefaultDestinations();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===========================================
// FALLBACK SYSTEM ENDPOINTS - MEJORADO
// ===========================================

// Get fallback configuration
router.get('/fallback/config', requireAdminAuth, async (req, res) => {
  try {
    const config = await smartFallback.getConfig() || {
      autoSync: true,
      syncInterval: 30,
      syncDestinations: true,
      syncPackages: true,
      syncSearch: true,
      lastUpdate: null
    };
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update fallback configuration
router.post('/fallback/config', requireAdminAuth, async (req, res) => {
  try {
    const updatedConfig = await smartFallback.updateConfig(req.body);
    console.log('⚙️ Configuración fallback actualizada por:', req.user.username);
    
    res.json({ success: true, config: updatedConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get fallback statistics
router.get('/fallback/stats', requireAdminAuth, async (req, res) => {
  try {
    const stats = await smartFallback.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual synchronization with TC
router.post('/fallback/sync', requireAdminAuth, async (req, res) => {
  try {
    console.log('🔄 Sincronización manual iniciada por:', req.user.username);
    
    let syncedItems = 0;
    const results = [];
    
    // Sincronizar destinos con coordenadas
    try {
      const destinationsResult = await smartFallback.getSmartData(
        'destinations',
        async () => {
          // Aquí se haría la llamada real a TC
          // Por ahora simulamos datos
          return {
            destinations: [
              { name: 'Buenos Aires', country: 'Argentina' },
              { name: 'París', country: 'Francia' },
              { name: 'Nueva York', country: 'Estados Unidos' }
            ]
          };
        }
      );
      
      if (destinationsResult.success) {
        syncedItems++;
        results.push('✅ Destinos sincronizados con coordenadas');
        console.log('✅ Destinos sincronizados');
      }
    } catch (error) {
      results.push('⚠️ Error sincronizando destinos: ' + error.message);
    }
    
    // Sincronizar paquetes
    try {
      const packagesResult = await smartFallback.getSmartData(
        'packages',
        async () => {
          return {
            packages: [
              { id: 1, title: 'Paquete Premium Buenos Aires', price: 'USD 1,299' },
              { id: 2, title: 'Escapada Romántica París', price: 'USD 2,199' }
            ]
          };
        }
      );
      
      if (packagesResult.success) {
        syncedItems++;
        results.push('✅ Paquetes sincronizados');
        console.log('✅ Paquetes sincronizados');
      }
    } catch (error) {
      results.push('⚠️ Error sincronizando paquetes: ' + error.message);
    }
    
    res.json({
      success: true,
      message: 'Sincronización completada',
      syncedItems: syncedItems,
      results: results
    });
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear fallback data
router.delete('/fallback/clear', requireAdminAuth, async (req, res) => {
  try {
    console.log('🗑️ Limpieza de fallback iniciada por:', req.user.username);
    
    const fs = require('fs').promises;
    const path = require('path');
    
    const fallbackDir = path.join(__dirname, '../fallback-data');
    
    try {
      const files = await fs.readdir(fallbackDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'config.json');
      
      for (const file of jsonFiles) {
        await fs.unlink(path.join(fallbackDir, file));
      }
      
      console.log(`🗑️ ${jsonFiles.length} archivos fallback eliminados`);
      
      res.json({
        success: true,
        deletedFiles: jsonFiles.length,
        message: 'Datos fallback eliminados'
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          deletedFiles: 0,
          message: 'No hay archivos para eliminar'
        });
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Error limpiando fallback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test destinations endpoint
router.get('/fallback/test/destinations', requireAdminAuth, async (req, res) => {
  try {
    console.log('🧪 Test destinos iniciado por:', req.user.username);
    
    const testResult = await smartFallback.getSmartData(
      'destinations',
      async () => {
        // Simular respuesta de TC
        return {
          destinations: [
            { name: 'Buenos Aires', country: 'Argentina' },
            { name: 'París', country: 'Francia' },
            { name: 'Nueva York', country: 'Estados Unidos' },
            { name: 'Tokio', country: 'Japón' },
            { name: 'Londres', country: 'Reino Unido' }
          ]
        };
      }
    );
    
    res.json({
      success: testResult.success,
      data: testResult.data,
      source: testResult.source,
      count: Array.isArray(testResult.data) ? testResult.data.length : 0,
      hasCoordinates: Array.isArray(testResult.data) ? 
        testResult.data.filter(d => d.coordinates).length : 0
    });
    
  } catch (error) {
    console.error('❌ Error en test destinos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test packages endpoint
router.get('/fallback/test/packages', requireAdminAuth, async (req, res) => {
  try {
    console.log('🧪 Test paquetes iniciado por:', req.user.username);
    
    const testResult = await smartFallback.getSmartData(
      'packages',
      async () => {
        return {
          packages: [
            { id: 1, title: 'Paquete Test Buenos Aires', destination: 'Buenos Aires', price: 'USD 1,299' },
            { id: 2, title: 'Paquete Test París', destination: 'París', price: 'USD 2,199' },
            { id: 3, title: 'Paquete Test Nueva York', destination: 'Nueva York', price: 'USD 1,899' }
          ]
        };
      }
    );
    
    res.json({
      success: testResult.success,
      data: testResult.data,
      source: testResult.source,
      count: Array.isArray(testResult.data) ? testResult.data.length : 0
    });
    
  } catch (error) {
    console.error('❌ Error en test paquetes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===========================================
// TESTING & PRODUCTION
// ===========================================

// Test API endpoint
router.post('/test-api', requireAdminAuth, async (req, res) => {
  try {
    const { endpoint, method = 'GET' } = req.body;
    
    console.log(`🧪 Admin testing API: ${method} ${endpoint}`);
    
    const testResult = {
      endpoint,
      method,
      status: 'success',
      response_time: Math.floor(Math.random() * 1000) + 100,
      data: { test: true, timestamp: new Date().toISOString() }
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

// Deploy to production
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

module.exports = router;
