require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


// CORS y middleware básico
app.use(cors({ 
  origin: ['http://localhost:3005', 'http://localhost:3002', 'http://localhost:3009'], 
  credentials: true 
}));
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// CARGAR RUTAS APP
try {
  const fixRoutes = require('./fix-emergency-routes');
  app.use('/api/app', fixRoutes);
  console.log('✅ Fix emergency APP routes cargadas');
} catch (err) {
  console.error('❌ Error cargando fix routes:', err.message);
}

// CARGAR RUTAS ADMIN  
try {
  const fixAdminRoutes = require('./fix-emergency-admin');
  app.use('/api/admin', fixAdminRoutes);
  console.log('✅ Fix emergency ADMIN routes cargadas');
} catch (err) {
  console.error('❌ Error cargando fix admin routes:', err.message);
}

// 404 handler
app.use('/api/*', (req, res) => {
  console.log(`❌ Endpoint no encontrado: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint no encontrado', 
    path: req.path,
    method: req.method 
  });
});

// Root handler
app.get('*', (req, res) => {
  res.json({ 
    message: 'Emergency InterTravel Server', 
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: { 
      health: '/api/app/health',
      'check-dni': '/api/app/auth/check-dni',
      register: '/api/app/auth/register',
      'admin-bookings': '/api/admin/bookings'
    } 
  });
});

// Start server
app.listen(3002, () => {
  console.log('🚨 EMERGENCY SERVER - Puerto 3002');
  console.log('🌐 Health: http://localhost:3002');
  console.log('📱 Check DNI: http://localhost:3002/api/app/auth/check-dni');
  console.log('👥 Admin Bookings: http://localhost:3002/api/admin/bookings');
  console.log('⭐ Featured Packages: http://localhost:3002/api/admin/packages/featured');
});