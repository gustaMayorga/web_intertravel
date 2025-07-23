// ===============================================
// TESTING SUITE INTERTRAVEL - FASE 2
// ===============================================

const request = require('supertest');
const app = require('../server-fixed');

describe('InterTravel API Tests - Fase 2', () => {
  
  // Headers para bypass de auth en desarrollo
  const devHeaders = {
    'x-dev-bypass': 'true',
    'Content-Type': 'application/json'
  };

  describe('Admin Stats API', () => {
    test('GET /api/admin/stats should return real database stats', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set(devHeaders);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('database');
      expect(response.body.stats).toHaveProperty('totalBookings');
      expect(response.body.stats).toHaveProperty('totalRevenue');
      expect(response.body.stats).toHaveProperty('uniqueCustomers');
      expect(response.body.services).toHaveProperty('database', 'connected');
      
      // Verificar que no son datos mock
      expect(typeof response.body.stats.totalBookings).toBe('number');
      expect(response.body.stats.totalBookings).toBeGreaterThanOrEqual(0);
    });

    test('GET /api/admin/bookings-stats should return analytics', async () => {
      const response = await request(app)
        .get('/api/admin/bookings-stats')
        .set(devHeaders);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(Array.isArray(response.body.data.stats)).toBe(true);
    });
  });

  describe('Admin Bookings API', () => {
    test('GET /api/admin/bookings should return real bookings', async () => {
      const response = await request(app)
        .get('/api/admin/bookings')
        .set(devHeaders);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('database');
      expect(response.body.data).toHaveProperty('bookings');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });

    test('POST /api/admin/bookings/manual should create booking', async () => {
      const bookingData = {
        package_title: 'Test Package Automated',
        destination: 'Test City',
        country: 'Test Country',
        customer_name: 'Test Customer API',
        customer_email: `test-${Date.now()}@test.com`,
        customer_phone: '123456789',
        travelers_count: 2,
        travel_date: '2025-08-15',
        duration_days: 7,
        total_amount: 1999.99,
        currency: 'USD',
        special_requests: 'Created by automated test'
      };

      const response = await request(app)
        .post('/api/admin/bookings/manual')
        .set(devHeaders)
        .send(bookingData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('exitosamente');
      expect(response.body.data.booking).toHaveProperty('bookingReference');
      expect(response.body.data.booking.packageTitle).toBe(bookingData.package_title);
    });
  });

  describe('Admin Clients API', () => {
    test('GET /api/admin/clients should return real clients', async () => {
      const response = await request(app)
        .get('/api/admin/clients')
        .set(devHeaders);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('database');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('total');
    });

    test('POST /api/admin/clients should create client', async () => {
      const clientData = {
        firstName: 'Test',
        lastName: 'Client API',
        email: `testclient-${Date.now()}@test.com`,
        phone: '987654321'
      };

      const response = await request(app)
        .post('/api/admin/clients')
        .set(devHeaders)
        .send(clientData);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(clientData.email.toLowerCase());
    });
  });

  describe('Health and Integration', () => {
    test('GET /api/health should return system status', async () => {
      const response = await request(app)
        .get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.version).toBe('3.1.0-COMPLETE');
    });
  });
});

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true
};