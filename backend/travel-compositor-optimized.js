// ===============================================
// TRAVEL COMPOSITOR OPTIMIZADO - PRIORIDAD API REAL
// Conecta primero con TC, fallback solo si falla
// ===============================================

const axios = require('axios');

class TravelCompositorOptimized {
  constructor() {
    this.baseUrl = 'https://online.travelcompositor.com/resources';
    this.authUrl = 'https://online.travelcompositor.com/resources/authentication/authenticate';
    
    // Credenciales desde variables de entorno
    this.auth = {
      username: process.env.TC_USERNAME || 'ApiUser1',
      password: process.env.TC_PASSWORD || 'Veoveo77*',
      micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
    };
    
    this.timeout = 8000; // 8 segundos
    this.authToken = null;
    this.tokenExpiration = null;
    
    // Cache más agresivo para mejor UX
    this.cache = {
      packages: { data: [], lastUpdate: 0, duration: 3 * 60 * 1000 }, // 3 minutos
      featured: { data: [], lastUpdate: 0, duration: 5 * 60 * 1000 }, // 5 minutos
      details: new Map(),
      search: new Map() // Cache de búsquedas
    };
    
    // Estado de conexión
    this.isConnected = false;
    this.lastConnectionAttempt = 0;
    this.connectionRetryDelay = 30000; // 30 segundos entre intentos
    
    // Datos de fallback (solo como último recurso)
    this.fallbackPackages = [
      {
        id: 'bariloche-premium-2025',
        title: 'Bariloche Premium - Temporada Alta',
        description: 'Experiencia premium en Bariloche con los mejores servicios',
        shortDescription: 'Hotel 5★ + Excursiones + Traslados',
        price: 156999,
        originalPrice: 189999,
        currency: 'ARS',
        destination: 'Bariloche',
        country: 'Argentina',
        duration: 6,
        category: 'premium',
        featured: true,
        images: [
          'https://via.placeholder.com/800x600/1e40af/ffffff?text=Bariloche+Premium',
          'https://via.placeholder.com/800x600/1e40af/ffffff?text=Hotel+Luxury',
          'https://via.placeholder.com/800x600/1e40af/ffffff?text=Cerro+Catedral'
        ],
        highlights: [
          'Hotel Llao Llao 5 estrellas',
          'Excursiones a Cerro Catedral',
          'Traslados privados incluidos',
          'Cena en Puerto Blest'
        ],
        itinerary: [
          { day: 1, title: 'Llegada a Bariloche', description: 'Traslado al hotel y check-in' },
          { day: 2, title: 'Circuito Chico', description: 'Tour panorámico completo' },
          { day: 3, title: 'Cerro Catedral', description: 'Ascenso en teleférico y actividades' },
          { day: 4, title: 'Villa La Angostura', description: 'Excursión de día completo' },
          { day: 5, title: 'Puerto Blest', description: 'Navegación y cena especial' },
          { day: 6, title: 'Partida', description: 'Check-out y traslado al aeropuerto' }
        ],
        inclusions: [
          'Alojamiento 5 noches en hotel 5★',
          'Desayuno buffet diario',
          'Excursiones mencionadas',
          'Guía especializado',
          'Traslados aeropuerto-hotel'
        ],
        availability: true,
        maxOccupancy: 4,
        _source: 'fallback-premium',
        priorityScore: 9
      },
      {
        id: 'cancun-familiar-todo-incluido',
        title: 'Cancún Familiar - Todo Incluido Premium',
        description: 'Vacaciones familiares perfectas en el Caribe mexicano',
        shortDescription: 'All Inclusive + Kids Club + Playa Privada',
        price: 198999,
        originalPrice: 245999,
        currency: 'ARS',
        destination: 'Cancún',
        country: 'México',
        duration: 8,
        category: 'familiar',
        featured: true,
        images: [
          'https://via.placeholder.com/800x600/059669/ffffff?text=Cancun+Resort',
          'https://via.placeholder.com/800x600/059669/ffffff?text=Kids+Club',
          'https://via.placeholder.com/800x600/059669/ffffff?text=Beach+Paradise'
        ],
        highlights: [
          'Resort Todo Incluido Premium',
          'Kids Club con actividades',
          'Playa privada exclusiva',
          'Parque acuático incluido'
        ],
        itinerary: [
          { day: 1, title: 'Llegada a Cancún', description: 'Traslado al resort y bienvenida' },
          { day: 2, title: 'Playa y piscinas', description: 'Día de relax en instalaciones' },
          { day: 3, title: 'Xcaret', description: 'Parque temático familiar' },
          { day: 4, title: 'Chichen Itzá', description: 'Excursión a zona arqueológica' },
          { day: 5, title: 'Isla Mujeres', description: 'Tour en catamarán' },
          { day: 6, title: 'Parque acuático', description: 'Diversión acuática familiar' },
          { day: 7, title: 'Compras y relax', description: 'Quinta Avenida y spa' },
          { day: 8, title: 'Partida', description: 'Check-out y traslado' }
        ],
        inclusions: [
          'Alojamiento 7 noches Todo Incluido',
          'Todas las comidas y bebidas',
          'Kids Club supervisado',
          'Actividades acuáticas',
          'Traslados incluidos'
        ],
        availability: true,
        maxOccupancy: 6,
        _source: 'fallback-familiar',
        priorityScore: 8
      },
      {
        id: 'europa-clasica-cultural',
        title: 'Europa Clásica - Capitales Imperiales',
        description: 'Recorre las capitales más hermosas de Europa en 15 días',
        shortDescription: 'París + Roma + Viena + Praga + 6 ciudades más',
        price: 389999,
        originalPrice: 445999,
        currency: 'ARS',
        destination: 'Europa',
        country: 'Multi-país',
        duration: 15,
        category: 'cultural',
        featured: true,
        images: [
          'https://via.placeholder.com/800x600/7c3aed/ffffff?text=Paris+Eiffel',
          'https://via.placeholder.com/800x600/7c3aed/ffffff?text=Roma+Coliseo',
          'https://via.placeholder.com/800x600/7c3aed/ffffff?text=Viena+Palacio'
        ],
        highlights: [
          '10 capitales europeas',
          'Hoteles 4★ centro histórico',
          'Guías especializados locales',
          'Tren de alta velocidad incluido'
        ],
        availability: true,
        maxOccupancy: 2,
        _source: 'fallback-cultural',
        priorityScore: 7
      },
      {
        id: 'mendoza-vinos-gourmet',
        title: 'Mendoza Gourmet - Ruta del Vino Premium',
        description: 'Experiencia enológica y gastronómica en Mendoza',
        shortDescription: 'Bodegas Premium + Cenas Gourmet + Degustaciones',
        price: 89999,
        originalPrice: 109999,
        currency: 'ARS',
        destination: 'Mendoza',
        country: 'Argentina',
        duration: 4,
        category: 'gourmet',
        featured: false,
        images: [
          'https://via.placeholder.com/800x600/dc2626/ffffff?text=Mendoza+Vinos',
          'https://via.placeholder.com/800x600/dc2626/ffffff?text=Bodegas+Premium'
        ],
        highlights: [
          'Visita a 6 bodegas premium',
          'Cenas maridaje exclusivas',
          'Sommelier personalizado',
          'Hotel boutique incluido'
        ],
        availability: true,
        maxOccupancy: 2,
        _source: 'fallback-gourmet',
        priorityScore: 6
      }
    ];
    
    console.log('🔌 Travel Compositor optimizado inicializado - Prioridad API real');
  }

  // ===============================================
  // AUTENTICACIÓN MEJORADA
  // ===============================================

  async authenticate() {
    try {
      console.log('🔐 Intentando autenticación con Travel Compositor...');
      
      const response = await axios.post(this.authUrl, {
        username: this.auth.username,
        password: this.auth.password,
        micrositeId: this.auth.micrositeId
      }, {
        timeout: this.timeout,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        this.tokenExpiration = Date.now() + (response.data.expiresIn || 3600) * 1000;
        this.isConnected = true;
        this.lastConnectionAttempt = Date.now();
        
        console.log('✅ Autenticación exitosa con Travel Compositor API');
        return true;
      } else {
        throw new Error('Token no recibido en respuesta');
      }
    } catch (error) {
      console.error('❌ Error autenticando con Travel Compositor:', error.message);
      this.isConnected = false;
      this.lastConnectionAttempt = Date.now();
      return false;
    }
  }

  // ===============================================
  // OBTENER PAQUETES DESDE API REAL (PRIORIDAD)
  // ===============================================

  async fetchPackagesFromAPI(params = {}) {
    try {
      // Verificar si podemos conectar
      if (!this.isConnected) {
        const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
        if (timeSinceLastAttempt < this.connectionRetryDelay) {
          throw new Error('Esperando antes de reintentar conexión');
        }
      }

      // Asegurar autenticación
      if (!this.authToken || (this.tokenExpiration && Date.now() >= this.tokenExpiration)) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('No se pudo autenticar');
        }
      }

      const endpoint = `${this.baseUrl}/packages`;
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 20,
        destination: params.destination,
        country: params.country,
        category: params.category,
        micrositeId: this.auth.micrositeId
      };

      // Filtrar parámetros undefined
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      console.log('📡 Consultando Travel Compositor API:', endpoint);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        params: queryParams,
        timeout: this.timeout
      });

      if (response.data && Array.isArray(response.data.packages)) {
        console.log(`✅ API Real: ${response.data.packages.length} paquetes obtenidos`);
        
        // Enriquecer datos
        const enrichedPackages = response.data.packages.map(pkg => ({
          ...pkg,
          _source: 'travel-compositor-api',
          _lastUpdate: new Date().toISOString(),
          priorityScore: this.calculatePriorityScore(pkg),
          // Asegurar campos necesarios para frontend
          shortDescription: pkg.shortDescription || this.generateShortDescription(pkg),
          images: pkg.images || this.getDefaultImages(pkg.destination),
          availability: pkg.availability !== false, // Default true
          maxOccupancy: pkg.maxOccupancy || 4
        }));

        this.isConnected = true;
        
        return {
          packages: enrichedPackages,
          total: response.data.total || enrichedPackages.length,
          page: response.data.page || params.page || 1,
          totalPages: response.data.totalPages || Math.ceil((response.data.total || enrichedPackages.length) / (params.limit || 20)),
          source: 'travel-compositor-api',
          hasMore: response.data.hasMore !== false
        };
      } else {
        throw new Error('Respuesta inválida de Travel Compositor');
      }
    } catch (error) {
      console.error('❌ Error en API de Travel Compositor:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  // ===============================================
  // OBTENER PAQUETES CON PRIORIDAD API
  // ===============================================

  async getAllPackages(params = {}) {
    try {
      // Verificar cache primero
      const cacheKey = JSON.stringify({ type: 'all', ...params });
      const now = Date.now();
      
      if (this.cache.packages.data.length > 0 && 
          (now - this.cache.packages.lastUpdate) < this.cache.packages.duration) {
        console.log('📋 Devolviendo paquetes desde cache');
        
        // Aplicar filtros y paginación al cache
        let filteredPackages = [...this.cache.packages.data];
        
        if (params.destination) {
          filteredPackages = filteredPackages.filter(pkg => 
            pkg.destination.toLowerCase().includes(params.destination.toLowerCase())
          );
        }
        
        const page = params.page || 1;
        const limit = params.limit || 20;
        const startIndex = (page - 1) * limit;
        const paginatedPackages = filteredPackages.slice(startIndex, startIndex + limit);
        
        return {
          packages: paginatedPackages,
          total: filteredPackages.length,
          page,
          totalPages: Math.ceil(filteredPackages.length / limit),
          source: 'cache',
          hasMore: startIndex + limit < filteredPackages.length
        };
      }

      // PRIORIDAD: Intentar API real primero
      try {
        console.log('🎯 PRIORIDAD: Intentando obtener paquetes desde API real...');
        const apiResult = await this.fetchPackagesFromAPI(params);
        
        // Actualizar cache con datos reales
        this.cache.packages.data = apiResult.packages;
        this.cache.packages.lastUpdate = now;
        
        console.log('🎉 ÉXITO: Paquetes obtenidos desde Travel Compositor API');
        return apiResult;
        
      } catch (apiError) {
        console.warn('⚠️ API no disponible, usando fallback:', apiError.message);
        
        // FALLBACK: Solo si la API falla
        console.log('🔄 Activando datos de fallback como último recurso...');
        
        let packages = [...this.fallbackPackages];
        
        // Aplicar filtros
        if (params.destination) {
          packages = packages.filter(pkg => 
            pkg.destination.toLowerCase().includes(params.destination.toLowerCase())
          );
        }
        
        if (params.category) {
          packages = packages.filter(pkg => pkg.category === params.category);
        }
        
        // Ordenar por prioridad
        packages.sort((a, b) => b.priorityScore - a.priorityScore);
        
        // Paginación
        const page = params.page || 1;
        const limit = params.limit || 20;
        const startIndex = (page - 1) * limit;
        const paginatedPackages = packages.slice(startIndex, startIndex + limit);
        
        // Actualizar cache con fallback
        this.cache.packages.data = packages;
        this.cache.packages.lastUpdate = now;
        
        console.log(`🆘 FALLBACK: ${paginatedPackages.length} paquetes desde datos locales`);
        
        return {
          packages: paginatedPackages,
          total: packages.length,
          page,
          totalPages: Math.ceil(packages.length / limit),
          source: 'fallback-data',
          hasMore: startIndex + limit < packages.length
        };
      }
    } catch (error) {
      console.error('❌ Error crítico obteniendo paquetes:', error);
      throw error;
    }
  }

  // ===============================================
  // BÚSQUEDA SIMPLE POR DESTINO
  // ===============================================

  async searchByDestination(destination, params = {}) {
    try {
      console.log(`🔍 Búsqueda simple por destino: ${destination}`);
      
      // Usar cache de búsqueda si existe
      const searchKey = `${destination.toLowerCase()}_${JSON.stringify(params)}`;
      const cached = this.cache.search.get(searchKey);
      
      if (cached && (Date.now() - cached.timestamp) < 2 * 60 * 1000) { // 2 minutos
        console.log('🔍 Búsqueda desde cache');
        return cached.data;
      }

      // Obtener todos los paquetes y filtrar
      const allResult = await this.getAllPackages({ 
        destination,
        limit: params.limit || 50 
      });
      
      const searchResult = {
        packages: allResult.packages,
        total: allResult.total,
        query: destination,
        source: allResult.source + '-search'
      };
      
      // Guardar en cache de búsqueda
      this.cache.search.set(searchKey, {
        data: searchResult,
        timestamp: Date.now()
      });
      
      console.log(`🔍 Búsqueda completada: ${searchResult.total} resultados para "${destination}"`);
      
      return searchResult;
    } catch (error) {
      console.error('❌ Error en búsqueda por destino:', error);
      throw error;
    }
  }

  // ===============================================
  // UTILIDADES
  // ===============================================

  calculatePriorityScore(pkg) {
    let score = 0;
    
    const categoryScores = {
      'premium': 9,
      'familiar': 8,
      'cultural': 7,
      'gourmet': 8,
      'urbano': 6,
      'aventura': 7
    };
    
    score += categoryScores[pkg.category] || 5;
    
    const destinationScores = {
      'bariloche': 9,
      'cancun': 8,
      'cancún': 8,
      'mendoza': 7,
      'europa': 8,
      'miami': 6
    };
    
    const destination = pkg.destination ? pkg.destination.toLowerCase() : '';
    score += destinationScores[destination] || 5;
    
    if (pkg.availability) score += 1;
    if (pkg.featured) score += 2;
    if (pkg.images && pkg.images.length > 0) score += 1;
    
    return Math.min(score, 10);
  }

  generateShortDescription(pkg) {
    const highlights = pkg.highlights || [];
    if (highlights.length > 0) {
      return highlights.slice(0, 3).join(' + ');
    }
    return `${pkg.duration} días en ${pkg.destination}`;
  }

  getDefaultImages(destination) {
    const defaultImages = {
      'bariloche': ['https://via.placeholder.com/800x600/1e40af/ffffff?text=Bariloche'],
      'cancun': ['https://via.placeholder.com/800x600/059669/ffffff?text=Cancun'],
      'cancún': ['https://via.placeholder.com/800x600/059669/ffffff?text=Cancun'],
      'mendoza': ['https://via.placeholder.com/800x600/dc2626/ffffff?text=Mendoza'],
      'europa': ['https://via.placeholder.com/800x600/7c3aed/ffffff?text=Europa']
    };
    
    return defaultImages[destination?.toLowerCase()] || 
           ['https://via.placeholder.com/800x600/6b7280/ffffff?text=Destino'];
  }

  // ===============================================
  // LIMPIAR CACHE
  // ===============================================

  clearCache() {
    console.log('🧹 Limpiando cache completo');
    this.cache.packages.data = [];
    this.cache.packages.lastUpdate = 0;
    this.cache.featured.data = [];
    this.cache.featured.lastUpdate = 0;
    this.cache.details.clear();
    this.cache.search.clear();
  }

  // ===============================================
  // INFO DEL SISTEMA
  // ===============================================

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasToken: !!this.authToken,
      tokenExpiration: this.tokenExpiration,
      lastConnectionAttempt: this.lastConnectionAttempt,
      nextRetryIn: this.isConnected ? 0 : Math.max(0, this.connectionRetryDelay - (Date.now() - this.lastConnectionAttempt))
    };
  }
}

// Crear instancia singleton
const travelCompositorOptimized = new TravelCompositorOptimized();

module.exports = travelCompositorOptimized;

console.log('🎯 Travel Compositor optimizado cargado - PRIORIDAD API REAL');
