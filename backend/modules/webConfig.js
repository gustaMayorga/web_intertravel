// ===============================================
// MÓDULO: CONFIGURACIÓN WEB
// ===============================================

const { query } = require('../database');

class WebConfigManager {
  
  // Obtener toda la configuración web
  static async getConfig(category = null) {
    try {
      let sql = 'SELECT * FROM web_config WHERE is_active = true';
      let params = [];
      
      if (category) {
        sql += ' AND category = $1';
        params.push(category);
      }
      
      sql += ' ORDER BY category, key';
      
      const result = await query(sql, params);
      
      // Convertir a objeto para fácil acceso
      const config = {};
      result.rows.forEach(row => {
        config[row.key] = {
          value: row.value,
          category: row.category,
          description: row.description,
          updated_at: row.updated_at
        };
      });
      
      return { success: true, config };
      
    } catch (error) {
      console.error('❌ Error obteniendo configuración web:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Actualizar configuración
  static async updateConfig(key, value, category = 'general', description = '') {
    try {
      await query(`
        INSERT INTO web_config (key, value, category, description, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          updated_at = CURRENT_TIMESTAMP
      `, [key, JSON.stringify(value), category, description]);
      
      return { success: true, message: 'Configuración actualizada' };
      
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener configuración por categoría
  static async getByCategory(category) {
    try {
      const result = await query(`
        SELECT key, value, description, updated_at 
        FROM web_config 
        WHERE category = $1 AND is_active = true
        ORDER BY key
      `, [category]);
      
      return { 
        success: true, 
        config: result.rows.map(row => ({
          key: row.key,
          value: row.value,
          description: row.description,
          updated_at: row.updated_at
        }))
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo configuración por categoría:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Eliminar configuración
  static async deleteConfig(key) {
    try {
      await query('DELETE FROM web_config WHERE key = $1', [key]);
      return { success: true, message: 'Configuración eliminada' };
      
    } catch (error) {
      console.error('❌ Error eliminando configuración:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = WebConfigManager;