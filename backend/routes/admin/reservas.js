// ===============================================
// CONTROLADOR DE RESERVAS - INTERTRAVEL ADMIN
// Funcionalidades completas CRUD + Tracking + Pagos
// ===============================================

const express = require('express');
const router = express.Router();
const { query } = require('../../database');
const { v4: uuidv4 } = require('crypto').randomUUID || require('uuid').v4;

// ===============================================
// 📋 LISTAR RESERVAS CON FILTROS
// ===============================================
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      payment_status = 'all',
      date_from = '',
      date_to = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Filtro de búsqueda
    if (search) {
      whereConditions.push(`(
        booking_reference ILIKE $${paramIndex} OR 
        customer_name ILIKE $${paramIndex} OR 
        customer_email ILIKE $${paramIndex} OR
        package_id ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro de estado
    if (status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Filtro de estado de pago
    if (payment_status !== 'all') {
      whereConditions.push(`payment_status = $${paramIndex}`);
      queryParams.push(payment_status);
      paramIndex++;
    }

    // Filtro de fechas
    if (date_from) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      queryParams.push(date_to + ' 23:59:59');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    // Consulta principal de reservas
    const reservasQuery = `
      SELECT 
        id,
        booking_reference,
        package_id,
        customer_name,
        customer_email,
        customer_phone,
        travelers_count,
        total_amount,
        currency,
        status,
        travel_date,
        special_requests,
        payment_status,
        payment_method,
        source,
        created_at,
        updated_at,
        confirmed_at,
        cancelled_at
      FROM bookings
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await query(reservasQuery, queryParams);

    // Contar total para paginación
    const countQuery = `SELECT COUNT(*) as total FROM bookings ${whereClause}`;
    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const totalReservas = parseInt(countResult.rows[0].total);

    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reservas,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        SUM(total_amount) FILTER (WHERE status = 'confirmed') as total_revenue,
        AVG(total_amount) as avg_booking_value
      FROM bookings
      ${whereClause}
    `;

    const statsResult = await query(statsQuery, queryParams.slice(0, -2));
    const stats = statsResult.rows[0];

    console.log(`✅ Reservas listadas: ${result.rows.length} encontradas`);

    res.json({
      success: true,
      data: {
        reservas: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalReservas,
          pages: Math.ceil(totalReservas / limit)
        },
        stats: {
          total: parseInt(stats.total_reservas),
          confirmed: parseInt(stats.confirmed_count),
          pending: parseInt(stats.pending_count),
          cancelled: parseInt(stats.cancelled_count),
          total_revenue: parseFloat(stats.total_revenue || 0).toFixed(2),
          avg_booking_value: parseFloat(stats.avg_booking_value || 0).toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error listando reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 👤 OBTENER RESERVA POR ID
// ===============================================
router.get('/:reservaId', async (req, res) => {
  try {
    const { reservaId } = req.params;

    const reservaQuery = `
      SELECT 
        *
      FROM bookings 
      WHERE id = $1 OR booking_reference = $1
    `;

    const result = await query(reservaQuery, [reservaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const reserva = result.rows[0];

    // Obtener información del paquete si existe
    let packageInfo = null;
    if (reserva.package_id) {
      try {
        const packageQuery = `
          SELECT title, destination, country, duration_days, duration_nights, description_short
          FROM packages 
          WHERE package_id = $1
        `;
        const packageResult = await query(packageQuery, [reserva.package_id]);
        if (packageResult.rows.length > 0) {
          packageInfo = packageResult.rows[0];
        }
      } catch (error) {
        console.log('⚠️ No se pudo obtener info del paquete:', error.message);
      }
    }

    // Obtener historial de pagos si existe
    let paymentsHistory = [];
    try {
      const paymentsQuery = `
        SELECT * FROM orders 
        WHERE package_id = $1 AND customer_email = $2
        ORDER BY created_at DESC
      `;
      const paymentsResult = await query(paymentsQuery, [reserva.package_id, reserva.customer_email]);
      paymentsHistory = paymentsResult.rows;
    } catch (error) {
      console.log('⚠️ No se pudo obtener historial de pagos:', error.message);
    }

    console.log(`✅ Reserva obtenida: ${reserva.booking_reference}`);

    res.json({
      success: true,
      data: {
        reserva,
        package_info: packageInfo,
        payments_history: paymentsHistory,
        timeline: [
          {
            event: 'Reserva creada',
            timestamp: reserva.created_at,
            status: 'completed'
          },
          ...(reserva.confirmed_at ? [{
            event: 'Reserva confirmada',
            timestamp: reserva.confirmed_at,
            status: 'completed'
          }] : []),
          ...(reserva.cancelled_at ? [{
            event: 'Reserva cancelada',
            timestamp: reserva.cancelled_at,
            status: 'cancelled'
          }] : [])
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// ✏️ CREAR NUEVA RESERVA
// ===============================================
router.post('/', async (req, res) => {
  try {
    const {
      package_id,
      customer_name,
      customer_email,
      customer_phone,
      travelers_count = 1,
      total_amount,
      currency = 'USD',
      travel_date,
      special_requests = '',
      payment_method = 'pending',
      source = 'admin'
    } = req.body;

    // Validaciones básicas
    if (!package_id || !customer_name || !customer_email || !total_amount) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: package_id, customer_name, customer_email, total_amount'
      });
    }

    // Generar referencia única
    const booking_reference = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO bookings (
        booking_reference,
        package_id,
        customer_name,
        customer_email,
        customer_phone,
        travelers_count,
        total_amount,
        currency,
        status,
        travel_date,
        special_requests,
        payment_status,
        payment_method,
        source,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      booking_reference,
      package_id,
      customer_name,
      customer_email,
      customer_phone,
      travelers_count,
      total_amount,
      currency,
      'pending',
      travel_date,
      special_requests,
      'pending',
      payment_method,
      source
    ]);

    const nuevaReserva = result.rows[0];

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'create', 'booking', $2, $3)
    `, [
      req.user.id,
      booking_reference,
      JSON.stringify({ customer_name, package_id, total_amount })
    ]);

    console.log(`✅ Reserva creada: ${booking_reference}`);

    res.status(201).json({
      success: true,
      message: 'Reserva creada correctamente',
      data: {
        reserva: nuevaReserva
      }
    });

  } catch (error) {
    console.error('❌ Error creando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// ✏️ ACTUALIZAR RESERVA
// ===============================================
router.put('/:reservaId', async (req, res) => {
  try {
    const { reservaId } = req.params;
    const {
      customer_name,
      customer_email,
      customer_phone,
      travelers_count,
      total_amount,
      status,
      travel_date,
      special_requests,
      payment_status,
      payment_method
    } = req.body;

    // Construir consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (customer_name !== undefined) {
      updates.push(`customer_name = $${paramIndex}`);
      values.push(customer_name);
      paramIndex++;
    }

    if (customer_email !== undefined) {
      updates.push(`customer_email = $${paramIndex}`);
      values.push(customer_email);
      paramIndex++;
    }

    if (customer_phone !== undefined) {
      updates.push(`customer_phone = $${paramIndex}`);
      values.push(customer_phone);
      paramIndex++;
    }

    if (travelers_count !== undefined) {
      updates.push(`travelers_count = $${paramIndex}`);
      values.push(travelers_count);
      paramIndex++;
    }

    if (total_amount !== undefined) {
      updates.push(`total_amount = $${paramIndex}`);
      values.push(total_amount);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
      
      // Si se confirma la reserva, agregar timestamp
      if (status === 'confirmed') {
        updates.push(`confirmed_at = CURRENT_TIMESTAMP`);
      } else if (status === 'cancelled') {
        updates.push(`cancelled_at = CURRENT_TIMESTAMP`);
      }
    }

    if (travel_date !== undefined) {
      updates.push(`travel_date = $${paramIndex}`);
      values.push(travel_date);
      paramIndex++;
    }

    if (special_requests !== undefined) {
      updates.push(`special_requests = $${paramIndex}`);
      values.push(special_requests);
      paramIndex++;
    }

    if (payment_status !== undefined) {
      updates.push(`payment_status = $${paramIndex}`);
      values.push(payment_status);
      paramIndex++;
    }

    if (payment_method !== undefined) {
      updates.push(`payment_method = $${paramIndex}`);
      values.push(payment_method);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay campos para actualizar'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} OR booking_reference = $${paramIndex}
      RETURNING *
    `;

    values.push(reservaId);
    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const reservaActualizada = result.rows[0];

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'update', 'booking', $2, $3)
    `, [
      req.user.id,
      reservaActualizada.booking_reference,
      JSON.stringify(req.body)
    ]);

    console.log(`✅ Reserva actualizada: ${reservaActualizada.booking_reference}`);

    res.json({
      success: true,
      message: 'Reserva actualizada correctamente',
      data: {
        reserva: reservaActualizada
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// ❌ CANCELAR RESERVA
// ===============================================
router.delete('/:reservaId', async (req, res) => {
  try {
    const { reservaId } = req.params;
    const { reason = 'Cancelado por administrador' } = req.body;

    const cancelQuery = `
      UPDATE bookings 
      SET 
        status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        special_requests = CASE 
          WHEN special_requests IS NULL OR special_requests = '' 
          THEN $1
          ELSE special_requests || ' | CANCELACIÓN: ' || $1
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 OR booking_reference = $2
      RETURNING *
    `;

    const result = await query(cancelQuery, [reason, reservaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const reservaCancelada = result.rows[0];

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'cancel', 'booking', $2, $3)
    `, [
      req.user.id,
      reservaCancelada.booking_reference,
      JSON.stringify({ reason, cancelled_by: req.user.username })
    ]);

    console.log(`✅ Reserva cancelada: ${reservaCancelada.booking_reference}`);

    res.json({
      success: true,
      message: 'Reserva cancelada correctamente',
      data: {
        reserva: reservaCancelada,
        cancellation_reason: reason
      }
    });

  } catch (error) {
    console.error('❌ Error cancelando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 💳 AGREGAR PAGO A RESERVA
// ===============================================
router.post('/:reservaId/payments', async (req, res) => {
  try {
    const { reservaId } = req.params;
    const { amount, payment_method, reference, notes = '' } = req.body;

    if (!amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Amount y payment_method son requeridos'
      });
    }

    // Obtener reserva actual
    const reservaQuery = `SELECT * FROM bookings WHERE id = $1 OR booking_reference = $1`;
    const reservaResult = await query(reservaQuery, [reservaId]);

    if (reservaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const reserva = reservaResult.rows[0];

    // Actualizar estado de pago en la reserva
    let newPaymentStatus = 'partial';
    if (parseFloat(amount) >= parseFloat(reserva.total_amount)) {
      newPaymentStatus = 'paid';
    }

    await query(`
      UPDATE bookings 
      SET 
        payment_status = $1,
        payment_method = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [newPaymentStatus, payment_method, reserva.id]);

    // Registrar actividad de pago
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'add_payment', 'booking', $2, $3)
    `, [
      req.user.id,
      reserva.booking_reference,
      JSON.stringify({
        amount,
        payment_method,
        reference,
        notes,
        new_status: newPaymentStatus
      })
    ]);

    console.log(`✅ Pago agregado a reserva: ${reserva.booking_reference}`);

    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      data: {
        booking_reference: reserva.booking_reference,
        payment: {
          amount,
          payment_method,
          reference,
          status: newPaymentStatus,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error agregando pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 📱 SINCRONIZACIÓN CON APP CLIENTE
// ===============================================
router.post('/:reservaId/sync', async (req, res) => {
  try {
    const { reservaId } = req.params;

    const reservaQuery = `SELECT * FROM bookings WHERE id = $1 OR booking_reference = $1`;
    const result = await query(reservaQuery, [reservaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const reserva = result.rows[0];

    // Datos para sincronizar con app cliente
    const syncData = {
      booking_reference: reserva.booking_reference,
      package_id: reserva.package_id,
      status: reserva.status,
      travel_date: reserva.travel_date,
      customer_email: reserva.customer_email,
      total_amount: reserva.total_amount,
      payment_status: reserva.payment_status,
      last_updated: reserva.updated_at,
      sync_timestamp: new Date().toISOString()
    };

    // Registrar sincronización
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'sync_app_client', 'booking', $2, $3)
    `, [
      req.user.id,
      reserva.booking_reference,
      JSON.stringify(syncData)
    ]);

    console.log(`✅ Reserva sincronizada: ${reserva.booking_reference}`);

    res.json({
      success: true,
      message: 'Sincronización completada',
      data: syncData
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 📊 ESTADÍSTICAS DE RESERVAS
// ===============================================
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Determinar rango de fechas
    let startDate;
    const endDate = new Date();
    
    switch (period) {
      case 'week':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    }

    // Estadísticas principales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        SUM(total_amount) FILTER (WHERE status = 'confirmed') as total_revenue,
        AVG(total_amount) as avg_booking_value,
        COUNT(*) FILTER (WHERE created_at >= $1) as bookings_period
      FROM bookings
      WHERE created_at >= $2
    `;

    const statsResult = await query(statsQuery, [startDate, startDate]);
    const stats = statsResult.rows[0];

    // Top destinos
    const topDestinationsQuery = `
      SELECT 
        p.destination,
        p.country,
        COUNT(*) as booking_count,
        SUM(b.total_amount) as total_revenue
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.package_id
      WHERE b.created_at >= $1 AND b.status = 'confirmed'
      GROUP BY p.destination, p.country
      ORDER BY booking_count DESC
      LIMIT 10
    `;

    const topDestinationsResult = await query(topDestinationsQuery, [startDate]);

    console.log('✅ Estadísticas de reservas generadas');

    res.json({
      success: true,
      data: {
        summary: {
          total_bookings: parseInt(stats.total_bookings),
          confirmed_bookings: parseInt(stats.confirmed_bookings),
          pending_bookings: parseInt(stats.pending_bookings),
          cancelled_bookings: parseInt(stats.cancelled_bookings),
          total_revenue: parseFloat(stats.total_revenue || 0).toFixed(2),
          avg_booking_value: parseFloat(stats.avg_booking_value || 0).toFixed(2),
          bookings_period: parseInt(stats.bookings_period)
        },
        top_destinations: topDestinationsResult.rows,
        period: period,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generando estadísticas de reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 🆕 CREAR NUEVA RESERVA
// ===============================================
router.post('/', async (req, res) => {
  try {
    console.log('📋 POST /api/admin/bookings - Creando reserva');
    console.log('Datos recibidos:', req.body);
    
    const {
      packageName,
      customerName,
      customerEmail,
      customerPhone,
      passengers,
      totalAmount,
      paidAmount = 0,
      bookingDate,
      travelDate,
      status = 'pending',
      paymentStatus = 'pending',
      destination,
      duration = 1,
      services = [],
      notes = ''
    } = req.body;

    // Validaciones básicas
    if (!packageName || !customerName || !customerEmail || !totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: packageName, customerName, customerEmail, totalAmount'
      });
    }

    // Generar ID único y referencia
    const bookingId = `BK${Date.now()}`;
    const bookingReference = `BK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Datos de la reserva
    const bookingData = {
      id: bookingId,
      booking_reference: bookingReference,
      package_name: packageName,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || '',
      travelers_count: passengers || 1,
      total_amount: parseFloat(totalAmount),
      paid_amount: parseFloat(paidAmount),
      currency: 'USD',
      status: status,
      payment_status: paymentStatus,
      destination: destination || 'No especificado',
      duration_days: parseInt(duration),
      travel_date: travelDate || new Date().toISOString().split('T')[0],
      booking_date: bookingDate || new Date().toISOString().split('T')[0],
      services: Array.isArray(services) ? services : [],
      special_requests: notes,
      source: 'admin_manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // TODO: Guardar en base de datos real
    // Por ahora, simulamos que se guardó exitosamente
    console.log('✅ Reserva creada exitosamente:', bookingReference);
    
    res.status(201).json({
      success: true,
      booking: bookingData,
      message: `Reserva ${bookingReference} creada exitosamente`
    });

  } catch (error) {
    console.error('❌ Error creando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 📋 ESTADISTICAS DE RESERVAS (RUTA FALTANTE)
// ===============================================
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/admin/bookings-stats - Estadísticas');
    
    const { period = '30d', groupBy = 'day' } = req.query;
    
    // Mock data por ahora
    const stats = {
      total_bookings: 15,
      confirmed_bookings: 12,
      pending_bookings: 2,
      cancelled_bookings: 1,
      total_revenue: 45800.00,
      avg_booking_value: 3053.33,
      period: period,
      group_by: groupBy,
      chart_data: [
        { date: '2025-07-01', bookings: 2, revenue: 6400 },
        { date: '2025-07-02', bookings: 1, revenue: 3200 },
        { date: '2025-07-03', bookings: 3, revenue: 9600 }
      ]
    };
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error en stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
