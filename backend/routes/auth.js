// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: {
    error: 'Demasiados intentos de login. Intenta nuevamente en 15 minutos.',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/admin/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación de entrada
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    console.log(`🔍 Intento de login: ${email} desde ${req.ip}`);

    // CREDENCIALES TEMPORALES PARA TESTING - REEMPLAZAR CON BD REAL
    if (email === 'admin@intertravel.com' && password === 'admin123') {
      // Generar JWT token
      const token = jwt.sign(
        { 
          id: 1, 
          email: email, 
          role: 'super_admin',
          name: 'Administrador'
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Cookie segura
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas
      });

      console.log(`✅ Login exitoso: ${email}`);

      res.json({
        success: true,
        user: {
          id: 1,
          email: email,
          role: 'super_admin',
          name: 'Administrador'
        }
      });
    } else {
      console.warn(`❌ Login fallido: ${email}`);
      res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/admin/auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Limpiar cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    console.log(`👋 Logout exitoso: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });

  } catch (error) {
    console.error('💥 Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/auth/verify
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name
    }
  });
});

// POST /api/admin/auth/refresh
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    // Generar nuevo token con la misma información
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        role: req.user.role,
        name: req.user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Actualizar cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    };

    res.cookie('authToken', newToken, cookieOptions);

    console.log(`🔄 Token renovado: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Token renovado correctamente'
    });

  } catch (error) {
    console.error('💥 Error renovando token:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
