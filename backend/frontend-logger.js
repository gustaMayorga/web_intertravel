// ===============================================
// SISTEMA DE LOGGING DETALLADO PARA FRONTEND
// ===============================================

class FrontendLogger {
  constructor() {
    this.sessionId = `frontend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logs = [];
    this.requestCounter = 0;
    this.isEnabled = true;
    
    this.log('INIT', 'Frontend logger iniciado', { 
      url: window.location.href,
      userAgent: navigator.userAgent 
    });
    
    // Auto-enviar logs cada 30 segundos
    setInterval(() => this.sendLogsToBackend(), 30000);
    
    // Enviar logs antes de cerrar
    window.addEventListener('beforeunload', () => this.sendLogsToBackend());
  }
  
  log(type, message, data = {}) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      type,
      message,
      data,
      url: window.location.href
    };
    
    this.logs.push(logEntry);
    
    // Log visual en consola
    const icon = this.getIcon(type);
    const color = this.getColor(type);
    
    console.log(`%c${icon} [${type}] ${message}`, `color: ${color}; font-weight: bold;`);
    
    if (Object.keys(data).length > 0) {
      console.log('📋 Data:', data);
    }
    
    // Mantener solo los últimos 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }
  
  getIcon(type) {
    const icons = {
      'INIT': '🚀',
      'API_REQUEST': '📤',
      'API_RESPONSE': '📥',
      'API_ERROR': '❌',
      'RENDER': '🎨',
      'USER_ACTION': '👆',
      'FILTER': '🔧',
      'NAVIGATION': '🧭',
      'ERROR': '💥',
      'WARNING': '⚠️',
      'SUCCESS': '✅'
    };
    return icons[type] || '📝';
  }
  
  getColor(type) {
    const colors = {
      'INIT': '#2196F3',
      'API_REQUEST': '#FF9800',
      'API_RESPONSE': '#4CAF50',
      'API_ERROR': '#F44336',
      'RENDER': '#9C27B0',
      'USER_ACTION': '#00BCD4',
      'FILTER': '#FFC107',
      'NAVIGATION': '#3F51B5',
      'ERROR': '#F44336',
      'WARNING': '#FF9800',
      'SUCCESS': '#4CAF50'
    };
    return colors[type] || '#666666';
  }
  
  logApiRequest(url, params = {}) {
    this.requestCounter++;
    const requestId = `frontend-req-${this.requestCounter}`;
    
    this.log('API_REQUEST', `Requesting ${url}`, {
      requestId,
      url,
      params,
      timestamp: Date.now()
    });
    
    return requestId;
  }
  
  logApiResponse(requestId, data, duration) {
    this.log('API_RESPONSE', `Response received`, {
      requestId,
      duration: `${duration}ms`,
      packagesCount: data.packages?.length || 0,
      source: data.source,
      total: data.total,
      success: data.success
    });
  }
  
  logApiError(requestId, error, duration) {
    this.log('API_ERROR', `Request failed`, {
      requestId,
      duration: `${duration}ms`,
      error: error.message,
      status: error.status
    });
  }
  
  logRender(component, data = {}) {
    this.log('RENDER', `Rendering ${component}`, data);
  }
  
  logUserAction(action, data = {}) {
    this.log('USER_ACTION', action, data);
  }
  
  logFilter(filterType, value, resultCount) {
    this.log('FILTER', `Filter applied: ${filterType}`, {
      filterType,
      value,
      resultCount
    });
  }
  
  logNavigation(from, to) {
    this.log('NAVIGATION', `Navigation: ${from} → ${to}`, {
      from,
      to,
      timestamp: Date.now()
    });
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
  
  // Análisis de performance de carga de paquetes
  analyzePackageLoadPerformance(packages, loadTime) {
    const analysis = {
      totalPackages: packages.length,
      loadTime: `${loadTime}ms`,
      averageTimePerPackage: `${(loadTime / packages.length).toFixed(2)}ms`,
      bySource: {},
      byCountry: {},
      duplicates: 0
    };
    
    const seenIds = new Set();
    
    packages.forEach(pkg => {
      // Por fuente
      const source = pkg._source || 'unknown';
      analysis.bySource[source] = (analysis.bySource[source] || 0) + 1;
      
      // Por país
      const country = pkg.country || 'Sin país';
      analysis.byCountry[country] = (analysis.byCountry[country] || 0) + 1;
      
      // Duplicados
      if (seenIds.has(pkg.id)) {
        analysis.duplicates++;
      } else {
        seenIds.add(pkg.id);
      }
    });
    
    this.log('RENDER', 'Package load performance', analysis);
    
    return analysis;
  }
  
  // Enviar logs al backend
  async sendLogsToBackend() {
    if (this.logs.length === 0) return;
    
    try {
      const response = await fetch('/api/frontend-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          logs: this.logs
        })
      });
      
      if (response.ok) {
        console.log(`📤 ${this.logs.length} logs enviados al backend`);
        this.logs = []; // Limpiar logs enviados
      }
    } catch (error) {
      console.warn('⚠️ Error enviando logs al backend:', error.message);
    }
  }
  
  // Generar reporte de sesión
  generateReport() {
    const report = {
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      byType: {},
      requests: this.logs.filter(log => log.type === 'API_REQUEST').length,
      responses: this.logs.filter(log => log.type === 'API_RESPONSE').length,
      errors: this.logs.filter(log => log.type === 'ERROR').length,
      timeline: this.logs.map(log => ({
        time: log.timestamp,
        type: log.type,
        message: log.message
      }))
    };
    
    // Contar por tipo
    this.logs.forEach(log => {
      report.byType[log.type] = (report.byType[log.type] || 0) + 1;
    });
    
    console.log('📊 REPORTE FRONTEND:', report);
    return report;
  }
  
  // Toggle logging
  enable() { this.isEnabled = true; }
  disable() { this.isEnabled = false; }
}

// Crear instancia global
window.frontendLogger = new FrontendLogger();

// Función helper para usar en componentes
window.logPackageLoad = (packages, loadTime) => {
  return window.frontendLogger.analyzePackageLoadPerformance(packages, loadTime);
};

window.logApiCall = (url, params) => {
  return window.frontendLogger.logApiRequest(url, params);
};

window.logApiResponse = (requestId, data, duration) => {
  window.frontendLogger.logApiResponse(requestId, data, duration);
};

window.logApiError = (requestId, error, duration) => {
  window.frontendLogger.logApiError(requestId, error, duration);
};

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendLogger;
}