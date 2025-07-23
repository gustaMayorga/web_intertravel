/**
 * GET /api/app/user/bookings
 * Obtener reservas del usuario autenticado BUSCANDO POR DNI
 */
router.get('/user/bookings', authenticateAdvanced(PERMISSIONS.BOOKING_READ), async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    
    console.log('📋 Buscando reservas para usuario:', userId, userEmail);
    
    // 1. OBTENER DNI DEL USUARIO AUTENTICADO
    const userResult = await query(
      'SELECT document_number FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    const userDNI = userResult.rows[0].document_number;
    console.log('📋 DNI del usuario:', userDNI);
    
    if (!userDNI) {
      // Fallback: buscar por email si no tiene DNI
      console.log('⚠️ Usuario sin DNI, buscando por email');
      const bookingsResult = await query(
        `SELECT booking_reference, package_id, package_title, package_source,
                destination, country, customer_name, customer_email, 
                travelers_count, total_amount, currency, status, travel_date,
                return_date, duration_days, special_requests, created_at, confirmed_at
         FROM bookings 
         WHERE customer_email = $1 
         ORDER BY created_at DESC`,
        [userEmail]
      );
      
      const bookings = bookingsResult.rows.map(booking => ({
        id: booking.booking_reference,
        bookingReference: booking.booking_reference,
        packageId: booking.package_id,
        packageTitle: booking.package_title,
        packageSource: booking.package_source,
        destination: booking.destination,
        country: booking.country,
        travelDate: booking.travel_date,
        returnDate: booking.return_date,
        durationDays: booking.duration_days,
        travelersCount: booking.travelers_count,
        totalAmount: booking.total_amount,
        paidAmount: booking.total_amount, // Asumir pagado por ahora
        currency: booking.currency,
        status: booking.status,
        paymentStatus: 'paid', // Asumir pagado por ahora
        specialRequests: booking.special_requests,
        createdAt: booking.created_at
      }));
      
      return res.json({
        success: true,
        data: {
          bookings: bookings,
          total: bookings.length
        }
      });
    }
    
    // 2. BUSCAR RESERVAS POR DNI (en campo customer_document_number o similar)
    let bookingsResult;
    
    // Intentar búsqueda por DNI en diferentes campos posibles
    try {
      // Opción 1: Si hay campo customer_document_number en bookings
      bookingsResult = await query(
        `SELECT booking_reference, package_id, package_title, package_source,
                destination, country, customer_name, customer_email, 
                customer_document_number, travelers_count, total_amount, 
                currency, status, travel_date, return_date, duration_days, 
                special_requests, created_at, confirmed_at
         FROM bookings 
         WHERE customer_document_number = $1 
         ORDER BY created_at DESC`,
        [userDNI]
      );
    } catch (error) {
      console.log('⚠️ No existe customer_document_number, probando customer_email');
      
      // Opción 2: Buscar customer por DNI y luego sus bookings por email
      const customerResult = await query(
        'SELECT email FROM customers WHERE document_number = $1',
        [userDNI]
      );
      
      if (customerResult.rows.length > 0) {
        const customerEmail = customerResult.rows[0].email;
        bookingsResult = await query(
          `SELECT booking_reference, package_id, package_title, package_source,
                  destination, country, customer_name, customer_email, 
                  travelers_count, total_amount, currency, status, travel_date,
                  return_date, duration_days, special_requests, created_at, confirmed_at
           FROM bookings 
           WHERE customer_email = $1 
           ORDER BY created_at DESC`,
          [customerEmail]
        );
      } else {
        // Opción 3: Fallback por email del usuario
        bookingsResult = await query(
          `SELECT booking_reference, package_id, package_title, package_source,
                  destination, country, customer_name, customer_email, 
                  travelers_count, total_amount, currency, status, travel_date,
                  return_date, duration_days, special_requests, created_at, confirmed_at
           FROM bookings 
           WHERE customer_email = $1 
           ORDER BY created_at DESC`,
          [userEmail]
        );
      }
    }
    
    if (!bookingsResult || !bookingsResult.rows) {
      return res.json({
        success: true,
        data: {
          bookings: [],
          total: 0
        }
      });
    }

    // 3. FORMATEAR RESERVAS PARA APP CLIENT
    const bookings = bookingsResult.rows.map(booking => ({
      id: booking.booking_reference,
      bookingReference: booking.booking_reference,
      packageId: booking.package_id,
      packageTitle: booking.package_title || 'Paquete Turístico',
      packageSource: booking.package_source || 'system',
      destination: booking.destination,
      country: booking.country,
      travelDate: booking.travel_date,
      returnDate: booking.return_date,
      durationDays: booking.duration_days || 1,
      travelersCount: booking.travelers_count || 1,
      totalAmount: parseFloat(booking.total_amount) || 0,
      paidAmount: parseFloat(booking.total_amount) || 0, // Asumir pagado
      currency: booking.currency || 'USD',
      status: booking.status || 'pending',
      paymentStatus: 'paid', // Asumir pagado por ahora
      specialRequests: booking.special_requests,
      createdAt: booking.created_at
    }));

    console.log(`✅ Encontradas ${bookings.length} reservas para DNI: ${userDNI}`);

    res.json({
      success: true,
      data: {
        bookings: bookings,
        total: bookings.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo reservas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});
