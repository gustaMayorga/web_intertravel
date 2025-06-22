// ===============================================
// MÓDULO ADMIN: GESTIÓN COMPLETA DE DESTINOS
// ===============================================

const { query } = require('../database');

class DestinationsManager {
  
  // ===============================================
  // CRUD BÁSICO DE DESTINOS
  // ===============================================
  
  // Obtener todos los destinos con filtros
  static async getDestinations(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        country,
        category,
        status = 'active',
        sortBy = 'name',
        sortOrder = 'ASC'
      } = filters;

      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      // Build WHERE conditions
      if (search) {
        paramCount++;
        whereConditions.push(`(name ILIKE $${paramCount} OR country ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
        params.push(`%${search}%`);
      }

      if (country) {
        paramCount++;
        whereConditions.push(`country ILIKE $${paramCount}`);
        params.push(`%${country}%`);
      }

      if (category) {
        paramCount++;
        whereConditions.push(`category = $${paramCount}`);
        params.push(category);
      }

      if (status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        params.push(status);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM destinations ${whereClause}`;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const offset = (page - 1) * limit;
      paramCount++;
      params.push(limit);
      paramCount++;
      params.push(offset);

      const validSortFields = ['name', 'country', 'category', 'price', 'packages_count', 'created_at'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
      const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const destinationsQuery = `
        SELECT 
          id,
          destination_id,
          name,
          country,
          description,
          price,
          category,
          coordinates,
          packages_count,
          is_featured,
          status,
          source,
          image_url,
          created_at,
          updated_at
        FROM destinations 
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      const destinationsResult = await query(destinationsQuery, params);

      return {
        success: true,
        data: {
          destinations: destinationsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('Error getting destinations:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener destino por ID
  static async getDestinationById(id) {
    try {
      const result = await query(`
        SELECT * FROM destinations WHERE id = $1 OR destination_id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Destination not found' };
      }

      return { success: true, destination: result.rows[0] };

    } catch (error) {
      console.error('Error getting destination:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear nuevo destino
  static async createDestination(destinationData) {
    try {
      const {
        destination_id,
        name,
        country,
        description,
        price,
        category = 'Cultura',
        coordinates = { lat: 0, lng: 0 },
        packages_count = 0,
        is_featured = false,
        status = 'active',
        source = 'admin',
        image_url = null
      } = destinationData;

      // Validar coordenadas
      if (!coordinates.lat || !coordinates.lng) {
        return { 
          success: false, 
          error: 'Coordenadas válidas requeridas (lat, lng)' 
        };
      }

      const result = await query(`
        INSERT INTO destinations (
          destination_id, name, country, description, price, category,
          coordinates, packages_count, is_featured, status, source, image_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *
      `, [
        destination_id || `DEST-${Date.now()}`,
        name,
        country,
        description,
        price,
        category,
        JSON.stringify(coordinates),
        packages_count,
        is_featured,
        status,
        source,
        image_url
      ]);

      return { success: true, destination: result.rows[0] };

    } catch (error) {
      console.error('Error creating destination:', error);
      return { success: false, error: error.message };
    }
  }

  // Actualizar destino
  static async updateDestination(id, destinationData) {
    try {
      const updateFields = [];
      const params = [id];
      let paramCount = 1;

      const allowedFields = [
        'name', 'country', 'description', 'price', 'category',
        'coordinates', 'packages_count', 'is_featured', 'status', 'image_url'
      ];

      for (const [key, value] of Object.entries(destinationData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          if (key === 'coordinates') {
            updateFields.push(`${key} = $${paramCount}`);
            params.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramCount}`);
            params.push(value);
          }
        }
      }

      if (updateFields.length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');

      const result = await query(`
        UPDATE destinations 
        SET ${updateFields.join(', ')}
        WHERE id = $1 OR destination_id = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return { success: false, error: 'Destination not found' };
      }

      return { success: true, destination: result.rows[0] };

    } catch (error) {
      console.error('Error updating destination:', error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar destino
  static async deleteDestination(id) {
    try {
      const result = await query(`
        DELETE FROM destinations 
        WHERE id = $1 OR destination_id = $1
        RETURNING name
      `, [id]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Destination not found' };
      }

      return { 
        success: true, 
        message: `Destination "${result.rows[0].name}" deleted successfully` 
      };

    } catch (error) {
      console.error('Error deleting destination:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // GESTIÓN DE COORDENADAS
  // ===============================================
  
  // Buscar coordenadas automáticamente
  static async autoFillCoordinates(destinationName) {
    const coordinatesDatabase = {
      // Argentina
      'Buenos Aires': { lat: -34.6118, lng: -58.3960 },
      'Bariloche': { lat: -41.1335, lng: -71.3103 },
      'Mendoza': { lat: -32.8895, lng: -68.8458 },
      'Córdoba': { lat: -31.4201, lng: -64.1888 },
      'Rosario': { lat: -32.9442, lng: -60.6505 },
      'Mar del Plata': { lat: -38.0023, lng: -57.5575 },
      'Salta': { lat: -24.7821, lng: -65.4232 },
      'Ushuaia': { lat: -54.8019, lng: -68.3030 },
      'El Calafate': { lat: -50.3374, lng: -72.2647 },
      'Puerto Madryn': { lat: -42.7692, lng: -65.0384 },
      
      // Sudamérica
      'Cusco': { lat: -13.5319, lng: -71.9675 },
      'Lima': { lat: -12.0464, lng: -77.0428 },
      'Río de Janeiro': { lat: -22.9068, lng: -43.1729 },
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
      'Santiago': { lat: -33.4489, lng: -70.6693 },
      'Bogotá': { lat: 4.7110, lng: -74.0721 },
      'Quito': { lat: -0.1807, lng: -78.4678 },
      'La Paz': { lat: -16.5000, lng: -68.1500 },
      'Montevideo': { lat: -34.9011, lng: -56.1645 },
      
      // Europa
      'París': { lat: 48.8566, lng: 2.3522 },
      'Londres': { lat: 51.5074, lng: -0.1278 },
      'Roma': { lat: 41.9028, lng: 12.4964 },
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'Madrid': { lat: 40.4168, lng: -3.7038 },
      'Amsterdam': { lat: 52.3676, lng: 4.9041 },
      'Berlín': { lat: 52.5200, lng: 13.4050 },
      'Viena': { lat: 48.2082, lng: 16.3738 },
      'Praga': { lat: 50.0755, lng: 14.4378 },
      'Atenas': { lat: 37.9838, lng: 23.7275 },
      'Lisboa': { lat: 38.7223, lng: -9.1393 },
      'Dublin': { lat: 53.3498, lng: -6.2603 },
      
      // América del Norte
      'Nueva York': { lat: 40.7128, lng: -74.0060 },
      'Los Ángeles': { lat: 34.0522, lng: -118.2437 },
      'Miami': { lat: 25.7617, lng: -80.1918 },
      'Las Vegas': { lat: 36.1699, lng: -115.1398 },
      'San Francisco': { lat: 37.7749, lng: -122.4194 },
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      'Vancouver': { lat: 49.2827, lng: -123.1207 },
      'Cancún': { lat: 21.1619, lng: -86.8515 },
      'Playa del Carmen': { lat: 20.6296, lng: -87.0739 },
      'Ciudad de México': { lat: 19.4326, lng: -99.1332 },
      
      // Asia y Oceanía
      'Tokio': { lat: 35.6762, lng: 139.6503 },
      'Bangkok': { lat: 13.7563, lng: 100.5018 },
      'Singapur': { lat: 1.3521, lng: 103.8198 },
      'Hong Kong': { lat: 22.3193, lng: 114.1694 },
      'Dubái': { lat: 25.2048, lng: 55.2708 },
      'Sidney': { lat: -33.8688, lng: 151.2093 },
      'Melbourne': { lat: -37.8136, lng: 144.9631 },
      'Bali': { lat: -8.3405, lng: 115.0920 },
      'Delhi': { lat: 28.7041, lng: 77.1025 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      
      // África
      'Ciudad del Cabo': { lat: -33.9249, lng: 18.4241 },
      'El Cairo': { lat: 30.0444, lng: 31.2357 },
      'Marrakech': { lat: 31.6295, lng: -7.9811 },
      'Nairobi': { lat: -1.2921, lng: 36.8219 },
      'Casablanca': { lat: 33.5731, lng: -7.5898 }
    };

    return coordinatesDatabase[destinationName] || { lat: 0, lng: 0 };
  }

  // ===============================================
  // OPERACIONES MASIVAS
  // ===============================================
  
  // Actualización masiva de estado
  static async bulkUpdateStatus(destinationIds, status) {
    try {
      const validStatuses = ['active', 'inactive', 'draft', 'archived'];
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid status' };
      }

      const result = await query(`
        UPDATE destinations 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($2)
        RETURNING id, name, status
      `, [status, destinationIds]);

      return {
        success: true,
        data: {
          updated: result.rows.length,
          destinations: result.rows
        }
      };

    } catch (error) {
      console.error('Error bulk updating destinations:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Sincronización masiva desde Travel Compositor
  static async syncFromTravelCompositor(tcPackages) {
    try {
      if (!tcPackages || !Array.isArray(tcPackages)) {
        return { success: false, error: 'Invalid TC packages data' };
      }

      const destinationsMap = new Map();
      
      // Extraer destinos únicos de los paquetes
      tcPackages.forEach(pkg => {
        const key = `${pkg.destination}-${pkg.country}`;
        if (!destinationsMap.has(key)) {
          destinationsMap.set(key, {
            destination_id: `tc_${pkg.destination.toLowerCase().replace(/\s+/g, '_')}_${pkg.country.toLowerCase().replace(/\s+/g, '_')}`,
            name: pkg.destination,
            country: pkg.country,
            description: `Descubre ${pkg.destination}, ${pkg.country}`,
            price: pkg.price?.amount || 0,
            category: pkg.category || 'Cultura',
            coordinates: this.autoFillCoordinates(pkg.destination),
            packages_count: 1,
            is_featured: false,
            status: 'active',
            source: 'travel_compositor'
          });
        } else {
          // Actualizar contador y precio mínimo
          const existing = destinationsMap.get(key);
          existing.packages_count += 1;
          if (pkg.price?.amount && pkg.price.amount < existing.price) {
            existing.price = pkg.price.amount;
          }
        }
      });

      const destinations = Array.from(destinationsMap.values());
      let syncedCount = 0;
      let updatedCount = 0;

      // Insertar o actualizar cada destino
      for (const dest of destinations) {
        try {
          const existingResult = await query(
            'SELECT id FROM destinations WHERE destination_id = $1',
            [dest.destination_id]
          );

          if (existingResult.rows.length > 0) {
            // Actualizar existente
            await this.updateDestination(existingResult.rows[0].id, {
              packages_count: dest.packages_count,
              price: dest.price,
              updated_at: new Date()
            });
            updatedCount++;
          } else {
            // Crear nuevo
            await this.createDestination(dest);
            syncedCount++;
          }
        } catch (error) {
          console.error(`Error syncing destination ${dest.name}:`, error);
        }
      }

      return {
        success: true,
        data: {
          synced: syncedCount,
          updated: updatedCount,
          total: syncedCount + updatedCount
        }
      };

    } catch (error) {
      console.error('Error syncing from TC:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // ESTADÍSTICAS Y REPORTES
  // ===============================================
  
  // Obtener estadísticas de destinos
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
          COUNT(CASE WHEN is_featured = true THEN 1 END) as featured,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price,
          SUM(packages_count) as total_packages
        FROM destinations
      `);

      const countryStats = await query(`
        SELECT 
          country,
          COUNT(*) as count,
          AVG(price) as avg_price
        FROM destinations
        WHERE status = 'active'
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `);

      const categoryStats = await query(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(price) as avg_price
        FROM destinations
        WHERE status = 'active' AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `);

      const sourceStats = await query(`
        SELECT 
          source,
          COUNT(*) as count
        FROM destinations
        GROUP BY source
        ORDER BY count DESC
      `);

      return {
        success: true,
        data: {
          total: parseInt(stats.rows[0].total),
          active: parseInt(stats.rows[0].active),
          draft: parseInt(stats.rows[0].draft),
          inactive: parseInt(stats.rows[0].inactive),
          featured: parseInt(stats.rows[0].featured),
          avgPrice: parseFloat(stats.rows[0].avg_price) || 0,
          minPrice: parseFloat(stats.rows[0].min_price) || 0,
          maxPrice: parseFloat(stats.rows[0].max_price) || 0,
          totalPackages: parseInt(stats.rows[0].total_packages) || 0,
          byCountry: countryStats.rows,
          byCategory: categoryStats.rows,
          bySource: sourceStats.rows
        }
      };

    } catch (error) {
      console.error('Error getting destinations stats:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // UTILIDADES ADMIN
  // ===============================================
  
  // Inicializar destinos por defecto
  static async initializeDefaultDestinations() {
    try {
      const defaultDestinations = [
        {
          destination_id: 'paris_default',
          name: 'París',
          country: 'Francia',
          description: 'La Ciudad de la Luz te espera con su arte, cultura y romance',
          price: 1299,
          category: 'Romance',
          coordinates: { lat: 48.8566, lng: 2.3522 },
          packages_count: 15,
          is_featured: true,
          source: 'admin_default'
        },
        {
          destination_id: 'tokyo_default',
          name: 'Tokio',
          country: 'Japón',
          description: 'Modernidad y tradición se encuentran en la capital japonesa',
          price: 2199,
          category: 'Cultura',
          coordinates: { lat: 35.6762, lng: 139.6503 },
          packages_count: 8,
          is_featured: true,
          source: 'admin_default'
        },
        {
          destination_id: 'buenosaires_default',
          name: 'Buenos Aires',
          country: 'Argentina',
          description: 'Tango, asado y cultura porteña en la capital argentina',
          price: 999,
          category: 'Cultura',
          coordinates: { lat: -34.6118, lng: -58.3960 },
          packages_count: 16,
          is_featured: true,
          source: 'admin_default'
        }
      ];

      let created = 0;
      for (const dest of defaultDestinations) {
        const existing = await query(
          'SELECT id FROM destinations WHERE destination_id = $1',
          [dest.destination_id]
        );

        if (existing.rows.length === 0) {
          await this.createDestination(dest);
          created++;
        }
      }

      return {
        success: true,
        message: `${created} destinos por defecto inicializados`,
        created
      };

    } catch (error) {
      console.error('Error initializing default destinations:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DestinationsManager;
