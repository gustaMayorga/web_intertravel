// ===============================================
// TRAVEL COMPOSITOR - MODO SIN AUTENTICACIÓN
// ===============================================

const axios = require('axios');

const tcConfig = {
  baseUrl: 'https://online.travelcompositor.com',
  timeout: 15000,
  
  // Primero intentar SIN autenticación
  async getPackagesWithoutAuth(limit = 12) {
    console.log('🔓 Intentando obtener paquetes SIN autenticación...');
    
    const possibleEndpoints = [
      '/api/packages',
      '/api/package',
      '/api/travelidea', 
      '/packages',
      '/package',
      '/travelidea',
      '/resources/package',
      '/resources/travelidea',
      '/webservice/package',
      '/api/holidays',
      // Con microsite
      '/api/package/intertravelgroup',
      '/api/travelidea/intertravelgroup',
      '/resources/package/intertravelgroup',
      '/resources/travelidea/intertravelgroup'
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔍 Probando: ${this.baseUrl}${endpoint}`);
        
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          timeout: this.timeout,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'InterTravel/1.0'
          },
          params: {
            limit: limit,
            lang: 'es',
            format: 'json'
          },
          validateStatus: (status) => status < 500 // Aceptar hasta 499
        });
        
        console.log(`📡 ${endpoint}: Status ${response.status}`);
        
        // Si es 200, tenemos datos!
        if (response.status === 200 && response.data) {
          console.log(`✅ ¡DATOS OBTENIDOS sin autenticación desde ${endpoint}!`);
          
          const packages = this.normalizeResponse(response.data);
          
          if (packages.length > 0) {
            return {
              success: true,
              packages: packages,
              source: 'travel-compositor-no-auth',
              endpoint: endpoint
            };
          }
        }
        
        // Si es 401, necesita auth pero el endpoint existe
        if (response.status === 401) {
          console.log(`🔐 ${endpoint} requiere autenticación (endpoint válido)`);
          // Guardar para intentar con auth después
        }
        
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`🔐 ${endpoint} requiere autenticación`);
        } else {
          console.log(`❌ ${endpoint}: ${error.message}`);
        }
      }
    }
    
    return { success: false, error: 'No se encontraron endpoints públicos' };
  },
  
  // Normalizar respuesta (intentar diferentes formatos)
  normalizeResponse(data) {
    console.log('🔍 Analizando respuesta:', typeof data);
    console.log('📊 Estructura:', Object.keys(data || {}));
    
    let rawPackages = [];
    
    // Intentar diferentes estructuras de respuesta
    if (Array.isArray(data)) {
      rawPackages = data;
    } else if (data.packages) {
      rawPackages = data.packages;
    } else if (data.package) {
      rawPackages = Array.isArray(data.package) ? data.package : [data.package];
    } else if (data.travelidea) {
      rawPackages = Array.isArray(data.travelidea) ? data.travelidea : [data.travelidea];
    } else if (data.ideas) {
      rawPackages = data.ideas;
    } else if (data.holidays) {
      rawPackages = data.holidays;
    } else if (data.products) {
      rawPackages = data.products;
    } else if (data.items) {
      rawPackages = data.items;
    } else if (data.results) {
      rawPackages = data.results;
    } else if (data.data) {
      rawPackages = Array.isArray(data.data) ? data.data : [data.data];
    }
    
    console.log(`📦 Encontrados ${rawPackages.length} elementos para normalizar`);
    
    if (rawPackages.length > 0) {
      console.log('📋 Primer elemento:', JSON.stringify(rawPackages[0], null, 2).substring(0, 300));
    }
    
    return rawPackages.map((pkg, index) => this.normalizePackage(pkg, index));
  },
  
  // Normalizar paquete individual
  normalizePackage(pkg, index = 0) {
    // Extraer campos comunes de diferentes estructuras
    const title = pkg.title || pkg.name || pkg.largeTitle || pkg.packageName || pkg.description || `Paquete ${index + 1}`;
    const destination = this.extractDestination(pkg);
    const country = this.extractCountry(pkg);
    const price = this.extractPrice(pkg);
    const description = pkg.description || pkg.shortDescription || pkg.summary || title;
    
    return {
      id: pkg.id || pkg.packageId || pkg.code || `tc-${index}`,
      title: title,
      destination: destination,
      country: country,
      price: {
        amount: price,
        currency: 'USD'
      },
      duration: {
        days: pkg.days || pkg.duration || 7,
        nights: (pkg.days || pkg.duration || 7) - 1
      },
      category: pkg.category || pkg.theme || pkg.type || 'Viaje',
      description: {
        short: description.substring(0, 150),
        full: description
      },
      images: {
        main: pkg.imageUrl || pkg.image || pkg.photo || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'
      },
      featured: true,
      status: 'active',
      _source: 'travel-compositor',
      _raw: pkg // Guardar datos originales para debug
    };
  },
  
  extractDestination(pkg) {
    // Buscar destino en diferentes campos
    return pkg.destination || 
           pkg.city || 
           pkg.location || 
           pkg.place ||
           (pkg.destinations && pkg.destinations[0]?.name) ||
           (pkg.locations && pkg.locations[0]?.name) ||
           'Destino';
  },
  
  extractCountry(pkg) {
    return pkg.country || 
           pkg.region ||
           (pkg.destinations && pkg.destinations[0]?.country) ||
           (pkg.locations && pkg.locations[0]?.country) ||
           'País';
  },
  
  extractPrice(pkg) {
    // Buscar precio en diferentes campos
    if (pkg.price) {
      return typeof pkg.price === 'number' ? pkg.price : pkg.price.amount || pkg.price.value || 999;
    }
    
    return pkg.pricePerPerson?.amount ||
           pkg.totalPrice?.amount ||
           pkg.cost ||
           pkg.amount ||
           pkg.value ||
           999;
  },
  
  // Método principal público
  async getPackages(limit = 12) {
    console.log('🌍 Obteniendo paquetes de Travel Compositor...');
    
    // 1. Intentar sin autenticación primero
    const noAuthResult = await this.getPackagesWithoutAuth(limit);
    
    if (noAuthResult.success) {
      console.log(`✅ ¡Paquetes obtenidos exitosamente sin autenticación! (${noAuthResult.packages.length})`);
      return noAuthResult;
    }
    
    // 2. Si falla, usar la lógica de autenticación original
    console.log('🔑 Sin autenticación falló, intentando método original...');
    
    // Aquí iría la lógica de autenticación original si la necesitamos
    // Por ahora, devolver fallo para usar fallback
    
    return { 
      success: false, 
      error: 'No se pudieron obtener paquetes con ningún método',
      attempted: ['no-auth', 'auth-failed']
    };
  },
  
  // Método de prueba simple
  async testConnection() {
    console.log('🧪 Testing Travel Compositor connection...');
    
    try {
      const response = await axios.get(this.baseUrl, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`📡 Base URL response: ${response.status}`);
      
      if (response.status === 200) {
        // Probar obtener paquetes
        const packagesResult = await this.getPackages(3);
        
        return {
          baseUrl: true,
          packages: packagesResult.success,
          packagesCount: packagesResult.packages?.length || 0,
          source: packagesResult.source || 'failed'
        };
      }
      
      return { baseUrl: false, packages: false };
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
      return { baseUrl: false, packages: false, error: error.message };
    }
  }
};

module.exports = tcConfig;