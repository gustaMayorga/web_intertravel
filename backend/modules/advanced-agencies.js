// ===================================================
// MÓDULO ADMINISTRACIÓN AVANZADA DE AGENCIAS - INTERTRAVEL
// ===================================================
// Gestión completa del core business B2B
// Estado: IMPLEMENTACIÓN COMPLETA
// Fecha: 11 de Junio 2025

const { query, getClient } = require('../database');
const bcrypt = require('bcrypt');

class AdvancedAgenciesModule {
  
  // ===== GESTIÓN DE SOLICITUDES DE ALTA =====
  async createApplication(applicationData) {
    try {
      const {
        company_name, business_name, cuit, contact_person, email, phone,
        address, city, province, documentation, commission_rate_proposed, credit_limit_requested, notes
      } = applicationData;

      // Verificar que no exista solicitud pendiente con el mismo email
      const existingApp = await query(`
        SELECT id FROM agency_applications 
        WHERE email = $1 AND status IN ('pending', 'reviewing')
      `, [email]);

      if (existingApp.rows.length > 0) {
        return { success: false, error: 'Ya existe una solicitud pendiente para este email' };
      }

      // Verificar que no exista agencia activa con el mismo email
      const existingAgency = await query(`
        SELECT id FROM agencies WHERE email = $1
      `, [email]);

      if (existingAgency.rows.length > 0) {
        return { success: false, error: 'Ya existe una agencia registrada con este email' };
      }

      const result = await query(`
        INSERT INTO agency_applications (
          company_name, business_name, cuit, contact_person, email, phone,
          address, city, province, documentation, commission_rate_proposed, 
          credit_limit_requested, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        company_name, business_name, cuit, contact_person, email, phone,
        address, city, province, JSON.stringify(documentation || {}),
        commission_rate_proposed || 10.0, credit_limit_requested || 0, notes
      ]);

      return {
        success: true,
        data: result.rows[0]
      };

    } catch (error) {
      console.error('❌ Error creando solicitud:', error);
      return { success: false, error: error.message };
    }
  }

  async getApplications(status = null) {
    try {
      let whereClause = '';
      let params = [];

      if (status) {
        whereClause = 'WHERE aa.status = $1';
        params = [status];
      }

      const result = await query(`
        SELECT 
          aa.*,
          u.full_name as reviewed_by_name
        FROM agency_applications aa
        LEFT JOIN users u ON aa.reviewed_by = u.id
        ${whereClause}
        ORDER BY aa.application_date DESC
      `, params);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo solicitudes:', error);
      return { success: false, error: error.message };
    }
  }

  async approveApplication(applicationId, userId, approvalData = {}) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Obtener datos de la solicitud
      const appResult = await client.query(`
        SELECT * FROM agency_applications WHERE id = $1 AND status = 'pending'
      `, [applicationId]);

      if (appResult.rows.length === 0) {
        throw new Error('Solicitud no encontrada o ya procesada');
      }

      const app = appResult.rows[0];

      // Generar código único para la agencia
      const agencyCode = await this.generateAgencyCode(app.company_name);

      // Crear agencia
      const agencyResult = await client.query(`
        INSERT INTO agencies (
          code, name, business_name, cuit, email, phone, address, city, province,
          contact_person, commission_rate, credit_limit, status, contract_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_DATE)
        RETURNING *
      `, [
        agencyCode,
        app.company_name,
        app.business_name,
        app.cuit,
        app.email,
        app.phone,
        app.address,
        app.city,
        app.province,
        app.contact_person,
        approvalData.commission_rate || app.commission_rate_proposed || 10.0,
        approvalData.credit_limit || app.credit_limit_requested || 0,
        'active'
      ]);

      const agencyId = agencyResult.rows[0].id;

      // Crear usuario administrador de la agencia
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await client.query(`
        INSERT INTO users (
          username, email, password_hash, role, full_name, agency_id, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        agencyCode.toLowerCase() + '_admin',
        app.email,
        hashedPassword,
        'admin_agencia',
        app.contact_person,
        agencyId,
        true
      ]);

      // Asignar ranking inicial (Bronze por defecto)
      const bronzeRanking = await client.query(`
        SELECT id FROM agency_rankings WHERE ranking_name = 'Bronze' AND is_active = true
      `);

      if (bronzeRanking.rows.length > 0) {
        await client.query(`
          INSERT INTO agency_performance (agency_id, ranking_id, period_start, period_end)
          VALUES ($1, $2, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
        `, [agencyId, bronzeRanking.rows[0].id]);
      }

      // Actualizar solicitud como aprobada
      await client.query(`
        UPDATE agency_applications 
        SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [userId, applicationId]);

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          agency: agencyResult.rows[0],
          temp_password: tempPassword,
          username: agencyCode.toLowerCase() + '_admin'
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error aprobando solicitud:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  async rejectApplication(applicationId, userId, rejectionReason) {
    try {
      const result = await query(`
        UPDATE agency_applications 
        SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $2
        WHERE id = $3 AND status = 'pending'
        RETURNING *
      `, [userId, rejectionReason, applicationId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Solicitud no encontrada o ya procesada' };
      }

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Error rechazando solicitud:', error);
      return { success: false, error: error.message };
    }
  }

  async generateAgencyCode(companyName) {
    // Generar código basado en el nombre de la empresa
    const baseCode = companyName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 8);

    // Verificar unicidad
    let code = baseCode;
    let suffix = 1;

    while (true) {
      const existing = await query('SELECT id FROM agencies WHERE code = $1', [code]);
      if (existing.rows.length === 0) {
        break;
      }
      code = baseCode + suffix;
      suffix++;
    }

    return code;
  }

  generateTempPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ===== SISTEMA DE RANKINGS =====
  async calculateAgencyRankings() {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Obtener período actual (mes anterior completo)
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

      // Obtener ventas por agencia en el período
      const salesData = await client.query(`
        SELECT 
          a.id as agency_id,
          COALESCE(SUM(i.total_amount), 0) as total_sales,
          COUNT(i.id) as total_invoices
        FROM agencies a
        LEFT JOIN invoices i ON a.id = i.agency_id 
          AND i.issue_date >= $1 
          AND i.issue_date <= $2
          AND i.status = 'paid'
        WHERE a.status = 'active'
        GROUP BY a.id
      `, [startDate, endDate]);

      // Obtener rankings disponibles
      const rankings = await client.query(`
        SELECT * FROM agency_rankings 
        WHERE is_active = true 
        ORDER BY min_monthly_sales DESC
      `);

      // Calcular ranking para cada agencia
      for (const agencyData of salesData.rows) {
        const { agency_id, total_sales, total_invoices } = agencyData;
        
        // Determinar ranking basado en ventas
        let assignedRanking = rankings.rows[rankings.rows.length - 1]; // Bronze por defecto
        
        for (const ranking of rankings.rows) {
          if (parseFloat(total_sales) >= parseFloat(ranking.min_monthly_sales)) {
            assignedRanking = ranking;
            break;
          }
        }

        // Calcular score de performance (0-100)
        const performanceScore = this.calculatePerformanceScore(total_sales, total_invoices);

        // Insertar/actualizar performance
        await client.query(`
          INSERT INTO agency_performance (
            agency_id, period_start, period_end, total_sales, total_bookings,
            ranking_id, performance_score
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (agency_id, period_start) 
          DO UPDATE SET 
            total_sales = EXCLUDED.total_sales,
            total_bookings = EXCLUDED.total_bookings,
            ranking_id = EXCLUDED.ranking_id,
            performance_score = EXCLUDED.performance_score,
            calculated_at = CURRENT_TIMESTAMP
        `, [
          agency_id, startDate, endDate, total_sales, total_invoices,
          assignedRanking.id, performanceScore
        ]);

        // Actualizar comisión de la agencia basada en el nuevo ranking
        await client.query(`
          UPDATE agencies 
          SET commission_rate = $1
          WHERE id = $2
        `, [assignedRanking.base_commission_rate, agency_id]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          period: { start: startDate, end: endDate },
          agencies_processed: salesData.rows.length,
          calculated_at: new Date()
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error calculando rankings:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  calculatePerformanceScore(sales, invoices) {
    // Algoritmo simple de score (mejorar según necesidades)
    const salesScore = Math.min((parseFloat(sales) / 100000) * 70, 70); // Máximo 70 puntos por ventas
    const activityScore = Math.min(parseInt(invoices) * 2, 30); // Máximo 30 puntos por actividad
    
    return Math.round(salesScore + activityScore);
  }

  async getAgencyRankingReport() {
    try {
      const result = await query(`
        SELECT 
          a.id,
          a.code,
          a.name,
          a.commission_rate,
          ar.ranking_name,
          ar.benefits,
          ap.total_sales,
          ap.total_bookings,
          ap.performance_score,
          ap.period_start,
          ap.period_end
        FROM agencies a
        LEFT JOIN agency_performance ap ON a.id = ap.agency_id
        LEFT JOIN agency_rankings ar ON ap.ranking_id = ar.id
        WHERE a.status = 'active'
          AND ap.period_start = (
            SELECT MAX(period_start) FROM agency_performance WHERE agency_id = a.id
          )
        ORDER BY ap.performance_score DESC, ap.total_sales DESC
      `);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo reporte de rankings:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== REGLAS DE COMISIONES PERSONALIZADAS =====
  async createCommissionRule(ruleData, userId) {
    try {
      const {
        agency_id, product_category, destination, commission_type,
        commission_value, min_amount, max_amount, effective_from, effective_until
      } = ruleData;

      // Validar que no se superponga con reglas existentes
      const conflictCheck = await query(`
        SELECT id FROM commission_rules 
        WHERE agency_id = $1 
          AND is_active = true
          AND (product_category = $2 OR product_category IS NULL)
          AND (destination = $3 OR destination IS NULL)
          AND effective_from <= $4
          AND (effective_until IS NULL OR effective_until >= $4)
      `, [agency_id, product_category, destination, effective_from]);

      if (conflictCheck.rows.length > 0) {
        return { 
          success: false, 
          error: 'Existe una regla conflictiva para esta agencia y criterios' 
        };
      }

      const result = await query(`
        INSERT INTO commission_rules (
          agency_id, product_category, destination, commission_type,
          commission_value, min_amount, max_amount, effective_from, 
          effective_until, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        agency_id, product_category, destination, commission_type,
        commission_value, min_amount, max_amount, effective_from,
        effective_until, userId
      ]);

      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Error creando regla de comisión:', error);
      return { success: false, error: error.message };
    }
  }

  async getCommissionRules(agencyId = null) {
    try {
      let whereClause = 'WHERE cr.is_active = true';
      let params = [];

      if (agencyId) {
        whereClause += ' AND cr.agency_id = $1';
        params = [agencyId];
      }

      const result = await query(`
        SELECT 
          cr.*,
          a.name as agency_name,
          a.code as agency_code,
          u.full_name as created_by_name
        FROM commission_rules cr
        JOIN agencies a ON cr.agency_id = a.id
        LEFT JOIN users u ON cr.created_by = u.id
        ${whereClause}
        ORDER BY cr.effective_from DESC
      `, params);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo reglas de comisión:', error);
      return { success: false, error: error.message };
    }
  }

  async calculateCommissionForBooking(agencyId, amount, productCategory = null, destination = null) {
    try {
      // Buscar regla específica más aplicable
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

      if (ruleResult.rows.length > 0) {
        const rule = ruleResult.rows[0];
        let commission = 0;

        switch (rule.commission_type) {
          case 'percentage':
            commission = parseFloat(amount) * (parseFloat(rule.commission_value) / 100);
            break;
          case 'fixed':
            commission = parseFloat(rule.commission_value);
            break;
          case 'tiered':
            // Implementar lógica de comisión escalonada
            commission = this.calculateTieredCommission(amount, rule.commission_value);
            break;
        }

        return {
          success: true,
          data: {
            commission_amount: commission,
            commission_rate: rule.commission_value,
            commission_type: rule.commission_type,
            rule_applied: rule.id
          }
        };
      }

      // Si no hay regla específica, usar la comisión base de la agencia
      const agencyResult = await query(`
        SELECT commission_rate FROM agencies WHERE id = $1
      `, [agencyId]);

      if (agencyResult.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      const baseRate = parseFloat(agencyResult.rows[0].commission_rate);
      const commission = parseFloat(amount) * (baseRate / 100);

      return {
        success: true,
        data: {
          commission_amount: commission,
          commission_rate: baseRate,
          commission_type: 'percentage',
          rule_applied: 'base_rate'
        }
      };

    } catch (error) {
      console.error('❌ Error calculando comisión:', error);
      return { success: false, error: error.message };
    }
  }

  calculateTieredCommission(amount, tiers) {
    // Ejemplo de implementación de comisión escalonada
    // tiers sería un JSON con estructura: [{"min": 0, "max": 10000, "rate": 8}, {"min": 10000, "max": null, "rate": 12}]
    try {
      const tierData = typeof tiers === 'string' ? JSON.parse(tiers) : tiers;
      let commission = 0;
      let remainingAmount = parseFloat(amount);

      for (const tier of tierData) {
        const tierMin = parseFloat(tier.min || 0);
        const tierMax = tier.max ? parseFloat(tier.max) : null;
        const tierRate = parseFloat(tier.rate);

        if (remainingAmount <= 0) break;

        let tierAmount = 0;
        if (tierMax) {
          tierAmount = Math.min(remainingAmount, tierMax - tierMin);
        } else {
          tierAmount = remainingAmount;
        }

        commission += tierAmount * (tierRate / 100);
        remainingAmount -= tierAmount;
      }

      return commission;
    } catch (error) {
      console.error('❌ Error en cálculo escalonado:', error);
      return parseFloat(amount) * 0.1; // Fallback al 10%
    }
  }

  // ===== ANÁLISIS Y REPORTES =====
  async getAgencyPerformanceAnalysis(agencyId, months = 12) {
    try {
      const result = await query(`
        SELECT 
          ap.period_start,
          ap.period_end,
          ap.total_sales,
          ap.total_bookings,
          ap.performance_score,
          ar.ranking_name,
          ar.base_commission_rate
        FROM agency_performance ap
        LEFT JOIN agency_rankings ar ON ap.ranking_id = ar.id
        WHERE ap.agency_id = $1
        ORDER BY ap.period_start DESC
        LIMIT $2
      `, [agencyId, months]);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo análisis de performance:', error);
      return { success: false, error: error.message };
    }
  }

  async getTopPerformingAgencies(limit = 10) {
    try {
      const result = await query(`
        SELECT 
          a.id,
          a.code,
          a.name,
          a.commission_rate,
          ap.total_sales,
          ap.performance_score,
          ar.ranking_name
        FROM agencies a
        JOIN agency_performance ap ON a.id = ap.agency_id
        JOIN agency_rankings ar ON ap.ranking_id = ar.id
        WHERE a.status = 'active'
          AND ap.period_start = (
            SELECT MAX(period_start) FROM agency_performance WHERE agency_id = a.id
          )
        ORDER BY ap.performance_score DESC, ap.total_sales DESC
        LIMIT $1
      `, [limit]);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo top agencias:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AdvancedAgenciesModule();
