// ===============================================
// RUTAS DE PAQUETES OPTIMIZADAS - SCROLL INFINITO + UX MEJORADA
// ===============================================

const express = require('express');
const router = express.Router();

// Cargar Travel Compositor optimizado
let travelCompositor;
try {
  travelCompositor = require('../travel-compositor-optimized');
  console.log('✅ Travel Compositor optimizado cargado');
} catch (error) {
  console.error('❌ Error cargando Travel Compositor optimizado:', error.message);
  process.exit(1);
}

// ===============================================
// GET /api/packages - SCROLL INFINITO
// ===============================================

router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Parámetros optimizados para scroll infinito
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(8, parseInt(req.query.limit) || 12)); // 12 por defecto para grid
    const destination = req.query.destination;
    const category = req.query.category;
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : null;

    console.log(`📦 Scroll Infinito - Página: ${page}, Límite: ${limit}`);
    
    // Obtener paquetes con prioridad API real
    const result = await travelCompositor.getAllPackages({
      page,
      limit,
      destination,
      category
    });

    // Aplicar filtros de precio si se especifican
    let filteredPackages = result.packages;
    if (minPrice || maxPrice) {
      filteredPackages = result.packages.filter(pkg => {
        if (minPrice && pkg.price < minPrice) return false;
        if (maxPrice && pkg.price > maxPrice) return false;
        return true;
      });
    }

    const processingTime = Date.now() - startTime;

    // Respuesta optimizada para scroll infinito
    const response = {
      success: true,
      data: filteredPackages,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: result.hasMore && page < result.totalPages,
        nextPage: result.hasMore && page < result.totalPages ? page + 1 : null
      },
      metadata: {
        source: result.source,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        isRealData: result.source.includes('api'),
        loadedFromAPI: result.source === 'travel-compositor-api'
      }
    };

    console.log(`✅ Scroll: ${filteredPackages.length} paquetes (${result.source}) - ${processingTime}ms`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error en scroll infinito:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error cargando paquetes',
      message: error.message,
      code: 'SCROLL_ERROR'
    });
  }
});

// ===============================================
// GET /api/packages/featured - DESTACADOS PARA HERO
// ===============================================

router.get('/featured', async (req, res) => {
  try {
    const startTime = Date.now();
    const limit = Math.min(8, Math.max(3, parseInt(req.query.limit) || 6));

    console.log(`⭐ Cargando ${limit} paquetes destacados para hero`);

    // Obtener todos los paquetes y filtrar destacados
    const allResult = await travelCompositor.getAllPackages({ limit: 30 });
    
    // Filtrar y ordenar destacados
    const featuredPackages = allResult.packages
      .filter(pkg => pkg.featured === true)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit);

    // Si no hay suficientes destacados, agregar los de mayor prioridad
    if (featuredPackages.length < limit) {
      const additionalPackages = allResult.packages
        .filter(pkg => pkg.featured !== true)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, limit - featuredPackages.length);
      
      featuredPackages.push(...additionalPackages);
    }

    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: featuredPackages,
      metadata: {
        totalFeatured: featuredPackages.length,
        source: allResult.source + '-featured',
        processingTime: `${processingTime}ms`,
        isRealData: allResult.source.includes('api'),
        recommendedForHero: true
      }
    };

    console.log(`⭐ Destacados: ${featuredPackages.length} para hero (${allResult.source})`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error en paquetes destacados:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error cargando destacados',
      message: error.message,
      code: 'FEATURED_ERROR'
    });
  }
});

// ===============================================
// GET /api/packages/search/simple - BÚSQUEDA SIMPLE HERO
// ===============================================

router.get('/search/simple', async (req, res) => {
  try {
    const startTime = Date.now();
    const destination = req.query.destination || req.query.q;
    const limit = parseInt(req.query.limit) || 20;

    if (!destination || destination.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Destino requerido (mínimo 2 caracteres)',
        code: 'INVALID_SEARCH_QUERY'
      });
    }

    console.log(`🔍 Búsqueda simple: "${destination}"`);

    // Usar método optimizado de búsqueda por destino
    const searchResult = await travelCompositor.searchByDestination(destination, { limit });

    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: searchResult.packages,
      searchInfo: {
        query: destination,
        total: searchResult.total,
        processingTime: `${processingTime}ms`,
        searchType: 'simple_destination'
      },
      metadata: {
        source: searchResult.source,
        isRealData: searchResult.source.includes('api'),
        timestamp: new Date().toISOString()
      }
    };

    console.log(`🔍 Búsqueda "${destination}": ${searchResult.total} resultados - ${processingTime}ms`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error en búsqueda simple:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error en búsqueda',
      message: error.message,
      code: 'SIMPLE_SEARCH_ERROR'
    });
  }
});

// ===============================================
// GET /api/packages/:id/modal - DETALLES PARA MODAL
// ===============================================

router.get('/:id/modal', async (req, res) => {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    console.log(`📋 Cargando detalles para modal: ${id}`);

    // Obtener todos los paquetes para buscar el específico
    const allResult = await travelCompositor.getAllPackages({ limit: 100 });
    const packageData = allResult.packages.find(pkg => pkg.id === id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado',
        code: 'PACKAGE_NOT_FOUND',
        packageId: id
      });
    }

    // Enriquecer datos para modal
    const enrichedPackage = {
      ...packageData,
      modalInfo: {
        viewedAt: new Date().toISOString(),
        optimizedForModal: true,
        hasItinerary: !!(packageData.itinerary && packageData.itinerary.length > 0),
        hasInclusions: !!(packageData.inclusions && packageData.inclusions.length > 0)
      },
      whatsappInfo: {
        number: process.env.WHATSAPP_NUMBER || '+5411987654321',
        message: this.generateWhatsAppMessage(packageData)
      }
    };

    // Buscar paquetes relacionados
    const relatedPackages = allResult.packages
      .filter(pkg => 
        pkg.id !== id && 
        (pkg.destination === packageData.destination || pkg.category === packageData.category)
      )
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3)
      .map(pkg => ({
        id: pkg.id,
        title: pkg.title,
        price: pkg.price,
        currency: pkg.currency,
        duration: pkg.duration,
        destination: pkg.destination,
        images: pkg.images ? pkg.images.slice(0, 1) : []
      }));

    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: enrichedPackage,
      related: relatedPackages,
      metadata: {
        source: allResult.source,
        processingTime: `${processingTime}ms`,
        packageId: id,
        optimizedForModal: true,
        relatedCount: relatedPackages.length
      }
    };

    console.log(`📋 Modal ${id}: Cargado en ${processingTime}ms con ${relatedPackages.length} relacionados`);

    res.json(response);

  } catch (error) {
    console.error(`❌ Error cargando modal para ${req.params.id}:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Error cargando detalles',
      message: error.message,
      code: 'MODAL_DETAILS_ERROR',
      packageId: req.params.id
    });
  }
});

// ===============================================
// GET /api/packages/filters/options - OPCIONES PARA FILTROS
// ===============================================

router.get('/filters/options', async (req, res) => {
  try {
    console.log('🔧 Obteniendo opciones de filtros');

    // Obtener todos los paquetes para extraer opciones
    const allResult = await travelCompositor.getAllPackages({ limit: 100 });
    const packages = allResult.packages;

    // Extraer opciones únicas
    const destinations = [...new Set(packages.map(pkg => pkg.destination))].sort();
    const categories = [...new Set(packages.map(pkg => pkg.category))].sort();
    const countries = [...new Set(packages.map(pkg => pkg.country))].sort();
    
    // Calcular rangos de precio
    const prices = packages.map(pkg => pkg.price).filter(p => p > 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Rangos de duración
    const durations = packages.map(pkg => pkg.duration).filter(d => d > 0);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    const response = {
      success: true,
      data: {
        destinations: destinations.map(dest => ({
          value: dest,
          label: dest,
          count: packages.filter(pkg => pkg.destination === dest).length
        })),
        categories: categories.map(cat => ({
          value: cat,
          label: this.formatCategoryLabel(cat),
          count: packages.filter(pkg => pkg.category === cat).length
        })),
        countries: countries.map(country => ({
          value: country,
          label: country,
          count: packages.filter(pkg => pkg.country === country).length
        })),
        priceRange: {
          min: minPrice,
          max: maxPrice,
          step: 10000
        },
        durationRange: {
          min: minDuration,
          max: maxDuration,
          step: 1
        }
      },
      metadata: {
        totalPackages: packages.length,
        source: allResult.source,
        lastUpdate: new Date().toISOString()
      }
    };

    console.log(`🔧 Opciones de filtros: ${destinations.length} destinos, ${categories.length} categorías`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo opciones de filtros:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error cargando opciones de filtros',
      message: error.message,
      code: 'FILTERS_OPTIONS_ERROR'
    });
  }
});

// ===============================================
// GET /api/packages/connection/status - ESTADO DE CONEXIÓN
// ===============================================

router.get('/connection/status', async (req, res) => {
  try {
    const connectionStatus = travelCompositor.getConnectionStatus();
    
    const response = {
      success: true,
      connection: connectionStatus,
      system: {
        operational: true,
        apiPriority: true,
        fallbackAvailable: true,
        lastCheck: new Date().toISOString()
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo estado de conexión:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado',
      code: 'CONNECTION_STATUS_ERROR'
    });
  }
});

// ===============================================
// UTILIDADES
// ===============================================

function generateWhatsAppMessage(packageData) {
  return `Hola! Me interesa el paquete "${packageData.title}" de ${packageData.duration} días a ${packageData.destination} por $${packageData.price.toLocaleString()} ${packageData.currency}. ¿Podrían darme más información?`;
}

function formatCategoryLabel(category) {
  const labels = {
    'premium': 'Premium',
    'familiar': 'Familiar',
    'cultural': 'Cultural',
    'gourmet': 'Gourmet',
    'urbano': 'Urbano',
    'aventura': 'Aventura'
  };
  return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

// ===============================================
// MIDDLEWARE DE ERROR
// ===============================================

router.use((error, req, res, next) => {
  console.error('❌ Error no manejado en paquetes optimizados:', error);
  
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: 'Error inesperado en sistema de paquetes',
    code: 'UNHANDLED_PACKAGES_ERROR'
  });
});

// Agregar método faltante al router
router.generateWhatsAppMessage = generateWhatsAppMessage;
router.formatCategoryLabel = formatCategoryLabel;

console.log('✅ Rutas de paquetes optimizadas cargadas - Scroll infinito + UX mejorada');

module.exports = router;
