
const express = require('express');
const router = express.Router();

// GET /api/admin/fallback/config
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      enabled: true,
      mode: 'development',
      endpoints: ['packages', 'users', 'bookings'],
      last_updated: new Date().toISOString()
    }
  });
});

// GET /api/admin/fallback/stats
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      total_requests: 1250,
      successful: 1200,
      failed: 50,
      uptime: '99.6%',
      last_24h: {
        requests: 350,
        errors: 5
      }
    }
  });
});

module.exports = router;
