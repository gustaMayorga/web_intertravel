// ===============================================
// RUTAS DE PAQUETES FUNCIONAL COMPLETO
// ===============================================

const express = require('express');
const router = express.Router();
const { applyPrioritySystem, searchWithPriority, getActiveKeywords, getKeywordStats } = require('../priority-system');

// Cargar Travel Compositor con fallback robusto
let travelCompositor;
let tcAvailable = false;

try {
  travelCompositor = require('../travel-compositor-fast');
  tcAvailable = true;
  console.log('✅ Travel Compositor cargado - API externa funcional');
} catch (error) {
  console.error('❌ Error cargando Travel Compositor:', error.message);
  console.log('🔄 Continuando sin TC - se usará base de datos local');
  tcAvailable = false;
}

// ===============================================
// GET /api/packages - BÚSQUEDA CON PRIORIZACIÓN
// ===============================================

router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Parámetros de búsqueda
    const {
      page = 1,
      limit = 12,
      search,
      destination,
      category,
      minPrice,
      maxPrice,
      sortBy = 'priority' // priority, price, rating, date
    } = req.query;

    console.log(`📦 Búsqueda packages: ${search || 'all'} | Página: ${page} | Límite: ${limit}`);
    
    let packages = [];
    let source = 'unknown';

    // FUENTE 1: Travel Compositor (prioritario)
    if (tcAvailable) {
      try {
        console.log('🌐 Obteniendo paquetes de Travel Compositor...');
        const tcResult = await travelCompositor.getAllPackages();
        
        if (tcResult && tcResult.packages) {
          packages = tcResult.packages;
          source = 'travel-compositor-api';
          console.log(`✅ ${packages.length} paquetes obtenidos de Travel Compositor`);
        }
      } catch (tcError) {
        console.error('❌ Error obteniendo de Travel Compositor:', tcError.message);
        tcAvailable = false; // Desactivar para próximas llamadas
      }
    }

    // FUENTE 2: Base de datos local (fallback o complemento)
    if (packages.length === 0) {
      try {
        const { query: dbQuery } = require('../database');
        console.log('🗃️ Obteniendo paquetes de base de datos local...');
        
        const dbResult = await dbQuery(`
          SELECT 
            package_id as id,
            title,
            destination,
            country,
            price_amount as price,
            price_currency as currency,
            duration_days,
            duration_nights,
            category,
            description_short as description,
            images,
            features,
            rating_average as rating,
            is_featured,
            status,
            created_at
          FROM packages 
          WHERE status = 'active'
          ORDER BY created_at DESC
          LIMIT 50
        `);
        
        packages = dbResult.rows.map(pkg => ({
          ...pkg,
          images: pkg.images ? JSON.parse(pkg.images) : [],
          features: pkg.features ? JSON.parse(pkg.features) : []
        }));
        
        source = 'database-local';
        console.log(`✅ ${packages.length} paquetes obtenidos de base de datos`);
      } catch (dbError) {
        console.error('❌ Error obteniendo de base de datos:', dbError.message);
        source = 'error-fallback';
      }
    }

    // Si no hay paquetes de ninguna fuente, usar datos mínimos
    if (packages.length === 0) {
      packages = [
        {
          id: 'demo-001',
          title: 'Cusco Místico - Machu Picchu',
          destination: 'Cusco, Perú',
          country: 'Perú',
          price: 1890,
          currency: 'USD',
          duration_days: 5,
          category: 'cultural',
          description: 'Descubre la magia de Machu Picchu en este tour premium',
          rating: 4.8,
          images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800'],
          features: ['Guía especializado', 'Tren Vistadome', 'Hoteles premium']
        },
        {
          id: 'demo-002', 
          title: 'París Romántico Premium',
          destination: 'París, Francia',
          country: 'Francia',
          price: 2299,
          currency: 'USD',
          duration_days: 7,
          category: 'romantic',
          description: 'La ciudad del amor te espera con experiencias únicas',
          rating: 4.9,
          images: ['https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800'],
          features: ['Torre Eiffel VIP', 'Crucero por el Sena', 'Cenas gourmet']
        }
      ];
      source = 'demo-minimal';
      console.log('⚠️ Usando datos demo mínimos');
    }

    // APLICAR PRIORIZACIÓN REAL
    let processedPackages;
    if (search) {
      processedPackages = searchWithPriority(packages, search);
      console.log(`🔍 Búsqueda aplicada: "${search}" - ${processedPackages.length} resultados`);
    } else {
      processedPackages = applyPrioritySystem(packages);
      console.log(`🎯 Priorización aplicada - ${processedPackages.filter(p => p.isPrioritized).length} priorizados`);
    }

    // APLICAR FILTROS
    if (destination) {
      processedPackages = processedPackages.filter(pkg => 
        pkg.destination?.toLowerCase().includes(destination.toLowerCase()) ||
        pkg.country?.toLowerCase().includes(destination.toLowerCase())
      );
    }

    if (category) {
      processedPackages = processedPackages.filter(pkg => 
        pkg.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (minPrice || maxPrice) {
      processedPackages = processedPackages.filter(pkg => {
        const price = pkg.price || 0;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // APLICAR ORDENAMIENTO
    if (sortBy !== 'priority') {
      processedPackages.sort((a, b) => {
        switch (sortBy) {
          case 'price':
            return (a.price || 0) - (b.price || 0);
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'date':
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          default:
            return 0;
        }
      });
    }

    // PAGINACIÓN
    const total = processedPackages.length;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedPackages = processedPackages.slice(startIndex, endIndex);
    const totalPages = Math.ceil(total / limitNum);
    const hasMore = pageNum < totalPages;

    const processingTime = Date.now() - startTime;

    // RESPUESTA COMPLETA
    const response = {
      success: true,
      data: paginatedPackages,
      packages: paginatedPackages, // Alias para compatibilidad
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasMore,
        nextPage: hasMore ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
      },
      metadata: {
        source,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        searchQuery: search || null,
        filtersApplied: {
          destination: destination || null,
          category: category || null,
          priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null
        },
        prioritizationActive: true,
        keywordsMatched: search ? getActiveKeywords().length : 0
      }
    };

    console.log(`✅ Packages: ${paginatedPackages.length}/${total} (${source}) - ${processingTime}ms`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error en /api/packages:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// GET /api/packages/featured - DESTACADOS PRIORIZADOS
// ===============================================

router.get('/featured', async (req, res) => {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit) || 6));
    console.log(`⭐ Solicitando ${limit} paquetes destacados`);

    let packages = [];
    let source = 'unknown';

    // Intentar obtener de Travel Compositor
    if (tcAvailable) {
      try {
        const tcResult = await travelCompositor.getFeaturedPackages ? 
          await travelCompositor.getFeaturedPackages(limit) :
          await travelCompositor.getAllPackages();
        
        if (tcResult && tcResult.packages) {
          packages = tcResult.packages;
          source = 'travel-compositor-featured';
        }
      } catch (tcError) {
        console.error('❌ Error TC featured:', tcError.message);
      }
    }

    // Fallback a base de datos
    if (packages.length === 0) {
      try {
        const { query: dbQuery } = require('../database');
        const dbResult = await dbQuery(`
          SELECT 
            package_id as id, title, destination, country, price_amount as price,
            price_currency as currency, category, description_short as description,
            images, rating_average as rating, is_featured
          FROM packages 
          WHERE status = 'active' AND is_featured = true
          ORDER BY rating_average DESC, created_at DESC
          LIMIT $1
        `, [limit]);
        
        packages = dbResult.rows.map(pkg => ({
          ...pkg,
          images: pkg.images ? JSON.parse(pkg.images) : []
        }));
        source = 'database-featured';
      } catch (dbError) {
        console.error('❌ Error DB featured:', dbError.message);
      }
    }

    // Aplicar priorización a destacados
    const prioritizedFeatured = applyPrioritySystem(packages).slice(0, limit);

    res.json({
      success: true,
      packages: prioritizedFeatured,
      total: prioritizedFeatured.length,
      source,
      timestamp: new Date().toISOString(),
      prioritized: true
    });

    console.log(`✅ Featured: ${prioritizedFeatured.length} paquetes (${source})`);

  } catch (error) {
    console.error('❌ Error en /api/packages/featured:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ===============================================
// GET /api/packages/search - BÚSQUEDA AVANZADA
// ===============================================

router.get('/search', async (req, res) => {
  try {
    const { q, destination, startDate, endDate, adults, children } = req.query;
    
    console.log(`🔍 Búsqueda avanzada: "${q}" | Destino: ${destination} | Adultos: ${adults}`);

    // Reutilizar la lógica de búsqueda principal
    req.query.search = q;
    req.query.page = req.query.page || 1;
    req.query.limit = req.query.limit || 20;
    
    // Redirigir a la búsqueda principal pero con metadata específica
    const mainSearchReq = { ...req };
    const mainSearchRes = {
      json: (data) => {
        // Agregar metadata específica de búsqueda avanzada
        const enhancedData = {
          ...data,
          searchInfo: {
            query: q,
            destination,
            startDate,
            endDate,
            travelers: {
              adults: parseInt(adults) || 1,
              children: parseInt(children) || 0
            },
            searchType: 'advanced',
            timestamp: new Date().toISOString()
          }
        };
        res.json(enhancedData);
      },
      status: (code) => ({ json: (data) => res.status(code).json(data) })
    };

    // Ejecutar búsqueda principal
    return router.get._handlers[0](mainSearchReq, mainSearchRes);

  } catch (error) {
    console.error('❌ Error en búsqueda avanzada:', error);
    res.status(500).json({
      success: false,
      error: 'Error en búsqueda avanzada',
      message: error.message
    });
  }
});

// ===============================================
// GET /api/packages/:id - DETALLE CON PRIORITIZACIÓN
// ===============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Solicitando detalle de paquete: ${id}`);

    let packageDetail = null;
    let source = 'unknown';

    // Buscar en Travel Compositor
    if (tcAvailable) {
      try {
        const tcResult = await travelCompositor.getPackageDetail ? 
          await travelCompositor.getPackageDetail(id) :
          await travelCompositor.getAllPackages();
        
        if (tcResult && tcResult.packages) {
          packageDetail = tcResult.packages.find(pkg => pkg.id === id);
          source = 'travel-compositor-detail';
        }
      } catch (tcError) {
        console.error('❌ Error TC detail:', tcError.message);
      }
    }

    // Buscar en base de datos
    if (!packageDetail) {
      try {
        const { query: dbQuery } = require('../database');
        const dbResult = await dbQuery(`
          SELECT 
            package_id as id, title, destination, country, price_amount as price,
            price_currency as currency, duration_days, duration_nights,
            category, description_short, description_full as description,
            images, features, rating_average as rating, rating_count,
            is_featured, status, created_at, updated_at
          FROM packages 
          WHERE package_id = $1 AND status = 'active'
        `, [id]);
        
        if (dbResult.rows.length > 0) {
          packageDetail = {
            ...dbResult.rows[0],
            images: dbResult.rows[0].images ? JSON.parse(dbResult.rows[0].images) : [],
            features: dbResult.rows[0].features ? JSON.parse(dbResult.rows[0].features) : []
          };
          source = 'database-detail';
        }
      } catch (dbError) {
        console.error('❌ Error DB detail:', dbError.message);
      }
    }

    if (!packageDetail) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado',
        message: `El paquete con ID ${id} no existe`,
        timestamp: new Date().toISOString()
      });
    }

    // Aplicar análisis de priorización al paquete
    const [prioritizedPackage] = applyPrioritySystem([packageDetail]);

    res.json({
      success: true,
      package: prioritizedPackage,
      source,
      cached: false,
      timestamp: new Date().toISOString(),
      priorityInfo: {
        score: prioritizedPackage.priorityScore || 0,
        keywords: prioritizedPackage.matchedKeywords || [],
        isPrioritized: prioritizedPackage.isPrioritized || false
      }
    });

    console.log(`✅ Package detail: ${id} (${source}) - Score: ${prioritizedPackage.priorityScore || 0}`);

  } catch (error) {
    console.error('❌ Error en package detail:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo detalle del paquete',
      message: error.message
    });
  }
});

// ===============================================
// GET /api/packages/stats/keywords - ESTADÍSTICAS
// ===============================================

router.get('/stats/keywords', async (req, res) => {
  try {
    console.log('📊 Generando estadísticas de keywords...');

    // Obtener todos los paquetes para análisis
    let packages = [];
    
    if (tcAvailable) {
      try {
        const tcResult = await travelCompositor.getAllPackages();
        packages = tcResult.packages || [];
      } catch (tcError) {
        console.error('❌ Error obteniendo packages para stats:', tcError.message);
      }
    }

    // Generar estadísticas
    const keywordStats = getKeywordStats(packages);
    const activeKeywords = getActiveKeywords();

    res.json({
      success: true,
      stats: {
        totalPackages: packages.length,
        totalKeywords: activeKeywords.length,
        keywordDetails: keywordStats,
        prioritizedPackages: packages.filter(pkg => 
          applyPrioritySystem([pkg])[0].isPrioritized
        ).length
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Keyword stats generadas: ${activeKeywords.length} keywords activas`);

  } catch (error) {
    console.error('❌ Error en keyword stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error generando estadísticas',
      message: error.message
    });
  }
});

console.log('📦 Rutas de packages funcionales cargadas con priorización real');

module.exports = router;