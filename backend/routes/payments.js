// ===============================================
// RUTAS DE PAGOS - INTERTRAVEL
// MercadoPago + Stripe + Vouchers + Emails + Derivación B2B2C
// ===============================================

const express = require('express');
const { query } = require('../database');
const PaymentProcessor = require('../modules/payments/PaymentProcessor');
const VoucherGenerator = require('../modules/payments/VoucherGenerator');
const EmailService = require('../modules/payments/EmailService');
const AgencyAssignmentEngine = require('../modules/agency-assignment');
const moment = require('moment');

const router = express.Router();

// Inicializar servicios
const paymentProcessor = new PaymentProcessor();
const voucherGenerator = new VoucherGenerator();
const emailService = new EmailService();

// ===============================================
// CREAR ORDEN DE PAGO
// ===============================================

router.post('/create-order', async (req, res) => {
  try {
    const {
      packageId,
      packageTitle,
      packageDestination,
      packageDuration,
      amount,
      currency = 'USD',
      customerName,
      customerEmail,
      customerPhone,
      travelers = 1,
      paymentMethod = 'mercadopago', // 'mercadopago' | 'stripe'
      specialRequests
    } = req.body;

    console.log('💰 Nueva orden de pago:', { packageId, customerEmail, amount, paymentMethod });

    // Validar datos requeridos
    const orderData = {
      orderId: paymentProcessor.generateOrderId(),
      packageId,
      packageTitle,
      packageDestination,
      packageDuration,
      amount: parseFloat(amount),
      currency,
      customerName,
      customerEmail,
      customerPhone,
      travelers: parseInt(travelers),
      paymentMethod,
      specialRequests
    };

    const validation = paymentProcessor.validateOrderData(orderData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Calcular comisiones
    const feeCalculation = paymentProcessor.calculateProcessingFee(amount, paymentMethod);

    // Guardar orden en base de datos
    const saveResult = await query(`
      INSERT INTO orders (
        id, package_id, package_title, package_destination, package_duration,
        amount, currency, customer_name, customer_email, customer_phone,
        travelers, payment_method, special_requests, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      orderData.orderId,
      packageId,
      packageTitle,
      packageDestination,
      packageDuration,
      amount,
      currency,
      customerName,
      customerEmail,
      customerPhone,
      travelers,
      paymentMethod,
      specialRequests,
      'pending',
      moment().toISOString()
    ]);

    console.log('💾 Orden guardada en BD:', orderData.orderId);

    // Crear preferencia/intent según método de pago
    let paymentResult;

    if (paymentMethod === 'mercadopago') {
      paymentResult = await paymentProcessor.createMercadoPagoPreference(orderData);
    } else if (paymentMethod === 'stripe') {
      paymentResult = await paymentProcessor.createStripePaymentIntent(orderData);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Método de pago no soportado'
      });
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Error creando orden de pago',
        details: paymentResult.error
      });
    }

    // Actualizar orden con datos de pago
    await query(`
      UPDATE orders 
      SET payment_id = $1, payment_data = $2, updated_at = $3
      WHERE id = $4
    `, [
      paymentResult.preferenceId || paymentResult.paymentIntent?.id,
      JSON.stringify(paymentResult),
      moment().toISOString(),
      orderData.orderId
    ]);

    res.json({
      success: true,
      order: {
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        paymentMethod: paymentMethod,
        fees: feeCalculation
      },
      payment: paymentResult,
      redirectUrl: paymentResult.paymentUrl || null,
      clientSecret: paymentResult.clientSecret || null
    });

  } catch (error) {
    console.error('❌ Error creando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// ===============================================
// WEBHOOK MERCADOPAGO
// ===============================================

router.post('/webhooks/mercadopago', async (req, res) => {
  try {
    console.log('🔔 Webhook MercadoPago recibido:', req.body);

    const webhookResult = await paymentProcessor.handleMercadoPagoWebhook(req.body);
    
    if (webhookResult.success && webhookResult.action === 'payment_processed') {
      const paymentData = webhookResult.paymentData;
      
      // Buscar orden por external_reference
      const orderResult = await query(`
        SELECT * FROM orders WHERE id = $1
      `, [paymentData.external_reference]);

      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        
        if (paymentData.status === 'approved') {
          await processSuccessfulPayment(order, paymentData, 'mercadopago');
        } else {
          await processFailedPayment(order, paymentData, 'mercadopago');
        }
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error procesando webhook MercadoPago:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ===============================================
// WEBHOOK STRIPE
// ===============================================

router.post('/webhooks/stripe', async (req, res) => {
  try {
    console.log('🔔 Webhook Stripe recibido:', req.body.type);

    const signature = req.get('stripe-signature');
    const webhookResult = await paymentProcessor.handleStripeWebhook(req.body, signature);
    
    if (webhookResult.success) {
      const paymentData = webhookResult.paymentData;
      
      if (webhookResult.action === 'payment_succeeded') {
        // Buscar orden por metadata
        const orderId = paymentData.metadata?.orderId;
        
        if (orderId) {
          const orderResult = await query(`
            SELECT * FROM orders WHERE id = $1
          `, [orderId]);

          if (orderResult.rows.length > 0) {
            const order = orderResult.rows[0];
            await processSuccessfulPayment(order, paymentData, 'stripe');
          }
        }
      } else if (webhookResult.action === 'payment_failed') {
        const orderId = paymentData.metadata?.orderId;
        
        if (orderId) {
          const orderResult = await query(`
            SELECT * FROM orders WHERE id = $1
          `, [orderId]);

          if (orderResult.rows.length > 0) {
            const order = orderResult.rows[0];
            await processFailedPayment(order, paymentData, 'stripe');
          }
        }
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Error procesando webhook Stripe:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ===============================================
// VERIFICAR ESTADO DE PAGO
// ===============================================

router.get('/verify/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔍 Verificando estado de orden:', orderId);

    // Buscar orden en BD
    const orderResult = await query(`
      SELECT * FROM orders WHERE id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada'
      });
    }

    const order = orderResult.rows[0];
    
    // Si ya está confirmada, devolver estado
    if (order.status === 'confirmed') {
      return res.json({
        success: true,
        order: {
          orderId: order.id,
          status: order.status,
          amount: order.amount,
          currency: order.currency,
          confirmedAt: order.confirmed_at
        }
      });
    }

    // Verificar pago en el proveedor
    let verificationResult;
    
    if (order.payment_method === 'mercadopago') {
      const paymentData = JSON.parse(order.payment_data || '{}');
      // En producción, obtener payment_id del webhook o query params
      verificationResult = await paymentProcessor.verifyMercadoPagoPayment('simulated-payment-id');
    } else if (order.payment_method === 'stripe') {
      const paymentData = JSON.parse(order.payment_data || '{}');
      verificationResult = await paymentProcessor.verifyStripePayment(paymentData.paymentIntent?.id);
    }

    if (verificationResult?.success && 
        (verificationResult.status === 'approved' || verificationResult.status === 'succeeded')) {
      // Procesar pago exitoso
      await processSuccessfulPayment(order, verificationResult, order.payment_method);
      
      return res.json({
        success: true,
        order: {
          orderId: order.id,
          status: 'confirmed',
          amount: verificationResult.amount,
          currency: verificationResult.currency
        }
      });
    }

    res.json({
      success: true,
      order: {
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency
      }
    });

  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error verificando estado de pago'
    });
  }
});

// ===============================================
// REINTENTO DE PAGO
// ===============================================

router.post('/retry/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body;

    console.log('🔄 Reintento de pago para orden:', orderId);

    // Buscar orden
    const orderResult = await query(`
      SELECT * FROM orders WHERE id = $1 AND status IN ('pending', 'failed')
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada o ya procesada'
      });
    }

    const order = orderResult.rows[0];
    
    // Crear nueva preferencia/intent
    const orderData = {
      orderId: order.id,
      packageId: order.package_id,
      packageTitle: order.package_title,
      packageDestination: order.package_destination,
      packageDuration: order.package_duration,
      amount: order.amount,
      currency: order.currency,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone
    };

    let paymentResult;

    if (paymentMethod === 'mercadopago') {
      paymentResult = await paymentProcessor.createMercadoPagoPreference(orderData);
    } else if (paymentMethod === 'stripe') {
      paymentResult = await paymentProcessor.createStripePaymentIntent(orderData);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Método de pago no soportado'
      });
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Error creando nuevo intento de pago'
      });
    }

    // Actualizar orden
    await query(`
      UPDATE orders 
      SET payment_method = $1, payment_id = $2, payment_data = $3, updated_at = $4
      WHERE id = $5
    `, [
      paymentMethod,
      paymentResult.preferenceId || paymentResult.paymentIntent?.id,
      JSON.stringify(paymentResult),
      moment().toISOString(),
      orderId
    ]);

    res.json({
      success: true,
      payment: paymentResult,
      redirectUrl: paymentResult.paymentUrl || null,
      clientSecret: paymentResult.clientSecret || null
    });

  } catch (error) {
    console.error('❌ Error en reintento de pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================

async function processSuccessfulPayment(order, paymentData, provider) {
  try {
    console.log('✅ Procesando pago exitoso para orden:', order.id);

    // Actualizar estado de la orden
    await query(`
      UPDATE orders 
      SET status = $1, confirmed_at = $2, transaction_id = $3, payment_response = $4
      WHERE id = $5
    `, [
      'confirmed',
      moment().toISOString(),
      paymentData.id || paymentData.transaction_id,
      JSON.stringify(paymentData),
      order.id
    ]);

    // Generar voucher
    const orderData = {
      orderId: order.id,
      packageId: order.package_id,
      packageTitle: order.package_title,
      packageDestination: order.package_destination,
      packageDuration: order.package_duration,
      amount: order.amount,
      currency: order.currency,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      travelers: order.travelers,
      paymentMethod: provider,
      transactionId: paymentData.id,
      status: 'confirmed'
    };

    const voucherResult = await voucherGenerator.generateVoucher(orderData);
    
    let voucherBuffer = null;
    if (voucherResult.success) {
      // En desarrollo, simular buffer del voucher
      voucherBuffer = Buffer.from('Voucher PDF simulado');
      console.log('📄 Voucher generado:', voucherResult.filename);
    }

    // Enviar email de confirmación
    const emailResult = await emailService.sendBookingConfirmation(orderData, voucherBuffer);
    
    if (emailResult.success) {
      console.log('📧 Email de confirmación enviado');
    }

    // 🎯 NUEVA FUNCIONALIDAD: DERIVACIÓN AUTOMÁTICA A AGENCIAS
    await assignOrderToAgency(orderData);

    console.log('🎉 Pago procesado completamente:', order.id);

  } catch (error) {
    console.error('❌ Error procesando pago exitoso:', error);
  }
}

// ===============================================
// DERIVACIÓN AUTOMÁTICA A AGENCIAS (NUEVA)
// ===============================================

async function assignOrderToAgency(orderData) {
  try {
    console.log('🎯 Iniciando derivación automática para orden:', orderData.orderId);

    // Ejecutar algoritmo de asignación
    const assignmentResult = await AgencyAssignmentEngine.assignOrderToAgency(orderData);

    if (assignmentResult.success) {
      console.log('✅ Orden derivada exitosamente:', {
        orderId: orderData.orderId,
        agencyCode: assignmentResult.assignment.agencyCode,
        agencyName: assignmentResult.assignment.agencyName,
        commissionAmount: assignmentResult.assignment.commissionAmount
      });

      // Registrar evento de derivación
      await query(`
        INSERT INTO admin_activity (
          action, resource_type, resource_id, details, created_at
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'order_assigned_to_agency',
        'order',
        orderData.orderId,
        JSON.stringify({
          agencyId: assignmentResult.assignment.agencyId,
          agencyCode: assignmentResult.assignment.agencyCode,
          commissionAmount: assignmentResult.assignment.commissionAmount,
          assignmentScore: assignmentResult.assignment.score
        }),
        moment().toISOString()
      ]);

    } else {
      console.log('⚠️ No se pudo derivar automáticamente:', assignmentResult.error);
      
      // Fallback: Asignar al admin para gestión manual
      await query(`
        INSERT INTO admin_activity (
          action, resource_type, resource_id, details, created_at
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        'order_requires_manual_assignment',
        'order',
        orderData.orderId,
        JSON.stringify({
          reason: assignmentResult.error,
          fallback: 'manual_assignment_required'
        }),
        moment().toISOString()
      ]);
    }

  } catch (error) {
    console.error('❌ Error en derivación automática:', error);
    
    // Log del error para seguimiento
    await query(`
      INSERT INTO admin_activity (
        action, resource_type, resource_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      'order_assignment_failed',
      'order',
      orderData.orderId,
      JSON.stringify({
        error: error.message,
        stack: error.stack?.substring(0, 500)
      }),
      moment().toISOString()
    ]);
  }
}

async function processFailedPayment(order, paymentData, provider) {
  try {
    console.log('❌ Procesando pago fallido para orden:', order.id);

    // Actualizar estado de la orden
    await query(`
      UPDATE orders 
      SET status = $1, failed_at = $2, failure_reason = $3, payment_response = $4
      WHERE id = $5
    `, [
      'failed',
      moment().toISOString(),
      paymentData.status_detail || paymentData.failure_reason || 'Payment failed',
      JSON.stringify(paymentData),
      order.id
    ]);

    // Enviar email de fallo
    const orderData = {
      orderId: order.id,
      packageTitle: order.package_title,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      amount: order.amount,
      currency: order.currency
    };

    const emailResult = await emailService.sendPaymentFailed(orderData);
    
    if (emailResult.success) {
      console.log('📧 Email de fallo enviado');
    }

    console.log('⚠️ Pago fallido procesado:', order.id);

  } catch (error) {
    console.error('❌ Error procesando pago fallido:', error);
  }
}

// ===============================================
// ESTADÍSTICAS DE PAGOS (ADMIN)
// ===============================================

router.get('/stats', async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders,
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'confirmed' THEN amount ELSE NULL END) as avg_order_value
      FROM orders
    `);

    const recentOrders = await query(`
      SELECT id, package_title, customer_name, amount, currency, status, created_at
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
      recentOrders: recentOrders.rows
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas'
    });
  }
});

module.exports = router;
