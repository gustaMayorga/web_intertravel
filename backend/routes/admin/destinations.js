// ===============================================
// ADMIN DESTINATIONS - GESTIÓN DE DESTINOS
// Backend API para gestión completa de destinos
// ===============================================

const express = require('express');
const router = express.Router();
const { query } = require('../../database');

// ===============================================
// GET /api/admin/destinations - LISTAR DESTINOS
// ===============================================
router.get('/', async (req, res) => {
  try {
    console.log('🌍 Admin Destinations - Listando destinos');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const country = req.query.country || '';
    const status = req.query.status || '';

    try {
      // Construir query con filtros
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`(destination ILIKE $${paramIndex} OR title ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (country && country !== 'all') {
        whereConditions.push(`country = $${paramIndex}`);
        queryParams.push(country);
        paramIndex++;
      }

      if (status && status !== 'all') {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      // Query principal
      const destinationsQuery = `
        SELECT 
          destination,
          country,
          COUNT(*) as package_count,
          AVG(price_amount) as avg_price,
          MIN(price_amount) as min_price,
          MAX(price_amount) as max_price,
          AVG(rating_average) as avg_rating,
          SUM(rating_count) as total_reviews,
          MAX(updated_at) as last_updated
        FROM packages 
        ${whereClause}
        GROUP BY destination, country
        ORDER BY package_count DESC, destination ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      const result = await query(destinationsQuery, queryParams);
      const destinations = result.rows || [];

      // Procesar datos
      const processedDestinations = destinations.map(dest => ({
        id: `${dest.destination}-${dest.country}`.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: dest.destination,
        country: dest.country,
        package_count: parseInt(dest.package_count) || 0,
        avg_price: parseFloat(dest.avg_price || 0).toFixed(2),
        min_price: parseFloat(dest.min_price || 0).toFixed(2),
        max_price: parseFloat(dest.max_price || 0).toFixed(2),
        avg_rating: parseFloat(dest.avg_rating || 0).toFixed(1),
        total_reviews: parseInt(dest.total_reviews) || 0,
        last_updated: dest.last_updated,
        status: 'active'
      }));

      res.json({
        success: true,
        data: processedDestinations,
        pagination: {
          page,
          limit,
          total: processedDestinations.length,
          pages: Math.ceil(processedDestinations.length / limit)
        },
        message: `${processedDestinations.length} destinos encontrados`
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, usando datos de fallback:', dbError.message);
      
      // Datos de fallback
      const fallbackDestinations = [
        {
          id: 'mendoza-argentina',
          name: 'Mendoza',
          country: 'Argentina',
          package_count: 8,
          avg_price: '1250.00',
          min_price: '450.00',
          max_price: '2800.00',
          avg_rating: '4.7',
          total_reviews: 234,
          last_updated: new Date('2024-12-20'),
          status: 'active'
        },
        {
          id: 'buenos-aires-argentina',
          name: 'Buenos Aires',
          country: 'Argentina',
          package_count: 12,
          avg_price: '980.00',
          min_price: '320.00',
          max_price: '1900.00',
          avg_rating: '4.5',
          total_reviews: 456,
          last_updated: new Date('2024-12-19'),
          status: 'active'
        },
        {
          id: 'paris-francia',
          name: 'París',
          country: 'Francia',
          package_count: 6,
          avg_price: '2150.00',
          min_price: '1200.00',
          max_price: '3500.00',
          avg_rating: '4.8',
          total_reviews: 189,
          last_updated: new Date('2024-12-18'),
          status: 'active'
        },
        {
          id: 'cancun-mexico',
          name: 'Cancún',
          country: 'México',
          package_count: 9,
          avg_price: '1680.00',
          min_price: '890.00',
          max_price: '2400.00',
          avg_rating: '4.6',
          total_reviews: 312,
          last_updated: new Date('2024-12-17'),
          status: 'active'
        },
        {
          id: 'machu-picchu-peru',
          name: 'Machu Picchu',
          country: 'Perú',
          package_count: 4,
          avg_price: '1920.00',
          min_price: '1450.00',
          max_price: '2650.00',
          avg_rating: '4.9',
          total_reviews: 167,
          last_updated: new Date('2024-12-16'),
          status: 'active'
        }
      ];

      res.json({
        success: true,
        data: fallbackDestinations,
        pagination: {
          page: 1,
          limit: 50,
          total: fallbackDestinations.length,
          pages: 1
        },
        message: `${fallbackDestinations.length} destinos (datos de fallback)`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error en GET /admin/destinations:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener destinos',
      error: error.message
    });
  }
});

// ===============================================
// GET /api/admin/destinations/:id - OBTENER DESTINO ESPECÍFICO
// ===============================================
router.get('/:id', async (req, res) => {
  try {
    const destinationId = req.params.id;
    console.log(`🌍 Admin Destinations - Obteniendo destino: ${destinationId}`);

    try {
      // Extraer nombre y país del ID
      const parts = destinationId.split('-');
      const destination = parts.slice(0, -1).join(' ');
      const country = parts[parts.length - 1];

      const destinationQuery = `
        SELECT 
          destination,
          country,
          COUNT(*) as package_count,
          AVG(price_amount) as avg_price,
          MIN(price_amount) as min_price,
          MAX(price_amount) as max_price,
          AVG(rating_average) as avg_rating,
          SUM(rating_count) as total_reviews,
          array_agg(DISTINCT category) as categories,
          MAX(updated_at) as last_updated
        FROM packages 
        WHERE destination ILIKE $1 AND country ILIKE $2
        GROUP BY destination, country
      `;

      const result = await query(destinationQuery, [`%${destination}%`, `%${country}%`]);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Destino no encontrado'
        });
      }

      const dest = result.rows[0];
      
      const processedDestination = {
        id: destinationId,
        name: dest.destination,
        country: dest.country,
        package_count: parseInt(dest.package_count) || 0,
        avg_price: parseFloat(dest.avg_price || 0).toFixed(2),
        min_price: parseFloat(dest.min_price || 0).toFixed(2),
        max_price: parseFloat(dest.max_price || 0).toFixed(2),
        avg_rating: parseFloat(dest.avg_rating || 0).toFixed(1),
        total_reviews: parseInt(dest.total_reviews) || 0,
        categories: dest.categories || [],
        last_updated: dest.last_updated,
        status: 'active'
      };

      res.json({
        success: true,
        data: processedDestination,
        message: 'Destino obtenido correctamente'
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, destino no disponible:', dbError.message);
      res.status(404).json({
        success: false,
        message: 'Destino no encontrado',
        error: 'Base de datos no disponible'
      });
    }

  } catch (error) {
    console.error('❌ Error en GET /admin/destinations/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener destino',
      error: error.message
    });
  }
});

// ===============================================
// GET /api/admin/destinations/stats - ESTADÍSTICAS DE DESTINOS
// ===============================================
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 Admin Destinations - Obteniendo estadísticas');

    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT destination) as total_destinations,
          COUNT(DISTINCT country) as total_countries,
          COUNT(*) as total_packages,
          AVG(price_amount) as avg_package_price,
          SUM(rating_count) as total_reviews,
          AVG(rating_average) as avg_rating
        FROM packages 
        WHERE status = 'active'
      `;

      const topDestinationsQuery = `
        SELECT 
          destination,
          country,
          COUNT(*) as package_count,
          AVG(price_amount) as avg_price
        FROM packages 
        WHERE status = 'active'
        GROUP BY destination, country
        ORDER BY package_count DESC
        LIMIT 5
      `;

      const [statsResult, topResult] = await Promise.all([
        query(statsQuery),
        query(topDestinationsQuery)
      ]);

      const stats = statsResult.rows[0];
      const topDestinations = topResult.rows || [];

      res.json({
        success: true,
        stats: {
          total_destinations: parseInt(stats.total_destinations) || 0,
          total_countries: parseInt(stats.total_countries) || 0,
          total_packages: parseInt(stats.total_packages) || 0,
          avg_package_price: parseFloat(stats.avg_package_price || 0).toFixed(2),
          total_reviews: parseInt(stats.total_reviews) || 0,
          avg_rating: parseFloat(stats.avg_rating || 0).toFixed(1),
          top_destinations: topDestinations.map(dest => ({
            name: dest.destination,
            country: dest.country,
            package_count: parseInt(dest.package_count),
            avg_price: parseFloat(dest.avg_price).toFixed(2)
          }))
        },
        message: 'Estadísticas obtenidas correctamente'
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, usando stats de fallback:', dbError.message);
      
      res.json({
        success: true,
        stats: {
          total_destinations: 47,
          total_countries: 23,
          total_packages: 156,
          avg_package_price: '1450.75',
          total_reviews: 2847,
          avg_rating: '4.6',
          top_destinations: [
            { name: 'Mendoza', country: 'Argentina', package_count: 8, avg_price: '1250.00' },
            { name: 'Buenos Aires', country: 'Argentina', package_count: 12, avg_price: '980.00' },
            { name: 'Cancún', country: 'México', package_count: 9, avg_price: '1680.00' },
            { name: 'París', country: 'Francia', package_count: 6, avg_price: '2150.00' },
            { name: 'Machu Picchu', country: 'Perú', package_count: 4, avg_price: '1920.00' }
          ]
        },
        message: 'Estadísticas obtenidas (datos de fallback)',
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error en GET /admin/destinations/stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// ===============================================
// GET /api/admin/destinations/countries - LISTA DE PAÍSES
// ===============================================
router.get('/meta/countries', async (req, res) => {
  try {
    console.log('🌍 Admin Destinations - Obteniendo lista de países');

    try {
      const countriesQuery = `
        SELECT 
          country,
          COUNT(DISTINCT destination) as destination_count,
          COUNT(*) as package_count,
          AVG(price_amount) as avg_price
        FROM packages 
        WHERE status = 'active'
        GROUP BY country
        ORDER BY destination_count DESC, country ASC
      `;

      const result = await query(countriesQuery);
      const countries = result.rows || [];

      const processedCountries = countries.map(country => ({
        name: country.country,
        destination_count: parseInt(country.destination_count),
        package_count: parseInt(country.package_count),
        avg_price: parseFloat(country.avg_price).toFixed(2)
      }));

      res.json({
        success: true,
        data: processedCountries,
        message: `${processedCountries.length} países encontrados`
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, usando países de fallback:', dbError.message);
      
      const fallbackCountries = [
        { name: 'Argentina', destination_count: 15, package_count: 45, avg_price: '1150.00' },
        { name: 'Francia', destination_count: 8, package_count: 18, avg_price: '2350.00' },
        { name: 'México', destination_count: 6, package_count: 22, avg_price: '1680.00' },
        { name: 'Perú', destination_count: 4, package_count: 12, avg_price: '1820.00' },
        { name: 'España', destination_count: 7, package_count: 19, avg_price: '1950.00' },
        { name: 'Brasil', destination_count: 5, package_count: 14, avg_price: '1420.00' },
        { name: 'Chile', destination_count: 3, package_count: 8, avg_price: '1380.00' }
      ];

      res.json({
        success: true,
        data: fallbackCountries,
        message: `${fallbackCountries.length} países (datos de fallback)`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error en GET /admin/destinations/countries:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener países',
      error: error.message
    });
  }
});

module.exports = router;