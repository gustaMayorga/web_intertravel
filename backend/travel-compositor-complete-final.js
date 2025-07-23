        allPackages: this.cache.all.data.length,
        detailsCache: this.cache.details.size,
        lastUpdate: {
          featured: new Date(this.cache.featured.lastUpdate).toISOString(),
          all: new Date(this.cache.all.lastUpdate).toISOString()
        }
      },
      prioritySystem: {
        totalKeywords: keywords.length,
        activeKeywords: keywords.filter(k => k.active).length,
        categories: [...new Set(keywords.map(k => k.category))],
        keywordsByCategory: keywords.reduce((acc, k) => {
          acc[k.category] = (acc[k.category] || 0) + 1;
          return acc;
        }, {})
      },
      authentication: {
        hasToken: !!this.authToken,
        tokenExpiration: this.tokenExpiration ? new Date(this.tokenExpiration).toISOString() : null,
        tokenValid: this.authToken && Date.now() < this.tokenExpiration
      },
      performance: {
        cacheHitRate: this.calculateCacheHitRate(),
        averageResponseTime: this.calculateAverageResponseTime()
      }
    };
  }

  calculateCacheHitRate() {
    // Implementación simple para estadísticas
    return this.cache.all.data.length > 0 ? 85 : 0;
  }

  calculateAverageResponseTime() {
    // Estimación basada en el estado del sistema
    return this.authToken ? 450 : 1200; // ms
  }

  // ========================================
  // MÉTODOS DE MANTENIMIENTO
  // ========================================

  async refreshAllData() {
    console.log('🔄 Iniciando actualización completa de datos...');
    
    try {
      this.clearCache();
      
      // Forzar nueva autenticación
      this.authToken = null;
      this.tokenExpiration = null;
      
      // Obtener datos frescos
      const packagesResult = await this.getAllPackages({ limit: 50, forceRefresh: true });
      const featuredResult = await this.getFeaturedPackages({ limit: 10 });
      
      console.log('✅ Actualización completa finalizada');
      
      return {
        success: true,
        message: 'Datos actualizados correctamente',
        results: {
          packages: packagesResult.packages.length,
          featured: featuredResult.packages.length,
          source: packagesResult.source
        }
      };
      
    } catch (error) {
      console.error('❌ Error en actualización completa:', error);
      return {
        success: false,
        error: 'Error actualizando datos',
        details: error.message
      };
    }
  }

  async warmUpCache() {
    console.log('🔥 Precalentando cache del sistema...');
    
    try {
      // Precargar paquetes principales
      await this.getAllPackages({ limit: 30 });
      
      // Precargar destacados
      await this.getFeaturedPackages({ limit: 10 });
      
      console.log('✅ Cache precalentado correctamente');
      return { success: true, message: 'Cache listo para uso' };
      
    } catch (error) {
      console.error('❌ Error precalentando cache:', error);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // INTEGRACIÓN CON FRONTEND
  // ========================================

  async getPackagesForHomepage() {
    console.log('🏠 Obteniendo paquetes para página principal...');
    
    try {
      // Obtener los 6 mejores paquetes destacados
      const featured = await this.getFeaturedPackages({ limit: 6 });
      
      // Asegurar que todos tengan las propiedades necesarias para el frontend
      const processedPackages = featured.packages.map(pkg => ({
        ...pkg,
        // Asegurar formato de precio para frontend
        formattedPrice: this.formatPriceForDisplay(pkg.price),
        // Asegurar formato de duración
        formattedDuration: this.formatDurationForDisplay(pkg.duration),
        // Información de contacto
        contactInfo: {
          whatsapp: process.env.WHATSAPP_NUMBER || '+5492615555558',
          email: process.env.CONTACT_EMAIL || 'reservas@intertravel.com.ar'
        },
        // Flag para indicar que tiene priorización
        isPrioritized: pkg.priorityScore > 0,
        // URL para detalles
        detailUrl: `/paquetes/${pkg.id}`
      }));
      
      return {
        success: true,
        packages: processedPackages,
        total: processedPackages.length,
        source: featured.source,
        lastUpdate: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo paquetes para homepage:', error);
      
      // Fallback para homepage
      const fallback = this.getFallbackFeaturedPackages(6);
      return {
        success: true,
        packages: fallback.packages.map(pkg => ({
          ...pkg,
          formattedPrice: this.formatPriceForDisplay(pkg.price),
          formattedDuration: this.formatDurationForDisplay(pkg.duration),
          isPrioritized: pkg.priorityScore > 0,
          detailUrl: `/paquetes/${pkg.id}`
        })),
        total: fallback.packages.length,
        source: 'fallback-homepage',
        error: error.message
      };
    }
  }

  formatPriceForDisplay(price) {
    if (!price || !price.amount) return 'Consultar';
    
    return {
      amount: price.amount,
      currency: price.currency || 'USD',
      formatted: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: price.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price.amount)
    };
  }

  formatDurationForDisplay(duration) {
    if (!duration) return '7 días';
    
    if (typeof duration === 'number') {
      return `${duration} días`;
    }
    
    if (duration.days && duration.nights) {
      return `${duration.days} días / ${duration.nights} noches`;
    }
    
    return `${duration.days || 7} días`;
  }
}

// ========================================
// EXPORTAR INSTANCIA ÚNICA
// ========================================

const enhancedTravelCompositor = new EnhancedTravelCompositor();

// Inicialización automática
(async () => {
  try {
    console.log('🚀 Inicializando Travel Compositor Enhanced...');
    
    // Precalentar cache en background
    setTimeout(async () => {
      await enhancedTravelCompositor.warmUpCache();
    }, 5000); // 5 segundos después del inicio
    
    console.log('✅ Travel Compositor Enhanced listo');
  } catch (error) {
    console.error('❌ Error inicializando Travel Compositor:', error);
  }
})();

module.exports = enhancedTravelCompositor;