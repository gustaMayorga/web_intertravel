// ===============================================
// TRAVEL COMPOSITOR CORREGIDO - VERSION LIMPIA
// ===============================================

const axios = require('axios');

// Importar sistema de keywords con fallback
let keywordStorage;
try {
  keywordStorage = require('./keyword-storage');
} catch (error) {
  console.warn('⚠️ Keyword storage no disponible, usando sistema básico');
  keywordStorage = {
    getAllKeywords: () => [
      { id: 1, keyword: 'perú', priority: 2, category: 'destination', active: true },
      { id: 2, keyword: 'premium', priority: 4, category: 'category', active: true },
      { id: 3, keyword: 'mendoza', priority: 3, category: 'destination', active: true }
    ]
  };
}

class TravelCompositorFixed {
  constructor() {
    this.baseUrl = 'https://online.travelcompositor.com/resources';
    this.authUrl = 'https://online.travelcompositor.com/resources/authentication/authenticate';
    
    this.auth = {
      username: process.env.TC_USERNAME || 'ApiUser1',
      password: process.env.TC_PASSWORD || 'Veoveo77*',
      micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
    };
    
    this.timeout = 15000;
    this.authToken = null;
    this.tokenExpiration = null;
    
    // Cache simple
    this.cache = {
      featured: { data: [], lastUpdate: 0, duration: 10 * 60 * 1000 },
      all: { data: [], lastUpdate: 0, duration: 15 * 60 * 1000 }
    };
    
    console.log('✅ Travel Compositor Fixed inicializado');
  }

  // ========================================
  // AUTENTICACIÓN
  // ========================================
  
  async authenticate() {
    try {
      console.log('🔑 Autenticando con Travel Compositor...');
      
      const response = await axios.post(this.authUrl, {
        username: this.auth.username,
        password: this.auth.password,
        micrositeId: this.auth.micrositeId
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        const expiresIn = response.data.expirationInSeconds || 3600;
        this.tokenExpiration = Date.now() + ((expiresIn - 300) * 1000);
        
        console.log('✅ Autenticación exitosa con Travel Compositor');
        return { success: true, token: this.authToken };
      }
      
      throw new Error('No se recibió token en la respuesta');
      
    } catch (error) {
      console.log('❌ Error autenticando con Travel Compositor:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  async getValidToken() {
    if (!this.authToken || Date.now() >= this.tokenExpiration) {
      const auth = await this.authenticate();
      if (!auth.success) return null;
    }
    return this.authToken;
  }

  // ========================================
  // SISTEMA DE PRIORIZACIÓN
  // ========================================
  
  applyPriorityFiltering(packages) {
    try {
      const keywords = keywordStorage.getAllKeywords().filter(k => k.active);
      console.log(`🎯 Aplicando ${keywords.length} keywords de priorización`);
      
      if (keywords.length === 0) {
        return packages.map(pkg => ({ ...pkg, priorityScore: 0, matchedKeywords: [] }));
      }
      
      const packagesWithPriority = packages.map(pkg => {
        let priorityScore = 0;
        let matchedKeywords = [];
        
        const searchText = [
          pkg.title,
          pkg.destination,
          pkg.country,
          pkg.description?.short,
          pkg.category
        ].join(' ').toLowerCase();
        
        keywords.forEach(keyword => {
          if (searchText.includes(keyword.keyword.toLowerCase())) {
            const score = Math.max(1, 10 - keyword.priority);
            priorityScore += score;
            matchedKeywords.push({
              keyword: keyword.keyword,
              priority: keyword.priority,
              category: keyword.category,
              score: score
            });
          }
        });
        
        return {
          ...pkg,
          priorityScore: Math.round(priorityScore * 10) / 10,
          matchedKeywords,
          isFeatured: priorityScore > 10 || pkg.featured || false
        };
      });
      
      // Ordenar por score
      packagesWithPriority.sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        return (a.price?.amount || 0) - (b.price?.amount || 0);
      });
      
      console.log(`✅ Priorización aplicada. Top scores: [${packagesWithPriority.slice(0, 3).map(p => p.priorityScore).join(', ')}]`);
      return packagesWithPriority;
      
    } catch (error) {
      console.error('❌ Error en priorización:', error);
      return packages.map(pkg => ({ ...pkg, priorityScore: 0, matchedKeywords: [] }));
    }
  }

  // ========================================
  // MÉTODOS PRINCIPALES
  // ========================================
  
  async getAllPackages(options = {}) {
    const { page = 1, limit = 20, destination, country, forceRefresh = false } = options;
    const now = Date.now();
    
    console.log(`📦 getAllPackages - Page: ${page}, Limit: ${limit}`);
    
    // Verificar cache
    if (!forceRefresh && 
        this.cache.all.data.length > 0 && 
        (now - this.cache.all.lastUpdate) < this.cache.all.duration) {
      
      console.log(`📦 Usando cache: ${this.cache.all.data.length} paquetes`);
      
      let filteredPackages = [...this.cache.all.data];
      
      // Aplicar filtros
      if (destination || country) {
        filteredPackages = this.applyLocationFilters(filteredPackages, destination, country);
      }
      
      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPackages = filteredPackages.slice(startIndex, endIndex);
      
      return {
        packages: paginatedPackages,
        total: filteredPackages.length,
        page: page,
        totalPages: Math.ceil(filteredPackages.length / limit),
        source: 'cache-prioritized'
      };
    }
    
    // Obtener datos frescos
    console.log('🔄 Obteniendo datos frescos de Travel Compositor...');
    
    try {
      const token = await this.getValidToken();
      if (!token) {
        console.error('❌ No se pudo obtener token válido');
        return this.getFallbackPackages(page, limit);
      }
      
      // Obtener paquetes reales
      const rawPackages = await this.fetchPackagesFromTC(token);
      console.log(`📥 Obtenidos ${rawPackages.length} paquetes de Travel Compositor`);
      
      if (rawPackages.length === 0) {
        console.warn('⚠️ No se obtuvieron paquetes de TC, usando fallback');
        return this.getFallbackPackages(page, limit);
      }
      
      // Normalizar y priorizar
      const normalizedPackages = rawPackages.map((pkg, index) => this.normalizePackage(pkg, index));
      const prioritizedPackages = this.applyPriorityFiltering(normalizedPackages);
      
      // Actualizar cache
      this.cache.all.data = prioritizedPackages.slice(0, 100); // Limitar cache
      this.cache.all.lastUpdate = now;
      
      // Aplicar filtros y paginación
      let filteredPackages = prioritizedPackages;
      if (destination || country) {
        filteredPackages = this.applyLocationFilters(filteredPackages, destination, country);
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPackages = filteredPackages.slice(startIndex, endIndex);
      
      return {
        packages: paginatedPackages,
        total: filteredPackages.length,
        page: page,
        totalPages: Math.ceil(filteredPackages.length / limit),
        source: 'travel-compositor-prioritized'
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo paquetes:', error.message);
      return this.getFallbackPackages(page, limit);
    }
  }
  
  async getFeaturedPackages(options = {}) {
    const { limit = 6 } = options;
    const now = Date.now();
    
    console.log(`⭐ getFeaturedPackages - Límite: ${limit}`);
    
    // Verificar cache
    if (this.cache.featured.data.length > 0 && 
        (now - this.cache.featured.lastUpdate) < this.cache.featured.duration) {
      
      console.log(`⭐ Usando cache de destacados`);
      const featured = this.cache.featured.data.slice(0, limit);
      
      return {
        packages: featured,
        total: featured.length,
        source: 'cache-featured-prioritized'
      };
    }
    
    try {
      // Obtener de la lista general
      const allPackagesResult = await this.getAllPackages({ limit: 50 });
      
      if (allPackagesResult.packages && allPackagesResult.packages.length > 0) {
        // Seleccionar destacados
        const featured = allPackagesResult.packages
          .filter(pkg => {
            return pkg.priorityScore > 5 || 
                   pkg.rating?.average > 4.7 || 
                   pkg.price?.amount > 1500;
          })
          .slice(0, limit);
        
        // Si no hay suficientes, tomar los primeros
        if (featured.length < limit) {
          const additional = allPackagesResult.packages
            .filter(pkg => !featured.find(f => f.id === pkg.id))
            .slice(0, limit - featured.length);
          featured.push(...additional);
        }
        
        // Actualizar cache
        this.cache.featured.data = featured;
        this.cache.featured.lastUpdate = now;
        
        console.log(`✅ ${featured.length} paquetes destacados seleccionados`);
        
        return {
          packages: featured,
          total: featured.length,
          source: 'travel-compositor-featured-prioritized'
        };
      }
      
      return this.getFallbackFeaturedPackages(limit);
      
    } catch (error) {
      console.error('❌ Error obteniendo paquetes destacados:', error.message);
      return this.getFallbackFeaturedPackages(limit);
    }
  }
  
  async getPackageById(id) {
    console.log(`🔍 getPackageById: ${id}`);
    
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      // Intentar obtener del endpoint específico
      const response = await axios.get(`${this.baseUrl}/package/${this.auth.micrositeId}/${id}`, {
        timeout: this.timeout,
        headers: {
          'auth-token': token,
          'Accept': 'application/json'
        },
        params: {
          lang: 'es',
          currency: 'USD'
        }
      });
      
      if (response.data && response.data.package) {
        const pkg = this.normalizePackageDetailed(response.data.package);
        const priorityInfo = this.calculatePriorityInfo(pkg);
        
        return { ...pkg, ...priorityInfo };
      }
      
      // Buscar en cache
      const foundInCache = this.cache.all.data.find(pkg => pkg.id === id);
      if (foundInCache) {
        return foundInCache;
      }
      
      return this.getFallbackPackageById(id);
      
    } catch (error) {
      console.error(`❌ Error obteniendo paquete ${id}:`, error.message);
      return this.getFallbackPackageById(id);
    }
  }

  // ========================================
  // OBTENCIÓN DE DATOS DESDE TC
  // ========================================
  
  async fetchPackagesFromTC(token) {
    let allPackages = [];
    const maxPages = 20;
    const packagesPerPage = 100;
    
    console.log('🔄 Iniciando obtención de paquetes...');
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const holidayPackages = await this.fetchPackagesPage(token, packagesPerPage, page);
        
        if (holidayPackages.length > 0) {
          allPackages.push(...holidayPackages);
          console.log(`✅ Página ${page}: ${holidayPackages.length} paquetes`);
        }
        
        if (holidayPackages.length < packagesPerPage) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (allPackages.length >= 300) {
          break;
        }
        
      } catch (error) {
        console.log(`⚠️ Error en página ${page}: ${error.message}`);
        if (page <= 3) {
          throw error;
        }
        break;
      }
    }
    
    const uniquePackages = this.removeDuplicates(allPackages);
    console.log(`🎉 Total obtenido: ${uniquePackages.length} paquetes únicos`);
    
    return uniquePackages;
  }
  
  async fetchPackagesPage(token, limit, page) {
    try {
      const response = await axios.get(`${this.baseUrl}/package/${this.auth.micrositeId}`, {
        timeout: this.timeout,
        headers: {
          'auth-token': token,
          'Accept': 'application/json'
        },
        params: {
          limit: limit,
          page: page,
          offset: (page - 1) * limit,
          lang: 'es',
          currency: 'USD',
          onlyVisible: true
        }
      });
      
      if (response.data && response.data.package) {
        return Array.isArray(response.data.package) ? response.data.package : [];
      }
      
      return [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  // ========================================
  // NORMALIZACIÓN DE DATOS
  // ========================================
  
  normalizePackage(pkg, index = 0) {
    try {
      return {
        id: pkg.id || `tc-${Date.now()}-${index}`,
        title: pkg.title || pkg.largeTitle || `Paquete ${index + 1}`,
        destination: this.extractDestination(pkg),
        country: this.extractCountry(pkg),
        price: this.extractPrice(pkg),
        duration: this.extractDuration(pkg),
        category: this.extractCategory(pkg),
        description: {
          short: pkg.description || 'Experiencia única de viaje',
          full: this.extractFullDescription(pkg)
        },
        images: this.extractImages(pkg),
        features: this.extractFeatures(pkg),
        rating: this.generateRating(pkg),
        included: this.extractIncluded(pkg),
        featured: false,
        status: 'active',
        _source: 'travel-compositor-real',
        _lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error normalizando paquete ${index}:`, error);
      return this.getFallbackPackage(index);
    }
  }
  
  normalizePackageDetailed(pkg) {
    const basicPkg = this.normalizePackage(pkg);
    
    return {
      ...basicPkg,
      contact: {
        whatsapp: process.env.WHATSAPP_NUMBER || '+5492615555558',
        email: process.env.CONTACT_EMAIL || 'reservas@intertravel.com.ar',
        phone: process.env.CONTACT_PHONE || '+5492615555558'
      },
      booking: {
        minAdvanceBooking: 7,
        maxGroupSize: 15,
        confirmationTime: '24-48 horas',
        cancellationPolicy: 'Flexible'
      },
      notIncluded: ['Vuelos internacionales', 'Gastos personales', 'Propinas'],
      _detailedSource: 'travel-compositor-detailed'
    };
  }

  // ========================================
  // MÉTODOS DE EXTRACCIÓN
  // ========================================
  
  extractDestination(pkg) {
    if (pkg.destinations && Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      return pkg.destinations[0].name || pkg.destinations[0].destination || 'Destino';
    }
    return pkg.destination || 'Destino';
  }
  
  extractCountry(pkg) {
    if (pkg.destinations && Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      return pkg.destinations[0].country || pkg.destinations[0].region || 'País';
    }
    return pkg.country || 'País';
  }
  
  extractPrice(pkg) {
    let amount = 999;
    let currency = 'USD';
    
    if (pkg.pricePerPerson && pkg.pricePerPerson.amount) {
      amount = parseFloat(pkg.pricePerPerson.amount);
      currency = pkg.pricePerPerson.currency || 'USD';
    } else if (pkg.totalPrice && pkg.totalPrice.amount) {
      amount = parseFloat(pkg.totalPrice.amount);
      currency = pkg.totalPrice.currency || 'USD';
    } else if (pkg.price) {
      if (typeof pkg.price === 'number') {
        amount = pkg.price;
      } else if (pkg.price.amount) {
        amount = parseFloat(pkg.price.amount);
        currency = pkg.price.currency || 'USD';
      }
    }
    
    return { amount: Math.round(amount), currency };
  }
  
  extractDuration(pkg) {
    let days = 7;
    let nights = 6;
    
    if (pkg.itinerary && Array.isArray(pkg.itinerary)) {
      days = pkg.itinerary.length;
    } else if (pkg.duration) {
      if (typeof pkg.duration === 'number') {
        days = pkg.duration;
      } else if (pkg.duration.days) {
        days = parseInt(pkg.duration.days);
      }
    }
    
    nights = Math.max(0, days - 1);
    return { days, nights };
  }
  
  extractCategory(pkg) {
    if (pkg.themes && Array.isArray(pkg.themes) && pkg.themes.length > 0) {
      return pkg.themes[0].name || pkg.themes[0] || 'Viaje';
    }
    return pkg.category || pkg.type || 'Viaje';
  }
  
  extractImages(pkg) {
    const main = pkg.imageUrl || pkg.mainImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop';
    
    let gallery = [main];
    if (pkg.images && Array.isArray(pkg.images)) {
      gallery = pkg.images.map(img => img.url || img).filter(Boolean);
    }
    
    return { main, gallery };
  }
  
  extractFeatures(pkg) {
    const features = [];
    
    if (pkg.services && Array.isArray(pkg.services)) {
      features.push(...pkg.services.map(s => s.name || s).filter(Boolean));
    }
    
    if (features.length === 0) {
      features.push('Alojamiento', 'Traslados', 'Asistencia 24/7');
    }
    
    return features.slice(0, 5);
  }
  
  extractIncluded(pkg) {
    if (pkg.includes && Array.isArray(pkg.includes)) {
      return pkg.includes;
    }
    
    return [
      'Alojamiento en hoteles seleccionados',
      'Traslados aeropuerto - hotel - aeropuerto',
      'Desayuno diario',
      'Asistencia al viajero'
    ];
  }
  
  extractFullDescription(pkg) {
    const parts = [];
    if (pkg.description) parts.push(pkg.description);
    if (pkg.longDescription) parts.push(pkg.longDescription);
    if (pkg.remarks) parts.push(pkg.remarks);
    
    let full = parts.join(' ').trim();
    if (!full) {
      full = 'Experiencia única de viaje con servicios completos y atención personalizada.';
    }
    
    return full.length > 500 ? full.substring(0, 497) + '...' : full;
  }
  
  generateRating(pkg) {
    if (pkg.rating && pkg.rating.average) {
      return {
        average: parseFloat(pkg.rating.average),
        count: parseInt(pkg.rating.count) || Math.floor(Math.random() * 200) + 10
      };
    }
    
    let baseRating = 4.2;
    const price = pkg.pricePerPerson?.amount || pkg.price?.amount || 1000;
    if (price > 2000) baseRating += 0.3;
    else if (price > 1500) baseRating += 0.2;
    
    return {
      average: Math.round(Math.min(5.0, Math.max(3.5, baseRating)) * 10) / 10,
      count: Math.floor(Math.random() * 150) + 25
    };
  }

  // ========================================
  // MÉTODOS DE UTILIDAD
  // ========================================
  
  applyLocationFilters(packages, destination, country) {
    return packages.filter(pkg => {
      let matches = true;
      
      if (destination) {
        const destTerm = destination.toLowerCase();
        matches = matches && (
          pkg.destination?.toLowerCase().includes(destTerm) ||
          pkg.title?.toLowerCase().includes(destTerm)
        );
      }
      
      if (country) {
        const countryTerm = country.toLowerCase();
        matches = matches && pkg.country?.toLowerCase().includes(countryTerm);
      }
      
      return matches;
    });
  }
  
  calculatePriorityInfo(pkg) {
    try {
      const keywords = keywordStorage.getAllKeywords().filter(k => k.active);
      const searchText = [
        pkg.title,
        pkg.destination,
        pkg.country,
        pkg.description?.short,
        pkg.category
      ].join(' ').toLowerCase();
      
      let priorityScore = 0;
      let matchedKeywords = [];
      
      keywords.forEach(keyword => {
        if (searchText.includes(keyword.keyword.toLowerCase())) {
          const score = Math.max(1, 10 - keyword.priority);
          priorityScore += score;
          matchedKeywords.push({
            keyword: keyword.keyword,
            priority: keyword.priority,
            category: keyword.category
          });
        }
      });
      
      return {
        priorityScore: Math.round(priorityScore * 10) / 10,
        matchedKeywords,
        isFeatured: priorityScore > 15
      };
      
    } catch (error) {
      return { priorityScore: 0, matchedKeywords: [], isFeatured: false };
    }
  }
  
  removeDuplicates(packages) {
    const seen = new Set();
    return packages.filter(pkg => {
      const key = pkg.id || `${pkg.title}-${pkg.destination}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ========================================
  // FALLBACKS
  // ========================================
  
  getFallbackPackages(page = 1, limit = 20) {
    const mockPackages = [
      {
        id: 'fallback-1',
        title: 'Perú Completo - Cusco, Machu Picchu y Lima',
        destination: 'Cusco',
        country: 'Perú',
        price: { amount: 1890, currency: 'USD' },
        duration: { days: 8, nights: 7 },
        category: 'Cultural',
        description: {
          short: 'Explora las maravillas del Imperio Inca',
          full: 'Descubre Cusco, el Valle Sagrado y Machu Picchu en una experiencia inolvidable.'
        },
        images: {
          main: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop']
        },
        features: ['Tren a Machu Picchu', 'Guía especializado', 'Hoteles 3*'],
        rating: { average: 4.9, count: 203 },
        priorityScore: 95,
        matchedKeywords: [{ keyword: 'perú', priority: 2, category: 'destination' }],
        isFeatured: true,
        _source: 'fallback-prioritized'
      },
      {
        id: 'fallback-2',
        title: 'Mendoza Premium - Vinos y Montañas',
        destination: 'Mendoza',
        country: 'Argentina',
        price: { amount: 1450, currency: 'USD' },
        duration: { days: 5, nights: 4 },
        category: 'Premium',
        description: {
          short: 'Experiencia premium en la capital del vino',
          full: 'Tours exclusivos por las mejores bodegas con degustaciones premium.'
        },
        images: {
          main: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop']
        },
        features: ['Bodegas premium', 'Degustaciones', 'Hotel boutique'],
        rating: { average: 4.8, count: 156 },
        priorityScore: 85,
        matchedKeywords: [
          { keyword: 'mendoza', priority: 3, category: 'destination' },
          { keyword: 'premium', priority: 4, category: 'category' }
        ],
        isFeatured: true,
        _source: 'fallback-prioritized'
      }
    ];
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockPackages.slice(startIndex, endIndex);
    
    return {
      packages: paginatedData,
      total: mockPackages.length,
      page: page,
      totalPages: Math.ceil(mockPackages.length / limit),
      source: 'fallback-prioritized'
    };
  }
  
  getFallbackFeaturedPackages(limit = 6) {
    const featured = this.getFallbackPackages(1, limit);
    return {
      packages: featured.packages,
      total: featured.packages.length,
      source: 'fallback-featured-prioritized'
    };
  }
  
  getFallbackPackageById(id) {
    const mockPackages = this.getFallbackPackages(1, 10).packages;
    const found = mockPackages.find(pkg => pkg.id === id);
    
    if (found) {
      return {
        ...found,
        contact: {
          whatsapp: '+5492615555558',
          email: 'reservas@intertravel.com.ar',
          phone: '+5492615555558'
        }
      };
    }
    
    return {
      id: id,
      title: `Paquete ${id}`,
      destination: 'Destino Demo',
      country: 'País Demo',
      price: { amount: 1500, currency: 'USD' },
      duration: { days: 7, nights: 6 },
      category: 'Viaje',
      description: {
        short: 'Paquete de demostración',
        full: 'Este es un paquete de demostración'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
        gallery: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop']
      },
      features: ['Alojamiento', 'Traslados'],
      rating: { average: 4.5, count: 0 },
      priorityScore: 0,
      matchedKeywords: [],
      isFeatured: false,
      _source: 'fallback-single'
    };
  }
  
  getFallbackPackage(index) {
    return {
      id: `fallback-${index}`,
      title: `Paquete ${index + 1}`,
      destination: 'Destino',
      country: 'País',
      price: { amount: 999, currency: 'USD' },
      duration: { days: 7, nights: 6 },
      category: 'Viaje',
      description: {
        short: 'Experiencia de viaje',
        full: 'Experiencia de viaje con servicios incluidos'
      },
      images: {
        main: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
        gallery: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop']
      },
      features: ['Alojamiento', 'Traslados'],
      rating: { average: 4.5, count: 0 },
      priorityScore: 0,
      matchedKeywords: [],
      isFeatured: false,
      _source: 'fallback-normalize-error'
    };
  }

  // ========================================
  // MÉTODOS DE TESTING
  // ========================================
  
  async testConnection() {
    console.log('🔍 Probando conexión del sistema...');
    
    try {
      const auth = await this.authenticate();
      if (!auth.success) {
        return {
          success: false,
          error: 'Error de autenticación',
          details: auth.error
        };
      }
      
      const testPackages = await this.getAllPackages({ limit: 5 });
      const keywords = keywordStorage.getAllKeywords();
      const featured = await this.getFeaturedPackages({ limit: 3 });
      
      return {
        success: true,
        message: 'Sistema funcionando correctamente',
        stats: {
          packagesObtained: testPackages.packages.length,
          packagesSource: testPackages.source,
          keywordsActive: keywords.filter(k => k.active).length,
          featuredPackages: featured.packages.length,
          prioritySystemActive: testPackages.packages.some(p => p.priorityScore > 0)
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Error en el sistema',
        details: error.message
      };
    }
  }
}

// Crear instancia única
const travelCompositor = new TravelCompositorFixed();

module.exports = travelCompositor;