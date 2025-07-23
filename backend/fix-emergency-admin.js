// EMERGENCY ADMIN ROUTES - VINCULACIÓN DNI
const express = require('express');
const router = express.Router();

// Al inicio del archivo, ANTES de cualquier endpoint:
router.get('/bookings', (req, res) => {
    console.log('📋 GET bookings request:', req.query);
    // ... resto del código
  });

// POST /api/admin/bookings
router.post('/bookings', (req, res) => {
  console.log('📋 Admin crear reserva:', req.body);
  
  const { customer, package_id, travelers_count } = req.body;
  const bookingReference = `ITV-${Date.now()}`;
  
  const response = {
    message: 'Reserva creada exitosamente',
    booking: {
      id: Date.now(),
      booking_reference: bookingReference,
      package_title: 'Paquete Test',
      customer_name: `${customer.first_name} ${customer.last_name}`,
      total_amount: 599.00 * travelers_count,
      currency: 'USD',
      status: 'pending',
      travel_date: req.body.travel_date
    },
    customer: {
      id: Date.now(),
      document_number: customer.document_number,
      email: customer.email
    },
    vinculacion: {
      user_vinculado: customer.document_number === '12345678',
      user_info: customer.document_number === '12345678' ? {
        id: 1,
        email: 'test@email.com',
        nombre: 'Usuario Test'
      } : null
    }
  };
  
  res.status(201).json(response);
});

// PATCH /api/admin/bookings/:id/status
router.patch('/bookings/:id/status', (req, res) => {
  console.log('📋 Actualizar estado reserva:', req.params.id, req.body);
  
  res.json({
    message: 'Estado actualizado exitosamente',
    booking: {
      id: req.params.id,
      status: req.body.status,
      updated_at: new Date().toISOString()
    }
  });
});

// GET /api/admin/packages/featured
router.get('/packages/featured', (req, res) => {
  console.log('📋 Obtener paquetes destacados');
  
  const mockPackages = [
    {
      id: 1,
      title: 'Mendoza Wine Tour',
      price_amount: 299,
      price_currency: 'USD',
      destination_name: 'Mendoza',
      is_featured: true
    },
    {
      id: 2,
      title: 'Buenos Aires City Tour',
      price_amount: 199,
      price_currency: 'USD',
      destination_name: 'Buenos Aires',
      is_featured: true
    },
    {
      id: 3,
      title: 'Bariloche Adventure',
      price_amount: 399,
      price_currency: 'USD',
      destination_name: 'Bariloche',
      is_featured: true
    }
  ];
  
  res.json({
    message: 'Paquetes destacados obtenidos',
    config: {
      title: 'Nuestros Mejores Destinos',
      subtitle: 'Experiencias únicas que no puedes perderte',
      count: 3
    },
    packages: mockPackages
  });
});

// PUT /api/admin/packages/featured
router.put('/packages/featured', (req, res) => {
  console.log('📋 Actualizar paquetes destacados:', req.body);
  
  res.json({
    message: 'Paquetes destacados actualizados exitosamente',
    featured_count: 3,
    packages: []
  });
});

// GET /api/admin/dashboard/vinculacion-stats
router.get('/dashboard/vinculacion-stats', (req, res) => {
  console.log('📋 Stats de vinculación');
  
  res.json({
    message: 'Stats de vinculación obtenidas',
    vinculacion: {
      total_customers: 10,
      customers_vinculados: 7,
      customers_sin_vincular: 3,
      porcentaje_vinculado: 70.0
    },
    reservas_por_vinculacion: [
      { vinculacion_status: 'vinculado', total_reservas: 15, total_revenue: 4500 },
      { vinculacion_status: 'sin_vincular', total_reservas: 5, total_revenue: 1200 }
    ],
    actividad_reciente: [],
    timestamp: new Date().toISOString()
  });
});

// ENDPOINTS FALTANTES
router.get('/whatsapp-config', (req, res) => {
    res.json({
      enabled: true,
      phone_number: '+54 9 261 123-4567',
      api_status: 'connected'
    });
  });
  
  router.get('/bookings/stats', (req, res) => {
    res.json({
      success: true,
      stats: {
        total_bookings: 15,
        confirmed_bookings: 10,
        pending_bookings: 3,
        total_revenue: 8500.00
      }
    });
  });

// ENDPOINTS FALTANTES CRÍTICOS
router.get('/bookings-stats', (req, res) => {
    res.json({
      success: true,
      stats: {
        total_bookings: 15,
        confirmed_bookings: 10,
        pending_bookings: 3,
        total_revenue: 8500.00
      }
    });
  });
module.exports = router;