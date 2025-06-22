// ===============================================
// TRAVEL COMPOSITOR RÁPIDO - SOLO PÁGINAS NECESARIAS
// ===============================================

const axios = require('axios');

const tcConfig = {
  baseUrl: 'https://online.travelcompositor.com/resources',
  authUrl: 'https://online.travelcompositor.com/resources/authentication/authenticate',
  
  auth: {
    username: process.env.TC_USERNAME || 'ApiUser1',
    password: process.env.TC_PASSWORD || 'Veoveo77*',
    micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
  },
  
  timeout: 15000,
  packagesCache: { data: [], lastUpdate: 0, cacheDuration: 10 * 60 * 1000 }, // 10 minutos
  authToken: null,
  tokenExpiration: null,

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
  },

  isTokenValid() {
    return this.authToken && this.tokenExpiration && Date.now() < this.tokenExpiration;
  },

  async getValidToken() {
    if (!this.isTokenValid()) {
      const auth = await this.authenticate();
      if (!auth.success) {
        return null;
      }
    }
    return this.authToken;
  },

  // ⚡ VERSIÓN RÁPIDA - SOLO PRIMERAS PÁGINAS DIVERSAS
  async getAllPackages(forceRefresh = false) {
    const now = Date.now();
    
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
    
    console.log('⚡ Obteniendo paquetes RÁPIDO de Travel Compositor...');
    
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      let allPackages = [];
      
      // ⚡ ESTRATEGIA RÁPIDA: Solo 5-8 páginas para máxima diversidad
      const maxPages = 8; // Límite bajo para velocidad
      const packagesPerPage = 100;
      
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Página ${page}/${maxPages} (límite: ${packagesPerPage})...`);
        
        try {
          const holidayResult = await this.getHolidayPackagesPage(token, packagesPerPage, page);
          
          if (holidayResult.success && holidayResult.packages.length > 0) {
            allPackages.push(...holidayResult.packages);
            console.log(`✅ Página ${page}: ${holidayResult.packages.length} packages obtenidos`);
            
            // Si obtuvo menos del límite, probablemente es la última página
            if (holidayResult.packages.length < packagesPerPage) {
              console.log(`🏁 Última página detectada en ${page}`);
              break;
            }
          } else {
            console.log(`⚠️ Página ${page} sin resultados, terminando`);
            break;
          }
          
          // Pausa corta entre páginas
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.log(`⚠️ Error en página ${page}: ${error.message}`);
          break;
        }
      }
      
      const uniquePackages = this.removeDuplicates(allPackages);
      
      console.log(`🎉 TOTAL OBTENIDO: ${uniquePackages.length} paquetes únicos`);
      
      // Analizar diversidad obtenida
      const countries = [...new Set(uniquePackages.map(p => p.country))].filter(c => c !== 'País');
      const categories = [...new Set(uniquePackages.map(p => p.category))].filter(c => c !== 'Viaje');
      
      console.log(`🌍 Países únicos: ${countries.length}`);
      console.log(`🏷️ Categorías únicas: ${categories.length}`);
      
      this.packagesCache.data = uniquePackages;
      this.packagesCache.lastUpdate = now;
      
      return {
        success: true,
        packages: uniquePackages,
        source: 'travel-compositor-fast',
        total: uniquePackages.length,
        pages: Math.min(maxPages, allPackages.length / packagesPerPage),
        diversity: {
          countries: countries.length,
          categories: categories.length,
          topCountries: countries.slice(0, 5),
          topCategories: categories.slice(0, 5)
        }
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo paquetes rápido:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ⚡ VERSIÓN RÁPIDA DE getPackages
  async getPackages(limit = 40) {
    console.log(`📦 getPackages RÁPIDO llamado con límite: ${limit}`);
    
    // Si pide pocos paquetes, obtener solo 2-3 páginas
    if (limit <= 100) {
      console.log('⚡ Límite pequeño, obteniendo solo 2-3 páginas...');
      
      try {
        const token = await this.getValidToken();
        if (!token) {
          throw new Error('No se pudo obtener token');
        }
        
        let packages = [];
        const maxPages = Math.min(3, Math.ceil(limit / 100) + 1);
        
        for (let page = 1; page <= maxPages; page++) {
          const result = await this.getHolidayPackagesPage(token, 100, page);
          if (result.success) {
            packages.push(...result.packages);
            console.log(`✅ Página ${page}: ${result.packages.length} packages`);
            
            if (packages.length >= limit) break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return {
          success: true,
          packages: packages.slice(0, limit),
          source: 'travel-compositor-fast',
          total: packages.length
        };
        
      } catch (error) {
        console.log('⚠️ Error en getPackages rápido:', error.message);
      }
    }
    
    // Para límites altos, usar cache
    const result = await this.getAllPackages();
    
    if (result.success && limit && limit < result.packages.length) {
      return {
        ...result,
        packages: result.packages.slice(0, limit),
        limitApplied: limit
      };
    }
    
    return result;
  },

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

  normalizePackages(rawPackages) {
    return rawPackages.map((pkg, index) => this.normalizePackage(pkg, index));
  },

  // ⚡ NORMALIZACIÓN RÁPIDA Y EFICIENTE
  normalizePackage(pkg, index = 0) {
    const country = this.extractCountry(pkg);
    const destination = this.extractDestination(pkg);
    const category = this.extractCategory(pkg);
    
    return {
      id: pkg.id || `tc-package-${index}`,
      title: pkg.title || pkg.largeTitle || `Holiday Package ${index + 1}`,
      destination: destination,
      country: country,
      price: {
        amount: pkg.pricePerPerson?.amount || pkg.totalPrice?.amount || 999,
        currency: pkg.pricePerPerson?.currency || pkg.totalPrice?.currency || 'USD'
      },
      duration: this.calculateDuration(pkg),
      category: category,
      description: {
        short: pkg.description || `Descubre ${destination} en una experiencia única`,
        full: pkg.description || `Paquete completo para conocer ${destination}.`
      },
      images: {
        main: pkg.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
        gallery: pkg.imageUrl ? [pkg.imageUrl] : []
      },
      rating: { 
        average: Number((4.0 + Math.random() * 1).toFixed(1)), 
        count: 50 + Math.floor(Math.random() * 200) 
      },
      features: ['Alojamiento incluido', 'Guías especializados'],
      highlights: [`${this.calculateDuration(pkg).days} días`, `Viaje a ${country}`],
      featured: true,
      status: 'active',
      _source: 'travel-compositor',
      _type: 'holiday-package'
    };
  },

  // Funciones de extracción OPTIMIZADAS
  extractCountry(pkg) {
    // 1. Desde externalReference (más rápido)
    if (pkg.externalReference) {
      const ref = pkg.externalReference.toUpperCase();
      if (ref.includes('PERÚ') || ref.includes('PERU')) return 'Perú';
      if (ref.includes('ARGENTINA')) return 'Argentina';
      if (ref.includes('BRASIL') || ref.includes('BRAZIL')) return 'Brasil';
      if (ref.includes('CHILE')) return 'Chile';
      if (ref.includes('COLOMBIA')) return 'Colombia';
      if (ref.includes('MEXICO')) return 'México';
      if (ref.includes('ESPAÑA') || ref.includes('SPAIN')) return 'España';
      if (ref.includes('FRANCIA') || ref.includes('FRANCE')) return 'Francia';
      if (ref.includes('ITALIA') || ref.includes('ITALY')) return 'Italia';
    }
    
    // 2. Desde destinations
    if (Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      const destName = pkg.destinations[0].name || '';
      if (destName.includes('Lima') || destName.includes('Cusco')) return 'Perú';
      if (destName.includes('Buenos Aires')) return 'Argentina';
      if (destName.includes('Rio') || destName.includes('São Paulo')) return 'Brasil';
      if (destName.includes('Santiago')) return 'Chile';
      if (destName.includes('Bogotá')) return 'Colombia';
    }
    
    return 'Destino Internacional';
  },

  extractDestination(pkg) {
    if (Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      return pkg.destinations[0].name || 'Destino';
    }
    return 'Destino';
  },

  extractCategory(pkg) {
    if (pkg.ribbonText && pkg.ribbonText !== 'Solo Terrestre') {
      return pkg.ribbonText;
    }
    
    const title = (pkg.title || '').toLowerCase();
    if (title.includes('aventura')) return 'Aventura';
    if (title.includes('cultural') || title.includes('cultura')) return 'Cultural';
    if (title.includes('playa')) return 'Playa';
    if (title.includes('ciudad')) return 'Ciudad';
    
    return 'Viaje';
  },

  calculateDuration(pkg) {
    if (pkg.counters && pkg.counters.hotelNights) {
      return {
        days: pkg.counters.hotelNights + 1,
        nights: pkg.counters.hotelNights
      };
    }
    return { days: 7, nights: 6 };
  },

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

  async tryAuthentication() {
    console.log('🔍 Probando autenticación Travel Compositor...');
    const result = await this.authenticate();
    if (result.success) {
      console.log('✅ Travel Compositor conectado y funcionando');
      
      // Prueba rápida con 5 paquetes
      try {
        const testResult = await this.getPackages(5);
        if (testResult.success) {
          console.log(`✅ ${testResult.packages.length} paquetes de prueba obtenidos`);
        }
      } catch (error) {
        console.log('⚠️ Error en prueba:', error.message);
      }
    }
    return result;
  }
};

module.exports = tcConfig;