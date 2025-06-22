// ===============================================
// RUTAS B2B2C - GESTIÓN DE ASIGNACIONES Y COMISIONES
// Sistema de derivación automática de ventas a agencias
// ===============================================

const express = require('express');
const { dbManager } = require('../database');
const AgencyAssignmentEngine = require('../modules/agency-assignment');
const jwt = require('jsonwebtoken');
const moment = require('moment');

const router = express.Router();

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'intertravel-super-secret-key-2024');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

// Middleware para verificar permisos de admin
const requireAdmin = (req, res, next) => {
  if (!['super_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Se requieren permisos de administrador' 
    });
  }
  next();
};

// ===============================================
// GESTIÓN DE ASIGNACIONES
// ===============================================

// GET /api/b2b2c/assignments - Lista de asignaciones
router.get('/assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      agencyId,
      startDate,
      endDate,
      search
    } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`aa.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (agencyId) {
      paramCount++;
      whereConditions.push(`aa.agency_id = $${paramCount}`);
      queryParams.push(agencyId);
    }

    if (startDate) {
      paramCount++;
      whereConditions.push(`aa.assigned_at >= $${paramCount}`);
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereConditions.push(`aa.assigned_at <= $${paramCount}`);
      queryParams.push(endDate);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        o.customer_name ILIKE $${paramCount} OR 
        o.customer_email ILIKE $${paramCount} OR 
        o.package_title ILIKE $${paramCount} OR
        aa.agency_name ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Query principal
    const assignmentsResult = await dbManager.query(`
      SELECT 
        aa.*,
        o.customer_name, o.customer_email, o.package_title, o.package_destination,
        o.created_at as order_date, o.status as order_status,
        a.name as agency_full_name, a.email as agency_email, a.phone as agency_phone
      FROM agency_assignments aa
      JOIN orders o ON aa.order_id = o.id
      JOIN agencies a ON aa.agency_id = a.id
      WHERE ${whereClause}
      ORDER BY aa.assigned_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);

    // Count total
    const countResult = await dbManager.query(`
      SELECT COUNT(*) as total
      FROM agency_assignments aa
      JOIN orders o ON aa.order_id = o.id
      WHERE ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        assignments: assignmentsResult.rows.map(assignment => ({
          id: assignment.id,
          orderId: assignment.order_id,
          agencyId: assignment.agency_id,
          agencyCode: assignment.agency_code,
          agencyName: assignment.agency_name,
          agencyFullName: assignment.agency_full_name,
          amount: parseFloat(assignment.amount),
          commissionRate: parseFloat(assignment.commission_rate),
          commissionAmount: parseFloat(assignment.commission_amount),
          assignmentScore: parseFloat(assignment.assignment_score),
          status: assignment.status,
          assignedAt: assignment.assigned_at,
          completedAt: assignment.completed_at,
          assignedBy: assignment.assigned_by,
          customer: {
            name: assignment.customer_name,
            email: assignment.customer_email
          },
          package: {
            title: assignment.package_title,
            destination: assignment.package_destination
          },
          orderDate: assignment.order_date,
          orderStatus: assignment.order_status
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo asignaciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/b2b2c/assignments/:id - Detalle de asignación
router.get('/assignments/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await dbManager.query(`
      SELECT 
        aa.*,
        o.*, 
        a.name as agency_full_name, a.email as agency_email, 
        a.phone as agency_phone, a.address as agency_address
      FROM agency_assignments aa
      JOIN orders o ON aa.order_id = o.id
      JOIN agencies a ON aa.agency_id = a.id
      WHERE aa.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Asignación no encontrada' });
    }

    const assignment = result.rows[0];

    res.json({
      success: true,
      assignment: {
        id: assignment.id,
        orderId: assignment.order_id,
        agencyId: assignment.agency_id,
        agencyCode: assignment.agency_code,
        agencyName: assignment.agency_name,
        amount: parseFloat(assignment.amount),
        commissionRate: parseFloat(assignment.commission_rate),
        commissionAmount: parseFloat(assignment.commission_amount),
        assignmentScore: parseFloat(assignment.assignment_score),
        assignmentData: assignment.assignment_data,
        status: assignment.status,
        performanceScore: assignment.performance_score,
        customerSatisfaction: assignment.customer_satisfaction,
        assignedAt: assignment.assigned_at,
        completedAt: assignment.completed_at,
        assignedBy: assignment.assigned_by,
        reassignmentReason: assignment.reassignment_reason,
        order: {
          id: assignment.order_id,
          packageTitle: assignment.package_title,
          packageDestination: assignment.package_destination,
          packageDuration: assignment.package_duration,
          customerName: assignment.customer_name,
          customerEmail: assignment.customer_email,
          customerPhone: assignment.customer_phone,
          travelers: assignment.travelers,
          amount: parseFloat(assignment.amount),
          currency: assignment.currency,
          status: assignment.status,
          createdAt: assignment.created_at
        },
        agency: {
          id: assignment.agency_id,
          code: assignment.agency_code,
          name: assignment.agency_full_name,
          email: assignment.agency_email,
          phone: assignment.agency_phone,
          address: assignment.agency_address
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalle de asignación:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/b2b2c/assignments/reassign - Reasignar orden manualmente
router.post('/assignments/reassign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderId, newAgencyId, reason } = req.body;

    if (!orderId || !newAgencyId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'orderId, newAgencyId y reason son requeridos'
      });
    }

    const result = await AgencyAssignmentEngine.reassignOrder(
      orderId, 
      newAgencyId, 
      reason, 
      req.user.username
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      message: 'Orden reasignada exitosamente',
      assignment: result.assignment
    });

  } catch (error) {
    console.error('❌ Error reasignando orden:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/b2b2c/assignments/:id/status - Actualizar estado de asignación
router.put('/assignments/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, performanceScore, customerSatisfaction, notes } = req.body;

    const validStatuses = ['active', 'completed', 'cancelled', 'reassigned'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    // Actualizar asignación
    await dbManager.query(`
      UPDATE agency_assignments 
      SET status = $1, performance_score = $2, customer_satisfaction = $3, 
          updated_at = $4, completed_at = CASE WHEN $1 = 'completed' THEN $4 ELSE completed_at END
      WHERE id = $5
    `, [
      status, 
      performanceScore || null, 
      customerSatisfaction || null, 
      moment().toISOString(), 
      id
    ]);

    // Registrar actividad
    await dbManager.query(`
      INSERT INTO admin_activity (
        user_id, action, resource_type, resource_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'assignment_status_updated',
      'assignment',
      id,
      JSON.stringify({ status, performanceScore, customerSatisfaction, notes }),
      moment().toISOString()
    ]);

    res.json({
      success: true,
      message: 'Estado de asignación actualizado'
    });

  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===============================================
// GESTIÓN DE COMISIONES
// ===============================================

// GET /api/b2b2c/commissions - Lista de comisiones
router.get('/commissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      agencyId,
      startDate,
      endDate
    } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`ac.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (agencyId) {
      paramCount++;
      whereConditions.push(`ac.agency_id = $${paramCount}`);
      queryParams.push(agencyId);
    }

    if (startDate) {
      paramCount++;
      whereConditions.push(`ac.created_at >= $${paramCount}`);
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereConditions.push(`ac.created_at <= $${paramCount}`);
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    // Query principal
    const commissionsResult = await dbManager.query(`
      SELECT 
        ac.*,
        aa.agency_name, aa.agency_code,
        o.customer_name, o.package_title, o.package_destination,
        a.name as agency_full_name
      FROM agency_commissions ac
      JOIN agency_assignments aa ON ac.assignment_id = aa.id
      JOIN orders o ON ac.order_id = o.id
      JOIN agencies a ON ac.agency_id = a.id
      WHERE ${whereClause}
      ORDER BY ac.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);

    // Count total
    const countResult = await dbManager.query(`
      SELECT COUNT(*) as total
      FROM agency_commissions ac
      WHERE ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        commissions: commissionsResult.rows.map(commission => ({
          id: commission.id,
          assignmentId: commission.assignment_id,
          orderId: commission.order_id,
          agencyId: commission.agency_id,
          agencyCode: commission.agency_code,
          agencyName: commission.agency_name,
          baseAmount: parseFloat(commission.base_amount),
          commissionRate: parseFloat(commission.commission_rate),
          commissionAmount: parseFloat(commission.commission_amount),
          currency: commission.currency,
          status: commission.status,
          approvedAt: commission.approved_at,
          paidAt: commission.paid_at,
          paymentReference: commission.payment_reference,
          createdAt: commission.created_at,
          customer: commission.customer_name,
          packageTitle: commission.package_title,
          destination: commission.package_destination
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo comisiones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/b2b2c/commissions/:id/approve - Aprobar comisión
router.put('/commissions/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await dbManager.query(`
      UPDATE agency_commissions 
      SET status = 'approved', approved_at = $1, updated_at = $1
      WHERE id = $2 AND status = 'pending'
    `, [moment().toISOString(), id]);

    // Registrar actividad
    await dbManager.query(`
      INSERT INTO admin_activity (
        user_id, action, resource_type, resource_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'commission_approved',
      'commission',
      id,
      JSON.stringify({ approvedBy: req.user.username }),
      moment().toISOString()
    ]);

    res.json({
      success: true,
      message: 'Comisión aprobada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error aprobando comisión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/b2b2c/commissions/:id/pay - Marcar comisión como pagada
router.put('/commissions/:id/pay', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentReference, notes } = req.body;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        error: 'Referencia de pago requerida'
      });
    }

    await dbManager.query(`
      UPDATE agency_commissions 
      SET status = 'paid', paid_at = $1, payment_reference = $2, updated_at = $1
      WHERE id = $3 AND status = 'approved'
    `, [moment().toISOString(), paymentReference, id]);

    // Registrar actividad
    await dbManager.query(`
      INSERT INTO admin_activity (
        user_id, action, resource_type, resource_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'commission_paid',
      'commission',
      id,
      JSON.stringify({ paymentReference, notes, paidBy: req.user.username }),
      moment().toISOString()
    ]);

    res.json({
      success: true,
      message: 'Comisión marcada como pagada'
    });

  } catch (error) {
    console.error('❌ Error marcando comisión como pagada:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===============================================
// ESTADÍSTICAS Y REPORTES
// ===============================================

// GET /api/b2b2c/stats - Estadísticas del sistema B2B2C
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filters = { startDate, endDate };
    const stats = await AgencyAssignmentEngine.getAssignmentStats(filters);

    if (!stats.success) {
      return res.status(400).json(stats);
    }

    // Estadísticas adicionales de comisiones
    const commissionStats = await dbManager.query(`
      SELECT 
        COUNT(*) as total_commissions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_commissions,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_commissions,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_commissions,
        SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status IN ('pending', 'approved') THEN commission_amount ELSE 0 END) as total_pending
      FROM agency_commissions
      WHERE 1=1 
        ${startDate ? 'AND created_at >= \'' + startDate + '\'' : ''}
        ${endDate ? 'AND created_at <= \'' + endDate + '\'' : ''}
    `);

    res.json({
      success: true,
      stats: {
        assignments: stats.stats,
        commissions: commissionStats.rows[0],
        topAgencies: stats.topAgencies
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/b2b2c/notifications/agencies - Notificaciones para agencias
router.get('/notifications/agencies', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { agencyId, status = 'unread', limit = 20 } = req.query;

    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    if (agencyId) {
      paramCount++;
      whereConditions.push(`agency_id = $${paramCount}`);
      queryParams.push(agencyId);
    }

    if (status && status !== 'all') {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const result = await dbManager.query(`
      SELECT 
        an.*,
        a.name as agency_name, a.code as agency_code
      FROM agency_notifications an
      JOIN agencies a ON an.agency_id = a.id
      WHERE ${whereClause}
      ORDER BY an.created_at DESC
      LIMIT $${paramCount + 1}
    `, [...queryParams, limit]);

    res.json({
      success: true,
      notifications: result.rows.map(notification => ({
        id: notification.id,
        agencyId: notification.agency_id,
        agencyName: notification.agency_name,
        agencyCode: notification.agency_code,
        assignmentId: notification.assignment_id,
        orderId: notification.order_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        status: notification.status,
        createdAt: notification.created_at,
        readAt: notification.read_at
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
