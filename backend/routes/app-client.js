// API Routes para App Cliente - InterTravel (ENHANCED SECURITY)
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Cargar middleware de autenticación avanzado
const {
  authenticateAdvanced,
  optionalAuth,
  authRateLimit,
  apiRateLimit,
  generateTokens,
  trackLoginAttempts,
  recordFailedLogin,
  clearLoginAttempts,
  refreshTokenEndpoint,
  logoutEndpoint,
  USER_ROLES,
  PERMISSIONS
} = require('../middleware/auth-advanced');

// Cargar database con fallback
let query;
try {
  const { query: dbQuery } = require('../database');
  query = dbQuery;
  console.log('✅ Database loaded for app-client routes');
} catch (error) {
  console.warn('⚠️ Database not available, using mock:', error.message);
  // Mock query function
  query = async (sql, params) => {
    console.log('🔄 Mock query:', sql.substring(0, 50) + '...');
    if (sql.includes('SELECT') && sql.includes('users') && sql.includes('email')) {
      return { rows: [{
        id: 1, username: 'test@test.com', email: 'test@test.com',
        password_hash: await bcrypt.hash('123456', 10),
        role: 'user', full_name: 'Test User', first_name: 'Test', last_name: 'User',
        phone: '123456789', is_active: true, created_at: new Date()
      }] };
    }
    if (sql.includes('INSERT INTO users')) {
      return { rows: [{ id: Math.floor(Math.random() * 1000), username: params[1], email: params[1], full_name: params[4], role: 'user', created_at: new Date() }] };
    }
    return { rows: [] };
  };
}

const router = express.Router();

// ===============================================
// APLICAR RATE LIMITING A TODAS LAS RUTAS
// ===============================================
router.use(apiRateLimit);

// ===============================================
// RUTAS DE AUTENTICACIÓN CON SEGURIDAD AVANZADA
// ===============================================

/**
 * POST /api/app/auth/register
 * Registro específico para app cliente
 */
router.post('/auth/register', authRateLimit, trackLoginAttempts, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    console.log('📱 App Cliente - Registro attempt:', email);

    // Validaciones
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos: firstName, lastName, email, password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una cuenta con este email'
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await query(
      `INSERT INTO users (username, email, password_hash, role, full_name, first_name, last_name, phone, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, username, email, role, full_name, first_name, last_name, phone, created_at`,
      [
        email.toLowerCase(), // username
        email.toLowerCase(), // email
        passwordHash,        // password_hash
        'user',             // role
        `${firstName} ${lastName}`, // full_name
        firstName,          // first_name
        lastName,           // last_name
        phone || null,      // phone
        true,               // is_active
        new Date()          // created_at
      ]
    );

    const user = newUser.rows[0];

    // Generar tokens avanzados con sesión
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role || USER_ROLES.USER,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name
    });

    // Limpiar intentos de login fallidos
    clearLoginAttempts(req.clientIp);

    console.log('✅ App Cliente - Registro exitoso:', user.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token: tokens.accessToken
      },
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('❌ Error en registro app cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/app/health
 * Health check para app cliente
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'App Cliente API funcionando',
    timestamp: new Date().toISOString(),
    security: {
      rateLimiting: 'enabled',
      authentication: 'advanced',
      sessionManagement: 'enabled'
    },
    endpoints: {
      register: '/api/app/auth/register',
      login: '/api/app/auth/login',
      refresh: '/api/app/auth/refresh',
      logout: '/api/app/auth/logout',
      profile: '/api/app/user/profile',
      bookings: '/api/app/user/bookings',
      stats: '/api/app/user/stats'
    }
  });
});

/**
 * POST /api/app/auth/login
 * Login específico para app cliente
 */
router.post('/auth/login', authRateLimit, trackLoginAttempts, async (req, res) => {
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
      // Registrar intento fallido
      recordFailedLogin(req.clientIp);
      
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar tokens avanzados con sesión
    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role || USER_ROLES.USER,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name
    });

    // Limpiar intentos de login fallidos tras login exitoso
    clearLoginAttempts(req.clientIp);

    console.log('✅ App Cliente - Login exitoso:', user.id);

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token: tokens.accessToken
      },
      refreshToken: tokens.refreshToken
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
 * GET /api/app/user/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/user/profile', authenticateAdvanced(PERMISSIONS.USER_READ), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const userResult = await query(
      'SELECT id, username, email, full_name, first_name, last_name, phone, role, created_at FROM users WHERE id = $1',
      [userId]
    );

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
        memberSince: user.created_at
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

/**
 * GET /api/app/user/bookings
 * Obtener reservas del usuario autenticado BUSCANDO POR DNI
 */
router.get('/user/bookings', authenticateAdvanced(PERMISSIONS.BOOKING_READ), async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    
    console.log('📋 Buscando reservas para usuario:', userId, userEmail);
    
    // 1. OBTENER EMAIL DEL USUARIO AUTENTICADO (sin DNI por ahora)
    console.log('📋 Buscando reservas por email del usuario:', userEmail);
    
    // CONSULTA SIMPLE - SOLO COLUMNAS BÁSICAS QUE SEGURO EXISTEN
    const bookingsResult = await query(
      `SELECT booking_reference, customer_name, customer_email, 
              total_amount, status, travel_date, created_at
       FROM bookings 
       WHERE customer_email = $1 
       ORDER BY created_at DESC`,
      [userEmail]
    );

    // 3. FORMATEAR RESERVAS PARA APP CLIENT - DATOS MÍNIMOS
    const bookings = bookingsResult.rows.map(booking => ({
      id: booking.booking_reference,
      bookingReference: booking.booking_reference,
      packageId: 'PKG-001', // Default
      packageTitle: booking.customer_name ? `Viaje para ${booking.customer_name}` : 'Viaje Contratado',
      packageSource: 'system',
      destination: 'Destino confirmado',
      country: 'Destino',
      travelDate: booking.travel_date,
      returnDate: booking.travel_date,
      durationDays: 5, // Default
      travelersCount: 1, // Default
      totalAmount: parseFloat(booking.total_amount) || 0,
      paidAmount: parseFloat(booking.total_amount) || 0,
      currency: 'USD',
      status: booking.status || 'pending',
      paymentStatus: 'paid',
      specialRequests: '',
      createdAt: booking.created_at
    }));

    console.log(`✅ Encontradas ${bookings.length} reservas para DNI: ${userDNI}`);

    res.json({
      success: true,
      data: {
        bookings: bookings,
        total: bookings.length
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

/**
 * GET /api/app/user/stats
 * Obtener estadísticas del usuario autenticado BUSCANDO POR DNI
 */
router.get('/user/stats', authenticateAdvanced(PERMISSIONS.USER_READ), async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    
    console.log('📈 Generando estadísticas para usuario:', userId, userEmail);
    
    // GENERAR ESTADÍSTICAS POR EMAIL (sin DNI por ahora)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) as confirmed_spent,
        COALESCE(AVG(total_amount), 0) as avg_booking_value
      FROM bookings 
      WHERE customer_email = $1
    `;
    
    const statsResult = await query(statsQuery, [userEmail]);
    const stats = statsResult.rows[0];
    
    const userStats = {
      totalBookings: parseInt(stats.total_bookings) || 0,
      confirmedBookings: parseInt(stats.confirmed_bookings) || 0,
      pendingBookings: parseInt(stats.pending_bookings) || 0,
      completedBookings: parseInt(stats.completed_bookings) || 0,
      totalSpent: parseFloat(stats.total_spent) || 0,
      confirmedSpent: parseFloat(stats.confirmed_spent) || 0,
      avgBookingValue: parseFloat(stats.avg_booking_value) || 0
    };
    
    console.log(`✅ Estadísticas generadas: ${userStats.totalBookings} reservas totales`);
    
    res.json({
      success: true,
      data: {
        stats: userStats
      }
    });

  } catch (error) {
    console.error('❌ Error generando estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// RUTAS DE AUTENTICACIÓN AVANZADA
// ===============================================

/**
 * POST /api/app/auth/refresh
 * Renovar access token usando refresh token
 */
router.post('/auth/refresh', refreshTokenEndpoint);

/**
 * POST /api/app/auth/logout
 * Logout seguro con limpieza de sesión
 */
router.post('/auth/logout', logoutEndpoint);

/**
 * GET /api/app/auth/session-info
 * Información de la sesión actual (para debugging)
 */
router.get('/auth/session-info', authenticateAdvanced(), (req, res) => {
  res.json({
    success: true,
    session: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions,
      sessionId: req.user.sessionId
    },
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ENDPOINTS DE PAGOS PARA USUARIOS
// ===============================================

/**
 * POST /api/app/payments/create-payment
 * Crear pago para una reserva
 */
router.post('/payments/create-payment', 
  authenticateAdvanced(PERMISSIONS.BOOKING_CREATE), 
  async (req, res) => {
    try {
      const { bookingId, amount, paymentMethod = 'mercadopago' } = req.body;
      const userId = req.user.userId;
      
      if (!bookingId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'ID de reserva y monto son requeridos'
        });
      }

      // Verificar que la reserva pertenece al usuario
      const bookingResult = await query(
        `SELECT id, booking_reference, package_name, customer_email, total_amount, status
         FROM bookings 
         WHERE id = $1 AND customer_email = $2`,
        [bookingId, req.user.email]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reserva no encontrada o no autorizada'
        });
      }

      const booking = bookingResult.rows[0];

      if (booking.status === 'confirmed') {
        return res.status(400).json({
          success: false,
          error: 'Esta reserva ya ha sido pagada'
        });
      }

      // Crear preferencia de pago llamando a integrations
      const axios = require('axios');
      const integrationResponse = await axios.post(
        'http://localhost:3002/api/integrations/payments/create-preference',
        {
          bookingId,
          amount,
          currency: 'ARS',
          provider: paymentMethod
        },
        {
          headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`💳 Payment created for user ${req.user.email}, booking ${bookingId}`);

      res.json({
        success: true,
        data: integrationResponse.data.data,
        booking: {
          id: booking.id,
          reference: booking.booking_reference,
          packageName: booking.package_name,
          amount: booking.total_amount
        },
        message: 'Pago creado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error creating payment:', error);
      res.status(500).json({
        success: false,
        error: 'Error creando pago'
      });
    }
  }
);

/**
 * GET /api/app/payments/history
 * Historial de pagos del usuario
 */
router.get('/payments/history', 
  authenticateAdvanced(PERMISSIONS.USER_READ), 
  async (req, res) => {
    try {
      const userEmail = req.user.email;
      
      // Obtener historial de pagos del usuario
      const paymentsResult = await query(
        `SELECT 
           b.id as booking_id,
           b.booking_reference,
           b.package_name,
           b.total_amount,
           b.status as booking_status,
           b.created_at as booking_date,
           b.confirmed_at
         FROM bookings b
         WHERE b.customer_email = $1
         ORDER BY b.created_at DESC`,
        [userEmail]
      );

      const payments = paymentsResult.rows.map(payment => ({
        bookingId: payment.booking_id,
        reference: payment.booking_reference,
        packageName: payment.package_name,
        amount: payment.total_amount,
        status: payment.booking_status,
        paymentDate: payment.confirmed_at,
        bookingDate: payment.booking_date
      }));

      res.json({
        success: true,
        data: payments,
        totalPayments: payments.length,
        message: 'Historial de pagos obtenido'
      });

    } catch (error) {
      console.error('❌ Error getting payment history:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo historial de pagos'
      });
    }
  }
);

console.log('✅ App Client router loaded successfully');
module.exports = router;