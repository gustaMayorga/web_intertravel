// API Routes para App Cliente - InterTravel (VERSIÓN CORREGIDA)
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Intentar cargar database, con fallback si no está disponible
let query;
try {
  const { query: dbQuery } = require('../database');
  query = dbQuery;
  console.log('✅ Database module loaded for app-client routes');
} catch (error) {
  console.warn('⚠️ Database not available for app-client, using mock query function');
  // Mock query function para desarrollo/testing
  query = async (sql, params) => {
    console.log('🔄 Mock query called:', sql.substring(0, 50) + '...');
    
    // Mock responses para testing
    if (sql.includes('SELECT') && sql.includes('users') && sql.includes('email')) {
      return { 
        rows: [{
          id: 1,
          username: 'test@test.com',
          email: 'test@test.com',
          password_hash: await bcrypt.hash('123456', 10),
          role: 'user',
          full_name: 'Test User',
          first_name: 'Test',
          last_name: 'User',
          phone: '123456789',
          is_active: true,
          created_at: new Date()
        }]
      };
    }
    
    if (sql.includes('INSERT INTO users')) {
      return {
        rows: [{
          id: Math.floor(Math.random() * 1000),
          username: params[1],
          email: params[1],
          full_name: params[4],
          role: 'user',
          created_at: new Date()
        }]
      };
    }
    
    return { rows: [] };
  };
}

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }
    req.user = user;
    next();
  });
};

// ======================================
// HEALTH CHECK (SIEMPRE PRIMERO)
// ======================================

/**
 * GET /api/app/health
 * Health check para app cliente
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'App Cliente API funcionando',
    timestamp: new Date().toISOString(),
    database: query.toString().includes('Mock') ? 'mock' : 'connected',
    endpoints: {
      auth: '/api/app/auth/login',
      register: '/api/app/auth/register',
      profile: '/api/app/user/profile',
      bookings: '/api/app/user/bookings',
      stats: '/api/app/user/stats'
    }
  });
});

// ======================================
// AUTENTICACIÓN PARA APP CLIENTE
// ======================================

/**
 * POST /api/app/auth/login
 * Login específico para app cliente
 */
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📱 App Cliente - Login attempt:', email);

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const userResult = await query(
      'SELECT id, username, email, password_hash, role, full_name, first_name, last_name, phone, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = userResult.rows[0];

    // Verificar si está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Cuenta desactivada. Contacta soporte.'
      });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '30d' } // Token de larga duración para app móvil
    );

    console.log('✅ App Cliente - Login exitoso:', user.id);

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Error en login app cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/app/auth/register
 * Registro para app cliente
 */
router.post('/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    console.log('📱 App Cliente - Registro:', email);

    // Validaciones
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await query(`
      INSERT INTO users (
        username, email, password_hash, role, full_name, 
        first_name, last_name, phone, is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, username, email, full_name, role, created_at
    `, [
      email.toLowerCase(),
      email.toLowerCase(),
      passwordHash,
      'user',
      `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone || null,
      true,
      new Date()
    ]);

    const user = newUser.rows[0];

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ App Cliente - Registro exitoso:', user.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        firstName: firstName,
        lastName: lastName,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Error en registro app cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// PERFIL DE USUARIO
// ======================================

/**
 * GET /api/app/user/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await query(`
      SELECT id, username, email, full_name, first_name, last_name, 
             phone, role, is_active, created_at
      FROM users 
      WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        joinDate: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// ESTADÍSTICAS MOCK PARA DESARROLLO
// ======================================

/**
 * GET /api/app/user/stats
 * Estadísticas del usuario
 */
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    // Datos mock para desarrollo
    res.json({
      success: true,
      stats: {
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        completedBookings: 0,
        totalSpent: 0,
        confirmedSpent: 0,
        avgBookingValue: 0
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/app/user/bookings
 * Obtener reservas del usuario autenticado
 */
router.get('/user/bookings', authenticateToken, async (req, res) => {
  try {
    // Datos mock para desarrollo
    res.json({
      success: true,
      bookings: [],
      total: 0,
      user: {
        id: req.user.userId,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
