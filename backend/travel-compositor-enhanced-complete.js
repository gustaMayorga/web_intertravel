// ===============================================
// TRAVEL COMPOSITOR COMPLETO CON SISTEMA DE PRIORIZACION
// Datos reales + Filtros inteligentes + Presentación web
// ===============================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Importar sistema de keywords
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

class EnhancedTravelCompositor {
  constructor() {
    this.baseUrl = 'https://online.travelcompositor.com/resources';
    this.authUrl = 'https://online.travelcompositor.com/resources/authentication/authenticate';
    
    this.auth = {
      username: process.env.TC_USERNAME || 'ApiUser1',
      password: process.env.TC_PASSWORD || 'Veoveo77*',
      micrositeId: process.env.TC_MICROSITE_ID || 'intertravelgroup',
    };
    
    this.timeout = 20000; // Aumentado para mejor estabilidad
    this.authToken = null;
    this.tokenExpiration = null;
    
    // Cache mejorado con múltiples categorías
    this.cache = {
      featured: { 
        data: [], 
        lastUpdate: 0, 
        duration: 10 * 60 * 1000, // 10 minutos
        maxSize: 20 
      },
      all: { 
        data: [], 
        lastUpdate: 0, 
        duration: 15 * 60 * 1000, // 15 minutos
        maxSize: 200 
      },
      details: new Map() // Cache para detalles individuales
    };
    
    console.log('🚀 Enhanced Travel Compositor inicializado');
  }

  // ========================================
  // AUTENTICACIÓN MEJORADA
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
          'Accept': 'application/json',
          'User-Agent': 'InterTravel-System/1.0'
        }
      });
      
      if (response.data && response.data.token) {
        this.authToken = response.data.token;
        const expiresIn = response.data.expirationInSeconds || 3600;
        this.tokenExpiration = Date.now() + ((expiresIn - 300) * 1000);
        
        console.log('✅ Autenticación exitosa con Travel Compositor');
        console.log(`⏰ Token válido por ${Math.floor(expiresIn / 60)} minutos`);
        
        return { success: true, token: this.authToken };
      }
      
      throw new Error('No se recibió token en la respuesta');
      
    } catch (error) {
      console.log('❌ Error autenticando con Travel Compositor:', error.message);
      
      // Información adicional para debugging
      if (error.response) {
        console.log(`HTTP Status: ${error.response.status}`);
        console.log(`Response: ${JSON.stringify(error.response.data)}`);
      }
      
      return { success: false, error: error.message };
    }
  }
  
  async getValidToken() {
    if (!this.authToken || Date.now() >= this.tokenExpiration) {
      console.log('🔄 Token expirado o no disponible, renovando...');
      const auth = await this.authenticate();
      if (!auth.success) return null;
    }
    return this.authToken;
  }

  // ========================================
  // SISTEMA DE PRIORIZACIÓN INTELIGENTE
  // ========================================
  
  applyPriorityFiltering(packages) {
    try {
      const keywords = keywordStorage.getAllKeywords().filter(k => k.active);
      console.log(`🎯 Aplicando ${keywords.length} keywords de priorización`);
      
      if (keywords.length === 0) {
        console.log('⚠️ No hay keywords activas, sin priorización');
        return packages.map(pkg => ({ ...pkg, priorityScore: 0, matchedKeywords: [] }));
      }
      
      const packagesWithPriority = packages.map(pkg => {
        let priorityScore = 0;
        let matchedKeywords = [];
        
        // Crear texto de búsqueda combinando todos los campos relevantes
        const searchText = [
          pkg.title,
          pkg.destination,
          pkg.country,
          pkg.description?.short,
          pkg.description?.full,
          pkg.category,
          ...(pkg.features || [])
        ].join(' ').toLowerCase();
        
        // Evaluar cada keyword
        keywords.forEach(keyword => {
          if (searchText.includes(keyword.keyword.toLowerCase())) {
            // Score basado en prioridad (menor número = mayor score)
            const baseScore = Math.max(1, 10 - keyword.priority);
            
            // Bonus por categoría
            let categoryBonus = 1;
            switch (keyword.category) {
              case 'destination': categoryBonus = 1.5; break;
              case 'agency': categoryBonus = 1.3; break;
              case 'premium': categoryBonus = 1.2; break;
              default: categoryBonus = 1;
            }
            
            const finalScore = baseScore * categoryBonus;
            priorityScore += finalScore;
            
            matchedKeywords.push({
              keyword: keyword.keyword,
              priority: keyword.priority,
              category: keyword.category,
              score: finalScore
            });
          }
        });
        
        return {
          ...pkg,
          priorityScore: Math.round(priorityScore * 10) / 10, // Redondear a 1 decimal
          matchedKeywords,
          isFeatured: priorityScore > 15 || pkg.featured || false
        };
      });
      
      // Ordenar por score de prioridad
      packagesWithPriority.sort((a, b) => {
        // Primero por score de prioridad
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        // Luego por rating
        const ratingA = a.rating?.average || 4.5;
        const ratingB = b.rating?.average || 4.5;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        // Finalmente por precio (menor primero)
        return (a.price?.amount || 9999) - (b.price?.amount || 9999);
      });
      
      const topScores = packagesWithPriority.slice(0, 3).map(p => p.priorityScore);
      console.log(`✅ Priorización aplicada. Top 3 scores: [${topScores.join(', ')}]`);
      
      return packagesWithPriority;
    } catch (error) {
      console.error('❌ Error en sistema de priorización:', error);
      return packages.map(pkg => ({ ...pkg, priorityScore: 0, matchedKeywords: [] }));
    }
  }

  // ========================================
  // OBTENCIÓN DE PAQUETES PRINCIPALES
  // ========================================
  
  async getAllPackages(options = {}) {
    const { page = 1, limit = 20, destination, country, forceRefresh = false } = options;
    const now = Date.now();
    
    console.log(`📦 getAllPackages - Page: ${page}, Limit: ${limit}, Destination: ${destination || 'any'}`);
    
    // Verificar cache
    if (!forceRefresh && 
        this.cache.all.data.length > 0 && 
        (now - this.cache.all.lastUpdate) < this.cache.all.duration) {
      
      console.log(`📦 Usando cache: ${this.cache.all.data.length} paquetes disponibles`);
      
      let filteredPackages = [...this.cache.all.data];
      
      // Aplicar filtros de localización
      if (destination || country) {
        filteredPackages = this.applyLocationFilters(filteredPackages, destination, country);
        console.log(`🔍 Después de filtros: ${filteredPackages.length} paquetes`);
      }
      
      // Aplicar paginación
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
      
      // Normalizar paquetes
      const normalizedPackages = rawPackages.map((pkg, index) => this.normalizePackage(pkg, index));
      console.log(`🔧 ${normalizedPackages.length} paquetes normalizados`);
      
      // Aplicar sistema de priorización
      const prioritizedPackages = this.applyPriorityFiltering(normalizedPackages);
      
      // Actualizar cache
      this.cache.all.data = prioritizedPackages.slice(0, this.cache.all.maxSize);
      this.cache.all.lastUpdate = now;
      console.log(`💾 Cache actualizado con ${this.cache.all.data.length} paquetes`);
      
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
        source: 'travel-compositor-prioritized',
        cacheUpdated: true
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
    
    // Verificar cache de destacados
    if (this.cache.featured.data.length > 0 && 
        (now - this.cache.featured.lastUpdate) < this.cache.featured.duration) {
      
      console.log(`⭐ Usando cache de destacados: ${this.cache.featured.data.length} disponibles`);
      const featured = this.cache.featured.data.slice(0, limit);
      
      return {
        packages: featured,
        total: featured.length,
        source: 'cache-featured-prioritized'
      };
    }
    
    try {
      // Obtener de la lista general (que ya tiene priorización)
      const allPackagesResult = await this.getAllPackages({ limit: 50 }); // Obtener más para elegir
      
      if (allPackagesResult.packages && allPackagesResult.packages.length > 0) {
        // Seleccionar los destacados basado en criterios
        const featured = allPackagesResult.packages
          .filter(pkg => {
            return pkg.priorityScore > 5 || // Tiene buena priorización
                   pkg.rating?.average > 4.7 || // Alta calificación
                   pkg.price?.amount > 1500; // Precio premium
          })
          .slice(0, limit);
        
        // Si no hay suficientes con filtros, tomar los primeros
        if (featured.length < limit) {
          const additional = allPackagesResult.packages
            .filter(pkg => !featured.find(f => f.id === pkg.id))
            .slice(0, limit - featured.length);
          featured.push(...additional);
        }
        
        // Actualizar cache de destacados
        this.cache.featured.data = featured;
        this.cache.featured.lastUpdate = now;
        
        console.log(`✅ ${featured.length} paquetes destacados seleccionados`);
        const scores = featured.map(p => p.priorityScore || 0);
        console.log(`📊 Scores de destacados: [${scores.join(', ')}]`);
        
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
    
    // Verificar cache de detalles
    if (this.cache.details.has(id)) {
      const cached = this.cache.details.get(id);
      if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30 minutos
        console.log(`📦 Usando cache para paquete ${id}`);
        return cached.data;
      }
    }
    
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
        const detailedPackage = this.normalizePackageDetailed(response.data.package);
        
        // Aplicar información de prioridad
        const priorityInfo = this.calculatePriorityInfo(detailedPackage);
        const fullPackage = { ...detailedPackage, ...priorityInfo };
        
        // Guardar en cache
        this.cache.details.set(id, {
          data: fullPackage,
          timestamp: Date.now()
        });
        
        console.log(`✅ Detalles obtenidos para paquete ${id}`);
        return fullPackage;
      }
      
      // Fallback: buscar en cache general
      const foundInCache = this.cache.all.data.find(pkg => pkg.id === id);
      if (foundInCache) {
        console.log(`📦 Paquete ${id} encontrado en cache general`);
        return foundInCache;
      }
      
      return this.getFallbackPackageById(id);
      
    } catch (error) {
      console.error(`❌ Error obteniendo paquete ${id}:`, error.message);
      return this.getFallbackPackageById(id);
    }
  }

  // ========================================
  // MÉTODOS DE OBTENCIÓN DE DATOS
  // ========================================
  
  async fetchPackagesFromTC(token) {
    let allPackages = [];
    const maxPages = 25; // Límite de páginas para evitar timeouts
    const packagesPerPage = 100;
    
    console.log('🔄 Iniciando obtención masiva de paquetes...');
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        // Obtener holiday packages
        const holidayPackages = await this.fetchPackagesPage(token, packagesPerPage, page, 'holiday');
        
        if (holidayPackages.length > 0) {
          allPackages.push(...holidayPackages);
          console.log(`✅ Página ${page}: ${holidayPackages.length} holiday packages`);
        }
        
        // Si obtuvimos menos del límite, probablemente es la última página
        if (holidayPackages.length < packagesPerPage) {
          console.log(`📄 Última página alcanzada en página ${page}`);
          break;
        }
        
        // Pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 250));
        
        // Límite de seguridad por tiempo
        if (allPackages.length >= 500) {
          console.log(`🛑 Límite de seguridad alcanzado: ${allPackages.length} paquetes`);
          break;
        }
        
      } catch (error) {
        console.log(`⚠️ Error en página ${page}: ${error.message}`);
        if (page <= 3) {
          // Si falla en las primeras páginas, es un error crítico
          throw error;
        }
        break; // Si falla después, continuar con lo que tenemos
      }
    }
    
    // Eliminar duplicados
    const uniquePackages = this.removeDuplicates(allPackages);
    console.log(`🎉 Total obtenido: ${uniquePackages.length} paquetes únicos`);
    
    return uniquePackages;
  }
  
  async fetchPackagesPage(token, limit, page, type = 'holiday') {
    const endpoint = type === 'holiday' ? 'package' : 'travelidea';
    
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}/${this.auth.micrositeId}`, {
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
      
      if (response.data) {
        const packages = response.data.package || response.data.idea || [];
        return Array.isArray(packages) ? packages : [];
      }
      
      return [];
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`📄 No hay más páginas disponibles para ${type}`);
        return [];
      }
      throw error;
    }
  }