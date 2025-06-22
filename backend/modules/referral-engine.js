// ===============================================
// SISTEMA DE REFERIDOS AUTOMÁTICO - INTERTRAVEL
// Gestión automática de referidos y comisiones
// ===============================================

const crypto = require('crypto');

class ReferralEngine {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.isInitialized = false;
    
    console.log('🎯 Inicializando ReferralEngine...');
    this.initialize();
  }

  async initialize() {
    try {
      // Verificar que las tablas necesarias existan
      await this.verifyTables();
      
      this.isInitialized = true;
      console.log('✅ ReferralEngine inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando ReferralEngine:', error);
    }
  }

  async verifyTables() {
    const tables = ['referral_program', 'referral_tracking', 'customer_classification', 'agencies'];
    
    for (const table of tables) {
      const result = await this.dbManager.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        console.warn(`⚠️ Tabla ${table} no existe. Ejecutar extend-database.sql`);
      }
    }
  }

  // ===============================================
  // GENERAR CÓDIGO DE REFERIDO
  // ===============================================

  generateReferralCode(agencyId, customPrefix = '') {
    const prefix = customPrefix || 'REF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    return `${prefix}-${agencyId}-${timestamp}-${random}`;
  }

  // ===============================================
  // CREAR PROGRAMA DE REFERIDOS PARA AGENCIA
  // ===============================================

  async createReferralProgram(agencyData) {
    console.log(`🎯 Creando programa de referidos para agencia: ${agencyData.name}`);

    try {
      // Generar código único
      let referralCode;
      let attempts = 0;
      
      do {
        referralCode = this.generateReferralCode(agencyData.id, agencyData.code?.substring(0, 3));
        attempts++;
        
        if (attempts > 5) {
          throw new Error('No se pudo generar código único');
        }
        
        // Verificar que el código no exista
        const existing = await this.dbManager.query(`
          SELECT id FROM referral_program WHERE referral_code = $1
        `, [referralCode]);
        
        if (existing.rows.length === 0) break;
        
      } while (attempts < 5);

      // Crear programa de referidos
      const result = await this.dbManager.query(`
        INSERT INTO referral_program (
          agency_id, referral_code, commission_rate, status,
          valid_from, terms_conditions
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        agencyData.id,
        referralCode,
        agencyData.defaultCommissionRate || 5.0,
        'active',
        new Date(),
        this.generateDefaultTerms(agencyData.name)
      ]);

      const program = result.rows[0];

      console.log(`✅ Programa de referidos creado: ${referralCode}`);
      
      // Log de actividad
      await this.logReferralActivity('program_created', {
        agencyId: agencyData.id,
        referralCode: referralCode,
        commissionRate: program.commission_rate
      });

      return {
        success: true,
        program: program,
        referralCode: referralCode,
        message: 'Programa de referidos creado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando programa de referidos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // RASTREAR REFERIDO AUTOMÁTICAMENTE
  // ===============================================

  async trackReferral(referralCode, customerData, orderData = null) {
    console.log(`🔍 Rastreando referido: ${referralCode} para ${customerData.email}`);

    try {
      // 1. Verificar que el código de referido existe y está activo
      const programResult = await this.dbManager.query(`
        SELECT rp.*, a.name as agency_name
        FROM referral_program rp
        JOIN agencies a ON rp.agency_id = a.id
        WHERE rp.referral_code = $1 AND rp.status = 'active'
        AND (rp.valid_until IS NULL OR rp.valid_until >= CURRENT_DATE)
      `, [referralCode]);

      if (programResult.rows.length === 0) {
        return {
          success: false,
          error: 'Código de referido inválido o expirado'
        };
      }

      const program = programResult.rows[0];

      // 2. Verificar que el cliente no haya sido referido previamente
      const existingReferral = await this.dbManager.query(`
        SELECT id FROM referral_tracking 
        WHERE referred_customer_email = $1
      `, [customerData.email]);

      if (existingReferral.rows.length > 0) {
        return {
          success: false,
          error: 'Cliente ya fue referido anteriormente'
        };
      }

      // 3. Crear tracking de referido
      const trackingResult = await this.dbManager.query(`
        INSERT INTO referral_tracking (
          referral_code, referrer_agency_id, referred_customer_email,
          referred_customer_name, referred_customer_phone,
          order_id, sale_amount, commission_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        referralCode,
        program.agency_id,
        customerData.email,
        customerData.name || '',
        customerData.phone || '',
        orderData?.id || null,
        orderData?.amount ? parseFloat(orderData.amount) : null,
        program.commission_rate,
        orderData ? 'pending' : 'referred'
      ]);

      const tracking = trackingResult.rows[0];

      // 4. Clasificar cliente como referido
      await this.classifyReferredCustomer(customerData, program.agency_id);

      // 5. Si hay una venta, calcular comisión
      let commissionAmount = 0;
      if (orderData && orderData.amount) {
        commissionAmount = await this.calculateReferralCommission(referralCode, parseFloat(orderData.amount));
        
        // Actualizar tracking con datos de venta
        await this.dbManager.query(`
          UPDATE referral_tracking 
          SET 
            sale_amount = $1,
            commission_amount = $2,
            status = 'confirmed',
            conversion_date = $3,
            updated_at = $4
          WHERE id = $5
        `, [
          parseFloat(orderData.amount),
          commissionAmount,
          new Date(),
          new Date(),
          tracking.id
        ]);
      }

      // 6. Actualizar estadísticas del programa
      await this.updateProgramStats(program.id, commissionAmount);

      console.log(`✅ Referido rastreado: ${customerData.email} → Agencia ${program.agency_name}`);

      // Log de actividad
      await this.logReferralActivity('referral_tracked', {
        referralCode: referralCode,
        customerEmail: customerData.email,
        agencyId: program.agency_id,
        hasOrder: !!orderData,
        commissionAmount: commissionAmount
      });

      return {
        success: true,
        tracking: tracking,
        program: program,
        commissionAmount: commissionAmount,
        message: 'Referido rastreado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error rastreando referido:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // CALCULAR COMISIÓN DE REFERIDO
  // ===============================================

  async calculateReferralCommission(referralCode, saleAmount) {
    try {
      const result = await this.dbManager.query(`
        SELECT commission_rate 
        FROM referral_program 
        WHERE referral_code = $1 AND status = 'active'
      `, [referralCode]);

      if (result.rows.length === 0) {
        return 0;
      }

      const commissionRate = parseFloat(result.rows[0].commission_rate);
      const commissionAmount = saleAmount * (commissionRate / 100);

      console.log(`💰 Comisión calculada: ${commissionRate}% de $${saleAmount} = $${commissionAmount}`);

      return parseFloat(commissionAmount.toFixed(2));

    } catch (error) {
      console.error('❌ Error calculando comisión:', error);
      return 0;
    }
  }

  // ===============================================
  // CLASIFICAR CLIENTE REFERIDO
  // ===============================================

  async classifyReferredCustomer(customerData, referrerAgencyId) {
    try {
      // Verificar si el cliente ya existe en clasificación
      const existing = await this.dbManager.query(`
        SELECT id FROM customer_classification 
        WHERE customer_email = $1
      `, [customerData.email]);

      if (existing.rows.length === 0) {
        // Crear nueva clasificación como referido
        await this.dbManager.query(`
          INSERT INTO customer_classification (
            customer_email, customer_name, customer_phone,
            classification, referrer_agency_id, acquisition_source,
            lifetime_value, total_bookings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          customerData.email,
          customerData.name || '',
          customerData.phone || '',
          'referral',
          referrerAgencyId,
          'referral',
          0,
          0
        ]);
      } else {
        // Actualizar cliente existente
        await this.dbManager.query(`
          UPDATE customer_classification 
          SET 
            classification = 'referral',
            referrer_agency_id = $1,
            updated_at = $2
          WHERE customer_email = $3
        `, [
          referrerAgencyId,
          new Date(),
          customerData.email
        ]);
      }

      console.log(`📊 Cliente clasificado como referido: ${customerData.email}`);

    } catch (error) {
      console.error('❌ Error clasificando cliente referido:', error);
    }
  }

  // ===============================================
  // ACTUALIZAR ESTADÍSTICAS DEL PROGRAMA
  // ===============================================

  async updateProgramStats(programId, commissionAmount = 0) {
    try {
      await this.dbManager.query(`
        UPDATE referral_program 
        SET 
          total_referrals = total_referrals + 1,
          commission_earned = commission_earned + $1,
          updated_at = $2
        WHERE id = $3
      `, [
        commissionAmount,
        new Date(),
        programId
      ]);

      // Si hay venta, también actualizar ventas referidas
      if (commissionAmount > 0) {
        const saleAmount = commissionAmount / (await this.getCommissionRate(programId) / 100);
        
        await this.dbManager.query(`
          UPDATE referral_program 
          SET total_referred_sales = total_referred_sales + $1
          WHERE id = $2
        `, [
          saleAmount,
          programId
        ]);
      }

    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }

  async getCommissionRate(programId) {
    try {
      const result = await this.dbManager.query(`
        SELECT commission_rate FROM referral_program WHERE id = $1
      `, [programId]);

      return result.rows.length > 0 ? parseFloat(result.rows[0].commission_rate) : 5.0;
    } catch (error) {
      return 5.0; // Default
    }
  }

  // ===============================================
  // SEPARACIÓN AUTOMÁTICA DE CLIENTES
  // ===============================================

  async getClientSeparation() {
    try {
      console.log('📊 Generando separación de clientes...');

      // Clientes de agencias
      const agencyClients = await this.dbManager.query(`
        SELECT 
          cc.agency_id,
          a.name as agency_name,
          a.code as agency_code,
          COUNT(cc.id) as client_count,
          COALESCE(SUM(cc.lifetime_value), 0) as total_sales,
          COALESCE(SUM(cc.total_bookings), 0) as total_bookings
        FROM customer_classification cc
        JOIN agencies a ON cc.agency_id = a.id
        WHERE cc.classification = 'agency'
        GROUP BY cc.agency_id, a.name, a.code
        ORDER BY total_sales DESC
      `);

      // Clientes directos
      const directClients = await this.dbManager.query(`
        SELECT 
          COUNT(*) as client_count,
          COALESCE(SUM(lifetime_value), 0) as total_sales,
          COALESCE(SUM(total_bookings), 0) as total_bookings
        FROM customer_classification
        WHERE classification = 'direct'
      `);

      // Clientes referidos por agencia
      const referralClients = await this.dbManager.query(`
        SELECT 
          cc.referrer_agency_id,
          a.name as referrer_agency_name,
          COUNT(cc.id) as referred_count,
          COALESCE(SUM(cc.lifetime_value), 0) as referred_sales,
          COALESCE(SUM(rt.commission_amount), 0) as commission_earned
        FROM customer_classification cc
        JOIN agencies a ON cc.referrer_agency_id = a.id
        LEFT JOIN referral_tracking rt ON cc.customer_email = rt.referred_customer_email
        WHERE cc.classification = 'referral'
        GROUP BY cc.referrer_agency_id, a.name
        ORDER BY referred_sales DESC
      `);

      return {
        success: true,
        separation: {
          agencyClients: agencyClients.rows,
          directClients: directClients.rows[0],
          referralClients: referralClients.rows
        },
        summary: {
          totalAgencies: agencyClients.rows.length,
          totalDirectClients: directClients.rows[0]?.client_count || 0,
          totalReferralAgencies: referralClients.rows.length,
          totalReferredClients: referralClients.rows.reduce((sum, row) => sum + parseInt(row.referred_count), 0)
        }
      };

    } catch (error) {
      console.error('❌ Error generando separación de clientes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // MÉTRICAS Y REPORTES
  // ===============================================

  async getReferralMetrics(agencyId = null, startDate = null, endDate = null) {
    try {
      let whereClause = '';
      let params = [];
      let paramCount = 0;

      if (agencyId) {
        paramCount++;
        whereClause += ` AND rp.agency_id = $${paramCount}`;
        params.push(agencyId);
      }

      if (startDate) {
        paramCount++;
        whereClause += ` AND rt.created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereClause += ` AND rt.created_at <= $${paramCount}`;
        params.push(endDate);
      }

      const query = `
        SELECT 
          rp.agency_id,
          a.name as agency_name,
          rp.referral_code,
          rp.commission_rate,
          rp.total_referrals,
          rp.total_referred_sales,
          rp.commission_earned,
          COUNT(rt.id) as period_referrals,
          COALESCE(SUM(rt.sale_amount), 0) as period_sales,
          COALESCE(SUM(rt.commission_amount), 0) as period_commission,
          COALESCE(AVG(rt.sale_amount), 0) as avg_sale_amount
        FROM referral_program rp
        JOIN agencies a ON rp.agency_id = a.id
        LEFT JOIN referral_tracking rt ON rp.referral_code = rt.referral_code
        WHERE rp.status = 'active' ${whereClause}
        GROUP BY rp.id, rp.agency_id, a.name, rp.referral_code, 
                 rp.commission_rate, rp.total_referrals, 
                 rp.total_referred_sales, rp.commission_earned
        ORDER BY period_sales DESC
      `;

      const result = await this.dbManager.query(query, params);

      // Calcular totales
      const totals = result.rows.reduce((acc, row) => ({
        totalReferrals: acc.totalReferrals + parseInt(row.period_referrals),
        totalSales: acc.totalSales + parseFloat(row.period_sales),
        totalCommissions: acc.totalCommissions + parseFloat(row.period_commission),
        avgSaleAmount: 0 // Se calcula después
      }), { totalReferrals: 0, totalSales: 0, totalCommissions: 0, avgSaleAmount: 0 });

      totals.avgSaleAmount = totals.totalReferrals > 0 ? totals.totalSales / totals.totalReferrals : 0;

      return {
        success: true,
        metrics: result.rows,
        totals: totals,
        period: {
          startDate: startDate || 'Inicio',
          endDate: endDate || 'Fin'
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo métricas de referidos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // PROCESAR COMISIONES PENDIENTES
  // ===============================================

  async processPendingCommissions() {
    console.log('💰 Procesando comisiones pendientes...');

    try {
      // Obtener referidos con comisiones confirmadas pero no pagadas
      const pending = await this.dbManager.query(`
        SELECT 
          rt.*,
          rp.agency_id,
          a.name as agency_name,
          a.email as agency_email
        FROM referral_tracking rt
        JOIN referral_program rp ON rt.referral_code = rp.referral_code
        JOIN agencies a ON rp.agency_id = a.id
        WHERE rt.status = 'confirmed' 
        AND rt.commission_paid_date IS NULL
        AND rt.commission_amount > 0
        ORDER BY rt.conversion_date ASC
      `);

      if (pending.rows.length === 0) {
        return {
          success: true,
          message: 'No hay comisiones pendientes',
          processed: 0
        };
      }

      const processed = [];

      for (const commission of pending.rows) {
        try {
          // Marcar comisión como pagada (en un sistema real, aquí se procesaría el pago)
          await this.dbManager.query(`
            UPDATE referral_tracking 
            SET 
              status = 'paid',
              commission_paid_date = $1,
              updated_at = $2
            WHERE id = $3
          `, [
            new Date(),
            new Date(),
            commission.id
          ]);

          // Actualizar totales del programa
          await this.dbManager.query(`
            UPDATE referral_program 
            SET 
              commission_paid = commission_paid + $1,
              updated_at = $2
            WHERE referral_code = $3
          `, [
            commission.commission_amount,
            new Date(),
            commission.referral_code
          ]);

          processed.push({
            agencyName: commission.agency_name,
            customerEmail: commission.referred_customer_email,
            amount: commission.commission_amount,
            saleAmount: commission.sale_amount
          });

          console.log(`✅ Comisión procesada: $${commission.commission_amount} para ${commission.agency_name}`);

        } catch (error) {
          console.error(`❌ Error procesando comisión ${commission.id}:`, error);
        }
      }

      // Log de actividad
      await this.logReferralActivity('commissions_processed', {
        count: processed.length,
        totalAmount: processed.reduce((sum, item) => sum + parseFloat(item.amount), 0)
      });

      return {
        success: true,
        processed: processed.length,
        commissions: processed,
        message: `${processed.length} comisiones procesadas exitosamente`
      };

    } catch (error) {
      console.error('❌ Error procesando comisiones:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // MÉTODOS AUXILIARES
  // ===============================================

  generateDefaultTerms(agencyName) {
    return `Términos y Condiciones del Programa de Referidos - ${agencyName}

1. COMISIONES: Se pagará la comisión establecida por cada venta confirmada de clientes referidos.

2. PAGOS: Las comisiones se procesarán mensualmente, 30 días después de la confirmación de la venta.

3. VALIDEZ: Los referidos deben ser clientes nuevos que no hayan tenido transacciones previas con InterTravel.

4. SEGUIMIENTO: Se utilizará el código de referido único para rastrear las conversiones.

5. EXCLUSIONES: No se pagarán comisiones por cancelaciones o devoluciones.

6. MODIFICACIONES: InterTravel se reserva el derecho de modificar estos términos con 30 días de aviso.

Fecha de última actualización: ${new Date().toLocaleDateString('es-AR')}`;
  }

  async logReferralActivity(action, data) {
    try {
      await this.dbManager.query(`
        INSERT INTO activity_logs (
          action, resource_type, old_values, new_values, 
          severity, source, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        action,
        'referral',
        '{}',
        JSON.stringify(data),
        'info',
        'referral_engine',
        new Date()
      ]);
    } catch (error) {
      console.error('❌ Error logging referral activity:', error);
    }
  }

  // ===============================================
  // API ENDPOINTS PARA FRONTEND
  // ===============================================

  async getReferralProgramByAgency(agencyId) {
    try {
      const result = await this.dbManager.query(`
        SELECT rp.*, a.name as agency_name
        FROM referral_program rp
        JOIN agencies a ON rp.agency_id = a.id
        WHERE rp.agency_id = $1 AND rp.status = 'active'
      `, [agencyId]);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Programa de referidos no encontrado'
        };
      }

      return {
        success: true,
        program: result.rows[0]
      };

    } catch (error) {
      console.error('❌ Error obteniendo programa de referidos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateReferralCode(referralCode) {
    try {
      const result = await this.dbManager.query(`
        SELECT 
          rp.*,
          a.name as agency_name,
          a.status as agency_status
        FROM referral_program rp
        JOIN agencies a ON rp.agency_id = a.id
        WHERE rp.referral_code = $1
      `, [referralCode]);

      if (result.rows.length === 0) {
        return {
          valid: false,
          error: 'Código de referido no encontrado'
        };
      }

      const program = result.rows[0];

      if (program.status !== 'active') {
        return {
          valid: false,
          error: 'Código de referido inactivo'
        };
      }

      if (program.agency_status !== 'active') {
        return {
          valid: false,
          error: 'Agencia referente inactiva'
        };
      }

      if (program.valid_until && new Date(program.valid_until) < new Date()) {
        return {
          valid: false,
          error: 'Código de referido expirado'
        };
      }

      return {
        valid: true,
        program: program,
        agency: {
          id: program.agency_id,
          name: program.agency_name
        }
      };

    } catch (error) {
      console.error('❌ Error validando código de referido:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }
}

module.exports = ReferralEngine;