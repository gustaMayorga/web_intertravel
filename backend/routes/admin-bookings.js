// ===============================================
// ADMIN BOOKINGS - VERSIÓN REPARADA CON BASE DE DATOS REAL
// ===============================================

const express = require('express');
const router = express.Router();

// Importar database connection
const { query } = require('../database');

// ===============================================
// CRUD COMPLETO DE RESERVAS - DATOS REALES
// ===============================================

/**
 * GET /api/admin/bookings
 * Obtener lista de reservas con paginación y filtros avanzados
 */
router.get('/bookings', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      paymentStatus = '',
      source = '',
      startDate = '',
      endDate = '',
      sortBy = 'created_at', 
      sortOrder = 'desc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construir WHERE clause dinámicamente
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // Filtro de búsqueda
    if (search && search.trim() !== '') {
      whereClause += ` AND (
        customer_name ILIKE $${params.length + 1} OR 
        customer_email ILIKE $${params.length + 2} OR 
        booking_reference ILIKE $${params.length + 3} OR
        destination ILIKE $${params.length + 4} OR
        package_title ILIKE $${params.length + 5}
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Filtro de estado
    if (status && status !== 'all') {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }
    
    // Filtro de estado de pago
    if (paymentStatus && paymentStatus !== 'all') {
      whereClause += ` AND payment_status = $${params.length + 1}`;
      params.push(paymentStatus);
    }
    
    // Filtro de fuente
    if (source && source !== 'all') {
      whereClause += ` AND source = $${params.length + 1}`;
      params.push(source);
    }
    
    // Filtro de fecha de inicio
    if (startDate) {
      whereClause += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    // Filtro de fecha de fin
    if (endDate) {
      whereClause += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    // Validar sortBy para evitar SQL injection
    const validSortColumns = ['created_at', 'customer_name', 'destination', 'total_amount', 'travel_date', 'status'];
    const validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Obtener total de registros
    const countResult = await query(`
      SELECT COUNT(*) as total FROM bookings ${whereClause}
    `, params);
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener reservas paginadas
    const bookingsResult = await query(`
      SELECT 
        id,
        booking_reference,
        package_id,
        package_title,
        package_source,
        destination,
        country,
        customer_name,
        customer_email,
        customer_phone,
        travelers_count,
        travel_date,
        return_date,
        duration_days,
        total_amount,
        paid_amount,
        currency,
        status,
        payment_status,
        payment_method,
        special_requests,
        source,
        metadata,
        created_at,
        updated_at,
        confirmed_at,
        cancelled_at
      FROM bookings 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    // Formatear datos para el frontend
    const bookings = bookingsResult.rows.map(booking => ({
      id: booking.id,
      bookingReference: booking.booking_reference,
      packageId: booking.package_id,
      packageTitle: booking.package_title,
      packageSource: booking.package_source,
      destination: booking.destination,
      country: booking.country,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone || '',
      travelersCount: booking.travelers_count,
      travelDate: booking.travel_date,
      returnDate: booking.return_date,
      durationDays: booking.duration_days,
      totalAmount: parseFloat(booking.total_amount || 0),
      paidAmount: parseFloat(booking.paid_amount || 0),
      currency: booking.currency,
      status: booking.status,
      paymentStatus: booking.payment_status,
      paymentMethod: booking.payment_method || '',
      specialRequests: booking.special_requests || '',
      source: booking.source,
      services: booking.metadata ? JSON.parse(booking.metadata).services || [] : [],
      images: booking.metadata ? JSON.parse(booking.metadata).images || [] : [],
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      confirmedAt: booking.confirmed_at,
      cancelledAt: booking.cancelled_at
    }));
    
    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit),
          hasNext: (page * limit) < total,
          hasPrev: page > 1
        }
      },
      filters: {
        search,
        status,
        paymentStatus,
        source,
        startDate,
        endDate,
        sortBy: validSortBy,
        sortOrder: validSortOrder
      },
      source: 'database',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/admin/bookings/manual
 * Crear nueva reserva manual desde el admin
 */
router.post('/bookings/manual', async (req, res) => {
  try {
    const {
      package_id,
      package_title,
      package_source = 'manual',
      destination,
      country,
      customer_name,
      customer_email,
      customer_phone,
      travelers_count = 1,
      travel_date,
      return_date,
      duration_days,
      total_amount,
      currency = 'USD',
      special_requests,
      payment_method = 'manual',
      payment_status = 'pending',
      status = 'pending',
      create_client_if_not_exists = true
    } = req.body;
    
    // Validaciones obligatorias
    if (!package_title || !destination || !customer_name || !customer_email || !total_amount) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        required: ['package_title', 'destination', 'customer_name', 'customer_email', 'total_amount']
      });
    }
    
    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido'
      });
    }
    
    // Validar fechas
    if (travel_date && isNaN(Date.parse(travel_date))) {
      return res.status(400).json({
        success: false,
        error: 'Fecha de viaje inválida'
      });
    }
    
    // Generar booking reference único
    const bookingRef = `BK${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Verificar si el cliente existe, crear si es necesario
    let clientExists = false;
    if (create_client_if_not_exists) {
      const existingClient = await query(
        'SELECT id FROM users WHERE email = $1',
        [customer_email.toLowerCase()]
      );
      
      if (existingClient.rows.length === 0) {
        // Crear cliente automáticamente
        const nameParts = customer_name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        try {
          await query(`
            INSERT INTO users (
              first_name, last_name, email, phone, username, role, 
              is_active, created_at, full_name
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            firstName,
            lastName,
            customer_email.toLowerCase(),
            customer_phone,
            customer_email.toLowerCase(),
            'user',
            true,
            new Date(),
            customer_name
          ]);
          
          console.log('✅ Cliente creado automáticamente:', customer_email);
        } catch (createError) {
          console.warn('⚠️ Error creando cliente automático:', createError.message);
        }
      } else {
        clientExists = true;
      }
    }
    
    // Crear la reserva
    const result = await query(`
      INSERT INTO bookings (
        booking_reference, package_id, package_title, package_source,
        destination, country, customer_name, customer_email, customer_phone,
        travelers_count, travel_date, return_date, duration_days,
        total_amount, paid_amount, currency, status, payment_status, 
        payment_method, special_requests, source, created_at, updated_at,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `, [
      bookingRef,
      package_id || `manual_${Date.now()}`,
      package_title,
      package_source,
      destination,
      country || 'No especificado',
      customer_name,
      customer_email.toLowerCase(),
      customer_phone,
      travelers_count,
      travel_date ? new Date(travel_date) : null,
      return_date ? new Date(return_date) : null,
      duration_days || null,
      total_amount,
      0, // paid_amount inicial
      currency,
      status,
      payment_status,
      payment_method,
      special_requests,
      'admin',
      new Date(),
      new Date(),
      JSON.stringify({ services: [], images: [], created_by: 'admin' })
    ]);
    
    const newBooking = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        booking: {
          id: newBooking.id,
          bookingReference: newBooking.booking_reference,
          packageTitle: newBooking.package_title,
          destination: newBooking.destination,
          customerName: newBooking.customer_name,
          customerEmail: newBooking.customer_email,
          totalAmount: parseFloat(newBooking.total_amount),
          currency: newBooking.currency,
          status: newBooking.status,
          paymentStatus: newBooking.payment_status,
          createdAt: newBooking.created_at
        },
        client: {
          existed: clientExists,
          created: !clientExists && create_client_if_not_exists
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/bookings/:id
 * Obtener reserva específica
 */
router.get('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT * FROM bookings WHERE id = $1 OR booking_reference = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }
    
    const booking = result.rows[0];
    const metadata = booking.metadata ? JSON.parse(booking.metadata) : {};
    
    res.json({
      success: true,
      booking: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        packageId: booking.package_id,
        packageTitle: booking.package_title,
        packageSource: booking.package_source,
        destination: booking.destination,
        country: booking.country,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        travelersCount: booking.travelers_count,
        travelDate: booking.travel_date,
        returnDate: booking.return_date,
        durationDays: booking.duration_days,
        totalAmount: parseFloat(booking.total_amount || 0),
        paidAmount: parseFloat(booking.paid_amount || 0),
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.payment_status,
        paymentMethod: booking.payment_method,
        specialRequests: booking.special_requests,
        source: booking.source,
        services: metadata.services || [],
        images: metadata.images || [],
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
        confirmedAt: booking.confirmed_at,
        cancelledAt: booking.cancelled_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id/status
 * Actualizar estado de reserva
 */
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validar estado
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido',
        validStatuses
      });
    }
    
    // Verificar que la reserva existe
    const existingBooking = await query(
      'SELECT id, status, booking_reference FROM bookings WHERE id = $1 OR booking_reference = $1',
      [id]
    );
    
    if (existingBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }
    
    // Actualizar estado
    const updateFields = ['status = $1', 'updated_at = $2'];
    const updateParams = [status, new Date()];
    
    // Agregar timestamp específico según el estado
    if (status === 'confirmed' && existingBooking.rows[0].status !== 'confirmed') {
      updateFields.push('confirmed_at = $3');
      updateParams.push(new Date());
    } else if (status === 'cancelled' && existingBooking.rows[0].status !== 'cancelled') {
      updateFields.push('cancelled_at = $3');
      updateParams.push(new Date());
    }
    
    const result = await query(`
      UPDATE bookings 
      SET ${updateFields.join(', ')}
      WHERE id = $${updateParams.length + 1}
      RETURNING *
    `, [...updateParams, existingBooking.rows[0].id]);
    
    const updatedBooking = result.rows[0];
    
    res.json({
      success: true,
      message: `Estado actualizado a ${status}`,
      data: {
        id: updatedBooking.id,
        bookingReference: updatedBooking.booking_reference,
        status: updatedBooking.status,
        updatedAt: updatedBooking.updated_at,
        confirmedAt: updatedBooking.confirmed_at,
        cancelledAt: updatedBooking.cancelled_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id/payment
 * Actualizar estado de pago
 */
router.patch('/bookings/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status, paid_amount, payment_method } = req.body;
    
    // Validar estado de pago
    const validPaymentStatuses = ['pending', 'paid', 'partial', 'refunded', 'failed'];
    if (!validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado de pago inválido',
        validPaymentStatuses
      });
    }
    
    // Verificar que la reserva existe
    const existingBooking = await query(
      'SELECT id, total_amount FROM bookings WHERE id = $1 OR booking_reference = $1',
      [id]
    );
    
    if (existingBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }
    
    const totalAmount = parseFloat(existingBooking.rows[0].total_amount);
    
    // Validar monto pagado
    if (paid_amount !== undefined) {
      const paidAmountNum = parseFloat(paid_amount);
      if (isNaN(paidAmountNum) || paidAmountNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Monto pagado inválido'
        });
      }
      
      if (paidAmountNum > totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'El monto pagado no puede ser mayor al total'
        });
      }
    }
    
    // Construir query de actualización
    const updateFields = ['payment_status = $1', 'updated_at = $2'];
    const updateParams = [payment_status, new Date()];
    
    if (paid_amount !== undefined) {
      updateFields.push(`paid_amount = $${updateParams.length + 1}`);
      updateParams.push(parseFloat(paid_amount));
    }
    
    if (payment_method) {
      updateFields.push(`payment_method = $${updateParams.length + 1}`);
      updateParams.push(payment_method);
    }
    
    const result = await query(`
      UPDATE bookings 
      SET ${updateFields.join(', ')}
      WHERE id = $${updateParams.length + 1}
      RETURNING *
    `, [...updateParams, existingBooking.rows[0].id]);
    
    const updatedBooking = result.rows[0];
    
    res.json({
      success: true,
      message: 'Estado de pago actualizado exitosamente',
      data: {
        id: updatedBooking.id,
        bookingReference: updatedBooking.booking_reference,
        paymentStatus: updatedBooking.payment_status,
        paidAmount: parseFloat(updatedBooking.paid_amount || 0),
        totalAmount: parseFloat(updatedBooking.total_amount),
        paymentMethod: updatedBooking.payment_method,
        updatedAt: updatedBooking.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/bookings/:id
 * Cancelar/Eliminar reserva
 */
router.delete('/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Verificar que la reserva existe
    const existingBooking = await query(
      'SELECT * FROM bookings WHERE id = $1 OR booking_reference = $1',
      [id]
    );
    
    if (existingBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }
    
    const booking = existingBooking.rows[0];
    
    // No permitir eliminar reservas ya completadas
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una reserva completada'
      });
    }
    
    // Cancelar la reserva (soft delete)
    const result = await query(`
      UPDATE bookings 
      SET 
        status = 'cancelled',
        cancelled_at = $1,
        updated_at = $2,
        special_requests = COALESCE(special_requests, '') || $3
      WHERE id = $4
      RETURNING *
    `, [
      new Date(),
      new Date(),
      reason ? `\n[CANCELADA: ${reason}]` : '\n[CANCELADA POR ADMIN]',
      booking.id
    ]);
    
    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      data: {
        id: result.rows[0].id,
        bookingReference: result.rows[0].booking_reference,
        status: result.rows[0].status,
        cancelledAt: result.rows[0].cancelled_at,
        reason: reason || 'Sin motivo especificado'
      }
    });
    
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;