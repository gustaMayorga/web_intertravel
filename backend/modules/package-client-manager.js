// Package-Client Relationship Manager
// Gestión completa de la relación entre paquetes y clientes
const { query } = require('../database');

class PackageClientManager {
  
  // ==========================================
  // 1. ASIGNACIÓN DE PAQUETES A CLIENTES
  // ==========================================

  /**
   * Asignar un paquete a un cliente específico
   * @param {Object} assignmentData - Datos de la asignación
   * @returns {Object} Resultado de la operación
   */
  static async assignPackageToClient(assignmentData) {
    try {
      const {
        package_id,
        customer_id,
        customer_email,
        customer_name,
        customer_phone,
        assigned_by_user_id,
        assignment_type = 'manual', // 'manual', 'automatic', 'recommendation'
        priority_level = 'medium', // 'low', 'medium', 'high', 'urgent'
        notes = '',
        follow_up_date,
        metadata = {}
      } = assignmentData;

      // Verificar que el paquete existe
      const packageCheck = await query(
        'SELECT id, title, price_amount FROM packages WHERE id = $1 OR package_id = $1',
        [package_id]
      );

      if (packageCheck.rows.length === 0) {
        return { success: false, error: 'Package not found' };
      }

      const packageInfo = packageCheck.rows[0];

      // Crear o actualizar cliente si no existe
      let clientId = customer_id;
      if (!clientId && customer_email) {
        const clientResult = await this.createOrUpdateClient({
          email: customer_email,
          name: customer_name,
          phone: customer_phone
        });
        if (clientResult.success) {
          clientId = clientResult.client.id;
        }
      }

      // Verificar si ya existe una asignación activa
      const existingAssignment = await query(`
        SELECT id, status FROM package_client_assignments 
        WHERE package_id = $1 AND customer_id = $2 AND status IN ('active', 'pending')
      `, [packageInfo.id, clientId]);

      if (existingAssignment.rows.length > 0) {
        return { 
          success: false, 
          error: 'Package already assigned to this client',
          assignment: existingAssignment.rows[0]
        };
      }

      // Crear nueva asignación
      const assignment = await query(`
        INSERT INTO package_client_assignments (
          package_id, customer_id, customer_email, customer_name, customer_phone,
          assigned_by_user_id, assignment_type, priority_level, notes,
          follow_up_date, metadata, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
        RETURNING *
      `, [
        packageInfo.id,
        clientId,
        customer_email,
        customer_name,
        customer_phone,
        assigned_by_user_id,
        assignment_type,
        priority_level,
        notes,
        follow_up_date,
        JSON.stringify(metadata)
      ]);

      // Registrar actividad
      await this.logAssignmentActivity({
        assignment_id: assignment.rows[0].id,
        action: 'assigned',
        description: `Package "${packageInfo.title}" assigned to ${customer_name || customer_email}`,
        user_id: assigned_by_user_id
      });

      return {
        success: true,
        assignment: assignment.rows[0],
        package: packageInfo
      };

    } catch (error) {
      console.error('Error assigning package to client:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 2. GESTIÓN DE CLIENTES
  // ==========================================

  /**
   * Crear o actualizar un cliente
   */
  static async createOrUpdateClient(clientData) {
    try {
      const { email, name, phone, preferences = {}, metadata = {} } = clientData;

      // Buscar cliente existente por email
      let existingClient = await query(
        'SELECT * FROM customers WHERE email = $1',
        [email]
      );

      if (existingClient.rows.length > 0) {
        // Actualizar cliente existente
        const client = await query(`
          UPDATE customers 
          SET name = $1, phone = $2, preferences = $3, metadata = $4, updated_at = CURRENT_TIMESTAMP
          WHERE email = $5
          RETURNING *
        `, [name, phone, JSON.stringify(preferences), JSON.stringify(metadata), email]);

        return { success: true, client: client.rows[0], created: false };
      } else {
        // Crear nuevo cliente
        const client = await query(`
          INSERT INTO customers (email, name, phone, preferences, metadata)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [email, name, phone, JSON.stringify(preferences), JSON.stringify(metadata)]);

        return { success: true, client: client.rows[0], created: true };
      }

    } catch (error) {
      console.error('Error creating/updating client:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 3. CONSULTA DE ASIGNACIONES
  // ==========================================

  /**
   * Obtener todas las asignaciones con filtros
   */
  static async getAssignments(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority_level,
        assignment_type,
        package_id,
        customer_id,
        assigned_by_user_id,
        follow_up_date_from,
        follow_up_date_to,
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = filters;

      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      // Construir condiciones WHERE
      if (status) {
        paramCount++;
        whereConditions.push(`pca.status = $${paramCount}`);
        params.push(status);
      }

      if (priority_level) {
        paramCount++;
        whereConditions.push(`pca.priority_level = $${paramCount}`);
        params.push(priority_level);
      }

      if (assignment_type) {
        paramCount++;
        whereConditions.push(`pca.assignment_type = $${paramCount}`);
        params.push(assignment_type);
      }

      if (package_id) {
        paramCount++;
        whereConditions.push(`pca.package_id = $${paramCount}`);
        params.push(package_id);
      }

      if (customer_id) {
        paramCount++;
        whereConditions.push(`pca.customer_id = $${paramCount}`);
        params.push(customer_id);
      }

      if (assigned_by_user_id) {
        paramCount++;
        whereConditions.push(`pca.assigned_by_user_id = $${paramCount}`);
        params.push(assigned_by_user_id);
      }

      if (search) {
        paramCount++;
        whereConditions.push(`(
          pca.customer_name ILIKE $${paramCount} OR 
          pca.customer_email ILIKE $${paramCount} OR
          p.title ILIKE $${paramCount} OR
          p.destination ILIKE $${paramCount}
        )`);
        params.push(`%${search}%`);
      }

      if (follow_up_date_from) {
        paramCount++;
        whereConditions.push(`pca.follow_up_date >= $${paramCount}`);
        params.push(follow_up_date_from);
      }

      if (follow_up_date_to) {
        paramCount++;
        whereConditions.push(`pca.follow_up_date <= $${paramCount}`);
        params.push(follow_up_date_to);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM package_client_assignments pca
        LEFT JOIN packages p ON pca.package_id = p.id
        LEFT JOIN customers c ON pca.customer_id = c.id
        ${whereClause}
      `;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Obtener resultados paginados
      const offset = (page - 1) * limit;
      paramCount++;
      params.push(limit);
      paramCount++;
      params.push(offset);

      const assignmentsQuery = `
        SELECT 
          pca.*,
          p.title as package_title,
          p.destination as package_destination,
          p.country as package_country,
          p.price_amount as package_price,
          p.price_currency as package_currency,
          c.name as customer_full_name,
          c.preferences as customer_preferences,
          u.name as assigned_by_name
        FROM package_client_assignments pca
        LEFT JOIN packages p ON pca.package_id = p.id
        LEFT JOIN customers c ON pca.customer_id = c.id
        LEFT JOIN users u ON pca.assigned_by_user_id = u.id
        ${whereClause}
        ORDER BY pca.${sortBy} ${sortOrder}
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      const assignmentsResult = await query(assignmentsQuery, params);

      return {
        success: true,
        data: {
          assignments: assignmentsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('Error getting assignments:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener asignaciones de un cliente específico
   */
  static async getClientAssignments(customerId) {
    try {
      const result = await query(`
        SELECT 
          pca.*,
          p.title as package_title,
          p.destination as package_destination,
          p.price_amount as package_price,
          p.price_currency as package_currency,
          p.images as package_images
        FROM package_client_assignments pca
        LEFT JOIN packages p ON pca.package_id = p.id
        WHERE pca.customer_id = $1 OR pca.customer_email = $1
        ORDER BY pca.created_at DESC
      `, [customerId]);

      return { success: true, assignments: result.rows };

    } catch (error) {
      console.error('Error getting client assignments:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener clientes asignados a un paquete específico
   */
  static async getPackageClients(packageId) {
    try {
      const result = await query(`
        SELECT 
          pca.*,
          c.name as customer_full_name,
          c.preferences as customer_preferences,
          c.created_at as customer_since
        FROM package_client_assignments pca
        LEFT JOIN customers c ON pca.customer_id = c.id
        WHERE pca.package_id = $1
        ORDER BY pca.priority_level DESC, pca.created_at DESC
      `, [packageId]);

      return { success: true, clients: result.rows };

    } catch (error) {
      console.error('Error getting package clients:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 4. ACTUALIZACIÓN DE ASIGNACIONES
  // ==========================================

  /**
   * Actualizar estado de una asignación
   */
  static async updateAssignmentStatus(assignmentId, newStatus, userId, notes = '') {
    try {
      const validStatuses = ['pending', 'active', 'contacted', 'interested', 'booked', 'cancelled', 'completed'];
      
      if (!validStatuses.includes(newStatus)) {
        return { success: false, error: 'Invalid status' };
      }

      const result = await query(`
        UPDATE package_client_assignments 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [newStatus, assignmentId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Assignment not found' };
      }

      // Registrar actividad
      await this.logAssignmentActivity({
        assignment_id: assignmentId,
        action: 'status_changed',
        description: `Status changed to ${newStatus}${notes ? `: ${notes}` : ''}`,
        user_id: userId
      });

      return { success: true, assignment: result.rows[0] };

    } catch (error) {
      console.error('Error updating assignment status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Programar seguimiento
   */
  static async scheduleFollowUp(assignmentId, followUpDate, notes, userId) {
    try {
      const result = await query(`
        UPDATE package_client_assignments 
        SET follow_up_date = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [followUpDate, notes, assignmentId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Assignment not found' };
      }

      // Registrar actividad
      await this.logAssignmentActivity({
        assignment_id: assignmentId,
        action: 'follow_up_scheduled',
        description: `Follow-up scheduled for ${followUpDate}${notes ? `: ${notes}` : ''}`,
        user_id: userId
      });

      return { success: true, assignment: result.rows[0] };

    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 5. CONVERSIÓN A BOOKING
  // ==========================================

  /**
   * Convertir asignación a booking real
   */
  static async convertToBooking(assignmentId, bookingData, userId) {
    try {
      // Obtener datos de la asignación
      const assignmentResult = await query(`
        SELECT pca.*, p.title, p.price_amount, p.price_currency
        FROM package_client_assignments pca
        LEFT JOIN packages p ON pca.package_id = p.id
        WHERE pca.id = $1
      `, [assignmentId]);

      if (assignmentResult.rows.length === 0) {
        return { success: false, error: 'Assignment not found' };
      }

      const assignment = assignmentResult.rows[0];

      // Crear booking usando BookingsManager
      const BookingsManager = require('./bookings');
      
      const bookingPayload = {
        package_id: assignment.package_id,
        package_title: assignment.title,
        package_source: 'assignment',
        customer_name: assignment.customer_name,
        customer_email: assignment.customer_email,
        customer_phone: assignment.customer_phone,
        total_amount: bookingData.total_amount || assignment.price_amount,
        currency: bookingData.currency || assignment.price_currency,
        travel_date: bookingData.travel_date,
        return_date: bookingData.return_date,
        travelers_count: bookingData.travelers_count || 1,
        special_requests: bookingData.special_requests,
        source: 'assignment_conversion',
        metadata: {
          assignment_id: assignmentId,
          converted_by: userId,
          original_assignment_data: assignment
        }
      };

      const bookingResult = await BookingsManager.createBooking(bookingPayload);

      if (!bookingResult.success) {
        return { success: false, error: 'Failed to create booking: ' + bookingResult.error };
      }

      // Actualizar asignación a "booked"
      await this.updateAssignmentStatus(assignmentId, 'booked', userId, 'Converted to booking');

      // Registrar actividad
      await this.logAssignmentActivity({
        assignment_id: assignmentId,
        action: 'converted_to_booking',
        description: `Assignment converted to booking: ${bookingResult.booking.booking_reference}`,
        user_id: userId,
        metadata: { booking_id: bookingResult.booking.id }
      });

      return {
        success: true,
        booking: bookingResult.booking,
        assignment: assignment
      };

    } catch (error) {
      console.error('Error converting assignment to booking:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 6. SISTEMA DE ACTIVIDADES
  // ==========================================

  /**
   * Registrar actividad en una asignación
   */
  static async logAssignmentActivity(activityData) {
    try {
      const {
        assignment_id,
        action,
        description,
        user_id,
        metadata = {}
      } = activityData;

      await query(`
        INSERT INTO assignment_activities (
          assignment_id, action, description, user_id, metadata
        ) VALUES ($1, $2, $3, $4, $5)
      `, [assignment_id, action, description, user_id, JSON.stringify(metadata)]);

      return { success: true };

    } catch (error) {
      console.error('Error logging assignment activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener historial de actividades de una asignación
   */
  static async getAssignmentActivities(assignmentId) {
    try {
      const result = await query(`
        SELECT 
          aa.*,
          u.name as user_name
        FROM assignment_activities aa
        LEFT JOIN users u ON aa.user_id = u.id
        WHERE aa.assignment_id = $1
        ORDER BY aa.created_at DESC
      `, [assignmentId]);

      return { success: true, activities: result.rows };

    } catch (error) {
      console.error('Error getting assignment activities:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 7. ANALYTICS Y ESTADÍSTICAS
  // ==========================================

  /**
   * Obtener estadísticas de asignaciones
   */
  static async getAssignmentStats(dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      
      let dateFilter = '';
      let params = [];
      if (startDate && endDate) {
        dateFilter = 'WHERE pca.created_at BETWEEN $1 AND $2';
        params = [startDate, endDate];
      }

      // Estadísticas generales
      const generalStats = await query(`
        SELECT 
          COUNT(*) as total_assignments,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'booked' THEN 1 END) as booked,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          AVG(CASE WHEN status = 'booked' THEN 1.0 ELSE 0.0 END) * 100 as conversion_rate
        FROM package_client_assignments pca
        ${dateFilter}
      `, params);

      // Por prioridad
      const priorityStats = await query(`
        SELECT 
          priority_level,
          COUNT(*) as count,
          AVG(CASE WHEN status = 'booked' THEN 1.0 ELSE 0.0 END) * 100 as conversion_rate
        FROM package_client_assignments pca
        ${dateFilter}
        GROUP BY priority_level
        ORDER BY 
          CASE priority_level 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END
      `, params);

      // Por tipo de asignación
      const typeStats = await query(`
        SELECT 
          assignment_type,
          COUNT(*) as count,
          AVG(CASE WHEN status = 'booked' THEN 1.0 ELSE 0.0 END) * 100 as conversion_rate
        FROM package_client_assignments pca
        ${dateFilter}
        GROUP BY assignment_type
        ORDER BY count DESC
      `, params);

      return {
        success: true,
        stats: {
          general: generalStats.rows[0],
          byPriority: priorityStats.rows,
          byType: typeStats.rows
        }
      };

    } catch (error) {
      console.error('Error getting assignment stats:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 8. RECOMENDACIONES INTELIGENTES
  // ==========================================

  /**
   * Recomendar paquetes para un cliente basado en su historial
   */
  static async recommendPackagesForClient(customerId, limit = 5) {
    try {
      // Obtener historial del cliente
      const clientHistory = await query(`
        SELECT p.destination, p.country, p.category, pca.status
        FROM package_client_assignments pca
        LEFT JOIN packages p ON pca.package_id = p.id
        WHERE pca.customer_id = $1
      `, [customerId]);

      if (clientHistory.rows.length === 0) {
        // Si no hay historial, recomendar paquetes populares
        const popularPackages = await query(`
          SELECT p.*, COUNT(pca.id) as assignment_count
          FROM packages p
          LEFT JOIN package_client_assignments pca ON p.id = pca.package_id
          WHERE p.status = 'active'
          GROUP BY p.id
          ORDER BY assignment_count DESC, p.rating_average DESC
          LIMIT $1
        `, [limit]);

        return { success: true, recommendations: popularPackages.rows, reason: 'popular' };
      }

      // Analizar preferencias del cliente
      const destinations = clientHistory.rows.map(h => h.destination).filter(Boolean);
      const categories = clientHistory.rows.map(h => h.category).filter(Boolean);
      const countries = clientHistory.rows.map(h => h.country).filter(Boolean);

      // Recomendar paquetes similares que no haya visto
      const recommendations = await query(`
        SELECT DISTINCT p.*, 
          CASE 
            WHEN p.destination = ANY($1) THEN 3
            WHEN p.category = ANY($2) THEN 2  
            WHEN p.country = ANY($3) THEN 1
            ELSE 0
          END as relevance_score
        FROM packages p
        WHERE p.status = 'active'
        AND p.id NOT IN (
          SELECT DISTINCT package_id 
          FROM package_client_assignments 
          WHERE customer_id = $4
        )
        ORDER BY relevance_score DESC, p.rating_average DESC
        LIMIT $5
      `, [destinations, categories, countries, customerId, limit]);

      return { success: true, recommendations: recommendations.rows, reason: 'preference_based' };

    } catch (error) {
      console.error('Error getting package recommendations:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PackageClientManager;
