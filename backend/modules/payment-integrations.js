// ==============================================
// 💳 SISTEMA DE INTEGRACIONES DE PAGO
// ==============================================
// Gestión unificada de todos los proveedores de pago

const { query } = require('../database');
const axios = require('axios');
const crypto = require('crypto');

class PaymentIntegrations {
  constructor() {
    this.providers = {
      mercadopago: new MercadoPagoIntegration(),
      stripe: new StripeIntegration(),
      paypal: new PayPalIntegration()
    };
    this.defaultProvider = 'mercadopago';
  }

  // ==============================================
  // 🎯 GESTIÓN PRINCIPAL DE PAGOS
  // ==============================================

  async processPayment(paymentData) {
    try {
      const { provider = this.defaultProvider, amount, currency, ...data } = paymentData;
      
      console.log(`💳 Procesando pago con ${provider}: ${amount} ${currency}`);

      // Verificar que el proveedor esté disponible y configurado
      const isConfigured = await this.isProviderConfigured(provider);
      if (!isConfigured) {
        return { 
          success: false, 
          error: `Proveedor ${provider} no está configurado` 
        };
      }

      // Procesar pago con el proveedor específico
      const providerInstance = this.providers[provider];
      const result = await providerInstance.createPayment({
        amount,
        currency,
        ...data
      });

      // Guardar transacción en base de datos
      if (result.success) {
        await this.saveTransaction({
          provider,
          externalId: result.paymentId,
          amount,
          currency,
          status: result.status || 'pending',
          metadata: result.metadata || {}
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      return { success: false, error: error.message };
    }
  }

  async getPaymentStatus(paymentId, provider = null) {
    try {
      // Si no se especifica proveedor, buscar en la base de datos
      if (!provider) {
        const transaction = await this.getTransactionByExternalId(paymentId);
        if (!transaction.success) {
          return { success: false, error: 'Transacción no encontrada' };
        }
        provider = transaction.transaction.provider;
      }

      const providerInstance = this.providers[provider];
      if (!providerInstance) {
        return { success: false, error: 'Proveedor no válido' };
      }

      const result = await providerInstance.getPaymentStatus(paymentId);
      
      // Actualizar estado en base de datos si es diferente
      if (result.success && result.status) {
        await this.updateTransactionStatus(paymentId, result.status, provider);
      }

      return result;

    } catch (error) {
      console.error('❌ Error obteniendo estado de pago:', error);
      return { success: false, error: error.message };
    }
  }

  async refundPayment(paymentId, amount = null, reason = 'requested_by_customer') {
    try {
      const transaction = await this.getTransactionByExternalId(paymentId);
      if (!transaction.success) {
        return { success: false, error: 'Transacción no encontrada' };
      }

      const provider = transaction.transaction.provider;
      const providerInstance = this.providers[provider];
      
      const result = await providerInstance.refundPayment(paymentId, amount, reason);
      
      if (result.success) {
        await this.saveRefund({
          originalTransactionId: transaction.transaction.id,
          refundId: result.refundId,
          amount: amount || transaction.transaction.amount,
          reason,
          status: result.status
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Error procesando reembolso:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // ⚙️ CONFIGURACIÓN DE PROVEEDORES
  // ==============================================

  async isProviderConfigured(provider) {
    try {
      const providerInstance = this.providers[provider];
      if (!providerInstance) return false;

      return await providerInstance.isConfigured();

    } catch (error) {
      console.error(`❌ Error verificando configuración de ${provider}:`, error);
      return false;
    }
  }

  async getAvailableProviders() {
    try {
      const providers = [];
      
      for (const [name, instance] of Object.entries(this.providers)) {
        const isConfigured = await instance.isConfigured();
        providers.push({
          name,
          displayName: instance.displayName,
          configured: isConfigured,
          currencies: instance.supportedCurrencies,
          countries: instance.supportedCountries
        });
      }

      return { success: true, providers };

    } catch (error) {
      console.error('❌ Error obteniendo proveedores disponibles:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProviderConfig(provider, config) {
    try {
      const providerInstance = this.providers[provider];
      if (!providerInstance) {
        return { success: false, error: 'Proveedor no válido' };
      }

      await providerInstance.updateConfig(config);
      
      return { 
        success: true, 
        message: `Configuración de ${provider} actualizada` 
      };

    } catch (error) {
      console.error(`❌ Error actualizando configuración de ${provider}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📊 GESTIÓN DE TRANSACCIONES
  // ==============================================

  async saveTransaction(transactionData) {
    try {
      const {
        provider,
        externalId,
        amount,
        currency,
        status,
        bookingId = null,
        metadata = {}
      } = transactionData;

      const result = await query(`
        INSERT INTO payment_transactions 
        (provider, external_id, amount, currency, status, booking_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [provider, externalId, amount, currency, status, bookingId, JSON.stringify(metadata)]);

      return { success: true, transaction: result.rows[0] };

    } catch (error) {
      console.error('❌ Error guardando transacción:', error);
      return { success: false, error: error.message };
    }
  }

  async getTransactionByExternalId(externalId) {
    try {
      const result = await query(`
        SELECT * FROM payment_transactions 
        WHERE external_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [externalId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Transacción no encontrada' };
      }

      return { success: true, transaction: result.rows[0] };

    } catch (error) {
      console.error('❌ Error obteniendo transacción:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTransactionStatus(externalId, status, provider = null) {
    try {
      let sql = `
        UPDATE payment_transactions 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE external_id = $2
      `;
      let params = [status, externalId];

      if (provider) {
        sql += ' AND provider = $3';
        params.push(provider);
      }

      await query(sql, params);
      return { success: true };

    } catch (error) {
      console.error('❌ Error actualizando estado de transacción:', error);
      return { success: false, error: error.message };
    }
  }

  async saveRefund(refundData) {
    try {
      const result = await query(`
        INSERT INTO payment_refunds 
        (original_transaction_id, refund_id, amount, reason, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        refundData.originalTransactionId,
        refundData.refundId,
        refundData.amount,
        refundData.reason,
        refundData.status
      ]);

      return { success: true, refund: result.rows[0] };

    } catch (error) {
      console.error('❌ Error guardando reembolso:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📈 ESTADÍSTICAS Y REPORTES
  // ==============================================

  async getPaymentStats(period = '30d') {
    try {
      const intervals = {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
        '1y': '1 year'
      };

      const interval = intervals[period] || '30 days';

      const stats = await query(`
        SELECT 
          provider,
          currency,
          COUNT(*) as total_transactions,
          SUM(amount) as total_amount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          AVG(amount) as avg_amount
        FROM payment_transactions
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY provider, currency
        ORDER BY total_amount DESC
      `);

      const dailyStats = await query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as transactions,
          SUM(amount) as revenue,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful
        FROM payment_transactions
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      return {
        success: true,
        data: {
          period,
          byProvider: stats.rows,
          daily: dailyStats.rows
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de pagos:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==============================================
// 🇦🇷 MERCADOPAGO INTEGRATION
// ==============================================

class MercadoPagoIntegration {
  constructor() {
    this.displayName = 'MercadoPago';
    this.supportedCurrencies = ['ARS', 'USD', 'BRL'];
    this.supportedCountries = ['AR', 'BR', 'MX', 'CO', 'CL', 'PE', 'UY'];
    this.config = null;
  }

  async loadConfig() {
    if (this.config) return this.config;

    try {
      const SettingsManager = require('./settings-manager');
      const settingsManager = new SettingsManager();
      const paymentConfig = await settingsManager.getPaymentConfig();
      
      if (paymentConfig.success) {
        this.config = paymentConfig.config.gateways.mercadopago;
      }
      
      return this.config;
    } catch (error) {
      console.error('❌ Error cargando configuración de MercadoPago:', error);
      return null;
    }
  }

  async isConfigured() {
    const config = await this.loadConfig();
    return config && config.enabled && config.accessToken;
  }

  async createPayment(paymentData) {
    try {
      const config = await this.loadConfig();
      if (!config || !config.accessToken) {
        throw new Error('MercadoPago no está configurado');
      }

      const {
        amount,
        currency = 'ARS',
        description = 'Pago InterTravel',
        customerEmail,
        customerName,
        externalReference,
        successUrl,
        failureUrl,
        pendingUrl
      } = paymentData;

      const preferenceData = {
        items: [{
          title: description,
          quantity: 1,
          unit_price: amount,
          currency_id: currency
        }],
        payer: {
          email: customerEmail,
          name: customerName
        },
        external_reference: externalReference,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_types: [],
          installments: 12
        },
        notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`
      };

      const response = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
        preferenceData,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        checkoutUrl: response.data.init_point,
        sandboxUrl: response.data.sandbox_init_point,
        status: 'pending',
        metadata: {
          preferenceId: response.data.id,
          externalReference
        }
      };

    } catch (error) {
      console.error('❌ Error creando pago en MercadoPago:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const config = await this.loadConfig();
      if (!config || !config.accessToken) {
        throw new Error('MercadoPago no está configurado');
      }

      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`
          }
        }
      );

      const mpStatus = response.data.status;
      let normalizedStatus = 'pending';

      switch (mpStatus) {
        case 'approved':
          normalizedStatus = 'completed';
          break;
        case 'rejected':
        case 'cancelled':
          normalizedStatus = 'failed';
          break;
        case 'pending':
        case 'in_process':
        case 'in_mediation':
          normalizedStatus = 'pending';
          break;
        case 'refunded':
        case 'charged_back':
          normalizedStatus = 'refunded';
          break;
      }

      return {
        success: true,
        status: normalizedStatus,
        rawStatus: mpStatus,
        amount: response.data.transaction_amount,
        currency: response.data.currency_id,
        paymentMethod: response.data.payment_method_id,
        metadata: {
          statusDetail: response.data.status_detail,
          externalReference: response.data.external_reference
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estado de pago en MercadoPago:', error);
      return { success: false, error: error.message };
    }
  }

  async refundPayment(paymentId, amount = null, reason = 'requested_by_customer') {
    try {
      const config = await this.loadConfig();
      if (!config || !config.accessToken) {
        throw new Error('MercadoPago no está configurado');
      }

      const refundData = { amount };
      if (amount === null) {
        delete refundData.amount; // Reembolso total
      }

      const response = await axios.post(
        `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
        refundData,
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        refundId: response.data.id,
        status: 'completed',
        amount: response.data.amount,
        metadata: {
          reason,
          mpRefundId: response.data.id
        }
      };

    } catch (error) {
      console.error('❌ Error procesando reembolso en MercadoPago:', error);
      return { success: false, error: error.message };
    }
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
}

// ==============================================
// 💳 STRIPE INTEGRATION (Básica)
// ==============================================

class StripeIntegration {
  constructor() {
    this.displayName = 'Stripe';
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'ARS'];
    this.supportedCountries = ['US', 'AR', 'BR', 'MX', 'CA', 'GB', 'ES'];
    this.config = null;
  }

  async loadConfig() {
    if (this.config) return this.config;
    
    try {
      const SettingsManager = require('./settings-manager');
      const settingsManager = new SettingsManager();
      const paymentConfig = await settingsManager.getPaymentConfig();
      
      if (paymentConfig.success) {
        this.config = paymentConfig.config.gateways.stripe;
      }
      
      return this.config;
    } catch (error) {
      console.error('❌ Error cargando configuración de Stripe:', error);
      return null;
    }
  }

  async isConfigured() {
    const config = await this.loadConfig();
    return config && config.enabled && config.secretKey;
  }

  async createPayment(paymentData) {
    // Implementación básica - expandir según necesidades
    return { 
      success: false, 
      error: 'Stripe integration pendiente de implementación completa' 
    };
  }

  async getPaymentStatus(paymentId) {
    return { 
      success: false, 
      error: 'Stripe integration pendiente de implementación completa' 
    };
  }

  async refundPayment(paymentId, amount, reason) {
    return { 
      success: false, 
      error: 'Stripe integration pendiente de implementación completa' 
    };
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
}

// ==============================================
// 🟡 PAYPAL INTEGRATION (Básica)
// ==============================================

class PayPalIntegration {
  constructor() {
    this.displayName = 'PayPal';
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'];
    this.supportedCountries = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'IT'];
    this.config = null;
  }

  async loadConfig() {
    if (this.config) return this.config;
    
    try {
      const SettingsManager = require('./settings-manager');
      const settingsManager = new SettingsManager();
      const paymentConfig = await settingsManager.getPaymentConfig();
      
      if (paymentConfig.success) {
        this.config = paymentConfig.config.gateways.paypal;
      }
      
      return this.config;
    } catch (error) {
      console.error('❌ Error cargando configuración de PayPal:', error);
      return null;
    }
  }

  async isConfigured() {
    const config = await this.loadConfig();
    return config && config.enabled && config.clientId && config.clientSecret;
  }

  async createPayment(paymentData) {
    // Implementación básica - expandir según necesidades
    return { 
      success: false, 
      error: 'PayPal integration pendiente de implementación completa' 
    };
  }

  async getPaymentStatus(paymentId) {
    return { 
      success: false, 
      error: 'PayPal integration pendiente de implementación completa' 
    };
  }

  async refundPayment(paymentId, amount, reason) {
    return { 
      success: false, 
      error: 'PayPal integration pendiente de implementación completa' 
    };
  }

  async updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
}

module.exports = PaymentIntegrations;
