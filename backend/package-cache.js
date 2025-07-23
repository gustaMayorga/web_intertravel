// ===============================================
// SISTEMA DE CACHE DE PAQUETES
// ===============================================

class PackageCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutos
    this.maxCacheSize = 1000; // Máximo 1000 paquetes en cache
  }

  // Obtener paquete del cache
  get(packageId) {
    const cached = this.cache.get(packageId);
    
    if (!cached) {
      return null;
    }
    
    // Verificar si expiró
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(packageId);
      return null;
    }
    
    // Actualizar último acceso
    cached.lastAccessed = Date.now();
    return cached.data;
  }

  // Guardar paquete en cache
  set(packageId, packageData) {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }
    
    this.cache.set(packageId, {
      data: packageData,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.cacheTimeout,
      lastAccessed: Date.now()
    });
    
    console.log(`💾 Paquete ${packageId} guardado en cache`);
  }

  // Limpiar cache de elementos expirados o menos usados
  cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por último acceso (menos recientes primero)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Eliminar elementos expirados y los más antiguos
    const toDelete = Math.max(entries.length - this.maxCacheSize + 100, 0);
    
    for (let i = 0; i < toDelete; i++) {
      this.cache.delete(entries[i][0]);
    }
    
    console.log(`🧹 Cache limpiado: ${toDelete} elementos eliminados`);
  }

  // Obtener estadísticas del cache
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    this.cache.forEach(item => {
      if (now > item.expiresAt) {
        expired++;
      } else {
        active++;
      }
    });
    
    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxCacheSize,
      timeoutMinutes: this.cacheTimeout / (60 * 1000)
    };
  }

  // Limpiar todo el cache
  clear() {
    this.cache.clear();
    console.log('🗑️ Cache completamente limpiado');
  }
}

// Instancia global del cache
const packageCache = new PackageCache();

module.exports = {
  PackageCache,
  packageCache
};
