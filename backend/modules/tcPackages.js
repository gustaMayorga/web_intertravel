// ===============================================
// MÓDULO: GESTIÓN DE PAQUETES TRAVEL COMPOSITOR
// ===============================================

const { query } = require('../database');
const axios = require('axios');

class TCPackagesManager {
  
  // Sincronizar paquetes desde Travel Compositor
  static async syncPackages() {
    try {
      console.log('🔄 Sincronizando paquetes de Travel Compositor...');
      
      // Aquí iría la llamada real a Travel Compositor
      // Por ahora usamos datos de fallback
      const tcPackages = await this.getTCPackages();
      
      let syncedCount = 0;
      
      for (const pkg of tcPackages) {
        await query(`
          INSERT INTO tc_packages (
            tc_package_id, title, destination, country, price_amount, price_currency,
            original_price, duration_days, duration_nights, category, description_short,
            description_full, images, features, rating_average, rating_count, last_sync
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
          ON CONFLICT (tc_package_id) DO UPDATE SET
            title = EXCLUDED.title,
            destination = EXCLUDED.destination,
            country = EXCLUDED.country,
            price_amount = EXCLUDED.price_amount,
            price_currency = EXCLUDED.price_currency,
            original_price = EXCLUDED.original_price,
            duration_days = EXCLUDED.duration_days,
            duration_nights = EXCLUDED.duration_nights,
            category = EXCLUDED.category,
            description_short = EXCLUDED.description_short,
            description_full = EXCLUDED.description_full,
            images = EXCLUDED.images,
            features = EXCLUDED.features,
            rating_average = EXCLUDED.rating_average,
            rating_count = EXCLUDED.rating_count,
            last_sync = CURRENT_TIMESTAMP
        `, [
          pkg.id, pkg.title, pkg.destination, pkg.country, pkg.price.amount, pkg.price.currency,
          pkg.originalPrice?.amount, pkg.duration.days, pkg.duration.nights, pkg.category,
          pkg.description.short, pkg.description.full, JSON.stringify(pkg.images),
          JSON.stringify(pkg.features), pkg.rating.average, pkg.rating.count
        ]);
        
        syncedCount++;
      }
      
      console.log(`✅ ${syncedCount} paquetes sincronizados`);
      return { success: true, syncedCount, message: `${syncedCount} paquetes sincronizados` };
      
    } catch (error) {
      console.error('❌ Error sincronizando paquetes:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener paquetes de Travel Compositor (simulado)
  static async getTCPackages() {
    // Aquí iría la integración real con Travel Compositor
    return [
      {
        id: 'tc_peru_001',
        title: 'Perú Mágico - Cusco y Machu Picchu',
        destination: 'Cusco',
        country: 'Perú',
        price: { amount: 1890, currency: 'USD' },
        originalPrice: { amount: 2190, currency: 'USD' },
        duration: { days: 8, nights: 7 },
        category: 'Cultura y Aventura',
        description: {
          short: 'Descubre la magia del imperio Inca en un viaje inolvidable por Cusco, Valle Sagrado y Machu Picchu.',
          full: 'Embárcate en una aventura única por el corazón del antiguo imperio Inca. Explora la majestuosa ciudad de Cusco, camina por los senderos sagrados del Valle Sagrado y maravíllate con la ciudadela perdida de Machu Picchu.'
        },
        images: {
          main: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=600&fit=crop&auto=format&q=80',
          gallery: []
        },
        features: ['Vuelos incluidos', 'Alojamiento 4*', 'Guía especializado', 'Entrada Machu Picchu'],
        rating: { average: 4.8, count: 234 }
      },
      {
        id: 'tc_argentina_001',
        title: 'Buenos Aires Tango - Capital del Sur',
        destination: 'Buenos Aires',
        country: 'Argentina',
        price: { amount: 899, currency: 'USD' },
        originalPrice: { amount: 1050, currency: 'USD' },
        duration: { days: 6, nights: 5 },
        category: 'Ciudad y Cultura',
        description: {
          short: 'Vive la pasión del tango en Buenos Aires con shows exclusivos y tours gastronómicos.',
          full: 'Sumérgete en la cultura porteña con shows de tango, tours por San Telmo y La Boca, experiencias gastronómicas.'
        },
        images: {
          main: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&h=600&fit=crop&auto=format&q=80',
          gallery: []
        },
        features: ['Shows de tango', 'Tours gastronómicos', 'Guía local', 'Traslados incluidos'],
        rating: { average: 4.6, count: 189 }
      }
    ];
  }
  
  // Obtener todos los paquetes con filtros
  static async getPackages(filters = {}) {
    try {
      let sql = `
        SELECT id, tc_package_id, title, destination, country, price_amount, price_currency,
               original_price, duration_days, duration_nights, category, description_short,
               images, rating_average, rating_count, is_featured, is_active, display_order,
               created_at, updated_at
        FROM tc_packages 
        WHERE 1=1
      `;
      let params = [];
      let paramCount = 0;
      
      if (filters.category) {
        paramCount++;
        sql += ` AND category = $${paramCount}`;
        params.push(filters.category);
      }
      
      if (filters.country) {
        paramCount++;
        sql += ` AND country = $${paramCount}`;
        params.push(filters.country);
      }
      
      if (filters.isActive !== undefined) {
        paramCount++;
        sql += ` AND is_active = $${paramCount}`;
        params.push(filters.isActive);
      }
      
      if (filters.isFeatured !== undefined) {
        paramCount++;
        sql += ` AND is_featured = $${paramCount}`;
        params.push(filters.isFeatured);
      }
      
      sql += ' ORDER BY display_order ASC, created_at DESC';
      
      if (filters.limit) {
        paramCount++;
        sql += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }
      
      const result = await query(sql, params);
      
      return { 
        success: true, 
        packages: result.rows.map(row => ({
          ...row,
          images: row.images,
          price: {
            amount: parseFloat(row.price_amount),
            currency: row.price_currency
          },
          originalPrice: row.original_price ? {
            amount: parseFloat(row.original_price),
            currency: row.price_currency
          } : null,
          duration: {
            days: row.duration_days,
            nights: row.duration_nights
          }
        }))
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo paquetes:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Actualizar estado de paquete (destacado/activo)
  static async updatePackageStatus(packageId, updates) {
    try {
      const setClause = [];
      const params = [];
      let paramCount = 0;
      
      if (updates.isFeatured !== undefined) {
        paramCount++;
        setClause.push(`is_featured = $${paramCount}`);
        params.push(updates.isFeatured);
      }
      
      if (updates.isActive !== undefined) {
        paramCount++;
        setClause.push(`is_active = $${paramCount}`);
        params.push(updates.isActive);
      }
      
      if (updates.displayOrder !== undefined) {
        paramCount++;
        setClause.push(`display_order = $${paramCount}`);
        params.push(updates.displayOrder);
      }
      
      if (setClause.length === 0) {
        return { success: false, error: 'No hay cambios para actualizar' };
      }
      
      paramCount++;
      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(packageId);
      
      const sql = `UPDATE tc_packages SET ${setClause.join(', ')} WHERE id = $${paramCount}`;
      
      await query(sql, params);
      
      return { success: true, message: 'Paquete actualizado exitosamente' };
      
    } catch (error) {
      console.error('❌ Error actualizando paquete:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener estadísticas de paquetes
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active,
          COUNT(CASE WHEN is_featured = true THEN 1 END) as featured,
          COUNT(DISTINCT country) as countries,
          COUNT(DISTINCT category) as categories,
          AVG(price_amount) as avg_price,
          MIN(price_amount) as min_price,
          MAX(price_amount) as max_price
        FROM tc_packages
      `);
      
      return { success: true, stats: stats.rows[0] };
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = TCPackagesManager;