// Bookings Management Module for Admin Panel
const { query } = require('../database');

class BookingsManager {
  // Create new booking
  static async createBooking(bookingData) {
    try {
      const {
        package_id,
        customer_name,
        customer_email,
        customer_phone,
        travelers_count = 1,
        total_amount,
        currency = 'USD',
        travel_date,
        special_requests,
        source = 'web',
        metadata = {}
      } = bookingData;

      // Generate booking reference
      const booking_reference = `BK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const result = await query(`
        INSERT INTO bookings (
          booking_reference, package_id, customer_name, customer_email,
          customer_phone, travelers_count, total_amount, currency,
          travel_date, special_requests, source, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING *
      `, [
        booking_reference,
        package_id,
        customer_name,
        customer_email,
        customer_phone,
        travelers_count,
        total_amount,
        currency,
        travel_date,
        special_requests,
        source,
        JSON.stringify(metadata)
      ]);

      return { success: true, booking: result.rows[0] };

    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  }

  // Get bookings with filters and pagination
  static async getBookings(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        status,
        payment_status,
        source,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = filters;

      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      // Build WHERE conditions
      if (search) {
        paramCount++;
        whereConditions.push(`(
          booking_reference ILIKE $${paramCount} OR 
          customer_name ILIKE $${paramCount} OR 
          customer_email ILIKE $${paramCount}
        )`);
        params.push(`%${search}%`);
      }

      if (status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        params.push(status);
      }

      if (payment_status) {
        paramCount++;
        whereConditions.push(`payment_status = $${paramCount}`);
        params.push(payment_status);
      }

      if (source) {
        paramCount++;
        whereConditions.push(`source = $${paramCount}`);
        params.push(source);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`created_at >= $${paramCount}`);
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`created_at <= $${paramCount}`);
        params.push(endDate);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM bookings ${whereClause}`;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results with package info
      const offset = (page - 1) * limit;
      paramCount++;
      params.push(limit);
      paramCount++;
      params.push(offset);

      const validSortFields = ['booking_reference', 'customer_name', 'total_amount', 'created_at', 'travel_date'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const bookingsQuery = `
        SELECT 
          b.*,
          p.title as package_title,
          p.destination as package_destination,
          p.country as package_country
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.package_id
        ${whereClause}
        ORDER BY b.${sortField} ${sortDirection}
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      const bookingsResult = await query(bookingsQuery, params);

      return {
        success: true,
        data: {
          bookings: bookingsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('Error getting bookings:', error);
      return { success: false, error: error.message };
    }
  }

  // Get single booking by ID or reference
  static async getBookingById(id) {
    try {
      const result = await query(`
        SELECT 
          b.*,
          p.title as package_title,
          p.destination as package_destination,
          p.country as package_country,
          p.duration_days,
          p.duration_nights,
          p.description_short
        FROM bookings b
        LEFT JOIN packages p ON b.package_id = p.package_id
        WHERE b.id = $1 OR b.booking_reference = $1
      `, [id]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Booking not found' };
      }

      return { success: true, booking: result.rows[0] };

    } catch (error) {
      console.error('Error getting booking:', error);
      return { success: false, error: error.message };
    }
  }

  // Update booking status
  static async updateBookingStatus(id, status, notes = null) {
    try {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid status' };
      }

      const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [id, status];
      let paramCount = 2;

      if (status === 'confirmed') {
        updateFields.push('confirmed_at = CURRENT_TIMESTAMP');
      }

      if (status === 'cancelled') {
        updateFields.push('cancelled_at = CURRENT_TIMESTAMP');
      }

      if (notes) {
        paramCount++;
        updateFields.push(`metadata = COALESCE(metadata, '{}') || $${paramCount}`);
        params.push(JSON.stringify({ 
          status_notes: notes, 
          updated_by: 'admin', 
          updated_at: new Date() 
        }));
      }

      const result = await query(`
        UPDATE bookings 
        SET ${updateFields.join(', ')}
        WHERE id = $1 OR booking_reference = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return { success: false, error: 'Booking not found' };
      }

      return { success: true, booking: result.rows[0] };

    } catch (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error: error.message };
    }
  }

  // Update payment status
  static async updatePaymentStatus(id, payment_status, payment_method = null) {
    try {
      const validPaymentStatuses = ['pending', 'paid', 'partial', 'refunded', 'failed'];
      if (!validPaymentStatuses.includes(payment_status)) {
        return { success: false, error: 'Invalid payment status' };
      }

      const updateFields = ['payment_status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [id, payment_status];
      let paramCount = 2;

      if (payment_method) {
        paramCount++;
        updateFields.push(`payment_method = $${paramCount}`);
        params.push(payment_method);
      }

      const result = await query(`
        UPDATE bookings 
        SET ${updateFields.join(', ')}
        WHERE id = $1 OR booking_reference = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return { success: false, error: 'Booking not found' };
      }

      return { success: true, booking: result.rows[0] };

    } catch (error) {
      console.error('Error updating payment status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get bookings statistics
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN total_amount ELSE 0 END) as month_revenue,
          AVG(total_amount) as avg_booking_value,
          SUM(travelers_count) as total_travelers
        FROM bookings
      `);

      const statusStats = await query(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(total_amount) as revenue
        FROM bookings
        GROUP BY status
        ORDER BY count DESC
      `);

      const sourceStats = await query(`
        SELECT 
          source,
          COUNT(*) as count,
          SUM(total_amount) as revenue
        FROM bookings
        GROUP BY source
        ORDER BY count DESC
      `);

      const monthlyStats = await query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as bookings,
          SUM(total_amount) as revenue
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);

      const topDestinations = await query(`
        SELECT 
          p.destination,
          p.country,
          COUNT(b.*) as bookings,
          SUM(b.total_amount) as revenue
        FROM bookings b
        JOIN packages p ON b.package_id = p.package_id
        WHERE b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.destination, p.country
        ORDER BY bookings DESC
        LIMIT 10
      `);

      return {
        success: true,
        data: {
          total: parseInt(stats.rows[0].total),
          today: parseInt(stats.rows[0].today),
          thisWeek: parseInt(stats.rows[0].this_week),
          thisMonth: parseInt(stats.rows[0].this_month),
          confirmed: parseInt(stats.rows[0].confirmed),
          pending: parseInt(stats.rows[0].pending),
          cancelled: parseInt(stats.rows[0].cancelled),
          paid: parseInt(stats.rows[0].paid),
          totalRevenue: parseFloat(stats.rows[0].total_revenue) || 0,
          monthRevenue: parseFloat(stats.rows[0].month_revenue) || 0,
          avgBookingValue: parseFloat(stats.rows[0].avg_booking_value) || 0,
          totalTravelers: parseInt(stats.rows[0].total_travelers),
          byStatus: statusStats.rows,
          bySource: sourceStats.rows,
          monthly: monthlyStats.rows,
          topDestinations: topDestinations.rows
        }
      };

    } catch (error) {
      console.error('Error getting bookings stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Get revenue analytics
  static async getRevenueAnalytics(period = '30d') {
    try {
      let interval;
      let groupBy;
      
      switch (period) {
        case '7d':
          interval = '7 days';
          groupBy = 'DATE(created_at)';
          break;
        case '30d':
          interval = '30 days';
          groupBy = 'DATE(created_at)';
          break;
        case '12m':
          interval = '12 months';
          groupBy = 'DATE_TRUNC(\'month\', created_at)';
          break;
        default:
          interval = '30 days';
          groupBy = 'DATE(created_at)';
      }

      const result = await query(`
        SELECT 
          ${groupBy} as period,
          COUNT(*) as bookings,
          SUM(total_amount) as revenue,
          AVG(total_amount) as avg_value,
          SUM(travelers_count) as travelers
        FROM bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
        AND status != 'cancelled'
        GROUP BY ${groupBy}
        ORDER BY period DESC
      `);

      return {
        success: true,
        data: {
          period,
          analytics: result.rows
        }
      };

    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = BookingsManager;
