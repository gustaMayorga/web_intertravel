// ==============================================
// 🔔 SISTEMA DE NOTIFICACIONES DE RESERVAS
// ==============================================
// Gestión especializada de notificaciones para el ciclo de vida de las reservas

const { query } = require('../database');

class BookingNotifications {
  constructor() {
    this.notificationTypes = new Map();
    this.scheduledNotifications = new Map();
    this.templates = new Map();
    this.initializeNotificationTypes();
  }

  // ==============================================
  // 🎯 INICIALIZACIÓN DE TIPOS DE NOTIFICACIÓN
  // ==============================================

  initializeNotificationTypes() {
    this.notificationTypes.set('booking_created', {
      name: 'Reserva Creada',
      channels: ['email', 'whatsapp'],
      priority: 'high',
      immediate: true
    });

    this.notificationTypes.set('booking_confirmed', {
      name: 'Reserva Confirmada',
      channels: ['email', 'whatsapp'],
      priority: 'high',
      immediate: true
    });

    this.notificationTypes.set('payment_received', {
      name: 'Pago Recibido',
      channels: ['email', 'whatsapp'],
      priority: 'high',
      immediate: true
    });

    this.notificationTypes.set('payment_reminder', {
      name: 'Recordatorio de Pago',
      channels: ['email', 'whatsapp'],
      priority: 'high',
      immediate: false
    });

    this.notificationTypes.set('travel_reminder', {
      name: 'Recordatorio de Viaje',
      channels: ['email', 'whatsapp'],
      priority: 'medium',
      immediate: false
    });
  }

  // ==============================================
  // 📨 ENVÍO DE NOTIFICACIONES PRINCIPALES
  // ==============================================

  async sendBookingCreatedNotification(bookingData) {
    try {
      const { booking, customer, package: packageInfo } = bookingData;

      console.log(`🔔 Enviando notificación de reserva creada: ${booking.booking_reference}`);

      const notification = await this.createNotification({
        type: 'booking_created',
        bookingId: booking.id,
        recipient: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        data: {
          bookingReference: booking.booking_reference,
          customerName: customer.name,
          packageTitle: packageInfo.title,
          destination: packageInfo.destination,
          travelDate: booking.travel_date,
          travelers: booking.travelers_count,
          totalAmount: booking.total_amount,
          currency: booking.currency
        }
      });

      await this.schedulePaymentReminders(booking);
      await this.scheduleTravelReminders(booking);

      return notification;

    } catch (error) {
      console.error('❌ Error enviando notificación de reserva creada:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentReceivedNotification(paymentData) {
    try {
      const { booking, customer, payment, package: packageInfo } = paymentData;

      return await this.createNotification({
        type: 'payment_received',
        bookingId: booking.id,
        recipient: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        data: {
          bookingReference: booking.booking_reference,
          customerName: customer.name,
          packageTitle: packageInfo.title,
          paymentAmount: payment.amount,
          currency: payment.currency,
          transactionId: payment.transactionId
        }
      });

    } catch (error) {
      console.error('❌ Error enviando notificación de pago recibido:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // ⏰ PROGRAMACIÓN DE NOTIFICACIONES
  // ==============================================

  async schedulePaymentReminders(booking) {
    try {
      if (!booking.payment_due_date) return;

      const dueDate = new Date(booking.payment_due_date);
      const reminderDays = [7, 3, 1];

      for (const days of reminderDays) {
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - days);

        if (reminderDate > new Date()) {
          await this.scheduleNotification({
            type: 'payment_reminder',
            bookingId: booking.id,
            scheduledFor: reminderDate,
            data: { daysUntilDue: days }
          });
        }
      }

    } catch (error) {
      console.error('❌ Error programando recordatorios de pago:', error);
    }
  }

  async scheduleTravelReminders(booking) {
    try {
      if (!booking.travel_date) return;

      const travelDate = new Date(booking.travel_date);
      const reminderDays = [30, 7, 1];

      for (const days of reminderDays) {
        const reminderDate = new Date(travelDate);
        reminderDate.setDate(reminderDate.getDate() - days);

        if (reminderDate > new Date()) {
          await this.scheduleNotification({
            type: 'travel_reminder',
            bookingId: booking.id,
            scheduledFor: reminderDate,
            data: { daysUntilTravel: days }
          });
        }
      }

    } catch (error) {
      console.error('❌ Error programando recordatorios de viaje:', error);
    }
  }

  async scheduleNotification(notificationData) {
    try {
      const result = await query(`
        INSERT INTO scheduled_notifications 
        (type, booking_id, scheduled_for, data, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        notificationData.type,
        notificationData.bookingId,
        notificationData.scheduledFor,
        JSON.stringify(notificationData.data)
      ]);

      return { success: true, scheduledId: result.rows[0].id };

    } catch (error) {
      console.error('❌ Error programando notificación:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📝 CREACIÓN DE NOTIFICACIONES
  // ==============================================

  async createNotification(notificationData) {
    try {
      const notificationType = this.notificationTypes.get(notificationData.type);
      if (!notificationType) {
        return { success: false, error: 'Tipo de notificación no válido' };
      }

      const notification = await query(`
        INSERT INTO booking_notifications 
        (type, booking_id, recipient_name, recipient_email, recipient_phone, data, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'pending', CURRENT_TIMESTAMP)
        RETURNING id
      `, [
        notificationData.type,
        notificationData.bookingId,
        notificationData.recipient.name,
        notificationData.recipient.email,
        notificationData.recipient.phone,
        JSON.stringify(notificationData.data)
      ]);

      const notificationId = notification.rows[0].id;

      // Enviar por canales configurados
      const results = [];
      for (const channel of notificationType.channels) {
        try {
          const channelResult = await this.sendNotificationByChannel(
            channel,
            notificationData,
            notificationId
          );
          results.push({ channel, ...channelResult });
        } catch (error) {
          results.push({ 
            channel, 
            success: false, 
            error: error.message 
          });
        }
      }

      const hasSuccess = results.some(r => r.success);
      const finalStatus = hasSuccess ? 'sent' : 'failed';

      await query(`
        UPDATE booking_notifications 
        SET status = $1, sent_at = $2
        WHERE id = $3
      `, [finalStatus, hasSuccess ? new Date() : null, notificationId]);

      return {
        success: hasSuccess,
        notificationId,
        results,
        type: notificationData.type
      };

    } catch (error) {
      console.error('❌ Error creando notificación:', error);
      return { success: false, error: error.message };
    }
  }

  async sendNotificationByChannel(channel, notificationData, notificationId) {
    try {
      const template = await this.getTemplate(notificationData.type, channel);
      const renderedContent = this.renderTemplate(template, notificationData.data);

      switch (channel) {
        case 'email':
          return await this.sendEmail(notificationData.recipient, renderedContent);
        case 'whatsapp':
          return await this.sendWhatsApp(notificationData.recipient, renderedContent);
        default:
          throw new Error(`Canal ${channel} no soportado`);
      }

    } catch (error) {
      console.error(`❌ Error enviando por canal ${channel}:`, error);
      return { success: false, error: error.message };
    }
  }

  async sendEmail(recipient, content) {
    try {
      console.log(`📧 Enviando email a ${recipient.email}: ${content.subject}`);
      await this.sleep(500);
      
      return {
        success: true,
        externalId: `email_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendWhatsApp(recipient, content) {
    try {
      if (!recipient.phone) {
        return { success: false, error: 'Número de teléfono no disponible' };
      }

      console.log(`📱 Enviando WhatsApp a ${recipient.phone}`);
      await this.sleep(800);
      
      return {
        success: true,
        externalId: `whatsapp_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📄 TEMPLATES
  // ==============================================

  async getTemplate(type, channel) {
    const cacheKey = `${type}_${channel}`;
    
    if (this.templates.has(cacheKey)) {
      return this.templates.get(cacheKey);
    }

    const template = this.getDefaultTemplate(type, channel);
    this.templates.set(cacheKey, template);
    
    return template;
  }

  getDefaultTemplate(type, channel) {
    const templates = {
      booking_created: {
        email: {
          subject: '📋 Nueva Reserva Creada - {{bookingReference}}',
          content: `
            <h2>¡Hola {{customerName}}!</h2>
            <p>Tu reserva ha sido creada exitosamente:</p>
            <ul>
              <li><strong>Reserva:</strong> {{bookingReference}}</li>
              <li><strong>Destino:</strong> {{destination}}</li>
              <li><strong>Fecha:</strong> {{travelDate}}</li>
              <li><strong>Total:</strong> {{totalAmount}} {{currency}}</li>
            </ul>
            <p>¡Gracias por elegir InterTravel!</p>
          `
        },
        whatsapp: {
          content: `
🎉 *¡Reserva Creada!*

Hola {{customerName}}!

📋 Reserva: {{bookingReference}}
🏝️ Destino: {{destination}}
📅 Fecha: {{travelDate}}
💰 Total: {{totalAmount}} {{currency}}

¡Gracias por elegir InterTravel! 🌟
          `
        }
      },
      payment_received: {
        email: {
          subject: '💳 Pago Recibido - {{transactionId}}',
          content: `
            <h2>¡Pago recibido!</h2>
            <p>Hola {{customerName}},</p>
            <p>Hemos recibido tu pago de {{paymentAmount}} {{currency}}</p>
            <p>Transacción: {{transactionId}}</p>
          `
        },
        whatsapp: {
          content: `
💳 *¡Pago Recibido!*

Hola {{customerName}}!

✅ Pago confirmado: {{paymentAmount}} {{currency}}
🏷️ ID: {{transactionId}}

¡Gracias! 🌟
          `
        }
      }
    };

    return templates[type]?.[channel] || {
      subject: `Notificación: ${type}`,
      content: 'Contenido no disponible'
    };
  }

  renderTemplate(template, data) {
    const render = (text) => {
      if (!text) return '';
      
      return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        return data[key.trim()] || match;
      });
    };

    return {
      subject: render(template.subject || ''),
      content: render(template.content || '')
    };
  }

  // ==============================================
  // 📊 PROCESAMIENTO Y ESTADÍSTICAS
  // ==============================================

  async processScheduledNotifications() {
    try {
      const pendingNotifications = await query(`
        SELECT * FROM scheduled_notifications 
        WHERE status = 'pending' 
        AND scheduled_for <= CURRENT_TIMESTAMP
        ORDER BY scheduled_for ASC
        LIMIT 50
      `);

      console.log(`📅 Procesando ${pendingNotifications.rows.length} notificaciones programadas`);

      for (const notification of pendingNotifications.rows) {
        try {
          // Simular procesamiento
          await this.sleep(100);
          
          await query(`
            UPDATE scheduled_notifications 
            SET status = 'sent', processed_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [notification.id]);

        } catch (error) {
          console.error(`❌ Error procesando notificación ${notification.id}:`, error);
        }
      }

      return { success: true, processed: pendingNotifications.rows.length };

    } catch (error) {
      console.error('❌ Error procesando notificaciones programadas:', error);
      return { success: false, error: error.message };
    }
  }

  async getNotificationStats(period = '30d') {
    try {
      const intervals = {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days'
      };

      const interval = intervals[period] || '30 days';

      const stats = await query(`
        SELECT 
          type,
          status,
          COUNT(*) as count
        FROM booking_notifications
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY type, status
        ORDER BY type, count DESC
      `);

      return {
        success: true,
        period,
        data: {
          byType: stats.rows,
          summary: {
            total: stats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
            sent: stats.rows.filter(row => row.status === 'sent').reduce((sum, row) => sum + parseInt(row.count), 0),
            failed: stats.rows.filter(row => row.status === 'failed').reduce((sum, row) => sum + parseInt(row.count), 0)
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 🚀 INICIALIZACIÓN
  // ==============================================

  async initialize() {
    try {
      console.log('🔔 Inicializando sistema de notificaciones de reservas...');
      
      // Programar procesamiento cada 5 minutos
      setInterval(() => {
        this.processScheduledNotifications();
      }, 5 * 60 * 1000);

      console.log('✅ Sistema de notificaciones de reservas inicializado');
      return { success: true };

    } catch (error) {
      console.error('❌ Error inicializando sistema:', error);
      return { success: false, error: error.message };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BookingNotifications;
