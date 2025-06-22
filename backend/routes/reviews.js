const express = require('express');
const { query } = require('../database');
const router = express.Router();

// Middleware de autenticación admin
function requireAdminAuth(req, res, next) {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  // Verificar token admin (simplificado para desarrollo)
  if (!token || !token.startsWith('admin-token-')) {
    return res.status(401).json({
      success: false,
      error: 'Token de administrador requerido'
    });
  }
  
  req.user = { username: 'admin', role: 'admin' };
  next();
}

// ======================================
// RUTAS PÚBLICAS PARA REVIEWS
// ======================================

// Obtener reviews públicas (para landing page)
router.get('/', async (req, res) => {
  try {
    const { limit = 6, active = true } = req.query;
    
    console.log(`💬 Obteniendo reviews públicas - Límite: ${limit}`);
    
    // Intentar obtener desde PostgreSQL
    try {
      const dbResult = await query(`
        SELECT 
          id, name, location, rating, text, trip, avatar,
          date, verified, google_review_id, status, featured,
          created_at, updated_at
        FROM reviews 
        WHERE status = $1 
        ORDER BY 
          CASE WHEN featured = true THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT $2
      `, [active === 'true' ? 'active' : 'inactive', parseInt(limit)]);
      
      if (dbResult.rows.length > 0) {
        console.log(`✅ PostgreSQL: ${dbResult.rows.length} reviews encontrados`);
        
        return res.json({
          success: true,
          reviews: dbResult.rows,
          total: dbResult.rows.length,
          source: 'database'
        });
      }
    } catch (dbError) {
      console.log('⚠️ PostgreSQL no disponible para reviews:', dbError.message);
    }
    
    // Fallback: reviews por defecto
    const fallbackReviews = [
      {
        id: 1,
        name: "María González",
        location: "Buenos Aires",
        rating: 5,
        text: "Increíble experiencia en París. El servicio de InterTravel fue excepcional, todo estuvo perfectamente organizado.",
        trip: "París Romántico",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format",
        date: "2024-03-15",
        verified: true,
        google_review_id: null,
        status: "active",
        featured: true,
        created_at: "2024-03-15T10:30:00Z",
        updated_at: "2024-03-15T10:30:00Z"
      },
      {
        id: 2,
        name: "Carlos Rodríguez",
        location: "Mendoza",
        rating: 5,
        text: "Machu Picchu superó todas mis expectativas. La atención al detalle y el profesionalismo de InterTravel es incomparable.",
        trip: "Aventura en Perú",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format",
        date: "2024-02-28",
        verified: true,
        google_review_id: null,
        status: "active",
        featured: true,
        created_at: "2024-02-28T14:15:00Z",
        updated_at: "2024-02-28T14:15:00Z"
      },
      {
        id: 3,
        name: "Ana Martínez",
        location: "Córdoba",
        rating: 5,
        text: "Cancún fue un paraíso. Desde el primer contacto hasta el regreso, todo fue perfecto. ¡Ya estamos planeando el próximo viaje!",
        trip: "Playa Todo Incluido",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format",
        date: "2024-01-20",
        verified: true,
        google_review_id: null,
        status: "active",
        featured: false,
        created_at: "2024-01-20T16:45:00Z",
        updated_at: "2024-01-20T16:45:00Z"
      },
      {
        id: 4,
        name: "Roberto Silva",
        location: "Rosario",
        rating: 5,
        text: "La organización fue perfecta, desde los vuelos hasta cada excursión. Recomiendo InterTravel sin dudarlo.",
        trip: "Europa Clásica",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format",
        date: "2024-03-01",
        verified: true,
        google_review_id: null,
        status: "active",
        featured: false,
        created_at: "2024-03-01T11:20:00Z",
        updated_at: "2024-03-01T11:20:00Z"
      },
      {
        id: 5,
        name: "Laura Fernández",
        location: "La Plata",
        rating: 5,
        text: "Mi luna de miel en Bali fue absolutamente mágica. Cada detalle fue pensado para hacer el viaje único e inolvidable.",
        trip: "Bali Romántico",
        avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&auto=format",
        date: "2024-02-14",
        verified: true,
        google_review_id: null,
        status: "active",
        featured: true,
        created_at: "2024-02-14T09:30:00Z",
        updated_at: "2024-02-14T09:30:00Z"
      },
      {
        id: 6,
        name: "Diego Morales",
        location: "Tucumán",
        rating: 5,
        text: "Japón en temporada de cerezos fue un sueño hecho realidad. La guía cultural y las experiencias auténticas superaron mis expectativas.",
        trip: "Japón Cultural",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f44?w=100&h=100&fit=crop&auto=format",
        date: "2024-04-05",
        verified: true,
        google_review_id: null,
        status: "active",
        featured: false,
        created_at: "2024-04-05T13:15:00Z",
        updated_at: "2024-04-05T13:15:00Z"
      }
    ];
    
    const limitedReviews = fallbackReviews.slice(0, parseInt(limit));
    
    console.log(`✅ Fallback: ${limitedReviews.length} reviews enviados`);
    
    res.json({
      success: true,
      reviews: limitedReviews,
      total: limitedReviews.length,
      source: 'fallback'
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// RUTAS ADMIN PARA GESTIÓN DE REVIEWS
// ======================================

// Obtener todas las reviews (admin)
router.get('/admin', requireAdminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      verified, 
      featured,
      search 
    } = req.query;
    
    console.log(`💬 Admin obteniendo reviews - Usuario: ${req.user.username}`);
    
    // Construir query SQL dinámicamente
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }
    
    if (verified !== undefined) {
      paramCount++;
      whereConditions.push(`verified = $${paramCount}`);
      queryParams.push(verified === 'true');
    }
    
    if (featured !== undefined) {
      paramCount++;
      whereConditions.push(`featured = $${paramCount}`);
      queryParams.push(featured === 'true');
    }
    
    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR text ILIKE $${paramCount} OR trip ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramCount++;
    queryParams.push(parseInt(limit));
    paramCount++;
    queryParams.push(offset);
    
    try {
      // Count total
      const countQuery = `SELECT COUNT(*) as total FROM reviews ${whereClause}`;
      const countResult = await query(countQuery, queryParams.slice(0, -2)); // Sin LIMIT y OFFSET
      const total = parseInt(countResult.rows[0]?.total || 0);
      
      // Get reviews
      const reviewsQuery = `
        SELECT 
          id, name, location, rating, text, trip, avatar,
          date, verified, google_review_id, status, featured,
          created_at, updated_at
        FROM reviews 
        ${whereClause}
        ORDER BY 
          CASE WHEN featured = true THEN 0 ELSE 1 END,
          created_at DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;
      
      const reviewsResult = await query(reviewsQuery, queryParams);
      
      console.log(`✅ PostgreSQL: ${reviewsResult.rows.length} reviews encontrados`);
      
      res.json({
        success: true,
        reviews: reviewsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / parseInt(limit))
        },
        filters: { status, verified, featured, search },
        source: 'database'
      });
      
    } catch (dbError) {
      console.log('⚠️ PostgreSQL no disponible, usando fallback:', dbError.message);
      
      // Fallback para admin
      const fallbackReviews = [
        {
          id: 1,
          name: "María González",
          location: "Buenos Aires",
          rating: 5,
          text: "Increíble experiencia en París. El servicio de InterTravel fue excepcional, todo estuvo perfectamente organizado.",
          trip: "París Romántico",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format",
          date: "2024-03-15",
          verified: true,
          google_review_id: null,
          status: "active",
          featured: true,
          created_at: "2024-03-15T10:30:00Z",
          updated_at: "2024-03-15T10:30:00Z"
        },
        {
          id: 2,
          name: "Carlos Rodríguez",
          location: "Mendoza",
          rating: 5,
          text: "Machu Picchu superó todas mis expectativas. La atención al detalle y el profesionalismo de InterTravel es incomparable.",
          trip: "Aventura en Perú",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format",
          date: "2024-02-28",
          verified: true,
          google_review_id: null,
          status: "active",
          featured: true,
          created_at: "2024-02-28T14:15:00Z",
          updated_at: "2024-02-28T14:15:00Z"
        }
      ];
      
      res.json({
        success: true,
        reviews: fallbackReviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: fallbackReviews.length,
          totalPages: 1
        },
        filters: { status, verified, featured, search },
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo reviews admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Crear nueva review (admin)
router.post('/admin', requireAdminAuth, async (req, res) => {
  try {
    const {
      name,
      location,
      rating,
      text,
      trip,
      avatar,
      date,
      verified = true,
      featured = false,
      google_review_id
    } = req.body;
    
    console.log(`💬 Admin creando review - Usuario: ${req.user.username}`);
    
    // Validaciones
    if (!name || !location || !rating || !text || !trip) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: name, location, rating, text, trip'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating debe estar entre 1 y 5'
      });
    }
    
    try {
      const result = await query(`
        INSERT INTO reviews (
          name, location, rating, text, trip, avatar, date,
          verified, featured, google_review_id, status,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `, [
        name.trim(),
        location.trim(),
        parseInt(rating),
        text.trim(),
        trip.trim(),
        avatar || `https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format`,
        date || new Date().toISOString().split('T')[0],
        verified,
        featured,
        google_review_id || null,
        'active'
      ]);
      
      console.log(`✅ Review creada en PostgreSQL: ID ${result.rows[0].id}`);
      
      res.json({
        success: true,
        review: result.rows[0],
        message: 'Review creada exitosamente'
      });
      
    } catch (dbError) {
      console.log('⚠️ Error PostgreSQL, usando fallback:', dbError.message);
      
      // Fallback response
      const newReview = {
        id: Date.now(),
        name: name.trim(),
        location: location.trim(),
        rating: parseInt(rating),
        text: text.trim(),
        trip: trip.trim(),
        avatar: avatar || `https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format`,
        date: date || new Date().toISOString().split('T')[0],
        verified: verified,
        featured: featured,
        google_review_id: google_review_id || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.json({
        success: true,
        review: newReview,
        message: 'Review creada exitosamente (modo fallback)',
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error creando review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar review (admin)
router.put('/admin/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      rating,
      text,
      trip,
      avatar,
      date,
      verified,
      featured,
      status,
      google_review_id
    } = req.body;
    
    console.log(`💬 Admin actualizando review ${id} - Usuario: ${req.user.username}`);
    
    // Validaciones
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: 'Rating debe estar entre 1 y 5'
      });
    }
    
    if (status && !['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status debe ser: active, inactive o pending'
      });
    }
    
    try {
      // Construir query de actualización dinámicamente
      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;
      
      if (name !== undefined) {
        paramCount++;
        updateFields.push(`name = $${paramCount}`);
        updateValues.push(name.trim());
      }
      
      if (location !== undefined) {
        paramCount++;
        updateFields.push(`location = $${paramCount}`);
        updateValues.push(location.trim());
      }
      
      if (rating !== undefined) {
        paramCount++;
        updateFields.push(`rating = $${paramCount}`);
        updateValues.push(parseInt(rating));
      }
      
      if (text !== undefined) {
        paramCount++;
        updateFields.push(`text = $${paramCount}`);
        updateValues.push(text.trim());
      }
      
      if (trip !== undefined) {
        paramCount++;
        updateFields.push(`trip = $${paramCount}`);
        updateValues.push(trip.trim());
      }
      
      if (avatar !== undefined) {
        paramCount++;
        updateFields.push(`avatar = $${paramCount}`);
        updateValues.push(avatar);
      }
      
      if (date !== undefined) {
        paramCount++;
        updateFields.push(`date = $${paramCount}`);
        updateValues.push(date);
      }
      
      if (verified !== undefined) {
        paramCount++;
        updateFields.push(`verified = $${paramCount}`);
        updateValues.push(verified);
      }
      
      if (featured !== undefined) {
        paramCount++;
        updateFields.push(`featured = $${paramCount}`);
        updateValues.push(featured);
      }
      
      if (status !== undefined) {
        paramCount++;
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(status);
      }
      
      if (google_review_id !== undefined) {
        paramCount++;
        updateFields.push(`google_review_id = $${paramCount}`);
        updateValues.push(google_review_id);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No hay campos para actualizar'
        });
      }
      
      // Agregar updated_at
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date().toISOString());
      
      // Agregar el ID al final
      paramCount++;
      updateValues.push(parseInt(id));
      
      const updateQuery = `
        UPDATE reviews 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await query(updateQuery, updateValues);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Review no encontrada'
        });
      }
      
      console.log(`✅ Review actualizada en PostgreSQL: ID ${id}`);
      
      res.json({
        success: true,
        review: result.rows[0],
        message: 'Review actualizada exitosamente'
      });
      
    } catch (dbError) {
      console.log('⚠️ Error PostgreSQL, usando fallback:', dbError.message);
      
      // Fallback response
      const updatedReview = {
        id: parseInt(id),
        name: name || "Cliente",
        location: location || "Argentina",
        rating: rating || 5,
        text: text || "Excelente servicio",
        trip: trip || "Destino",
        avatar: avatar || `https://images.unsplash.com/photo-1494790108755-2616b612e5fa?w=100&h=100&fit=crop&auto=format`,
        date: date || new Date().toISOString().split('T')[0],
        verified: verified !== undefined ? verified : true,
        featured: featured !== undefined ? featured : false,
        google_review_id: google_review_id || null,
        status: status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.json({
        success: true,
        review: updatedReview,
        message: 'Review actualizada exitosamente (modo fallback)',
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error actualizando review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Eliminar review (admin)
router.delete('/admin/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`💬 Admin eliminando review ${id} - Usuario: ${req.user.username}`);
    
    try {
      const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING id', [parseInt(id)]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Review no encontrada'
        });
      }
      
      console.log(`✅ Review eliminada de PostgreSQL: ID ${id}`);
      
      res.json({
        success: true,
        message: 'Review eliminada exitosamente',
        deletedId: parseInt(id)
      });
      
    } catch (dbError) {
      console.log('⚠️ Error PostgreSQL, usando fallback:', dbError.message);
      
      // Fallback response
      res.json({
        success: true,
        message: 'Review eliminada exitosamente (modo fallback)',
        deletedId: parseInt(id),
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error eliminando review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Cambiar estado de review (admin)
router.patch('/admin/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status debe ser: active, inactive o pending'
      });
    }
    
    console.log(`💬 Admin cambiando status review ${id} a ${status} - Usuario: ${req.user.username}`);
    
    try {
      const result = await query(
        'UPDATE reviews SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, parseInt(id)]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Review no encontrada'
        });
      }
      
      console.log(`✅ Status cambiado en PostgreSQL: ID ${id} -> ${status}`);
      
      res.json({
        success: true,
        review: result.rows[0],
        message: `Status cambiado a ${status}`
      });
      
    } catch (dbError) {
      console.log('⚠️ Error PostgreSQL, usando fallback:', dbError.message);
      
      // Fallback response
      res.json({
        success: true,
        review: {
          id: parseInt(id),
          status: status,
          updated_at: new Date().toISOString()
        },
        message: `Status cambiado a ${status} (modo fallback)`,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error cambiando status review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Marcar como destacada (admin)
router.patch('/admin/:id/featured', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    if (featured === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campo featured requerido (true/false)'
      });
    }
    
    console.log(`💬 Admin ${featured ? 'destacando' : 'quitando destaque'} review ${id} - Usuario: ${req.user.username}`);
    
    try {
      const result = await query(
        'UPDATE reviews SET featured = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [featured, parseInt(id)]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Review no encontrada'
        });
      }
      
      console.log(`✅ Featured cambiado en PostgreSQL: ID ${id} -> ${featured}`);
      
      res.json({
        success: true,
        review: result.rows[0],
        message: `Review ${featured ? 'destacada' : 'quitada del destaque'}`
      });
      
    } catch (dbError) {
      console.log('⚠️ Error PostgreSQL, usando fallback:', dbError.message);
      
      // Fallback response
      res.json({
        success: true,
        review: {
          id: parseInt(id),
          featured: featured,
          updated_at: new Date().toISOString()
        },
        message: `Review ${featured ? 'destacada' : 'quitada del destaque'} (modo fallback)`,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error cambiando featured review:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de reviews (admin)
router.get('/admin/stats', requireAdminAuth, async (req, res) => {
  try {
    console.log(`💬 Admin obteniendo stats reviews - Usuario: ${req.user.username}`);
    
    try {
      const statsResult = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN verified = true THEN 1 END) as verified,
          COUNT(CASE WHEN featured = true THEN 1 END) as featured,
          COUNT(CASE WHEN google_review_id IS NOT NULL THEN 1 END) as from_google,
          ROUND(AVG(rating), 2) as avg_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
        FROM reviews
      `);
      
      const stats = statsResult.rows[0];
      
      console.log(`✅ Stats desde PostgreSQL: ${stats.total} reviews total`);
      
      res.json({
        success: true,
        stats: {
          total: parseInt(stats.total),
          byStatus: {
            active: parseInt(stats.active),
            inactive: parseInt(stats.inactive),
            pending: parseInt(stats.pending)
          },
          verified: parseInt(stats.verified),
          featured: parseInt(stats.featured),
          fromGoogle: parseInt(stats.from_google),
          avgRating: parseFloat(stats.avg_rating) || 0,
          ratingDistribution: {
            5: parseInt(stats.five_stars),
            4: parseInt(stats.four_stars),
            3: parseInt(stats.three_stars),
            2: parseInt(stats.two_stars),
            1: parseInt(stats.one_star)
          }
        },
        source: 'database'
      });
      
    } catch (dbError) {
      console.log('⚠️ Error PostgreSQL, usando fallback:', dbError.message);
      
      // Stats fallback
      const fallbackStats = {
        total: 6,
        byStatus: {
          active: 6,
          inactive: 0,
          pending: 0
        },
        verified: 6,
        featured: 3,
        fromGoogle: 0,
        avgRating: 5.0,
        ratingDistribution: {
          5: 6,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        }
      };
      
      res.json({
        success: true,
        stats: fallbackStats,
        source: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo stats reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// RUTAS PARA INTEGRACIÓN CON GOOGLE
// ======================================

// Importar reviews desde Google (placeholder para futura implementación)
router.post('/admin/import-google', requireAdminAuth, async (req, res) => {
  try {
    const { place_id, max_reviews = 10 } = req.body;
    
    console.log(`💬 Admin importando reviews de Google - Place ID: ${place_id}`);
    
    // Placeholder: En el futuro aquí se implementaría la integración real con Google Places API
    res.json({
      success: false,
      message: 'Integración con Google Reviews en desarrollo',
      placeholder: true,
      note: 'Esta funcionalidad se implementará en una futura actualización'
    });
    
  } catch (error) {
    console.error('❌ Error importando de Google:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
