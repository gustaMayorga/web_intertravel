// ===============================================
// RUTAS DE PAQUETES SIMPLE - EMERGENCY FALLBACK
// ===============================================

const express = require('express');
const router = express.Router();

// Mock data para emergencia
const mockPackages = [
  {
    id: 'pkg-001',
    title: 'París Romántico',
    destination: 'París, Francia',
    country: 'Francia',
    price: 2299,
    currency: 'USD',
    duration: '7 días / 6 noches',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800',
    rating: 4.8,
    featured: true
  },
  {
    id: 'pkg-002',
    title: 'Tokio Moderno',
    destination: 'Tokio, Japón',
    country: 'Japón',
    price: 3200,
    currency: 'USD',
    duration: '10 días / 9 noches',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    rating: 4.9,
    featured: true
  },
  {
    id: 'pkg-003',
    title: 'Cusco Místico',
    destination: 'Cusco, Perú',
    country: 'Perú',
    price: 1890,
    currency: 'USD',
    duration: '5 días / 4 noches',
    image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    rating: 4.7,
    featured: true
  },
  {
    id: 'pkg-004',
    title: 'Bali Paradisíaco',
    destination: 'Bali, Indonesia',
    country: 'Indonesia',
    price: 1650,
    currency: 'USD',
    duration: '6 días / 5 noches',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800',
    rating: 4.6,
    featured: false
  },
  {
    id: 'pkg-005',
    title: 'Islandia Aventura',
    destination: 'Reykjavik, Islandia',
    country: 'Islandia',
    price: 2800,
    currency: 'USD',
    duration: '8 días / 7 noches',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    rating: 4.8,
    featured: false
  },
  {
    id: 'pkg-006',
    title: 'Dubai Lujo',
    destination: 'Dubai, EAU',
    country: 'Emiratos Árabes Unidos',
    price: 2400,
    currency: 'USD',
    duration: '5 días / 4 noches',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
    rating: 4.5,
    featured: false
  }
];

// ===============================================
// GET /api/packages - SIMPLE VERSION
// ===============================================
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedPackages = mockPackages.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedPackages,
      pagination: {
        page,
        limit,
        total: mockPackages.length,
        totalPages: Math.ceil(mockPackages.length / limit),
        hasMore: endIndex < mockPackages.length
      },
      source: 'emergency-mock',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Packages emergency route: ${paginatedPackages.length} packages returned`);
    
  } catch (error) {
    console.error('❌ Error in emergency packages route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ===============================================
// GET /api/packages/featured - SIMPLE VERSION
// ===============================================
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const featuredPackages = mockPackages
      .filter(pkg => pkg.featured)
      .slice(0, limit);
    
    res.json({
      success: true,
      packages: featuredPackages,
      total: featuredPackages.length,
      source: 'emergency-mock-featured',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Featured packages emergency route: ${featuredPackages.length} packages returned`);
    
  } catch (error) {
    console.error('❌ Error in emergency featured route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ===============================================
// GET /api/packages/:id - SIMPLE VERSION
// ===============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const package = mockPackages.find(pkg => pkg.id === id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Package not found',
        message: `Package with id ${id} not found`
      });
    }
    
    res.json({
      success: true,
      package,
      source: 'emergency-mock-detail',
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Package detail emergency route: ${id} returned`);
    
  } catch (error) {
    console.error('❌ Error in emergency package detail route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

console.log('🚨 Emergency packages routes loaded - using mock data');

module.exports = router;