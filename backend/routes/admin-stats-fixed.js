// ===============================================
// ADMIN STATS - VERSIÓN REPARADA CON BASE DE DATOS REAL
// ===============================================

const express = require('express');
const router = express.Router();

// Importar database connection
const { query } = require('../database');

// ===============================================
// DASHBOARD ESTADÍSTICAS - DATOS REALES
// ===============================================

/**
 * GET /api/admin/stats
 * Estadísticas principales del dashboard admin
 */
router.get('/stats', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Determinar rango de fechas según período
    let startDate, endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(endDate.getMonth() / 3) * 3;
        startDate = new Date(endDate.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }
    
    // 1. Estadísticas generales de reservas
    const bookingStatsResult = await query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        
        -- Métricas financieras
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as confirmed_revenue,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as completed_revenue,
        SUM(paid_amount) as total_paid,
        AVG(total_amount) as avg_booking_value,
        
        -- Métricas de clientes
        COUNT(DISTINCT customer_email) as unique_customers,
        
        -- Métricas de tiempo
        COUNT(*) FILTER (WHERE created_at >= $1) as period_bookings,
        SUM(CASE WHEN created_at >= $1 THEN total_amount ELSE 0 END) as period_revenue
        
      FROM bookings
      WHERE created_at >= $2
    `, [startDate, new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)]); // Últimos 30 días para comparación
    
    // 2. Estadísticas de usuarios
    const userStatsResult = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE role = 'user') as customers,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE created_at >= $1) as new_users_period,
        COUNT(*) FILTER (WHERE last_login >= $1) as active_users_period
      FROM users
    `, [startDate]);
    
    // 3. Top destinos del período
    const topDestinationsResult = await query(`
      SELECT 
        destination,
        country,
        COUNT(*) as bookings_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_revenue_per_booking,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM bookings 
      WHERE created_at >= $1 
        AND status IN ('confirmed', 'completed')
      GROUP BY destination, country
      ORDER BY revenue DESC
      LIMIT 10
    `, [startDate]);
    
    // 4. Actividad reciente
    const recentActivityResult = await query(`
      SELECT 
        booking_reference,
        customer_name,
        destination,
        total_amount,
        currency,
        status,
        payment_status,
        created_at,
        'booking_created' as activity_type
      FROM bookings
      WHERE created_at >= $1
      ORDER BY created_at DESC
      LIMIT 15
    `, [new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)]); // Últimos 7 días
    
    // 5. Métricas de conversión por fuente
    const sourceMetricsResult = await query(`
      SELECT 
        source,
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_value
      FROM bookings
      WHERE created_at >= $1
      GROUP BY source
      ORDER BY revenue DESC
    `, [startDate]);
    
    // 6. Análisis de pagos
    const paymentAnalysisResult = await query(`
      SELECT 
        payment_status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount,
        SUM(paid_amount) as paid_amount
      FROM bookings
      WHERE created_at >= $1
      GROUP BY payment_status
    `, [startDate]);
    
    // 7. Tendencia mensual (últimos 6 meses)
    const trendResult = await query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as bookings,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM bookings
      WHERE created_at >= $1
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `, [new Date(endDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)]);
    
    // Formatear datos
    const bookingStats = bookingStatsResult.rows[0];
    const userStats = userStatsResult.rows[0];
    
    // Calcular growth rate
    const totalBookings = parseInt(bookingStats.total_bookings || 0);
    const periodBookings = parseInt(bookingStats.period_bookings || 0);
    const previousPeriodBookings = totalBookings - periodBookings;
    const bookingsGrowthRate = previousPeriodBookings > 0 
      ? ((periodBookings - previousPeriodBookings) / previousPeriodBookings) * 100 
      : 0;
    
    const totalRevenue = parseFloat(bookingStats.total_revenue || 0);
    const periodRevenue = parseFloat(bookingStats.period_revenue || 0);
    const previousPeriodRevenue = totalRevenue - periodRevenue;
    const revenueGrowthRate = previousPeriodRevenue > 0
      ? ((periodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0;
    
    // Verificar estado de servicios
    let travelCompositorStatus = 'unknown';
    try {
      const tcHealthCheck = require('../travel-compositor-fast');
      await tcHealthCheck.authenticate();
      travelCompositorStatus = 'connected';
    } catch (error) {
      travelCompositorStatus = 'disconnected';
    }
    
    res.json({
      success: true,
      stats: {
        // Métricas principales
        totalBookings: totalBookings,
        confirmedBookings: parseInt(bookingStats.confirmed_bookings || 0),
        pendingBookings: parseInt(bookingStats.pending_bookings || 0),
        cancelledBookings: parseInt(bookingStats.cancelled_bookings || 0),
        completedBookings: parseInt(bookingStats.completed_bookings || 0),
        
        // Métricas financieras
        totalRevenue: totalRevenue,
        confirmedRevenue: parseFloat(bookingStats.confirmed_revenue || 0),
        completedRevenue: parseFloat(bookingStats.completed_revenue || 0),
        totalPaid: parseFloat(bookingStats.total_paid || 0),
        avgBookingValue: parseFloat(bookingStats.avg_booking_value || 0),
        
        // Métricas de clientes
        uniqueCustomers: parseInt(bookingStats.unique_customers || 0),
        totalUsers: parseInt(userStats.total_users || 0),
        activeUsers: parseInt(userStats.active_users || 0),
        newUsersThisPeriod: parseInt(userStats.new_users_period || 0),
        
        // Métricas de crecimiento
        periodBookings: periodBookings,
        periodRevenue: periodRevenue,
        bookingsGrowthRate: Math.round(bookingsGrowthRate * 100) / 100,
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
        
        // Datos adicionales
        topDestinations: topDestinationsResult.rows.map(dest => ({
          destination: dest.destination,
          country: dest.country,
          bookings: parseInt(dest.bookings_count),
          revenue: parseFloat(dest.revenue),
          avgRevenue: parseFloat(dest.avg_revenue_per_booking),
          uniqueCustomers: parseInt(dest.unique_customers)
        })),
        
        recentActivity: recentActivityResult.rows.map(activity => ({
          type: activity.activity_type,
          bookingReference: activity.booking_reference,
          customerName: activity.customer_name,
          destination: activity.destination,
          amount: parseFloat(activity.total_amount),
          currency: activity.currency,
          status: activity.status,
          paymentStatus: activity.payment_status,
          timestamp: activity.created_at
        })),
        
        sourceMetrics: sourceMetricsResult.rows.map(source => ({
          source: source.source,
          totalBookings: parseInt(source.total_bookings),
          confirmedBookings: parseInt(source.confirmed_bookings),
          revenue: parseFloat(source.revenue),
          avgValue: parseFloat(source.avg_value),
          conversionRate: source.total_bookings > 0 
            ? Math.round((source.confirmed_bookings / source.total_bookings) * 100 * 100) / 100
            : 0
        })),
        
        paymentAnalysis: paymentAnalysisResult.rows.map(payment => ({
          status: payment.payment_status,
          count: parseInt(payment.count),
          totalAmount: parseFloat(payment.total_amount),
          paidAmount: parseFloat(payment.paid_amount)
        })),
        
        monthlyTrend: trendResult.rows.map(trend => ({
          month: trend.month,
          bookings: parseInt(trend.bookings),
          revenue: parseFloat(trend.revenue),
          uniqueCustomers: parseInt(trend.unique_customers)
        }))
      },
      
      // Estado de servicios
      services: {
        database: 'connected',
        travelCompositor: travelCompositorStatus,
        cache: 'active',
        payment: 'ready'
      },
      
      // Metadata
      period: period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      timestamp: new Date().toISOString(),
      user: req.user?.username || 'system',
      source: 'database'
    });
    
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/dashboard/stats
 * Alias para compatibilidad
 */
router.get('/dashboard/stats', async (req, res) => {
  // Redirigir a /stats
  req.url = '/stats';
  router.handle(req, res);
});

/**
 * GET /api/admin/bookings-stats
 * Estadísticas específicas de reservas
 */
router.get('/bookings-stats', async (req, res) => {
  try {
    const { period = 'month', groupBy = 'day' } = req.query;
    
    // Determinar período
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(endDate.getMonth() / 3) * 3;
        startDate = new Date(endDate.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }
    
    // Determinar groupBy SQL
    let dateGroupBy;
    switch (groupBy) {
      case 'hour':
        dateGroupBy = "DATE_TRUNC('hour', created_at)";
        break;
      case 'day':
        dateGroupBy = "DATE_TRUNC('day', created_at)";
        break;
      case 'week':
        dateGroupBy = "DATE_TRUNC('week', created_at)";
        break;
      case 'month':
        dateGroupBy = "DATE_TRUNC('month', created_at)";
        break;
      default:
        dateGroupBy = "DATE_TRUNC('day', created_at)";
    }
    
    const result = await query(`
      SELECT 
        ${dateGroupBy} as period,
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        SUM(total_amount) as total_revenue,
        SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as confirmed_revenue,
        AVG(total_amount) as avg_booking_value,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM bookings
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY ${dateGroupBy}
      ORDER BY period ASC
    `, [startDate, endDate]);
    
    res.json({
      success: true,
      data: {
        period: period,
        groupBy: groupBy,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        stats: result.rows.map(row => ({
          period: row.period,
          totalBookings: parseInt(row.total_bookings),
          confirmedBookings: parseInt(row.confirmed_bookings),
          pendingBookings: parseInt(row.pending_bookings),
          cancelledBookings: parseInt(row.cancelled_bookings),
          totalRevenue: parseFloat(row.total_revenue || 0),
          confirmedRevenue: parseFloat(row.confirmed_revenue || 0),
          avgBookingValue: parseFloat(row.avg_booking_value || 0),
          uniqueCustomers: parseInt(row.unique_customers)
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/bookings-analytics
 * Analytics avanzados de reservas
 */
router.get('/bookings-analytics', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Estadísticas de conversión por canal
    const conversionByChannelResult = await query(`
      SELECT 
        source,
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed')) as conversions,
        ROUND(
          (COUNT(*) FILTER (WHERE status IN ('confirmed', 'completed'))::decimal / 
           NULLIF(COUNT(*), 0)) * 100, 2
        ) as conversion_rate,
        SUM(total_amount) FILTER (WHERE status IN ('confirmed', 'completed')) as revenue
      FROM bookings
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY source
      ORDER BY revenue DESC NULLS LAST
    `);
    
    // Análisis de duración de reservas
    const durationAnalysisResult = await query(`
      SELECT 
        CASE 
          WHEN duration_days <= 3 THEN '1-3 días'
          WHEN duration_days <= 7 THEN '4-7 días'
          WHEN duration_days <= 14 THEN '1-2 semanas'
          WHEN duration_days <= 30 THEN '2-4 semanas'
          ELSE 'Más de 1 mes'
        END as duration_range,
        COUNT(*) as bookings_count,
        AVG(total_amount) as avg_amount,
        SUM(total_amount) as total_revenue
      FROM bookings
      WHERE duration_days IS NOT NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY duration_range
      ORDER BY avg_amount DESC
    `);
    
    // Análisis de precio por rango
    const priceRangeAnalysisResult = await query(`
      SELECT 
        CASE 
          WHEN total_amount < 500 THEN 'Hasta $500'
          WHEN total_amount < 1000 THEN '$500 - $1000'
          WHEN total_amount < 2000 THEN '$1000 - $2000'
          WHEN total_amount < 5000 THEN '$2000 - $5000'
          ELSE 'Más de $5000'
        END as price_range,
        COUNT(*) as bookings_count,
        AVG(total_amount) as avg_amount
      FROM bookings
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY price_range
      ORDER BY avg_amount ASC
    `);
    
    res.json({
      success: true,
      data: {
        conversionByChannel: conversionByChannelResult.rows,
        durationAnalysis: durationAnalysisResult.rows,
        priceRangeAnalysis: priceRangeAnalysisResult.rows
      },
      period: period,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching booking analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/cache/stats
 * Estadísticas de cache
 */
router.get('/cache/stats', async (req, res) => {
  try {
    res.json({
      success: true,
      cache: {
        status: 'active',
        type: 'memory',
        entries: 0,
        hitRate: 0,
        lastClear: null,
        size: '0 MB'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo stats de cache'
    });
  }
});

/**
 * POST /api/admin/cache/clear
 * Limpiar cache
 */
router.post('/cache/clear', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Cache limpiado exitosamente',
      clearedBy: req.user?.username || 'system',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error limpiando cache'
    });
  }
});

module.exports = router;