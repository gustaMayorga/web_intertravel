// Routes for bookings management
const express = require('express');
const router = express.Router();

// Cargar database con fallback
let query;
try {
  const { query: dbQuery } = require('../database');
  query = dbQuery;
  console.log('✅ Database loaded for bookings routes');
} catch (error) {
  console.warn('⚠️ Database not available for bookings:', error.message);
  // Mock query function
  query = async (sql, params) => {
    console.log('🔄 Mock query for bookings:', sql.substring(0, 50) + '...');
    return { rows: [] };
  };
}

/**
 * GET /api/bookings
 * Obtener todas las reservas con paginación
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    console.log(`📋 Obteniendo reservas - Página ${page}, Límite ${limit}`);

    // Obtener reservas con paginación
    const bookingsResult = await query(`
      SELECT 
        id, booking_reference, package_id, package_title, package_source,
        destination, country, customer_name, customer_email, customer_phone,
        travelers_count, travel_date, return_date, duration_days,
        total_amount, paid_amount, currency, status, payment_status,
        special_requests, created_at, updated_at
      FROM bookings 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Obtener total de reservas
    const countResult = await query('SELECT COUNT(*) FROM bookings');
    const total = parseInt(countResult.rows[0]?.count || 0);

    const bookings = bookingsResult.rows.map(booking => ({
      id: booking.id,
      bookingReference: booking.booking_reference,
      packageId: booking.package_id,
      packageTitle: booking.package_title,
      packageSource: booking.package_source,
      destination: booking.destination,
      country: booking.country,
      customer: {
        name: booking.customer_name,
        email: booking.customer_email,
        phone: booking.customer_phone
      },
      travelersCount: booking.travelers_count,
      travelDate: booking.travel_date,
      returnDate: booking.return_date,
      durationDays: booking.duration_days,
      totalAmount: parseFloat(booking.total_amount || 0),
      paidAmount: parseFloat(booking.paid_amount || 0),
      currency: booking.currency,
      status: booking.status,
      paymentStatus: booking.payment_status,
      specialRequests: booking.special_requests,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }));

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo reservas',
      message: error.message
    });
  }
});

/**
 * GET /api/bookings/:id
 * Obtener detalles de una reserva específica
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍 Obteniendo detalles de reserva: ${id}`);

    const bookingResult = await query(`
      SELECT * FROM bookings 
      WHERE booking_reference = $1 OR id = $1
    `, [id]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    const booking = bookingResult.rows[0];
    const metadata = booking.metadata ? JSON.parse(booking.metadata) : {};

    res.json({
      success: true,
      data: {
        id: booking.id,
        bookingReference: booking.booking_reference,
        packageId: booking.package_id,
        packageTitle: booking.package_title,
        packageSource: booking.package_source,
        destination: booking.destination,
        country: booking.country,
        customer: {
          name: booking.customer_name,
          email: booking.customer_email,
          phone: booking.customer_phone
        },
        travelersCount: booking.travelers_count,
        travelDate: booking.travel_date,
        returnDate: booking.return_date,
        durationDays: booking.duration_days,
        totalAmount: parseFloat(booking.total_amount || 0),
        paidAmount: parseFloat(booking.paid_amount || 0),
        currency: booking.currency,
        status: booking.status,
        paymentStatus: booking.payment_status,
        specialRequests: booking.special_requests,
        services: metadata.services || [],
        images: metadata.images || [],
        createdAt: booking.created_at,
        updatedAt: booking.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalles de reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo detalles de reserva',
      message: error.message
    });
  }
});

/**
 * POST /api/bookings
 * Crear una nueva reserva
 */
router.post('/', async (req, res) => {
  try {
    const {
      packageId,
      packageTitle,
      packageSource,
      destination,
      country,
      customerName,
      customerEmail,
      customerPhone,
      travelersCount,
      travelDate,
      returnDate,
      durationDays,
      totalAmount,
      currency,
      specialRequests,
      metadata
    } = req.body;

    console.log('📝 Creando nueva reserva para:', customerEmail);

    // Generar booking reference único
    const bookingReference = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const newBooking = await query(`
      INSERT INTO bookings (
        booking_reference, package_id, package_title, package_source,
        destination, country, customer_name, customer_email, customer_phone,
        travelers_count, travel_date, return_date, duration_days,
        total_amount, paid_amount, currency, status, payment_status,
        special_requests, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *
    `, [
      bookingReference,
      packageId,
      packageTitle,
      packageSource || 'travel-compositor',
      destination,
      country,
      customerName,
      customerEmail,
      customerPhone,
      travelersCount,
      travelDate,
      returnDate,
      durationDays,
      totalAmount,
      0, // paid_amount inicial
      currency || 'USD',
      'pending', // status inicial
      'pending', // payment_status inicial
      specialRequests,
      JSON.stringify(metadata || {}),
      new Date(),
      new Date()
    ]);

    console.log('✅ Reserva creada:', bookingReference);

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        id: newBooking.rows[0].id,
        bookingReference: newBooking.rows[0].booking_reference,
        status: newBooking.rows[0].status,
        paymentStatus: newBooking.rows[0].payment_status
      }
    });

  } catch (error) {
    console.error('❌ Error creando reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando reserva',
      message: error.message
    });
  }
});

/**
 * PUT /api/bookings/:id/status
 * Actualizar estado de una reserva
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    console.log(`🔄 Actualizando estado de reserva ${id}:`, { status, paymentStatus });

    const updatedBooking = await query(`
      UPDATE bookings 
      SET status = COALESCE($1, status), 
          payment_status = COALESCE($2, payment_status),
          updated_at = $3
      WHERE booking_reference = $4 OR id = $4
      RETURNING booking_reference, status, payment_status
    `, [status, paymentStatus, new Date(), id]);

    if (updatedBooking.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reserva no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: updatedBooking.rows[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando estado de reserva:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando estado de reserva',
      message: error.message
    });
  }
});

console.log('✅ Bookings router loaded successfully');
module.exports = router;