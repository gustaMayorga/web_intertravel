// Rutas de Booking Analytics - Agente 4
const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../database');
const BookingAnalytics = require('../modules/booking-analytics');

const router = express.Router();
const bookingAnalytics = new BookingAnalytics();

// Middleware de autenticación
const requireAuth = async (req, res, next) => {
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

// GET /api/booking-analytics/metrics
router.get('/metrics', requireAuth, async (req, res) => {
  try {
    console.log('📊 Solicitando métricas de booking analytics');
    
    const period = req.query.period || '30d';
    const filters = {
      status: req.query.status,
      packageId: req.query.packageId,
      source: req.query.source
    };

    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const metrics = await bookingAnalytics.getBookingMetrics(period, filters);

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo métricas de booking analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/booking-analytics/realtime
router.get('/realtime', requireAuth, async (req, res) => {
  try {
    console.log('⚡ Solicitando dashboard en tiempo real');
    
    const dashboard = await bookingAnalytics.getRealtimeDashboard();

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo dashboard en tiempo real:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/booking-analytics/summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    console.log('📋 Solicitando resumen ejecutivo de booking analytics');
    
    const period = req.query.period || '30d';
    
    const metrics = await bookingAnalytics.getBookingMetrics(period);
    const realtime = await bookingAnalytics.getRealtimeDashboard();

    const summary = {
      period,
      overview: {
        totalBookings: metrics.summary?.totalBookings || 0,
        confirmedBookings: metrics.summary?.confirmedBookings || 0,
        totalRevenue: metrics.summary?.totalRevenue || 0,
        conversionRate: metrics.summary?.conversionRate || 0,
        uniqueCustomers: metrics.summary?.uniqueCustomers || 0
      },
      realtime: {
        todayBookings: realtime.realtime?.todayBookings || 0,
        todayRevenue: realtime.realtime?.todayRevenue || 0,
        lastHourBookings: realtime.realtime?.lastHourBookings || 0
      },
      trends: metrics.trends || {},
      insights: metrics.insights || [],
      topPackages: metrics.packages?.topPerformers?.byRevenue?.slice(0, 3) || [],
      topSources: metrics.sources?.sources?.slice(0, 3) || []
    };

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo resumen ejecutivo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// GET /api/booking-analytics/health
router.get('/health', requireAuth, async (req, res) => {
  try {
    const dbTest = await query('SELECT COUNT(*) as booking_count FROM bookings LIMIT 1');
    const cacheStatus = bookingAnalytics.metricsCache.size;
    const testMetrics = await bookingAnalytics.getRealtimeDashboard();

    const health = {
      status: 'healthy',
      database: {
        connected: true,
        bookingsTable: dbTest.rows[0]?.booking_count !== undefined
      },
      cache: {
        entries: cacheStatus,
        lastUpdate: bookingAnalytics.lastCacheUpdate
      },
      analytics: {
        module: 'operational',
        testPassed: testMetrics.success !== false
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('❌ Error en health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
});

module.exports = router;
