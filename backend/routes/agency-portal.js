// Agency Self-Management Routes - Rutas para portal de autogestión B2B
// =======================================================================

const express = require('express');
const router = express.Router();
const agencySelfManagement = require('../modules/agencySelfManagement');
const agencyDashboard = require('../modules/agency-dashboard'); // NUEVO MÓDULO
const jwt = require('jsonwebtoken');

// Middleware de autenticación para agencias
const authenticateAgencyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'intertravel-super-secret-key-2024');
    
    // Verificar que el usuario pertenece a una agencia
    if (!decoded.agencyId) {
      return res.status(403).json({ success: false, error: 'Acceso solo para usuarios de agencias' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Error en autenticación de agencia:', error);
    res.status(401).json({ success: false, error: 'Token inválido' });
  }
};

// Middleware para verificar permisos de administrador de agencia
const requireAgencyAdmin = (req, res, next) => {
  if (!['super_admin', 'admin', 'admin_agencia'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Se requieren permisos de administrador de agencia' 
    });
  }
  next();
};

// ================================
// RUTAS DEL DASHBOARD PRINCIPAL
// ================================

// GET /api/agency/dashboard - Dashboard principal de la agencia
router.get('/dashboard', authenticateAgencyUser, async (req, res) => {
  try {
    // USAR NUEVO MÓDULO CON DATOS REALES
    const result = await agencyDashboard.getDashboardData(req.user.agencyId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error en dashboard de agencia:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// === NUEVAS RUTAS CON DATOS REALES ===

// GET /api/agency/dashboard/real-time - Métricas en tiempo real
router.get('/dashboard/real-time', authenticateAgencyUser, async (req, res) => {
  try {
    const result = await agencyDashboard.getDashboardData(req.user.agencyId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Extraer solo métricas en tiempo real
    res.json({
      success: true,
      data: {
        monthly_stats: result.data.monthly_stats,
        pending_invoices: result.data.pending_invoices,
        agency: {
          ranking: result.data.agency.ranking,
          performance_score: result.data.agency.performance_score,
          commission_rate: result.data.agency.commission_rate
        },
        next_ranking: result.data.next_ranking
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Error en métricas tiempo real:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/agency/commissions/calculator - Calculadora de comisiones
router.post('/commissions/calculator', authenticateAgencyUser, async (req, res) => {
  try {
    const { amount, product_category, destination } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Monto válido requerido'
      });
    }

    const result = await agencyDashboard.getCommissionCalculator(
      req.user.agencyId,
      parseFloat(amount),
      product_category,
      destination
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error calculando comisión:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/agency/packages/available - Paquetes disponibles con precios especiales
router.get('/packages/available', authenticateAgencyUser, async (req, res) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 20,
      destination: req.query.destination,
      category: req.query.category,
      price_range: req.query.price_range
    };

    const result = await agencyDashboard.getAvailablePackages(req.user.agencyId, filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo paquetes:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS DE GESTIÓN DE COMISIONES
// ================================

// GET /api/agency/commissions - Historial de comisiones
router.get('/commissions', authenticateAgencyUser, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      status: req.query.status || 'all',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await agencySelfManagement.getCommissionHistory(req.user.agencyId, filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo comisiones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/agency/commissions/summary - Resumen de comisiones
router.get('/commissions/summary', authenticateAgencyUser, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.start_date,
      endDate: req.query.end_date
    };

    const result = await agencySelfManagement.getCommissionHistory(req.user.agencyId, filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Devolver solo el resumen
    res.json({
      success: true,
      summary: result.data.summary
    });
  } catch (error) {
    console.error('❌ Error obteniendo resumen de comisiones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS DE SERVICIOS DISPONIBLES
// ================================

// GET /api/agency/services - Servicios disponibles para la agencia
router.get('/services', authenticateAgencyUser, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await agencySelfManagement.getAvailableServices(req.user.agencyId, filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo servicios:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/agency/services/categories - Categorías de servicios disponibles
router.get('/services/categories', authenticateAgencyUser, async (req, res) => {
  try {
    // Obtener categorías únicas de paquetes activos
    const { dbManager } = require('../database');
    
    const result = await dbManager.query(`
      SELECT DISTINCT category
      FROM packages
      WHERE is_active = true AND category IS NOT NULL AND category != ''
      ORDER BY category
    `);

    res.json({
      success: true,
      categories: result.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS DE GESTIÓN DE USUARIOS
// ================================

// GET /api/agency/users - Usuarios de la agencia
router.get('/users', authenticateAgencyUser, requireAgencyAdmin, async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      role: req.query.role,
      status: req.query.status || 'all',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await agencySelfManagement.getAgencyUsers(req.user.agencyId, filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios de agencia:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/agency/users - Crear nuevo usuario para la agencia
router.post('/users', authenticateAgencyUser, requireAgencyAdmin, async (req, res) => {
  try {
    const usersManager = require('../modules/users');
    
    // Agregar agencyId del usuario autenticado
    const userData = {
      ...req.body,
      agencyId: req.user.agencyId
    };

    const result = await usersManager.createUser(userData, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error creando usuario de agencia:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/agency/users/:userId - Actualizar usuario de la agencia
router.put('/users/:userId', authenticateAgencyUser, requireAgencyAdmin, async (req, res) => {
  try {
    const usersManager = require('../modules/users');
    const userId = req.params.userId;
    
    // Verificar que el usuario pertenece a la misma agencia
    const { dbManager } = require('../database');
    const userCheck = await dbManager.query(
      'SELECT agency_id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (userCheck.rows[0].agency_id !== req.user.agencyId) {
      return res.status(403).json({ success: false, error: 'No tienes permisos para editar este usuario' });
    }

    const result = await usersManager.updateUser(userId, req.body, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error actualizando usuario de agencia:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS DE REPORTES Y ESTADÍSTICAS
// ================================

// GET /api/agency/reports/performance - Reporte de rendimiento
router.get('/reports/performance', authenticateAgencyUser, async (req, res) => {
  try {
    const filters = {
      startDate: req.query.start_date ? new Date(req.query.start_date) : undefined,
      endDate: req.query.end_date ? new Date(req.query.end_date) : undefined,
      groupBy: req.query.group_by || 'week'
    };

    const result = await agencySelfManagement.getPerformanceReport(req.user.agencyId, filters);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error generando reporte de performance:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// GET /api/agency/reports/export - Exportar datos (Excel/CSV)
router.get('/reports/export', authenticateAgencyUser, async (req, res) => {
  try {
    const {
      type = 'commissions', // commissions, bookings, users
      format = 'csv', // csv, excel
      startDate,
      endDate
    } = req.query;

    let data = [];
    let filename = '';

    if (type === 'commissions') {
      const result = await agencySelfManagement.getCommissionHistory(req.user.agencyId, {
        startDate,
        endDate,
        limit: 10000 // Obtener todos los registros para export
      });
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      data = result.data.commissions;
      filename = `comisiones_${req.user.agencyId}_${new Date().toISOString().split('T')[0]}`;
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      
      // Generar CSV
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.send(csv);
    } else {
      // Por ahora devolver JSON, más adelante se puede implementar Excel
      res.json({
        success: true,
        data,
        format,
        filename
      });
    }

  } catch (error) {
    console.error('❌ Error exportando datos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS DE INFORMACIÓN DE AGENCIA
// ================================

// GET /api/agency/info - Información detallada de la agencia
router.get('/info', authenticateAgencyUser, async (req, res) => {
  try {
    const { dbManager } = require('../database');
    
    const result = await dbManager.query(`
      SELECT 
        a.*,
        COUNT(u.id) as total_users,
        COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users
      FROM agencies a
      LEFT JOIN users u ON a.id = u.agency_id
      WHERE a.id = $1
      GROUP BY a.id
    `, [req.user.agencyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agencia no encontrada' });
    }

    const agency = result.rows[0];

    res.json({
      success: true,
      agency: {
        id: agency.id,
        code: agency.code,
        name: agency.name,
        businessName: agency.business_name,
        email: agency.email,
        phone: agency.phone,
        address: agency.address,
        city: agency.city,
        province: agency.province,
        country: agency.country,
        contactPerson: agency.contact_person,
        commissionRate: parseFloat(agency.commission_rate),
        creditLimit: parseFloat(agency.credit_limit),
        currentBalance: parseFloat(agency.current_balance),
        status: agency.status,
        contractDate: agency.contract_date,
        createdAt: agency.created_at,
        stats: {
          totalUsers: parseInt(agency.total_users),
          activeUsers: parseInt(agency.active_users)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo información de agencia:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// ================================
// RUTAS DE CONFIGURACIÓN
// ================================

// GET /api/agency/settings - Configuración de la agencia
router.get('/settings', authenticateAgencyUser, requireAgencyAdmin, async (req, res) => {
  try {
    const { dbManager } = require('../database');
    
    const result = await dbManager.query(`
      SELECT id, name, business_name, email, phone, address, city, province, country, contact_person
      FROM agencies
      WHERE id = $1
    `, [req.user.agencyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agencia no encontrada' });
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/agency/settings - Actualizar configuración de la agencia
router.put('/settings', authenticateAgencyUser, requireAgencyAdmin, async (req, res) => {
  try {
    const agenciesManager = require('../modules/agencies');
    
    // Solo permitir actualizar ciertos campos
    const allowedFields = ['name', 'businessName', 'email', 'phone', 'address', 'city', 'province', 'country', 'contactPerson'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const result = await agenciesManager.updateAgency(req.user.agencyId, updateData, req.user.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
