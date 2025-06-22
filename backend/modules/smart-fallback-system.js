// ==============================================
// 🧠 SISTEMA DE FALLBACK INTELIGENTE MEJORADO
// ==============================================
// Integrado al sistema admin existente

const fs = require('fs').promises;
const path = require('path');

class SmartFallbackSystem {
  constructor() {
    this.fallbackDir = path.join(__dirname, '../fallback-data');
    this.lastUpdate = null;
    this.tcConnected = false;
    this.autoSync = true;
    
    this.ensureFallbackDir();
  }

  async ensureFallbackDir() {
    try {
      await fs.mkdir(this.fallbackDir, { recursive: true });
      console.log('📁 Directorio de fallback inicializado');
    } catch (error) {
      console.error('❌ Error creando directorio fallback:', error);
    }
  }

  // ==============================================
  // 💾 CAPTURA INTELIGENTE DE DATOS TC
  // ==============================================

  async captureAndStoreTCData(dataType, data, metadata = {}) {
    if (!data || !this.autoSync) return false;

    try {
      const timestamp = new Date().toISOString();
      const fallbackData = {
        type: dataType,
        data: data,
        metadata: {
          ...metadata,
          capturedAt: timestamp,
          source: 'travel-compositor-real',
          tcConnected: this.tcConnected
        },
        coordinates: this.extractCoordinates(data)
      };

      const filename = `${dataType}-${timestamp.split('T')[0]}.json`;
      const filepath = path.join(this.fallbackDir, filename);

      await fs.writeFile(filepath, JSON.stringify(fallbackData, null, 2));
      
      // También actualizar el archivo "latest"
      const latestFilepath = path.join(this.fallbackDir, `${dataType}-latest.json`);
      await fs.writeFile(latestFilepath, JSON.stringify(fallbackData, null, 2));

      console.log(`💾 Datos TC capturados: ${dataType} (${Array.isArray(data) ? data.length : 1} elementos)`);
      
      this.lastUpdate = timestamp;
      return true;
    } catch (error) {
      console.error(`❌ Error guardando fallback ${dataType}:`, error);
      return false;
    }
  }

  // Extraer coordenadas automáticamente
  extractCoordinates(data) {
    const coordinates = {};
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.name && (item.lat || item.latitude)) {
          coordinates[item.name] = {
            lat: item.lat || item.latitude,
            lng: item.lng || item.longitude,
            country: item.country
          };
        }
        
        if (item.destination && item.coordinates) {
          coordinates[item.destination] = item.coordinates;
        }
      });
    }
    
    return coordinates;
  }

  // ==============================================
  // 🎯 COORDENADAS PRECISAS INTEGRADAS
  // ==============================================

  async saveDestinationsWithCoordinates(destinations) {
    const enrichedDestinations = destinations.map(dest => ({
      ...dest,
      coordinates: this.getKnownCoordinates(dest.name || dest.destination),
      fallbackPosition: this.calculateMapPosition(dest.name || dest.destination)
    }));

    await this.captureAndStoreTCData('destinations', enrichedDestinations, {
      count: destinations.length,
      hasCoordinates: enrichedDestinations.filter(d => d.coordinates).length
    });

    return enrichedDestinations;
  }

  getKnownCoordinates(destinationName) {
    const knownCoordinates = {
      // Argentina
      'Buenos Aires': { lat: -34.6118, lng: -58.3960 },
      'Bariloche': { lat: -41.1335, lng: -71.3103 },
      'Mendoza': { lat: -32.8895, lng: -68.8458 },
      'Córdoba': { lat: -31.4201, lng: -64.1888 },
      'Rosario': { lat: -32.9442, lng: -60.6505 },
      'Mar del Plata': { lat: -38.0023, lng: -57.5575 },
      'Salta': { lat: -24.7821, lng: -65.4232 },
      'Ushuaia': { lat: -54.8019, lng: -68.3030 },
      'El Calafate': { lat: -50.3374, lng: -72.2647 },
      'Puerto Madryn': { lat: -42.7692, lng: -65.0384 },
      
      // Europa
      'París': { lat: 48.8566, lng: 2.3522 },
      'Londres': { lat: 51.5074, lng: -0.1278 },
      'Roma': { lat: 41.9028, lng: 12.4964 },
      'Barcelona': { lat: 41.3851, lng: 2.1734 },
      'Madrid': { lat: 40.4168, lng: -3.7038 },
      'Amsterdam': { lat: 52.3676, lng: 4.9041 },
      'Berlín': { lat: 52.5200, lng: 13.4050 },
      'Viena': { lat: 48.2082, lng: 16.3738 },
      
      // América
      'Nueva York': { lat: 40.7128, lng: -74.0060 },
      'Miami': { lat: 25.7617, lng: -80.1918 },
      'Cancún': { lat: 21.1619, lng: -86.8515 },
      'Lima': { lat: -12.0464, lng: -77.0428 },
      'Cusco': { lat: -13.5319, lng: -71.9675 },
      'Río de Janeiro': { lat: -22.9068, lng: -43.1729 },
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
      'Los Ángeles': { lat: 34.0522, lng: -118.2437 },
      'Toronto': { lat: 43.6532, lng: -79.3832 },
      
      // Asia y Oceanía
      'Tokio': { lat: 35.6762, lng: 139.6503 },
      'Bangkok': { lat: 13.7563, lng: 100.5018 },
      'Dubái': { lat: 25.2048, lng: 55.2708 },
      'Singapur': { lat: 1.3521, lng: 103.8198 },
      'Sidney': { lat: -33.8688, lng: 151.2093 },
      'Melbourne': { lat: -37.8136, lng: 144.9631 },
      
      // África
      'Ciudad del Cabo': { lat: -33.9249, lng: 18.4241 },
      'El Cairo': { lat: 30.0444, lng: 31.2357 }
    };

    return knownCoordinates[destinationName] || null;
  }

  calculateMapPosition(destinationName) {
    const coords = this.getKnownCoordinates(destinationName);
    if (!coords) return { x: 50, y: 50 };

    // Convertir lat/lng a posición en mapa (0-100%)
    const x = ((coords.lng + 180) / 360) * 100;
    const y = ((90 - coords.lat) / 180) * 100;
    
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(10, Math.min(90, y))
    };
  }

  // ==============================================
  // 📤 RECUPERACIÓN INTELIGENTE
  // ==============================================

  async getFallbackData(dataType, maxAge = null) {
    try {
      const latestFilepath = path.join(this.fallbackDir, `${dataType}-latest.json`);
      const data = await fs.readFile(latestFilepath, 'utf8');
      const fallbackData = JSON.parse(data);

      if (maxAge) {
        const dataAge = Date.now() - new Date(fallbackData.metadata.capturedAt).getTime();
        if (dataAge > maxAge) {
          console.log(`⚠️ Datos fallback ${dataType} muy antiguos`);
          return null;
        }
      }

      console.log(`✅ Usando fallback ${dataType}`);
      return fallbackData;
    } catch (error) {
      console.log(`⚠️ No hay fallback disponible para ${dataType}`);
      return null;
    }
  }

  // ==============================================
  // 🎯 MÉTODO PRINCIPAL INTELIGENTE
  // ==============================================

  async getSmartData(dataType, tcFetchFunction, maxFallbackAge = 30 * 60 * 1000) {
    try {
      // 1. Intentar obtener datos frescos de TC
      console.log(`🌍 Intentando obtener ${dataType} desde TC...`);
      const tcData = await tcFetchFunction();
      
      if (tcData && (tcData.destinations || tcData.packages || tcData.data)) {
        // 2. Guardar automáticamente como fallback
        const dataToSave = tcData.destinations || tcData.packages || tcData.data || tcData;
        
        // Enriquecer destinos con coordenadas si corresponde
        const enrichedData = dataType === 'destinations' ? 
          await this.saveDestinationsWithCoordinates(dataToSave) : dataToSave;
        
        await this.captureAndStoreTCData(dataType, enrichedData, { 
          method: 'real-time-capture' 
        });
        
        this.tcConnected = true;
        console.log(`✅ Datos ${dataType} obtenidos desde TC y guardados como fallback`);
        
        return {
          success: true,
          data: enrichedData,
          source: 'travel-compositor-live',
          fallbackSaved: true
        };
      }
    } catch (error) {
      console.log(`⚠️ TC no disponible para ${dataType}:`, error.message);
    }

    // 3. Usar fallback si TC no está disponible
    console.log(`📦 Usando fallback para ${dataType}...`);
    const fallbackData = await this.getFallbackData(dataType, maxFallbackAge);
    
    if (fallbackData) {
      this.tcConnected = false;
      return {
        success: true,
        data: fallbackData.data,
        source: 'smart-fallback',
        capturedAt: fallbackData.metadata.capturedAt,
        coordinates: fallbackData.coordinates
      };
    }

    // 4. Fallback de emergencia
    console.log(`🆘 Usando fallback de emergencia para ${dataType}`);
    return this.getEmergencyFallback(dataType);
  }

  getEmergencyFallback(dataType) {
    const emergencyData = {
      destinations: [
        { name: 'Buenos Aires', country: 'Argentina', packages: 25, coordinates: { lat: -34.6118, lng: -58.3960 } },
        { name: 'París', country: 'Francia', packages: 20, coordinates: { lat: 48.8566, lng: 2.3522 } },
        { name: 'Nueva York', country: 'Estados Unidos', packages: 18, coordinates: { lat: 40.7128, lng: -74.0060 } },
        { name: 'Tokio', country: 'Japón', packages: 15, coordinates: { lat: 35.6762, lng: 139.6503 } },
        { name: 'Londres', country: 'Reino Unido', packages: 22, coordinates: { lat: 51.5074, lng: -0.1278 } },
        { name: 'Roma', country: 'Italia', packages: 16, coordinates: { lat: 41.9028, lng: 12.4964 } },
        { name: 'Cancún', country: 'México', packages: 30, coordinates: { lat: 21.1619, lng: -86.8515 } },
        { name: 'Miami', country: 'Estados Unidos', packages: 12, coordinates: { lat: 25.7617, lng: -80.1918 } },
        { name: 'Bariloche', country: 'Argentina', packages: 14, coordinates: { lat: -41.1335, lng: -71.3103 } },
        { name: 'Río de Janeiro', country: 'Brasil', packages: 19, coordinates: { lat: -22.9068, lng: -43.1729 } },
        { name: 'Barcelona', country: 'España', packages: 17, coordinates: { lat: 41.3851, lng: 2.1734 } },
        { name: 'Dubái', country: 'Emiratos Árabes Unidos', packages: 13, coordinates: { lat: 25.2048, lng: 55.2708 } }
      ]
    };

    return {
      success: true,
      data: emergencyData[dataType] || [],
      source: 'emergency-fallback',
      warning: 'Usando datos de emergencia con coordenadas precisas'
    };
  }

  // ==============================================
  // 📊 ESTADÍSTICAS Y ADMINISTRACIÓN
  // ==============================================

  async getStats() {
    try {
      const files = await fs.readdir(this.fallbackDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'config.json');
      
      const stats = {
        totalFiles: jsonFiles.length,
        dataTypes: [...new Set(jsonFiles.map(f => f.split('-')[0]))],
        lastUpdate: this.lastUpdate,
        autoSync: this.autoSync,
        tcConnected: this.tcConnected,
        diskUsage: await this.calculateDiskUsage(),
        coordinatesAvailable: Object.keys(this.getKnownCoordinates('') || {}).length
      };

      return stats;
    } catch (error) {
      return { error: error.message };
    }
  }

  async calculateDiskUsage() {
    try {
      const files = await fs.readdir(this.fallbackDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.fallbackDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return `${Math.round(totalSize / 1024)} KB`;
    } catch (error) {
      return 'N/A';
    }
  }

  async updateConfig(newConfig) {
    this.autoSync = newConfig.autoSync !== undefined ? newConfig.autoSync : this.autoSync;
    
    const configData = {
      autoSync: this.autoSync,
      lastUpdate: this.lastUpdate,
      updatedAt: new Date().toISOString(),
      ...newConfig
    };

    try {
      const configPath = path.join(this.fallbackDir, 'config.json');
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
      console.log('⚙️ Configuración de fallback actualizada');
      return configData;
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      return null;
    }
  }
}

module.exports = SmartFallbackSystem;