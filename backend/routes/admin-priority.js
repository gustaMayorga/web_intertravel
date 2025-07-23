// ===============================================
// RUTAS ADMIN - PALABRAS CLAVE Y BANNERS
// ===============================================

const express = require('express');
const router = express.Router();
const keywordStorage = require('../keyword-storage');

// Importar JWT para compatibilidad con sistema principal
const jwt = require('jsonwebtoken');

// Middleware de autenticación unificado
function requireAuth(req, res, next) {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ Auth: Token no proporcionado');
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }
  
  try {
    // MÉTODO 1: Intentar verificar JWT token (sistema principal)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };
    
    console.log('✅ Auth JWT: Token válido para usuario:', decoded.username);
    return next();
    
  } catch (jwtError) {
    console.log('⚠️ JWT falló, intentando método alternativo...');
    
    // MÉTODO 2: Verificar en activeTokens (sistema legacy)
    if (req.app && req.app.locals && req.app.locals.activeTokens) {
      const user = req.app.locals.activeTokens.get(token);
      if (user && Date.now() <= user.expiresAt) {
        req.user = user;
        console.log('✅ Auth Legacy: Token válido para usuario:', user.username);
        return next();
      }
    }
    
    // MÉTODO 3: Modo de desarrollo (fallback)
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Auth: Usando modo desarrollo (tokens bypassed)');
      req.user = { username: 'admin', role: 'admin', id: 'dev-admin' };
      return next();
    }
    
    // Si todos los métodos fallan
    console.log('❌ Auth: Token inválido o no encontrado');
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
}

// ===============================================
// GESTIÓN DE PALABRAS CLAVE PRIORITARIAS
// ===============================================

// Obtener todas las palabras clave
router.get('/priority-keywords', requireAuth, async (req, res) => {
  try {
    console.log('📋 Solicitando todas las palabras clave...');
    
    const keywords = keywordStorage.getAllKeywords();
    const stats = keywordStorage.getStats();
    
    console.log(`📊 Enviando ${keywords.length} palabras clave de priorización`);
    console.log(`📊 Stats: ${stats.active} activas, ${stats.inactive} inactivas, ${stats.categories.length} categorías`);

    res.json({
      success: true,
      keywords: keywords,
      total: keywords.length,
      categories: stats.categories,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo palabras clave:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Agregar nueva palabra clave
router.post('/priority-keywords', requireAuth, async (req, res) => {
  try {
    const { keyword, priority, category, description } = req.body;

    if (!keyword || !priority) {
      return res.status(400).json({
        success: false,
        error: 'Palabra clave y prioridad son requeridos'
      });
    }

    console.log(`➡️ Agregando nueva palabra clave: "${keyword}" (prioridad ${priority})`);
    
    const newKeyword = keywordStorage.addKeyword({
      keyword,
      priority,
      category,
      description,
      created_by: req.user.username
    });

    if (newKeyword) {
      console.log(`✅ Nueva palabra clave agregada exitosamente: ID ${newKeyword.id}`);
      
      res.json({
        success: true,
        keyword: newKeyword,
        message: 'Palabra clave agregada exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error guardando palabra clave'
      });
    }

  } catch (error) {
    console.error('❌ Error agregando palabra clave:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar palabra clave
router.put('/priority-keywords/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, priority, category, description, active } = req.body;

    console.log(`✏️ Actualizando palabra clave ID ${id}...`);

    const updateData = {};
    if (keyword !== undefined) updateData.keyword = keyword.toLowerCase().trim();
    if (priority !== undefined) updateData.priority = parseInt(priority);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = Boolean(active);

    const updatedKeyword = keywordStorage.updateKeyword(id, updateData);

    if (updatedKeyword) {
      console.log(`✅ Palabra clave actualizada exitosamente: ID ${id}`);
      
      res.json({
        success: true,
        keyword: updatedKeyword,
        message: 'Palabra clave actualizada exitosamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Palabra clave no encontrada'
      });
    }

  } catch (error) {
    console.error('❌ Error actualizando palabra clave:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Eliminar palabra clave
router.delete('/priority-keywords/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Eliminando palabra clave ID ${id}...`);

    const success = keywordStorage.deleteKeyword(id);

    if (success) {
      console.log(`✅ Palabra clave eliminada exitosamente: ID ${id}`);
      
      res.json({
        success: true,
        message: 'Palabra clave eliminada exitosamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Palabra clave no encontrada'
      });
    }

  } catch (error) {
    console.error('❌ Error eliminando palabra clave:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de keywords
router.get('/priority-keywords/stats', requireAuth, async (req, res) => {
  try {
    const stats = keywordStorage.getStats();
    
    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Crear backup de keywords
router.post('/priority-keywords/backup', requireAuth, async (req, res) => {
  try {
    const backupFile = keywordStorage.createBackup();
    
    if (backupFile) {
      res.json({
        success: true,
        message: 'Backup creado exitosamente',
        file: backupFile
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error creando backup'
      });
    }

  } catch (error) {
    console.error('❌ Error creando backup:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Reset keywords a datos por defecto
router.post('/priority-keywords/reset', requireAuth, async (req, res) => {
  try {
    const success = keywordStorage.reset();
    
    if (success) {
      res.json({
        success: true,
        message: 'Keywords reseteadas a datos por defecto'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error reseteando keywords'
      });
    }

  } catch (error) {
    console.error('❌ Error reseteando keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// GESTIÓN DE BANNERS CONFIGURABLES
// ===============================================

// Obtener todos los banners
router.get('/banners', requireAuth, async (req, res) => {
  try {
    const mockBanners = [
      {
        id: 1,
        name: 'hero_main',
        title: 'Descubre el Mundo con InterTravel',
        subtitle: 'Experiencias únicas e inolvidables',
        description: 'Los mejores destinos del mundo te esperan. Paquetes exclusivos con la calidad que nos caracteriza.',
        image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop',
        button_text: 'Ver Paquetes',
        button_url: '/packages',
        background_color: '#ffffff',
        text_color: '#000000',
        position: 'hero',
        active: true,
        order_index: 1
      },
      {
        id: 2,
        name: 'promo_wine',
        title: '🍷 Tours de Vino en Mendoza',
        subtitle: 'Experiencia Premium en la Capital del Vino',
        description: 'Descubre los mejores viñedos de Mendoza con nuestros tours exclusivos. Degustaciones, cenas gourmet y alojamiento de lujo.',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        button_text: 'Reservar Ahora',
        button_url: '/packages?search=mendoza+wine',
        background_color: '#8B0000',
        text_color: '#ffffff',
        position: 'sidebar',
        active: true,
        order_index: 2
      },
      {
        id: 3,
        name: 'offer_peru',
        title: '🏔️ Perú Mágico - Oferta Especial',
        subtitle: 'Machu Picchu y mucho más',
        description: 'Conoce las maravillas del imperio Inca. Paquetes completos con guías especializados y experiencias auténticas.',
        image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=400&fit=crop',
        button_text: 'Ver Ofertas',
        button_url: '/packages?search=peru',
        background_color: '#228B22',
        text_color: '#ffffff',
        position: 'card',
        active: true,
        order_index: 3
      }
    ];

    console.log(`🎨 Enviando ${mockBanners.length} banners configurables`);

    res.json({
      success: true,
      banners: mockBanners,
      total: mockBanners.length,
      positions: [...new Set(mockBanners.map(b => b.position))]
    });

  } catch (error) {
    console.error('❌ Error obteniendo banners:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener banners públicos (sin autenticación)
router.get('/public/banners', async (req, res) => {
  try {
    const { position } = req.query;

    const mockBanners = [
      {
        id: 1,
        name: 'hero_main',
        title: 'Descubre el Mundo con InterTravel',
        subtitle: 'Experiencias únicas e inolvidables',
        description: 'Los mejores destinos del mundo te esperan. Paquetes exclusivos con la calidad que nos caracteriza.',
        image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=600&fit=crop',
        button_text: 'Ver Paquetes',
        button_url: '/packages',
        background_color: '#ffffff',
        text_color: '#000000',
        position: 'hero',
        active: true,
        order_index: 1
      },
      {
        id: 2,
        name: 'promo_wine',
        title: '🍷 Tours de Vino en Mendoza',
        subtitle: 'Experiencia Premium en la Capital del Vino',
        description: 'Descubre los mejores viñedos de Mendoza con nuestros tours exclusivos.',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        button_text: 'Reservar Ahora',
        button_url: '/packages?search=mendoza+wine',
        background_color: '#8B0000',
        text_color: '#ffffff',
        position: 'sidebar',
        active: true,
        order_index: 2
      },
      {
        id: 3,
        name: 'offer_peru',
        title: '🏔️ Perú Mágico - Oferta Especial',
        subtitle: 'Machu Picchu y mucho más',
        description: 'Conoce las maravillas del imperio Inca. Paquetes completos con guías especializados.',
        image_url: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&h=400&fit=crop',
        button_text: 'Ver Ofertas',
        button_url: '/packages?search=peru',
        background_color: '#228B22',
        text_color: '#ffffff',
        position: 'card',
        active: true,
        order_index: 3
      }
    ];

    let banners = mockBanners.filter(banner => banner.active);

    if (position) {
      banners = banners.filter(banner => banner.position === position);
    }

    banners.sort((a, b) => a.order_index - b.order_index);

    res.json({
      success: true,
      banners: banners,
      total: banners.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo banners públicos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;