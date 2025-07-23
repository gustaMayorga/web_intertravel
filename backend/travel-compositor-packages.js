// ===============================================
// TRAVEL COMPOSITOR PARA PAQUETES - VERSION ROBUSTA
// Solución específica para módulo de paquetes
// ===============================================

const axios = require('axios');

class TravelCompositorPackages {
  constructor() {
    this.baseUrl = 'https://online.travelcompositor.com/resources';
    this.authUrl = 'https://online.travelcompositor.com/resources/authentication/authenticate';
    
    // Credenciales desde variables de entorno o por defecto
    this.auth = {
      username: process.env.TC_USERNAME || 'ApiUser1',
      password: process.env.TC_PASSWORD || 'Veoveo77*',
      micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
    };
    
    this.timeout = 10000; // 10 segundos timeout
    this.authToken = null;
    this.tokenExpiration = null;
    
    // Cache con tiempos más cortos para mayor frescura
    this.cache = {
      packages: { data: [], lastUpdate: 0, duration: 5 * 60 * 1000 }, // 5 minutos
      featured: { data: [], lastUpdate: 0, duration: 10 * 60 * 1000 }, // 10 minutos
      details: new Map() // Cache para detalles individuales
    };
    
    // Datos de fallback confiables
    this.fallbackPackages = [
      {
        id: 'bariloche-premium-2025',
        title: 'Bariloche Premium - Verano 2025',
        description: 'Descubre la magia de Bariloche en una experiencia premium completa',
        price: 89999,
        currency: 'ARS',
        destination: 'Bariloche',
        country: 'Argentina',
        duration: 5,
        category: 'premium',
        featured: true,
        images: ['/images/bariloche-1.jpg', '/images/bariloche-2.jpg'],
        highlights: ['Hotel 5 estrellas', 'Excursiones incluidas', 'Traslados privados'],
        availability: true,
        _source: 'travel-compositor-fallback',
        priorityScore: 5
      },
      {
        id: 'cancun-familiar-2025',
        title: 'Cancún Familiar - Todo Incluido',
        description: 'Vacaciones familiares perfectas en el Caribe mexicano',
        price: 156999,
        currency: 'ARS',
        destination: 'Cancún',
        country: 'México',
        duration: 7,
        category: 'familiar',
        featured: true,
        images: ['/images/cancun-1.jpg', '/images/cancun-2.jpg'],
        highlights: ['All Inclusive', 'Actividades para niños', 'Playa privada'],
        availability: true,
        _source: 'travel-compositor-fallback',
        priorityScore: 4
      },
      {
        id: 'europa-clasica-2025',
        title: 'Europa Clásica - 15 Días',
        description: 'Recorre las capitales más importantes de Europa',
        price: 234999,
        currency: 'ARS',
        destination: 'Europa',
        country: 'Multi-país',
        duration: 15,
        category: 'cultural',
        featured: true,
        images: ['/images/europa-1.jpg', '/images/europa-2.jpg'],
        highlights: ['15 ciudades', 'Guías especializados', 'Hoteles 4 estrellas'],
        availability: true,
        _source: 'travel-compositor-fallback',
        priorityScore: 3
      },
      {
        id: 'mendoza-vinos-2025',
        title: 'Mendoza y Ruta del Vino',
        description: 'Experiencia enológica completa en el corazón vitivinícola',
        price: 67999,
        currency: 'ARS',
        destination: 'Mendoza',
        country: 'Argentina',
        duration: 4,
        category: 'gourmet',
        featured: false,
        images: ['/images/mendoza-1.jpg', '/images/mendoza-2.jpg'],
        highlights: ['Catas premium', 'Bodegas exclusivas', 'Gastronomía local'],
        availability: true,
        _source: 'travel-compositor-fallback',
        priorityScore: 4
      },
      {
        id: 'miami-shopping-2025',
        title: 'Miami Shopping & Beaches',
        description: 'Combina compras, playas y vida nocturna en Miami',
        price: 123999,
        currency: 'ARS',
        destination: 'Miami',
        country: 'Estados Unidos',
        duration: 6,
        category: 'urbano',
        featured: false,
        images: ['/images/miami-1.jpg', '/images/miami-2.jpg'],
        highlights: ['Outlets premium', 'South Beach', 'Tours nocturnos'],
        availability: true,
        _source: 'travel-compositor-fallback',
        priorityScore: 3
      },
      {
        id: 'tokyo-cultural-2025',
        title: 'Japón Cultural - Tokio y Kyoto',
        description: 'Sumérgete en la cultura milenaria japonesa',
        price: 289999,
        currency: 'ARS',
        destination: 'Tokio',
        country: 'Japón',
        duration: 12,
        category: 'cultural',
        featured: false,
        images: ['/images/tokyo-1.jpg', '/images/tokyo-2.jpg'],
        highlights: ['Templos históricos', 'Ceremonia del té', 'Tren bala'],
        availability: true,
        _source: 'travel-compositor-fallback',
        priorityScore: 2
      }
    ];
    
    console.log('✅ Travel Compositor Packages inicializado con fallbacks confiables');
  }

  // ===============================================
  // AUTENTICACIÓN CON TRAVEL COMPOSITOR
  // ===============================================

  async authenticate() {
    try {
      console.log('🔐 Autenticando con Travel Compositor...');
      
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
        console.log('✅ Autenticación exitosa con Travel Compositor');
        return true;
      } else {
        throw new Error('Token no recibido en respuesta');
      }
    } catch (error) {
      console.error('❌ Error autenticando con Travel Compositor:', error.message);
      return false;
    }
  }

  // ===============================================
  // VERIFICAR Y RENOVAR TOKEN
  // ===============================================

  async ensureAuthenticated() {
    if (!this.authToken || (this.tokenExpiration && Date.now() >= this.tokenExpiration)) {
      console.log('🔄 Token expirado o no existe, renovando...');
      return await this.authenticate();
    }
    return true;
  }

  // ===============================================
  // OBTENER PAQUETES DESDE TRAVEL COMPOSITOR
  // ===============================================

  async fetchPackagesFromTC(params = {}) {
    try {
      if (!await this.ensureAuthenticated()) {
        throw new Error('No se pudo autenticar con Travel Compositor');
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
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      console.log('📡 Consultando Travel Compositor:', endpoint);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        params: queryParams,
        timeout: this.timeout
      });

      if (response.data && response.data.packages) {
        console.log(`✅ Recibidos ${response.data.packages.length} paquetes de Travel Compositor`);
        
        // Enriquecer datos con información adicional
        const enrichedPackages = response.data.packages.map(pkg => ({
          ...pkg,
          _source: 'travel-compositor-api',
          _lastUpdate: new Date().toISOString(),
          priorityScore: this.calculatePriorityScore(pkg)
        }));

        return {
          packages: enrichedPackages,
          total: response.data.total || enrichedPackages.length,
          page: response.data.page || params.page || 1,
          totalPages: response.data.totalPages || Math.ceil((response.data.total || enrichedPackages.length) / (params.limit || 20)),
          source: 'travel-compositor-api'
        };
      } else {
        throw new Error('Respuesta inválida de Travel Compositor');
      }
    } catch (error) {
      console.error('❌ Error consultando Travel Compositor:', error.message);
      throw error;
    }
  }

  // ===============================================
  // CALCULAR SCORE DE PRIORIDAD
  // ===============================================

  calculatePriorityScore(pkg) {
    let score = 0;
    
    // Prioridad por categoría
    const categoryScores = {
      'premium': 5,
      'familiar': 4,
      'cultural': 3,
      'gourmet': 4,
      'urbano': 3,
      'aventura': 4
    };
    
    score += categoryScores[pkg.category] || 2;
    
    // Prioridad por destino (basado en popularidad)
    const destinationScores = {
      'bariloche': 5,
      'cancun': 4,
      'mendoza': 4,
      'miami': 3,
      'europa': 3
    };
    
    const destination = pkg.destination ? pkg.destination.toLowerCase() : '';
    score += destinationScores[destination] || 1;
    
    // Bonus por disponibilidad
    if (pkg.availability) score += 1;
    
    // Bonus por tener imágenes
    if (pkg.images && pkg.images.length > 0) score += 1;
    
    return Math.min(score, 10); // Máximo 10
  }

  // ===============================================
  // OBTENER TODOS LOS PAQUETES (CON FALLBACK)
  // ===============================================

  async getAllPackages(params = {}) {
    try {
      // Verificar cache
      const cacheKey = 'packages';
      const now = Date.now();
      
      if (this.cache[cacheKey].data.length > 0 && 
          (now - this.cache[cacheKey].lastUpdate) < this.cache[cacheKey].duration) {
        console.log('📋 Devolviendo paquetes desde cache');
        return {
          packages: this.cache[cacheKey].data,
          total: this.cache[cacheKey].data.length,
          page: params.page || 1,
          totalPages: Math.ceil(this.cache[cacheKey].data.length / (params.limit || 20)),
          source: 'cache'
        };
      }

      // Intentar obtener desde Travel Compositor
      try {
        const tcResult = await this.fetchPackagesFromTC(params);
        
        // Actualizar cache
        this.cache[cacheKey].data = tcResult.packages;
        this.cache[cacheKey].lastUpdate = now;
        
        console.log('✅ Paquetes obtenidos desde Travel Compositor API');
        return tcResult;
      } catch (tcError) {
        console.warn('⚠️ Travel Compositor no disponible, usando fallback:', tcError.message);
        
        // Usar datos de fallback
        let packages = [...this.fallbackPackages];
        
        // Aplicar filtros si se especifican
        if (params.destination) {
          packages = packages.filter(pkg => 
            pkg.destination.toLowerCase().includes(params.destination.toLowerCase())
          );
        }
        
        if (params.country) {
          packages = packages.filter(pkg => 
            pkg.country.toLowerCase().includes(params.country.toLowerCase())
          );
        }
        
        if (params.category) {
          packages = packages.filter(pkg => pkg.category === params.category);
        }
        
        // Ordenar por prioridad
        packages.sort((a, b) => b.priorityScore - a.priorityScore);
        
        // Aplicar paginación
        const page = params.page || 1;
        const limit = params.limit || 20;
        const startIndex = (page - 1) * limit;
        const paginatedPackages = packages.slice(startIndex, startIndex + limit);
        
        // Actualizar cache con fallback
        this.cache[cacheKey].data = packages;
        this.cache[cacheKey].lastUpdate = now;
        
        console.log(`✅ Devolviendo ${paginatedPackages.length} paquetes desde fallback`);
        
        return {
          packages: paginatedPackages,
          total: packages.length,
          page,
          totalPages: Math.ceil(packages.length / limit),
          source: 'fallback-data'
        };
      }
    } catch (error) {
      console.error('❌ Error crítico obteniendo paquetes:', error);
      throw error;
    }
  }

  // ===============================================
  // OBTENER PAQUETES DESTACADOS
  // ===============================================

  async getFeaturedPackages(params = {}) {
    try {
      const limit = params.limit || 6;
      
      // Verificar cache de destacados
      const cacheKey = 'featured';
      const now = Date.now();
      
      if (this.cache[cacheKey].data.length > 0 && 
          (now - this.cache[cacheKey].lastUpdate) < this.cache[cacheKey].duration) {
        console.log('⭐ Devolviendo paquetes destacados desde cache');
        return {
          packages: this.cache[cacheKey].data.slice(0, limit),
          total: this.cache[cacheKey].data.length,
          source: 'cache-featured'
        };
      }

      // Obtener todos los paquetes y filtrar destacados
      const allPackagesResult = await this.getAllPackages({ limit: 50 }); // Obtener más para filtrar
      const featuredPackages = allPackagesResult.packages
        .filter(pkg => pkg.featured === true)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, limit);

      // Si no hay suficientes destacados, tomar los de mayor prioridad
      if (featuredPackages.length < limit) {
        const additionalPackages = allPackagesResult.packages
          .filter(pkg => pkg.featured !== true)
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .slice(0, limit - featuredPackages.length);
        
        featuredPackages.push(...additionalPackages);
      }

      // Actualizar cache
      this.cache[cacheKey].data = featuredPackages;
      this.cache[cacheKey].lastUpdate = now;

      console.log(`⭐ Devolviendo ${featuredPackages.length} paquetes destacados`);

      return {
        packages: featuredPackages,
        total: featuredPackages.length,
        source: allPackagesResult.source + '-featured'
      };
    } catch (error) {
      console.error('❌ Error obteniendo paquetes destacados:', error);
      throw error;
    }
  }

  // ===============================================
  // OBTENER PAQUETE POR ID
  // ===============================================

  async getPackageById(id) {
    try {
      console.log(`🔍 Buscando paquete por ID: ${id}`);
      
      // Verificar cache de detalles
      if (this.cache.details.has(id)) {
        const cached = this.cache.details.get(id);
        if ((Date.now() - cached.timestamp) < 10 * 60 * 1000) { // 10 minutos
          console.log('📋 Devolviendo detalles desde cache');
          return cached.data;
        }
      }

      // Primero buscar en todos los paquetes
      const allPackagesResult = await this.getAllPackages({ limit: 100 });
      const foundPackage = allPackagesResult.packages.find(pkg => pkg.id === id);

      if (foundPackage) {
        // Enriquecer con detalles adicionales
        const enrichedPackage = {
          ...foundPackage,
          detailedDescription: foundPackage.description || 'Descripción completa del paquete',
          inclusions: foundPackage.highlights || [],
          exclusions: ['Comidas no especificadas', 'Gastos personales', 'Seguros opcionales'],
          itinerary: this.generateItinerary(foundPackage),
          bookingInfo: {
            cancellationPolicy: '48 horas antes del viaje',
            paymentMethods: ['Efectivo', 'Tarjeta de crédito', 'Transferencia'],
            deposit: foundPackage.price * 0.3 // 30% de seña
          },
          _detailsEnriched: true,
          _lastDetailUpdate: new Date().toISOString()
        };

        // Guardar en cache
        this.cache.details.set(id, {
          data: enrichedPackage,
          timestamp: Date.now()
        });

        console.log(`✅ Detalles del paquete ${id} obtenidos`);
        return enrichedPackage;
      } else {
        console.log(`❌ Paquete ${id} no encontrado`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error obteniendo detalles del paquete ${id}:`, error);
      throw error;
    }
  }

  // ===============================================
  // GENERAR ITINERARIO BÁSICO
  // ===============================================

  generateItinerary(pkg) {
    const days = [];
    for (let i = 1; i <= pkg.duration; i++) {
      days.push({
        day: i,
        title: `Día ${i}`,
        description: i === 1 ? 'Llegada y check-in' : 
                     i === pkg.duration ? 'Última actividad y partida' :
                     `Actividades en ${pkg.destination}`,
        activities: ['Actividad matutina', 'Tiempo libre', 'Actividad vespertina']
      });
    }
    return days;
  }

  // ===============================================
  // BÚSQUEDA DE PAQUETES
  // ===============================================

  async searchPackages(searchOptions = {}) {
    try {
      console.log('🔍 Búsqueda de paquetes:', searchOptions);
      
      const allPackagesResult = await this.getAllPackages({ limit: 100 });
      let filteredPackages = [...allPackagesResult.packages];

      // Aplicar filtros de búsqueda
      if (searchOptions.query) {
        const query = searchOptions.query.toLowerCase();
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.title.toLowerCase().includes(query) ||
          pkg.description.toLowerCase().includes(query) ||
          pkg.destination.toLowerCase().includes(query) ||
          pkg.country.toLowerCase().includes(query)
        );
      }

      if (searchOptions.destination) {
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.destination.toLowerCase().includes(searchOptions.destination.toLowerCase())
        );
      }

      if (searchOptions.country) {
        filteredPackages = filteredPackages.filter(pkg => 
          pkg.country.toLowerCase().includes(searchOptions.country.toLowerCase())
        );
      }

      if (searchOptions.category) {
        filteredPackages = filteredPackages.filter(pkg => pkg.category === searchOptions.category);
      }

      if (searchOptions.minPrice) {
        filteredPackages = filteredPackages.filter(pkg => pkg.price >= searchOptions.minPrice);
      }

      if (searchOptions.maxPrice) {
        filteredPackages = filteredPackages.filter(pkg => pkg.price <= searchOptions.maxPrice);
      }

      // Ordenar por relevancia (prioridad)
      filteredPackages.sort((a, b) => b.priorityScore - a.priorityScore);

      // Aplicar paginación
      const page = searchOptions.page || 1;
      const limit = searchOptions.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedPackages = filteredPackages.slice(startIndex, startIndex + limit);

      console.log(`🔍 Búsqueda completada: ${filteredPackages.length} resultados, ${paginatedPackages.length} en página`);

      return {
        packages: paginatedPackages,
        total: filteredPackages.length,
        page,
        totalPages: Math.ceil(filteredPackages.length / limit),
        source: allPackagesResult.source + '-search',
        filters: {
          applied: Object.keys(searchOptions).filter(key => searchOptions[key])
        }
      };
    } catch (error) {
      console.error('❌ Error en búsqueda de paquetes:', error);
      throw error;
    }
  }

  // ===============================================
  // LIMPIAR CACHE
  // ===============================================

  clearCache() {
    console.log('🧹 Limpiando cache de Travel Compositor');
    this.cache.packages.data = [];
    this.cache.packages.lastUpdate = 0;
    this.cache.featured.data = [];
    this.cache.featured.lastUpdate = 0;
    this.cache.details.clear();
  }

  // ===============================================
  // INFORMACIÓN DEL SISTEMA
  // ===============================================

  getSystemInfo() {
    return {
      auth: {
        hasToken: !!this.authToken,
        tokenExpiration: this.tokenExpiration,
        isAuthenticated: this.authToken && Date.now() < this.tokenExpiration
      },
      cache: {
        packages: {
          count: this.cache.packages.data.length,
          lastUpdate: this.cache.packages.lastUpdate,
          isValid: (Date.now() - this.cache.packages.lastUpdate) < this.cache.packages.duration
        },
        featured: {
          count: this.cache.featured.data.length,
          lastUpdate: this.cache.featured.lastUpdate,
          isValid: (Date.now() - this.cache.featured.lastUpdate) < this.cache.featured.duration
        },
        details: {
          count: this.cache.details.size
        }
      },
      fallback: {
        packagesCount: this.fallbackPackages.length
      }
    };
  }
}

// Crear instancia singleton
const travelCompositorPackages = new TravelCompositorPackages();

module.exports = travelCompositorPackages;

console.log('✅ Travel Compositor Packages cargado - Sistema robusto con fallbacks');
