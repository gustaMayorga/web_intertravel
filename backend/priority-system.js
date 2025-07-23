// ===============================================
// SISTEMA DE PRIORIZACIÓN FUNCIONAL COMPLETO
// ===============================================

const fs = require('fs');
const path = require('path');

class PrioritySystem {
  constructor() {
    this.keywords = [];
    this.keywordsPath = path.join(__dirname, 'data/priority-keywords.json');
    this.loadKeywords();
  }

  // Cargar keywords desde archivo o BD
  loadKeywords() {
    try {
      if (fs.existsSync(this.keywordsPath)) {
        const keywordsData = fs.readFileSync(this.keywordsPath, 'utf8');
        this.keywords = JSON.parse(keywordsData).filter(k => k.active);
        console.log(`🔑 ${this.keywords.length} keywords activas cargadas para priorización`);
      } else {
        console.log('⚠️ Archivo de keywords no encontrado, creando keywords básicas');
        this.createDefaultKeywords();
      }
    } catch (error) {
      console.error('❌ Error cargando keywords:', error.message);
      this.createDefaultKeywords();
    }
  }

  // Crear keywords por defecto si no existen
  createDefaultKeywords() {
    this.keywords = [
      { id: 1, keyword: 'perú', priority: 1, category: 'destination', active: true },
      { id: 2, keyword: 'charter', priority: 1, category: 'transport', active: true },
      { id: 3, keyword: 'premium', priority: 2, category: 'category', active: true },
      { id: 4, keyword: 'intertravel', priority: 1, category: 'agency', active: true }
    ];
    
    // Guardar keywords por defecto
    try {
      const dataDir = path.dirname(this.keywordsPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.keywordsPath, JSON.stringify(this.keywords, null, 2));
      console.log('✅ Keywords por defecto creadas y guardadas');
    } catch (error) {
      console.error('❌ Error guardando keywords por defecto:', error.message);
    }
  }

  // Aplicar priorización a paquetes
  applyPrioritySystem(packages) {
    if (!packages || packages.length === 0) {
      return [];
    }

    // Aplicar scoring de prioridad a cada paquete
    const prioritizedPackages = packages.map(pkg => {
      let priorityScore = 0;
      let matchedKeywords = [];

      // Buscar coincidencias en keywords
      this.keywords.forEach(keyword => {
        const keywordLower = keyword.keyword.toLowerCase();
        const searchableText = [
          pkg.title || '',
          pkg.destination || '',
          pkg.description || '',
          pkg.category || '',
          pkg.features ? pkg.features.join(' ') : ''
        ].join(' ').toLowerCase();

        if (searchableText.includes(keywordLower)) {
          // Score basado en prioridad (menor número = mayor prioridad)
          const score = (10 - keyword.priority) * 2;
          priorityScore += score;
          matchedKeywords.push({
            keyword: keyword.keyword,
            category: keyword.category,
            priority: keyword.priority,
            score: score
          });
        }
      });

      return {
        ...pkg,
        priorityScore,
        matchedKeywords,
        isPrioritized: priorityScore > 0
      };
    });

    // Ordenar por score de prioridad (mayor score primero)
    const sorted = prioritizedPackages.sort((a, b) => {
      if (a.priorityScore === b.priorityScore) {
        // Si mismo score, ordenar por rating o fecha
        return (b.rating || 0) - (a.rating || 0);
      }
      return b.priorityScore - a.priorityScore;
    });

    console.log(`🎯 Priorización aplicada: ${sorted.filter(p => p.isPrioritized).length}/${sorted.length} paquetes priorizados`);
    return sorted;
  }

  // Buscar con priorización
  searchWithPriority(packages, searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
      return this.applyPrioritySystem(packages);
    }

    const query = searchQuery.toLowerCase();
    
    // Filtrar paquetes que coincidan con la búsqueda
    const filtered = packages.filter(pkg => {
      const searchableText = [
        pkg.title || '',
        pkg.destination || '',
        pkg.description || '',
        pkg.category || ''
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query);
    });

    // Aplicar priorización a los resultados filtrados
    const prioritized = this.applyPrioritySystem(filtered);

    // Boost adicional si coincide con keywords de alta prioridad
    const boosted = prioritized.map(pkg => {
      const highPriorityKeywords = this.keywords.filter(k => k.priority === 1);
      let searchBoost = 0;

      highPriorityKeywords.forEach(keyword => {
        if (query.includes(keyword.keyword.toLowerCase())) {
          searchBoost += 20; // Boost significativo para keywords priority 1
        }
      });

      return {
        ...pkg,
        priorityScore: pkg.priorityScore + searchBoost,
        searchBoost
      };
    });

    // Re-ordenar con el boost de búsqueda
    return boosted.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Obtener keywords activas
  getActiveKeywords() {
    return this.keywords.filter(k => k.active);
  }

  // Obtener estadísticas de keywords
  getKeywordStats(packages) {
    const stats = {};
    
    this.keywords.forEach(keyword => {
      const matches = packages.filter(pkg => {
        const searchableText = [
          pkg.title || '',
          pkg.destination || '',
          pkg.description || ''
        ].join(' ').toLowerCase();
        
        return searchableText.includes(keyword.keyword.toLowerCase());
      });

      stats[keyword.keyword] = {
        ...keyword,
        matchCount: matches.length,
        matchPercentage: packages.length > 0 ? (matches.length / packages.length * 100).toFixed(1) : 0
      };
    });

    return stats;
  }

  // Recargar keywords (útil para admin)
  reloadKeywords() {
    this.loadKeywords();
    return this.keywords;
  }

  // Agregar nueva keyword
  addKeyword(keyword) {
    try {
      const newKeyword = {
        id: Date.now(),
        keyword: keyword.keyword.toLowerCase(),
        priority: keyword.priority || 5,
        category: keyword.category || 'general',
        description: keyword.description || '',
        active: keyword.active !== false,
        created_at: new Date().toISOString()
      };

      this.keywords.push(newKeyword);
      this.saveKeywords();
      
      console.log(`✅ Keyword agregada: ${newKeyword.keyword}`);
      return newKeyword;
    } catch (error) {
      console.error('❌ Error agregando keyword:', error.message);
      throw error;
    }
  }

  // Actualizar keyword
  updateKeyword(id, updates) {
    try {
      const index = this.keywords.findIndex(k => k.id === id);
      if (index === -1) {
        throw new Error(`Keyword con ID ${id} no encontrada`);
      }

      this.keywords[index] = {
        ...this.keywords[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      this.saveKeywords();
      console.log(`✅ Keyword actualizada: ${this.keywords[index].keyword}`);
      return this.keywords[index];
    } catch (error) {
      console.error('❌ Error actualizando keyword:', error.message);
      throw error;
    }
  }

  // Eliminar keyword
  deleteKeyword(id) {
    try {
      const index = this.keywords.findIndex(k => k.id === id);
      if (index === -1) {
        throw new Error(`Keyword con ID ${id} no encontrada`);
      }

      const deleted = this.keywords.splice(index, 1)[0];
      this.saveKeywords();
      
      console.log(`✅ Keyword eliminada: ${deleted.keyword}`);
      return deleted;
    } catch (error) {
      console.error('❌ Error eliminando keyword:', error.message);
      throw error;
    }
  }

  // Guardar keywords en archivo
  saveKeywords() {
    try {
      fs.writeFileSync(this.keywordsPath, JSON.stringify(this.keywords, null, 2));
      console.log('💾 Keywords guardadas exitosamente');
    } catch (error) {
      console.error('❌ Error guardando keywords:', error.message);
      throw error;
    }
  }
}

// Instancia singleton
const prioritySystem = new PrioritySystem();

// Exportar funciones para compatibilidad
module.exports = {
  applyPrioritySystem: (packages) => prioritySystem.applyPrioritySystem(packages),
  searchWithPriority: (packages, query) => prioritySystem.searchWithPriority(packages, query),
  getActiveKeywords: () => prioritySystem.getActiveKeywords(),
  getKeywordStats: (packages) => prioritySystem.getKeywordStats(packages),
  reloadKeywords: () => prioritySystem.reloadKeywords(),
  addKeyword: (keyword) => prioritySystem.addKeyword(keyword),
  updateKeyword: (id, updates) => prioritySystem.updateKeyword(id, updates),
  deleteKeyword: (id) => prioritySystem.deleteKeyword(id),
  
  // Exportar la instancia para uso avanzado
  prioritySystem
};

console.log('🎯 Sistema de Priorización funcional cargado');