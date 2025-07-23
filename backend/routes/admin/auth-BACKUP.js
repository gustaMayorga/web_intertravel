// ===============================================
// SISTEMA DE AUTENTICACIÓN ADMIN - INTERTRAVEL
// Login, logout y gestión de sesiones
// ===============================================

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    success: false,
    error: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===============================================
// 🔐 LOGIN ENDPOINT
// ===============================================
router.post('/login', loginLimiter, async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    
    const { username, password } = req.body;
    
    // Validación simple para testing
    if (username === 'admin' && password === 'admin123') {
      // Generar JWT real
      const payload = {
        id: 1,
        username: 'admin',
        role: 'admin',
        permissions: ['admin'],
        iat: Math.floor(Date.now() / 1000)
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'intertravel-fixed-secret-key', {
        expiresIn: '24h'
      });
      
      console.log('✅ JWT token generated successfully');
      
      res.json({
        success: true,
        message: 'Login exitoso',
        user: {
          id: 1,
          username: 'admin',
          role: 'admin',
          permissions: ['admin']
        },
        token: token
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno en login'
    });
  }
});

// ===============================================
// 🚪 LOGOUT ENDPOINT
// ===============================================
router.post('/logout', (req, res) => {
  try {
    console.log('🚪 Logout request');
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno en logout'
    });
  }
});

// ===============================================
// 👤 VERIFICAR SESIÓN ACTUAL
// ===============================================
router.get('/verify', async (req, res) => {
  try {
    // Este endpoint usa el middleware de auth automáticamente
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        permissions: req.user.permissions
      },
      session: {
        sessionId: req.user.sessionId,
        authenticated: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error verificando sesión:', error);
    res.status(500).json({
      success: false,
      error: 'Error verificando sesión'
    });
  }
});

// ===============================================
// 🔄 REFRESH TOKEN
// ===============================================
router.post('/refresh', async (req, res) => {
  try {
    // En este caso, simplemente confirmamos que la sesión es válida
    // En una implementación más compleja, se generaría un nuevo token
    res.json({
      success: true,
      message: 'Token válido',
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        permissions: req.user.permissions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Error refrescando token'
    });
  }
});

module.exports = router;
