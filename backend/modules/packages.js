// Packages Management Module for Admin Panel
const { query } = require('../database');

class PackagesManager {
  // Get packages with filters and pagination
  static async getPackages(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        country,
        category,
        status,
        featured,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = filters;

      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      // Build WHERE conditions
      if (search) {
        paramCount++;
        whereConditions.push(`(title ILIKE $${paramCount} OR destination ILIKE $${paramCount})`);
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

      if (featured !== undefined) {
        paramCount++;
        whereConditions.push(`is_featured = $${paramCount}`);
        params.push(featured === 'true');
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM packages ${whereClause}`;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const offset = (page - 1) * limit;
      paramCount++;
      params.push(limit);
      paramCount++;
      params.push(offset);

      const validSortFields = ['title', 'destination', 'country', 'price_amount', 'created_at', 'updated_at'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const packagesQuery = `
        SELECT 
          id,
          package_id,
          title,
          destination,
          country,
          price_amount,
          price_currency,
          original_price,
          duration_days,
          duration_nights,
          category,
          description_short,
          description_full,
          images,
          features,
          rating_average,
          rating_count,
          is_featured,
          status,
          source,
          created_at,
          updated_at
        FROM packages 
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      const packagesResult = await query(packagesQuery, params);

      return {
        success: true,
        data: {
          packages: packagesResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('Error getting packages:', error);
      return { success: false, error: error.message };
    }
  }

  // Get single package by ID
  static async getPackageById(id) {
    try {
      const result = await query(`
        SELECT * FROM packages WHERE id = $1 OR package_id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Package not found' };
      }

      return { success: true, package: result.rows[0] };

    } catch (error) {
      console.error('Error getting package:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new package
  static async createPackage(packageData) {
    try {
      const {
        package_id,
        title,
        destination,
        country,
        price_amount,
        price_currency = 'USD',
        original_price,
        duration_days,
        duration_nights,
        category,
        description_short,
        description_full,
        images = {},
        features = [],
        rating_average = 0,
        rating_count = 0,
        is_featured = false,
        status = 'active',
        source = 'admin'
      } = packageData;

      const result = await query(`
        INSERT INTO packages (
          package_id, title, destination, country, price_amount, price_currency,
          original_price, duration_days, duration_nights, category,
          description_short, description_full, images, features,
          rating_average, rating_count, is_featured, status, source
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *
      `, [
        package_id || `PKG-${Date.now()}`,
        title,
        destination,
        country,
        price_amount,
        price_currency,
        original_price,
        duration_days,
        duration_nights,
        category,
        description_short,
        description_full,
        JSON.stringify(images),
        JSON.stringify(features),
        rating_average,
        rating_count,
        is_featured,
        status,
        source
      ]);

      return { success: true, package: result.rows[0] };

    } catch (error) {
      console.error('Error creating package:', error);
      return { success: false, error: error.message };
    }
  }

  // Update package
  static async updatePackage(id, packageData) {
    try {
      const updateFields = [];
      const params = [id];
      let paramCount = 1;

      const allowedFields = [
        'title', 'destination', 'country', 'price_amount', 'price_currency',
        'original_price', 'duration_days', 'duration_nights', 'category',
        'description_short', 'description_full', 'images', 'features',
        'rating_average', 'rating_count', 'is_featured', 'status'
      ];

      for (const [key, value] of Object.entries(packageData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          if (key === 'images' || key === 'features') {
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
        UPDATE packages 
        SET ${updateFields.join(', ')}
        WHERE id = $1 OR package_id = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return { success: false, error: 'Package not found' };
      }

      return { success: true, package: result.rows[0] };

    } catch (error) {
      console.error('Error updating package:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete package
  static async deletePackage(id) {
    try {
      const result = await query(`
        DELETE FROM packages 
        WHERE id = $1 OR package_id = $1
        RETURNING title
      `, [id]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Package not found' };
      }

      return { 
        success: true, 
        message: `Package "${result.rows[0].title}" deleted successfully` 
      };

    } catch (error) {
      console.error('Error deleting package:', error);
      return { success: false, error: error.message };
    }
  }

  // Get packages statistics
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
          COUNT(CASE WHEN is_featured = true THEN 1 END) as featured,
          AVG(price_amount) as avg_price,
          MIN(price_amount) as min_price,
          MAX(price_amount) as max_price,
          AVG(rating_average) as avg_rating
        FROM packages
      `);

      const countryStats = await query(`
        SELECT 
          country,
          COUNT(*) as count
        FROM packages
        WHERE status = 'active'
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `);

      const categoryStats = await query(`
        SELECT 
          category,
          COUNT(*) as count,
          AVG(price_amount) as avg_price
        FROM packages
        WHERE status = 'active' AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `);

      const sourceStats = await query(`
        SELECT 
          source,
          COUNT(*) as count
        FROM packages
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
          avgRating: parseFloat(stats.rows[0].avg_rating) || 0,
          byCountry: countryStats.rows,
          byCategory: categoryStats.rows,
          bySource: sourceStats.rows
        }
      };

    } catch (error) {
      console.error('Error getting packages stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk update packages status
  static async bulkUpdateStatus(packageIds, status) {
    try {
      const validStatuses = ['active', 'inactive', 'draft', 'archived'];
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid status' };
      }

      const result = await query(`
        UPDATE packages 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($2)
        RETURNING id, title, status
      `, [status, packageIds]);

      return {
        success: true,
        data: {
          updated: result.rows.length,
          packages: result.rows
        }
      };

    } catch (error) {
      console.error('Error bulk updating packages:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PackagesManager;
