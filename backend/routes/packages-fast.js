// ===============================================
// ENDPOINT OPTIMIZADO DE PACKAGES - RESPUESTA RÁPIDA
// ===============================================

const express = require('express');
const router = express.Router();

// Datos mock rápidos para testing
const MOCK_PACKAGES = [
  {
    id: 'PKG001',
    title: 'Bariloche 15 Años - Paquete Premium',
    destination: 'Bariloche',
    country: 'Argentina',
    price: { amount: 850, currency: 'USD' },
    duration: { days: 7, nights: 6 },
    category: 'Premium',
    rating: 4.8,
    featured: true,
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400'
  },
  {
    id: 'PKG002', 
    title: 'Europa Clásica - 15 Días',
    destination: 'Europa',
    country: 'Multi-país',
    price: { amount: 2200, currency: 'USD' },
    duration: { days: 15, nights: 14 },
    category: 'International',
    rating: 4.9,
    featured: true,
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400'
  },
  {
    id: 'PKG003',
    title: 'Disney Orlando - Familia Completa',
    destination: 'Orlando',
    country: 'Estados Unidos', 
    price: { amount: 1850, currency: 'USD' },
    duration: { days: 10, nights: 9 },
    category: 'Family',
    rating: 4.7,
    featured: true,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
  },
  {
    id: 'PKG004',
    title: 'Crucero por el Caribe',
    destination: 'Caribe',
    country: 'Multi-país',
    price: { amount: 1200, currency: 'USD' },
    duration: { days: 8, nights: 7 },
    category: 'Cruise',
    rating: 4.6,
    featured: false,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'
  },
  {
    id: 'PKG005',
    title: 'Cancún Todo Incluido',
    destination: 'Cancún',
    country: 'México',
    price: { amount: 950, currency: 'USD' },
    duration: { days: 6, nights: 5 },
    category: 'Beach',
    rating: 4.5,
    featured: false,
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
  }
];

// GET /api/packages - VERSIÓN RÁPIDA
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Parámetros con valores por defecto
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 12));
    const destination = req.query.destination?.toLowerCase();
    const category = req.query.category?.toLowerCase();
    const search = req.query.search?.toLowerCase();
    
    console.log(`📦 Packages API - Page: ${page}, Limit: ${limit}`);
    
    // Filtrar paquetes mock
    let filteredPackages = [...MOCK_PACKAGES];
    
    if (destination) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.destination.toLowerCase().includes(destination)
      );
    }
    
    if (category) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.category.toLowerCase().includes(category)
      );
    }
    
    if (search) {
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.title.toLowerCase().includes(search) ||
        pkg.destination.toLowerCase().includes(search)
      );
    }
    
    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPackages = filteredPackages.slice(startIndex, endIndex);
    
    // Calcular metadata
    const totalPackages = filteredPackages.length;
    const totalPages = Math.ceil(totalPackages / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Packages API - ${paginatedPackages.length} packages returned in ${responseTime}ms`);
    
    res.json({
      success: true,
      data: {
        packages: paginatedPackages,
        pagination: {
          page,
          limit,
          total: totalPackages,
          pages: totalPages,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage
        },
        filters: {
          destination,
          category,
          search
        },
        meta: {
          responseTime: `${responseTime}ms`,
          source: 'mock_data',
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error en packages API:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/packages/:id - PAQUETE ESPECÍFICO
router.get('/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    
    const package = MOCK_PACKAGES.find(pkg => pkg.id === packageId);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }
    
    // Agregar detalles adicionales para vista específica
    const detailedPackage = {
      ...package,
      description: `Descubre ${package.destination} con nuestro paquete ${package.category.toLowerCase()}. Incluye alojamiento, traslados y actividades exclusivas.`,
      included: [
        'Alojamiento en hotel 4/5 estrellas',
        'Traslados aeropuerto-hotel',
        'Desayuno incluido',
        'Guía turístico profesional',
        'Actividades programadas',
        'Seguro de viaje'
      ],
      notIncluded: [
        'Vuelos internacionales',
        'Comidas no especificadas',
        'Actividades opcionales',
        'Gastos personales'
      ],
      cancellation: 'Cancelación gratuita hasta 30 días antes del viaje',
      availability: 'Disponible'
    };
    
    console.log(`✅ Package details retrieved: ${packageId}`);
    
    res.json({
      success: true,
      data: {
        package: detailedPackage
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting package details:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/packages/search - BÚSQUEDA AVANZADA
router.post('/search', async (req, res) => {
  try {
    const { 
      destination,
      startDate,
      endDate,
      adults = 2,
      children = 0,
      budget,
      category
    } = req.body;
    
    console.log('🔍 Advanced search request:', req.body);
    
    // Simular búsqueda avanzada
    let results = [...MOCK_PACKAGES];
    
    if (destination) {
      results = results.filter(pkg => 
        pkg.destination.toLowerCase().includes(destination.toLowerCase())
      );
    }
    
    if (budget) {
      results = results.filter(pkg => pkg.price.amount <= budget);
    }
    
    if (category) {
      results = results.filter(pkg => 
        pkg.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Ordenar por relevancia (featured primero, luego por rating)
    results.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });
    
    res.json({
      success: true,
      data: {
        packages: results,
        searchParams: {
          destination,
          startDate,
          endDate,
          adults,
          children,
          budget,
          category
        },
        resultsCount: results.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error in advanced search:', error);
    res.status(500).json({
      success: false,
      error: 'Error en la búsqueda'
    });
  }
});

module.exports = router;
