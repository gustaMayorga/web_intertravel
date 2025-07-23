// ===============================================
// RUTAS DE INTEGRACIONES EXTERNAS - FASE 4
// ===============================================

const express = require('express');
const router = express.Router();

// Cargar middleware de autenticación
const {
  authenticateAdvanced,
  apiRateLimit,
  strictApiRateLimit,
  USER_ROLES,
  PERMISSIONS
} = require('../middleware/auth-advanced');

// Cargar módulos de integración
let whatsappModule, paymentProcessor, analyticsEngine;

try {
  whatsappModule = require('../modules/integrations/whatsapp');
  console.log('✅ WhatsApp integration loaded');
} catch (error) {
  console.warn('⚠️ WhatsApp integration not available:', error.message);
}

try {
  paymentProcessor = require('../modules/payments/PaymentProcessor');
  console.log('✅ Payment processor loaded');
} catch (error) {
  console.warn('⚠️ Payment processor not available:', error.message);
}

try {
  analyticsEngine = require('../modules/business-intelligence/analytics-engine');
  console.log('✅ Analytics engine loaded');
} catch (error) {
  console.warn('⚠️ Analytics engine not available:', error.message);
}

// ===============================================
// APLICAR RATE LIMITING
// ===============================================
router.use(apiRateLimit);

// ===============================================
// WHATSAPP BUSINESS API INTEGRATION
// ===============================================

/**
 * POST /api/integrations/whatsapp/send-message
 * Enviar mensaje directo por WhatsApp
 */
router.post('/whatsapp/send-message', 
  authenticateAdvanced(PERMISSIONS.ADMIN_WRITE), 
  async (req, res) => {
    try {
      const { phone, message, type = 'text' } = req.body;

      if (!phone || !message) {
        return res.status(400).json({
          success: false,
          error: 'Teléfono y mensaje son requeridos'
        });
      }

      if (!whatsappModule) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp integration no disponible'
        });
      }

      // Enviar mensaje
      const result = await whatsappModule.sendMessage(phone, message, type);

      console.log(`📱 WhatsApp message sent to ${phone} by ${req.user.email}`);

      res.json({
        success: true,
        data: result,
        message: 'Mensaje enviado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      res.status(500).json({
        success: false,
        error: 'Error enviando mensaje WhatsApp'
      });
    }
  }
);

/**
 * POST /api/integrations/whatsapp/send-booking-confirmation
 * Enviar confirmación de reserva por WhatsApp
 */
router.post('/whatsapp/send-booking-confirmation',
  authenticateAdvanced(PERMISSIONS.BOOKING_UPDATE),
  async (req, res) => {
    try {
      const { bookingId, phone, customerName } = req.body;

      if (!bookingId || !phone) {
        return res.status(400).json({
          success: false,
          error: 'ID de reserva y teléfono son requeridos'
        });
      }

      if (!whatsappModule) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp integration no disponible'
        });
      }

      // Obtener detalles de la reserva
      const { query } = require('../database');
      const bookingResult = await query(
        `SELECT booking_reference, package_name, destination, travel_date, 
                total_amount, status, customer_name, customer_email
         FROM bookings WHERE id = $1`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reserva no encontrada'
        });
      }

      const booking = bookingResult.rows[0];

      // Generar mensaje de confirmación
      const message = `🎉 *Confirmación de Reserva - InterTravel*

¡Hola ${customerName || booking.customer_name}!

Tu reserva ha sido confirmada exitosamente:

📋 *Detalles de la Reserva:*
🆔 Referencia: ${booking.booking_reference}
📦 Paquete: ${booking.package_name}
🌍 Destino: ${booking.destination}
📅 Fecha: ${new Date(booking.travel_date).toLocaleDateString()}
💰 Total: $${booking.total_amount}

✅ Estado: ${booking.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}

📞 ¿Dudas? Responde a este mensaje
🌐 Más info: intertravel.com

¡Gracias por elegir InterTravel! ✈️`;

      // Enviar mensaje
      const result = await whatsappModule.sendMessage(phone, message, 'text');

      console.log(`📱 Booking confirmation sent to ${phone} for booking ${bookingId}`);

      res.json({
        success: true,
        data: result,
        message: 'Confirmación enviada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error sending booking confirmation:', error);
      res.status(500).json({
        success: false,
        error: 'Error enviando confirmación de reserva'
      });
    }
  }
);

/**
 * GET /api/integrations/whatsapp/config
 * Obtener configuración de WhatsApp
 */
router.get('/whatsapp/config',
  authenticateAdvanced(PERMISSIONS.ADMIN_READ),
  async (req, res) => {
    try {
      if (!whatsappModule) {
        return res.status(503).json({
          success: false,
          error: 'WhatsApp integration no disponible'
        });
      }

      const config = await whatsappModule.getConfig();

      res.json({
        success: true,
        data: config,
        message: 'Configuración WhatsApp obtenida'
      });

    } catch (error) {
      console.error('❌ Error getting WhatsApp config:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo configuración WhatsApp'
      });
    }
  }
);

// ===============================================
// PAYMENT INTEGRATION
// ===============================================

/**
 * POST /api/integrations/payments/create-preference
 * Crear preferencia de pago (MercadoPago/Stripe)
 */
router.post('/payments/create-preference',
  authenticateAdvanced(PERMISSIONS.BOOKING_CREATE),
  async (req, res) => {
    try {
      const { bookingId, amount, currency = 'ARS', provider = 'mercadopago' } = req.body;

      if (!bookingId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'ID de reserva y monto son requeridos'
        });
      }

      if (!paymentProcessor) {
        return res.status(503).json({
          success: false,
          error: 'Payment processor no disponible'
        });
      }

      // Crear instancia del procesador
      const processor = new paymentProcessor();

      // Obtener detalles de la reserva
      const { query } = require('../database');
      const bookingResult = await query(
        `SELECT booking_reference, package_name, customer_name, customer_email
         FROM bookings WHERE id = $1`,
        [bookingId]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reserva no encontrada'
        });
      }

      const booking = bookingResult.rows[0];

      // Preparar datos del pago
      const paymentData = {
        orderId: booking.booking_reference,
        amount: parseFloat(amount),
        currency,
        description: `${booking.package_name} - InterTravel`,
        customerEmail: booking.customer_email,
        customerName: booking.customer_name,
        metadata: {
          bookingId,
          bookingReference: booking.booking_reference
        }
      };

      let result;
      
      // Crear preferencia según el proveedor
      if (provider === 'mercadopago') {
        result = await processor.createMercadoPagoPreference(paymentData);
      } else if (provider === 'stripe') {
        result = await processor.createStripePaymentIntent(paymentData);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Proveedor de pago no soportado'
        });
      }

      console.log(`💳 Payment preference created for booking ${bookingId} with ${provider}`);

      res.json({
        success: true,
        data: result,
        message: 'Preferencia de pago creada exitosamente'
      });

    } catch (error) {
      console.error('❌ Error creating payment preference:', error);
      res.status(500).json({
        success: false,
        error: 'Error creando preferencia de pago'
      });
    }
  }
);

/**
 * POST /api/integrations/payments/webhook
 * Webhook para procesar notificaciones de pago
 */
router.post('/payments/webhook',
  strictApiRateLimit, // Rate limiting estricto para webhooks
  async (req, res) => {
    try {
      const { provider = 'mercadopago' } = req.query;
      const webhookData = req.body;

      if (!paymentProcessor) {
        return res.status(503).json({
          success: false,
          error: 'Payment processor no disponible'
        });
      }

      // Crear instancia del procesador
      const processor = new paymentProcessor();

      let result;

      // Procesar webhook según el proveedor
      if (provider === 'mercadopago') {
        result = await processor.processMercadoPagoWebhook(webhookData);
      } else if (provider === 'stripe') {
        result = await processor.processStripeWebhook(webhookData);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Proveedor de webhook no soportado'
        });
      }

      console.log(`🔔 Payment webhook processed for ${provider}:`, result.status);

      res.json({
        success: true,
        data: result,
        message: 'Webhook procesado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error processing payment webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Error procesando webhook de pago'
      });
    }
  }
);

// ===============================================
// ANALYTICS INTEGRATION
// ===============================================

/**
 * GET /api/integrations/analytics/dashboard
 * Métricas avanzadas para dashboard
 */
router.get('/analytics/dashboard',
  authenticateAdvanced(PERMISSIONS.ADMIN_READ),
  async (req, res) => {
    try {
      const { period = '30d' } = req.query;

      if (!analyticsEngine) {
        // Fallback a analytics básicos
        const { query } = require('../database');
        
        const basicStats = await query(`
          SELECT 
            COUNT(*) as total_bookings,
            COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
            SUM(total_amount) FILTER (WHERE status = 'confirmed') as total_revenue,
            COUNT(DISTINCT customer_email) as unique_customers
          FROM bookings
        `);

        return res.json({
          success: true,
          data: {
            basic: basicStats.rows[0],
            advanced: null
          },
          message: 'Analytics básicos obtenidos'
        });
      }

      // Usar analytics engine avanzado
      const analytics = new analyticsEngine();
      const dashboardData = await analytics.getDashboardMetrics(period);

      res.json({
        success: true,
        data: dashboardData,
        message: 'Analytics avanzados obtenidos'
      });

    } catch (error) {
      console.error('❌ Error getting analytics dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo analytics'
      });
    }
  }
);

/**
 * POST /api/integrations/analytics/track-event
 * Trackear evento personalizado
 */
router.post('/analytics/track-event',
  authenticateAdvanced(), // Cualquier usuario autenticado
  async (req, res) => {
    try {
      const { event, properties = {} } = req.body;

      if (!event) {
        return res.status(400).json({
          success: false,
          error: 'Evento es requerido'
        });
      }

      // Agregar info del usuario
      const eventData = {
        event,
        properties: {
          ...properties,
          userId: req.user.userId,
          userEmail: req.user.email,
          timestamp: new Date().toISOString()
        }
      };

      if (analyticsEngine) {
        const analytics = new analyticsEngine();
        await analytics.trackEvent(eventData);
      }

      // También log para debugging
      console.log(`📊 Event tracked: ${event} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Evento trackeado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error tracking event:', error);
      res.status(500).json({
        success: false,
        error: 'Error trackeando evento'
      });
    }
  }
);

// ===============================================
// HEALTH CHECK INTEGRACIONES
// ===============================================

/**
 * GET /api/integrations/health
 * Estado de todas las integraciones
 */
router.get('/health', async (req, res) => {
  try {
    const integrations = {
      whatsapp: {
        available: !!whatsappModule,
        status: whatsappModule ? 'active' : 'inactive',
        endpoints: whatsappModule ? ['send-message', 'send-booking-confirmation', 'config'] : []
      },
      payments: {
        available: !!paymentProcessor,
        status: paymentProcessor ? 'active' : 'inactive',
        providers: paymentProcessor ? ['mercadopago', 'stripe'] : [],
        endpoints: paymentProcessor ? ['create-preference', 'webhook'] : []
      },
      analytics: {
        available: !!analyticsEngine,
        status: analyticsEngine ? 'active' : 'inactive',
        endpoints: analyticsEngine ? ['dashboard', 'track-event'] : []
      }
    };

    res.json({
      success: true,
      data: integrations,
      message: 'Estado de integraciones obtenido',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error checking integrations health:', error);
    res.status(500).json({
      success: false,
      error: 'Error verificando estado de integraciones'
    });
  }
});

console.log('✅ Integrations router loaded successfully');
module.exports = router;
