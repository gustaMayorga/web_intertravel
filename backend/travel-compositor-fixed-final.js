// ===============================================
// TRAVEL COMPOSITOR NORMALIZACIÓN CORREGIDA
// ===============================================

const axios = require('axios');

const tcConfig = {
  // ... resto de configuración igual ...
  baseUrl: 'https://online.travelcompositor.com/resources',
  authUrl: 'https://online.travelcompositor.com/resources/authentication/authenticate',
  
  auth: {
    username: process.env.TC_USERNAME || 'ApiUser1',
    password: process.env.TC_PASSWORD || 'Veoveo77*',
    micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
  },
  
  timeout: 15000,
  packagesCache: { data: [], lastUpdate: 0, cacheDuration: 5 * 60 * 1000 },
  authToken: null,
  tokenExpiration: null,

  // ======================================
  // FUNCIONES DE NORMALIZACIÓN CORREGIDAS
  // ======================================

  // 🔧 NUEVA: Extraer país desde externalReference
  extractCountryFromReference(externalReference) {
    if (!externalReference) return null;
    
    const countryMap = {
      'PERÚ': 'Perú',
      'PERU': 'Perú', 
      'ARGENTINA': 'Argentina',
      'BRASIL': 'Brasil',
      'BRAZIL': 'Brasil',
      'CHILE': 'Chile',
      'COLOMBIA': 'Colombia',
      'ECUADOR': 'Ecuador',
      'VENEZUELA': 'Venezuela',
      'URUGUAY': 'Uruguay',
      'BOLIVIA': 'Bolivia',
      'MEXICO': 'México',
      'ESPAÑA': 'España',
      'SPAIN': 'España',
      'FRANCIA': 'Francia',
      'FRANCE': 'Francia',
      'ITALIA': 'Italia',
      'ITALY': 'Italia',
      'ALEMANIA': 'Alemania',
      'GERMANY': 'Alemania',
      'PORTUGAL': 'Portugal',
      'USA': 'Estados Unidos',
      'EEUU': 'Estados Unidos',
      'CANADA': 'Canadá',
      'JAPON': 'Japón',
      'JAPAN': 'Japón',
      'CHINA': 'China',
      'INDIA': 'India',
      'TAILANDIA': 'Tailandia',
      'THAILAND': 'Tailandia',
      'VIETNAM': 'Vietnam',
      'TURQUIA': 'Turquía',
      'TURKEY': 'Turquía',
      'MARRUECOS': 'Marruecos',
      'MOROCCO': 'Marruecos',
      'EGIPTO': 'Egipto',
      'EGYPT': 'Egipto'
    };
    
    const upperRef = externalReference.toUpperCase();
    
    for (const [key, country] of Object.entries(countryMap)) {
      if (upperRef.includes(key)) {
        return country;
      }
    }
    
    return null;
  },

  // 🔧 NUEVA: Extraer país desde URL de imagen
  extractCountryFromImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    const urlCountryMap = {
      '/peru/': 'Perú',
      '/argentina/': 'Argentina', 
      '/brasil/': 'Brasil',
      '/brazil/': 'Brasil',
      '/chile/': 'Chile',
      '/colombia/': 'Colombia',
      '/ecuador/': 'Ecuador',
      '/uruguay/': 'Uruguay',
      '/bolivia/': 'Bolivia',
      '/mexico/': 'México',
      '/spain/': 'España',
      '/france/': 'Francia',
      '/italy/': 'Italia',
      '/germany/': 'Alemania',
      '/portugal/': 'Portugal',
      '/usa/': 'Estados Unidos',
      '/canada/': 'Canadá',
      '/japan/': 'Japón',
      '/china/': 'China',
      '/india/': 'India',
      '/thailand/': 'Tailandia',
      '/vietnam/': 'Vietnam',
      '/turkey/': 'Turquía',
      '/morocco/': 'Marruecos',
      '/egypt/': 'Egipto'
    };
    
    const lowerUrl = imageUrl.toLowerCase();
    
    for (const [path, country] of Object.entries(urlCountryMap)) {
      if (lowerUrl.includes(path)) {
        return country;
      }
    }
    
    return null;
  },

  // 🔧 NUEVA: Extraer país desde destinos
  extractCountryFromDestinations(destinations) {
    if (!Array.isArray(destinations) || destinations.length === 0) return null;
    
    const destinationCountryMap = {
      // Perú
      'Lima': 'Perú',
      'Cusco': 'Perú', 
      'Cuzco': 'Perú',
      'Arequipa': 'Perú',
      'Iquitos': 'Perú',
      'Trujillo': 'Perú',
      'Paracas': 'Perú',
      'Nazca': 'Perú',
      
      // Argentina
      'Buenos Aires': 'Argentina',
      'Mendoza': 'Argentina',
      'Córdoba': 'Argentina',
      'Rosario': 'Argentina',
      'Bariloche': 'Argentina',
      'Ushuaia': 'Argentina',
      'Salta': 'Argentina',
      'Iguazú': 'Argentina',
      
      // Brasil
      'São Paulo': 'Brasil',
      'Rio de Janeiro': 'Brasil',
      'Salvador': 'Brasil',
      'Brasília': 'Brasil',
      'Fortaleza': 'Brasil',
      'Recife': 'Brasil',
      'Manaus': 'Brasil',
      'Foz do Iguaçu': 'Brasil',
      
      // Chile
      'Santiago': 'Chile',
      'Valparaíso': 'Chile',
      'Concepción': 'Chile',
      'La Serena': 'Chile',
      'Antofagasta': 'Chile',
      'Temuco': 'Chile',
      'Puerto Montt': 'Chile',
      
      // Colombia
      'Bogotá': 'Colombia',
      'Medellín': 'Colombia',
      'Cali': 'Colombia',
      'Barranquilla': 'Colombia',
      'Cartagena': 'Colombia',
      'Santa Marta': 'Colombia',
      
      // México
      'Ciudad de México': 'México',
      'Guadalajara': 'México',
      'Monterrey': 'México',
      'Cancún': 'México',
      'Puerto Vallarta': 'México',
      'Playa del Carmen': 'México',
      'Mérida': 'México',
      'Acapulco': 'México',
      
      // España
      'Madrid': 'España',
      'Barcelona': 'España',
      'Valencia': 'España',
      'Sevilla': 'España',
      'Bilbao': 'España',
      'Granada': 'España',
      'Toledo': 'España',
      
      // Francia
      'París': 'Francia',
      'Lyon': 'Francia',
      'Marseille': 'Francia',
      'Nice': 'Francia',
      'Bordeaux': 'Francia',
      'Cannes': 'Francia',
      
      // Italia
      'Roma': 'Italia',
      'Milán': 'Italia',
      'Venecia': 'Italia',
      'Florencia': 'Italia',
      'Nápoles': 'Italia',
      'Turín': 'Italia',
      
      // Estados Unidos
      'Nueva York': 'Estados Unidos',
      'Los Ángeles': 'Estados Unidos', 
      'Chicago': 'Estados Unidos',
      'Miami': 'Estados Unidos',
      'Las Vegas': 'Estados Unidos',
      'San Francisco': 'Estados Unidos',
      
      // Otros
      'Londres': 'Reino Unido',
      'Tokio': 'Japón',
      'Beijing': 'China',
      'Bangkok': 'Tailandia',
      'Nueva Delhi': 'India'
    };
    
    for (const destination of destinations) {
      const destName = destination.name || destination;
      if (destinationCountryMap[destName]) {
        return destinationCountryMap[destName];
      }
    }
    
    return null;
  },

  // 🔧 CORREGIDA: Función principal de extracción de país
  extractCountry(pkg) {
    // 1. Intentar desde externalReference
    let country = this.extractCountryFromReference(pkg.externalReference);
    if (country) return country;
    
    // 2. Intentar desde URL de imagen
    country = this.extractCountryFromImageUrl(pkg.imageUrl);
    if (country) return country;
    
    // 3. Intentar desde destinations
    country = this.extractCountryFromDestinations(pkg.destinations);
    if (country) return country;
    
    // 4. Buscar en destinations originalmente (mantener compatibilidad)
    if (Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      const dest = pkg.destinations[0];
      country = dest.country || dest.region;
      if (country && country !== 'País') return country;
    }
    
    // 5. Fallback
    return 'País';
  },

  // 🔧 CORREGIDA: Función principal de extracción de destino
  extractDestination(pkg) {
    if (Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      // Tomar el primer destino principal
      return pkg.destinations[0].name || pkg.destinations[0].destination || 'Destino';
    }
    return pkg.destination || pkg.city || pkg.location || 'Destino';
  },

  // 🔧 NUEVA: Extraer categoría desde ribbonText y otros campos
  extractCategory(pkg) {
    // 1. Usar ribbonText si está disponible y no es genérico
    if (pkg.ribbonText && pkg.ribbonText !== 'Solo Terrestre') {
      return pkg.ribbonText;
    }
    
    // 2. Mapear desde ribbonText
    const ribbonCategoryMap = {
      'Solo Terrestre': 'Terrestre',
      'Con Vuelos': 'Aéreo',
      'Todo Incluido': 'Todo Incluido',
      'Crucero': 'Crucero',
      'Aventura': 'Aventura',
      'Cultural': 'Cultural',
      'Romántico': 'Romance',
      'Familia': 'Familiar',
      'Lujo': 'Lujo',
      'Económico': 'Económico'
    };
    
    if (pkg.ribbonText && ribbonCategoryMap[pkg.ribbonText]) {
      return ribbonCategoryMap[pkg.ribbonText];
    }
    
    // 3. Extraer desde título
    const title = (pkg.title || '').toLowerCase();
    if (title.includes('aventura')) return 'Aventura';
    if (title.includes('cultural') || title.includes('cultura')) return 'Cultural';
    if (title.includes('romántico') || title.includes('romance')) return 'Romance';
    if (title.includes('familia') || title.includes('familiar')) return 'Familiar';
    if (title.includes('lujo') || title.includes('premium')) return 'Lujo';
    if (title.includes('playa') || title.includes('costa')) return 'Playa';
    if (title.includes('montaña') || title.includes('sierra')) return 'Montaña';
    if (title.includes('ciudad')) return 'Ciudad';
    if (title.includes('historia') || title.includes('histórico')) return 'Historia';
    if (title.includes('gastronom')) return 'Gastronomía';
    if (title.includes('relax') || title.includes('spa')) return 'Relax';
    
    // 4. Usar themes si están disponibles
    if (Array.isArray(pkg.themes) && pkg.themes.length > 0) {
      const theme = pkg.themes[0];
      return theme.name || theme.title || theme;
    }
    
    // 5. Desde externalReference
    const ref = (pkg.externalReference || '').toUpperCase();
    if (ref.includes('CULT')) return 'Cultural';
    if (ref.includes('ADV') || ref.includes('AVENT')) return 'Aventura';
    if (ref.includes('ROM')) return 'Romance';
    if (ref.includes('FAM')) return 'Familiar';
    if (ref.includes('LUX')) return 'Lujo';
    
    // 6. Desde categoría por país (inferencia inteligente)
    const country = this.extractCountry(pkg);
    if (country === 'Perú') return 'Cultural';
    if (country === 'Brasil') return 'Playa';
    if (country === 'Argentina') return 'Aventura';
    if (country === 'México') return 'Playa';
    if (country === 'España') return 'Cultural';
    if (country === 'Francia') return 'Romance';
    if (country === 'Italia') return 'Cultural';
    
    // 7. Fallback
    return 'Viaje';
  },

  // ======================================
  // FUNCIÓN DE NORMALIZACIÓN ACTUALIZADA
  // ======================================

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
      duration: this.calculateDuration(pkg.itinerary, pkg.counters),
      category: category,
      description: {
        short: pkg.description || pkg.remarks || `Descubre ${destination} en una experiencia única`,
        full: pkg.description || pkg.remarks || `Paquete completo para conocer ${destination} con las mejores atracciones.`
      },
      images: {
        main: pkg.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
        gallery: pkg.imageUrl ? [pkg.imageUrl] : []
      },
      rating: { 
        average: Number((4.0 + Math.random() * 1).toFixed(1)), 
        count: 50 + Math.floor(Math.random() * 200) 
      },
      features: this.extractFeatures(pkg),
      highlights: this.extractHighlights(pkg),
      featured: true,
      status: 'active',
      availability: 'available',
      _source: 'travel-compositor',
      _type: 'holiday-package',
      _originalData: {
        externalReference: pkg.externalReference,
        ribbonText: pkg.ribbonText,
        destinations: pkg.destinations,
        themes: pkg.themes,
        counters: pkg.counters
      }
    };
  },

  // 🔧 NUEVA: Calcular duración mejorada
  calculateDuration(itinerary, counters) {
    if (counters && counters.hotelNights) {
      return {
        days: counters.hotelNights + 1,
        nights: counters.hotelNights
      };
    }
    
    if (Array.isArray(itinerary) && itinerary.length > 0) {
      return {
        days: itinerary.length,
        nights: Math.max(0, itinerary.length - 1)
      };
    }
    
    return { days: 7, nights: 6 };
  },

  // 🔧 NUEVA: Extraer características
  extractFeatures(pkg) {
    const features = [];
    
    if (pkg.counters) {
      if (pkg.counters.hotels > 0) features.push('Alojamiento incluido');
      if (pkg.counters.transports > 0) features.push('Transporte incluido');
      if (pkg.counters.transfers > 0) features.push('Traslados incluidos');
      if (pkg.counters.tickets > 0) features.push('Entradas incluidas');
      if (pkg.counters.insurances > 0) features.push('Seguro incluido');
      if (pkg.counters.cruises > 0) features.push('Crucero incluido');
    }
    
    if (pkg.ribbonText) {
      features.push(pkg.ribbonText);
    }
    
    // Features por defecto si no hay específicos
    if (features.length === 0) {
      features.push('Guías especializados', 'Experiencia completa');
    }
    
    return features;
  },

  // 🔧 NUEVA: Extraer highlights
  extractHighlights(pkg) {
    const highlights = [];
    
    const duration = this.calculateDuration(pkg.itinerary, pkg.counters);
    highlights.push(`${duration.days} días / ${duration.nights} noches`);
    
    if (pkg.counters) {
      if (pkg.counters.destinations > 1) {
        highlights.push(`${pkg.counters.destinations} destinos`);
      }
      if (pkg.counters.adults > 0) {
        highlights.push(`Para ${pkg.counters.adults} personas`);
      }
    }
    
    const country = this.extractCountry(pkg);
    if (country !== 'País') {
      highlights.push(`Viaje a ${country}`);
    }
    
    return highlights;
  },

  // ======================================
  // MANTENER RESTO DE FUNCIONES EXISTENTES
  // ======================================
  
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

  // ... resto de funciones existentes (getAllPackages, getHolidayPackagesPage, etc.)
  
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
    
    console.log('🔄 Obteniendo TODOS los paquetes de Travel Compositor...');
    
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      let allPackages = [];
      let page = 1;
      let hasMore = true;
      const maxPages = 50;
      const packagesPerPage = 100;
      
      while (hasMore && page <= maxPages) {
        console.log(`📄 Obteniendo página ${page} (límite: ${packagesPerPage})...`);
        
        try {
          const holidayResult = await this.getHolidayPackagesPage(token, packagesPerPage, page);
          
          if (holidayResult.success && holidayResult.packages.length > 0) {
            allPackages.push(...holidayResult.packages);
            console.log(`✅ Página ${page}: ${holidayResult.packages.length} holiday packages obtenidos`);
            
            if (holidayResult.packages.length < packagesPerPage) {
              hasMore = false;
            }
          } else {
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
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.log(`⚠️ Error en página ${page}: ${error.message}`);
          hasMore = false;
        }
      }
      
      const uniquePackages = this.removeDuplicates(allPackages);
      
      console.log(`🎉 TOTAL OBTENIDO: ${uniquePackages.length} paquetes únicos de ${allPackages.length} totales`);
      
      // Analizar diversidad obtenida
      const countries = [...new Set(uniquePackages.map(p => p.country))].filter(c => c !== 'País');
      const categories = [...new Set(uniquePackages.map(p => p.category))].filter(c => c !== 'Viaje');
      
      console.log(`🌍 Países únicos obtenidos: ${countries.length}`);
      console.log(`🏷️ Categorías únicas obtenidas: ${categories.length}`);
      console.log(`📊 Calidad de datos: ${Math.round((countries.length + categories.length) / uniquePackages.length * 100)}%`);
      
      this.packagesCache.data = uniquePackages;
      this.packagesCache.lastUpdate = now;
      
      return {
        success: true,
        packages: uniquePackages,
        source: 'travel-compositor-full',
        total: uniquePackages.length,
        pages: page - 1,
        diversity: {
          countries: countries.length,
          categories: categories.length,
          topCountries: countries.slice(0, 5),
          topCategories: categories.slice(0, 5)
        }
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo todos los paquetes:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Testing y diagnóstico
  async tryAuthentication() {
    console.log('🔍 Probando autenticación Travel Compositor...');
    const result = await this.authenticate();
    if (result.success) {
      console.log('✅ Travel Compositor conectado y funcionando');
      
      // Probar obtener unos pocos paquetes primero
      try {
        const testResult = await this.getHolidayPackagesPage(this.authToken, 5, 1);
        if (testResult.success) {
          console.log(`✅ ${testResult.packages.length} paquetes de prueba obtenidos`);
        }
      } catch (error) {
        console.log('⚠️ Error en prueba de paquetes:', error.message);
      }
      
      // Luego obtener estadísticas generales
      try {
        const allPackages = await this.getAllPackages();
        if (allPackages.success) {
          const stats = this.getPackageStats ? this.getPackageStats(allPackages.packages) : {};
          console.log(`📊 Estadísticas: ${allPackages.packages.length} paquetes totales`);
          if (stats.byCountry) {
            console.log(`📊 Países disponibles: ${Object.keys(stats.byCountry).length}`);
            console.log(`📊 Categorías disponibles: ${Object.keys(stats.byCategory || {}).length}`);
          }
        }
      } catch (error) {
        console.log('⚠️ Error obteniendo estadísticas:', error.message);
      }
    }
    return result;
  },

  // Función para obtener estadísticas de paquetes
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

  // ... resto de funciones helper que ya existen
};

module.exports = tcConfig;