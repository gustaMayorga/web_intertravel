// ===============================================
// MÓDULO DE PAGOS UNIFICADO - INTERTRAVEL
// MercadoPago + Stripe Integration
// ===============================================

const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const axios = require('axios');

// Simulación de MercadoPago y Stripe (en producción usar librerías reales)
class PaymentProcessor {
  constructor() {
    this.mercadopagoConfig = {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-1234567890-mercadopago-token',
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || 'TEST-pub-key-mercadopago',
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || 'webhook-secret-mp'
    };

    this.stripeConfig = {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_stripe_secret_key',
      publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_stripe_public_key',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_stripe_webhook'
    };

    this.initializePaymentProviders();
  }

  initializePaymentProviders() {
    console.log('🔧 Inicializando proveedores de pago...');
    console.log('💳 MercadoPago configurado');
    console.log('💳 Stripe configurado');
  }

  // ===============================================
  // MERCADOPAGO INTEGRATION
  // ===============================================

  async createMercadoPagoPreference(orderData) {
    try {
      console.log('💰 Creando preferencia MercadoPago:', orderData.orderId);

      // En producción: usar la API real de MercadoPago
      // const mercadopago = require('mercadopago');
      // mercadopago.configure({ access_token: this.mercadopagoConfig.accessToken });

      // Simular creación de preferencia
      const preference = {
        id: `MP-${uuidv4()}`,
        init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=MP-${uuidv4()}`,
        sandbox_init_point: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=MP-${uuidv4()}`,
        items: [{
          id: orderData.packageId,
          title: orderData.packageTitle,
          description: orderData.packageDescription,
          quantity: 1,
          currency_id: 'USD',
          unit_price: orderData.amount
        }],
        payer: {
          email: orderData.customerEmail,
          name: orderData.customerName
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL || 'http://localhost:3005'}/checkout/success?orderId=${orderData.orderId}`,
          failure: `${process.env.FRONTEND_URL || 'http://localhost:3005'}/checkout/failure?orderId=${orderData.orderId}`,
          pending: `${process.env.FRONTEND_URL || 'http://localhost:3005'}/checkout/pending?orderId=${orderData.orderId}`
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:3002'}/api/payments/webhooks/mercadopago`,
        external_reference: orderData.orderId,
        expires: true,
        expiration_date_from: moment().format(),
        expiration_date_to: moment().add(24, 'hours').format()
      };

      return {
        success: true,
        preference: preference,
        paymentUrl: preference.sandbox_init_point,
        preferenceId: preference.id
      };

    } catch (error) {
      console.error('❌ Error creando preferencia MercadoPago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyMercadoPagoPayment(paymentId) {
    try {
      console.log('🔍 Verificando pago MercadoPago:', paymentId);

      // En producción: consultar API real
      // const payment = await mercadopago.payment.findById(paymentId);

      // Simular verificación de pago
      const payment = {
        id: paymentId,
        status: Math.random() > 0.1 ? 'approved' : 'rejected', // 90% de aprobación
        status_detail: 'accredited',
        transaction_amount: Math.floor(Math.random() * 3000) + 500,
        currency_id: 'USD',
        payer: {
          email: 'customer@example.com',
          identification: { number: '12345678', type: 'DNI' }
        },
        payment_method_id: 'visa',
        installments: 1,
        transaction_details: {
          net_received_amount: Math.floor(Math.random() * 3000) + 500
        },
        date_created: moment().format(),
        date_approved: moment().format(),
        external_reference: `ORDER-${Date.now()}`
      };

      return {
        success: true,
        payment: payment,
        status: payment.status,
        amount: payment.transaction_amount,
        currency: payment.currency_id
      };

    } catch (error) {
      console.error('❌ Error verificando pago MercadoPago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // STRIPE INTEGRATION
  // ===============================================

  async createStripePaymentIntent(orderData) {
    try {
      console.log('💳 Creando Payment Intent Stripe:', orderData.orderId);

      // En producción: usar Stripe SDK real
      // const stripe = require('stripe')(this.stripeConfig.secretKey);
      // const paymentIntent = await stripe.paymentIntents.create({...});

      // Simular creación de Payment Intent
      const paymentIntent = {
        id: `pi_${uuidv4().replace(/-/g, '')}`,
        amount: Math.round(orderData.amount * 100), // Stripe usa centavos
        currency: 'usd',
        status: 'requires_payment_method',
        client_secret: `pi_${uuidv4().replace(/-/g, '')}_secret_${uuidv4()}`,
        metadata: {
          orderId: orderData.orderId,
          packageId: orderData.packageId,
          customerEmail: orderData.customerEmail
        },
        automatic_payment_methods: {
          enabled: true
        }
      };

      return {
        success: true,
        paymentIntent: paymentIntent,
        clientSecret: paymentIntent.client_secret,
        publicKey: this.stripeConfig.publicKey
      };

    } catch (error) {
      console.error('❌ Error creando Payment Intent Stripe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyStripePayment(paymentIntentId) {
    try {
      console.log('🔍 Verificando pago Stripe:', paymentIntentId);

      // En producción: consultar Stripe API
      // const stripe = require('stripe')(this.stripeConfig.secretKey);
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Simular verificación
      const paymentIntent = {
        id: paymentIntentId,
        status: Math.random() > 0.05 ? 'succeeded' : 'payment_failed', // 95% de éxito
        amount: Math.floor(Math.random() * 300000) + 50000, // En centavos
        currency: 'usd',
        payment_method: {
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242'
          }
        },
        charges: {
          data: [{
            id: `ch_${uuidv4().replace(/-/g, '')}`,
            amount: Math.floor(Math.random() * 300000) + 50000,
            currency: 'usd',
            paid: true,
            receipt_url: 'https://pay.stripe.com/receipts/test_receipt'
          }]
        },
        created: Math.floor(Date.now() / 1000),
        metadata: {
          orderId: `ORDER-${Date.now()}`
        }
      };

      return {
        success: true,
        paymentIntent: paymentIntent,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convertir de centavos
        currency: paymentIntent.currency.toUpperCase()
      };

    } catch (error) {
      console.error('❌ Error verificando pago Stripe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // WEBHOOK HANDLERS
  // ===============================================

  async handleMercadoPagoWebhook(webhookData) {
    try {
      console.log('🔔 Webhook MercadoPago recibido:', webhookData.type);

      if (webhookData.type === 'payment') {
        const paymentId = webhookData.data.id;
        const verification = await this.verifyMercadoPagoPayment(paymentId);
        
        if (verification.success) {
          return {
            success: true,
            action: 'payment_processed',
            paymentData: verification.payment
          };
        }
      }

      return {
        success: true,
        action: 'webhook_ignored',
        reason: 'No payment type or verification failed'
      };

    } catch (error) {
      console.error('❌ Error procesando webhook MercadoPago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleStripeWebhook(webhookData, signature) {
    try {
      console.log('🔔 Webhook Stripe recibido:', webhookData.type);

      // En producción: verificar signature
      // const stripe = require('stripe')(this.stripeConfig.secretKey);
      // const event = stripe.webhooks.constructEvent(body, signature, this.stripeConfig.webhookSecret);

      if (webhookData.type === 'payment_intent.succeeded') {
        const paymentIntent = webhookData.data.object;
        
        return {
          success: true,
          action: 'payment_succeeded',
          paymentData: paymentIntent
        };
      }

      if (webhookData.type === 'payment_intent.payment_failed') {
        const paymentIntent = webhookData.data.object;
        
        return {
          success: true,
          action: 'payment_failed',
          paymentData: paymentIntent
        };
      }

      return {
        success: true,
        action: 'webhook_ignored',
        reason: 'Event type not handled'
      };

    } catch (error) {
      console.error('❌ Error procesando webhook Stripe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===============================================
  // UTILIDADES
  // ===============================================

  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORDER-${timestamp}-${random}`;
  }

  calculateProcessingFee(amount, provider) {
    // Cálculos reales de comisiones
    const fees = {
      mercadopago: {
        percentage: 0.0499, // 4.99%
        fixed: 0 // Sin comisión fija
      },
      stripe: {
        percentage: 0.029, // 2.9%
        fixed: 0.30 // $0.30 USD por transacción
      }
    };

    const config = fees[provider] || fees.stripe;
    const percentageFee = amount * config.percentage;
    const totalFee = percentageFee + config.fixed;

    return {
      amount: amount,
      fee: totalFee,
      net: amount - totalFee,
      provider: provider
    };
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  validateOrderData(orderData) {
    const required = ['orderId', 'packageId', 'packageTitle', 'amount', 'customerEmail', 'customerName'];
    const missing = required.filter(field => !orderData[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        errors: missing.map(field => `Missing required field: ${field}`)
      };
    }

    if (orderData.amount <= 0) {
      return {
        valid: false,
        errors: ['Amount must be greater than 0']
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.customerEmail)) {
      return {
        valid: false,
        errors: ['Invalid email format']
      };
    }

    return {
      valid: true,
      errors: []
    };
  }
}

module.exports = PaymentProcessor;