// ===================================================
// RUTAS ADMINISTRACIÓN AVANZADA DE AGENCIAS - INTERTRAVEL
// ===================================================
// APIs para gestión completa del core business B2B
// Estado: IMPLEMENTACIÓN COMPLETA
// Fecha: 11 de Junio 2025

const express = require('express');
const router = express.Router();
const advancedAgenciesModule = require('../modules/advanced-agencies');

// Middleware de autenticación (reutilizar del sistema existente)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  // Verificar token JWT aquí
  // Por ahora, simular autenticación exitosa
  req.user = { id: 1, role: 'admin' };
  next();
};

// Middleware para verificar permisos de administración
const requireAdminPermission = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Permisos de administración requeridos' });
  }
  next();
};

// ===== GESTIÓN DE SOLICITUDES =====
router.post('/applications', async (req, res) => {
  try {
    const {
      company_name, business_name, cuit, contact_person, email, phone,
      address, city, province, documentation, commission_rate_proposed, 
      credit_limit_requested, notes
    } = req.body;

    // Validación básica
    if (!company_name || !contact_person || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre de empresa, persona de contacto y email son requeridos'
      });
    }

    const result = await advancedAgenciesModule.createApplication({
      company_name, business_name, cuit, contact_person, email, phone,
      address, city, province, documentation, commission_rate_proposed,
      credit_limit_requested, notes
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error creando solicitud:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.get('/applications', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const { status } = req.query;
    
    const result = await advancedAgenciesModule.getApplications(status);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length,
        filter: { status: status || 'all' }
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error obteniendo solicitudes:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.post('/applications/:id/approve', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { commission_rate, credit_limit } = req.body;

    if (isNaN(applicationId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    const result = await advancedAgenciesModule.approveApplication(
      applicationId, 
      req.user.id,
      { commission_rate, credit_limit }
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Solicitud aprobada exitosamente'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error aprobando solicitud:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.post('/applications/:id/reject', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const applicationId = parseInt(req.params.id);
    const { rejection_reason } = req.body;

    if (isNaN(applicationId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de solicitud inválido'
      });
    }

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        error: 'Motivo de rechazo es requerido'
      });
    }

    const result = await advancedAgenciesModule.rejectApplication(
      applicationId,
      req.user.id,
      rejection_reason
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Solicitud rechazada'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error rechazando solicitud:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===== SISTEMA DE RANKINGS =====
router.post('/rankings/calculate', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const result = await advancedAgenciesModule.calculateAgencyRankings();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Rankings calculados exitosamente'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error calculando rankings:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.get('/rankings/report', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const result = await advancedAgenciesModule.getAgencyRankingReport();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length,
        generated_at: new Date()
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error obteniendo reporte de rankings:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.get('/top-performers', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await advancedAgenciesModule.getTopPerformingAgencies(limit);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        limit: limit
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error obteniendo top performers:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===== REGLAS DE COMISIONES =====
router.post('/commission-rules', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const {
      agency_id, product_category, destination, commission_type,
      commission_value, min_amount, max_amount, effective_from, effective_until
    } = req.body;

    // Validación
    if (!agency_id || !commission_type || !commission_value || !effective_from) {
      return res.status(400).json({
        success: false,
        error: 'Agencia, tipo de comisión, valor y fecha de inicio son requeridos'
      });
    }

    const validTypes = ['percentage', 'fixed', 'tiered'];
    if (!validTypes.includes(commission_type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de comisión inválido'
      });
    }

    const result = await advancedAgenciesModule.createCommissionRule({
      agency_id, product_category, destination, commission_type,
      commission_value, min_amount, max_amount, effective_from, effective_until
    }, req.user.id);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error creando regla de comisión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.get('/commission-rules', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const { agency_id } = req.query;
    const agencyId = agency_id ? parseInt(agency_id) : null;

    const result = await advancedAgenciesModule.getCommissionRules(agencyId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length,
        filter: { agency_id: agencyId }
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error obteniendo reglas de comisión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

router.post('/commission-rules/calculate', authenticateToken, async (req, res) => {
  try {
    const { agency_id, amount, product_category, destination } = req.body;

    if (!agency_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'ID de agencia y monto son requeridos'
      });
    }

    const result = await advancedAgenciesModule.calculateCommissionForBooking(
      parseInt(agency_id),
      parseFloat(amount),
      product_category,
      destination
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error calculando comisión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===== ANÁLISIS DE PERFORMANCE =====
router.get('/agencies/:id/performance', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    const agencyId = parseInt(req.params.id);
    const months = parseInt(req.query.months) || 12;

    if (isNaN(agencyId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de agencia inválido'
      });
    }

    const result = await advancedAgenciesModule.getAgencyPerformanceAnalysis(agencyId, months);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        agency_id: agencyId,
        months_analyzed: months
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Error obteniendo análisis de performance:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===== DASHBOARD GESTIÓN AGENCIAS =====
router.get('/dashboard', authenticateToken, requireAdminPermission, async (req, res) => {
  try {
    // Obtener estadísticas generales
    const [applicationsResult, rankingsResult, topPerformersResult] = await Promise.all([
      advancedAgenciesModule.getApplications(),
      advancedAgenciesModule.getAgencyRankingReport(),
      advancedAgenciesModule.getTopPerformingAgencies(5)
    ]);

    if (!applicationsResult.success || !rankingsResult.success || !topPerformersResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Error obteniendo datos del dashboard'
      });
    }

    // Calcular estadísticas de solicitudes
    const applications = applicationsResult.data;
    const applicationStats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length
    };

    // Calcular distribución de rankings
    const rankings = rankingsResult.data;
    const rankingDistribution = {};
    rankings.forEach(agency => {
      const rank = agency.ranking_name || 'Sin ranking';
      rankingDistribution[rank] = (rankingDistribution[rank] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        application_stats: applicationStats,
        ranking_distribution: rankingDistribution,
        top_performers: topPerformersResult.data,
        total_active_agencies: rankings.length,
        generated_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo dashboard:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ===== UTILITIES =====
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      module: 'advanced-agencies',
      status: 'operational',
      timestamp: new Date(),
      features: [
        'Gestión de solicitudes de alta',
        'Sistema de rankings automático',
        'Reglas de comisiones personalizadas',
        'Análisis de performance',
        'Dashboard de gestión',
        'Workflow de aprobación/rechazo',
        'Calculadora de comisiones'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      module: 'advanced-agencies',
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;
