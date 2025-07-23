// ===============================================
// RUTAS ADMIN - GESTIÓN DE DESTINOS
// ===============================================

const express = require('express');
const router = express.Router();
const destinationStorage = require('../destination-storage');

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
// GESTIÓN DE DESTINOS
// ===============================================

// Obtener todos los destinos
router.get('/destinations', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', country = '' } = req.query;
    
    console.log('📋 Solicitando destinos...');
    
    let destinations = destinationStorage.getAllDestinations();
    
    // Filtros
    if (search) {
      destinations = destinations.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.country.toLowerCase().includes(search.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (country && country !== 'all') {
      destinations = destinations.filter(d => d.country === country);
    }
    
    // Paginación
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedDestinations = destinations.slice(startIndex, endIndex);
    
    console.log(`📊 Enviando ${paginatedDestinations.length} destinos de ${destinations.length} totales`);

    res.json({
      success: true,
      destinations: paginatedDestinations,
      total: destinations.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(destinations.length / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo destinos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Agregar nuevo destino
router.post('/destinations', requireAuth, async (req, res) => {
  try {
    const { name, country, coordinates, description, isActive } = req.body;

    if (!name || !country) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y país son requeridos'
      });
    }

    console.log(`➕ Agregando nuevo destino: "${name}, ${country}"`);
    
    const newDestination = destinationStorage.addDestination({
      name,
      country,
      coordinates: coordinates || { lat: 0, lng: 0 },
      description,
      isActive: isActive !== undefined ? isActive : true,
      created_by: req.user.username
    });

    if (newDestination) {
      console.log(`✅ Nuevo destino agregado exitosamente: ID ${newDestination.id}`);
      
      res.json({
        success: true,
        destination: newDestination,
        message: 'Destino agregado exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error guardando destino'
      });
    }

  } catch (error) {
    console.error('❌ Error agregando destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener destino específico
router.get('/destinations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Buscando destino ID ${id}...`);
    
    const destination = destinationStorage.getDestinationById(id);
    
    if (destination) {
      res.json({
        success: true,
        destination: destination
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Destino no encontrado'
      });
    }

  } catch (error) {
    console.error('❌ Error obteniendo destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Actualizar destino
router.put('/destinations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country, coordinates, description, isActive } = req.body;

    console.log(`✏️ Actualizando destino ID ${id}...`);

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (country !== undefined) updateData.country = country.trim();
    if (coordinates !== undefined) updateData.coordinates = coordinates;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedDestination = destinationStorage.updateDestination(id, updateData);

    if (updatedDestination) {
      console.log(`✅ Destino actualizado exitosamente: ID ${id}`);
      
      res.json({
        success: true,
        destination: updatedDestination,
        message: 'Destino actualizado exitosamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Destino no encontrado'
      });
    }

  } catch (error) {
    console.error('❌ Error actualizando destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Eliminar destino
router.delete('/destinations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Eliminando destino ID ${id}...`);

    const success = destinationStorage.deleteDestination(id);

    if (success) {
      console.log(`✅ Destino eliminado exitosamente: ID ${id}`);
      
      res.json({
        success: true,
        message: 'Destino eliminado exitosamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Destino no encontrado'
      });
    }

  } catch (error) {
    console.error('❌ Error eliminando destino:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de destinos
router.get('/destinations-stats', requireAuth, async (req, res) => {
  try {
    const stats = destinationStorage.getStats();
    
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

// Sincronizar destinos desde Travel Compositor
router.post('/destinations/sync-tc', requireAuth, async (req, res) => {
  try {
    console.log('🔄 Iniciando sincronización con Travel Compositor...');
    
    // Simulación de sincronización con Travel Compositor
    const tcDestinations = [
      { name: 'Bariloche', country: 'Argentina', coordinates: { lat: -41.1335, lng: -71.3103 }, description: 'Ciudad de los lagos y montañas' },
      { name: 'Ushuaia', country: 'Argentina', coordinates: { lat: -54.8019, lng: -68.3030 }, description: 'Fin del mundo' },
      { name: 'Salta', country: 'Argentina', coordinates: { lat: -24.7821, lng: -65.4232 }, description: 'Salta la linda' },
      { name: 'Cartagena', country: 'Colombia', coordinates: { lat: 10.3910, lng: -75.4794 }, description: 'Ciudad amurallada' },
      { name: 'Río de Janeiro', country: 'Brasil', coordinates: { lat: -22.9068, lng: -43.1729 }, description: 'Ciudad maravillosa' }
    ];
    
    let syncedCount = 0;
    let updatedCount = 0;
    
    for (const tcDest of tcDestinations) {
      const existing = destinationStorage.getAllDestinations()
        .find(d => d.name.toLowerCase() === tcDest.name.toLowerCase() && d.country === tcDest.country);
        
      if (existing) {
        // Actualizar coordenadas si están faltando
        if (!existing.coordinates || existing.coordinates.lat === 0) {
          destinationStorage.updateDestination(existing.id, {
            coordinates: tcDest.coordinates,
            description: tcDest.description
          });
          updatedCount++;
        }
      } else {
        // Agregar nuevo destino
        destinationStorage.addDestination({
          ...tcDest,
          isActive: true,
          created_by: 'travel_compositor_sync'
        });
        syncedCount++;
      }
    }
    
    console.log(`✅ Sincronización completada: ${syncedCount} nuevos, ${updatedCount} actualizados`);
    
    res.json({
      success: true,
      message: `Sincronización completada: ${syncedCount} destinos nuevos, ${updatedCount} actualizados`,
      synced: syncedCount,
      updated: updatedCount
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    res.status(500).json({
      success: false,
      error: 'Error en la sincronización'
    });
  }
});

// Validar y completar coordenadas
router.post('/destinations/validate-coordinates', requireAuth, async (req, res) => {
  try {
    const { destinationIds } = req.body;
    
    console.log(`🗺️ Validando coordenadas para ${destinationIds?.length || 0} destinos...`);
    
    let correctedCount = 0;
    
    // Simulación de geocoding
    const geocodingData = {
      'mendoza': { lat: -32.8895, lng: -68.8458 },
      'buenos aires': { lat: -34.6037, lng: -58.3816 },
      'cusco': { lat: -13.5319, lng: -71.9675 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'nueva york': { lat: 40.7128, lng: -74.0060 },
      'barcelona': { lat: 41.3851, lng: 2.1734 },
      'roma': { lat: 41.9028, lng: 12.4964 },
      'madrid': { lat: 40.4168, lng: -3.7038 },
      'londres': { lat: 51.5074, lng: -0.1278 },
      'bariloche': { lat: -41.1335, lng: -71.3103 },
      'ushuaia': { lat: -54.8019, lng: -68.3030 },
      'salta': { lat: -24.7821, lng: -65.4232 }
    };
    
    if (destinationIds && Array.isArray(destinationIds)) {
      for (const id of destinationIds) {
        const destination = destinationStorage.getDestinationById(id);
        if (destination) {
          const key = destination.name.toLowerCase();
          if (geocodingData[key]) {
            destinationStorage.updateDestination(id, {
              coordinates: geocodingData[key]
            });
            correctedCount++;
          }
        }
      }
    }
    
    console.log(`✅ Coordenadas corregidas para ${correctedCount} destinos`);
    
    res.json({
      success: true,
      message: `${correctedCount} destinos actualizados con coordenadas válidas`,
      correctedCount: correctedCount
    });

  } catch (error) {
    console.error('❌ Error validando coordenadas:', error);
    res.status(500).json({
      success: false,
      error: 'Error validando coordenadas'
    });
  }
});

// Crear backup de destinos
router.post('/destinations/backup', requireAuth, async (req, res) => {
  try {
    const backupFile = destinationStorage.createBackup();
    
    if (backupFile) {
      res.json({
        success: true,
        message: 'Backup de destinos creado exitosamente',
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

// Reset destinos a datos por defecto
router.post('/destinations/reset', requireAuth, async (req, res) => {
  try {
    const success = destinationStorage.reset();
    
    if (success) {
      res.json({
        success: true,
        message: 'Destinos reseteados a datos por defecto'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error reseteando destinos'
      });
    }

  } catch (error) {
    console.error('❌ Error reseteando destinos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;