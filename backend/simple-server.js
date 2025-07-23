const express = require('express');
const cors = require('cors');
const app = express();

// CORS
app.use(cors({ 
  origin: ['http://localhost:3009'], 
  credentials: true 
}));
app.use(express.json());

// SYNC ROUTE
app.get('/api/sync-user-data', (req, res) => {
  console.log('🔄 SYNC HIT');
  res.json({
    success: true,
    hasChanges: false,
    timestamp: new Date().toISOString()
  });
});

// CHECK DNI ROUTE
app.post('/api/app/auth/check-dni', (req, res) => {
  const { document_number } = req.body;
  console.log('🔍 CHECK DNI:', document_number);
  
  if (document_number === '12345678') {
    res.json({
      document_number,
      user_registered: false,
      has_bookings: true,
      bookings_count: 1,
      should_link: true
    });
  } else if (document_number === '87654321') {
    res.json({
      document_number,
      user_registered: true,
      has_bookings: false,
      existing_user: { email: 'existing@test.com' }
    });
  } else {
    res.json({
      document_number,
      user_registered: false,
      has_bookings: false,
      bookings_count: 0,
      should_link: false
    });
  }
});

// LOGIN ROUTE
app.post('/api/app/auth/login', (req, res) => {
  console.log('🔥 LOGIN HIT:', req.body);
  res.json({
    success: true,
    data: {
      user: { 
        id: 'test', 
        email: req.body.email, 
        firstName: 'Test', 
        lastName: 'User',
        dni: '12345678',
        phone: '+54911123456'
      },
      token: 'test-token-' + Date.now()
    }
  });
  console.log('✅ LOGIN SUCCESS for:', req.body.email);
});

// USER BOOKINGS ROUTE
app.get('/api/app/user/bookings', (req, res) => {
  console.log('📋 USER BOOKINGS HIT');
  res.json({
    success: true,
    data: {
      bookings: [{
        id: 'booking1',
        bookingReference: 'REF001',
        packageTitle: 'Camboriú 2025',
        destination: 'Camboriú',
        country: 'Brasil',
        travelDate: '2025-01-15',
        returnDate: '2025-01-20',
        durationDays: 5,
        travelersCount: 2,
        totalAmount: 1299,
        paidAmount: 1299,
        currency: 'USD',
        status: 'confirmed',
        paymentStatus: 'paid',
        packageSource: 'system',
        createdAt: '2024-12-01T10:00:00Z'
      }],
      total: 1
    }
  });
});

// USER STATS ROUTE
app.get('/api/app/user/stats', (req, res) => {
  console.log('📈 USER STATS HIT');
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

// USER PROFILE ROUTE
app.get('/api/app/user/profile', (req, res) => {
  console.log('👤 USER PROFILE HIT');
  res.json({
    success: true,
    data: {
      user: {
        id: 1,
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        email: 'test@mail.com',
        phone: '+54911123456',
        role: 'client',
        joinDate: '2024-12-01'
      }
    }
  });
});

// HEALTH CHECK
app.get('/api/app/health', (req, res) => {
  console.log('❤️ HEALTH CHECK HIT');
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// Health
app.get('/', (req, res) => {
  res.json({ status: 'OK', routes: ['login', 'check-dni', 'user/bookings', 'user/stats', 'user/profile', 'health', 'sync'] });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 SIMPLE SERVER: http://localhost:${PORT}`);
  console.log(`🔑 Endpoints: login, check-dni, bookings, stats, sync`);
});
