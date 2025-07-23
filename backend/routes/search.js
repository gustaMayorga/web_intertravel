/**
 * 🔍 RUTAS DE BÚSQUEDA - SEARCH API
 * ================================
 * Sistema de búsqueda con sugerencias y autocompletado
 */

const express = require('express');
const router = express.Router();

// Sugerencias de búsqueda básicas
const getSuggestions = (query, limit = 8) => {
  const suggestions = [
    // Destinos populares InterTravel
    { id: 'peru-magico', title: 'Perú Mágico - Cusco y Machu Picchu', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'europa-clasica', title: 'Europa Clásica - París, Roma, Londres', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'argentina-premium', title: 'Argentina Premium - Buenos Aires', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'cancun-premium', title: 'Cancún Premium - Todo Incluido', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'nueva-york-city', title: 'Nueva York City - La Gran Manzana', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'tokio-imperial', title: 'Tokio Imperial - Cultura Japonesa', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'roma-eterna', title: 'Roma Eterna - Historia Viva', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'londres-real', title: 'Londres Real - Tradición Británica', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'rio-carioca', title: 'Río Carioca - Ciudad Maravillosa', type: 'package', source: 'intertravel', priority: 100 },
    { id: 'madrid-imperial', title: 'Madrid Imperial - Arte y Gastronomía', type: 'package', source: 'intertravel', priority: 100 },
    
    // Destinos específicos desde Mendoza
    { id: 'camboriu-mendoza', title: 'Camboriú desde Mendoza - Playa Premium', type: 'destination', source: 'intertravel', priority: 95 },
    { id: 'bariloche-mendoza', title: 'Bariloche desde Mendoza - Aventura', type: 'destination', source: 'intertravel', priority: 95 },
    { id: 'miami-mendoza', title: 'Miami desde Mendoza - Shopping', type: 'destination', source: 'travel-compositor', priority: 90 },
    { id: 'florianopolis-mendoza', title: 'Florianópolis desde Mendoza', type: 'destination', source: 'travel-compositor', priority: 85 },
    { id: 'buzios-mendoza', title: 'Búzios desde Mendoza', type: 'destination', source: 'travel-compositor', priority: 85 },
    
    // Destinos
    { id: 'cusco', title: 'Cusco, Perú', type: 'destination', source: 'intertravel', priority: 95 },
    { id: 'buenos-aires', title: 'Buenos Aires, Argentina', type: 'destination', source: 'intertravel', priority: 95 },
    { id: 'paris', title: 'París, Francia', type: 'destination', source: 'travel-compositor', priority: 80 },
    { id: 'roma', title: 'Roma, Italia', type: 'destination', source: 'travel-compositor', priority: 80 },
    { id: 'londres', title: 'Londres, Reino Unido', type: 'destination', source: 'travel-compositor', priority: 80 },
    { id: 'cancun', title: 'Cancún, México', type: 'destination', source: 'travel-compositor', priority: 80 },
    { id: 'nueva-york', title: 'Nueva York, Estados Unidos', type: 'destination', source: 'travel-compositor', priority: 80 },
    { id: 'tokio', title: 'Tokio, Japón', type: 'destination', source: 'travel-compositor', priority: 75 },
    { id: 'madrid', title: 'Madrid, España', type: 'destination', source: 'travel-compositor', priority: 75 },
    { id: 'rio-de-janeiro', title: 'Río de Janeiro, Brasil', type: 'destination', source: 'travel-compositor', priority: 75 },
    { id: 'bangkok', title: 'Bangkok, Tailandia', type: 'destination', source: 'travel-compositor', priority: 75 },
    { id: 'dubai', title: 'Dubái, Emiratos Árabes Unidos', type: 'destination', source: 'travel-compositor', priority: 70 },
    { id: 'singapur', title: 'Singapur', type: 'destination', source: 'travel-compositor', priority: 70 },
    { id: 'bariloche', title: 'Bariloche, Argentina', type: 'destination', source: 'intertravel', priority: 90 },
    { id: 'mendoza', title: 'Mendoza, Argentina', type: 'destination', source: 'intertravel', priority: 85 },
    { id: 'cordoba', title: 'Córdoba, Argentina', type: 'destination', source: 'intertravel', priority: 85 },
    { id: 'camboriu', title: 'Camboriú, Brasil', type: 'destination', source: 'intertravel', priority: 85 },
    { id: 'florianopolis', title: 'Florianópolis, Brasil', type: 'destination', source: 'travel-compositor', priority: 80 },
    { id: 'buzios', title: 'Búzios, Brasil', type: 'destination', source: 'travel-compositor', priority: 80 },
    { id: 'maceio', title: 'Maceió, Brasil', type: 'destination', source: 'travel-compositor', priority: 75 },
    { id: 'natal', title: 'Natal, Brasil', type: 'destination', source: 'travel-compositor', priority: 75 },
    
    // Países
    { id: 'peru', title: 'Perú', type: 'country', source: 'intertravel', priority: 90 },
    { id: 'argentina', title: 'Argentina', type: 'country', source: 'intertravel', priority: 90 },
    { id: 'francia', title: 'Francia', type: 'country', source: 'travel-compositor', priority: 70 },
    { id: 'italia', title: 'Italia', type: 'country', source: 'travel-compositor', priority: 70 },
    { id: 'reino-unido', title: 'Reino Unido', type: 'country', source: 'travel-compositor', priority: 70 },
    { id: 'mexico', title: 'México', type: 'country', source: 'travel-compositor', priority: 70 },
    { id: 'estados-unidos', title: 'Estados Unidos', type: 'country', source: 'travel-compositor', priority: 70 },
    { id: 'japon', title: 'Japón', type: 'country', source: 'travel-compositor', priority: 65 },
    { id: 'españa', title: 'España', type: 'country', source: 'travel-compositor', priority: 65 },
    { id: 'brasil', title: 'Brasil', type: 'country', source: 'travel-compositor', priority: 65 },
    { id: 'tailandia', title: 'Tailandia', type: 'country', source: 'travel-compositor', priority: 65 },
    { id: 'emiratos', title: 'Emiratos Árabes Unidos', type: 'country', source: 'travel-compositor', priority: 60 },
    
    // Categorías
    { id: 'cultural', title: 'Turismo Cultural', type: 'category', source: 'intertravel', priority: 60 },
    { id: 'aventura', title: 'Turismo de Aventura', type: 'category', source: 'travel-compositor', priority: 55 },
    { id: 'playa', title: 'Destinos de Playa', type: 'category', source: 'travel-compositor', priority: 55 },
    { id: 'ciudad', title: 'Turismo Urbano', type: 'category', source: 'travel-compositor', priority: 55 },
    { id: 'romance', title: 'Viajes Románticos', type: 'category', source: 'travel-compositor', priority: 50 },
    { id: 'historia', title: 'Turismo Histórico', type: 'category', source: 'travel-compositor', priority: 50 },
    { id: 'oriental', title: 'Cultura Oriental', type: 'category', source: 'travel-compositor', priority: 50 },
    { id: 'ride', title: 'RIDE - Viajes de Egresados', type: 'category', source: 'intertravel', priority: 85 },
    { id: 'exclusivo', title: 'Paquetes Exclusivos', type: 'category', source: 'intertravel', priority: 80 },
    { id: 'familia', title: 'Viajes en Familia', type: 'category', source: 'travel-compositor', priority: 45 },
    { id: 'lunamiel', title: 'Luna de Miel', type: 'category', source: 'travel-compositor', priority: 45 }
  ];

  if (!query || query.length < 2) {
    return [];
  }

  const queryLower = query.toLowerCase();
  
  // Búsqueda inteligente que detecta patrones como "destino desde ciudad"
  const fromMatch = queryLower.match(/(.*?)\s+desde\s+(.*?)$/);
  if (fromMatch) {
    const destination = fromMatch[1].trim();
    const origin = fromMatch[2].trim();
    console.log(`🔍 Búsqueda detectada: ${destination} desde ${origin}`);
    
    // Crear sugerencias específicas para este patrón
    const specificSuggestions = [
      {
        id: `${destination}-${origin}`,
        title: `${destination.charAt(0).toUpperCase() + destination.slice(1)} desde ${origin.charAt(0).toUpperCase() + origin.slice(1)}`,
        type: 'route',
        source: 'intertravel',
        priority: 100
      }
    ];
    
    return specificSuggestions.concat(
      suggestions.filter(suggestion => 
        suggestion.title.toLowerCase().includes(destination) ||
        suggestion.title.toLowerCase().includes(origin)
      )
    ).slice(0, limit);
  }
  
  return suggestions
    .filter(suggestion => 
      suggestion.title.toLowerCase().includes(queryLower) ||
      suggestion.id.toLowerCase().includes(queryLower)
    )
    .sort((a, b) => {
      // InterTravel primero
      if (a.source === 'intertravel' && b.source !== 'intertravel') return -1;
      if (b.source === 'intertravel' && a.source !== 'intertravel') return 1;
      
      // Luego por prioridad
      return b.priority - a.priority;
    })
    .slice(0, limit);
};

// Ruta para obtener sugerencias
router.get('/suggestions', (req, res) => {
  try {
    const { q, limit = 8 } = req.query;
    
    console.log(`🔍 Sugerencias solicitadas para: "${q}"`);
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
        message: 'Consulta muy corta'
      });
    }
    
    const suggestions = getSuggestions(q, parseInt(limit));
    
    console.log(`✅ ${suggestions.length} sugerencias encontradas`);
    
    res.json({
      success: true,
      suggestions: suggestions,
      query: q,
      total: suggestions.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo sugerencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para búsqueda completa (alias)
router.get('/', (req, res) => {
  try {
    const { q, search, destination, country, category, limit = 20 } = req.query;
    
    const searchTerm = q || search || destination;
    
    console.log(`🔍 Búsqueda completa: "${searchTerm}"`);
    
    // CORRECCIÓN: Respuesta directa mejorada en lugar de redirect
    console.log(`🔍 [BÚSQUEDA CORREGIDA] Término: "${searchTerm}"`);    
    
    res.json({
      success: true,
      message: 'Búsqueda procesada - usar /api/packages/search para mejores resultados',
      searchTerm: searchTerm,
      suggestedEndpoint: `/api/packages/search?search=${encodeURIComponent(searchTerm || '')}`,
      correction: 'Sistema de búsqueda mejorado'
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
