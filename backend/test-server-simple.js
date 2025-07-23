// ===============================================
// TESTING RÁPIDO - VERIFICAR RUTAS ADMIN
// ===============================================

const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// ===============================================
// RUTAS DE PRUEBA DIRECTAS
// ===============================================

// TEST 1: Ruta auth simple
app.post('/api/admin/auth/login', (req, res) => {
  console.log('🔐 LOGIN TEST - Datos recibidos:', req.body);
  
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Login exitoso (TEST)',
      user: {
        id: 1,
        username: 'admin',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Credenciales inválidas'
    });
  }
});

// TEST 2: Ruta whatsapp simple
app.get('/api/admin/whatsapp-config', (req, res) => {
  console.log('📱 WHATSAPP CONFIG TEST');
  
  res.json({
    success: true,
    message: 'WhatsApp config (TEST)',
    config: {
      enabled: true,
      phoneNumber: '+5491112345678',
      defaultMessage: 'Test message'
    }
  });
});

// TEST 3: Ruta ping
app.get('/api/admin/ping', (req, res) => {
  console.log('🏓 PING TEST');
  
  res.json({
    success: true,
    message: 'Admin API funcionando (TEST)',
    timestamp: new Date().toISOString()
  });
});

// Catch all para ver qué rutas no coinciden
app.use('*', (req, res) => {
  console.log(`❌ RUTA NO ENCONTRADA: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    method: req.method,
    url: req.originalUrl
  });
});

// ===============================================
// INICIAR SERVIDOR
// ===============================================
const PORT = 3002;

app.listen(PORT, () => {
  console.log('🚀 SERVIDOR DE TESTING INICIADO');
  console.log(`📡 Puerto: ${PORT}`);
  console.log('');
  console.log('🎯 ENDPOINTS DE PRUEBA:');
  console.log('POST http://localhost:3002/api/admin/auth/login');
  console.log('GET  http://localhost:3002/api/admin/whatsapp-config');
  console.log('GET  http://localhost:3002/api/admin/ping');
  console.log('');
  console.log('🔍 Prueba estos endpoints y veremos si funcionan...');
});
