const express = require('express');
const router = express.Router();

// Mock data para admin
const mockBookings = [
  {
    id: 1,
    customerName: "Juan Pérez",
    packageName: "Mendoza Wine Tour",
    status: "confirmed",
    payment: "paid",
    date: "2024-07-20",
    amount: 250
  },
  {
    id: 2,
    customerName: "Maria García",
    packageName: "Aconcagua Adventure",
    status: "pending",
    payment: "pending",
    date: "2024-07-25",
    amount: 500
  }
];

const mockUsers = [
  {
    id: 1,
    name: "Ana López",
    email: "ana@email.com",
    role: "user",
    status: "active",
    registeredAt: "2024-07-01"
  },
  {
    id: 2,
    name: "Carlos Rivera",
    email: "carlos@email.com",
    role: "admin",
    status: "active",
    registeredAt: "2024-06-15"
  }
];

const mockDestinations = [
  {
    id: 1,
    name: "Mendoza",
    description: "Capital del vino argentino",
    status: "active",
    packages: 5
  },
  {
    id: 2,
    name: "Aconcagua",
    description: "Montaña más alta de América",
    status: "active",
    packages: 3
  }
];

const mockPackages = [
  {
    id: 1,
    name: "Mendoza Wine Tour",
    category: "wine",
    status: "active",
    price: 250,
    destination: "Mendoza"
  },
  {
    id: 2,
    name: "Aconcagua Adventure",
    category: "adventure",
    status: "active",
    price: 500,
    destination: "Aconcagua"
  }
];

const mockPayments = [
  {
    id: 1,
    bookingId: 1,
    amount: 250,
    status: "completed",
    method: "credit_card",
    date: "2024-07-20"
  },
  {
    id: 2,
    bookingId: 2,
    amount: 500,
    status: "pending",
    method: "bank_transfer",
    date: "2024-07-25"
  }
];

const mockKeywords = [
  {
    id: 1,
    keyword: "mendoza tours",
    priority: "high",
    status: "active"
  },
  {
    id: 2,
    keyword: "aconcagua trekking",
    priority: "medium",
    status: "active"
  }
];

const mockStats = {
  totalBookings: 15,
  totalRevenue: 7500,
  pendingBookings: 3,
  confirmedBookings: 12,
  monthlyData: [
    { month: 'Jan', bookings: 8, revenue: 2000 },
    { month: 'Feb', bookings: 12, revenue: 3000 },
    { month: 'Mar', bookings: 15, revenue: 3750 }
  ]
};

const mockUserStats = {
  totalUsers: 45,
  activeUsers: 42,
  newUsers: 8,
  adminUsers: 3
};

const mockAnalytics = {
  totalVisits: 1250,
  conversionRate: 3.2,
  avgSessionDuration: 4.5,
  topPages: [
    { page: '/paquetes', visits: 450 },
    { page: '/nosotros', visits: 320 },
    { page: '/contacto', visits: 280 }
  ]
};

// ================================
// BOOKINGS ROUTES
// ================================
router.get('/bookings', (req, res) => {
  console.log('📋 GET /api/admin/bookings - Obteniendo reservas...');
  res.json({
    success: true,
    data: mockBookings,
    pagination: {
      total: mockBookings.length,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    }
  });
});

router.get('/bookings-stats', (req, res) => {
  console.log('📊 GET /api/admin/bookings-stats - Obteniendo estadísticas...');
  res.json({
    success: true,
    data: mockStats
  });
});

router.get('/bookings/stats', (req, res) => {
  console.log('📊 GET /api/admin/bookings/stats - Obteniendo estadísticas...');
  res.json({
    success: true,
    data: mockStats
  });
});

// ================================
// USERS ROUTES
// ================================
router.get('/users', (req, res) => {
  console.log('👥 GET /api/admin/users - Obteniendo usuarios...');
  res.json({
    success: true,
    data: mockUsers,
    pagination: {
      total: mockUsers.length,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    }
  });
});

router.get('/users/stats', (req, res) => {
  console.log('📊 GET /api/admin/users/stats - Estadísticas de usuarios...');
  res.json({
    success: true,
    data: mockUserStats
  });
});

// ================================
// DESTINATIONS ROUTES
// ================================
router.get('/destinations', (req, res) => {
  console.log('🌍 GET /api/admin/destinations - Obteniendo destinos...');
  res.json({
    success: true,
    data: mockDestinations
  });
});

// ================================
// PACKAGES ROUTES
// ================================
router.get('/packages', (req, res) => {
  console.log('📦 GET /api/admin/packages - Obteniendo paquetes...');
  res.json({
    success: true,
    data: mockPackages,
    pagination: {
      total: mockPackages.length,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    }
  });
});

// ================================
// ANALYTICS ROUTES
// ================================
router.get('/analytics', (req, res) => {
  console.log('📈 GET /api/admin/analytics - Obteniendo analíticas...');
  res.json({
    success: true,
    data: mockAnalytics
  });
});

// ================================
// PAYMENTS ROUTES
// ================================
router.get('/payments', (req, res) => {
  console.log('💳 GET /api/admin/payments - Obteniendo pagos...');
  res.json({
    success: true,
    data: mockPayments,
    pagination: {
      total: mockPayments.length,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    }
  });
});

// ================================
// SEO/KEYWORDS ROUTES
// ================================
router.get('/priority-keywords', (req, res) => {
  console.log('🔍 GET /api/admin/priority-keywords - Obteniendo keywords...');
  res.json({
    success: true,
    data: mockKeywords
  });
});

// ================================
// WHATSAPP CONFIG
// ================================
router.get('/whatsapp-config', (req, res) => {
  console.log('📱 GET /api/admin/whatsapp-config - Configuración WhatsApp...');
  res.json({
    success: true,
    data: {
      enabled: true,
      phoneNumber: '+5492612345678',
      welcomeMessage: 'Hola! Bienvenido a InterTravel'
    }
  });
});

// ================================
// ERROR HANDLER
// ================================
router.use((err, req, res, next) => {
  console.error('❌ Error en ruta admin:', err.message);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

module.exports = router;
