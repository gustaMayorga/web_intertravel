// Leads Management Module for Admin Panel
const { query } = require('../database');

class LeadsManager {
  // Capture new lead
  static async captureLead(leadData) {
    try {
      const { email, source, location, metadata = {} } = leadData;
      
      const result = await query(`
        INSERT INTO leads (email, source, location, metadata)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET
          source = EXCLUDED.source,
          location = EXCLUDED.location,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [email, source, location, JSON.stringify(metadata)]);
      
      return { success: true, lead: result.rows[0] };
    } catch (error) {
      console.error('Error capturing lead:', error);
      return { success: false, error: error.message };
    }
  }

  // Get leads with filters and pagination
  static async getLeads(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        source,
        status,
        search,
        startDate,
        endDate
      } = filters;

      let whereConditions = [];
      let params = [];
      let paramCount = 0;

      // Build WHERE conditions
      if (source) {
        paramCount++;
        whereConditions.push(`source = $${paramCount}`);
        params.push(source);
      }

      if (status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        params.push(status);
      }

      if (search) {
        paramCount++;
        whereConditions.push(`email ILIKE $${paramCount}`);
        params.push(`%${search}%`);
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
      const countQuery = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
      const countResult = await query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const offset = (page - 1) * limit;
      paramCount++;
      params.push(limit);
      paramCount++;
      params.push(offset);

      const leadsQuery = `
        SELECT 
          id,
          email,
          source,
          location,
          status,
          conversion_value,
          metadata,
          created_at,
          updated_at,
          contacted_at,
          converted_at
        FROM leads 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      const leadsResult = await query(leadsQuery, params);

      return {
        success: true,
        data: {
          leads: leadsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      console.error('Error getting leads:', error);
      return { success: false, error: error.message };
    }
  }

  // Get leads statistics
  static async getStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
          AVG(CASE WHEN conversion_value > 0 THEN conversion_value END) as avg_conversion_value
        FROM leads
      `);

      const sourceStats = await query(`
        SELECT 
          source,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM leads), 2) as percentage
        FROM leads
        GROUP BY source
        ORDER BY count DESC
      `);

      const statusStats = await query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM leads
        GROUP BY status
        ORDER BY count DESC
      `);

      const locationStats = await query(`
        SELECT 
          location,
          COUNT(*) as count
        FROM leads
        WHERE location IS NOT NULL
        GROUP BY location
        ORDER BY count DESC
        LIMIT 10
      `);

      const totalLeads = parseInt(stats.rows[0].total);
      const convertedLeads = parseInt(stats.rows[0].converted);
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

      return {
        success: true,
        data: {
          total: totalLeads,
          today: parseInt(stats.rows[0].today),
          thisWeek: parseInt(stats.rows[0].this_week),
          thisMonth: parseInt(stats.rows[0].this_month),
          converted: convertedLeads,
          conversionRate: parseFloat(conversionRate),
          avgConversionValue: parseFloat(stats.rows[0].avg_conversion_value) || 0,
          sources: sourceStats.rows,
          statuses: statusStats.rows,
          topLocations: locationStats.rows
        }
      };

    } catch (error) {
      console.error('Error getting leads stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Update lead status
  static async updateLeadStatus(id, status, notes = null) {
    try {
      const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
      if (!validStatuses.includes(status)) {
        return { success: false, error: 'Invalid status' };
      }

      const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
      const params = [id, status];
      let paramCount = 2;

      if (status === 'contacted' && !notes) {
        paramCount++;
        updateFields.push(`contacted_at = CURRENT_TIMESTAMP`);
      }

      if (status === 'converted') {
        paramCount++;
        updateFields.push(`converted_at = CURRENT_TIMESTAMP`);
      }

      if (notes) {
        paramCount++;
        updateFields.push(`metadata = COALESCE(metadata, '{}') || $${paramCount}`);
        params.push(JSON.stringify({ notes, updated_by: 'admin', updated_at: new Date() }));
      }

      const result = await query(`
        UPDATE leads 
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return { success: false, error: 'Lead not found' };
      }

      return { success: true, lead: result.rows[0] };

    } catch (error) {
      console.error('Error updating lead status:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = LeadsManager;
