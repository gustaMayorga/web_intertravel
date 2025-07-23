// ==============================================
// 💳 PROCESADOR DE PAGOS AVANZADO
// ==============================================
// Sistema robusto para procesar pagos con múltiples gateways y gestión completa

const { query } = require('../database');

class PaymentProcessor {
  constructor() {
    this.gateways = new Map();
    this.retryAttempts = 3;
    this.defaultTimeout = 30000; // 30 segundos
    this.processingQueue = [];
    this.isProcessing = false;
  }

  // ==============================================
  // 🎯 PROCESAMIENTO PRINCIPAL DE PAGOS
  // ==============================================

  async processPayment(paymentData) {
    try {
      const {
        bookingId,
        amount,
        currency = 'USD',
        paymentMethod = 'credit_card',
        customerData,
        gatewayPreference = 'auto',
        metadata = {},
        isDeposit = false,
        installments = 1
      } = paymentData;

      console.log(`💳 Procesando pago de ${amount} ${currency} para booking ${bookingId}`);

      // Validar datos de entrada
      const validation = this.validatePaymentData(paymentData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Crear registro de transacción
      const transaction = await this.createTransactionRecord({
        bookingId,
        amount,
        currency,
        paymentMethod,
        status: 'pending',
        metadata: {
          ...metadata,
          isDeposit,
          installments,
          customerData: this.sanitizeCustomerData(customerData)
        }
      });

      if (!transaction.success) {
        return { success: false, error: 'Error creando registro de transacción' };
      }

      const transactionId = transaction.transactionId;

      // Seleccionar gateway óptimo
      const gateway = await this.selectOptimalGateway(gatewayPreference, amount, currency, paymentMethod);
      if (!gateway.success) {
        await this.updateTransactionStatus(transactionId, 'failed', gateway.error);
        return { success: false, error: gateway.error };
      }

      // Preparar datos para el gateway
      const gatewayData = await this.prepareGatewayData(paymentData, gateway.gateway);

      // Procesar pago con el gateway seleccionado
      const paymentResult = await this.executePaymentWithRetry(
        gateway.gateway,
        gatewayData,
        transactionId
      );

      // Actualizar estado de la transacción
      await this.updateTransactionStatus(
        transactionId,
        paymentResult.success ? 'completed' : 'failed',
        paymentResult.error,
        paymentResult.gatewayResponse
      );

      // Si es exitoso, actualizar booking
      if (paymentResult.success) {
        await this.updateBookingPaymentStatus(bookingId, isDeposit, amount);
        await this.triggerPaymentNotifications(bookingId, paymentResult, isDeposit);
      }

      return {
        success: paymentResult.success,
        transactionId,
        gatewayTransactionId: paymentResult.gatewayTransactionId,
        amount,
        currency,
        paymentMethod,
        gateway: gateway.gateway.name,
        status: paymentResult.success ? 'completed' : 'failed',
        error: paymentResult.error,
        receiptUrl: paymentResult.receiptUrl,
        processingTime: Date.now() - transaction.startTime
      };

    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // ✅ VALIDACIÓN DE DATOS
  // ==============================================

  validatePaymentData(data) {
    const required = ['bookingId', 'amount', 'customerData'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
      return { valid: false, error: `Campos requeridos faltantes: ${missing.join(', ')}` };
    }

    // Validar monto
    if (data.amount <= 0 || data.amount > 100000) {
      return { valid: false, error: 'Monto inválido' };
    }

    // Validar datos del cliente
    const customerValidation = this.validateCustomerData(data.customerData);
    if (!customerValidation.valid) {
      return customerValidation;
    }

    // Validar moneda
    const supportedCurrencies = ['USD', 'ARS', 'EUR', 'BRL'];
    if (!supportedCurrencies.includes(data.currency)) {
      return { valid: false, error: 'Moneda no soportada' };
    }

    return { valid: true };
  }

  validateCustomerData(customerData) {
    const required = ['name', 'email'];
    const missing = required.filter(field => !customerData[field]);

    if (missing.length > 0) {
      return { valid: false, error: `Datos del cliente incompletos: ${missing.join(', ')}` };
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      return { valid: false, error: 'Email inválido' };
    }

    return { valid: true };
  }

  sanitizeCustomerData(customerData) {
    return {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone || '',
      document: customerData.document ? this.maskDocument(customerData.document) : ''
    };
  }

  maskDocument(document) {
    if (document.length <= 4) return document;
    const visible = document.slice(-4);
    const masked = '*'.repeat(document.length - 4);
    return masked + visible;
  }

  // ==============================================
  // 🏭 SELECCIÓN DE GATEWAY
  // ==============================================

  async selectOptimalGateway(preference, amount, currency, paymentMethod) {
    try {
      // Cargar configuración de gateways disponibles
      const availableGateways = await this.getAvailableGateways();
      
      if (availableGateways.length === 0) {
        return { success: false, error: 'No hay gateways de pago disponibles' };
      }

      // Si hay preferencia específica
      if (preference !== 'auto') {
        const preferredGateway = availableGateways.find(g => g.name === preference);
        if (preferredGateway && this.isGatewayCompatible(preferredGateway, currency, paymentMethod)) {
          return { success: true, gateway: preferredGateway };
        }
      }

      // Selección automática basada en criterios
      const scoredGateways = availableGateways.map(gateway => ({
        ...gateway,
        score: this.calculateGatewayScore(gateway, amount, currency, paymentMethod)
      }));

      // Ordenar por score descendente
      scoredGateways.sort((a, b) => b.score - a.score);

      const selectedGateway = scoredGateways[0];
      if (selectedGateway.score > 0) {
        return { success: true, gateway: selectedGateway };
      }

      return { success: false, error: 'No se encontró gateway compatible' };

    } catch (error) {
      console.error('❌ Error seleccionando gateway:', error);
      return { success: false, error: 'Error en selección de gateway' };
    }
  }

  async getAvailableGateways() {
    try {
      // Simular gateways disponibles (en implementación real, cargar de configuración)
      return [
        {
          name: 'mercadopago',
          displayName: 'MercadoPago',
          enabled: true,
          supportedCurrencies: ['ARS', 'USD', 'BRL'],
          supportedMethods: ['credit_card', 'debit_card', 'bank_transfer'],
          fees: { percentage: 2.9, fixed: 0 },
          maxAmount: 50000,
          reliability: 95,
          avgProcessingTime: 3000
        },
        {
          name: 'stripe',
          displayName: 'Stripe',
          enabled: true,
          supportedCurrencies: ['USD', 'EUR', 'ARS'],
          supportedMethods: ['credit_card', 'debit_card'],
          fees: { percentage: 2.9, fixed: 30 },
          maxAmount: 100000,
          reliability: 98,
          avgProcessingTime: 2000
        },
        {
          name: 'paypal',
          displayName: 'PayPal',
          enabled: false,
          supportedCurrencies: ['USD', 'EUR'],
          supportedMethods: ['paypal_account', 'credit_card'],
          fees: { percentage: 3.4, fixed: 0 },
          maxAmount: 25000,
          reliability: 92,
          avgProcessingTime: 5000
        }
      ].filter(gateway => gateway.enabled);

    } catch (error) {
      console.error('❌ Error obteniendo gateways disponibles:', error);
      return [];
    }
  }

  isGatewayCompatible(gateway, currency, paymentMethod) {
    return gateway.supportedCurrencies.includes(currency) &&
           gateway.supportedMethods.includes(paymentMethod);
  }

  calculateGatewayScore(gateway, amount, currency, paymentMethod) {
    let score = 0;

    // Compatibilidad (40 puntos)
    if (this.isGatewayCompatible(gateway, currency, paymentMethod)) {
      score += 40;
    } else {
      return 0; // No compatible = score 0
    }

    // Límite de monto (20 puntos)
    if (amount <= gateway.maxAmount) {
      score += 20;
    } else {
      return 0; // Excede límite = score 0
    }

    // Confiabilidad (20 puntos)
    score += (gateway.reliability / 100) * 20;

    // Velocidad de procesamiento (10 puntos) - menor tiempo = mejor score
    const speedScore = Math.max(0, 10 - (gateway.avgProcessingTime / 1000));
    score += speedScore;

    // Costo (10 puntos) - menor fee = mejor score
    const totalFee = (amount * gateway.fees.percentage / 100) + gateway.fees.fixed;
    const feePercentage = totalFee / amount * 100;
    const costScore = Math.max(0, 10 - feePercentage);
    score += costScore;

    return Math.round(score);
  }

  // ==============================================
  // 🔄 EJECUCIÓN CON REINTENTOS
  // ==============================================

  async executePaymentWithRetry(gateway, paymentData, transactionId) {
    let lastError = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`💳 Intento ${attempt}/${this.retryAttempts} con ${gateway.name}`);

        const result = await this.executePaymentWithGateway(gateway, paymentData);
        
        if (result.success) {
          console.log(`✅ Pago exitoso en intento ${attempt}`);
          return result;
        }

        lastError = result.error;
        
        // Verificar si el error es recuperable
        if (!this.isRecoverableError(result.error)) {
          console.log(`❌ Error no recuperable: ${result.error}`);
          break;
        }

        // Esperar antes del siguiente intento
        if (attempt < this.retryAttempts) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await this.sleep(delay);
        }

      } catch (error) {
        console.error(`❌ Error en intento ${attempt}:`, error);
        lastError = error.message;
        
        if (attempt < this.retryAttempts) {
          await this.sleep(this.calculateRetryDelay(attempt));
        }
      }
    }

    return {
      success: false,
      error: `Pago falló después de ${this.retryAttempts} intentos: ${lastError}`
    };
  }

  async executePaymentWithGateway(gateway, paymentData) {
    try {
      // Simular procesamiento según el gateway
      switch (gateway.name) {
        case 'mercadopago':
          return await this.processMercadoPagoPayment(paymentData);
        case 'stripe':
          return await this.processStripePayment(paymentData);
        case 'paypal':
          return await this.processPayPalPayment(paymentData);
        default:
          throw new Error(`Gateway ${gateway.name} no implementado`);
      }

    } catch (error) {
      console.error(`❌ Error ejecutando pago con ${gateway.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  isRecoverableError(error) {
    const recoverableErrors = [
      'timeout',
      'network_error',
      'server_error',
      'temporary_unavailable',
      'rate_limit'
    ];

    return recoverableErrors.some(recoverable => 
      error.toLowerCase().includes(recoverable)
    );
  }

  calculateRetryDelay(attempt) {
    // Exponential backoff: 1s, 2s, 4s...
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==============================================
  // 🏪 IMPLEMENTACIONES DE GATEWAYS
  // ==============================================

  async processMercadoPagoPayment(paymentData) {
    try {
      // Simular procesamiento de MercadoPago
      console.log('🇦🇷 Procesando con MercadoPago...');
      
      // Simular tiempo de procesamiento
      await this.sleep(Math.random() * 3000 + 1000);

      // Simular resultado (90% éxito)
      const success = Math.random() > 0.1;
      
      if (success) {
        return {
          success: true,
          gatewayTransactionId: `MP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'completed',
          receiptUrl: `https://mercadopago.com/receipt/${Date.now()}`,
          gatewayResponse: {
            gateway: 'mercadopago',
            statusCode: 'approved',
            authorizationCode: Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        };
      } else {
        return {
          success: false,
          error: 'Pago rechazado por el banco'
        };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processStripePayment(paymentData) {
    try {
      console.log('💳 Procesando con Stripe...');
      
      await this.sleep(Math.random() * 2000 + 500);

      const success = Math.random() > 0.08; // 92% éxito
      
      if (success) {
        return {
          success: true,
          gatewayTransactionId: `pi_${Math.random().toString(36).substr(2, 24)}`,
          status: 'completed',
          receiptUrl: `https://dashboard.stripe.com/payments/${Date.now()}`,
          gatewayResponse: {
            gateway: 'stripe',
            statusCode: 'succeeded',
            chargeId: `ch_${Math.random().toString(36).substr(2, 24)}`
          }
        };
      } else {
        return {
          success: false,
          error: 'Tarjeta declinada'
        };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processPayPalPayment(paymentData) {
    try {
      console.log('🟡 Procesando con PayPal...');
      
      await this.sleep(Math.random() * 5000 + 2000);

      const success = Math.random() > 0.12; // 88% éxito
      
      if (success) {
        return {
          success: true,
          gatewayTransactionId: `PAY-${Math.random().toString(36).substr(2, 17).toUpperCase()}`,
          status: 'completed',
          receiptUrl: `https://paypal.com/activity/payment/${Date.now()}`,
          gatewayResponse: {
            gateway: 'paypal',
            statusCode: 'COMPLETED',
            paypalOrderId: Math.random().toString(36).substr(2, 17).toUpperCase()
          }
        };
      } else {
        return {
          success: false,
          error: 'Fondos insuficientes'
        };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 💾 GESTIÓN DE TRANSACCIONES
  // ==============================================

  async createTransactionRecord(transactionData) {
    try {
      const result = await query(`
        INSERT INTO payment_transactions 
        (booking_id, amount, currency, payment_method, status, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        transactionData.bookingId,
        transactionData.amount,
        transactionData.currency,
        transactionData.paymentMethod,
        transactionData.status,
        JSON.stringify(transactionData.metadata)
      ]);

      return {
        success: true,
        transactionId: result.rows[0].id,
        startTime: Date.now()
      };

    } catch (error) {
      console.error('❌ Error creando registro de transacción:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTransactionStatus(transactionId, status, error = null, gatewayResponse = null) {
    try {
      await query(`
        UPDATE payment_transactions 
        SET 
          status = $1,
          error_message = $2,
          gateway_response = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [status, error, JSON.stringify(gatewayResponse), transactionId]);

      return { success: true };

    } catch (error) {
      console.error('❌ Error actualizando estado de transacción:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📝 ACTUALIZACIÓN DE BOOKING
  // ==============================================

  async updateBookingPaymentStatus(bookingId, isDeposit, amount) {
    try {
      if (isDeposit) {
        // Actualizar depósito
        await query(`
          UPDATE bookings 
          SET 
            deposit_paid = true,
            deposit_amount = $1,
            payment_status = CASE 
              WHEN total_amount <= $1 THEN 'paid'
              ELSE 'partial'
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [amount, bookingId]);
      } else {
        // Pago completo
        await query(`
          UPDATE bookings 
          SET 
            payment_status = 'paid',
            paid_amount = COALESCE(paid_amount, 0) + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [amount, bookingId]);
      }

      console.log(`✅ Estado de pago actualizado para booking ${bookingId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error actualizando estado de booking:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🔔 NOTIFICACIONES
  // ==============================================

  async triggerPaymentNotifications(bookingId, paymentResult, isDeposit) {
    try {
      // Enviar notificaciones al cliente y admin
      console.log(`🔔 Enviando notificaciones para booking ${bookingId}`);

      // Aquí se integraría con el sistema de notificaciones
      // Por ahora, solo logueamos
      console.log(`📧 Notificación enviada: Pago ${isDeposit ? 'de depósito' : 'completo'} procesado exitosamente`);

      return { success: true };

    } catch (error) {
      console.error('❌ Error enviando notificaciones:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🔄 REEMBOLSOS
  // ==============================================

  async processRefund(refundData) {
    try {
      const {
        transactionId,
        amount = null, // null = reembolso completo
        reason = 'customer_request',
        metadata = {}
      } = refundData;

      console.log(`💰 Procesando reembolso para transacción ${transactionId}`);

      // Obtener datos de la transacción original
      const originalTransaction = await query(`
        SELECT * FROM payment_transactions 
        WHERE id = $1 AND status = 'completed'
      `, [transactionId]);

      if (originalTransaction.rows.length === 0) {
        return { success: false, error: 'Transacción no encontrada o no completada' };
      }

      const transaction = originalTransaction.rows[0];
      const refundAmount = amount || transaction.amount;

      // Verificar que no exceda el monto original
      if (refundAmount > transaction.amount) {
        return { success: false, error: 'Monto de reembolso excede el pago original' };
      }

      // Crear registro de reembolso
      const refundRecord = await query(`
        INSERT INTO payment_refunds 
        (original_transaction_id, amount, reason, status, metadata, created_at)
        VALUES ($1, $2, $3, 'processing', $4, CURRENT_TIMESTAMP)
        RETURNING id
      `, [transactionId, refundAmount, reason, JSON.stringify(metadata)]);

      const refundId = refundRecord.rows[0].id;

      // Procesar reembolso según el gateway original
      const gatewayResponse = JSON.parse(transaction.gateway_response || '{}');
      const gateway = gatewayResponse.gateway;

      let refundResult;
      switch (gateway) {
        case 'mercadopago':
          refundResult = await this.processMercadoPagoRefund(transaction, refundAmount);
          break;
        case 'stripe':
          refundResult = await this.processStripeRefund(transaction, refundAmount);
          break;
        case 'paypal':
          refundResult = await this.processPayPalRefund(transaction, refundAmount);
          break;
        default:
          refundResult = { success: false, error: 'Gateway no soporta reembolsos' };
      }

      // Actualizar estado del reembolso
      await query(`
        UPDATE payment_refunds 
        SET 
          status = $1,
          gateway_refund_id = $2,
          error_message = $3,
          processed_at = $4
        WHERE id = $5
      `, [
        refundResult.success ? 'completed' : 'failed',
        refundResult.gatewayRefundId || null,
        refundResult.error || null,
        refundResult.success ? new Date() : null,
        refundId
      ]);

      if (refundResult.success) {
        // Actualizar estado del booking
        await this.updateBookingRefundStatus(transaction.booking_id, refundAmount);
      }

      return {
        success: refundResult.success,
        refundId,
        gatewayRefundId: refundResult.gatewayRefundId,
        amount: refundAmount,
        status: refundResult.success ? 'completed' : 'failed',
        error: refundResult.error
      };

    } catch (error) {
      console.error('❌ Error procesando reembolso:', error);
      return { success: false, error: error.message };
    }
  }

  async processMercadoPagoRefund(transaction, amount) {
    try {
      // Simular reembolso de MercadoPago
      await this.sleep(2000);
      
      const success = Math.random() > 0.05; // 95% éxito
      
      if (success) {
        return {
          success: true,
          gatewayRefundId: `MP_REFUND_${Date.now()}`
        };
      } else {
        return {
          success: false,
          error: 'Reembolso no permitido por el gateway'
        };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processStripeRefund(transaction, amount) {
    try {
      await this.sleep(1500);
      
      const success = Math.random() > 0.03; // 97% éxito
      
      if (success) {
        return {
          success: true,
          gatewayRefundId: `re_${Math.random().toString(36).substr(2, 24)}`
        };
      } else {
        return {
          success: false,
          error: 'Reembolso rechazado por Stripe'
        };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processPayPalRefund(transaction, amount) {
    try {
      await this.sleep(3000);
      
      const success = Math.random() > 0.08; // 92% éxito
      
      if (success) {
        return {
          success: true,
          gatewayRefundId: `REFUND-${Math.random().toString(36).substr(2, 17).toUpperCase()}`
        };
      } else {
        return {
          success: false,
          error: 'Reembolso no disponible en PayPal'
        };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateBookingRefundStatus(bookingId, refundAmount) {
    try {
      await query(`
        UPDATE bookings 
        SET 
          refunded_amount = COALESCE(refunded_amount, 0) + $1,
          payment_status = CASE 
            WHEN (COALESCE(refunded_amount, 0) + $1) >= total_amount THEN 'refunded'
            ELSE 'partial_refund'
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [refundAmount, bookingId]);

      console.log(`✅ Estado de reembolso actualizado para booking ${bookingId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error actualizando estado de reembolso:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📊 REPORTES Y ANÁLISIS
  // ==============================================

  async getPaymentAnalytics(period = '30d') {
    try {
      const intervals = {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days'
      };

      const interval = intervals[period] || '30 days';

      const analytics = await query(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status = 'completed' THEN amount END) as avg_transaction_amount,
          COUNT(DISTINCT booking_id) as unique_bookings
        FROM payment_transactions
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
      `);

      const gatewayStats = await query(`
        SELECT 
          JSON_EXTRACT(gateway_response, '$.gateway') as gateway,
          COUNT(*) as transactions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue
        FROM payment_transactions
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
        AND gateway_response IS NOT NULL
        GROUP BY JSON_EXTRACT(gateway_response, '$.gateway')
        ORDER BY revenue DESC
      `);

      const data = analytics.rows[0];
      const successRate = data.total_transactions > 0 ? 
        (data.successful_transactions / data.total_transactions * 100).toFixed(2) : 0;

      return {
        success: true,
        period,
        data: {
          summary: {
            totalTransactions: parseInt(data.total_transactions),
            successfulTransactions: parseInt(data.successful_transactions),
            failedTransactions: parseInt(data.failed_transactions),
            successRate: parseFloat(successRate),
            totalRevenue: parseFloat(data.total_revenue) || 0,
            avgTransactionAmount: parseFloat(data.avg_transaction_amount) || 0,
            uniqueBookings: parseInt(data.unique_bookings)
          },
          byGateway: gatewayStats.rows
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo analytics de pagos:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🛠️ UTILIDADES
  // ==============================================

  async prepareGatewayData(paymentData, gateway) {
    return {
      amount: paymentData.amount,
      currency: paymentData.currency,
      customer: paymentData.customerData,
      metadata: {
        bookingId: paymentData.bookingId,
        gateway: gateway.name,
        ...paymentData.metadata
      }
    };
  }

  generateTransactionReference() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TXN_${timestamp}_${random}`.toUpperCase();
  }
}

module.exports = PaymentProcessor;
