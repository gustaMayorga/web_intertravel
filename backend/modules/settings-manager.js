// ==============================================
// 🔧 SISTEMA COMPLETO DE CONFIGURACIÓN ADMIN
// ==============================================
// Gestión centralizada de todas las configuraciones del sistema

const { query } = require('../database');
const fs = require('fs').promises;
const path = require('path');

class SettingsManager {
  constructor() {
    this.configCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
    this.lastCacheUpdate = null;
  }

  // ==============================================
  // 💾 CONFIGURACIONES GENERALES DEL SISTEMA
  // ==============================================

  async getSystemConfig(category = null, useCache = true) {
    try {
      // Verificar cache primero
      if (useCache && this.isValidCache()) {
        const cached = category ? this.configCache.get(category) : 
                      Object.fromEntries(this.configCache.entries());
        if (cached) {
          console.log(`📋 Configuración obtenida desde cache: ${category || 'todas'}`);
          return { success: true, config: cached };
        }
      }

      let sql = `
        SELECT category, key, value, description, data_type, is_public, 
               created_at, updated_at, updated_by
        FROM system_config 
        WHERE is_active = true
      `;
      let params = [];

      if (category) {
        sql += ' AND category = $1';
        params.push(category);
      }

      sql += ' ORDER BY category, sort_order, key';

      const result = await query(sql, params);
      
      // Procesar y agrupar por categoría
      const config = {};
      result.rows.forEach(row => {
        if (!config[row.category]) {
          config[row.category] = {};
        }
        
        config[row.category][row.key] = {
          value: this.parseConfigValue(row.value, row.data_type),
          description: row.description,
          dataType: row.data_type,
          isPublic: row.is_public,
          updatedAt: row.updated_at,
          updatedBy: row.updated_by
        };
      });

      // Actualizar cache
      this.updateCache(config);

      return { 
        success: true, 
        config: category ? config[category] : config 
      };

    } catch (error) {
      console.error('❌ Error obteniendo configuración del sistema:', error);
      return { success: false, error: error.message };
    }
  }

  async updateSystemConfig(category, key, value, options = {}) {
    try {
      const {
        description = '',
        dataType = 'string',
        isPublic = false,
        sortOrder = 100,
        updatedBy = 'admin'
      } = options;

      // Validar datos
      const validatedValue = this.validateConfigValue(value, dataType);
      if (validatedValue === null) {
        return { success: false, error: `Valor inválido para tipo ${dataType}` };
      }

      const result = await query(`
        INSERT INTO system_config 
        (category, key, value, description, data_type, is_public, sort_order, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (category, key) DO UPDATE SET
          value = EXCLUDED.value,
          description = EXCLUDED.description,
          data_type = EXCLUDED.data_type,
          is_public = EXCLUDED.is_public,
          sort_order = EXCLUDED.sort_order,
          updated_by = EXCLUDED.updated_by,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [category, key, JSON.stringify(validatedValue), description, dataType, isPublic, sortOrder, updatedBy]);

      // Limpiar cache
      this.clearCache();

      console.log(`✅ Configuración actualizada: ${category}.${key}`);
      return { success: true, config: result.rows[0] };

    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🏢 CONFIGURACIÓN DE EMPRESA
  // ==============================================

  async getCompanyConfig() {
    try {
      const result = await this.getSystemConfig('company');
      if (!result.success) return result;

      const config = result.config || {};
      
      // Estructura estándar de configuración de empresa
      const companyConfig = {
        basic: {
          name: config.name?.value || 'InterTravel',
          logo: config.logo?.value || '/images/logo.png',
          description: config.description?.value || 'Agencia de viajes premium',
          slogan: config.slogan?.value || 'Tu próximo destino nos espera',
          founded: config.founded?.value || '2020',
          licenses: config.licenses?.value || []
        },
        contact: {
          email: config.contact_email?.value || 'info@intertravel.com',
          phone: config.contact_phone?.value || '+54 9 261 123-4567',
          whatsapp: config.contact_whatsapp?.value || '+54 9 261 123-4567',
          address: config.address?.value || 'Mendoza, Argentina',
          workingHours: config.working_hours?.value || 'Lun-Vie 9:00-18:00'
        },
        social: {
          website: config.website?.value || 'https://intertravel.com',
          facebook: config.facebook?.value || '',
          instagram: config.instagram?.value || '',
          twitter: config.twitter?.value || '',
          linkedin: config.linkedin?.value || ''
        },
        business: {
          currency: config.default_currency?.value || 'USD',
          language: config.default_language?.value || 'es',
          timezone: config.timezone?.value || 'America/Argentina/Mendoza',
          taxId: config.tax_id?.value || '',
          businessType: config.business_type?.value || 'travel_agency'
        }
      };

      return { success: true, config: companyConfig };

    } catch (error) {
      console.error('❌ Error obteniendo configuración de empresa:', error);
      return { success: false, error: error.message };
    }
  }

  async updateCompanyConfig(section, data, updatedBy = 'admin') {
    try {
      const updates = [];
      const validSections = ['basic', 'contact', 'social', 'business'];
      
      if (!validSections.includes(section)) {
        return { success: false, error: 'Sección inválida' };
      }

      // Mapear campos a claves de configuración
      const fieldMapping = {
        basic: {
          name: 'name',
          logo: 'logo',
          description: 'description',
          slogan: 'slogan',
          founded: 'founded',
          licenses: 'licenses'
        },
        contact: {
          email: 'contact_email',
          phone: 'contact_phone',
          whatsapp: 'contact_whatsapp',
          address: 'address',
          workingHours: 'working_hours'
        },
        social: {
          website: 'website',
          facebook: 'facebook',
          instagram: 'instagram',
          twitter: 'twitter',
          linkedin: 'linkedin'
        },
        business: {
          currency: 'default_currency',
          language: 'default_language',
          timezone: 'timezone',
          taxId: 'tax_id',
          businessType: 'business_type'
        }
      };

      // Actualizar cada campo
      for (const [field, value] of Object.entries(data)) {
        const configKey = fieldMapping[section][field];
        if (configKey && value !== undefined) {
          const dataType = Array.isArray(value) ? 'array' : typeof value;
          const updateResult = await this.updateSystemConfig(
            'company', 
            configKey, 
            value, 
            { dataType, updatedBy }
          );
          
          if (updateResult.success) {
            updates.push(`${configKey}: actualizado`);
          }
        }
      }

      return { 
        success: true, 
        message: `Sección ${section} actualizada`,
        updates 
      };

    } catch (error) {
      console.error('❌ Error actualizando configuración de empresa:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 💳 CONFIGURACIÓN DE PAGOS
  // ==============================================

  async getPaymentConfig() {
    try {
      const result = await this.getSystemConfig('payments');
      if (!result.success) return result;

      const config = result.config || {};

      const paymentConfig = {
        general: {
          enabled: config.payments_enabled?.value ?? true,
          defaultCurrency: config.default_currency?.value || 'USD',
          acceptedCurrencies: config.accepted_currencies?.value || ['USD', 'ARS'],
          requireDeposit: config.require_deposit?.value ?? true,
          depositPercentage: config.deposit_percentage?.value || 30,
          taxPercentage: config.tax_percentage?.value || 21
        },
        gateways: {
          stripe: {
            enabled: config.stripe_enabled?.value ?? false,
            publicKey: config.stripe_public_key?.value || '',
            secretKey: config.stripe_secret_key?.value || '',
            webhookSecret: config.stripe_webhook_secret?.value || ''
          },
          mercadopago: {
            enabled: config.mercadopago_enabled?.value ?? true,
            publicKey: config.mp_public_key?.value || '',
            accessToken: config.mp_access_token?.value || '',
            clientId: config.mp_client_id?.value || '',
            clientSecret: config.mp_client_secret?.value || ''
          },
          paypal: {
            enabled: config.paypal_enabled?.value ?? false,
            clientId: config.paypal_client_id?.value || '',
            clientSecret: config.paypal_client_secret?.value || '',
            sandbox: config.paypal_sandbox?.value ?? true
          }
        },
        methods: {
          creditCard: config.accept_credit_card?.value ?? true,
          debitCard: config.accept_debit_card?.value ?? true,
          bankTransfer: config.accept_bank_transfer?.value ?? true,
          cash: config.accept_cash?.value ?? true,
          crypto: config.accept_crypto?.value ?? false
        }
      };

      return { success: true, config: paymentConfig };

    } catch (error) {
      console.error('❌ Error obteniendo configuración de pagos:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePaymentConfig(section, data, updatedBy = 'admin') {
    try {
      const validSections = ['general', 'gateways', 'methods'];
      if (!validSections.includes(section)) {
        return { success: false, error: 'Sección de pagos inválida' };
      }

      const updates = [];

      if (section === 'general') {
        const fieldMapping = {
          enabled: 'payments_enabled',
          defaultCurrency: 'default_currency',
          acceptedCurrencies: 'accepted_currencies',
          requireDeposit: 'require_deposit',
          depositPercentage: 'deposit_percentage',
          taxPercentage: 'tax_percentage'
        };

        for (const [field, value] of Object.entries(data)) {
          const configKey = fieldMapping[field];
          if (configKey && value !== undefined) {
            const dataType = Array.isArray(value) ? 'array' : typeof value;
            await this.updateSystemConfig('payments', configKey, value, { dataType, updatedBy });
            updates.push(configKey);
          }
        }
      }

      if (section === 'gateways') {
        for (const [gateway, settings] of Object.entries(data)) {
          for (const [setting, value] of Object.entries(settings)) {
            const configKey = `${gateway}_${setting.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
            if (value !== undefined) {
              const dataType = typeof value;
              const isSecret = setting.includes('secret') || setting.includes('Secret') || setting.includes('Key');
              await this.updateSystemConfig('payments', configKey, value, { 
                dataType, 
                updatedBy, 
                isPublic: !isSecret 
              });
              updates.push(configKey);
            }
          }
        }
      }

      if (section === 'methods') {
        const fieldMapping = {
          creditCard: 'accept_credit_card',
          debitCard: 'accept_debit_card',
          bankTransfer: 'accept_bank_transfer',
          cash: 'accept_cash',
          crypto: 'accept_crypto'
        };

        for (const [field, value] of Object.entries(data)) {
          const configKey = fieldMapping[field];
          if (configKey && value !== undefined) {
            await this.updateSystemConfig('payments', configKey, value, { 
              dataType: 'boolean', 
              updatedBy 
            });
            updates.push(configKey);
          }
        }
      }

      return { 
        success: true, 
        message: `Configuración de pagos actualizada: ${section}`,
        updates 
      };

    } catch (error) {
      console.error('❌ Error actualizando configuración de pagos:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🔗 CONFIGURACIÓN DE INTEGRACIONES
  // ==============================================

  async getIntegrationsConfig() {
    try {
      const result = await this.getSystemConfig('integrations');
      if (!result.success) return result;

      const config = result.config || {};

      const integrationsConfig = {
        communication: {
          whatsapp: {
            enabled: config.whatsapp_enabled?.value ?? true,
            businessAccountId: config.whatsapp_business_id?.value || '',
            accessToken: config.whatsapp_access_token?.value || '',
            webhookVerifyToken: config.whatsapp_webhook_token?.value || '',
            phoneNumber: config.whatsapp_phone?.value || ''
          },
          email: {
            enabled: config.email_enabled?.value ?? true,
            provider: config.email_provider?.value || 'smtp',
            smtpHost: config.smtp_host?.value || '',
            smtpPort: config.smtp_port?.value || 587,
            smtpUser: config.smtp_user?.value || '',
            smtpPassword: config.smtp_password?.value || '',
            fromEmail: config.from_email?.value || '',
            fromName: config.from_name?.value || 'InterTravel'
          },
          sms: {
            enabled: config.sms_enabled?.value ?? false,
            provider: config.sms_provider?.value || 'twilio',
            apiKey: config.sms_api_key?.value || '',
            apiSecret: config.sms_api_secret?.value || '',
            fromNumber: config.sms_from_number?.value || ''
          }
        },
        analytics: {
          googleAnalytics: {
            enabled: config.ga_enabled?.value ?? true,
            trackingId: config.ga_tracking_id?.value || '',
            measurementId: config.ga_measurement_id?.value || ''
          },
          facebookPixel: {
            enabled: config.fb_pixel_enabled?.value ?? false,
            pixelId: config.fb_pixel_id?.value || '',
            accessToken: config.fb_access_token?.value || ''
          },
          hotjar: {
            enabled: config.hotjar_enabled?.value ?? false,
            siteId: config.hotjar_site_id?.value || ''
          }
        },
        external: {
          maps: {
            provider: config.maps_provider?.value || 'google',
            googleMapsApiKey: config.google_maps_api_key?.value || '',
            mapboxToken: config.mapbox_token?.value || ''
          },
          weather: {
            enabled: config.weather_enabled?.value ?? true,
            provider: config.weather_provider?.value || 'openweather',
            apiKey: config.weather_api_key?.value || ''
          },
          currency: {
            enabled: config.currency_enabled?.value ?? true,
            provider: config.currency_provider?.value || 'exchangerate-api',
            apiKey: config.currency_api_key?.value || '',
            updateInterval: config.currency_update_interval?.value || 3600
          }
        }
      };

      return { success: true, config: integrationsConfig };

    } catch (error) {
      console.error('❌ Error obteniendo configuración de integraciones:', error);
      return { success: false, error: error.message };
    }
  }

  async updateIntegrationsConfig(section, subsection, data, updatedBy = 'admin') {
    try {
      const updates = [];
      
      // Construir el prefijo para las claves de configuración
      let prefix = '';
      if (section === 'communication') {
        prefix = subsection; // whatsapp_, email_, sms_
      } else if (section === 'analytics') {
        prefix = subsection === 'googleAnalytics' ? 'ga' : 
                 subsection === 'facebookPixel' ? 'fb_pixel' : subsection;
      } else if (section === 'external') {
        prefix = subsection === 'googleMaps' ? 'google_maps' : subsection;
      }

      // Actualizar cada campo
      for (const [field, value] of Object.entries(data)) {
        if (value !== undefined) {
          const configKey = `${prefix}_${field.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
          const dataType = typeof value;
          const isSecret = field.includes('secret') || field.includes('Secret') || 
                          field.includes('token') || field.includes('Token') ||
                          field.includes('key') || field.includes('Key') ||
                          field.includes('password') || field.includes('Password');

          await this.updateSystemConfig('integrations', configKey, value, { 
            dataType, 
            updatedBy,
            isPublic: !isSecret
          });
          updates.push(configKey);
        }
      }

      return { 
        success: true, 
        message: `Integración actualizada: ${section}.${subsection}`,
        updates 
      };

    } catch (error) {
      console.error('❌ Error actualizando configuración de integraciones:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🔧 UTILIDADES Y CACHE
  // ==============================================

  parseConfigValue(value, dataType) {
    try {
      const parsed = JSON.parse(value);
      
      switch (dataType) {
        case 'boolean':
          return Boolean(parsed);
        case 'number':
          return Number(parsed);
        case 'array':
          return Array.isArray(parsed) ? parsed : [parsed];
        case 'object':
          return typeof parsed === 'object' ? parsed : {};
        default:
          return parsed;
      }
    } catch {
      return value;
    }
  }

  validateConfigValue(value, dataType) {
    try {
      switch (dataType) {
        case 'boolean':
          return Boolean(value);
        case 'number':
          const num = Number(value);
          return isNaN(num) ? null : num;
        case 'array':
          return Array.isArray(value) ? value : null;
        case 'object':
          return typeof value === 'object' && value !== null ? value : null;
        case 'string':
        default:
          return String(value);
      }
    } catch {
      return null;
    }
  }

  isValidCache() {
    return this.lastCacheUpdate && 
           (Date.now() - this.lastCacheUpdate) < this.cacheExpiry &&
           this.configCache.size > 0;
  }

  updateCache(config) {
    this.configCache.clear();
    Object.entries(config).forEach(([category, categoryConfig]) => {
      this.configCache.set(category, categoryConfig);
    });
    this.lastCacheUpdate = Date.now();
  }

  clearCache() {
    this.configCache.clear();
    this.lastCacheUpdate = null;
  }

  // ==============================================
  // 📊 ESTADÍSTICAS DE CONFIGURACIÓN
  // ==============================================

  async getConfigStats() {
    try {
      const stats = await query(`
        SELECT 
          category,
          COUNT(*) as total_configs,
          COUNT(CASE WHEN is_public = true THEN 1 END) as public_configs,
          COUNT(CASE WHEN updated_at > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_updates,
          MAX(updated_at) as last_update
        FROM system_config 
        WHERE is_active = true
        GROUP BY category
        ORDER BY total_configs DESC
      `);

      const overallStats = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT category) as categories,
          COUNT(CASE WHEN is_public = true THEN 1 END) as public_total,
          AVG(CASE WHEN updated_at > CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as activity_rate
        FROM system_config 
        WHERE is_active = true
      `);

      return {
        success: true,
        data: {
          overall: overallStats.rows[0],
          byCategory: stats.rows,
          cacheStatus: {
            active: this.isValidCache(),
            entries: this.configCache.size,
            lastUpdate: this.lastCacheUpdate
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de configuración:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🚀 INICIALIZACIÓN DEL SISTEMA
  // ==============================================

  async initializeDefaultSettings() {
    try {
      console.log('🔧 Inicializando configuraciones por defecto...');

      // Configuraciones básicas de empresa
      const defaultCompanySettings = [
        ['company', 'name', 'InterTravel', 'Nombre de la empresa', 'string', true],
        ['company', 'logo', '/images/logo.png', 'Logo de la empresa', 'string', true],
        ['company', 'description', 'Agencia de viajes premium', 'Descripción de la empresa', 'string', true],
        ['company', 'contact_email', 'info@intertravel.com', 'Email de contacto', 'string', true],
        ['company', 'contact_phone', '+54 9 261 123-4567', 'Teléfono de contacto', 'string', true],
        ['company', 'default_currency', 'USD', 'Moneda por defecto', 'string', true],
        ['company', 'default_language', 'es', 'Idioma por defecto', 'string', true],
        ['company', 'timezone', 'America/Argentina/Mendoza', 'Zona horaria', 'string', true]
      ];

      // Configuraciones de pagos
      const defaultPaymentSettings = [
        ['payments', 'payments_enabled', true, 'Pagos habilitados', 'boolean', true],
        ['payments', 'default_currency', 'USD', 'Moneda por defecto para pagos', 'string', true],
        ['payments', 'accepted_currencies', ['USD', 'ARS'], 'Monedas aceptadas', 'array', true],
        ['payments', 'require_deposit', true, 'Requerir depósito', 'boolean', true],
        ['payments', 'deposit_percentage', 30, 'Porcentaje de depósito', 'number', true],
        ['payments', 'tax_percentage', 21, 'Porcentaje de impuestos', 'number', true],
        ['payments', 'mercadopago_enabled', true, 'MercadoPago habilitado', 'boolean', true]
      ];

      // Configuraciones de integraciones
      const defaultIntegrationSettings = [
        ['integrations', 'whatsapp_enabled', true, 'WhatsApp habilitado', 'boolean', true],
        ['integrations', 'email_enabled', true, 'Email habilitado', 'boolean', true],
        ['integrations', 'ga_enabled', true, 'Google Analytics habilitado', 'boolean', true],
        ['integrations', 'weather_enabled', true, 'Servicio de clima habilitado', 'boolean', true],
        ['integrations', 'currency_enabled', true, 'Conversión de moneda habilitada', 'boolean', true],
        ['integrations', 'maps_provider', 'google', 'Proveedor de mapas', 'string', true]
      ];

      const allSettings = [
        ...defaultCompanySettings,
        ...defaultPaymentSettings,
        ...defaultIntegrationSettings
      ];

      let created = 0;
      for (const [category, key, value, description, dataType, isPublic] of allSettings) {
        try {
          await query(`
            INSERT INTO system_config 
            (category, key, value, description, data_type, is_public, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, 'system')
            ON CONFLICT (category, key) DO NOTHING
          `, [category, key, JSON.stringify(value), description, dataType, isPublic]);
          created++;
        } catch (error) {
          console.error(`❌ Error creando configuración ${category}.${key}:`, error.message);
        }
      }

      console.log(`✅ Sistema de configuración inicializado: ${created} configuraciones`);
      return { success: true, message: `${created} configuraciones inicializadas` };

    } catch (error) {
      console.error('❌ Error inicializando configuraciones por defecto:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SettingsManager;
