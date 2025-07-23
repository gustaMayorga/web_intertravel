// ===============================================
// EMERGENCY FIX - RUTAS APP_CLIENT
// ===============================================

const { Router } = require('express');
const router = Router();

console.log('🔧 Cargando rutas APP_CLIENT...');

// ===============================================
// LOGIN
// ===============================================
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('📋 Login:', { email });
  
  res.json({
    success: true,
    data: {
      user: {
        id: 'user123',
        email: email,
        firstName: 'Test',
        lastName: 'Usuario'
      },
      token: 'fake-token-' + Date.now()
    }
  });
});

// ===============================================
// CHECK DNI
// ===============================================
router.post('/auth/check-dni', (req, res) => {
  const { document_number } = req.body;
  
  res.json({
    document_number,
    user_registered: false,
    has_bookings: document_number === '12345678',
    bookings_count: document_number === '12345678' ? 1 : 0,
    should_link: document_number === '12345678'
  });
});

// ===============================================
// USER BOOKINGS (ruta correcta para app client)
// ===============================================
router.get('/user/bookings', (req, res) => {
  console.log('📋 USER BOOKINGS solicitado');
  res.json({
    success: true,
    data: {
      bookings: [{
        id: 'REF-001',
        bookingReference: 'REF-001',
        packageId: 'PKG-001',
        packageTitle: 'Camboriú 2025 - Viaje Especial',
        packageSource: 'system',
        destination: 'Camboriú',
        country: 'Brasil',
        travelDate: '2025-02-15',
        returnDate: '2025-02-20',
        durationDays: 5,
        travelersCount: 2,
        totalAmount: 1299,
        paidAmount: 1299,
        currency: 'USD',
        status: 'confirmed',
        paymentStatus: 'paid',
        specialRequests: 'Vista al mar',
        createdAt: new Date().toISOString()
      }],
      total: 1
    }
  });
});

// ===============================================
// USER STATS (ruta correcta para app client)
// ===============================================
router.get('/user/stats', (req, res) => {
  console.log('📈 USER STATS solicitado');
  res.json({
    success: true,
    data: {
      stats: {
        totalBookings: 1,
        confirmedBookings: 1,
        pendingBookings: 0,
        completedBookings: 0,
        totalSpent: 1299,
        confirmedSpent: 1299,
        avgBookingValue: 1299
      }
    }
  });
});

console.log('✅ Rutas APP_CLIENT cargadas');
module.exports = router;
