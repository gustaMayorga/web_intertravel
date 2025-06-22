// ===============================================
// SISTEMA DE LOGGING DETALLADO PARA BACKEND
// ===============================================

const fs = require('fs');
const path = require('path');

class DetailedLogger {
  constructor() {
    this.logFile = path.join(__dirname, 'logs', 'backend-packages.log');
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.requestCounter = 0;
    
    // Crear directorio de logs si no existe
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.log('INIT', 'Sistema de logging iniciado', { sessionId: this.sessionId });
  }
  
  log(type, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      sessionId: this.sessionId,
      type,
      message,
      data
    };
    
    // Log a consola con formato bonito
    const icon = this.getIcon(type);
    console.log(`${icon} [${type}] ${timestamp} - ${message}`);
    
    if (Object.keys(data).length > 0) {
      console.log('   📋 Data:', JSON.stringify(data, null, 2));
    }
    
    // Log a archivo
    try {
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Error escribiendo log:', error.message);
    }
  }
  
  getIcon(type) {
    const icons = {
      'INIT': '🚀',
      'REQUEST': '📥',
      'TC_AUTH': '🔑',
      'TC_FETCH': '🔍',
      'TC_CACHE': '💾',
      'TC_ERROR': '❌',
      'RESPONSE': '📤',
      'FILTER': '🔧',
      'STATS': '📊',
      'WARNING': '⚠️',
      'ERROR': '💥',
      'SUCCESS': '✅'
    };
    return icons[type] || '📝';
  }
  
  logRequest(req, endpoint) {
    this.requestCounter++;
    const requestId = `req-${this.requestCounter}`;
    
    this.log('REQUEST', `Incoming ${endpoint}`, {
      requestId,
      method: req.method,
      url: req.url,
      query: req.query,
      headers: {
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer,
        origin: req.headers.origin
      },
      ip: req.ip
    });
    
    return requestId;
  }
  
  logTCOperation(operation, data) {
    this.log(`TC_${operation.toUpperCase()}`, `Travel Compositor ${operation}`, data);
  }
  
  logResponse(requestId, data) {
    this.log('RESPONSE', `Response sent`, {
      requestId,
      packagesCount: data.packages?.length || 0,
      source: data.source,
      total: data.total,
      hasMore: data.pagination?.hasNext
    });
  }
  
  logPackageAnalysis(packages, source) {
    // Análisis detallado de paquetes
    const analysis = {
      total: packages.length,
      source,
      byCountry: {},
      byCategory: {},
      sampleTitles: packages.slice(0, 5).map(p => p.title),
      priceRange: { min: Infinity, max: 0 },
      duplicateIds: []
    };
    
    const seenIds = new Set();
    
    packages.forEach(pkg => {
      // Análisis por país
      const country = pkg.country || 'Sin país';
      analysis.byCountry[country] = (analysis.byCountry[country] || 0) + 1;
      
      // Análisis por categoría
      const category = pkg.category || 'Sin categoría';
      analysis.byCategory[category] = (analysis.byCategory[category] || 0) + 1;
      
      // Análisis de precios
      const price = pkg.price?.amount || 0;
      if (price > 0) {
        analysis.priceRange.min = Math.min(analysis.priceRange.min, price);
        analysis.priceRange.max = Math.max(analysis.priceRange.max, price);
      }
      
      // Detectar duplicados
      if (seenIds.has(pkg.id)) {
        analysis.duplicateIds.push(pkg.id);
      } else {
        seenIds.add(pkg.id);
      }
    });
    
    this.log('STATS', 'Análisis de paquetes', analysis);
    
    return analysis;
  }
  
  logCacheOperation(operation, data) {
    this.log('TC_CACHE', `Cache ${operation}`, data);
  }
  
  logError(error, context = {}) {
    this.log('ERROR', error.message, {
      stack: error.stack,
      context
    });
  }
  
  logWarning(message, data = {}) {
    this.log('WARNING', message, data);
  }
  
  // Generar reporte de sesión
  generateSessionReport() {
    try {
      const logContent = fs.readFileSync(this.logFile, 'utf8');
      const logs = logContent.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line))
        .filter(log => log.sessionId === this.sessionId);
      
      const report = {
        sessionId: this.sessionId,
        totalLogs: logs.length,
        requests: logs.filter(log => log.type === 'REQUEST').length,
        errors: logs.filter(log => log.type === 'ERROR').length,
        warnings: logs.filter(log => log.type === 'WARNING').length,
        tcOperations: logs.filter(log => log.type.startsWith('TC_')).length,
        timeline: logs.map(log => ({
          time: log.timestamp,
          type: log.type,
          message: log.message
        }))
      };
      
      console.log('\n📊 REPORTE DE SESIÓN:');
      console.log(`   Requests: ${report.requests}`);
      console.log(`   Errores: ${report.errors}`);
      console.log(`   Warnings: ${report.warnings}`);
      console.log(`   Ops TC: ${report.tcOperations}`);
      
      return report;
    } catch (error) {
      console.error('Error generando reporte:', error.message);
      return null;
    }
  }
}

module.exports = DetailedLogger;