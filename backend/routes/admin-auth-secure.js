// ===============================================
// RUTAS DE AUTENTICACIÓN SEGURAS - INTERTRAVEL
// ===============================================

const express = require('express');
const { 
  loginController, 
  logoutController, 
  loginLimiter,
  authMiddleware 
} = require('../middleware/auth-secure');

const router = express.Router();

// ===============================================
// RUTA DE LOGIN CON RATE LIMITING
// ===============================================

router.post('/login', loginLimiter, loginController);

// ===============================================
// RUTA DE LOGOUT (REQUIERE AUTENTICACIÓN)
// ===============================================

router.post('/logout', authMiddleware(['admin', 'super_admin']), logoutController);

// ===============================================
// RUTA DE VERIFICACIÓN DE TOKEN
// ===============================================

router.get('/verify', authMiddleware(['admin', 'super_admin']), (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

// ===============================================
// RUTA DE INFORMACIÓN DE SESIÓN
// ===============================================

router.get('/session', authMiddleware(['admin', 'super_admin']), (req, res) => {
  res.json({
    success: true,
    session: {
      username: req.user.username,
      role: req.user.role,
      permissions: req.user.permissions,
      sessionId: req.user.sessionId
    }
  });
});

module.exports = router;

console.log('✅ Secure admin auth routes loaded');
