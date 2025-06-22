// Agency Portal Authentication Routes
// ===================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { dbManager } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'intertravel-super-secret-key-2024';

// POST /api/auth/agency/login - Login específico para agencias
router.post('/agency/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Intento de login agencia: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username y password son requeridos'
      });
    }

    // Buscar usuario con datos de agencia
    const result = await dbManager.query(`
      SELECT 
        u.id, u.username, u.email, u.password_hash, u.role, u.full_name,
        u.agency_id, u.is_active, u.last_login,
        a.code as agency_code, a.name as agency_name,
        a.commission_rate, a.status as agency_status
      FROM users u
      LEFT JOIN agencies a ON u.agency_id = a.id
      WHERE u.username = $1 AND u.role IN ('admin_agencia', 'user_agencia')
    `, [username]);

    if (result.rows.length === 0) {
      console.log(`❌ Usuario de agencia no encontrado: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado o no es usuario de agencia'
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Usuario desactivado'
      });
    }

    // Verificar si la agencia está activa
    if (user.agency_status !== 'active') {
      return res.status(401).json({
        success: false,
        error: `Agencia en estado: ${user.agency_status}. Contacte al administrador.`
      });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log(`❌ Contraseña incorrecta para: ${username}`);
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }

    // Actualizar último login
    await dbManager.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Crear token JWT con información de agencia
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      agencyId: user.agency_id,
      agencyCode: user.agency_code,
      agencyName: user.agency_name,
      commissionRate: parseFloat(user.commission_rate) || 0
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: '24h' 
    });

    console.log(`✅ Login agencia exitoso: ${username} (${user.agency_name})`);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        agency: {
          id: user.agency_id,
          code: user.agency_code,
          name: user.agency_name,
          commissionRate: parseFloat(user.commission_rate) || 0
        }
      },
      token,
      message: `Bienvenido a ${user.agency_name}`
    });

  } catch (error) {
    console.error('❌ Error en login de agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/agency/profile - Perfil del usuario de agencia
router.get('/agency/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token requerido'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Obtener datos actualizados del usuario y agencia
    const result = await dbManager.query(`
      SELECT 
        u.id, u.username, u.email, u.full_name, u.role, u.last_login,
        u.is_active, u.created_at,
        a.id as agency_id, a.code as agency_code, a.name as agency_name,
        a.commission_rate, a.status as agency_status, a.current_balance,
        a.credit_limit
      FROM users u
      LEFT JOIN agencies a ON u.agency_id = a.id
      WHERE u.id = $1
    `, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        agency: {
          id: user.agency_id,
          code: user.agency_code,
          name: user.agency_name,
          status: user.agency_status,
          commissionRate: parseFloat(user.commission_rate) || 0,
          currentBalance: parseFloat(user.current_balance) || 0,
          creditLimit: parseFloat(user.credit_limit) || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
});

// GET /api/auth/agency/dashboard - Dashboard específico de agencia
router.get('/agency/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token requerido'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.agencyId) {
      return res.status(403).json({
        success: false,
        error: 'Token no válido para agencia'
      });
    }

    // Obtener estadísticas específicas de la agencia
    const statsResult = await dbManager.query(`
      SELECT 
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COALESCE(SUM(b.total_amount * a.commission_rate / 100), 0) as total_commission,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN b.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as bookings_this_month
      FROM agencies a
      LEFT JOIN users u ON a.id = u.agency_id
      LEFT JOIN bookings b ON u.email = b.customer_email
      WHERE a.id = $1
      GROUP BY a.id, a.commission_rate
    `, [decoded.agencyId]);

    const stats = statsResult.rows[0] || {
      total_bookings: 0,
      total_revenue: 0,
      total_commission: 0,
      confirmed_bookings: 0,
      bookings_this_month: 0
    };

    // Obtener reservas recientes
    const recentBookingsResult = await dbManager.query(`
      SELECT 
        b.id, b.booking_reference, b.customer_name, b.total_amount,
        b.status, b.created_at, b.travel_date
      FROM bookings b
      JOIN users u ON b.customer_email = u.email
      WHERE u.agency_id = $1
      ORDER BY b.created_at DESC
      LIMIT 5
    `, [decoded.agencyId]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalBookings: parseInt(stats.total_bookings),
          totalRevenue: parseFloat(stats.total_revenue),
          totalCommission: parseFloat(stats.total_commission),
          confirmedBookings: parseInt(stats.confirmed_bookings),
          bookingsThisMonth: parseInt(stats.bookings_this_month),
          conversionRate: stats.total_bookings > 0 ? 
            (stats.confirmed_bookings / stats.total_bookings * 100).toFixed(1) : 0
        },
        recentBookings: recentBookingsResult.rows,
        agency: {
          id: decoded.agencyId,
          code: decoded.agencyCode,
          name: decoded.agencyName,
          commissionRate: decoded.commissionRate
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
