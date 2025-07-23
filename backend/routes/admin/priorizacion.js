// ===============================================
// CONTROLADOR DE PRIORIZACIÓN - INTERTRAVEL ADMIN
// Sistema de ranking y palabras clave para paquetes
// ===============================================

const express = require('express');
const router = express.Router();
const { query } = require('../../database');

// ===============================================
// 📊 OBTENER CONFIGURACIÓN ACTIVA DE PRIORIZACIÓN
// ===============================================
router.get('/config', async (req, res) => {
  try {
    // Obtener configuración actual desde system_config
    const configQuery = `
      SELECT key, value, description, updated_at
      FROM system_config 
      WHERE key LIKE 'priority_%' OR key LIKE 'keywords_%'
      ORDER BY key
    `;

    const configResult = await query(configQuery);
    
    // Configuración por defecto si no existe
    const defaultConfig = {
      priority_algorithm: {
        enabled: true,
        base_score: 50,
        keyword_boost: 25,
        category_boost: 15,
        rating_boost: 10,
        price_factor: 0.1,
        special_events: {
          quince_anos: {
            enabled: true,
            boost: 50,
            keywords: ['15 años', 'quince años', 'quinceañera', 'cumple 15']
          }
        }
      },
      keywords_config: {
        high_priority: ['bariloche', 'europa', 'disney', 'crucero', 'cancun', 'miami'],
        medium_priority: ['brasil', 'chile', 'peru', 'new york', 'paris'],
        low_priority: ['argentina', 'mendoza', 'cordoba', 'salta'],
        special_events: ['15 años', 'luna de miel', 'graduacion', 'aniversario']
      }
    };

    // Convertir resultados a objeto
    const currentConfig = {};
    configResult.rows.forEach(row => {
      try {
        currentConfig[row.key] = JSON.parse(row.value);
      } catch (error) {
        console.warn(`⚠️ Error parsing config ${row.key}:`, error);
        currentConfig[row.key] = row.value;
      }
    });

    // Merge con configuración por defecto
    const finalConfig = {
      ...defaultConfig,
      ...currentConfig
    };

    console.log('✅ Configuración de priorización obtenida');

    res.json({
      success: true,
      data: {
        config: finalConfig,
        last_updated: configResult.rows.length > 0 ? 
          configResult.rows[0].updated_at : null,
        status: 'active'
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
// ✏️ ACTUALIZAR CONFIGURACIÓN DE PRIORIZACIÓN
// ===============================================
router.put('/config', async (req, res) => {
  try {
    const { priority_algorithm, keywords_config } = req.body;

    if (!priority_algorithm && !keywords_config) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos priority_algorithm o keywords_config'
      });
    }

    const updates = [];

    // Actualizar algoritmo de priorización
    if (priority_algorithm) {
      await query(`
        INSERT INTO system_config (key, value, description, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
      `, [
        'priority_algorithm',
        JSON.stringify(priority_algorithm),
        'Configuración del algoritmo de priorización de paquetes'
      ]);
      updates.push('priority_algorithm');
    }

    // Actualizar configuración de palabras clave
    if (keywords_config) {
      await query(`
        INSERT INTO system_config (key, value, description, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = CURRENT_TIMESTAMP
      `, [
        'keywords_config',
        JSON.stringify(keywords_config),
        'Configuración de palabras clave para priorización'
      ]);
      updates.push('keywords_config');
    }

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'update_config', 'priority_system', 'config', $2)
    `, [
      req.user.id,
      JSON.stringify({ updated_fields: updates, by: req.user.username })
    ]);

    console.log('✅ Configuración de priorización actualizada');

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: {
        updated_fields: updates,
        timestamp: new Date().toISOString()
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
// 🧪 PROBAR ALGORITMO DE SCORING
// ===============================================
router.post('/test-scoring', async (req, res) => {
  try {
    const { package_ids = [], test_query = '' } = req.body;

    // Obtener configuración actual
    const configResult = await query(`
      SELECT value FROM system_config 
      WHERE key = 'priority_algorithm'
    `);

    let config = {
      enabled: true,
      base_score: 50,
      keyword_boost: 25,
      category_boost: 15,
      rating_boost: 10,
      price_factor: 0.1
    };

    if (configResult.rows.length > 0) {
      try {
        config = JSON.parse(configResult.rows[0].value);
      } catch (error) {
        console.warn('⚠️ Error parsing algorithm config, using defaults');
      }
    }

    // Obtener paquetes para testear
    let packagesQuery = `
      SELECT 
        package_id,
        title,
        destination,
        country,
        price_amount,
        category,
        rating_average,
        is_featured,
        description_short
      FROM packages
      WHERE status = 'active'
    `;

    let queryParams = [];

    if (package_ids.length > 0) {
      packagesQuery += ` AND package_id = ANY($1)`;
      queryParams.push(package_ids);
    } else {
      packagesQuery += ` LIMIT 20`;
    }

    const packagesResult = await query(packagesQuery, queryParams);

    // Calcular score para cada paquete
    const scoredPackages = packagesResult.rows.map(pkg => {
      let score = config.base_score;

      // Boost por palabras clave en el query de prueba
      if (test_query) {
        const queryLower = test_query.toLowerCase();
        const titleLower = pkg.title.toLowerCase();
        const destLower = pkg.destination.toLowerCase();

        // Palabras clave de alta prioridad
        const highPriorityKeywords = ['bariloche', 'europa', 'disney', 'crucero', '15 años'];
        const mediumPriorityKeywords = ['brasil', 'chile', 'peru', 'new york'];

        for (const keyword of highPriorityKeywords) {
          if (queryLower.includes(keyword) && 
              (titleLower.includes(keyword) || destLower.includes(keyword))) {
            score += config.keyword_boost;
            break;
          }
        }

        for (const keyword of mediumPriorityKeywords) {
          if (queryLower.includes(keyword) && 
              (titleLower.includes(keyword) || destLower.includes(keyword))) {
            score += config.keyword_boost * 0.7;
            break;
          }
        }
      }

      // Boost por categoría premium
      if (pkg.category && ['premium', 'luxury', 'exclusive'].includes(pkg.category.toLowerCase())) {
        score += config.category_boost;
      }

      // Boost por rating
      if (pkg.rating_average) {
        score += (pkg.rating_average / 5) * config.rating_boost;
      }

      // Boost por destacado
      if (pkg.is_featured) {
        score += 20;
      }

      // Factor de precio (paquetes más caros tienen ligero boost)
      if (pkg.price_amount) {
        score += Math.min(pkg.price_amount * config.price_factor, 15);
      }

      // Evento especial: 15 años
      if (test_query && test_query.toLowerCase().includes('15 años')) {
        const fifteenKeywords = ['quinceañera', 'quince', '15', 'bariloche', 'disney', 'europa'];
        for (const keyword of fifteenKeywords) {
          if (pkg.title.toLowerCase().includes(keyword) || 
              pkg.destination.toLowerCase().includes(keyword)) {
            score += 50; // Boost especial para 15 años
            break;
          }
        }
      }

      return {
        ...pkg,
        calculated_score: Math.round(score),
        score_breakdown: {
          base: config.base_score,
          keyword_boost: score > config.base_score ? 'Applied' : 'Not applied',
          category_boost: pkg.category ? 'Applied' : 'Not applied',
          rating_boost: pkg.rating_average ? `+${((pkg.rating_average / 5) * config.rating_boost).toFixed(1)}` : 'No rating',
          featured_boost: pkg.is_featured ? '+20' : 'Not featured',
          special_event: test_query?.toLowerCase().includes('15 años') ? 'Quince años detected' : 'None'
        }
      };
    });

    // Ordenar por score
    scoredPackages.sort((a, b) => b.calculated_score - a.calculated_score);

    console.log('✅ Test de algoritmo de scoring completado');

    res.json({
      success: true,
      data: {
        test_query,
        config_used: config,
        results: scoredPackages,
        summary: {
          packages_tested: scoredPackages.length,
          highest_score: scoredPackages[0]?.calculated_score || 0,
          lowest_score: scoredPackages[scoredPackages.length - 1]?.calculated_score || 0,
          avg_score: scoredPackages.length > 0 ? 
            (scoredPackages.reduce((sum, pkg) => sum + pkg.calculated_score, 0) / scoredPackages.length).toFixed(1) : 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en test de scoring:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// 📝 OBTENER PALABRAS CLAVE ACTUALES
// ===============================================
router.get('/keywords', async (req, res) => {
  try {
    const keywordsResult = await query(`
      SELECT value FROM system_config 
      WHERE key = 'keywords_config'
    `);

    let keywords = {
      high_priority: ['bariloche', 'europa', 'disney', 'crucero', 'cancun', 'miami'],
      medium_priority: ['brasil', 'chile', 'peru', 'new york', 'paris'],
      low_priority: ['argentina', 'mendoza', 'cordoba', 'salta'],
      special_events: ['15 años', 'luna de miel', 'graduacion', 'aniversario']
    };

    if (keywordsResult.rows.length > 0) {
      try {
        keywords = JSON.parse(keywordsResult.rows[0].value);
      } catch (error) {
        console.warn('⚠️ Error parsing keywords config, using defaults');
      }
    }

    // Obtener estadísticas de uso de palabras clave
    const statsQuery = `
      SELECT 
        destination,
        country,
        category,
        COUNT(*) as package_count,
        AVG(rating_average) as avg_rating,
        AVG(price_amount) as avg_price
      FROM packages 
      WHERE status = 'active'
      GROUP BY destination, country, category
      ORDER BY package_count DESC
      LIMIT 20
    `;

    const statsResult = await query(statsQuery);

    console.log('✅ Palabras clave obtenidas');

    res.json({
      success: true,
      data: {
        keywords,
        usage_stats: statsResult.rows,
        categories: {
          total_keywords: Object.values(keywords).flat().length,
          high_priority_count: keywords.high_priority?.length || 0,
          medium_priority_count: keywords.medium_priority?.length || 0,
          low_priority_count: keywords.low_priority?.length || 0,
          special_events_count: keywords.special_events?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo palabras clave:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// ✏️ ACTUALIZAR PALABRAS CLAVE
// ===============================================
router.put('/keywords', async (req, res) => {
  try {
    const { high_priority, medium_priority, low_priority, special_events } = req.body;

    const keywords = {};

    if (high_priority) keywords.high_priority = high_priority;
    if (medium_priority) keywords.medium_priority = medium_priority;
    if (low_priority) keywords.low_priority = low_priority;
    if (special_events) keywords.special_events = special_events;

    if (Object.keys(keywords).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos una categoría de palabras clave'
      });
    }

    // Obtener configuración actual y hacer merge
    const currentResult = await query(`
      SELECT value FROM system_config 
      WHERE key = 'keywords_config'
    `);

    let currentKeywords = {};
    if (currentResult.rows.length > 0) {
      try {
        currentKeywords = JSON.parse(currentResult.rows[0].value);
      } catch (error) {
        console.warn('⚠️ Error parsing current keywords, using empty object');
      }
    }

    // Merge configuración actual con nuevos valores
    const updatedKeywords = {
      ...currentKeywords,
      ...keywords
    };

    // Guardar configuración actualizada
    await query(`
      INSERT INTO system_config (key, value, description, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'keywords_config',
      JSON.stringify(updatedKeywords),
      'Configuración de palabras clave para priorización'
    ]);

    // Registrar actividad
    await query(`
      INSERT INTO admin_activity (user_id, action, resource_type, resource_id, details)
      VALUES ($1, 'update_keywords', 'priority_system', 'keywords', $2)
    `, [
      req.user.id,
      JSON.stringify({
        updated_categories: Object.keys(keywords),
        by: req.user.username,
        total_keywords: Object.values(updatedKeywords).flat().length
      })
    ]);

    console.log('✅ Palabras clave actualizadas');

    res.json({
      success: true,
      message: 'Palabras clave actualizadas correctamente',
      data: {
        keywords: updatedKeywords,
        updated_categories: Object.keys(keywords),
        total_keywords: Object.values(updatedKeywords).flat().length
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando palabras clave:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

module.exports = router;
