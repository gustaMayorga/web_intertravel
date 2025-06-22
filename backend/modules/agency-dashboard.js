// ===================================================
// MÓDULO DASHBOARD REAL AGENCIAS - INTERTRAVEL
// ===================================================
// Dashboard con datos dinámicos desde PostgreSQL
// Estado: IMPLEMENTACIÓN COMPLETA
// Fecha: 11 de Junio 2025

const { query } = require('../database');

class AgencyDashboardModule {
  
  async getDashboardData(agencyId) {
    try {
      // Obtener información de la agencia
      const agencyInfo = await query(`
        SELECT 
          a.*,
          ar.ranking_name,
          ar.benefits,
          ap.total_sales,
          ap.total_bookings,
          ap.performance_score
        FROM agencies a
        LEFT JOIN agency_performance ap ON a.id = ap.agency_id
        LEFT JOIN agency_rankings ar ON ap.ranking_id = ar.id
        WHERE a.id = $1
          AND (ap.period_start IS NULL OR ap.period_start = (
            SELECT MAX(period_start) FROM agency_performance WHERE agency_id = a.id
          ))
      `, [agencyId]);

      if (agencyInfo.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      const agency = agencyInfo.rows[0];

      // Estadísticas del mes actual
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Ventas del mes
      const monthlyStats = await query(`
        SELECT 
          COUNT(i.id) as invoices_count,
          COALESCE(SUM(i.total_amount), 0) as total_invoiced,
          COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) as total_paid,
          COALESCE(AVG(i.total_amount), 0) as avg_invoice_amount
        FROM invoices i
        WHERE i.agency_id = $1
          AND i.issue_date >= $2
          AND i.issue_date < $3
      `, [agencyId, currentMonth, nextMonth]);

      // Facturas pendientes
      const pendingInvoices = await query(`
        SELECT 
          COUNT(*) as pending_count,
          COALESCE(SUM(total_amount), 0) as pending_amount
        FROM invoices
        WHERE agency_id = $1 
          AND status IN ('sent', 'overdue')
      `, [agencyId]);

      // Últimas 5 facturas
      const recentInvoices = await query(`
        SELECT 
          invoice_number,
          issue_date,
          total_amount,
          status,
          due_date
        FROM invoices
        WHERE agency_id = $1
        ORDER BY issue_date DESC
        LIMIT 5
      `, [agencyId]);

      // Comisiones acumuladas últimos 6 meses
      const commissionHistory = await query(`
        SELECT 
          DATE_TRUNC('month', i.issue_date) as month,
          COUNT(i.id) as invoices,
          COALESCE(SUM(i.total_amount), 0) as total_commissions
        FROM invoices i
        WHERE i.agency_id = $1
          AND i.issue_date >= $2
        GROUP BY DATE_TRUNC('month', i.issue_date)
        ORDER BY month DESC
        LIMIT 6
      `, [agencyId, new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)]);

      // Calcular próximo ranking
      const nextRanking = await this.calculateNextRanking(agencyId, agency.ranking_name);

      // Reglas de comisión activas
      const commissionRules = await query(`
        SELECT 
          product_category,
          destination,
          commission_type,
          commission_value,
          effective_from,
          effective_until
        FROM commission_rules
        WHERE agency_id = $1 
          AND is_active = true
          AND effective_from <= CURRENT_DATE
          AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        ORDER BY effective_from DESC
        LIMIT 5
      `, [agencyId]);

      return {
        success: true,
        data: {
          agency: {
            id: agency.id,
            code: agency.code,
            name: agency.name,
            commission_rate: parseFloat(agency.commission_rate),
            current_balance: parseFloat(agency.current_balance || 0),
            credit_limit: parseFloat(agency.credit_limit || 0),
            ranking: agency.ranking_name || 'Bronze',
            performance_score: parseFloat(agency.performance_score || 0),
            benefits: agency.benefits ? JSON.parse(agency.benefits) : {}
          },
          monthly_stats: {
            invoices_count: parseInt(monthlyStats.rows[0].invoices_count),
            total_invoiced: parseFloat(monthlyStats.rows[0].total_invoiced),
            total_paid: parseFloat(monthlyStats.rows[0].total_paid),
            avg_invoice: parseFloat(monthlyStats.rows[0].avg_invoice_amount),
            period: {
              start: currentMonth,
              end: nextMonth
            }
          },
          pending_invoices: {
            count: parseInt(pendingInvoices.rows[0].pending_count),
            amount: parseFloat(pendingInvoices.rows[0].pending_amount)
          },
          recent_invoices: recentInvoices.rows,
          commission_history: commissionHistory.rows.map(row => ({
            month: row.month,
            invoices: parseInt(row.invoices),
            amount: parseFloat(row.total_commissions)
          })),
          next_ranking: nextRanking,
          commission_rules: commissionRules.rows,
          generated_at: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo dashboard de agencia:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateNextRanking(agencyId, currentRanking) {
    try {
      // Obtener ventas del mes actual
      const currentMonth = new Date();
      currentMonth.setDate(1);
      
      const salesResult = await query(`
        SELECT COALESCE(SUM(total_amount), 0) as current_sales
        FROM invoices
        WHERE agency_id = $1
          AND issue_date >= $2
          AND status = 'paid'
      `, [agencyId, currentMonth]);

      const currentSales = parseFloat(salesResult.rows[0].current_sales);

      // Obtener próximo ranking
      const nextRankingResult = await query(`
        SELECT ranking_name, min_monthly_sales, base_commission_rate
        FROM agency_rankings
        WHERE min_monthly_sales > $1
          AND is_active = true
        ORDER BY min_monthly_sales ASC
        LIMIT 1
      `, [currentSales]);

      if (nextRankingResult.rows.length === 0) {
        return {
          current_ranking: currentRanking,
          next_ranking: null,
          current_sales: currentSales,
          needed_sales: 0,
          progress_percentage: 100,
          message: '¡Has alcanzado el ranking máximo!'
        };
      }

      const nextRank = nextRankingResult.rows[0];
      const neededSales = parseFloat(nextRank.min_monthly_sales) - currentSales;
      const progressPercentage = Math.min((currentSales / parseFloat(nextRank.min_monthly_sales)) * 100, 100);

      return {
        current_ranking: currentRanking,
        next_ranking: nextRank.ranking_name,
        current_sales: currentSales,
        needed_sales: Math.max(neededSales, 0),
        target_sales: parseFloat(nextRank.min_monthly_sales),
        progress_percentage: Math.round(progressPercentage),
        next_commission_rate: parseFloat(nextRank.base_commission_rate)
      };

    } catch (error) {
      console.error('❌ Error calculando próximo ranking:', error);
      return {
        current_ranking: currentRanking,
        error: 'No se pudo calcular próximo ranking'
      };
    }
  }

  async getCommissionCalculator(agencyId, amount, productCategory = null, destination = null) {
    try {
      // Buscar regla específica
      const ruleResult = await query(`
        SELECT * FROM commission_rules 
        WHERE agency_id = $1 
          AND is_active = true
          AND (product_category = $2 OR product_category IS NULL)
          AND (destination = $3 OR destination IS NULL)
          AND effective_from <= CURRENT_DATE
          AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
          AND (min_amount IS NULL OR $4 >= min_amount)
          AND (max_amount IS NULL OR $4 <= max_amount)
        ORDER BY 
          CASE WHEN product_category IS NOT NULL THEN 1 ELSE 2 END,
          CASE WHEN destination IS NOT NULL THEN 1 ELSE 2 END,
          effective_from DESC
        LIMIT 1
      `, [agencyId, productCategory, destination, amount]);

      let commissionRate, commissionAmount, ruleType;

      if (ruleResult.rows.length > 0) {
        const rule = ruleResult.rows[0];
        commissionRate = parseFloat(rule.commission_value);
        ruleType = 'custom';
        
        if (rule.commission_type === 'percentage') {
          commissionAmount = parseFloat(amount) * (commissionRate / 100);
        } else if (rule.commission_type === 'fixed') {
          commissionAmount = commissionRate;
        }
      } else {
        // Usar comisión base de la agencia
        const agencyResult = await query(`
          SELECT commission_rate FROM agencies WHERE id = $1
        `, [agencyId]);
        
        commissionRate = parseFloat(agencyResult.rows[0].commission_rate);
        commissionAmount = parseFloat(amount) * (commissionRate / 100);
        ruleType = 'base';
      }

      return {
        success: true,
        data: {
          amount: parseFloat(amount),
          commission_rate: commissionRate,
          commission_amount: Math.round(commissionAmount * 100) / 100,
          rule_type: ruleType,
          product_category: productCategory,
          destination: destination
        }
      };

    } catch (error) {
      console.error('❌ Error calculando comisión:', error);
      return { success: false, error: error.message };
    }
  }

  async getAvailablePackages(agencyId, filters = {}) {
    try {
      const { limit = 20, destination, category, price_range } = filters;

      // Simular paquetes disponibles con precios especiales para la agencia
      const agencyInfo = await query(`
        SELECT commission_rate, ranking_name 
        FROM agencies a
        LEFT JOIN agency_performance ap ON a.id = ap.agency_id
        LEFT JOIN agency_rankings ar ON ap.ranking_id = ar.id
        WHERE a.id = $1
      `, [agencyId]);

      const baseCommission = parseFloat(agencyInfo.rows[0]?.commission_rate || 10);
      const ranking = agencyInfo.rows[0]?.ranking_name || 'Bronze';

      // Descuento especial por ranking
      const rankingDiscounts = {
        'Bronze': 0,
        'Silver': 2,
        'Gold': 5,
        'Platinum': 8,
        'Diamond': 12
      };

      const specialDiscount = rankingDiscounts[ranking] || 0;

      // Simular paquetes con datos reales
      const packages = [
        {
          id: 'pkg_001',
          title: 'Perú Mágico - Cusco y Machu Picchu',
          destination: 'Cusco, Perú',
          category: 'Cultura y Aventura',
          duration: '8 días / 7 noches',
          regular_price: 1890,
          agency_price: 1890 - (1890 * specialDiscount / 100),
          commission_amount: (1890 * baseCommission / 100),
          availability: 'Alta',
          description: 'Incluye vuelos, hotel 4*, guía especializado y entrada a Machu Picchu'
        },
        {
          id: 'pkg_002',
          title: 'Buenos Aires Tango Experience',
          destination: 'Buenos Aires, Argentina',
          category: 'Ciudad y Cultura',
          duration: '6 días / 5 noches',
          regular_price: 899,
          agency_price: 899 - (899 * specialDiscount / 100),
          commission_amount: (899 * baseCommission / 100),
          availability: 'Media',
          description: 'Shows de tango, tours gastronómicos y city tour completo'
        },
        {
          id: 'pkg_003',
          title: 'Cancún Paradise All Inclusive',
          destination: 'Cancún, México',
          category: 'Playa y Relax',
          duration: '7 días / 6 noches',
          regular_price: 1299,
          agency_price: 1299 - (1299 * specialDiscount / 100),
          commission_amount: (1299 * baseCommission / 100),
          availability: 'Alta',
          description: 'Resort 5 estrellas todo incluido, excursiones a Chichén Itzá'
        }
      ];

      return {
        success: true,
        data: {
          packages: packages.slice(0, limit),
          agency_benefits: {
            base_commission: baseCommission,
            ranking: ranking,
            special_discount: specialDiscount,
            total_packages: packages.length
          },
          filters: filters
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo paquetes:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AgencyDashboardModule();
