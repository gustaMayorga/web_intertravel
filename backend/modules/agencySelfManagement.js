// Agency Self-Management Portal - Sistema de autogestión B2B para agencias
// ========================================================================

const { dbManager } = require('../database');

class AgencySelfManagement {
  constructor() {
    this.serviceLevels = {
      'bronze': { 
        name: 'Bronce', 
        commissionBonus: 0, 
        creditMultiplier: 1,
        features: ['Panel básico', 'Ventas estándar', 'Soporte email']
      },
      'silver': { 
        name: 'Plata', 
        commissionBonus: 2, 
        creditMultiplier: 1.5,
        features: ['Panel avanzado', 'Comisiones mejoradas', 'Soporte prioritario', 'Reportes mensuales']
      },
      'gold': { 
        name: 'Oro', 
        commissionBonus: 5, 
        creditMultiplier: 2,
        features: ['Panel premium', 'Comisiones gold', 'Soporte 24/7', 'Reportes semanales', 'API acceso']
      },
      'platinum': { 
        name: 'Platino', 
        commissionBonus: 8, 
        creditMultiplier: 3,
        features: ['Panel completo', 'Comisiones premium', 'Soporte dedicado', 'Reportes diarios', 'API completa', 'White label']
      }
    };
  }

  // ================================
  // DASHBOARD PRINCIPAL DE AGENCIA
  // ================================

  async getAgencyDashboard(agencyId, userId = null) {
    try {
      // Información básica de la agencia
      const agencyResult = await dbManager.query(`
        SELECT 
          a.*,
          COUNT(u.id) as total_users,
          COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN u.last_login > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as weekly_active_users
        FROM agencies a
        LEFT JOIN users u ON a.id = u.agency_id
        WHERE a.id = $1 AND a.status = 'active'
        GROUP BY a.id
      `, [agencyId]);

      if (agencyResult.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada o inactiva' };
      }

      const agency = agencyResult.rows[0];

      // Estadísticas de ventas del mes actual
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const salesStatsResult = await dbManager.query(`
        SELECT 
          COUNT(b.id) as total_bookings,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(b.total_amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) as confirmed_revenue,
          COALESCE(SUM(b.total_amount * $2 / 100), 0) as total_commission,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount * $2 / 100 ELSE 0 END), 0) as confirmed_commission
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        WHERE u.agency_id = $1 AND b.created_at >= $3
      `, [agencyId, agency.commission_rate, startOfMonth]);

      const salesStats = salesStatsResult.rows[0];

      // Estadísticas del mes anterior para comparación
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

      const lastMonthStatsResult = await dbManager.query(`
        SELECT 
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) as confirmed_revenue
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        WHERE u.agency_id = $1 AND b.created_at >= $2 AND b.created_at <= $3
      `, [agencyId, lastMonth, endOfLastMonth]);

      const lastMonthStats = lastMonthStatsResult.rows[0];

      // Top servicios vendidos este mes
      const topServicesResult = await dbManager.query(`
        SELECT 
          p.name as service_name,
          p.category,
          COUNT(b.id) as bookings_count,
          SUM(b.total_amount) as total_sales
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        JOIN packages p ON b.package_id = p.id
        WHERE u.agency_id = $1 AND b.created_at >= $2
        GROUP BY p.id, p.name, p.category
        ORDER BY total_sales DESC
        LIMIT 5
      `, [agencyId, startOfMonth]);

      // Ventas por vendedor del mes
      const salesByUserResult = await dbManager.query(`
        SELECT 
          u.first_name || ' ' || u.last_name as user_name,
          u.username,
          COUNT(b.id) as bookings_count,
          COALESCE(SUM(b.total_amount), 0) as total_sales,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) as confirmed_sales
        FROM users u
        LEFT JOIN bookings b ON b.customer_email = u.email AND b.created_at >= $2
        WHERE u.agency_id = $1 AND u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.username
        ORDER BY confirmed_sales DESC
        LIMIT 10
      `, [agencyId, startOfMonth]);

      // Actividad reciente
      const recentActivityResult = await dbManager.query(`
        SELECT 
          'booking' as activity_type,
          b.booking_reference as reference,
          b.customer_name as description,
          b.total_amount,
          b.status,
          b.created_at,
          u.first_name || ' ' || u.last_name as user_name
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        WHERE u.agency_id = $1
        ORDER BY b.created_at DESC
        LIMIT 10
      `, [agencyId]);

      // Calcular nivel de servicio basado en ventas
      const totalConfirmedRevenue = parseFloat(salesStats.confirmed_revenue) || 0;
      const serviceLevel = this.calculateServiceLevel(totalConfirmedRevenue, agency.commission_rate);

      // Comisiones pendientes de pago
      const pendingCommissionsResult = await dbManager.query(`
        SELECT 
          SUM(b.total_amount * $2 / 100) as pending_amount,
          COUNT(b.id) as pending_count
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        WHERE u.agency_id = $1 AND b.status = 'confirmed' AND b.payment_status = 'paid' AND b.commission_paid = false
      `, [agencyId, agency.commission_rate]);

      const pendingCommissions = pendingCommissionsResult.rows[0];

      // Calcular porcentajes de cambio
      const revenueChange = this.calculatePercentageChange(
        parseFloat(salesStats.confirmed_revenue) || 0,
        parseFloat(lastMonthStats.confirmed_revenue) || 0
      );

      const bookingsChange = this.calculatePercentageChange(
        parseInt(salesStats.confirmed_bookings) || 0,
        parseInt(lastMonthStats.total_bookings) || 0
      );

      return {
        success: true,
        dashboard: {
          agency: {
            id: agency.id,
            name: agency.name,
            code: agency.code,
            commissionRate: parseFloat(agency.commission_rate),
            creditLimit: parseFloat(agency.credit_limit),
            currentBalance: parseFloat(agency.current_balance),
            serviceLevel: serviceLevel,
            totalUsers: parseInt(agency.total_users),
            activeUsers: parseInt(agency.active_users),
            weeklyActiveUsers: parseInt(agency.weekly_active_users)
          },
          currentMonth: {
            totalBookings: parseInt(salesStats.total_bookings) || 0,
            confirmedBookings: parseInt(salesStats.confirmed_bookings) || 0,
            cancelledBookings: parseInt(salesStats.cancelled_bookings) || 0,
            totalRevenue: parseFloat(salesStats.total_revenue) || 0,
            confirmedRevenue: parseFloat(salesStats.confirmed_revenue) || 0,
            totalCommission: parseFloat(salesStats.total_commission) || 0,
            confirmedCommission: parseFloat(salesStats.confirmed_commission) || 0,
            conversionRate: salesStats.total_bookings > 0 ? 
              ((salesStats.confirmed_bookings / salesStats.total_bookings) * 100).toFixed(2) : 0
          },
          performance: {
            revenueChange: revenueChange,
            bookingsChange: bookingsChange,
            topServices: topServicesResult.rows,
            salesByUser: salesByUserResult.rows
          },
          financial: {
            pendingCommissionAmount: parseFloat(pendingCommissions.pending_amount) || 0,
            pendingCommissionCount: parseInt(pendingCommissions.pending_count) || 0,
            availableCredit: parseFloat(agency.credit_limit) - parseFloat(agency.current_balance)
          },
          recentActivity: recentActivityResult.rows
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo dashboard de agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // GESTIÓN DE COMISIONES
  // ================================

  async getCommissionHistory(agencyId, filters = {}) {
    try {
      const {
        startDate,
        endDate,
        status = 'all',
        page = 1,
        limit = 50
      } = filters;

      let whereConditions = ['u.agency_id = $1'];
      let queryParams = [agencyId];
      let paramCount = 1;

      if (startDate) {
        paramCount++;
        whereConditions.push(`b.created_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`b.created_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      if (status !== 'all') {
        paramCount++;
        if (status === 'paid') {
          whereConditions.push(`b.commission_paid = true`);
        } else if (status === 'pending') {
          whereConditions.push(`b.commission_paid = false AND b.status = 'confirmed' AND b.payment_status = 'paid'`);
        }
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      const commissionsResult = await dbManager.query(`
        SELECT 
          b.id,
          b.booking_reference,
          b.customer_name,
          b.total_amount,
          b.currency,
          b.status,
          b.payment_status,
          b.commission_paid,
          b.commission_paid_date,
          b.created_at,
          b.travel_date,
          a.commission_rate,
          (b.total_amount * a.commission_rate / 100) as commission_amount,
          p.name as package_name,
          u.first_name || ' ' || u.last_name as sold_by
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        JOIN agencies a ON u.agency_id = a.id
        LEFT JOIN packages p ON b.package_id = p.id
        WHERE ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, limit, offset]);

      // Resumen de comisiones
      const summaryResult = await dbManager.query(`
        SELECT 
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(b.total_amount * a.commission_rate / 100), 0) as total_commission,
          COALESCE(SUM(CASE WHEN b.commission_paid = true THEN b.total_amount * a.commission_rate / 100 ELSE 0 END), 0) as paid_commission,
          COALESCE(SUM(CASE WHEN b.commission_paid = false AND b.status = 'confirmed' AND b.payment_status = 'paid' THEN b.total_amount * a.commission_rate / 100 ELSE 0 END), 0) as pending_commission,
          COUNT(CASE WHEN b.commission_paid = true THEN 1 END) as paid_count,
          COUNT(CASE WHEN b.commission_paid = false AND b.status = 'confirmed' AND b.payment_status = 'paid' THEN 1 END) as pending_count
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        JOIN agencies a ON u.agency_id = a.id
        WHERE ${whereClause}
      `, queryParams);

      const summary = summaryResult.rows[0];

      return {
        success: true,
        data: {
          commissions: commissionsResult.rows.map(row => ({
            id: row.id,
            bookingReference: row.booking_reference,
            customerName: row.customer_name,
            packageName: row.package_name,
            totalAmount: parseFloat(row.total_amount),
            commissionRate: parseFloat(row.commission_rate),
            commissionAmount: parseFloat(row.commission_amount),
            currency: row.currency,
            status: row.status,
            paymentStatus: row.payment_status,
            commissionPaid: row.commission_paid,
            commissionPaidDate: row.commission_paid_date,
            createdAt: row.created_at,
            travelDate: row.travel_date,
            soldBy: row.sold_by
          })),
          summary: {
            totalBookings: parseInt(summary.total_bookings),
            totalCommission: parseFloat(summary.total_commission),
            paidCommission: parseFloat(summary.paid_commission),
            pendingCommission: parseFloat(summary.pending_commission),
            paidCount: parseInt(summary.paid_count),
            pendingCount: parseInt(summary.pending_count)
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasNext: commissionsResult.rows.length === limit
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo historial de comisiones:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // GESTIÓN DE SERVICIOS DISPONIBLES
  // ================================

  async getAvailableServices(agencyId, filters = {}) {
    try {
      const {
        category,
        search,
        page = 1,
        limit = 20
      } = filters;

      // Obtener información de la agencia para determinar servicios disponibles
      const agencyResult = await dbManager.query(`
        SELECT commission_rate, credit_limit, current_balance, status
        FROM agencies
        WHERE id = $1
      `, [agencyId]);

      if (agencyResult.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      const agency = agencyResult.rows[0];
      const serviceLevel = this.calculateServiceLevel(0, agency.commission_rate);

      let whereConditions = ['p.is_active = true'];
      let queryParams = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        whereConditions.push(`p.category = $${paramCount}`);
        queryParams.push(category);
      }

      if (search) {
        paramCount++;
        whereConditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      const servicesResult = await dbManager.query(`
        SELECT 
          p.*,
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END), 0) as confirmed_bookings,
          COALESCE(AVG(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE NULL END), 0) as avg_booking_value
        FROM packages p
        LEFT JOIN bookings b ON p.id = b.package_id AND b.customer_email IN (
          SELECT email FROM users WHERE agency_id = $${paramCount + 1}
        )
        WHERE ${whereClause}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT $${paramCount + 2} OFFSET $${paramCount + 3}
      `, [...queryParams, agencyId, limit, offset]);

      // Calcular comisión y precio para la agencia
      const services = servicesResult.rows.map(service => {
        const basePrice = parseFloat(service.price_adult);
        const agencyCommission = (basePrice * agency.commission_rate / 100);
        const serviceLevelBonus = (agencyCommission * serviceLevel.commissionBonus / 100);
        const totalCommission = agencyCommission + serviceLevelBonus;

        return {
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          basePrice: basePrice,
          priceChild: parseFloat(service.price_child),
          currency: service.currency,
          agencyCommissionRate: agency.commission_rate,
          serviceLevelBonus: serviceLevel.commissionBonus,
          commissionAmount: totalCommission,
          netPrice: basePrice - totalCommission,
          duration: service.duration,
          location: service.location,
          includes: service.includes,
          excludes: service.excludes,
          isHighlighted: service.is_highlighted,
          images: service.images || [],
          stats: {
            totalBookings: parseInt(service.total_bookings) || 0,
            confirmedBookings: parseInt(service.confirmed_bookings) || 0,
            avgBookingValue: parseFloat(service.avg_booking_value) || 0
          }
        };
      });

      return {
        success: true,
        data: {
          services,
          agencyInfo: {
            commissionRate: parseFloat(agency.commission_rate),
            serviceLevel: serviceLevel,
            availableCredit: parseFloat(agency.credit_limit) - parseFloat(agency.current_balance)
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo servicios disponibles:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // GESTIÓN DE USUARIOS DE AGENCIA
  // ================================

  async getAgencyUsers(agencyId, filters = {}) {
    try {
      const {
        search,
        role,
        status = 'all',
        page = 1,
        limit = 20
      } = filters;

      let whereConditions = ['u.agency_id = $1'];
      let queryParams = [agencyId];
      let paramCount = 1;

      if (search) {
        paramCount++;
        whereConditions.push(`(
          u.username ILIKE $${paramCount} OR 
          u.email ILIKE $${paramCount} OR 
          u.first_name ILIKE $${paramCount} OR 
          u.last_name ILIKE $${paramCount}
        )`);
        queryParams.push(`%${search}%`);
      }

      if (role) {
        paramCount++;
        whereConditions.push(`r.name = $${paramCount}`);
        queryParams.push(role);
      }

      if (status !== 'all') {
        paramCount++;
        if (status === 'active') {
          whereConditions.push(`u.is_active = true`);
        } else if (status === 'inactive') {
          whereConditions.push(`u.is_active = false`);
        }
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      const usersResult = await dbManager.query(`
        SELECT 
          u.*,
          r.display_name as role_name,
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) as total_sales,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount * a.commission_rate / 100 ELSE 0 END), 0) as total_commission
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN agencies a ON u.agency_id = a.id
        LEFT JOIN bookings b ON b.customer_email = u.email AND b.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
        WHERE ${whereClause}
        GROUP BY u.id, r.display_name, a.commission_rate
        ORDER BY u.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, limit, offset]);

      return {
        success: true,
        data: {
          users: usersResult.rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role_name,
            isActive: user.is_active,
            lastLogin: user.last_login,
            createdAt: user.created_at,
            stats: {
              totalBookings: parseInt(user.total_bookings) || 0,
              totalSales: parseFloat(user.total_sales) || 0,
              totalCommission: parseFloat(user.total_commission) || 0
            }
          }))
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuarios de agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // REPORTES Y ESTADÍSTICAS
  // ================================

  async getPerformanceReport(agencyId, filters = {}) {
    try {
      const {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 días atrás
        endDate = new Date(),
        groupBy = 'week' // day, week, month
      } = filters;

      // Ventas por período
      let dateFormat;
      switch (groupBy) {
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-"W"WW'; // Semana
      }

      const salesByPeriodResult = await dbManager.query(`
        SELECT 
          TO_CHAR(b.created_at, $4) as period,
          COUNT(b.id) as total_bookings,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COALESCE(SUM(b.total_amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) as confirmed_revenue
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        WHERE u.agency_id = $1 AND b.created_at >= $2 AND b.created_at <= $3
        GROUP BY TO_CHAR(b.created_at, $4)
        ORDER BY period
      `, [agencyId, startDate, endDate, dateFormat]);

      // Top categorías
      const topCategoriesResult = await dbManager.query(`
        SELECT 
          p.category,
          COUNT(b.id) as bookings_count,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) as revenue
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        JOIN packages p ON b.package_id = p.id
        WHERE u.agency_id = $1 AND b.created_at >= $2 AND b.created_at <= $3
        GROUP BY p.category
        ORDER BY revenue DESC
        LIMIT 10
      `, [agencyId, startDate, endDate]);

      // Rendimiento por vendedor
      const userPerformanceResult = await dbManager.query(`
        SELECT 
          u.first_name || ' ' || u.last_name as user_name,
          u.username,
          COUNT(b.id) as total_bookings,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount ELSE 0 END), 0) as confirmed_revenue,
          CASE 
            WHEN COUNT(b.id) > 0 THEN ROUND((COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END)::float / COUNT(b.id) * 100), 2)
            ELSE 0 
          END as conversion_rate
        FROM users u
        LEFT JOIN bookings b ON b.customer_email = u.email AND b.created_at >= $2 AND b.created_at <= $3
        WHERE u.agency_id = $1 AND u.is_active = true
        GROUP BY u.id, u.first_name, u.last_name, u.username
        ORDER BY confirmed_revenue DESC
      `, [agencyId, startDate, endDate]);

      return {
        success: true,
        report: {
          period: {
            startDate,
            endDate,
            groupBy
          },
          salesByPeriod: salesByPeriodResult.rows,
          topCategories: topCategoriesResult.rows,
          userPerformance: userPerformanceResult.rows
        }
      };

    } catch (error) {
      console.error('❌ Error generando reporte de performance:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // UTILIDADES PRIVADAS
  // ================================

  calculateServiceLevel(totalRevenue, commissionRate) {
    // Lógica para calcular nivel basado en ventas y comisión
    if (totalRevenue >= 500000 || commissionRate >= 15) {
      return this.serviceLevels.platinum;
    } else if (totalRevenue >= 200000 || commissionRate >= 12) {
      return this.serviceLevels.gold;
    } else if (totalRevenue >= 50000 || commissionRate >= 8) {
      return this.serviceLevels.silver;
    } else {
      return this.serviceLevels.bronze;
    }
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous * 100).toFixed(2);
  }
}

module.exports = new AgencySelfManagement();
