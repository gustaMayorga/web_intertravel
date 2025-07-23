// ==============================================
// 🔗 GESTOR DE INTEGRACIONES EXTERNAS
// ==============================================
// Sistema centralizado para gestionar todas las integraciones de terceros

const { query } = require('../database');
const axios = require('axios');

class IntegrationsManager {
  constructor() {
    this.integrations = {
      whatsapp: new WhatsAppIntegration(),
      email: new EmailServiceIntegration(),
      maps: new MapsIntegration(),
      weather: new WeatherIntegration(),
      currency: new CurrencyIntegration(),
      analytics: new AnalyticsIntegration(),
      payments: new PaymentGatewaysIntegration()
    };
    this.healthChecks = new Map();
    this.lastHealthCheck = null;
  }

  // ==============================================
  // 🎯 GESTIÓN PRINCIPAL DE INTEGRACIONES
  // ==============================================

  async initializeAllIntegrations() {
    try {
      console.log('🔗 Inicializando todas las integraciones...');
      
      const results = [];
      for (const [name, integration] of Object.entries(this.integrations)) {
        try {
          console.log(`🔄 Inicializando ${name}...`);
          const result = await integration.initialize();
          results.push({
            name,
            success: result.success,
            status: result.success ? 'initialized' : 'failed',
            error: result.error || null
          });
          
          if (result.success) {
            console.log(`✅ ${name} inicializado correctamente`);
          } else {
            console.error(`❌ Error inicializando ${name}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error crítico inicializando ${name}:`, error);
          results.push({
            name,
            success: false,
            status: 'error',
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`🎯 Integraciones inicializadas: ${successCount}/${results.length}`);

      return {
        success: true,
        summary: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount
        },
        details: results
      };

    } catch (error) {
      console.error('❌ Error inicializando integraciones:', error);
      return { success: false, error: error.message };
    }
  }

  async getIntegrationStatus(integrationName = null) {
    try {
      if (integrationName) {
        const integration = this.integrations[integrationName];
        if (!integration) {
          return { success: false, error: 'Integración no encontrada' };
        }

        const status = await integration.getStatus();
        return { success: true, status };
      }

      // Obtener estado de todas las integraciones
      const statuses = {};
      for (const [name, integration] of Object.entries(this.integrations)) {
        try {
          statuses[name] = await integration.getStatus();
        } catch (error) {
          statuses[name] = {
            active: false,
            configured: false,
            lastCheck: new Date().toISOString(),
            error: error.message
          };
        }
      }

      return { success: true, statuses };

    } catch (error) {
      console.error('❌ Error obteniendo estado de integraciones:', error);
      return { success: false, error: error.message };
    }
  }

  async updateIntegrationConfig(integrationName, config) {
    try {
      const integration = this.integrations[integrationName];
      if (!integration) {
        return { success: false, error: 'Integración no encontrada' };
      }

      const result = await integration.updateConfig(config);
      
      if (result.success) {
        // Actualizar configuración en la base de datos
        await this.saveIntegrationConfig(integrationName, config);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error actualizando configuración de ${integrationName}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🔍 HEALTH CHECKS Y MONITOREO
  // ==============================================

  async performHealthChecks() {
    try {
      console.log('🔍 Ejecutando health checks de integraciones...');
      
      const healthResults = {};
      const timestamp = new Date().toISOString();

      for (const [name, integration] of Object.entries(this.integrations)) {
        try {
          const startTime = Date.now();
          const healthCheck = await integration.healthCheck();
          const responseTime = Date.now() - startTime;

          healthResults[name] = {
            ...healthCheck,
            responseTime,
            timestamp,
            trend: this.calculateHealthTrend(name, healthCheck.healthy)
          };

          // Actualizar cache de health checks
          this.healthChecks.set(name, healthResults[name]);

        } catch (error) {
          healthResults[name] = {
            healthy: false,
            error: error.message,
            responseTime: null,
            timestamp,
            trend: 'down'
          };
        }
      }

      this.lastHealthCheck = timestamp;

      // Guardar resultados en base de datos
      await this.saveHealthCheckResults(healthResults);

      // Detectar integraciones críticas con problemas
      const criticalIssues = Object.entries(healthResults)
        .filter(([name, result]) => !result.healthy && this.isCriticalIntegration(name))
        .map(([name, result]) => ({ name, error: result.error }));

      if (criticalIssues.length > 0) {
        await this.sendCriticalAlert(criticalIssues);
      }

      return {
        success: true,
        results: healthResults,
        summary: {
          total: Object.keys(healthResults).length,
          healthy: Object.values(healthResults).filter(r => r.healthy).length,
          critical: criticalIssues.length,
          lastCheck: timestamp
        }
      };

    } catch (error) {
      console.error('❌ Error ejecutando health checks:', error);
      return { success: false, error: error.message };
    }
  }

  calculateHealthTrend(integrationName, currentHealth) {
    const history = this.healthChecks.get(integrationName);
    if (!history) return 'stable';

    if (currentHealth && !history.healthy) return 'up';
    if (!currentHealth && history.healthy) return 'down';
    return 'stable';
  }

  isCriticalIntegration(name) {
    const criticalIntegrations = ['payments', 'email', 'whatsapp'];
    return criticalIntegrations.includes(name);
  }

  async sendCriticalAlert(issues) {
    try {
      const NotificationSystem = require('./notification-system');
      const notificationSystem = new NotificationSystem();

      await notificationSystem.sendAdminAlert({
        type: 'integration_critical',
        message: `${issues.length} integración(es) crítica(s) con problemas`,
        severity: 'critical',
        data: { issues }
      });

    } catch (error) {
      console.error('❌ Error enviando alerta crítica:', error);
    }
  }

  // ==============================================
  // 💾 PERSISTENCIA Y CONFIGURACIÓN
  // ==============================================

  async saveIntegrationConfig(integrationName, config) {
    try {
      await query(`
        INSERT INTO integration_configs (name, config, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (name) DO UPDATE SET
          config = EXCLUDED.config,
          updated_at = CURRENT_TIMESTAMP
      `, [integrationName, JSON.stringify(config)]);

    } catch (error) {
      console.error('❌ Error guardando configuración de integración:', error);
    }
  }

  async loadIntegrationConfig(integrationName) {
    try {
      const result = await query(`
        SELECT config FROM integration_configs 
        WHERE name = $1
      `, [integrationName]);

      if (result.rows.length > 0) {
        return JSON.parse(result.rows[0].config);
      }

      return null;

    } catch (error) {
      console.error('❌ Error cargando configuración de integración:', error);
      return null;
    }
  }

  async saveHealthCheckResults(results) {
    try {
      for (const [name, result] of Object.entries(results)) {
        await query(`
          INSERT INTO integration_health_checks 
          (integration_name, healthy, response_time, error_message, details, checked_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          name,
          result.healthy,
          result.responseTime,
          result.error || null,
          JSON.stringify(result.details || {}),
          result.timestamp
        ]);
      }

    } catch (error) {
      console.error('❌ Error guardando resultados de health check:', error);
    }
  }

  // ==============================================
  // 📊 ESTADÍSTICAS Y REPORTES
  // ==============================================

  async getIntegrationStats(period = '7d') {
    try {
      const intervals = {
        '24h': '1 day',
        '7d': '7 days',
        '30d': '30 days'
      };

      const interval = intervals[period] || '7 days';

      const uptime = await query(`
        SELECT 
          integration_name,
          COUNT(*) as total_checks,
          COUNT(CASE WHEN healthy = true THEN 1 END) as successful_checks,
          AVG(response_time) as avg_response_time,
          MAX(response_time) as max_response_time,
          COUNT(CASE WHEN healthy = false THEN 1 END) as failed_checks
        FROM integration_health_checks
        WHERE checked_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
        GROUP BY integration_name
        ORDER BY integration_name
      `);

      const incidents = await query(`
        SELECT 
          integration_name,
          DATE_TRUNC('hour', checked_at) as hour,
          COUNT(CASE WHEN healthy = false THEN 1 END) as failures
        FROM integration_health_checks
        WHERE checked_at >= CURRENT_TIMESTAMP - INTERVAL '${interval}'
        AND healthy = false
        GROUP BY integration_name, DATE_TRUNC('hour', checked_at)
        ORDER BY hour DESC
      `);

      const availability = uptime.rows.map(row => ({
        ...row,
        uptime_percentage: row.total_checks > 0 
          ? ((row.successful_checks / row.total_checks) * 100).toFixed(2)
          : 0,
        avg_response_time: row.avg_response_time ? parseFloat(row.avg_response_time).toFixed(0) : 0
      }));

      return {
        success: true,
        data: {
          period,
          availability,
          incidents: incidents.rows,
          summary: {
            totalIntegrations: availability.length,
            averageUptime: availability.length > 0 
              ? (availability.reduce((sum, int) => sum + parseFloat(int.uptime_percentage), 0) / availability.length).toFixed(2)
              : 0,
            totalIncidents: incidents.rows.length
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de integraciones:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🚀 INICIALIZACIÓN AUTOMÁTICA
  // ==============================================

  async startMonitoring() {
    try {
      console.log('🔍 Iniciando monitoreo automático de integraciones...');

      // Health check inicial
      await this.performHealthChecks();

      // Programar health checks cada 5 minutos
      setInterval(async () => {
        await this.performHealthChecks();
      }, 5 * 60 * 1000);

      // Reporte diario de estadísticas
      setInterval(async () => {
        const stats = await this.getIntegrationStats('24h');
        console.log('📊 Reporte diario de integraciones:', stats.data?.summary);
      }, 24 * 60 * 60 * 1000);

      console.log('✅ Monitoreo de integraciones iniciado');
      return { success: true };

    } catch (error) {
      console.error('❌ Error iniciando monitoreo:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==============================================
// 📱 WHATSAPP INTEGRATION
// ==============================================

class WhatsAppIntegration {
  constructor() {
    this.name = 'whatsapp';
    this.config = null;
  }

  async initialize() {
    try {
      await this.loadConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadConfig() {
    const SettingsManager = require('./settings-manager');
    const settingsManager = new SettingsManager();
    const integrationsConfig = await settingsManager.getIntegrationsConfig();
    
    if (integrationsConfig.success) {
      this.config = integrationsConfig.config.communication.whatsapp;
    }
  }

  async getStatus() {
    await this.loadConfig();
    return {
      active: this.config?.enabled || false,
      configured: !!(this.config?.accessToken && this.config?.businessAccountId),
      lastCheck: new Date().toISOString(),
      details: {
        hasToken: !!this.config?.accessToken,
        hasBusinessId: !!this.config?.businessAccountId,
        phoneConfigured: !!this.config?.phoneNumber
      }
    };
  }

  async healthCheck() {
    try {
      if (!this.config?.enabled || !this.config?.accessToken) {
        return { healthy: false, error: 'WhatsApp no configurado' };
      }

      // Simular health check (en implementación real, hacer ping a WhatsApp API)
      return { 
        healthy: true, 
        details: { 
          endpoint: 'WhatsApp Business API',
          lastMessage: new Date().toISOString()
        }
      };

    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }
}

// ==============================================
// 📧 EMAIL SERVICE INTEGRATION
// ==============================================

class EmailServiceIntegration {
  constructor() {
    this.name = 'email';
    this.config = null;
  }

  async initialize() {
    try {
      await this.loadConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadConfig() {
    const SettingsManager = require('./settings-manager');
    const settingsManager = new SettingsManager();
    const integrationsConfig = await settingsManager.getIntegrationsConfig();
    
    if (integrationsConfig.success) {
      this.config = integrationsConfig.config.communication.email;
    }
  }

  async getStatus() {
    await this.loadConfig();
    return {
      active: this.config?.enabled || false,
      configured: !!(this.config?.smtpHost && this.config?.fromEmail),
      lastCheck: new Date().toISOString(),
      details: {
        provider: this.config?.provider || 'smtp',
        hasSmtpConfig: !!this.config?.smtpHost,
        fromEmailConfigured: !!this.config?.fromEmail
      }
    };
  }

  async healthCheck() {
    try {
      if (!this.config?.enabled || !this.config?.smtpHost) {
        return { healthy: false, error: 'Email no configurado' };
      }

      // En implementación real, intentar conexión SMTP
      return { 
        healthy: true, 
        details: { 
          smtpHost: this.config.smtpHost,
          port: this.config.smtpPort || 587
        }
      };

    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }
}

// ==============================================
// 🗺️ MAPS INTEGRATION
// ==============================================

class MapsIntegration {
  constructor() {
    this.name = 'maps';
    this.config = null;
  }

  async initialize() {
    try {
      await this.loadConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadConfig() {
    const SettingsManager = require('./settings-manager');
    const settingsManager = new SettingsManager();
    const integrationsConfig = await settingsManager.getIntegrationsConfig();
    
    if (integrationsConfig.success) {
      this.config = integrationsConfig.config.external.maps;
    }
  }

  async getStatus() {
    await this.loadConfig();
    return {
      active: true, // Maps siempre activos
      configured: !!(this.config?.googleMapsApiKey || this.config?.mapboxToken),
      lastCheck: new Date().toISOString(),
      details: {
        provider: this.config?.provider || 'google',
        hasGoogleKey: !!this.config?.googleMapsApiKey,
        hasMapboxToken: !!this.config?.mapboxToken
      }
    };
  }

  async healthCheck() {
    try {
      if (this.config?.provider === 'google' && this.config?.googleMapsApiKey) {
        // En implementación real, hacer test call a Google Maps API
        return { 
          healthy: true, 
          details: { 
            provider: 'Google Maps',
            apiKey: 'configured'
          }
        };
      }

      return { healthy: false, error: 'No hay proveedor de mapas configurado' };

    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }
}

// ==============================================
// 🌤️ WEATHER INTEGRATION
// ==============================================

class WeatherIntegration {
  constructor() {
    this.name = 'weather';
    this.config = null;
  }

  async initialize() {
    try {
      await this.loadConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadConfig() {
    const SettingsManager = require('./settings-manager');
    const settingsManager = new SettingsManager();
    const integrationsConfig = await settingsManager.getIntegrationsConfig();
    
    if (integrationsConfig.success) {
      this.config = integrationsConfig.config.external.weather;
    }
  }

  async getStatus() {
    await this.loadConfig();
    return {
      active: this.config?.enabled || false,
      configured: !!this.config?.apiKey,
      lastCheck: new Date().toISOString(),
      details: {
        provider: this.config?.provider || 'openweather',
        hasApiKey: !!this.config?.apiKey
      }
    };
  }

  async healthCheck() {
    try {
      if (!this.config?.enabled || !this.config?.apiKey) {
        return { healthy: false, error: 'Weather API no configurado' };
      }

      // En implementación real, hacer test call a weather API
      return { 
        healthy: true, 
        details: { 
          provider: this.config.provider,
          lastUpdate: new Date().toISOString()
        }
      };

    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }
}

// ==============================================
// 💱 CURRENCY INTEGRATION
// ==============================================

class CurrencyIntegration {
  constructor() {
    this.name = 'currency';
    this.config = null;
    this.lastRatesUpdate = null;
  }

  async initialize() {
    try {
      await this.loadConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadConfig() {
    const SettingsManager = require('./settings-manager');
    const settingsManager = new SettingsManager();
    const integrationsConfig = await settingsManager.getIntegrationsConfig();
    
    if (integrationsConfig.success) {
      this.config = integrationsConfig.config.external.currency;
    }
  }

  async getStatus() {
    await this.loadConfig();
    return {
      active: this.config?.enabled || false,
      configured: !!this.config?.apiKey,
      lastCheck: new Date().toISOString(),
      details: {
        provider: this.config?.provider || 'exchangerate-api',
        hasApiKey: !!this.config?.apiKey,
        updateInterval: this.config?.updateInterval || 3600,
        lastRatesUpdate: this.lastRatesUpdate
      }
    };
  }

  async healthCheck() {
    try {
      if (!this.config?.enabled || !this.config?.apiKey) {
        return { healthy: false, error: 'Currency API no configurado' };
      }

      // En implementación real, verificar tasas de cambio
      return { 
        healthy: true, 
        details: { 
          provider: this.config.provider,
          lastRatesUpdate: this.lastRatesUpdate || 'never'
        }
      };

    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }
}

// ==============================================
// 📊 ANALYTICS INTEGRATION
// ==============================================

class AnalyticsIntegration {
  constructor() {
    this.name = 'analytics';
    this.config = null;
  }

  async initialize() {
    try {
      await this.loadConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadConfig() {
    const SettingsManager = require('./settings-manager');
    const settingsManager = new SettingsManager();
    const integrationsConfig = await settingsManager.getIntegrationsConfig();
    
    if (integrationsConfig.success) {
      this.config = integrationsConfig.config.analytics;
    }
  }

  async getStatus() {
    await this.loadConfig();
    return {
      active: this.config?.googleAnalytics?.enabled || false,
      configured: !!(this.config?.googleAnalytics?.trackingId || this.config?.googleAnalytics?.measurementId),
      lastCheck: new Date().toISOString(),
      details: {
        googleAnalytics: !!this.config?.googleAnalytics?.enabled,
        facebookPixel: !!this.config?.facebookPixel?.enabled,
        hotjar: !!this.config?.hotjar?.enabled
      }
    };
  }

  async healthCheck() {
    try {
      // Analytics no requiere health check activo
      return { 
        healthy: true, 
        details: { 
          note: 'Analytics tracking is passive'
        }
      };

    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }
}

// ==============================================
// 💳 PAYMENT GATEWAYS INTEGRATION
// ==============================================

class PaymentGatewaysIntegration {
  constructor() {
    this.name = 'payments';
    this.config = null;
  }

  async initialize() {
    try {
      await this.loadConfig();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadConfig() {
    const SettingsManager = require('./settings-manager');
    const settingsManager = new SettingsManager();
    const paymentConfig = await settingsManager.getPaymentConfig();
    
    if (paymentConfig.success) {
      this.config = paymentConfig.config;
    }
  }

  async getStatus() {
    await this.loadConfig();
    return {
      active: this.config?.general?.enabled || false,
      configured: !!(this.config?.gateways?.mercadopago?.enabled || this.config?.gateways?.stripe?.enabled),
      lastCheck: new Date().toISOString(),
      details: {
        mercadopago: !!this.config?.gateways?.mercadopago?.enabled,
        stripe: !!this.config?.gateways?.stripe?.enabled,
        paypal: !!this.config?.gateways?.paypal?.enabled
      }
    };
  }

  async healthCheck() {
    try {
      if (!this.config?.general?.enabled) {
        return { healthy: false, error: 'Pagos no habilitados' };
      }

      // Verificar al menos un gateway configurado
      const hasConfiguredGateway = Object.values(this.config.gateways || {})
        .some(gateway => gateway.enabled);

      if (!hasConfiguredGateway) {
        return { healthy: false, error: 'No hay gateways de pago configurados' };
      }

      return { 
        healthy: true, 
        details: { 
          enabledGateways: Object.entries(this.config.gateways || {})
            .filter(([name, config]) => config.enabled)
            .map(([name]) => name)
        }
      };

    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
    return { success: true };
  }
}

module.exports = IntegrationsManager;
