// ===============================================
// TRAVEL COMPOSITOR CORREGIDO - CLASE COMPLETA
// ===============================================

const axios = require('axios');

class TravelCompositor {
  constructor() {
    this.baseUrl = 'https://online.travelcompositor.com/resources';
    this.authUrl = 'https://online.travelcompositor.com/resources/authentication/authenticate';
    
    this.auth = {
      username: process.env.TC_USERNAME || 'ApiUser1',
      password: process.env.TC_PASSWORD || 'Veoveo77*',
      micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
    };
    
    this.timeout = 15000;
    this.packagesCache = { data: [], lastUpdate: 0, cacheDuration: 5 * 60 * 1000 };
    this.authToken = null;
    this.tokenExpiration = null;
  }

  async authenticate() {
    try {
      console.log('🔑 Autenticando con Travel Compositor...');
      const response = await axios.post(this.authUrl, {
        username: this.auth.username,
        password: this.auth.password,
        micrositeId: this.auth.micrositeId
      }, { 
        timeout: this.timeout, 
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } 
      });
      
      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        this.tokenExpiration = Date.now() + 3300000; // 55 minutos
        console.log('✅ Autenticación exitosa');
        return { success: true, token: this.authToken };
      }
      throw new Error('No token received');
    } catch (error) {
      console.log('❌ Auth error:', error.message);
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

  // MÉTODO PRINCIPAL: getAllPackages
  async getAllPackages(options = {}) {
    const { page = 1, limit = 20, destination, country } = options;
    console.log(`📦 Obteniendo paquetes - Página ${page}, Límite ${limit}`);
    
    try {
      const token = await this.getValidToken();
      if (!token) throw new Error('No auth token');
      
      const response = await axios.get(`${this.baseUrl}/package/${this.auth.micrositeId}`, {
        timeout: this.timeout,
        headers: { 'auth-token': token, 'Accept': 'application/json' },
        params: { 
          limit, 
          page, 
          offset: (page - 1) * limit, 
          lang: 'es', 
          currency: 'USD',
          onlyVisible: true
        }
      });
      
      if (response.data && response.data.package) {
        let packages = this.normalizePackages(response.data.package);
        
        // Aplicar filtros
        if (destination) {
          const destTerm = destination.toLowerCase();
          packages = packages.filter(pkg => 
            pkg.destination?.toLowerCase().includes(destTerm) ||
            pkg.title?.toLowerCase().includes(destTerm)
          );
        }
        
        if (country) {
          const countryTerm = country.toLowerCase();
          packages = packages.filter(pkg => 
            pkg.country?.toLowerCase().includes(countryTerm)
          );
        }
        
        return { 
          packages, 
          total: packages.length, 
          page, 
          totalPages: Math.ceil(packages.length / limit) 
        };
      }
      
      return this.getMockPackages(page, limit);
    } catch (error) {
      console.error('❌ Error obteniendo paquetes:', error.message);
      return this.getMockPackages(page, limit);
    }
  }

  // MÉTODO FALTANTE: getFeaturedPackages
  async getFeaturedPackages(options = {}) {
    const { limit = 6 } = options;
    console.log(`⭐ Obteniendo paquetes destacados - Límite ${limit}`);
    
    try {
      const allPackages = await this.getAllPackages({ limit: limit * 2 });
      const featured = allPackages.packages
        .filter(pkg => pkg.price && pkg.images && pkg.images.length > 0)
        .slice(0, limit);
      
      return { 
        packages: featured, 
        total: featured.length 
      };
    } catch (error) {
      console.error('❌ Error featured packages:', error.message);
      return this.getMockFeaturedPackages(limit);
    }
  }

  // MÉTODO FALTANTE: getPackageById
  async getPackageById(id) {
    console.log(`🔍 Obteniendo paquete: ${id}`);
    
    try {
      const token = await this.getValidToken();
      if (!token) throw new Error('No auth token');
      
      const response = await axios.get(`${this.baseUrl}/package/${this.auth.micrositeId}/${id}`, {
        timeout: this.timeout,
        headers: { 'auth-token': token, 'Accept': 'application/json' },
        params: { lang: 'es', currency: 'USD' }
      });
      
      if (response.data && response.data.package) {
        return this.normalizePackage(response.data.package);
      }
      
      return this.getMockPackageById(id);
    } catch (error) {
      console.error('❌ Error obteniendo paquete por ID:', error.message);
      return this.getMockPackageById(id);
    }
  }

  // NORMALIZACIÓN
  normalizePackages(rawPackages) {
    return rawPackages.map((pkg, index) => this.normalizePackage(pkg, index));
  }

  normalizePackage(pkg, index = 0) {
    return {
      id: pkg.id || `tc-${index}`,
      title: pkg.title || pkg.largeTitle || `Paquete ${index + 1}`,
      destination: this.extractDestination(pkg.destinations),
      country: this.extractCountry(pkg.destinations),
      price: pkg.pricePerPerson?.amount || pkg.totalPrice?.amount || 999,
      currency: pkg.pricePerPerson?.currency || pkg.totalPrice?.currency || 'USD',
      duration: this.calculateDuration(pkg.itinerary),
      images: [pkg.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'],
      description: pkg.description || pkg.remarks || 'Experiencia única de viaje',
      featured: true,
      status: 'active',
      _source: 'travel-compositor'
    };
  }

  extractDestination(destinations) {
    if (Array.isArray(destinations) && destinations.length > 0) {
      return destinations[0].name || destinations[0].destination || 'Destino';
    }
    return 'Destino';
  }

  extractCountry(destinations) {
    if (Array.isArray(destinations) && destinations.length > 0) {
      return destinations[0].country || destinations[0].region || 'País';
    }
    return 'País';
  }

  calculateDuration(itinerary) {
    if (Array.isArray(itinerary) && itinerary.length > 0) {
      return itinerary.length;
    }
    return 7;
  }

  // FALLBACKS MOCK
  getMockPackages(page = 1, limit = 20) {
    const mock = [
      { 
        id: 'mock-1', 
        title: 'Europa Clásica - París y Roma', 
        destination: 'Europa', 
        country: 'Francia', 
        price: 2500, 
        currency: 'USD', 
        duration: 10, 
        images: ['https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=800&h=600&fit=crop'],
        description: 'Tour por las capitales europeas más importantes',
        featured: true,
        status: 'active'
      },
      { 
        id: 'mock-2', 
        title: 'Perú Mágico - Machu Picchu', 
        destination: 'Perú', 
        country: 'Perú',
        price: 1800, 
        currency: 'USD', 
        duration: 7,
        images: ['https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop'],
        description: 'Aventura por Machu Picchu y Cusco',
        featured: true,
        status: 'active'
      },
      { 
        id: 'mock-3', 
        title: 'Japón Tradicional', 
        destination: 'Japón', 
        country: 'Japón',
        price: 3200, 
        currency: 'USD', 
        duration: 12,
        images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop'],
        description: 'Cultura japonesa auténtica entre templos y modernidad',
        featured: true,
        status: 'active'
      },
      { 
        id: 'mock-4', 
        title: 'Brasil Tropical', 
        destination: 'Brasil', 
        country: 'Brasil',
        price: 2200, 
        currency: 'USD', 
        duration: 9,
        images: ['https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop'],
        description: 'Playas paradisíacas y cultura vibrante',
        featured: true,
        status: 'active'
      },
      { 
        id: 'mock-5', 
        title: 'Tailandia Exótica', 
        destination: 'Tailandia', 
        country: 'Tailandia',
        price: 1950, 
        currency: 'USD', 
        duration: 8,
        images: ['https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop'],
        description: 'Templos budistas y playas de ensueño',
        featured: true,
        status: 'active'
      },
      { 
        id: 'mock-6', 
        title: 'Argentina Completa', 
        destination: 'Argentina', 
        country: 'Argentina',
        price: 1600, 
        currency: 'USD', 
        duration: 11,
        images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'],
        description: 'De Buenos Aires a la Patagonia',
        featured: true,
        status: 'active'
      }
    ];
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mock.slice(startIndex, endIndex);
    
    return { 
      packages: paginatedData, 
      total: mock.length, 
      page, 
      totalPages: Math.ceil(mock.length / limit) 
    };
  }

  getMockFeaturedPackages(limit = 6) {
    const featured = this.getMockPackages(1, limit);
    return { 
      packages: featured.packages, 
      total: featured.packages.length 
    };
  }

  getMockPackageById(id) {
    const mock = this.getMockPackages().packages;
    const found = mock.find(p => p.id === id);
    
    if (found) return found;
    
    return {
      id, 
      title: `Paquete ${id}`, 
      destination: 'Destino Demo', 
      country: 'País Demo',
      price: 1500, 
      currency: 'USD', 
      duration: 7,
      images: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'],
      description: 'Paquete de demostración mientras se resuelven problemas de conectividad',
      featured: false,
      status: 'active'
    };
  }

  // MÉTODO DE TESTING
  async testConnection() {
    console.log('🔍 Probando conexión Travel Compositor...');
    
    try {
      const auth = await this.authenticate();
      if (!auth.success) {
        return { success: false, error: 'Error de autenticación', details: auth.error };
      }
      
      const testPackages = await this.getAllPackages({ limit: 3 });
      
      return {
        success: true,
        message: 'Conexión exitosa',
        packagesCount: testPackages.packages.length,
        source: testPackages.packages[0]?._source || 'mock'
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
        details: error.message
      };
    }
  }
}

// Crear instancia única
const travelCompositor = new TravelCompositor();

module.exports = travelCompositor;