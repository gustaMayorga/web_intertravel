// ===============================================
// CMS PARA CONTROL DE WEB PÚBLICA - INTERTRAVEL
// Solución para administrar landing page desde admin
// ===============================================

const express = require('express');
const { authMiddleware } = require('../middleware/auth-secure');
const { query } = require('../database');

const router = express.Router();

// ===============================================
// OBTENER CONTENIDO CMS
// ===============================================

router.get('/content', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    console.log('📝 Getting CMS content');

    const result = await query(`
      SELECT 
        id,
        content_key,
        content_type,
        title,
        content,
        metadata,
        is_published,
        updated_at
      FROM cms_content 
      ORDER BY content_key
    `);

    // Registrar auditoría
    await query(`
      INSERT INTO admin_activity_log (user_id, action, resource, success)
      VALUES ($1, 'view_cms_content', 'cms', true)
    `, [req.user.id]);

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('❌ Error getting CMS content:', error);
    
    // Registrar error en auditoría
    await query(`
      INSERT INTO admin_activity_log (user_id, action, resource, success, details)
      VALUES ($1, 'view_cms_content', 'cms', false, $2)
    `, [req.user.id, JSON.stringify({ error: error.message })]);

    res.status(500).json({
      success: false,
      error: 'Error al obtener contenido CMS'
    });
  }
});

// ===============================================
// OBTENER CONTENIDO ESPECÍFICO POR CLAVE
// ===============================================

router.get('/content/:key', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const { key } = req.params;
    console.log('📝 Getting specific CMS content:', key);

    const result = await query(`
      SELECT 
        id,
        content_key,
        content_type,
        title,
        content,
        metadata,
        is_published,
        created_at,
        updated_at
      FROM cms_content 
      WHERE content_key = $1
    `, [key]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contenido no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error getting specific CMS content:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener contenido específico'
    });
  }
});

// ===============================================
// ACTUALIZAR CONTENIDO CMS
// ===============================================

router.put('/content/:key', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const { key } = req.params;
    const { title, content, content_type, metadata, is_published } = req.body;

    console.log('📝 Updating CMS content:', key);

    // Verificar si el contenido existe
    const existingContent = await query(`
      SELECT id FROM cms_content WHERE content_key = $1
    `, [key]);

    let result;

    if (existingContent.rowCount === 0) {
      // Crear nuevo contenido
      result = await query(`
        INSERT INTO cms_content (
          content_key, content_type, title, content, metadata, is_published, 
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        RETURNING *
      `, [key, content_type || 'text', title, content, metadata || {}, is_published || false, req.user.id]);
    } else {
      // Actualizar contenido existente
      result = await query(`
        UPDATE cms_content 
        SET title = $2, content = $3, content_type = $4, metadata = $5, 
            is_published = $6, updated_by = $7, updated_at = CURRENT_TIMESTAMP
        WHERE content_key = $1
        RETURNING *
      `, [key, title, content, content_type || 'text', metadata || {}, is_published || false, req.user.id]);
    }

    // Registrar auditoría
    await query(`
      INSERT INTO admin_activity_log (user_id, action, resource, resource_id, success, details)
      VALUES ($1, 'update_cms_content', 'cms', $2, true, $3)
    `, [req.user.id, key, JSON.stringify({ title, content_type, is_published })]);

    res.json({
      success: true,
      message: 'Contenido actualizado exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating CMS content:', error);
    
    // Registrar error en auditoría
    await query(`
      INSERT INTO admin_activity_log (user_id, action, resource, resource_id, success, details)
      VALUES ($1, 'update_cms_content', 'cms', $2, false, $3)
    `, [req.user.id, req.params.key, JSON.stringify({ error: error.message })]);

    res.status(500).json({
      success: false,
      error: 'Error al actualizar contenido'
    });
  }
});

// ===============================================
// GESTIÓN DE PAQUETES DESTACADOS
// ===============================================

router.get('/featured-packages', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    console.log('⭐ Getting featured packages configuration');

    const result = await query(`
      SELECT content FROM cms_content 
      WHERE content_key = 'featured_packages' AND is_published = true
    `);

    let featuredPackages = [];
    if (result.rowCount > 0) {
      featuredPackages = JSON.parse(result.rows[0].content);
    }

    res.json({
      success: true,
      data: { featured_packages: featuredPackages }
    });

  } catch (error) {
    console.error('❌ Error getting featured packages:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener paquetes destacados'
    });
  }
});

router.put('/featured-packages', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const { packages } = req.body;
    console.log('⭐ Updating featured packages:', packages);

    // Actualizar o crear configuración de paquetes destacados
    const result = await query(`
      INSERT INTO cms_content (
        content_key, content_type, title, content, is_published, created_by, updated_by
      ) VALUES (
        'featured_packages', 'json', 'Paquetes Destacados', $1, true, $2, $2
      )
      ON CONFLICT (content_key) 
      DO UPDATE SET 
        content = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [JSON.stringify(packages), req.user.id]);

    // Registrar auditoría
    await query(`
      INSERT INTO admin_activity_log (user_id, action, resource, success, details)
      VALUES ($1, 'update_featured_packages', 'cms', true, $2)
    `, [req.user.id, JSON.stringify({ packages_count: packages.length })]);

    res.json({
      success: true,
      message: 'Paquetes destacados actualizados exitosamente',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating featured packages:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar paquetes destacados'
    });
  }
});

// ===============================================
// CONFIGURACIÓN DE WHATSAPP
// ===============================================

router.get('/whatsapp-config', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    console.log('💬 Getting WhatsApp configuration');

    const result = await query(`
      SELECT content_key, content FROM cms_content 
      WHERE content_key IN ('whatsapp_number', 'whatsapp_message') 
      AND is_published = true
    `);

    const config = {};
    result.rows.forEach(row => {
      config[row.content_key] = row.content;
    });

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('❌ Error getting WhatsApp config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración de WhatsApp'
    });
  }
});

router.put('/whatsapp-config', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const { number, message } = req.body;
    console.log('💬 Updating WhatsApp configuration');

    // Actualizar número de WhatsApp
    await query(`
      INSERT INTO cms_content (
        content_key, content_type, title, content, is_published, created_by, updated_by
      ) VALUES (
        'whatsapp_number', 'text', 'Número WhatsApp', $1, true, $2, $2
      )
      ON CONFLICT (content_key) 
      DO UPDATE SET 
        content = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
    `, [number, req.user.id]);

    // Actualizar mensaje de WhatsApp
    await query(`
      INSERT INTO cms_content (
        content_key, content_type, title, content, is_published, created_by, updated_by
      ) VALUES (
        'whatsapp_message', 'text', 'Mensaje WhatsApp', $1, true, $2, $2
      )
      ON CONFLICT (content_key) 
      DO UPDATE SET 
        content = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
    `, [message, req.user.id]);

    // Registrar auditoría
    await query(`
      INSERT INTO admin_activity_log (user_id, action, resource, success, details)
      VALUES ($1, 'update_whatsapp_config', 'cms', true, $2)
    `, [req.user.id, JSON.stringify({ number, message })]);

    res.json({
      success: true,
      message: 'Configuración de WhatsApp actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error updating WhatsApp config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar configuración de WhatsApp'
    });
  }
});

// ===============================================
// OBTENER CONTENIDO PARA WEB PÚBLICA (SIN AUTH)
// ===============================================

router.get('/public/content/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log('🌐 Getting public content:', key);

    const result = await query(`
      SELECT content_key, content, content_type, title, metadata
      FROM cms_content 
      WHERE content_key = $1 AND is_published = true
    `, [key]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contenido no encontrado o no publicado'
      });
    }

    const content = result.rows[0];
    
    // Parse JSON si es necesario
    if (content.content_type === 'json') {
      try {
        content.content = JSON.parse(content.content);
      } catch (e) {
        console.warn('Error parsing JSON content:', e);
      }
    }

    res.json({
      success: true,
      data: content
    });

  } catch (error) {
    console.error('❌ Error getting public content:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener contenido público'
    });
  }
});

// ===============================================
// OBTENER TODA LA CONFIGURACIÓN PÚBLICA
// ===============================================

router.get('/public/config', async (req, res) => {
  try {
    console.log('🌐 Getting all public configuration');

    const result = await query(`
      SELECT content_key, content, content_type
      FROM cms_content 
      WHERE is_published = true
    `);

    const config = {};
    result.rows.forEach(row => {
      let content = row.content;
      
      // Parse JSON si es necesario
      if (row.content_type === 'json') {
        try {
          content = JSON.parse(content);
        } catch (e) {
          console.warn('Error parsing JSON content for', row.content_key, ':', e);
        }
      }
      
      config[row.content_key] = content;
    });

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('❌ Error getting public config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración pública'
    });
  }
});

// ===============================================
// PREVISUALIZAR CAMBIOS (ANTES DE PUBLICAR)
// ===============================================

router.get('/preview/:key', authMiddleware(['admin', 'super_admin']), async (req, res) => {
  try {
    const { key } = req.params;
    console.log('👁️ Previewing content:', key);

    const result = await query(`
      SELECT 
        content_key, content, content_type, title, metadata, is_published
      FROM cms_content 
      WHERE content_key = $1
    `, [key]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contenido no encontrado'
      });
    }

    const content = result.rows[0];
    
    // Parse JSON si es necesario
    if (content.content_type === 'json') {
      try {
        content.content = JSON.parse(content.content);
      } catch (e) {
        console.warn('Error parsing JSON content:', e);
      }
    }

    res.json({
      success: true,
      data: content,
      preview: true
    });

  } catch (error) {
    console.error('❌ Error previewing content:', error);
    res.status(500).json({
      success: false,
      error: 'Error al previsualizar contenido'
    });
  }
});

module.exports = router;

console.log('✅ CMS routes loaded - Web public control enabled');
