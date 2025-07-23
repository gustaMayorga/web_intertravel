// ===============================================
// TRAVEL COMPOSITOR RÁPIDO - VERSIÓN CORREGIDA
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
      console.log(`🔧 Usuario: ${this.auth.username}`);
      console.log(`🔧 Microsite: ${this.auth.micrositeId}`);
      
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
        console.log(`🔑 Token obtenido (expira en ${Math.round(expiresIn/60)} minutos)`);
        return { success: true, token: this.authToken };
      }
      
      throw new Error('No se recibió token en la respuesta');
      
    } catch (error) {
      console.log('❌ Error autenticando con Travel Compositor:', error.message);
      
      if (error.response) {
        console.log(`❌ Status: ${error.response.status}`);
        console.log(`❌ Data:`, error.response.data);
      }
      
      return { success: false, error: error.message };
    }
  },

  isTokenValid() {
    return this.authToken && this.tokenExpiration && Date.now() < this.tokenExpiration;
  },

  async getValidToken() {
    if (!this.isTokenValid()) {
      console.log('🔄 Token inválido o expirado, reautenticando...');
      const auth = await this.authenticate();
      if (!auth.success) {
        return null;
      }
    }
    return this.authToken;
  },

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
    
    console.log('⚡ Obteniendo TODOS los paquetes de Travel Compositor...');
    
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      let allPackages = [];
      const maxPages = 10;
      const packagesPerPage = 100;
      
      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Obteniendo página ${page}/${maxPages}...`);
        
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
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.log(`⚠️ Error en página ${page}: ${error.message}`);
          break;
        }
      }
      
      const uniquePackages = this.removeDuplicates(allPackages);
      
      console.log(`🎉 TOTAL OBTENIDO: ${uniquePackages.length} paquetes únicos`);
      
      // Analizar diversidad obtenida
      const countries = [...new Set(uniquePackages.map(p => p.country))].filter(c => c && c !== 'País');
      const categories = [...new Set(uniquePackages.map(p => p.category))].filter(c => c && c !== 'Viaje');
      
      console.log(`🌍 Países únicos: ${countries.length}`);
      console.log(`🏷️ Categorías únicas: ${categories.length}`);
      
      this.packagesCache.data = uniquePackages;
      this.packagesCache.lastUpdate = now;
      
      return {
        success: true,
        packages: uniquePackages,
        source: 'travel-compositor',
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
      console.error('❌ Error obteniendo paquetes:', error.message);
      return { success: false, error: error.message };
    }
  },

  async getPackages(limit = 100) {
    console.log(`📦 getPackages llamado con límite: ${limit}`);
    
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
        source: 'travel-compositor',
        total: packages.length
      };
      
    } catch (error) {
      console.log('⚠️ Error en getPackages:', error.message);
      return { success: false, error: error.message };
    }
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
        console.log('Raw TC package data example:', response.data.package[0]); // Log first package for inspection
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

  normalizePackage(pkg, index = 0) {
    const country = this.extractCountry(pkg);
    const destination = this.extractDestination(pkg);
    const category = this.extractCategory(pkg);
    const duration = this.calculateDuration(pkg);
    
    // Limpiar HTML de descripciones y servicios
    const shortDescription = this.stripHtml(pkg.description || `Descubre ${destination} en una experiencia única`);
    const fullDescription = this.stripHtml(pkg.description || `Paquete completo para conocer ${destination}.`);
    
    const includedServices = pkg.includedServices ? pkg.includedServices.split('</li><li>').map(item => this.stripHtml(item.replace(/<ul[^>]*>|<\/ul>|<li[^>]*>/g, ''))).filter(Boolean) : [];
    const nonIncludedServices = pkg.nonIncludedServices ? pkg.nonIncludedServices.split('</li><li>').map(item => this.stripHtml(item.replace(/<ul[^>]*>|<\/ul>|<li[^>]*>/g, ''))).filter(Boolean) : [];

    return {
      id: pkg.id || `tc-package-${index}`,
      title: pkg.name || pkg.title || pkg.largeTitle || `Holiday Package ${index + 1}`,
      destination: destination,
      country: country,
      price: {
        amount: pkg.pricePerPerson?.amount || pkg.totalPrice?.amount || 999,
        currency: pkg.pricePerPerson?.currency || pkg.totalPrice?.currency || 'USD'
      },
      duration: duration,
      category: category,
      description: {
        short: shortDescription,
        full: fullDescription
      },
      images: {
        main: pkg.imageUrl || (pkg.imageUrls && pkg.imageUrls.length > 0 ? pkg.imageUrls[0] : '/placeholder-image.jpg'),
        gallery: pkg.imageUrls || (pkg.imageUrl ? [pkg.imageUrl] : [])
      },
      rating: { 
        average: Number((4.0 + Math.random() * 1).toFixed(1)), 
        count: 50 + Math.floor(Math.random() * 200) 
      },
      features: ['Alojamiento incluido', 'Guías especializados', 'Traslados incluidos'], // Valores por defecto
      highlights: [`${duration.days} días`, `Viaje a ${country}`], // Valores por defecto
      itinerary: pkg.itinerary || [], // Mapear itinerario directamente
      included: includedServices,
      notIncluded: nonIncludedServices,
      booking: {
        available: true,
        minAdvanceBooking: 7,
        maxGroupSize: 15,
        confirmationTime: '24-48 horas',
        cancellationPolicy: 'Cancelación gratuita hasta 7 días antes'
      },
      contact: {
        whatsapp: '5492611234567',
        whatsappUrl: `https://wa.me/5492611234567?text=Hola, me interesa el paquete ${encodeURIComponent(pkg.name || pkg.title || '')}`,
        email: 'reservas@intertravel.com.ar',
        phone: '+54 261 123-4567'
      },
      featured: Math.random() > 0.7,
      status: 'active',
      availability: 'available',
      _source: 'travel-compositor',
      provider: pkg.supplierName || 'Travel Compositor',
      _type: 'holiday-package'
    };
  },

  extractCountry(pkg) {
    // 1. Desde externalReference
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
      if (ref.includes('REINO UNIDO') || ref.includes('UK')) return 'Reino Unido';
      if (ref.includes('ESTADOS UNIDOS') || ref.includes('USA')) return 'Estados Unidos';
      if (ref.includes('JAPON') || ref.includes('JAPAN')) return 'Japón';
    }
    
    // 2. Desde destinations
    if (Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      const destName = (pkg.destinations[0].name || '').toLowerCase();
      if (destName.includes('lima') || destName.includes('cusco') || destName.includes('machu')) return 'Perú';
      if (destName.includes('buenos aires') || destName.includes('mendoza')) return 'Argentina';
      if (destName.includes('rio') || destName.includes('são paulo') || destName.includes('salvador')) return 'Brasil';
      if (destName.includes('santiago') || destName.includes('valparaiso')) return 'Chile';
      if (destName.includes('bogotá') || destName.includes('cartagena')) return 'Colombia';
      if (destName.includes('cancun') || destName.includes('ciudad de mexico')) return 'México';
      if (destName.includes('madrid') || destName.includes('barcelona')) return 'España';
      if (destName.includes('paris') || destName.includes('lyon')) return 'Francia';
      if (destName.includes('roma') || destName.includes('milan')) return 'Italia';
      if (destName.includes('londres') || destName.includes('london')) return 'Reino Unido';
      if (destName.includes('nueva york') || destName.includes('new york')) return 'Estados Unidos';
      if (destName.includes('tokio') || destName.includes('tokyo')) return 'Japón';
    }
    
    // 3. Desde el título del paquete
    if (pkg.title) {
      const title = pkg.title.toLowerCase();
      if (title.includes('peru') || title.includes('perú') || title.includes('machu')) return 'Perú';
      if (title.includes('argentina') || title.includes('buenos aires')) return 'Argentina';
      if (title.includes('brasil') || title.includes('brazil') || title.includes('rio')) return 'Brasil';
      if (title.includes('chile') || title.includes('santiago')) return 'Chile';
      if (title.includes('colombia')) return 'Colombia';
      if (title.includes('mexico') || title.includes('méxico') || title.includes('cancun')) return 'México';
      if (title.includes('españa') || title.includes('spain') || title.includes('madrid')) return 'España';
      if (title.includes('francia') || title.includes('france') || title.includes('paris')) return 'Francia';
      if (title.includes('italia') || title.includes('italy') || title.includes('roma')) return 'Italia';
      if (title.includes('reino unido') || title.includes('uk') || title.includes('londres')) return 'Reino Unido';
      if (title.includes('estados unidos') || title.includes('usa') || title.includes('nueva york')) return 'Estados Unidos';
      if (title.includes('japon') || title.includes('japón') || title.includes('tokyo')) return 'Japón';
    }
    
    return 'Destino Internacional';
  },

  extractDestination(pkg) {
    if (Array.isArray(pkg.destinations) && pkg.destinations.length > 0) {
      return pkg.destinations[0].name || 'Destino';
    }
    
    // Extraer desde el título si no hay destinations
    if (pkg.title) {
      const title = pkg.title;
      const destinationPatterns = [
        'Lima', 'Cusco', 'Machu Picchu',
        'Buenos Aires', 'Mendoza', 'Córdoba',
        'Río de Janeiro', 'São Paulo', 'Salvador',
        'Santiago', 'Valparaíso',
        'Bogotá', 'Cartagena',
        'Cancún', 'Ciudad de México',
        'Madrid', 'Barcelona',
        'París', 'Lyon',
        'Roma', 'Milán',
        'Londres', 'Edimburgo',
        'Nueva York', 'Los Ángeles',
        'Tokio', 'Osaka'
      ];
      
      for (const pattern of destinationPatterns) {
        if (title.includes(pattern)) {
          return pattern;
        }
      }
    }
    
    return 'Destino';
  },

  extractCategory(pkg) {
    if (pkg.ribbonText && pkg.ribbonText !== 'Solo Terrestre') {
      return pkg.ribbonText;
    }
    
    const title = (pkg.title || '').toLowerCase();
    const description = (pkg.description || '').toLowerCase();
    const combined = title + ' ' + description;
    
    if (combined.includes('aventura') || combined.includes('trekking') || combined.includes('montaña')) return 'Aventura';
    if (combined.includes('cultural') || combined.includes('cultura') || combined.includes('museo') || combined.includes('histórico')) return 'Cultural';
    if (combined.includes('playa') || combined.includes('costa') || combined.includes('mar') || combined.includes('resort')) return 'Playa';
    if (combined.includes('ciudad') || combined.includes('urbano') || combined.includes('metrópoli')) return 'Ciudad';
    if (combined.includes('romance') || combined.includes('romántico') || combined.includes('luna de miel')) return 'Romance';
    if (combined.includes('familia') || combined.includes('niños') || combined.includes('familiar')) return 'Familiar';
    if (combined.includes('lujo') || combined.includes('premium') || combined.includes('exclusivo')) return 'Lujo';
    if (combined.includes('gastronómico') || combined.includes('culinario') || combined.includes('cocina')) return 'Gastronomía';
    if (combined.includes('naturaleza') || combined.includes('parque') || combined.includes('reserva')) return 'Naturaleza';
    if (combined.includes('relax') || combined.includes('spa') || combined.includes('wellness')) return 'Relax';
    
    return 'Viaje';
  },

  calculateDuration(pkg) {
    if (pkg.counters && pkg.counters.hotelNights) {
      return {
        days: pkg.counters.hotelNights + 1,
        nights: pkg.counters.hotelNights
      };
    }
    
    // Intentar extraer desde el título
    if (pkg.title) {
      const title = pkg.title.toLowerCase();
      const daysMatch = title.match(/(\d+)\s*días?/);
      const nightsMatch = title.match(/(\d+)\s*noches?/);
      
      if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        return { days: days, nights: days - 1 };
      }
      
      if (nightsMatch) {
        const nights = parseInt(nightsMatch[1]);
        return { days: nights + 1, nights: nights };
      }
    }
    
    // Duración por defecto
    return { days: 7, nights: 6 };
  },

  removeDuplicates(packages) {
    const seen = new Set();
    return packages.filter(pkg => {
      // Usar combinación de ID y título para evitar duplicados
      const key = `${pkg.id}-${pkg.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  // Helper para limpiar HTML de strings
  stripHtml(htmlString) {
    if (!htmlString) return '';
    return htmlString.replace(/<[^>]*>?/gm, '');
  },

  async searchPackages(searchParams) {
    console.log(`🔍 Buscando: "${searchParams.search}"`);
    
    try {
      // Primero obtener todos los paquetes
      const allPackages = await this.getAllPackages();
      
      if (!allPackages.success) {
        return { success: false, packages: [], error: 'No se pudieron obtener paquetes' };
      }
      
      const searchTerm = searchParams.search.toLowerCase();
      
      // Filtrar localmente con criterios amplios
      const filtered = allPackages.packages.filter(pkg => {
        return pkg.title?.toLowerCase().includes(searchTerm) ||
               pkg.destination?.toLowerCase().includes(searchTerm) ||
               pkg.country?.toLowerCase().includes(searchTerm) ||
               pkg.category?.toLowerCase().includes(searchTerm) ||
               pkg.description?.short?.toLowerCase().includes(searchTerm) ||
               pkg.description?.full?.toLowerCase().includes(searchTerm);
      });
      
      console.log(`🔍 ${filtered.length} paquetes encontrados para "${searchParams.search}"`);
      
      return {
        success: true,
        packages: filtered,
        source: 'travel-compositor-search',
        searchTerm: searchParams.search,
        totalFound: filtered.length
      };
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error.message);
      return {
        success: false,
        packages: [],
        error: error.message
      };
    }
  },

  async getPackageDetails(packageId) {
    console.log(`[TC-DETAILS] INICIO: Solicitando detalles para packageId: ${packageId}`);
    try {
      const token = await this.getValidToken();
      if (!token) {
        console.error(`[TC-DETAILS] ERROR: No se pudo obtener token para ${packageId}`);
        throw new Error('No se pudo obtener token de autenticación');
      }
      console.log(`[TC-DETAILS] Token obtenido para ${packageId}.`);
      
      const url = `${this.baseUrl}/package/${this.auth.micrositeId}/${packageId}`;
      console.log(`[TC-DETAILS] Realizando GET a: ${url}`);
      
      const response = await axios.get(url, {
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
      
      console.log(`[TC-DETAILS] Respuesta de API para ${packageId}:`, response.data);
      
      if (response.data) {
        let foundPackage = null;
        // Lógica de búsqueda mejorada y más flexible
        if (response.data.package) {
          console.log('[TC-DETAILS] Paquete encontrado en response.data.package');
          foundPackage = response.data.package;
        } else if (response.data.closedTours && response.data.closedTours.length > 0) {
          console.log('[TC-DETAILS] Paquete encontrado en closedTours');
          foundPackage = response.data.closedTours[0];
        } else if (response.data.transports && response.data.transports.length > 0) {
          console.log('[TC-DETAILS] Paquete encontrado en transports');
          foundPackage = response.data.transports[0];
        } else if (response.data.hotels && response.data.hotels.length > 0) {
          console.log('[TC-DETAILS] Paquete encontrado en hotels');
          foundPackage = response.data.hotels[0];
        } else if (Object.keys(response.data).length > 0) {
          console.log('[TC-DETAILS] Usando response.data como fallback');
          foundPackage = response.data; // Fallback: usar el objeto raíz si no se encuentra en las propiedades esperadas
        }

        if (foundPackage) {
          console.log(`[TC-DETAILS] ÉXITO: Detalles obtenidos y normalizados para ${packageId}`);
          return {
            success: true,
            package: this.normalizePackage(foundPackage),
            source: 'travel-compositor-details'
          };
        }
      }
      
      console.log(`[TC-DETAILS] FALLO: Paquete ${packageId} no encontrado en la respuesta de TC.`);
      return { success: false, error: 'Paquete no encontrado' };
      
    } catch (error) {
      console.error(`[TC-DETAILS] ❌ ERROR GENERAL obteniendo detalles del paquete ${packageId}:`, error.message);
      if (error.response) {
        console.error(`[TC-DETAILS] Status: ${error.response.status}`);
        console.error(`[TC-DETAILS] Data:`, error.response.data);
      }
      return { success: false, error: error.message };
    }
  },

  async tryAuthentication() {
    console.log('🔍 Probando autenticación Travel Compositor...');
    const result = await this.authenticate();
    if (result.success) {
      console.log('✅ Travel Compositor conectado y funcionando');
      
      // Prueba rápida con algunos paquetes
      try {
        const testResult = await this.getPackages(5);
        if (testResult.success) {
          console.log(`✅ ${testResult.packages.length} paquetes de prueba obtenidos`);
          console.log(`📦 Sistema listo para obtener hasta ${testResult.total || 'muchos'} paquetes`);
        }
      } catch (error) {
        console.log('⚠️ Error en prueba:', error.message);
      }
    }
    return result;
  }
};

module.exports = tcConfig;