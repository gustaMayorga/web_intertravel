// ===============================================
// SISTEMA DE PERSISTENCIA TEMPORAL PARA KEYWORDS
// ===============================================

const fs = require('fs');
const path = require('path');

// Ruta del archivo de datos
const DATA_FILE = path.join(__dirname, '../data/priority-keywords.json');
const DATA_DIR = path.join(__dirname, '../data');

// Asegurar que el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Directorio de datos creado:', DATA_DIR);
}

// Datos iniciales por defecto
const DEFAULT_KEYWORDS = [
  { id: 1, keyword: 'charter', priority: 1, category: 'transport', active: true, description: 'Vuelos charter prioritarios', created_at: new Date().toISOString() },
  { id: 2, keyword: 'perú', priority: 2, category: 'destination', active: true, description: 'Destino Perú prioritario', created_at: new Date().toISOString() },
  { id: 3, keyword: 'MSC', priority: 3, category: 'cruise', active: true, description: 'Cruceros MSC prioritarios', created_at: new Date().toISOString() },
  { id: 4, keyword: 'intertravel', priority: 1, category: 'agency', active: true, description: 'Paquetes InterTravel', created_at: new Date().toISOString() },
  { id: 5, keyword: 'enzo.vingoli', priority: 1, category: 'agency', active: true, description: 'Paquetes enzo.vingoli', created_at: new Date().toISOString() },
  { id: 6, keyword: 'premium', priority: 4, category: 'category', active: true, description: 'Paquetes premium', created_at: new Date().toISOString() },
  { id: 7, keyword: 'luxury', priority: 5, category: 'category', active: true, description: 'Paquetes de lujo', created_at: new Date().toISOString() },
  { id: 8, keyword: 'wine', priority: 6, category: 'experience', active: true, description: 'Tours de vino', created_at: new Date().toISOString() },
  { id: 9, keyword: 'mendoza', priority: 3, category: 'destination', active: true, description: 'Destino Mendoza', created_at: new Date().toISOString() },
  { id: 10, keyword: 'patagonia', priority: 4, category: 'destination', active: true, description: 'Destino Patagonia', created_at: new Date().toISOString() }
];

class KeywordStorage {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        console.log('🔧 Inicializando archivo de keywords...');
        this.saveKeywords(DEFAULT_KEYWORDS);
        console.log('✅ Archivo de keywords inicializado con datos por defecto');
      } else {
        console.log('✅ Archivo de keywords encontrado:', DATA_FILE);
      }
    } catch (error) {
      console.error('❌ Error inicializando storage:', error);
    }
  }

  loadKeywords() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const keywords = JSON.parse(data);
        console.log(`📋 ${keywords.length} keywords cargadas desde archivo`);
        return keywords;
      }
    } catch (error) {
      console.error('❌ Error cargando keywords:', error);
    }
    
    // Fallback a datos por defecto
    console.log('⚠️ Usando datos por defecto');
    return DEFAULT_KEYWORDS;
  }

  saveKeywords(keywords) {
    try {
      const data = JSON.stringify(keywords, null, 2);
      fs.writeFileSync(DATA_FILE, data, 'utf8');
      console.log(`💾 ${keywords.length} keywords guardadas en archivo`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando keywords:', error);
      return false;
    }
  }

  getAllKeywords() {
    return this.loadKeywords().sort((a, b) => a.priority - b.priority);
  }

  addKeyword(keywordData) {
    const keywords = this.loadKeywords();
    const newKeyword = {
      id: Math.max(...keywords.map(k => k.id), 0) + 1,
      keyword: keywordData.keyword.toLowerCase().trim(),
      priority: parseInt(keywordData.priority),
      category: keywordData.category || 'general',
      description: keywordData.description || '',
      active: true,
      created_at: new Date().toISOString(),
      created_by: keywordData.created_by || 'admin'
    };

    keywords.push(newKeyword);
    
    if (this.saveKeywords(keywords)) {
      console.log(`➕ Keyword agregada: "${newKeyword.keyword}" (ID: ${newKeyword.id})`);
      return newKeyword;
    }
    
    return null;
  }

  updateKeyword(id, updates) {
    const keywords = this.loadKeywords();
    const index = keywords.findIndex(k => k.id === parseInt(id));
    
    if (index === -1) {
      return null;
    }

    // Aplicar actualizaciones
    const updatedKeyword = {
      ...keywords[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    keywords[index] = updatedKeyword;
    
    if (this.saveKeywords(keywords)) {
      console.log(`✏️ Keyword actualizada: ID ${id} - "${updatedKeyword.keyword}"`);
      return updatedKeyword;
    }
    
    return null;
  }

  deleteKeyword(id) {
    const keywords = this.loadKeywords();
    const index = keywords.findIndex(k => k.id === parseInt(id));
    
    if (index === -1) {
      return false;
    }

    const deletedKeyword = keywords[index];
    keywords.splice(index, 1);
    
    if (this.saveKeywords(keywords)) {
      console.log(`🗑️ Keyword eliminada: ID ${id} - "${deletedKeyword.keyword}"`);
      return true;
    }
    
    return false;
  }

  getKeywordById(id) {
    const keywords = this.loadKeywords();
    return keywords.find(k => k.id === parseInt(id));
  }

  // Método para backup
  createBackup() {
    try {
      const backupFile = path.join(DATA_DIR, `keywords-backup-${Date.now()}.json`);
      const keywords = this.loadKeywords();
      fs.writeFileSync(backupFile, JSON.stringify(keywords, null, 2), 'utf8');
      console.log('💾 Backup creado:', backupFile);
      return backupFile;
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      return null;
    }
  }

  // Método para resetear a datos por defecto
  reset() {
    try {
      this.saveKeywords(DEFAULT_KEYWORDS);
      console.log('🔄 Keywords reseteadas a datos por defecto');
      return true;
    } catch (error) {
      console.error('❌ Error reseteando keywords:', error);
      return false;
    }
  }

  // Estadísticas
  getStats() {
    const keywords = this.loadKeywords();
    return {
      total: keywords.length,
      active: keywords.filter(k => k.active).length,
      inactive: keywords.filter(k => !k.active).length,
      categories: [...new Set(keywords.map(k => k.category))],
      lastModified: fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).mtime : null
    };
  }
}

// Exportar instancia singleton
const keywordStorage = new KeywordStorage();

module.exports = keywordStorage;