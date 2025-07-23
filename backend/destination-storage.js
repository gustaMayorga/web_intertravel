// ===============================================
// SISTEMA DE PERSISTENCIA PARA DESTINOS
// ===============================================

const fs = require('fs');
const path = require('path');

// Ruta del archivo de datos
const DATA_FILE = path.join(__dirname, '../data/destinations.json');
const DATA_DIR = path.join(__dirname, '../data');

// Asegurar que el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Directorio de datos creado:', DATA_DIR);
}

// Datos iniciales por defecto
const DEFAULT_DESTINATIONS = [
  { 
    id: 1, 
    name: 'Buenos Aires', 
    country: 'Argentina', 
    coordinates: { lat: -34.6037, lng: -58.3816 },
    description: 'Capital cosmopolita de Argentina, famosa por su arquitectura europea, tango y gastronomía.',
    isActive: true,
    packageCount: 15,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  { 
    id: 2, 
    name: 'Mendoza', 
    country: 'Argentina', 
    coordinates: { lat: -32.8895, lng: -68.8458 },
    description: 'Capital mundial del vino, rodeada de montañas y viñedos.',
    isActive: true,
    packageCount: 12,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  { 
    id: 3, 
    name: 'Cusco', 
    country: 'Perú', 
    coordinates: { lat: -13.5319, lng: -71.9675 },
    description: 'Antigua capital del Imperio Inca, puerta de entrada a Machu Picchu.',
    isActive: true,
    packageCount: 18,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  { 
    id: 4, 
    name: 'París', 
    country: 'Francia', 
    coordinates: { lat: 48.8566, lng: 2.3522 },
    description: 'Ciudad de la luz, famosa por sus museos, arquitectura y gastronomía.',
    isActive: true,
    packageCount: 8,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  { 
    id: 5, 
    name: 'Nueva York', 
    country: 'Estados Unidos', 
    coordinates: { lat: 40.7128, lng: -74.0060 },
    description: 'La gran manzana, centro financiero y cultural del mundo.',
    isActive: true,
    packageCount: 6,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  { 
    id: 6, 
    name: 'Barcelona', 
    country: 'España', 
    coordinates: { lat: 41.3851, lng: 2.1734 },
    description: 'Ciudad modernista de Gaudí, con playa y vida nocturna vibrante.',
    isActive: true,
    packageCount: 10,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  { 
    id: 7, 
    name: 'Roma', 
    country: 'Italia', 
    coordinates: { lat: 41.9028, lng: 12.4964 },
    description: 'Ciudad eterna, cuna de la civilización occidental.',
    isActive: true,
    packageCount: 14,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  { 
    id: 8, 
    name: 'Bariloche', 
    country: 'Argentina', 
    coordinates: { lat: -41.1335, lng: -71.3103 },
    description: 'Ciudad de los lagos y montañas en la Patagonia.',
    isActive: true,
    packageCount: 9,
    created_at: new Date().toISOString(),
    created_by: 'system'
  }
];

class DestinationStorage {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        console.log('🔧 Inicializando archivo de destinos...');
        this.saveDestinations(DEFAULT_DESTINATIONS);
        console.log('✅ Archivo de destinos inicializado con datos por defecto');
      } else {
        console.log('✅ Archivo de destinos encontrado:', DATA_FILE);
      }
    } catch (error) {
      console.error('❌ Error inicializando storage:', error);
    }
  }

  loadDestinations() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const destinations = JSON.parse(data);
        console.log(`📋 ${destinations.length} destinos cargados desde archivo`);
        return destinations;
      }
    } catch (error) {
      console.error('❌ Error cargando destinos:', error);
    }
    
    // Fallback a datos por defecto
    console.log('⚠️ Usando datos por defecto');
    return DEFAULT_DESTINATIONS;
  }

  saveDestinations(destinations) {
    try {
      const data = JSON.stringify(destinations, null, 2);
      fs.writeFileSync(DATA_FILE, data, 'utf8');
      console.log(`💾 ${destinations.length} destinos guardados en archivo`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando destinos:', error);
      return false;
    }
  }

  getAllDestinations() {
    return this.loadDestinations().sort((a, b) => a.name.localeCompare(b.name));
  }

  addDestination(destinationData) {
    const destinations = this.loadDestinations();
    const newDestination = {
      id: Math.max(...destinations.map(d => d.id), 0) + 1,
      name: destinationData.name.trim(),
      country: destinationData.country.trim(),
      coordinates: destinationData.coordinates || { lat: 0, lng: 0 },
      description: destinationData.description || '',
      isActive: destinationData.isActive !== undefined ? destinationData.isActive : true,
      packageCount: destinationData.packageCount || 0,
      created_at: new Date().toISOString(),
      created_by: destinationData.created_by || 'admin'
    };

    destinations.push(newDestination);
    
    if (this.saveDestinations(destinations)) {
      console.log(`➕ Destino agregado: "${newDestination.name}, ${newDestination.country}" (ID: ${newDestination.id})`);
      return newDestination;
    }
    
    return null;
  }

  updateDestination(id, updates) {
    const destinations = this.loadDestinations();
    const index = destinations.findIndex(d => d.id === parseInt(id));
    
    if (index === -1) {
      return null;
    }

    // Aplicar actualizaciones
    const updatedDestination = {
      ...destinations[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    destinations[index] = updatedDestination;
    
    if (this.saveDestinations(destinations)) {
      console.log(`✏️ Destino actualizado: ID ${id} - "${updatedDestination.name}, ${updatedDestination.country}"`);
      return updatedDestination;
    }
    
    return null;
  }

  deleteDestination(id) {
    const destinations = this.loadDestinations();
    const index = destinations.findIndex(d => d.id === parseInt(id));
    
    if (index === -1) {
      return false;
    }

    const deletedDestination = destinations[index];
    destinations.splice(index, 1);
    
    if (this.saveDestinations(destinations)) {
      console.log(`🗑️ Destino eliminado: ID ${id} - "${deletedDestination.name}, ${deletedDestination.country}"`);
      return true;
    }
    
    return false;
  }

  getDestinationById(id) {
    const destinations = this.loadDestinations();
    return destinations.find(d => d.id === parseInt(id));
  }

  // Método para backup
  createBackup() {
    try {
      const backupFile = path.join(DATA_DIR, `destinations-backup-${Date.now()}.json`);
      const destinations = this.loadDestinations();
      fs.writeFileSync(backupFile, JSON.stringify(destinations, null, 2), 'utf8');
      console.log('💾 Backup de destinos creado:', backupFile);
      return backupFile;
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      return null;
    }
  }

  // Método para resetear a datos por defecto
  reset() {
    try {
      this.saveDestinations(DEFAULT_DESTINATIONS);
      console.log('🔄 Destinos reseteados a datos por defecto');
      return true;
    } catch (error) {
      console.error('❌ Error reseteando destinos:', error);
      return false;
    }
  }

  // Estadísticas
  getStats() {
    const destinations = this.loadDestinations();
    const countries = [...new Set(destinations.map(d => d.country))];
    
    return {
      total: destinations.length,
      active: destinations.filter(d => d.isActive).length,
      withCoordinates: destinations.filter(d => d.coordinates && d.coordinates.lat !== 0 && d.coordinates.lng !== 0).length,
      totalPackages: destinations.reduce((sum, d) => sum + (d.packageCount || 0), 0),
      countries: countries.length,
      topDestination: destinations.reduce((max, d) => (d.packageCount || 0) > (max.packageCount || 0) ? d : max, destinations[0]),
      lastModified: fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE).mtime : null
    };
  }

  // Buscar destinos por país
  getDestinationsByCountry(country) {
    const destinations = this.loadDestinations();
    return destinations.filter(d => d.country.toLowerCase() === country.toLowerCase());
  }

  // Buscar destinos con coordenadas faltantes
  getDestinationsWithoutCoordinates() {
    const destinations = this.loadDestinations();
    return destinations.filter(d => !d.coordinates || d.coordinates.lat === 0 || d.coordinates.lng === 0);
  }

  // Obtener países únicos
  getUniqueCountries() {
    const destinations = this.loadDestinations();
    return [...new Set(destinations.map(d => d.country))].sort();
  }
}

// Exportar instancia singleton
const destinationStorage = new DestinationStorage();

module.exports = destinationStorage;