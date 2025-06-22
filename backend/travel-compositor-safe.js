// ===============================================
// TRAVEL COMPOSITOR MEJORADO - TODOS LOS PAQUETES
// ===============================================

const axios = require('axios');

const tcConfig = {
  // URLs CORREGIDAS según documentación Swagger
  baseUrl: 'https://online.travelcompositor.com/resources',
  authUrl: 'https://online.travelcompositor.com/resources/authentication/authenticate',
  
  // Configuración de autenticación EXACTA según Swagger
  auth: {
    username: process.env.TC_USERNAME || 'ApiUser1',
    password: process.env.TC_PASSWORD || 'Veoveo77*',
    micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
  },
  
  timeout: 15000,
  
  // Cache de paquetes para evitar múltiples llamadas
  packagesCache: {
    data: [],
    lastUpdate: 0,
    cacheDuration: 5 * 60 * 1000 // 5 minutos
  },
  
  // Token de autenticación
  authToken: null,
  tokenExpiration: null,
  
  // AUTENTICACIÓN CORREGIDA
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
        console.log(`Token expira en: ${expiresIn} segundos`);
        
        return { success: true, token: this.authToken };
      }
      
      throw new Error('No se recibió token en la respuesta');
      
    } catch (error) {
      console.log('❌ Error autenticando con Travel Compositor:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  // Verificar si el token está vigente
  isTokenValid() {
    return this.authToken && this.tokenExpiration && Date.now() < this.tokenExpiration;
  },
  
  // Obtener token válido
  async getValidToken() {
    if (!this.isTokenValid()) {
      const auth = await this.authenticate();
      if (!auth.success) {
        return null;
      }
    }
    return this.authToken;
  },
  
  // ======================================
  // OBTENER TODOS LOS PAQUETES (MEJORADO)
  // ======================================
  
  async getAllPackages(forceRefresh = false) {
    const now = Date.now();
    
    // Verificar cache
    if (!forceRefresh && 
        this.packagesCache.data.length > 0 && 
        (now - this.packagesCache.lastUpdate) < this.packagesCache.cacheDuration) {
      console.log(`📦 Usando cache: ${this.packagesCache.data.length} paquetes`);
      return {
        success: true,
        packages: this.packagesCache.data,
        source: 'travel-compositor-cache',
        total: this.packagesCache.data.length
      };
    }
    
    console.log('🔄 Obteniendo TODOS los paquetes de Travel Compositor...');
    
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      let allPackages = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 50; // Límite de seguridad
      const packagesPerPage = 100; // Máximo por página
      
      while (hasMore && page <= maxPages) {
        console.log(`📄 Obteniendo página ${page} (límite: ${packagesPerPage})...`);
        
        try {
          // Intentar holiday packages primero
          const holidayResult = await this.getHolidayPackagesPage(token, packagesPerPage, page);
          
          if (holidayResult.success && holidayResult.packages.length > 0) {
            allPackages.push(...holidayResult.packages);
            console.log(`✅ Página ${page}: ${holidayResult.packages.length} holiday packages obtenidos`);
            
            // Si obtuvo menos del límite, probablemente es la última página
            if (holidayResult.packages.length < packagesPerPage) {
              hasMore = false;
            }
          } else {
            // Si holiday packages falla, intentar travel ideas
            const ideasResult = await this.getTravelIdeasPage(token, packagesPerPage, page);
            
            if (ideasResult.success && ideasResult.packages.length > 0) {
              allPackages.push(...ideasResult.packages);
              console.log(`✅ Página ${page}: ${ideasResult.packages.length} travel ideas obtenidas`);
              
              if (ideasResult.packages.length < packagesPerPage) {
                hasMore = false;
              }
            } else {
              hasMore = false;
            }
          }
          
          page++;
          
          // Pequeña pausa para no sobrecargar la API
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.log(`⚠️ Error en página ${page}: ${error.message}`);
          hasMore = false;
        }
      }
      
      // Eliminar duplicados por ID
      const uniquePackages = this.removeDuplicates(allPackages);
      
      console.log(`🎉 TOTAL OBTENIDO: ${uniquePackages.length} paquetes únicos de ${allPackages.length} totales`);
      
      // Actualizar cache
      this.packagesCache.data = uniquePackages;
      this.packagesCache.lastUpdate = now;
      
      return {
        success: true,
        packages: uniquePackages,
        source: 'travel-compositor-full',
        total: uniquePackages.length,
        pages: page - 1
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo todos los paquetes:', error.message);
      return { success: false, error: error.message };
    }
  },
  
  // Obtener una página de holiday packages
  async getHolidayPackagesPage(token, limit, page) {
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
        return {
          success: true,
          packages: this.normalizePackages(response.data.package),
          source: 'holiday-packages'
        };
      }
      
      return { success: false, packages: [] };
      
    } catch (error) {
      throw error;
    }
  },
  
  // Obtener una página de travel ideas
  async getTravelIdeasPage(token, limit, page) {
    try {
      const response = await axios.get(`${this.baseUrl}/travelidea/${this.auth.micrositeId}`, {
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
      
      if (response.data && response.data.idea) {
        return {
          success: true,
          packages: this.normalizeIdeas(response.data.idea),
          source: 'travel-ideas'
        };
      }
      
      return { success: false, packages: [] };
      
    } catch (error) {
      throw error;
    }
  },
  
  // ======================================
  // BÚSQUEDA MEJORADA
  // ======================================
  
  async searchPackages(params) {
    console.log(`🔍 Búsqueda mejorada con parámetros:`, params);
    
    // Primero obtener todos los paquetes
    const allPackagesResult = await this.getAllPackages();
    
    if (!allPackagesResult.success) {
      return allPackagesResult;
    }
    
    let filteredPackages = allPackagesResult.packages;
    
    // Aplicar filtros
    if (params.search || params.destination) {
      const searchTerm = (params.search || params.destination || '').toLowerCase();
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.title?.toLowerCase().includes(searchTerm) ||
        pkg.destination?.toLowerCase().includes(searchTerm) ||
        pkg.country?.toLowerCase().includes(searchTerm) ||
        pkg.category?.toLowerCase().includes(searchTerm) ||
        pkg.description?.short?.toLowerCase().includes(searchTerm)
      );
      console.log(`🎯 Filtro por "${searchTerm}": ${filteredPackages.length} resultados`);
    }
    
    if (params.country) {
      const countryTerm = params.country.toLowerCase();
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.country?.toLowerCase().includes(countryTerm)
      );
      console.log(`🌍 Filtro por país "${params.country}": ${filteredPackages.length} resultados`);
    }
    
    if (params.category) {
      const categoryTerm = params.category.toLowerCase();
      filteredPackages = filteredPackages.filter(pkg => 
        pkg.category?.toLowerCase().includes(categoryTerm)
      );
      console.log(`🏷️ Filtro por categoría "${params.category}": ${filteredPackages.length} resultados`);
    }
    
    // Aplicar límite si se especifica
    if (params.limit) {
      filteredPackages = filteredPackages.slice(0, parseInt(params.limit));
    }
    
    return {
      success: true,
      packages: filteredPackages,
      source: 'travel-compositor-search',
      total: filteredPackages.length,
      totalAvailable: allPackagesResult.packages.length
    };
  },
  
  // ======================================
  // MÉTODOS DE COMPATIBILIDAD
  // ======================================
  
  // Método principal (mantener compatibilidad)
  async getPackages(limit = 840) {
    console.log(`📦 getPackages llamado con límite: ${limit}`);
    
    const result = await this.getAllPackages();
    
    if (result.success && limit && limit < result.packages.length) {
      // Si se especifica un límite menor, tomar solo esa cantidad
      return {
        ...result,
        packages: result.packages.slice(0, limit),
        limitApplied: limit
      };
    }
    
    return result;
  },
  
  // ======================================
  // UTILIDADES
  // ======================================
  
  // Eliminar duplicados por ID
  removeDuplicates(packages) {
    const seen = new Set();
    return packages.filter(pkg => {
      if (seen.has(pkg.id)) {
        return false;
      }
      seen.add(pkg.id);
      return true;
    });
  },
  
  // Obtener estadísticas de paquetes
  getPackageStats(packages) {
    const stats = {
      total: packages.length,
      byCountry: {},
      byCategory: {},
      priceRange: { min: Infinity, max: 0, avg: 0 }
    };
    
    let totalPrice = 0;
    
    packages.forEach(pkg => {
      // Por país
      const country = pkg.country || 'Sin país';
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;
      
      // Por categoría
      const category = pkg.category || 'Sin categoría';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Precios
      const price = pkg.price?.amount || 0;
      if (price > 0) {
        stats.priceRange.min = Math.min(stats.priceRange.min, price);
        stats.priceRange.max = Math.max(stats.priceRange.max, price);
        totalPrice += price;
      }
    });
    
    stats.priceRange.avg = Math.round(totalPrice / packages.length);
    
    return stats;
  },
  
  // Forzar actualización de cache
  async refreshCache() {
    console.log('🔄 Forzando actualización de cache...');
    return await this.getAllPackages(true);
  },
  
  // ======================================
  // MÉTODOS EXISTENTES (mantener compatibilidad)
  // ======================================
  
  // Normalizar Holiday Packages
  normalizePackages(rawPackages) {
    return rawPackages.map((pkg, index) => this.normalizePackage(pkg, index));
  },
  
  // Normalizar Ideas
  normalizeIdeas(rawIdeas) {
    return rawIdeas.map((idea, index) => this.normalizeIdea(idea, index));
  },
  
  // Normalizar Holiday Package individual
  normalizePackage(pkg, index = 0) {
    return {
      id: pkg.id || `tc-package-${index}`,
      title: pkg.title || pkg.largeTitle || `Holiday Package ${index + 1}`,
      destination: this.extractDestination(pkg.destinations),
      country: this.extractCountry(pkg.destinations),
      price: {
        amount: pkg.pricePerPerson?.amount || pkg.totalPrice?.amount || 999,
        currency: pkg.pricePerPerson?.currency || pkg.totalPrice?.currency || 'USD'
      },
      duration: this.calculateDuration(pkg.itinerary),
      category: this.extractThemes(pkg.themes),
      description: {
        short: pkg.description || 'Experiencia única de viaje',
        full: pkg.description || pkg.remarks || 'Experiencia única de viaje'
      },
      images: {
        main: pkg.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'
      },
      featured: true,
      status: 'active',
      _source: 'travel-compositor',
      _type: 'holiday-package'
    };
  },
  
  // Normalizar Travel Idea individual
  normalizeIdea(idea, index = 0) {
    return {
      id: idea.id || `tc-idea-${index}`,
      title: idea.title || idea.largeTitle || `Travel Idea ${index + 1}`,
      destination: this.extractDestination(idea.destinations),
      country: this.extractCountry(idea.destinations), 
      price: {
        amount: idea.pricePerPerson?.amount || idea.totalPrice?.amount || 999,
        currency: idea.pricePerPerson?.currency || idea.totalPrice?.currency || 'USD'
      },
      duration: this.calculateDuration(idea.itinerary),
      category: this.extractThemes(idea.themes),
      description: {
        short: idea.description || 'Experiencia única de viaje',
        full: idea.description || idea.remarks || 'Experiencia única de viaje'
      },
      images: {
        main: idea.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'
      },
      featured: true,
      status: 'active',
      _source: 'travel-compositor',
      _type: 'travel-idea'
    };
  },
  
  // Funciones auxiliares
  extractDestination(destinations) {
    if (Array.isArray(destinations) && destinations.length > 0) {
      return destinations[0].name || destinations[0].destination || 'Destino';
    }
    return 'Destino';
  },
  
  extractCountry(destinations) {
    if (Array.isArray(destinations) && destinations.length > 0) {
      return destinations[0].country || destinations[0].region || 'País';
    }
    return 'País';
  },
  
  calculateDuration(itinerary) {
    if (Array.isArray(itinerary) && itinerary.length > 0) {
      return {
        days: itinerary.length,
        nights: Math.max(0, itinerary.length - 1)
      };
    }
    return { days: 7, nights: 6 };
  },
  
  extractThemes(themes) {
    if (Array.isArray(themes) && themes.length > 0) {
      return themes[0].name || themes[0] || 'Viaje';
    }
    return 'Viaje';
  },
  
  // Testing y diagnóstico
  async tryAuthentication() {
    console.log('🔍 Probando autenticación Travel Compositor...');
    const result = await this.authenticate();
    if (result.success) {
      console.log('✅ Travel Compositor conectado y funcionando');
      
      // Probar obtener unos pocos paquetes primero
      const testResult = await this.getHolidayPackagesPage(this.authToken, 5, 1);
      if (testResult.success) {
        console.log(`✅ ${testResult.packages.length} paquetes de prueba obtenidos`);
      }
      
      // Luego obtener estadísticas generales
      const allPackages = await this.getAllPackages();
      if (allPackages.success) {
        const stats = this.getPackageStats(allPackages.packages);
        console.log(`📊 Estadísticas: ${stats.total} paquetes totales`);
        console.log(`📊 Países disponibles: ${Object.keys(stats.byCountry).length}`);
        console.log(`📊 Categorías disponibles: ${Object.keys(stats.byCategory).length}`);
      }
    }
    return result;
  }
};

module.exports = tcConfig;