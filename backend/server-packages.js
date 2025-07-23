// =============================================== 
// SERVIDOR SIMPLE CON PAQUETES OPTIMIZADOS 
// =============================================== 
 
require('dotenv').config(); 
const express = require('express'); 
const cors = require('cors'); 
 
const app = express(); 
const PORT = process.env.PORT || 3002; 
 
// Middleware básico 
app.use(cors({ 
  origin: ['http://localhost:3005', 'http://localhost:3009'], 
  credentials: true 
})); 
app.use(express.json()); 
 
// Health check 
app.get('/api/health', (req, res) => { 
  res.json({ 
    status: 'OK', 
    secure: true, 
    timestamp: new Date().toISOString(), 
    message: 'Backend con paquetes optimizados' 
  }); 
}); 
 
// Cargar Travel Compositor 
let travelCompositor; 
try { 
  travelCompositor = require('./travel-compositor-optimized'); 
  console.log('✅ Travel Compositor optimizado cargado'); 
} catch (e) { 
  console.log('⚠️ Travel Compositor no disponible:', e.message); 
  travelCompositor = null; 
} 
 
// Rutas de paquetes manuales si falla la carga automática 
if (travelCompositor) { 
  try { 
    const packagesRoutes = require('./routes/packages'); 
    app.use('/api/packages', packagesRoutes); 
    console.log('✅ Rutas de paquetes optimizadas cargadas'); 
  } catch (error) { 
    console.log('⚠️ Error cargando rutas optimizadas:', error.message); 
    // Implementar rutas básicas manuales 
    setupBasicPackageRoutes(app, travelCompositor); 
  } 
} else { 
  setupEmergencyPackageRoutes(app); 
} 
 
// Función para rutas básicas 
function setupBasicPackageRoutes(app, tc) { 
  console.log('🔧 Configurando rutas básicas de paquetes...'); 
 
  // GET /api/packages 
  app.get('/api/packages', async (req, res) => { 
    try { 
      const page = parseInt(req.query.page) || 1; 
      const limit = parseInt(req.query.limit) || 12; 
      const result = await tc.getAllPackages({ page, limit }); 
      res.json({ 
        success: true, 
        data: result.packages || [], 
        pagination: { 
          page, limit, 
          total: result.total || 0, 
          hasMore: result.hasMore || false 
        }, 
        metadata: { source: result.source || 'manual' } 
      }); 
    } catch (error) { 
      res.status(500).json({ success: false, error: error.message }); 
    } 
  }); 
 
  // GET /api/packages/featured 
  app.get('/api/packages/featured', async (req, res) => { 
    try { 
      const limit = parseInt(req.query.limit) || 6; 
      const result = await tc.getAllPackages({ limit: 20 }); 
      const featured = result.packages.filter(p => p.featured).slice(0, limit); 
      res.json({ 
        success: true, 
        data: featured, 
        metadata: { totalFeatured: featured.length, source: result.source } 
      }); 
    } catch (error) { 
      res.status(500).json({ success: false, error: error.message }); 
    } 
  }); 
 
  // GET /api/packages/search/simple 
  app.get('/api/packages/search/simple', async (req, res) => { 
    try { 
      const destination = req.query.destination || req.query.q; 
      if (!destination) { 
        return res.status(400).json({ success: false, error: 'Destino requerido' }); 
      } 
      const result = await tc.searchByDestination(destination); 
      res.json({ 
        success: true, 
        data: result.packages || [], 
        searchInfo: { query: destination, total: result.total || 0 } 
      }); 
    } catch (error) { 
      res.status(500).json({ success: false, error: error.message }); 
    } 
  }); 
 
  // GET /api/packages/connection/status 
  app.get('/api/packages/connection/status', (req, res) => { 
    try { 
      const status = tc.getConnectionStatus(); 
      res.json({ success: true, connection: status }); 
    } catch (error) { 
      res.json({ success: false, error: error.message }); 
    } 
  }); 
 
  console.log('✅ Rutas básicas de paquetes configuradas'); 
} 
 
// Función para rutas de emergencia 
function setupEmergencyPackageRoutes(app) { 
  console.log('🆘 Configurando rutas de emergencia...'); 
  app.get('/api/packages', (req, res) => { 
    res.json({ success: true, data: [], message: 'Sistema en emergencia' }); 
  }); 
  app.get('/api/packages/featured', (req, res) => { 
    res.json({ success: true, data: [], metadata: { source: 'emergency' } }); 
  }); 
} 
 
// Iniciar servidor 
app.listen(PORT, () => { 
  console.log('🚀 SERVIDOR PAQUETES OPTIMIZADOS'); 
  console.log('====================================='); 
  console.log(`🌐 Puerto: ${PORT}`); 
  console.log('📦 Paquetes: Optimizados con Travel Compositor'); 
  console.log('🔗 APIs disponibles:'); 
  console.log('   GET /api/packages'); 
  console.log('   GET /api/packages/featured'); 
  console.log('   GET /api/packages/search/simple'); 
  console.log('   GET /api/packages/connection/status'); 
  console.log('====================================='); 
}); 
