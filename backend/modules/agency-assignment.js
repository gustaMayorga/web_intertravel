// ===============================================
// SISTEMA DE DERIVACIÓN INTELIGENTE B2B2C
// Asignación automática de ventas a agencias
// ===============================================

const { dbManager } = require('../database');
const moment = require('moment');

class AgencyAssignmentEngine {
  constructor() {
    this.assignmentRules = {
      // Peso de cada criterio (total = 100%)
      geographic: 0.40,    // 40% - Proximidad geográfica
      expertise: 0.30,     // 30% - Especialización en destino
      performance: 0.20,   // 20% - Rendimiento histórico
      availability: 0.10   // 10% - Disponibilidad y carga
    };

    this.defaultCommissionRate = 10.00;
    this.maxAssignmentRetries = 3;
  }

  // ===============================================
  // ALGORITMO PRINCIPAL DE ASIGNACIÓN
  // ===============================================

  async assignOrderToAgency(orderData) {
    try {
      console.log('🎯 Iniciando asignación automática para orden:', orderData.orderId);

      // 1. Obtener agencias elegibles
      const eligibleAgencies = await this.getEligibleAgencies();
      
      if (eligibleAgencies.length === 0) {
        console.log('⚠️ No hay agencias elegibles disponibles');
        return { 
          success: false, 
          error: 'No hay agencias disponibles',
          fallback: 'admin_assignment'
        };
      }

      // 2. Calcular score para cada agencia
      const scoredAgencies = await this.calculateAgencyScores(orderData, eligibleAgencies);

      // 3. Seleccionar mejor agencia
      const selectedAgency = this.selectBestAgency(scoredAgencies);

      // 4. Crear asignación en BD
      const assignmentResult = await this.createAssignment(orderData, selectedAgency);

      if (assignmentResult.success) {
        // 5. Notificar a la agencia
        await this.notifyAgency(selectedAgency, orderData, assignmentResult.assignment);

        // 6. Calcular comisiones
        await this.calculateCommissions(orderData, selectedAgency, assignmentResult.assignment);

        console.log('✅ Orden asignada exitosamente:', {
          orderId: orderData.orderId,
          agencyCode: selectedAgency.code,
          agencyName: selectedAgency.name,
          score: selectedAgency.totalScore,
          commission: selectedAgency.commissionAmount
        });

        return {
          success: true,
          assignment: {
            orderId: orderData.orderId,
            agencyId: selectedAgency.id,
            agencyCode: selectedAgency.code,
            agencyName: selectedAgency.name,
            commissionRate: selectedAgency.commission_rate,
            commissionAmount: selectedAgency.commissionAmount,
            score: selectedAgency.totalScore,
            assignedAt: assignmentResult.assignment.assigned_at
          }
        };
      }

      return assignmentResult;

    } catch (error) {
      console.error('❌ Error en asignación de agencia:', error);
      return { 
        success: false, 
        error: 'Error interno en asignación',
        details: error.message
      };
    }
  }

  // ===============================================
  // OBTENER AGENCIAS ELEGIBLES
  // ===============================================

  async getEligibleAgencies() {
    try {
      const result = await dbManager.query(`
        SELECT 
          a.*,
          COUNT(CASE WHEN aa.status = 'active' THEN 1 END) as active_assignments,
          COUNT(CASE WHEN aa.assigned_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 END) as recent_assignments,
          COALESCE(AVG(aa.performance_score), 0) as avg_performance
        FROM agencies a
        LEFT JOIN agency_assignments aa ON a.id = aa.agency_id
        WHERE a.status = 'active'
          AND a.commission_rate > 0
        GROUP BY a.id
        HAVING COUNT(CASE WHEN aa.assigned_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 END) < 20
        ORDER BY avg_performance DESC, active_assignments ASC
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo agencias elegibles:', error);
      return [];
    }
  }

  // ===============================================
  // CALCULAR SCORES POR AGENCIA
  // ===============================================

  async calculateAgencyScores(orderData, agencies) {
    const scoredAgencies = [];

    for (const agency of agencies) {
      try {
        const scores = {
          geographic: await this.calculateGeographicScore(orderData, agency),
          expertise: await this.calculateExpertiseScore(orderData, agency),
          performance: await this.calculatePerformanceScore(agency),
          availability: await this.calculateAvailabilityScore(agency)
        };

        // Calcular score total ponderado
        const totalScore = (
          scores.geographic * this.assignmentRules.geographic +
          scores.expertise * this.assignmentRules.expertise +
          scores.performance * this.assignmentRules.performance +
          scores.availability * this.assignmentRules.availability
        );

        // Calcular comisión estimada
        const commissionAmount = orderData.amount * (agency.commission_rate / 100);

        scoredAgencies.push({
          ...agency,
          scores,
          totalScore,
          commissionAmount,
          explanation: this.generateScoreExplanation(scores)
        });

      } catch (error) {
        console.error(`❌ Error calculando score para agencia ${agency.code}:`, error);
      }
    }

    // Ordenar por score total (descendente)
    return scoredAgencies.sort((a, b) => b.totalScore - a.totalScore);
  }

  // ===============================================
  // CÁLCULO DE SCORES INDIVIDUALES
  // ===============================================

  async calculateGeographicScore(orderData, agency) {
    try {
      // Score basado en proximidad geográfica
      let score = 0;

      // Coincidencia exacta de provincia/región
      if (orderData.customerLocation?.province === agency.province) {
        score += 80;
      }
      // Coincidencia de país
      else if (orderData.customerLocation?.country === agency.country || agency.country === 'Argentina') {
        score += 60;
      }
      // Internacional
      else {
        score += 30;
      }

      // Bonus por experiencia local
      if (agency.city && orderData.customerLocation?.city === agency.city) {
        score += 20;
      }

      return Math.min(score, 100);
    } catch (error) {
      console.error('❌ Error calculando score geográfico:', error);
      return 50; // Score neutro
    }
  }

  async calculateExpertiseScore(orderData, agency) {
    try {
      // Score basado en especialización en destino
      const destination = orderData.packageDestination?.toLowerCase();
      let score = 50; // Base score

      // Buscar ventas históricas en el mismo destino
      const expertiseResult = await dbManager.query(`
        SELECT 
          COUNT(*) as sales_count,
          AVG(performance_score) as avg_performance
        FROM agency_assignments aa
        JOIN orders o ON aa.order_id = o.id
        WHERE aa.agency_id = $1 
          AND LOWER(o.package_destination) LIKE $2
          AND aa.status = 'completed'
          AND aa.assigned_at > CURRENT_TIMESTAMP - INTERVAL '6 months'
      `, [agency.id, `%${destination}%`]);

      const expertise = expertiseResult.rows[0];
      
      if (expertise.sales_count > 0) {
        // Más ventas = más expertise
        score += Math.min(expertise.sales_count * 5, 40);
        
        // Performance histórica en ese destino
        if (expertise.avg_performance > 0) {
          score += expertise.avg_performance * 0.1;
        }
      }

      return Math.min(score, 100);
    } catch (error) {
      console.error('❌ Error calculando score de expertise:', error);
      return 50;
    }
  }

  async calculatePerformanceScore(agency) {
    try {
      // Score basado en rendimiento histórico
      const performanceResult = await dbManager.query(`
        SELECT 
          COUNT(*) as total_assignments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          AVG(performance_score) as avg_score,
          AVG(customer_satisfaction) as avg_satisfaction
        FROM agency_assignments
        WHERE agency_id = $1
          AND assigned_at > CURRENT_TIMESTAMP - INTERVAL '3 months'
      `, [agency.id]);

      const performance = performanceResult.rows[0];
      
      if (performance.total_assignments === 0) {
        return 70; // Score inicial para agencias nuevas
      }

      let score = 0;

      // Tasa de completado
      const completionRate = (performance.completed / performance.total_assignments) * 100;
      score += completionRate * 0.5;

      // Score promedio histórico
      if (performance.avg_score > 0) {
        score += performance.avg_score * 0.3;
      }

      // Satisfacción del cliente
      if (performance.avg_satisfaction > 0) {
        score += performance.avg_satisfaction * 0.2;
      }

      return Math.min(score, 100);
    } catch (error) {
      console.error('❌ Error calculando score de performance:', error);
      return 70;
    }
  }

  async calculateAvailabilityScore(agency) {
    try {
      // Score basado en disponibilidad actual
      const availabilityResult = await dbManager.query(`
        SELECT 
          COUNT(CASE WHEN status IN ('active', 'in_progress') THEN 1 END) as active_load,
          COUNT(CASE WHEN assigned_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 1 END) as recent_load
        FROM agency_assignments
        WHERE agency_id = $1
      `, [agency.id]);

      const availability = availabilityResult.rows[0];
      
      let score = 100;

      // Penalizar por carga activa
      score -= availability.active_load * 5;
      
      // Penalizar por asignaciones recientes
      score -= availability.recent_load * 3;

      // Bonus por agencias poco cargadas
      if (availability.active_load === 0) {
        score += 10;
      }

      return Math.max(score, 10); // Score mínimo de 10
    } catch (error) {
      console.error('❌ Error calculando score de disponibilidad:', error);
      return 70;
    }
  }

  // ===============================================
  // SELECCIÓN Y ASIGNACIÓN
  // ===============================================

  selectBestAgency(scoredAgencies) {
    if (scoredAgencies.length === 0) {
      return null;
    }

    // La primera es la mejor (ya están ordenadas)
    const bestAgency = scoredAgencies[0];

    console.log('🏆 Mejor agencia seleccionada:', {
      code: bestAgency.code,
      name: bestAgency.name,
      totalScore: bestAgency.totalScore.toFixed(2),
      commission: bestAgency.commissionAmount
    });

    return bestAgency;
  }

  async createAssignment(orderData, agency) {
    try {
      // Crear registro de asignación
      const assignmentResult = await dbManager.query(`
        INSERT INTO agency_assignments (
          id, order_id, agency_id, agency_code, agency_name,
          amount, commission_rate, commission_amount,
          assignment_score, assignment_data, status, assigned_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        `assign_${orderData.orderId}_${Date.now()}`,
        orderData.orderId,
        agency.id,
        agency.code,
        agency.name,
        orderData.amount,
        agency.commission_rate,
        agency.commissionAmount,
        agency.totalScore,
        JSON.stringify({
          scores: agency.scores,
          explanation: agency.explanation,
          assignedBy: 'automatic_system'
        }),
        'active',
        moment().toISOString()
      ]);

      // Actualizar orden con agencia asignada
      await dbManager.query(`
        UPDATE orders 
        SET assigned_agency_id = $1, assigned_agency_code = $2, updated_at = $3
        WHERE id = $4
      `, [agency.id, agency.code, moment().toISOString(), orderData.orderId]);

      return {
        success: true,
        assignment: assignmentResult.rows[0]
      };

    } catch (error) {
      console.error('❌ Error creando asignación:', error);
      return {
        success: false,
        error: 'Error guardando asignación'
      };
    }
  }

  // ===============================================
  // NOTIFICACIONES Y COMISIONES
  // ===============================================

  async notifyAgency(agency, orderData, assignment) {
    try {
      // Crear notificación en BD
      await dbManager.query(`
        INSERT INTO agency_notifications (
          agency_id, assignment_id, order_id, type, title, message, 
          data, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        agency.id,
        assignment.id,
        orderData.orderId,
        'new_assignment',
        'Nueva venta asignada',
        `Se te ha asignado una nueva venta por ${orderData.amount} ${orderData.currency}`,
        JSON.stringify({
          packageTitle: orderData.packageTitle,
          destination: orderData.packageDestination,
          customerName: orderData.customerName,
          travelers: orderData.travelers,
          commissionAmount: agency.commissionAmount
        }),
        'unread',
        moment().toISOString()
      ]);

      // TODO: Enviar email/WhatsApp/SMS a la agencia
      console.log('📧 Notificación enviada a agencia:', agency.code);

      return { success: true };
    } catch (error) {
      console.error('❌ Error notificando agencia:', error);
      return { success: false };
    }
  }

  async calculateCommissions(orderData, agency, assignment) {
    try {
      // Crear registro de comisión
      await dbManager.query(`
        INSERT INTO agency_commissions (
          assignment_id, order_id, agency_id, base_amount, 
          commission_rate, commission_amount, currency, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        assignment.id,
        orderData.orderId,
        agency.id,
        orderData.amount,
        agency.commission_rate,
        agency.commissionAmount,
        orderData.currency,
        'pending',
        moment().toISOString()
      ]);

      console.log('💰 Comisión calculada:', {
        agencyCode: agency.code,
        baseAmount: orderData.amount,
        rate: agency.commission_rate,
        commission: agency.commissionAmount
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error calculando comisiones:', error);
      return { success: false };
    }
  }

  // ===============================================
  // UTILIDADES
  // ===============================================

  generateScoreExplanation(scores) {
    const explanations = [];

    if (scores.geographic > 70) explanations.push('Excelente cobertura geográfica');
    if (scores.expertise > 70) explanations.push('Especialización en destino');
    if (scores.performance > 80) explanations.push('Alto rendimiento histórico');
    if (scores.availability > 90) explanations.push('Alta disponibilidad');

    return explanations.join(', ') || 'Agencia competente';
  }

  // ===============================================
  // GESTIÓN MANUAL Y REASIGNACIONES
  // ===============================================

  async reassignOrder(orderId, newAgencyId, reason, assignedBy) {
    try {
      // Desactivar asignación actual
      await dbManager.query(`
        UPDATE agency_assignments 
        SET status = 'reassigned', updated_at = $1
        WHERE order_id = $2 AND status = 'active'
      `, [moment().toISOString(), orderId]);

      // Obtener datos de la orden
      const orderResult = await dbManager.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length === 0) {
        return { success: false, error: 'Orden no encontrada' };
      }

      const orderData = orderResult.rows[0];

      // Obtener nueva agencia
      const agencyResult = await dbManager.query('SELECT * FROM agencies WHERE id = $1', [newAgencyId]);
      if (agencyResult.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      const agency = agencyResult.rows[0];

      // Crear nueva asignación
      const newAssignment = await this.createAssignment(orderData, {
        ...agency,
        commissionAmount: orderData.amount * (agency.commission_rate / 100),
        totalScore: 100 // Score máximo para asignación manual
      });

      if (newAssignment.success) {
        // Registrar motivo de reasignación
        await dbManager.query(`
          UPDATE agency_assignments 
          SET reassignment_reason = $1, assigned_by = $2, updated_at = $3
          WHERE id = $4
        `, [reason, assignedBy, moment().toISOString(), newAssignment.assignment.id]);

        console.log('🔄 Orden reasignada exitosamente:', {
          orderId,
          fromAgency: 'previous',
          toAgency: agency.code,
          reason
        });
      }

      return newAssignment;

    } catch (error) {
      console.error('❌ Error reasignando orden:', error);
      return { success: false, error: 'Error interno' };
    }
  }

  // ===============================================
  // ESTADÍSTICAS Y REPORTES
  // ===============================================

  async getAssignmentStats(filters = {}) {
    try {
      const { startDate, endDate, agencyId } = filters;
      
      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramCount = 0;

      if (startDate) {
        paramCount++;
        whereConditions.push(`assigned_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`assigned_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      if (agencyId) {
        paramCount++;
        whereConditions.push(`agency_id = $${paramCount}`);
        queryParams.push(agencyId);
      }

      const whereClause = whereConditions.join(' AND ');

      const statsResult = await dbManager.query(`
        SELECT 
          COUNT(*) as total_assignments,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_assignments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assignments,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_assignments,
          SUM(amount) as total_assigned_amount,
          SUM(commission_amount) as total_commission_amount,
          AVG(assignment_score) as avg_assignment_score
        FROM agency_assignments
        WHERE ${whereClause}
      `, queryParams);

      const topAgenciesResult = await dbManager.query(`
        SELECT 
          agency_code, agency_name,
          COUNT(*) as assignment_count,
          SUM(amount) as total_amount,
          SUM(commission_amount) as total_commission,
          AVG(assignment_score) as avg_score
        FROM agency_assignments
        WHERE ${whereClause}
        GROUP BY agency_id, agency_code, agency_name
        ORDER BY total_amount DESC
        LIMIT 10
      `, queryParams);

      return {
        success: true,
        stats: statsResult.rows[0],
        topAgencies: topAgenciesResult.rows
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { success: false, error: 'Error interno' };
    }
  }
}

module.exports = new AgencyAssignmentEngine();
