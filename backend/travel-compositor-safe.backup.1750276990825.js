// ======================================
// TRAVEL COMPOSITOR - CONFIGURACIÓN CORREGIDA CON SWAGGER
// ======================================

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
  
  timeout: 15000, // Aumentado para dar más tiempo
  
  // Token de autenticación (se actualiza automáticamente)
  authToken: null,
  tokenExpiration: null,
  
  // AUTENTICACIÓN CORREGIDA según Swagger
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
        // Calcular expiración (restar 5 min por seguridad)
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
  
  // Obtener token válido (renueva si es necesario)
  async getValidToken() {
    if (!this.isTokenValid()) {
      const auth = await this.authenticate();
      if (!auth.success) {
        return null;
      }
    }
    return this.authToken;
  },
  
  // OBTENER IDEAS DE VIAJE (con paginación)
  async getTravelIdeas(limit = 50, page = 1) {
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      console.log(`🔍 Obteniendo ideas de viaje - Página ${page}, Límite: ${limit}`);
      
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
        console.log(`✅ ${response.data.idea.length} ideas obtenidas de TC (página ${page})`);
        return {
          success: true,
          packages: this.normalizeIdeas(response.data.idea),
          source: 'travel-compositor'
        };
      }
      
      throw new Error('No se recibieron ideas en la respuesta');
      
    } catch (error) {
      console.log(`⚠️ Error obteniendo ideas de TC (página ${page}): ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  // OBTENER HOLIDAY PACKAGES (con paginación)
  async getHolidayPackages(limit = 50, page = 1) {
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      console.log(`🔍 Obteniendo holiday packages - Página ${page}, Límite: ${limit}`);
      
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
        console.log(`✅ ${response.data.package.length} packages obtenidos de TC (página ${page})`);
        return {
          success: true,
          packages: this.normalizePackages(response.data.package),
          source: 'travel-compositor'
        };
      }
      
      throw new Error('No se recibieron packages en la respuesta');
      
    } catch (error) {
      console.log(`⚠️ Error obteniendo packages de TC (página ${page}): ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  // MÉTODO PRINCIPAL (intenta ambos tipos y obtiene MÁS paquetes)
  async getPackages(limit = 100) { // Aumentar límite por defecto
    console.log(`📦 Obteniendo paquetes de TC con límite: ${limit}`);
    
    // Primero intentar holiday packages con límite más alto
    let result = await this.getHolidayPackages(limit);
    if (result.success && result.packages.length > 0) {
      console.log(`✅ Holiday packages obtenidos: ${result.packages.length}`);
      return result;
    }
    
    // Si no hay packages, intentar ideas de viaje con límite más alto
    result = await this.getTravelIdeas(limit);
    if (result.success && result.packages.length > 0) {
      console.log(`✅ Travel ideas obtenidas: ${result.packages.length}`);
      return result;
    }
    
    // Intentar múltiples llamadas para obtener más paquetes
    console.log('🔄 Intentando obtener más paquetes con múltiples llamadas...');
    const allPackages = [];
    
    // Hacer múltiples llamadas con diferentes parámetros
    for (let page = 1; page <= 5; page++) {
      try {
        const pageResult = await this.getHolidayPackages(50, page);
        if (pageResult.success && pageResult.packages.length > 0) {
          allPackages.push(...pageResult.packages);
        }
      } catch (error) {
        console.log(`⚠️ Error en página ${page}:`, error.message);
      }
    }
    
    if (allPackages.length > 0) {
      console.log(`✅ Total de paquetes obtenidos con múltiples llamadas: ${allPackages.length}`);
      return {
        success: true,
        packages: allPackages,
        source: 'travel-compositor-multi'
      };
    }
    
    // Si nada funciona, devolver error
    return { success: false, error: 'No se pudieron obtener paquetes de ningún endpoint' };
  },
  
  // BÚSQUEDA (usando filtros según Swagger)
  async searchPackages(params) {
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      const searchParams = {
        lang: 'es',
        currency: 'USD',
        limit: params.limit || 12,
        onlyVisible: true
      };
      
      // Agregar filtros si están disponibles
      if (params.destination) {
        searchParams.destinations = params.destination;
      }
      
      // Buscar en packages
      const response = await axios.get(`${this.baseUrl}/package/${this.auth.micrositeId}`, {
        timeout: this.timeout,
        headers: {
          'auth-token': token,
          'Accept': 'application/json'
        },
        params: searchParams
      });
      
      if (response.data && response.data.package) {
        return {
          success: true,
          packages: this.normalizePackages(response.data.package),
          source: 'travel-compositor'
        };
      }
      
      return { success: false, error: 'No se encontraron resultados' };
      
    } catch (error) {
      console.log(`⚠️ Error en búsqueda TC: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
  // DETALLE DE PAQUETE (según Swagger)
  async getPackageDetails(packageId) {
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No se pudo obtener token de autenticación');
      }
      
      console.log(`📦 Obteniendo detalles del paquete: ${packageId}`);
      
      // Intentar como holiday package
      try {
        const response = await axios.get(`${this.baseUrl}/package/${this.auth.micrositeId}/info/${packageId}`, {
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
        
        if (response.data) {
          return {
            success: true,
            package: this.normalizePackage(response.data),
            source: 'travel-compositor'
          };
        }
      } catch (error) {
        console.log('Package endpoint falló, intentando idea endpoint...');
      }
      
      // Intentar como travel idea
      const response = await axios.get(`${this.baseUrl}/travelidea/${this.auth.micrositeId}/info/${packageId}`, {
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
      
      if (response.data) {
        return {
          success: true,
          package: this.normalizeIdea(response.data),
          source: 'travel-compositor'
        };
      }
      
      throw new Error('No se encontró el paquete');
      
    } catch (error) {
      console.log(`⚠️ Error obteniendo detalles de ${packageId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  },
  
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
  
  // Testing de conectividad
  async tryAuthentication() {
    console.log('🔍 Probando autenticación Travel Compositor...');
    const result = await this.authenticate();
    if (result.success) {
      console.log('✅ Travel Compositor conectado y funcionando');
      // Probar obtener algunos paquetes
      const packages = await this.getPackages(3);
      if (packages.success) {
        console.log(`✅ ${packages.packages.length} paquetes obtenidos exitosamente`);
      }
    }
    return result;
  }
};

module.exports = tcConfig;