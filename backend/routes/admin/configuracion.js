// ===============================================
// CONTROLADOR DE CONFIGURACIÓN - INTERTRAVEL ADMIN
// Sistema de configuración general del sistema
// ===============================================

const express = require('express');
const router = express.Router();
const { query } = require('../../database');

// ===============================================
// 📋 OBTENER TODAS LAS CONFIGURACIONES
// ===============================================
router.get('/', async (req, res) => {
  try {
    const { category = 'all', is_public = 'all' } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Filtro por categoría
    if (category !== 'all') {
      whereConditions.push(`key LIKE $${paramIndex}`);
      queryParams.push(`${category}_%`);
      paramIndex++;
    }

    // Filtro por público/privado
    if (is_public !== 'all') {
      whereConditions.push(`is_public = $${paramIndex}`);
      queryParams.push(is_public === 'true');
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';

    const configQuery = `
      SELECT 
        id,
        key,
        value,
        description,
        is_public,
        created_at,
        updated_at
      FROM system_config
      ${whereClause}
      ORDER BY key ASC
    `;

    const result = await query(configQuery, queryParams);

    // Procesar y organizar configuraciones por categoría
    const configsByCategory = {};
    const rawConfigs = [];

    result.rows.forEach(row => {
      try {
        const parsedValue = JSON.parse(row.value);
        const categoryName = row.key.split('_')[0] || 'general';
        
        if (!configsByCategory[categoryName]) {
          configsByCategory[categoryName] = [];
        }

        const configItem = {
          ...row,
          value: parsedValue,
          category: categoryName
        };

        configsByCategory[categoryName].push(configItem);
        rawConfigs.push(configItem);
      } catch (error) {
        console.warn(`⚠️ Error parsing config ${row.key}:`, error);
        rawConfigs.push({
          ...row,
          value: row.value,
          category: 'unknown',
          parse_error: true
        });
      }
    });

    console.log(`✅ Configuraciones obtenidas: ${result.rows.length} elementos`);

    res.json({
      success: true,
      data: {
        configs: rawConfigs,
        by_category: configsByCategory,
        summary: {
          total_configs: result.rows.length,
          public_configs: result.rows.filter(r => r.is_public).length,
          private_configs: result.rows.filter(r => !r.is_public).length,
          categories: Object.keys(configsByCategory)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuraciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 📂 OBTENER CONFIGURACIONES POR CATEGORÍA
// ===============================================
router.get('/category/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { include_private = 'false' } = req.query;

    let whereClause = 'WHERE key LIKE $1';
    let queryParams = [`${categoryName}_%`];

    // Si no incluir privadas y no es admin
    if (include_private !== 'true') {
      whereClause += ' AND is_public = true';
    }

    const configQuery = `
      SELECT 
        id,
        key,
        value,
        description,
        is_public,
        created_at,
        updated_at
      FROM system_config
      ${whereClause}
      ORDER BY key ASC
    `;

    const result = await query(configQuery, queryParams);

    const configs = result.rows.map(row => {
      try {
        return {
          ...row,
          value: JSON.parse(row.value)
        };
      } catch (error) {
        console.warn(`⚠️ Error parsing config ${row.key}:`, error);
        return {
          ...row,
          parse_error: true
        };
      }
    });

    console.log(`✅ Configuraciones de categoría '${categoryName}': ${configs.length} elementos`);

    res.json({
      success: true,
      data: {
        category: categoryName,
        configs,
        count: configs.length
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuraciones por categoría:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 🔧 OBTENER CONFIGURACIÓN ESPECÍFICA
// ===============================================
router.get('/key/:configKey', async (req, res) => {
  try {
    const { configKey } = req.params;

    const configQuery = `
      SELECT 
        id,
        key,
        value,
        description,
        is_public,
        created_at,
        updated_at
      FROM system_config
      WHERE key = $1
    `;

    const result = await query(configQuery, [configKey]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Configuración '${configKey}' no encontrada`
      });
    }

    const config = result.rows[0];

    try {
      config.value = JSON.parse(config.value);
    } catch (error) {
      console.warn(`⚠️ Error parsing config ${configKey}:`, error);
      config.parse_error = true;
    }

    console.log(`✅ Configuración obtenida: ${configKey}`);

    res.json({
      success: true,
      data: {
        config
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// ✏️ ACTUALIZAR CONFIGURACIÓN
// ===============================================
router.put('/key/:configKey', async (req, res) => {
  try {
    const { configKey } = req.params;
    const { value, description, is_public } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'El campo value es requerido'
      });
    }

    // Validar que el valor sea JSON válido
    let jsonValue;
    try {
      jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      JSON.parse(jsonValue); // Validar que sea JSON válido
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'El valor debe ser JSON válido'
      });
    }

    // Construir query de actualización dinámicamente
    const updates = ['value = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [configKey, jsonValue];
    let paramIndex = 3;

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (is_public !== undefined) {
      updates.push(`is_public = $${paramIndex}`);
      values.push(is_public);
      paramIndex++;
    }

    const updateQuery = `
      UPDATE system_config 
      SET ${updates.join(', ')}
      WHERE key = $1
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Configuración '${configKey}' no encontrada`
      });
    }

    const updatedConfig = result.rows[0];

    // Intentar parsear el valor de respuesta
    try {
      updatedConfig.value = JSON.parse(updatedConfig.value);
    } catch (error) {
      console.warn(`⚠️ Error parsing updated config ${configKey}:`, error);
    }

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'update_config', 'system_config', $2, $3)
    `, [
      req.user.id,
      configKey,
      JSON.stringify({
        updated_fields: Object.keys(req.body),
        by: req.user.username,
        previous_value_hash: require('crypto').createHash('md5').update(JSON.stringify(value)).digest('hex').substring(0, 8)
      })
    ]);

    console.log(`✅ Configuración actualizada: ${configKey}`);

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: {
        config: updatedConfig
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// ➕ CREAR NUEVA CONFIGURACIÓN
// ===============================================
router.post('/', async (req, res) => {
  try {
    const { key, value, description = '', is_public = false } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Los campos key y value son requeridos'
      });
    }

    // Validar formato de key
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      return res.status(400).json({
        success: false,
        error: 'La key debe contener solo letras minúsculas, números y guiones bajos, comenzando con letra'
      });
    }

    // Validar que el valor sea JSON válido
    let jsonValue;
    try {
      jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      JSON.parse(jsonValue); // Validar que sea JSON válido
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'El valor debe ser JSON válido'
      });
    }

    const insertQuery = `
      INSERT INTO system_config (key, value, description, is_public, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await query(insertQuery, [key, jsonValue, description, is_public]);
    const newConfig = result.rows[0];

    // Intentar parsear el valor de respuesta
    try {
      newConfig.value = JSON.parse(newConfig.value);
    } catch (error) {
      console.warn(`⚠️ Error parsing new config ${key}:`, error);
    }

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'create_config', 'system_config', $2, $3)
    `, [
      req.user.id,
      key,
      JSON.stringify({
        created_by: req.user.username,
        is_public,
        description
      })
    ]);

    console.log(`✅ Nueva configuración creada: ${key}`);

    res.status(201).json({
      success: true,
      message: 'Configuración creada correctamente',
      data: {
        config: newConfig
      }
    });

  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'Ya existe una configuración con esa key'
      });
    }

    console.error('❌ Error creando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// ❌ ELIMINAR CONFIGURACIÓN
// ===============================================
router.delete('/key/:configKey', async (req, res) => {
  try {
    const { configKey } = req.params;
    const { confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere confirmación para eliminar la configuración'
      });
    }

    // Verificar que la configuración existe
    const checkQuery = `SELECT * FROM system_config WHERE key = $1`;
    const checkResult = await query(checkQuery, [configKey]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Configuración '${configKey}' no encontrada`
      });
    }

    const configToDelete = checkResult.rows[0];

    // Eliminar configuración
    const deleteQuery = `DELETE FROM system_config WHERE key = $1 RETURNING *`;
    const result = await query(deleteQuery, [configKey]);

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'delete_config', 'system_config', $2, $3)
    `, [
      req.user.id,
      configKey,
      JSON.stringify({
        deleted_by: req.user.username,
        was_public: configToDelete.is_public,
        description: configToDelete.description
      })
    ]);

    console.log(`✅ Configuración eliminada: ${configKey}`);

    res.json({
      success: true,
      message: 'Configuración eliminada correctamente',
      data: {
        deleted_key: configKey,
        deleted_config: configToDelete
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 🚀 CONFIGURACIONES PARA PRODUCCIÓN
// ===============================================
router.get('/production', async (req, res) => {
  try {
    // Configuraciones críticas para producción
    const productionConfigsQuery = `
      SELECT 
        key,
        value,
        description,
        updated_at
      FROM system_config
      WHERE key IN (
        'company_info',
        'travel_compositor',
        'payment_gateways',
        'email_settings',
        'security_settings',
        'api_endpoints',
        'cache_settings',
        'monitoring_config'
      ) OR key LIKE 'prod_%'
      ORDER BY key ASC
    `;

    const result = await query(productionConfigsQuery);

    const productionConfigs = {};
    result.rows.forEach(row => {
      try {
        productionConfigs[row.key] = {
          value: JSON.parse(row.value),
          description: row.description,
          last_updated: row.updated_at
        };
      } catch (error) {
        console.warn(`⚠️ Error parsing production config ${row.key}:`, error);
        productionConfigs[row.key] = {
          value: row.value,
          description: row.description,
          last_updated: row.updated_at,
          parse_error: true
        };
      }
    });

    // Verificar configuraciones críticas faltantes
    const requiredConfigs = [
      'company_info',
      'travel_compositor'
    ];

    const missingConfigs = requiredConfigs.filter(key => !productionConfigs[key]);

    console.log('✅ Configuraciones de producción obtenidas');

    res.json({
      success: true,
      data: {
        configs: productionConfigs,
        summary: {
          total_configs: Object.keys(productionConfigs).length,
          missing_critical: missingConfigs,
          is_production_ready: missingConfigs.length === 0
        },
        warnings: missingConfigs.length > 0 ? [
          `Configuraciones críticas faltantes: ${missingConfigs.join(', ')}`
        ] : []
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo configuraciones de producción:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 📊 ESTADÍSTICAS DE CONFIGURACIÓN
// ===============================================
router.get('/stats', async (req, res) => {
  try {
    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_configs,
        COUNT(*) FILTER (WHERE is_public = true) as public_configs,
        COUNT(*) FILTER (WHERE is_public = false) as private_configs,
        COUNT(DISTINCT split_part(key, '_', 1)) as categories_count
      FROM system_config
    `;

    const statsResult = await query(statsQuery);
    const stats = statsResult.rows[0];

    // Configuraciones por categoría
    const categoriesQuery = `
      SELECT 
        split_part(key, '_', 1) as category,
        COUNT(*) as config_count,
        COUNT(*) FILTER (WHERE is_public = true) as public_count,
        MAX(updated_at) as last_updated
      FROM system_config
      GROUP BY split_part(key, '_', 1)
      ORDER BY config_count DESC
    `;

    const categoriesResult = await query(categoriesQuery);

    // Actividad reciente
    const recentActivityQuery = `
      SELECT 
        action,
        resource_id,
        details,
        created_at
      FROM admin_activity 
      WHERE resource_type = 'system_config'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const recentActivityResult = await query(recentActivityQuery);

    console.log('✅ Estadísticas de configuración generadas');

    res.json({
      success: true,
      data: {
        summary: {
          total_configs: parseInt(stats.total_configs),
          public_configs: parseInt(stats.public_configs),
          private_configs: parseInt(stats.private_configs),
          categories_count: parseInt(stats.categories_count)
        },
        categories: categoriesResult.rows,
        recent_activity: recentActivityResult.rows,
        system_health: {
          config_coverage: stats.total_configs > 5 ? 'good' : 'needs_attention',
          last_activity: recentActivityResult.rows[0]?.created_at || null
        }
      }
    });

  } catch (error) {
    console.error('❌ Error generando estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 🔄 BACKUP Y RESTORE DE CONFIGURACIÓN
// ===============================================
router.post('/backup', async (req, res) => {
  try {
    // Obtener todas las configuraciones
    const backupQuery = `
      SELECT key, value, description, is_public, created_at, updated_at
      FROM system_config
      ORDER BY key ASC
    `;

    const result = await query(backupQuery);

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      total_configs: result.rows.length,
      configs: result.rows.map(row => ({
        ...row,
        value: JSON.parse(row.value)
      })),
      created_by: req.user.username
    };

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'backup_config', 'system_config', 'backup', $2)
    `, [
      req.user.id,
      JSON.stringify({
        backup_timestamp: backup.timestamp,
        configs_count: backup.total_configs,
        by: req.user.username
      })
    ]);

    console.log('✅ Backup de configuración creado');

    res.json({
      success: true,
      message: 'Backup de configuración creado correctamente',
      data: backup
    });

  } catch (error) {
    console.error('❌ Error creando backup:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
