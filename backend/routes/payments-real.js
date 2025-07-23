// ===============================================
// AGENTE 6 - RUTAS DE PAGOS REALES
// ===============================================

const express = require('express');
const router = express.Router();
const { dbManager } = require('../database');
const paymentProcessor = require('../payment-processor-real');

// ===============================================
// CREAR ORDEN DE PAGO
// ===============================================

router.post('/create-order', async (req, res) => {
  try {
    const {
      package_id,
      package_title,
      package_destination,
      package_duration,
      amount,
      currency = 'USD',
      customer_name,
      customer_email,
      customer_phone,
      travelers = 1,
      payment_method,
      special_requests
    } = req.body;

    // Validaciones básicas
    if (!package_id || !customer_name || !customer_email || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos faltantes'
      });
    }

    // Crear orden en la base de datos
    const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const orderQuery = `
      INSERT INTO orders (
        id, package_id, package_title, package_destination, package_duration,
        amount, currency, customer_name, customer_email, customer_phone,
        travelers, payment_method, special_requests, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const orderValues = [
      orderId, package_id, package_title, package_destination, package_duration,
      amount, currency, customer_name, customer_email, customer_phone,
      travelers, payment_method, special_requests, 'pending'
    ];

    const orderResult = await dbManager.query(orderQuery, orderValues);
    const order = orderResult.rows[0];

    console.log(`💳 Orden creada: ${orderId} - ${payment_method} - $${amount} ${currency}`);

    // Procesar pago según el método
    const paymentResult = await paymentProcessor.processPayment(order, payment_method);

    if (paymentResult.success) {
      res.json({
        success: true,
        order_id: orderId,
        payment_data: paymentResult
      });
    } else {
      // Si falla el pago, marcar orden como fallida
      await dbManager.query(
        'UPDATE orders SET status = $1, failure_reason = $2 WHERE id = $3',
        ['failed', paymentResult.error, orderId]
      );

      res.status(400).json({
        success: false,
        error: paymentResult.error,
        order_id: orderId
      });
    }

  } catch (error) {
    console.error('❌ Error creando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// CONSULTAR ESTADO DE ORDEN
// ===============================================

router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await paymentProcessor.getPaymentStatus(orderId);

    if (result.success) {
      res.json({
        success: true,
        order: result.order
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error consultando orden:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// WEBHOOK MERCADOPAGO
// ===============================================

router.post('/mercadopago/webhook', async (req, res) => {
  try {
    console.log('🔔 Webhook MercadoPago recibido');
    
    const result = await paymentProcessor.processMercadoPagoWebhook(req.body);
    
    if (result.success) {
      res.status(200).json({ message: 'Webhook procesado' });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('❌ Error procesando webhook MercadoPago:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ===============================================
// WEBHOOK STRIPE
// ===============================================

router.post('/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    console.log('🔔 Webhook Stripe recibido');
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const result = await paymentProcessor.processStripeWebhook(event);
    
    if (result.success) {
      res.status(200).json({ received: true });
    } else {
      res.status(400).json({ error: result.error });
    }

  } catch (error) {
    console.error('❌ Error procesando webhook Stripe:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ===============================================
// CONFIRMAR PAGO MANUAL (ADMIN)
// ===============================================

router.post('/confirm/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // TODO: Agregar autenticación de admin aquí
    
    // Confirmar orden manualmente
    await dbManager.query(`
      UPDATE orders SET 
        status = 'confirmed',
        confirmed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId]);

    // Crear booking
    const bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const orderResult = await dbManager.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderResult.rows[0];

    await dbManager.query(`
      INSERT INTO bookings (
        booking_reference, package_id, customer_name, customer_email, customer_phone,
        travelers_count, total_amount, currency, status, payment_status, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      'manual'
    ]);

    console.log(`✅ Pago confirmado manualmente: ${orderId}`);

    res.json({
      success: true,
      message: 'Pago confirmado exitosamente',
      booking_reference: bookingReference
    });

  } catch (error) {
    console.error('❌ Error confirmando pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// LISTAR ÓRDENES (ADMIN)
// ===============================================

router.get('/orders', async (req, res) => {
  try {
    const {
      status,
      payment_method,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT o.*, pt.status as payment_status, pt.gateway, pt.gateway_transaction_id
      FROM orders o
      LEFT JOIN payment_transactions pt ON o.id = pt.order_id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      values.push(status);
    }

    if (payment_method) {
      paramCount++;
      query += ` AND o.payment_method = $${paramCount}`;
      values.push(payment_method);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await dbManager.query(query, values);

    // Contar total
    const countResult = await dbManager.query('SELECT COUNT(*) as total FROM orders');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      orders: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + result.rows.length) < total
      }
    });

  } catch (error) {
    console.error('❌ Error listando órdenes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// ESTADÍSTICAS DE PAGOS (ADMIN)
// ===============================================

router.get('/stats', async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Estadísticas básicas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders,
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'confirmed' THEN amount ELSE NULL END) as avg_order_value
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
    `;

    const statsResult = await dbManager.query(statsQuery);
    const stats = statsResult.rows[0];

    // Estadísticas por método de pago
    const methodsQuery = `
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as revenue
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
      GROUP BY payment_method
      ORDER BY revenue DESC
    `;

    const methodsResult = await dbManager.query(methodsQuery);

    // Ventas por día (últimos 7 días)
    const dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as revenue
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const dailyResult = await dbManager.query(dailyQuery);

    res.json({
      success: true,
      stats: {
        overview: {
          total_orders: parseInt(stats.total_orders),
          confirmed_orders: parseInt(stats.confirmed_orders),
          pending_orders: parseInt(stats.pending_orders),
          failed_orders: parseInt(stats.failed_orders),
          total_revenue: parseFloat(stats.total_revenue) || 0,
          avg_order_value: parseFloat(stats.avg_order_value) || 0,
          conversion_rate: stats.total_orders > 0 ? 
            (stats.confirmed_orders / stats.total_orders * 100).toFixed(2) : 0
        },
        by_payment_method: methodsResult.rows,
        daily_sales: dailyResult.rows,
        period: parseInt(period)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// REEMBOLSO (ADMIN)
// ===============================================

router.post('/refund/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    // TODO: Implementar reembolso real en MercadoPago/Stripe
    
    // Por ahora solo marcamos como reembolsado en BD
    await dbManager.query(`
      UPDATE orders SET 
        status = 'refunded',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId]);

    await dbManager.query(`
      UPDATE payment_transactions SET 
        status = 'refunded',
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [orderId]);

    console.log(`💰 Reembolso procesado: ${orderId} - ${reason}`);

    res.json({
      success: true,
      message: 'Reembolso procesado exitosamente',
      order_id: orderId
    });

  } catch (error) {
    console.error('❌ Error procesando reembolso:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===============================================
// TEST DE PAGOS (DESARROLLO)
// ===============================================

router.post('/test-payment', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Endpoint de test no disponible en producción'
      });
    }

    const testOrder = {
      id: `TEST${Date.now()}`,
      package_id: 'test-package',
      package_title: 'Paquete de Prueba',
      package_destination: 'Destino Test',
      package_duration: '7 días / 6 noches',
      amount: 100,
      currency: 'USD',
      customer_name: 'Usuario Test',
      customer_email: 'test@example.com',
      customer_phone: '+54 261 123-4567',
      travelers: 1
    };

    const { payment_method = 'mercadopago' } = req.body;

    const result = await paymentProcessor.processPayment(testOrder, payment_method);

    res.json({
      success: true,
      message: 'Pago de prueba creado',
      test_order: testOrder,
      payment_result: result
    });

  } catch (error) {
    console.error('❌ Error en test de pago:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;