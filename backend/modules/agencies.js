// Agencies Manager - Gestión completa de agencias con PostgreSQL
// ==============================================================

const { dbManager } = require('../database');

class AgenciesManager {
  constructor() {
    this.defaultCommissionRate = 10.00;
    this.defaultCreditLimit = 0.00;
  }

  // ================================
  // GESTIÓN DE AGENCIAS
  // ================================

  async getAgencies(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        city,
        province,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = filters;

      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramCount = 0;

      // Filtros
      if (search) {
        paramCount++;
        whereConditions.push(`(
          a.name ILIKE $${paramCount} OR 
          a.business_name ILIKE $${paramCount} OR 
          a.code ILIKE $${paramCount} OR 
          a.contact_person ILIKE $${paramCount} OR
          a.email ILIKE $${paramCount}
        )`);
        queryParams.push(`%${search}%`);
      }

      if (status) {
        paramCount++;
        whereConditions.push(`a.status = $${paramCount}`);
        queryParams.push(status);
      }

      if (city) {
        paramCount++;
        whereConditions.push(`a.city ILIKE $${paramCount}`);
        queryParams.push(`%${city}%`);
      }

      if (province) {
        paramCount++;
        whereConditions.push(`a.province ILIKE $${paramCount}`);
        queryParams.push(`%${province}%`);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      // Query principal con estadísticas
      const agenciesResult = await dbManager.query(`
        SELECT 
          a.*,
          COUNT(u.id) as user_count,
          COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN u.last_login > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as recent_active_users,
          COALESCE(SUM(b.total_amount), 0) as total_bookings_amount,
          COUNT(b.id) as total_bookings,
          c.username as created_by_username,
          u_upd.username as updated_by_username
        FROM agencies a
        LEFT JOIN users u ON a.id = u.agency_id
        LEFT JOIN bookings b ON b.customer_email IN (
          SELECT email FROM users WHERE agency_id = a.id
        )
        LEFT JOIN users c ON a.created_by = c.id
        LEFT JOIN users u_upd ON a.updated_by = u_upd.id
        WHERE ${whereClause}
        GROUP BY a.id, c.username, u_upd.username
        ORDER BY a.${sort_by} ${sort_order}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, limit, offset]);

      // Count total
      const countResult = await dbManager.query(`
        SELECT COUNT(*) as total
        FROM agencies a
        WHERE ${whereClause}
      `, queryParams);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          agencies: agenciesResult.rows.map(agency => ({
            id: agency.id,
            code: agency.code,
            name: agency.name,
            businessName: agency.business_name,
            cuit: agency.cuit,
            address: agency.address,
            city: agency.city,
            province: agency.province,
            country: agency.country,
            phone: agency.phone,
            email: agency.email,
            contactPerson: agency.contact_person,
            commissionRate: parseFloat(agency.commission_rate),
            creditLimit: parseFloat(agency.credit_limit),
            currentBalance: parseFloat(agency.current_balance),
            status: agency.status,
            contractDate: agency.contract_date,
            notes: agency.notes,
            metadata: agency.metadata || {},
            stats: {
              userCount: parseInt(agency.user_count),
              activeUsers: parseInt(agency.active_users),
              recentActiveUsers: parseInt(agency.recent_active_users),
              totalBookingsAmount: parseFloat(agency.total_bookings_amount),
              totalBookings: parseInt(agency.total_bookings)
            },
            createdAt: agency.created_at,
            updatedAt: agency.updated_at,
            createdBy: agency.created_by_username,
            updatedBy: agency.updated_by_username
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
      };

    } catch (error) {
      console.error('❌ Error obteniendo agencias:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async getAgencyById(agencyId) {
    try {
      const result = await dbManager.query(`
        SELECT 
          a.*,
          COUNT(u.id) as user_count,
          COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users,
          COALESCE(SUM(b.total_amount), 0) as total_revenue,
          COUNT(b.id) as total_bookings,
          c.username as created_by_username,
          u_upd.username as updated_by_username
        FROM agencies a
        LEFT JOIN users u ON a.id = u.agency_id
        LEFT JOIN bookings b ON b.customer_email IN (
          SELECT email FROM users WHERE agency_id = a.id
        )
        LEFT JOIN users c ON a.created_by = c.id
        LEFT JOIN users u_upd ON a.updated_by = u_upd.id
        WHERE a.id = $1
        GROUP BY a.id, c.username, u_upd.username
      `, [agencyId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      const agency = result.rows[0];

      // Obtener usuarios de la agencia
      const usersResult = await dbManager.query(`
        SELECT 
          u.id, u.username, u.email, u.first_name, u.last_name,
          u.is_active, u.last_login, u.created_at,
          r.display_name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.agency_id = $1
        ORDER BY u.created_at DESC
      `, [agencyId]);

      // Obtener reservas recientes
      const bookingsResult = await dbManager.query(`
        SELECT 
          b.id, b.booking_reference, b.customer_name, b.total_amount,
          b.status, b.created_at, b.travel_date
        FROM bookings b
        WHERE b.customer_email IN (
          SELECT email FROM users WHERE agency_id = $1
        )
        ORDER BY b.created_at DESC
        LIMIT 10
      `, [agencyId]);

      return {
        success: true,
        agency: {
          id: agency.id,
          code: agency.code,
          name: agency.name,
          businessName: agency.business_name,
          cuit: agency.cuit,
          address: agency.address,
          city: agency.city,
          province: agency.province,
          country: agency.country,
          phone: agency.phone,
          email: agency.email,
          contactPerson: agency.contact_person,
          commissionRate: parseFloat(agency.commission_rate),
          creditLimit: parseFloat(agency.credit_limit),
          currentBalance: parseFloat(agency.current_balance),
          status: agency.status,
          contractDate: agency.contract_date,
          notes: agency.notes,
          metadata: agency.metadata || {},
          stats: {
            userCount: parseInt(agency.user_count),
            activeUsers: parseInt(agency.active_users),
            totalRevenue: parseFloat(agency.total_revenue),
            totalBookings: parseInt(agency.total_bookings)
          },
          users: usersResult.rows,
          recentBookings: bookingsResult.rows,
          createdAt: agency.created_at,
          updatedAt: agency.updated_at,
          createdBy: agency.created_by_username,
          updatedBy: agency.updated_by_username
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async createAgency(agencyData, createdBy = null) {
    try {
      const {
        code,
        name,
        businessName,
        cuit,
        address,
        city,
        province,
        country = 'Argentina',
        phone,
        email,
        contactPerson,
        commissionRate = this.defaultCommissionRate,
        creditLimit = this.defaultCreditLimit,
        status = 'pending',
        contractDate,
        notes
      } = agencyData;

      // Validaciones
      if (!code || !name || !email) {
        return { success: false, error: 'Código, nombre y email son requeridos' };
      }

      // Verificar código único
      const existingAgency = await dbManager.query(
        'SELECT id FROM agencies WHERE code = $1',
        [code]
      );

      if (existingAgency.rows.length > 0) {
        return { success: false, error: 'El código de agencia ya existe' };
      }

      // Verificar email único
      const existingEmail = await dbManager.query(
        'SELECT id FROM agencies WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return { success: false, error: 'El email ya está registrado' };
      }

      // Crear agencia
      const result = await dbManager.query(`
        INSERT INTO agencies (
          code, name, business_name, cuit, address, city, province, country,
          phone, email, contact_person, commission_rate, credit_limit,
          status, contract_date, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, code, name, created_at
      `, [
        code, name, businessName, cuit, address, city, province, country,
        phone, email, contactPerson, commissionRate, creditLimit,
        status, contractDate, notes, createdBy
      ]);

      const newAgency = result.rows[0];

      return {
        success: true,
        agency: {
          id: newAgency.id,
          code: newAgency.code,
          name: newAgency.name,
          createdAt: newAgency.created_at
        },
        message: 'Agencia creada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async updateAgency(agencyId, updateData, updatedBy = null) {
    try {
      const {
        name,
        businessName,
        cuit,
        address,
        city,
        province,
        country,
        phone,
        email,
        contactPerson,
        commissionRate,
        creditLimit,
        currentBalance,
        status,
        contractDate,
        notes
      } = updateData;

      // Verificar que la agencia existe
      const existingAgency = await dbManager.query('SELECT id FROM agencies WHERE id = $1', [agencyId]);
      if (existingAgency.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      // Si hay email, verificar que sea único
      if (email) {
        const emailCheck = await dbManager.query(
          'SELECT id FROM agencies WHERE email = $1 AND id != $2',
          [email, agencyId]
        );
        if (emailCheck.rows.length > 0) {
          return { success: false, error: 'Email ya está en uso' };
        }
      }

      // Construir query dinámico
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      if (name !== undefined) {
        paramCount++;
        updateFields.push(`name = $${paramCount}`);
        values.push(name);
      }

      if (businessName !== undefined) {
        paramCount++;
        updateFields.push(`business_name = $${paramCount}`);
        values.push(businessName);
      }

      if (cuit !== undefined) {
        paramCount++;
        updateFields.push(`cuit = $${paramCount}`);
        values.push(cuit);
      }

      if (address !== undefined) {
        paramCount++;
        updateFields.push(`address = $${paramCount}`);
        values.push(address);
      }

      if (city !== undefined) {
        paramCount++;
        updateFields.push(`city = $${paramCount}`);
        values.push(city);
      }

      if (province !== undefined) {
        paramCount++;
        updateFields.push(`province = $${paramCount}`);
        values.push(province);
      }

      if (country !== undefined) {
        paramCount++;
        updateFields.push(`country = $${paramCount}`);
        values.push(country);
      }

      if (phone !== undefined) {
        paramCount++;
        updateFields.push(`phone = $${paramCount}`);
        values.push(phone);
      }

      if (email !== undefined) {
        paramCount++;
        updateFields.push(`email = $${paramCount}`);
        values.push(email);
      }

      if (contactPerson !== undefined) {
        paramCount++;
        updateFields.push(`contact_person = $${paramCount}`);
        values.push(contactPerson);
      }

      if (commissionRate !== undefined) {
        paramCount++;
        updateFields.push(`commission_rate = $${paramCount}`);
        values.push(commissionRate);
      }

      if (creditLimit !== undefined) {
        paramCount++;
        updateFields.push(`credit_limit = $${paramCount}`);
        values.push(creditLimit);
      }

      if (currentBalance !== undefined) {
        paramCount++;
        updateFields.push(`current_balance = $${paramCount}`);
        values.push(currentBalance);
      }

      if (status !== undefined) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        values.push(status);
      }

      if (contractDate !== undefined) {
        paramCount++;
        updateFields.push(`contract_date = $${paramCount}`);
        values.push(contractDate);
      }

      if (notes !== undefined) {
        paramCount++;
        updateFields.push(`notes = $${paramCount}`);
        values.push(notes);
      }

      if (updatedBy) {
        paramCount++;
        updateFields.push(`updated_by = $${paramCount}`);
        values.push(updatedBy);
      }

      if (updateFields.length === 0) {
        return { success: false, error: 'No hay datos para actualizar' };
      }

      // Agregar timestamp y agencyId
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(agencyId);

      const result = await dbManager.query(`
        UPDATE agencies 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING id, code, name, updated_at
      `, values);

      const updatedAgency = result.rows[0];

      return {
        success: true,
        agency: updatedAgency,
        message: 'Agencia actualizada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async deleteAgency(agencyId, deletedBy = null) {
    try {
      // Verificar que la agencia existe
      const agencyCheck = await dbManager.query('SELECT code, name FROM agencies WHERE id = $1', [agencyId]);
      if (agencyCheck.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      const agency = agencyCheck.rows[0];

      // Verificar si tiene usuarios asociados
      const usersCheck = await dbManager.query('SELECT COUNT(*) as count FROM users WHERE agency_id = $1', [agencyId]);
      const userCount = parseInt(usersCheck.rows[0].count);

      if (userCount > 0) {
        return { 
          success: false, 
          error: `No se puede eliminar la agencia. Tiene ${userCount} usuario(s) asociado(s)` 
        };
      }

      // En lugar de eliminar, cambiar estado a 'deleted'
      await dbManager.query(`
        UPDATE agencies 
        SET status = 'deleted', updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [deletedBy, agencyId]);

      return {
        success: true,
        message: `Agencia ${agency.code} - ${agency.name} eliminada exitosamente`
      };

    } catch (error) {
      console.error('❌ Error eliminando agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async changeAgencyStatus(agencyId, newStatus, changedBy = null) {
    try {
      const validStatuses = ['pending', 'active', 'suspended', 'inactive', 'deleted'];
      
      if (!validStatuses.includes(newStatus)) {
        return { success: false, error: 'Estado inválido' };
      }

      // Verificar que la agencia existe
      const agencyCheck = await dbManager.query('SELECT code, name, status FROM agencies WHERE id = $1', [agencyId]);
      if (agencyCheck.rows.length === 0) {
        return { success: false, error: 'Agencia no encontrada' };
      }

      const agency = agencyCheck.rows[0];
      const oldStatus = agency.status;

      // Actualizar estado
      await dbManager.query(`
        UPDATE agencies 
        SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newStatus, changedBy, agencyId]);

      // Si se suspende o desactiva, desactivar usuarios
      if (['suspended', 'inactive', 'deleted'].includes(newStatus)) {
        await dbManager.query(`
          UPDATE users 
          SET is_active = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP
          WHERE agency_id = $2
        `, [changedBy, agencyId]);

        // Revocar sesiones activas
        await dbManager.query(`
          UPDATE user_sessions 
          SET is_active = false 
          WHERE user_id IN (SELECT id FROM users WHERE agency_id = $1)
        `, [agencyId]);
      }

      return {
        success: true,
        message: `Estado de agencia ${agency.code} cambiado de ${oldStatus} a ${newStatus}`
      };

    } catch (error) {
      console.error('❌ Error cambiando estado de agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // ESTADÍSTICAS Y REPORTES
  // ================================

  async getAgencyStats() {
    try {
      const result = await dbManager.query(`
        SELECT 
          COUNT(*) as total_agencies,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_agencies,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_agencies,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_agencies,
          COUNT(CASE WHEN created_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as new_this_month,
          AVG(commission_rate) as avg_commission_rate,
          SUM(current_balance) as total_balance,
          SUM(credit_limit) as total_credit_limit
        FROM agencies
        WHERE status != 'deleted'
      `);

      const statusStats = await dbManager.query(`
        SELECT status, COUNT(*) as count
        FROM agencies
        WHERE status != 'deleted'
        GROUP BY status
        ORDER BY count DESC
      `);

      const provinceStats = await dbManager.query(`
        SELECT province, COUNT(*) as count
        FROM agencies
        WHERE status = 'active'
        GROUP BY province
        ORDER BY count DESC
        LIMIT 10
      `);

      const topAgencies = await dbManager.query(`
        SELECT 
          a.id, a.code, a.name, a.city, a.province,
          COUNT(u.id) as user_count,
          COALESCE(SUM(b.total_amount), 0) as total_revenue
        FROM agencies a
        LEFT JOIN users u ON a.id = u.agency_id AND u.is_active = true
        LEFT JOIN bookings b ON b.customer_email IN (
          SELECT email FROM users WHERE agency_id = a.id
        )
        WHERE a.status = 'active'
        GROUP BY a.id, a.code, a.name, a.city, a.province
        ORDER BY total_revenue DESC
        LIMIT 10
      `);

      return {
        success: true,
        stats: {
          overview: result.rows[0],
          byStatus: statusStats.rows,
          byProvince: provinceStats.rows,
          topAgencies: topAgencies.rows
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de agencias:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async getAgencyFinancials(agencyId, filters = {}) {
    try {
      const {
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = filters;

      let whereConditions = ['b.customer_email IN (SELECT email FROM users WHERE agency_id = $1)'];
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

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      // Obtener transacciones
      const transactionsResult = await dbManager.query(`
        SELECT 
          b.id, b.booking_reference, b.customer_name, b.customer_email,
          b.total_amount, b.currency, b.status, b.payment_status,
          b.created_at, b.travel_date,
          (b.total_amount * a.commission_rate / 100) as commission_amount
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        JOIN agencies a ON u.agency_id = a.id
        WHERE ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, limit, offset]);

      // Resumen financiero
      const summaryResult = await dbManager.query(`
        SELECT 
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(b.total_amount), 0) as total_revenue,
          COALESCE(SUM(b.total_amount * a.commission_rate / 100), 0) as total_commission,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN b.payment_status = 'paid' THEN 1 END) as paid_bookings
        FROM bookings b
        JOIN users u ON b.customer_email = u.email
        JOIN agencies a ON u.agency_id = a.id
        WHERE ${whereClause}
      `, queryParams);

      const summary = summaryResult.rows[0];

      return {
        success: true,
        data: {
          transactions: transactionsResult.rows,
          summary: {
            totalBookings: parseInt(summary.total_bookings),
            totalRevenue: parseFloat(summary.total_revenue),
            totalCommission: parseFloat(summary.total_commission),
            confirmedBookings: parseInt(summary.confirmed_bookings),
            paidBookings: parseInt(summary.paid_bookings),
            conversionRate: summary.total_bookings > 0 ? 
              (summary.confirmed_bookings / summary.total_bookings * 100).toFixed(2) : 0
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo financials de agencia:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // UTILIDADES
  // ================================

  async generateAgencyCode(baseName) {
    try {
      // Generar código basado en el nombre
      const cleanName = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const baseCode = cleanName.substring(0, 6);
      
      let code = baseCode;
      let counter = 1;

      // Verificar si existe y generar uno único
      while (true) {
        const existing = await dbManager.query('SELECT id FROM agencies WHERE code = $1', [code]);
        if (existing.rows.length === 0) {
          break;
        }
        
        counter++;
        code = `${baseCode}${counter.toString().padStart(2, '0')}`;
        
        if (counter > 99) {
          // Fallback si hay muchas agencias con el mismo nombre
          code = `AG${Date.now().toString().slice(-6)}`;
          break;
        }
      }

      return { success: true, code };

    } catch (error) {
      console.error('❌ Error generando código de agencia:', error);
      return { success: false, error: 'Error generando código' };
    }
  }

  async getAvailableProvinces() {
    try {
      const result = await dbManager.query(`
        SELECT DISTINCT province
        FROM agencies
        WHERE province IS NOT NULL AND province != ''
        ORDER BY province
      `);

      return {
        success: true,
        provinces: result.rows.map(row => row.province)
      };

    } catch (error) {
      console.error('❌ Error obteniendo provincias:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async bulkUpdateCommissionRates(updates, updatedBy = null) {
    try {
      const client = await dbManager.getClient();
      
      try {
        await client.query('BEGIN');

        for (const update of updates) {
          const { agencyId, commissionRate } = update;
          
          await client.query(`
            UPDATE agencies 
            SET commission_rate = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [commissionRate, updatedBy, agencyId]);
        }

        await client.query('COMMIT');

        return {
          success: true,
          message: `${updates.length} agencia(s) actualizada(s) exitosamente`
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('❌ Error en actualización masiva:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}

module.exports = new AgenciesManager();
