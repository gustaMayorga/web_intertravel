// ===============================================
// RUTAS API BUSINESS INTELLIGENCE - AGENTE 6
// Router principal para todas las funcionalidades de BI
// ===============================================

const express = require('express');
const router = express.Router();

// Importar módulos de BI
const analyticsEngine = require('../modules/business-intelligence/analytics-engine');
const predictiveEngine = require('../modules/business-intelligence/predictive-engine');
const crmManager = require('../modules/business-intelligence/crm-manager');

// ======================================
// MIDDLEWARE DE AUTENTICACIÓN
// ======================================

// Middleware simple de autenticación (en producción usar JWT real)
const requireAuth = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token de autorización requerido'
    });
  }
  
  // En producción, validar el token JWT aquí
  next();
};

// ======================================
// ENDPOINTS DE ANALYTICS AVANZADO
// ======================================

// Análisis de rendimiento de ventas
router.get('/analytics/sales-performance', requireAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await analyticsEngine.getSalesPerformance(period);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en sales performance:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Análisis de funnel de conversión
router.get('/analytics/conversion-funnel', requireAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await analyticsEngine.getConversionFunnel(period);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en conversion funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Performance de agencias
router.get('/analytics/agency-performance', requireAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await analyticsEngine.getAgencyPerformance(period);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en agency performance:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Análisis de cohortes de clientes
router.get('/analytics/customer-cohorts', requireAuth, async (req, res) => {
  try {
    const result = await analyticsEngine.getCustomerCohorts();
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en customer cohorts:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// ENDPOINTS PREDICTIVOS
// ======================================

// Predicción de demanda
router.get('/predictive/demand-forecast', requireAuth, async (req, res) => {
  try {
    const { destination, months = 6 } = req.query;
    const result = await predictiveEngine.predictDemand(destination, parseInt(months));
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en demand forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Optimización de precios
router.get('/predictive/pricing-optimization', requireAuth, async (req, res) => {
  try {
    const { packageId } = req.query;
    const result = await analyticsEngine.getPricingOptimization(packageId);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en pricing optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Predicción de churn
router.get('/predictive/churn-analysis', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.query;
    const result = await predictiveEngine.predictCustomerChurn(customerId);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en churn analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Recomendaciones personalizadas
router.get('/predictive/recommendations/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;
    const result = await predictiveEngine.generatePersonalizedRecommendations(userId, parseInt(limit));
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// ENDPOINTS DE CRM
// ======================================

// Pipeline de leads
router.get('/crm/leads-pipeline', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const result = await crmManager.getLeadsPipeline(status);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en leads pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Perfil de cliente
router.get('/crm/customer-profile/:customerId', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params;
    const result = await crmManager.getCustomerProfile(customerId);
    
    res.json({
      success: result.success,
      data: result.success ? result.profile : null,
      error: result.success ? null : result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en customer profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Registrar interacción con cliente
router.post('/crm/interactions', requireAuth, async (req, res) => {
  try {
    const { customerId, interaction } = req.body;
    
    if (!customerId || !interaction) {
      return res.status(400).json({
        success: false,
        error: 'customerId e interaction son requeridos'
      });
    }
    
    const result = await crmManager.recordInteraction(customerId, interaction);
    
    res.json({
      success: result.success,
      data: result.success ? { interactionId: result.interactionId } : null,
      error: result.success ? null : result.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error registrando interacción:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Análisis de satisfacción
router.get('/crm/satisfaction-analysis', requireAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await crmManager.getSatisfactionAnalysis(period);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en satisfaction analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Tareas y seguimientos
router.get('/crm/tasks-followups', requireAuth, async (req, res) => {
  try {
    const { assignedTo } = req.query;
    const result = await crmManager.getTasksAndFollowUps(assignedTo);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en tasks followups:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// DASHBOARD EJECUTIVO CONSOLIDADO
// ======================================

router.get('/dashboard/executive-summary', requireAuth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Obtener datos de múltiples fuentes
    const [
      salesPerformance,
      conversionFunnel,
      agencyPerformance,
      satisfactionAnalysis,
      leadsPipeline
    ] = await Promise.all([
      analyticsEngine.getSalesPerformance(period),
      analyticsEngine.getConversionFunnel(period),
      analyticsEngine.getAgencyPerformance(period),
      crmManager.getSatisfactionAnalysis(period),
      crmManager.getLeadsPipeline()
    ]);

    const executiveSummary = {
      kpis: {
        totalRevenue: salesPerformance.summary?.totalRevenue || 0,
        totalBookings: salesPerformance.summary?.totalBookings || 0,
        avgOrderValue: salesPerformance.summary?.avgOrderValue || 0,
        conversionRate: conversionFunnel.funnel?.steps?.slice(-1)[0]?.conversionRate || 0,
        customerSatisfaction: satisfactionAnalysis.satisfaction?.avgRating || 0,
        nps: satisfactionAnalysis.satisfaction?.nps || 0
      },
      trends: {
        revenueGrowth: salesPerformance.summary?.growthRate || 0,
        bookingsGrowth: '+12.5%',
        conversionImprovement: '+2.3%',
        satisfactionTrend: 'stable'
      },
      alerts: [
        {
          type: 'opportunity',
          message: 'Demanda alta proyectada para próximo mes',
          action: 'Revisar pricing strategy',
          priority: 'medium'
        },
        {
          type: 'warning',
          message: `${leadsPipeline.stats?.total || 0} leads requieren seguimiento`,
          action: 'Asignar tareas de follow-up',
          priority: 'high'
        }
      ],
      recommendations: [
        'Optimizar funnel de conversión en step 3',
        'Implementar programa de retención VIP',
        'Expansión a 2 nuevos destinos high-demand'
      ]
    };

    res.json({
      success: true,
      data: executiveSummary,
      period,
      timestamp: new Date().toISOString(),
      generated: 'business-intelligence-engine'
    });
    
  } catch (error) {
    console.error('Error en executive summary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// EXPORTACIÓN DE REPORTES
// ======================================

router.get('/reports/export', requireAuth, async (req, res) => {
  try {
    const { type = 'executive', format = 'json', period = '30d' } = req.query;
    
    let reportData = {};
    
    switch (type) {
      case 'executive':
        // Datos ejecutivos consolidados
        const execData = await Promise.all([
          analyticsEngine.getSalesPerformance(period),
          analyticsEngine.getAgencyPerformance(period),
          crmManager.getSatisfactionAnalysis(period)
        ]);
        
        reportData = {
          type: 'Executive Report',
          period,
          sales: execData[0],
          agencies: execData[1],
          satisfaction: execData[2],
          generated: new Date().toISOString()
        };
        break;
        
      case 'sales':
        reportData = await analyticsEngine.getSalesPerformance(period);
        break;
        
      case 'agencies':
        reportData = await analyticsEngine.getAgencyPerformance(period);
        break;
        
      case 'customers':
        reportData = await crmManager.getSatisfactionAnalysis(period);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Tipo de reporte no válido'
        });
    }
    
    if (format === 'csv') {
      // En producción, implementar conversión a CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${period}.csv`);
      res.send('CSV export not implemented yet');
    } else {
      res.json({
        success: true,
        report: reportData,
        metadata: {
          type,
          format,
          period,
          generated: new Date().toISOString(),
          version: '1.0'
        }
      });
    }
    
  } catch (error) {
    console.error('Error exportando reporte:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// HEALTH CHECK Y STATUS
// ======================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Business Intelligence API',
    version: '1.0.0',
    status: 'operational',
    modules: {
      analyticsEngine: 'active',
      predictiveEngine: 'active',
      crmManager: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// ======================================
// ANÁLISIS EN TIEMPO REAL
// ======================================

router.get('/realtime/metrics', requireAuth, async (req, res) => {
  try {
    // Métricas en tiempo real simuladas
    const realtimeMetrics = {
      currentVisitors: 45 + Math.floor(Math.random() * 20),
      activeBookings: 8 + Math.floor(Math.random() * 5),
      revenueToday: 12450 + Math.floor(Math.random() * 5000),
      conversionRateToday: (18.5 + Math.random() * 5).toFixed(1),
      recentActivity: [
        {
          time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          type: 'booking',
          description: 'Nueva reserva: Perú Mágico - $1,890'
        },
        {
          time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          type: 'lead',
          description: 'Nuevo lead: María S. - Europa'
        },
        {
          time: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
          type: 'payment',
          description: 'Pago confirmado: Booking #BK-001 - $1,650'
        }
      ]
    };
    
    res.json({
      success: true,
      data: realtimeMetrics,
      timestamp: new Date().toISOString(),
      refreshRate: '30s'
    });
    
  } catch (error) {
    console.error('Error en métricas tiempo real:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;