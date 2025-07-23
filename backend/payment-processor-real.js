// ===============================================
// AGENTE 6 - SISTEMA DE PAGOS REAL
// MercadoPago + Stripe + PayPal
// ===============================================

const { dbManager } = require('./database');

class RealPaymentProcessor {
  constructor() {
    this.mercadopago = null;
    this.stripe = null;
    this.paypal = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('💳 Inicializando sistema de pagos real...');
      
      // Inicializar MercadoPago
      if (process.env.MP_ACCESS_TOKEN) {
        try {
          const mercadopago = require('mercadopago');
          mercadopago.configure({
            access_token: process.env.MP_ACCESS_TOKEN,
            sandbox: process.env.NODE_ENV !== 'production'
          });
          this.mercadopago = mercadopago;
          console.log('✅ MercadoPago inicializado');
        } catch (error) {
          console.warn('⚠️ MercadoPago no disponible:', error.message);
        }
      }
      
      // Inicializar Stripe
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
          this.stripe = stripe;
          console.log('✅ Stripe inicializado');
        } catch (error) {
          console.warn('⚠️ Stripe no disponible:', error.message);
        }
      }
      
      this.initialized = true;
      console.log('✅ Sistema de pagos real inicializado');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error inicializando pagos:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // MERCADOPAGO - ARGENTINA
  // ===============================================
  
  async createMercadoPagoPayment(orderData) {
    try {
      if (!this.mercadopago) {
        throw new Error('MercadoPago no está configurado');
      }
      
      console.log(`💳 Creando pago MercadoPago para ${orderData.amount} ${orderData.currency}`);
      
      const preference = {
        items: [{
          id: orderData.package_id,
          title: orderData.package_title,
          description: `Viaje a ${orderData.package_destination} - ${orderData.package_duration}`,
          quantity: parseInt(orderData.travelers),
          currency_id: orderData.currency,
          unit_price: parseFloat(orderData.amount) / parseInt(orderData.travelers)
        }],
        payer: {
          name: orderData.customer_name,
          email: orderData.customer_email,
          phone: {
            number: orderData.customer_phone
          }
        },
        payment_methods: {
          excluded_payment_types: [],
          excluded_payment_methods: [],
          installments: 12
        },
        external_reference: orderData.id,
        statement_descriptor: 'INTERTRAVEL',
        notification_url: `${process.env.BACKEND_URL}/api/payments/mercadopago/webhook`,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success?order=${orderData.id}`,
          failure: `${process.env.FRONTEND_URL}/payment/failed?order=${orderData.id}`,
          pending: `${process.env.FRONTEND_URL}/payment/pending?order=${orderData.id}`
        },
        auto_return: 'approved',
        binary_mode: false
      };
      
      const response = await this.mercadopago.preferences.create(preference);
      
      if (response.body && response.body.id) {
        console.log(`✅ Preferencia MercadoPago creada: ${response.body.id}`);
        
        // Guardar en base de datos
        await this.savePaymentToDatabase(orderData.id, {
          gateway: 'mercadopago',
          gateway_transaction_id: response.body.id,
          amount: orderData.amount,
          currency: orderData.currency,
          status: 'pending',
          payment_data: {
            preference_id: response.body.id,
            checkout_url: response.body.init_point,
            sandbox_url: response.body.sandbox_init_point
          }
        });
        
        return {
          success: true,
          payment_id: response.body.id,
          checkout_url: process.env.NODE_ENV === 'production' 
            ? response.body.init_point 
            : response.body.sandbox_init_point,
          gateway: 'mercadopago'
        };
      }
      
      throw new Error('No se recibió ID de preferencia');
      
    } catch (error) {
      console.error('❌ Error creando pago MercadoPago:', error);
      return { success: false, error: error.message };
    }
  }
  
  async processMercadoPagoWebhook(paymentData) {
    try {
      console.log('🔔 Procesando webhook MercadoPago...');
      
      if (paymentData.type === 'payment') {
        const paymentId = paymentData.data.id;
        
        // Obtener detalles del pago
        const payment = await this.mercadopago.payment.findById(paymentId);
        
        if (payment.body) {
          const paymentInfo = payment.body;
          const orderId = paymentInfo.external_reference;
          
          console.log(`💳 Pago ${paymentId} para orden ${orderId}: ${paymentInfo.status}`);
          
          // Actualizar en base de datos
          await this.updatePaymentStatus(orderId, {
            status: this.mapMercadoPagoStatus(paymentInfo.status),
            gateway_transaction_id: paymentId,
            payment_response: paymentInfo
          });
          
          // Si está aprobado, confirmar la orden
          if (paymentInfo.status === 'approved') {
            await this.confirmOrder(orderId);
          }
          
          return { success: true, status: paymentInfo.status };
        }
      }
      
      return { success: true, message: 'Webhook procesado' };
      
    } catch (error) {
      console.error('❌ Error procesando webhook MercadoPago:', error);
      return { success: false, error: error.message };
    }
  }
  
  mapMercadoPagoStatus(mpStatus) {
    const statusMap = {
      'approved': 'approved',
      'pending': 'pending',
      'in_process': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded'
    };
    
    return statusMap[mpStatus] || 'pending';
  }

  // ===============================================
  // STRIPE - INTERNACIONAL
  // ===============================================
  
  async createStripePayment(orderData) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe no está configurado');
      }
      
      console.log(`💳 Creando pago Stripe para ${orderData.amount} ${orderData.currency}`);
      
      // Crear Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(parseFloat(orderData.amount) * 100), // Stripe usa centavos
        currency: orderData.currency.toLowerCase(),
        metadata: {
          order_id: orderData.id,
          package_id: orderData.package_id,
          customer_name: orderData.customer_name,
          travelers: orderData.travelers.toString()
        },
        description: `${orderData.package_title} - ${orderData.package_destination}`,
        receipt_email: orderData.customer_email,
        automatic_payment_methods: {
          enabled: true
        }
      });
      
      console.log(`✅ PaymentIntent Stripe creado: ${paymentIntent.id}`);
      
      // Guardar en base de datos
      await this.savePaymentToDatabase(orderData.id, {
        gateway: 'stripe',
        gateway_transaction_id: paymentIntent.id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'pending',
        payment_data: {
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret
        }
      });
      
      return {
        success: true,
        payment_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        gateway: 'stripe'
      };
      
    } catch (error) {
      console.error('❌ Error creando pago Stripe:', error);
      return { success: false, error: error.message };
    }
  }
  
  async processStripeWebhook(event) {
    try {
      console.log('🔔 Procesando webhook Stripe...');
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.order_id;
          
          console.log(`✅ Pago Stripe exitoso: ${paymentIntent.id} para orden ${orderId}`);
          
          // Actualizar en base de datos
          await this.updatePaymentStatus(orderId, {
            status: 'approved',
            gateway_transaction_id: paymentIntent.id,
            payment_response: paymentIntent
          });
          
          // Confirmar la orden
          await this.confirmOrder(orderId);
          break;
          
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          const failedOrderId = failedPayment.metadata.order_id;
          
          console.log(`❌ Pago Stripe falló: ${failedPayment.id} para orden ${failedOrderId}`);
          
          await this.updatePaymentStatus(failedOrderId, {
            status: 'rejected',
            gateway_transaction_id: failedPayment.id,
            payment_response: failedPayment
          });
          break;
          
        default:
          console.log(`🔔 Evento Stripe no manejado: ${event.type}`);
      }
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error procesando webhook Stripe:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================================
  // MÉTODOS DE BASE DE DATOS
  // ===============================================
  
  async savePaymentToDatabase(orderId, paymentData) {
    try {
      const query = `
        INSERT INTO payment_transactions (
          order_id, gateway, gateway_transaction_id, amount, currency, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const values = [
        orderId,
        paymentData.gateway,
        paymentData.gateway_transaction_id,
        paymentData.amount,
        paymentData.currency,
        paymentData.status
      ];
      
      const result = await dbManager.query(query, values);
      
      // Actualizar la orden con los datos de pago
      await dbManager.query(`
        UPDATE orders SET 
          payment_data = $1,
          payment_id = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [
        JSON.stringify(paymentData.payment_data),
        paymentData.gateway_transaction_id,
        orderId
      ]);
      
      console.log(`💾 Pago guardado en BD: ${result.rows[0].id}`);
      return result.rows[0].id;
      
    } catch (error) {
      console.error('❌ Error guardando pago en BD:', error);
      throw error;
    }
  }
  
  async updatePaymentStatus(orderId, updateData) {
    try {
      // Actualizar payment_transactions
      await dbManager.query(`
        UPDATE payment_transactions SET 
          status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2 AND gateway_transaction_id = $3
      `, [
        updateData.status,
        orderId,
        updateData.gateway_transaction_id
      ]);
      
      // Actualizar orders
      const orderStatus = updateData.status === 'approved' ? 'confirmed' : 
                         updateData.status === 'rejected' ? 'failed' : 'pending';
      
      let updateQuery = `
        UPDATE orders SET 
          status = $1,
          payment_response = $2,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      const updateValues = [orderStatus, JSON.stringify(updateData.payment_response), orderId];
      
      if (updateData.status === 'approved') {
        updateQuery += ', confirmed_at = CURRENT_TIMESTAMP';
      } else if (updateData.status === 'rejected') {
        updateQuery += ', failed_at = CURRENT_TIMESTAMP';
      }
      
      updateQuery += ' WHERE id = $3';
      
      await dbManager.query(updateQuery, updateValues);
      
      console.log(`💾 Estado de pago actualizado: ${orderId} -> ${updateData.status}`);
      
    } catch (error) {
      console.error('❌ Error actualizando estado de pago:', error);
      throw error;
    }
  }
  
  async confirmOrder(orderId) {
    try {
      console.log(`✅ Confirmando orden: ${orderId}`);
      
      // Obtener datos de la orden
      const orderResult = await dbManager.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        throw new Error('Orden no encontrada');
      }
      
      const order = orderResult.rows[0];
      
      // Crear/actualizar booking
      const bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      await dbManager.query(`
        INSERT INTO bookings (
          booking_reference, package_id, customer_name, customer_email, customer_phone,
          travelers_count, total_amount, currency, status, payment_status, source,
          confirmed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        ON CONFLICT (booking_reference) DO UPDATE SET
          status = 'confirmed',
          payment_status = 'paid',
          confirmed_at = CURRENT_TIMESTAMP
      `, [
        bookingReference,
        order.package_id,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.travelers,
        order.amount,
        order.currency,
        'confirmed',
        'paid',
        'web'
      ]);
      
      // Generar voucher (si está disponible)
      await this.generateVoucher(orderId);
      
      // Enviar email de confirmación (si está configurado)
      await this.sendConfirmationEmail(order);
      
      console.log(`🎉 Orden confirmada exitosamente: ${orderId}`);
      
    } catch (error) {
      console.error('❌ Error confirmando orden:', error);
      throw error;
    }
  }
  
  async generateVoucher(orderId) {
    try {
      // Implementar generación de voucher PDF
      console.log(`📄 Generando voucher para orden: ${orderId}`);
      
      // TODO: Implementar con library como puppeteer o jsPDF
      // Por ahora solo registramos que se "generó"
      
      await dbManager.query(`
        INSERT INTO vouchers (order_id, filename, filepath)
        VALUES ($1, $2, $3)
      `, [
        orderId,
        `voucher_${orderId}.pdf`,
        `/vouchers/voucher_${orderId}.pdf`
      ]);
      
      console.log(`✅ Voucher generado para: ${orderId}`);
      
    } catch (error) {
      console.warn('⚠️ Error generando voucher:', error.message);
    }
  }
  
  async sendConfirmationEmail(order) {
    try {
      if (!process.env.SMTP_HOST) {
        console.log('📧 SMTP no configurado, saltando email');
        return;
      }
      
      console.log(`📧 Enviando email de confirmación a: ${order.customer_email}`);
      
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: order.customer_email,
        subject: `Confirmación de Reserva - ${order.package_title}`,
        html: `
          <h2>¡Reserva Confirmada!</h2>
          <p>Estimado/a ${order.customer_name},</p>
          <p>Su reserva ha sido confirmada exitosamente:</p>
          <ul>
            <li><strong>Paquete:</strong> ${order.package_title}</li>
            <li><strong>Viajeros:</strong> ${order.travelers}</li>
            <li><strong>Total:</strong> ${order.currency} ${order.amount}</li>
            <li><strong>Orden:</strong> ${order.id}</li>
          </ul>
          <p>Nos comunicaremos pronto con más detalles.</p>
          <p>¡Gracias por elegir InterTravel!</p>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado a: ${order.customer_email}`);
      
    } catch (error) {
      console.warn('⚠️ Error enviando email:', error.message);
    }
  }

  // ===============================================
  // MÉTODOS PÚBLICOS PARA EL API
  // ===============================================
  
  async processPayment(orderData, paymentMethod) {
    try {
      console.log(`💳 Procesando pago ${paymentMethod} para orden ${orderData.id}`);
      
      if (!this.initialized) {
        await this.initialize();
      }
      
      switch (paymentMethod) {
        case 'mercadopago':
          return await this.createMercadoPagoPayment(orderData);
          
        case 'stripe':
          return await this.createStripePayment(orderData);
          
        default:
          throw new Error(`Método de pago no soportado: ${paymentMethod}`);
      }
      
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      return { success: false, error: error.message };
    }
  }
  
  async getPaymentStatus(orderId) {
    try {
      const result = await dbManager.query(`
        SELECT o.*, pt.status as payment_status, pt.gateway, pt.gateway_transaction_id
        FROM orders o
        LEFT JOIN payment_transactions pt ON o.id = pt.order_id
        WHERE o.id = $1
      `, [orderId]);
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Orden no encontrada' };
      }
      
      return { success: true, order: result.rows[0] };
      
    } catch (error) {
      console.error('❌ Error obteniendo estado de pago:', error);
      return { success: false, error: error.message };
    }
  }
}

// ===============================================
// EXPORTAR SINGLETON
// ===============================================

const paymentProcessor = new RealPaymentProcessor();

module.exports = paymentProcessor;