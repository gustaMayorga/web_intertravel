// ===============================================
// RUTAS DE PAQUETES CORREGIDAS - INTERTRAVEL
// Sistema robusto con Travel Compositor + Fallbacks
// ===============================================

const express = require('express');
const router = express.Router();

// Cargar Travel Compositor específico para paquetes
let travelCompositor;
try {
  travelCompositor = require('../travel-compositor-packages');
  console.log('✅ Travel Compositor Packages cargado exitosamente');
} catch (error) {
  console.error('❌ Error cargando Travel Compositor Packages:', error.message);
  
  // Fallback mínimo si no se puede cargar
  travelCompositor = {
    getAllPackages: async () => ({
      packages: [{
        id: 'fallback-package',
        title: 'Paquete de Emergencia',
        description: 'Sistema en modo de emergencia',
        price: 50000,
        currency: 'ARS',
        destination: 'Argentina',
        country: 'Argentina',
        duration: 3,
        featured: true,
        _source: 'emergency-fallback'
      }],
      total: 1,
      source: 'emergency'
    }),
    getFeaturedPackages: async () => ({
      packages: [],
      total: 0,
      source: 'emergency'
    }),
    getPackageById: async () => null,
    searchPackages: async () => ({ packages: [], total: 0, source: 'emergency' })
  };
}

// ===============================================
// MIDDLEWARE DE LOGGING PARA PAQUETES
// ===============================================

function logPackageRequest(req, res, next) {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'unknown';
  console.log(`📦 [${timestamp}] ${req.method} ${req.originalUrl} - ${userAgent.substring(0, 50)}`);
  next();
}

router.use(logPackageRequest);

// ===============================================
// GET /api/packages - OBTENER TODOS LOS PAQUETES
// ===============================================

router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Extraer parámetros con valores por defecto
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const destination = req.query.destination;
    const country = req.query.country;
    const category = req.query.category;
    const includeDetails = req.query.details === 'true';

    console.log(`📦 Solicitando paquetes - Página: ${page}, Límite: ${limit}`);
    
    if (destination) console.log(`🎯 Filtro destino: ${destination}`);
    if (country) console.log(`🌍 Filtro país: ${country}`);
    if (category) console.log(`📂 Filtro categoría: ${category}`);

    // Obtener paquetes desde Travel Compositor
    const result = await travelCompositor.getAllPackages({
      page,
      limit,
      destination,
      country,
      category
    });

    const processingTime = Date.now() - startTime;

    // Preparar respuesta
    const response = {
      success: true,
      data: result.packages || [],
      pagination: {
        page: result.page || page,
        limit,
        total: result.total || 0,
        totalPages: result.totalPages || Math.ceil((result.total || 0) / limit),
        hasNext: (result.page || page) < (result.totalPages || 1),
        hasPrev: (result.page || page) > 1
      },
      metadata: {
        source: result.source || 'unknown',
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        totalResults: result.total || 0,
        filtersApplied: {
          destination: !!destination,
          country: !!country,
          category: !!category
        }
      }
    };

    // Log del resultado
    console.log(`✅ Paquetes entregados: ${response.data.length} de ${response.pagination.total} total`);
    console.log(`⏱️ Procesamiento: ${processingTime}ms desde ${response.metadata.source}`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error en GET /api/packages:', error);
    
    // Respuesta de error estructurada
    res.status(500).json({
      success: false,
      error: 'Error obteniendo paquetes',
      message: error.message,
      code: 'PACKAGES_FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// GET /api/packages/featured - PAQUETES DESTACADOS
// ===============================================

router.get('/featured', async (req, res) => {
  try {
    const startTime = Date.now();
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit) || 6));

    console.log(`⭐ Solicitando ${limit} paquetes destacados`);

    const result = await travelCompositor.getFeaturedPackages({ limit });
    const processingTime = Date.now() - startTime;

    // Enriquecer paquetes destacados con información adicional
    const enrichedPackages = (result.packages || []).map((pkg, index) => ({
      ...pkg,
      _featuredInfo: {
        position: index + 1,
        isFeatured: true,
        priorityScore: pkg.priorityScore || 0,
        source: pkg._source || 'unknown'
      },
      _displayInfo: {
        isPromoted: index < 3, // Primeros 3 son "promovidos"
        showBadge: pkg.category === 'premium',
        urgencyText: pkg.availability ? 'Disponible' : 'Consultar disponibilidad'
      }
    }));

    const response = {
      success: true,
      data: enrichedPackages,
      metadata: {
        totalFeatured: enrichedPackages.length,
        source: result.source || 'unknown',
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        promoted: enrichedPackages.slice(0, 3).map(p => p.id),
        categories: [...new Set(enrichedPackages.map(p => p.category))]
      }
    };

    console.log(`⭐ Destacados entregados: ${enrichedPackages.length} desde ${result.source}`);
    console.log(`⏱️ Procesamiento destacados: ${processingTime}ms`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error en GET /api/packages/featured:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo paquetes destacados',
      message: error.message,
      code: 'FEATURED_PACKAGES_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// GET /api/packages/:id - DETALLE DE PAQUETE
// ===============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const startTime = Date.now();
    const includeRelated = req.query.related === 'true';

    console.log(`🔍 Solicitando detalles del paquete: ${id}`);

    const packageData = await travelCompositor.getPackageById(id);
    
    if (!packageData) {
      console.log(`❌ Paquete ${id} no encontrado`);
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado',
        code: 'PACKAGE_NOT_FOUND',
        packageId: id,
        timestamp: new Date().toISOString()
      });
    }

    const processingTime = Date.now() - startTime;

    // Preparar respuesta con detalles enriquecidos
    const response = {
      success: true,
      data: {
        ...packageData,
        _detailsInfo: {
          viewedAt: new Date().toISOString(),
          processingTime: `${processingTime}ms`,
          hasItinerary: !!(packageData.itinerary && packageData.itinerary.length > 0),
          hasBookingInfo: !!packageData.bookingInfo,
          detailLevel: 'full'
        }
      },
      metadata: {
        source: packageData._source || 'unknown',
        lastUpdate: packageData._lastDetailUpdate || new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        packageId: id
      }
    };

    // Incluir paquetes relacionados si se solicita
    if (includeRelated && packageData.destination) {
      try {
        const relatedResult = await travelCompositor.getAllPackages({
          destination: packageData.destination,
          limit: 4
        });
        
        response.related = (relatedResult.packages || [])
          .filter(pkg => pkg.id !== id)
          .slice(0, 3)
          .map(pkg => ({
            id: pkg.id,
            title: pkg.title,
            price: pkg.price,
            currency: pkg.currency,
            duration: pkg.duration,
            images: pkg.images ? pkg.images.slice(0, 1) : []
          }));
          
        console.log(`🔗 Agregados ${response.related.length} paquetes relacionados`);
      } catch (relatedError) {
        console.warn('⚠️ Error obteniendo paquetes relacionados:', relatedError.message);
      }
    }

    console.log(`✅ Detalles del paquete ${id} entregados en ${processingTime}ms`);

    res.json(response);

  } catch (error) {
    console.error(`❌ Error obteniendo detalles del paquete ${req.params.id}:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo detalles del paquete',
      message: error.message,
      code: 'PACKAGE_DETAILS_ERROR',
      packageId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// GET /api/packages/search/advanced - BÚSQUEDA AVANZADA
// ===============================================

router.get('/search/advanced', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const searchOptions = {
      query: req.query.q,
      destination: req.query.destination,
      country: req.query.country,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
      page: Math.max(1, parseInt(req.query.page) || 1),
      limit: Math.min(50, Math.max(1, parseInt(req.query.limit) || 20))
    };

    // Filtrar opciones undefined
    Object.keys(searchOptions).forEach(key => {
      if (searchOptions[key] === null || searchOptions[key] === undefined || searchOptions[key] === '') {
        delete searchOptions[key];
      }
    });

    console.log('🔍 Búsqueda avanzada con opciones:', searchOptions);

    const result = await travelCompositor.searchPackages(searchOptions);
    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      data: result.packages || [],
      pagination: {
        page: result.page || searchOptions.page,
        limit: searchOptions.limit,
        total: result.total || 0,
        totalPages: result.totalPages || 1,
        hasNext: (result.page || searchOptions.page) < (result.totalPages || 1),
        hasPrev: (result.page || searchOptions.page) > 1
      },
      searchInfo: {
        query: searchOptions.query || null,
        filtersApplied: result.filters?.applied || Object.keys(searchOptions).filter(k => k !== 'page' && k !== 'limit'),
        resultCount: result.total || 0,
        processingTime: `${processingTime}ms`,
        searchId: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      metadata: {
        source: result.source || 'unknown',
        timestamp: new Date().toISOString()
      }
    };

    console.log(`🔍 Búsqueda completada: ${response.searchInfo.resultCount} resultados en ${processingTime}ms`);

    res.json(response);

  } catch (error) {
    console.error('❌ Error en búsqueda avanzada:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error en búsqueda avanzada',
      message: error.message,
      code: 'ADVANCED_SEARCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// GET /api/packages/system/status - ESTADO DEL SISTEMA
// ===============================================

router.get('/system/status', async (req, res) => {
  try {
    console.log('🔍 Solicitando estado del sistema de paquetes');

    // Obtener información del sistema desde Travel Compositor
    let systemInfo = {};
    if (typeof travelCompositor.getSystemInfo === 'function') {
      systemInfo = travelCompositor.getSystemInfo();
    }

    const response = {
      success: true,
      status: 'operational',
      data: {
        travelCompositor: {
          loaded: !!travelCompositor,
          hasGetAllPackages: typeof travelCompositor.getAllPackages === 'function',
          hasFeaturedPackages: typeof travelCompositor.getFeaturedPackages === 'function',
          hasGetPackageById: typeof travelCompositor.getPackageById === 'function',
          hasSearchPackages: typeof travelCompositor.searchPackages === 'function',
          systemInfo
        },
        endpoints: {
          getAllPackages: '/api/packages',
          getFeatured: '/api/packages/featured',
          getDetails: '/api/packages/:id',
          advancedSearch: '/api/packages/search/advanced',
          systemStatus: '/api/packages/system/status'
        },
        lastCheck: new Date().toISOString()
      }
    };

    console.log('✅ Estado del sistema de paquetes obtenido');

    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo estado del sistema:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estado del sistema',
      message: error.message,
      code: 'SYSTEM_STATUS_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===============================================

router.use((error, req, res, next) => {
  console.error('❌ Error no manejado en rutas de paquetes:', error);
  
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: 'Ocurrió un error inesperado en el sistema de paquetes',
    code: 'UNHANDLED_PACKAGES_ERROR',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Rutas de paquetes cargadas exitosamente con Travel Compositor integrado');

module.exports = router;
