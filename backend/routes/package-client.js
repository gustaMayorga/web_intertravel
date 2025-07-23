// API Routes for Package-Client Management
// Rutas completas para gestión de paquetes y clientes
const express = require('express');
const router = express.Router();
const PackageClientManager = require('../modules/package-client-manager');

// ==========================================
// 1. ASIGNACIONES DE PAQUETES A CLIENTES
// ==========================================

/**
 * POST /api/package-client/assign
 * Asignar un paquete a un cliente
 */
router.post('/assign', async (req, res) => {
  try {
    const {
      package_id,
      customer_id,
      customer_email,
      customer_name,
      customer_phone,
      assigned_by_user_id,
      assignment_type = 'manual',
      priority_level = 'medium',
      notes = '',
      follow_up_date,
      metadata = {}
    } = req.body;

    // Validaciones básicas
    if (!package_id) {
      return res.status(400).json({
        success: false,
        error: 'package_id is required'
      });
    }

    if (!customer_id && !customer_email) {
      return res.status(400).json({
        success: false,
        error: 'Either customer_id or customer_email is required'
      });
    }

    const result = await PackageClientManager.assignPackageToClient({
      package_id,
      customer_id,
      customer_email,
      customer_name,
      customer_phone,
      assigned_by_user_id,
      assignment_type,
      priority_level,
      notes,
      follow_up_date,
      metadata
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in assign package to client:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/package-client/assignments
 * Obtener todas las asignaciones con filtros
 */
router.get('/assignments', async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      priority_level: req.query.priority_level,
      assignment_type: req.query.assignment_type,
      package_id: req.query.package_id,
      customer_id: req.query.customer_id,
      assigned_by_user_id: req.query.assigned_by_user_id,
      follow_up_date_from: req.query.follow_up_date_from,
      follow_up_date_to: req.query.follow_up_date_to,
      search: req.query.search,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const result = await PackageClientManager.getAssignments(filters);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error getting assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/package-client/assignments/:id
 * Obtener una asignación específica con toda su información
 */
router.get('/assignments/:id', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    const { query } = require('../database');
    
    // Obtener la asignación con información completa
    const assignmentResult = await query(`
      SELECT 
        pca.*,
        p.title as package_title,
        p.destination as package_destination,
        p.country as package_country,
        p.price_amount as package_price,
        p.price_currency as package_currency,
        c.name as customer_full_name,
        c.preferences as customer_preferences,
        u.name as assigned_by_name
      FROM package_client_assignments pca
      LEFT JOIN packages p ON pca.package_id = p.id
      LEFT JOIN customers c ON pca.customer_id = c.id
      LEFT JOIN users u ON pca.assigned_by_user_id = u.id
      WHERE pca.id = $1
    `, [assignmentId]);

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    const assignment = assignmentResult.rows[0];

    // Obtener actividades relacionadas
    const activitiesResult = await PackageClientManager.getAssignmentActivities(assignmentId);

    res.json({
      success: true,
      assignment,
      activities: activitiesResult.success ? activitiesResult.activities : []
    });

  } catch (error) {
    console.error('Error getting assignment details:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/package-client/assignments/:id/status
 * Actualizar el estado de una asignación
 */
router.put('/assignments/:id/status', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { status, notes = '', user_id } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const result = await PackageClientManager.updateAssignmentStatus(
      assignmentId, 
      status, 
      user_id, 
      notes
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/package-client/assignments/:id/follow-up
 * Programar seguimiento para una asignación
 */
router.put('/assignments/:id/follow-up', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { follow_up_date, notes, user_id } = req.body;

    if (!follow_up_date) {
      return res.status(400).json({
        success: false,
        error: 'follow_up_date is required'
      });
    }

    const result = await PackageClientManager.scheduleFollowUp(
      assignmentId, 
      follow_up_date, 
      notes, 
      user_id
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/package-client/assignments/:id/convert-to-booking
 * Convertir una asignación en booking real
 */
router.post('/assignments/:id/convert-to-booking', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { user_id, ...bookingData } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    const result = await PackageClientManager.convertToBooking(
      assignmentId, 
      bookingData, 
      user_id
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error converting to booking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==========================================
// 2. GESTIÓN DE CLIENTES
// ==========================================

/**
 * POST /api/package-client/customers
 * Crear o actualizar un cliente
 */
router.post('/customers', async (req, res) => {
  try {
    const result = await PackageClientManager.createOrUpdateClient(req.body);

    if (result.success) {
      const statusCode = result.created ? 201 : 200;
      res.status(statusCode).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error creating/updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/package-client/customers/:id/assignments
 * Obtener todas las asignaciones de un cliente
 */
router.get('/customers/:id/assignments', async (req, res) => {
  try {
    const customerId = req.params.id;
    const result = await PackageClientManager.getClientAssignments(customerId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error getting client assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/package-client/customers/:id/recommendations
 * Obtener recomendaciones de paquetes para un cliente
 */
router.get('/customers/:id/recommendations', async (req, res) => {
  try {
    const customerId = req.params.id;
    const limit = parseInt(req.query.limit) || 5;
    
    const result = await PackageClientManager.recommendPackagesForClient(customerId, limit);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error getting package recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==========================================
// 3. GESTIÓN POR PAQUETES
// ==========================================

/**
 * GET /api/package-client/packages/:id/clients
 * Obtener todos los clientes asignados a un paquete
 */
router.get('/packages/:id/clients', async (req, res) => {
  try {
    const packageId = req.params.id;
    const result = await PackageClientManager.getPackageClients(packageId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error getting package clients:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==========================================
// 4. ANALYTICS Y ESTADÍSTICAS
// ==========================================

/**
 * GET /api/package-client/stats
 * Obtener estadísticas generales de asignaciones
 */
router.get('/stats', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const dateRange = {};
    if (start_date) dateRange.startDate = start_date;
    if (end_date) dateRange.endDate = end_date;

    const result = await PackageClientManager.getAssignmentStats(dateRange);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error getting assignment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/package-client/dashboard
 * Dashboard completo con métricas principales
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { user_id, date_range = '30' } = req.query;
    
    // Calcular fecha de inicio basada en el rango
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(date_range));

    // Obtener estadísticas generales
    const statsResult = await PackageClientManager.getAssignmentStats({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Obtener asignaciones pendientes de seguimiento
    const { query } = require('../database');
    
    const followUpsResult = await query(`
      SELECT 
        pca.id as assignment_id,
        pca.customer_name,
        p.title as package_title,
        pca.follow_up_date,
        pca.priority_level,
        CASE 
          WHEN pca.follow_up_date < CURRENT_DATE THEN 
            EXTRACT(DAY FROM CURRENT_DATE - pca.follow_up_date)::INTEGER
          ELSE 0
        END as days_overdue,
        CASE 
          WHEN pca.follow_up_date < CURRENT_DATE THEN 'overdue'
          WHEN pca.follow_up_date = CURRENT_DATE THEN 'today'
          WHEN pca.follow_up_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'soon'
          ELSE 'scheduled'
        END as urgency_level
      FROM package_client_assignments pca
      LEFT JOIN packages p ON pca.package_id = p.id
      WHERE pca.status IN ('active', 'contacted', 'interested')
      AND pca.follow_up_date IS NOT NULL
      AND ($1 IS NULL OR pca.assigned_by_user_id = $1)
      ORDER BY 
        CASE 
          WHEN pca.follow_up_date < CURRENT_DATE THEN 1
          WHEN pca.follow_up_date = CURRENT_DATE THEN 2
          ELSE 3
        END,
        pca.priority_level,
        pca.follow_up_date
      LIMIT 10
    `, [user_id || null]);

    // Obtener asignaciones recientes
    const recentAssignments = await PackageClientManager.getAssignments({
      limit: 10,
      sortBy: 'created_at',
      sortOrder: 'DESC',
      assigned_by_user_id: user_id
    });

    // Top paquetes más asignados
    const topPackagesResult = await query(`
      SELECT 
        p.id,
        p.title,
        p.destination,
        COUNT(pca.id) as assignment_count,
        COUNT(CASE WHEN pca.status = 'booked' THEN 1 END) as conversion_count,
        ROUND(
          CASE WHEN COUNT(pca.id) > 0 THEN 
            (COUNT(CASE WHEN pca.status = 'booked' THEN 1 END)::DECIMAL / COUNT(pca.id)) * 100 
          ELSE 0 END, 
          2
        ) as conversion_rate
      FROM packages p
      LEFT JOIN package_client_assignments pca ON p.id = pca.package_id
      WHERE pca.created_at >= $1
      GROUP BY p.id, p.title, p.destination
      ORDER BY assignment_count DESC
      LIMIT 5
    `, [startDate.toISOString()]);

    res.json({
      success: true,
      dashboard: {
        stats: statsResult.success ? statsResult.stats : null,
        upcomingFollowUps: followUpsResult.rows || [],
        recentAssignments: recentAssignments.success ? recentAssignments.data.assignments : [],
        topPackages: topPackagesResult.rows || [],
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: parseInt(date_range)
        }
      }
    });

  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ==========================================
// 5. HEALTH CHECK
// ==========================================

/**
 * GET /api/package-client/health
 * Verificar estado del sistema
 */
router.get('/health', async (req, res) => {
  try {
    const { query } = require('../database');
    
    // Verificar conectividad de base de datos
    const dbCheck = await query('SELECT 1 as status');
    
    // Contar registros principales
    const counts = await query(`
      SELECT 
        (SELECT COUNT(*) FROM customers) as customers_count,
        (SELECT COUNT(*) FROM packages) as packages_count,
        (SELECT COUNT(*) FROM package_client_assignments) as assignments_count,
        (SELECT COUNT(*) FROM assignment_activities) as activities_count
    `);

    // Verificar asignaciones que necesitan atención
    const alerts = await query(`
      SELECT 
        COUNT(CASE WHEN follow_up_date < CURRENT_DATE THEN 1 END) as overdue_follow_ups,
        COUNT(CASE WHEN status = 'pending' AND created_at < CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as stale_assignments,
        COUNT(CASE WHEN priority_level = 'urgent' AND status IN ('pending', 'active') THEN 1 END) as urgent_pending
      FROM package_client_assignments
    `);

    res.json({
      success: true,
      health: {
        database: dbCheck.rows.length > 0 ? 'healthy' : 'error',
        counts: counts.rows[0],
        alerts: alerts.rows[0],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      health: {
        database: 'error',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;
