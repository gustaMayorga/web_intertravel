// ==============================================
// 🔔 SISTEMA DE NOTIFICACIONES INTELIGENTE
// ==============================================
// Sistema unificado para todas las notificaciones (Email, WhatsApp, SMS, Push)

const { query } = require('../database');
const fs = require('fs').promises;
const path = require('path');

class NotificationSystem {
  constructor() {
    this.channels = {
      email: new EmailChannel(),
      whatsapp: new WhatsAppChannel(),
      sms: new SMSChannel(),
      push: new PushChannel()
    };
    this.templates = new Map();
    this.queue = [];
    this.processing = false;
  }

  // ==============================================
  // 📤 ENVÍO DE NOTIFICACIONES PRINCIPAL
  // ==============================================

  async sendNotification(notificationData) {
    try {
      const {
        type, // 'booking_confirmation', 'payment_reminder', etc.
        channels = ['email'], // canales a usar
        recipient,
        data = {},
        priority = 'normal', // 'high', 'normal', 'low'
        scheduledFor = null,
        templateOverride = null
      } = notificationData;

      console.log(`🔔 Enviando notificación: ${type} a ${recipient.email || recipient.phone}`);

      // Verificar que tengamos datos mínimos
      if (!type || !recipient || channels.length === 0) {
        return { success: false, error: 'Datos de notificación incompletos' };
      }

      // Obtener template para el tipo de notificación
      const template = templateOverride || await this.getTemplate(type);
      if (!template.success) {
        return { success: false, error: 'Template no encontrado' };
      }

      // Crear registro de notificación
      const notificationRecord = await this.createNotificationRecord({
        type,
        recipient,
        channels: JSON.stringify(channels),
        data: JSON.stringify(data),
        priority,
        scheduledFor,
        status: scheduledFor ? 'scheduled' : 'pending'
      });

      if (!notificationRecord.success) {
        return notificationRecord;
      }

      const notificationId = notificationRecord.notification.id;

      // Si está programada, no enviar ahora
      if (scheduledFor) {
        return {
          success: true,
          notificationId,
          status: 'scheduled',
          scheduledFor
        };
      }

      // Enviar por cada canal solicitado
      const results = [];
      for (const channelName of channels) {
        try {
          const channel = this.channels[channelName];
          if (!channel) {
            results.push({
              channel: channelName,
              success: false,
              error: 'Canal no disponible'
            });
            continue;
          }

          // Verificar si el canal está configurado
          const isConfigured = await channel.isConfigured();
          if (!isConfigured) {
            results.push({
              channel: channelName,
              success: false,
              error: 'Canal no configurado'
            });
            continue;
          }

          // Renderizar template para este canal
          const renderedContent = await this.renderTemplate(
            template.template,
            channelName,
            data
          );

          // Enviar notificación
          const sendResult = await channel.send({
            recipient,
            subject: renderedContent.subject,
            content: renderedContent.content,
            attachments: renderedContent.attachments,
            metadata: { notificationId, type }
          });

          // Guardar resultado del canal
          await this.saveChannelResult(notificationId, channelName, sendResult);

          results.push({
            channel: channelName,
            ...sendResult
          });

        } catch (error) {
          console.error(`❌ Error enviando por ${channelName}:`, error);
          results.push({
            channel: channelName,
            success: false,
            error: error.message
          });

          await this.saveChannelResult(notificationId, channelName, {
            success: false,
            error: error.message
          });
        }
      }

      // Actualizar estado general de la notificación
      const hasSuccess = results.some(r => r.success);
      const allFailed = results.every(r => !r.success);
      
      let finalStatus = 'sent';
      if (allFailed) {
        finalStatus = 'failed';
      } else if (!hasSuccess) {
        finalStatus = 'partial';
      }

      await this.updateNotificationStatus(notificationId, finalStatus);

      return {
        success: hasSuccess,
        notificationId,
        status: finalStatus,
        results
      };

    } catch (error) {
      console.error('❌ Error en sistema de notificaciones:', error);
      return { success: false, error: error.message };
    }
  }

  // ==============================================
  // 📋 NOTIFICACIONES PREDEFINIDAS DEL SISTEMA
  // ==============================================

  async sendBookingConfirmation(bookingData) {
    const { booking, customer, package: packageInfo } = bookingData;

    return await this.sendNotification({
      type: 'booking_confirmation',
      channels: ['email', 'whatsapp'],
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
        currency: booking.currency,
        specialRequests: booking.special_requests
      },
      priority: 'high'
    });
  }

  async sendPaymentReminder(bookingData) {
    const { booking, customer, package: packageInfo } = bookingData;

    return await this.sendNotification({
      type: 'payment_reminder',
      channels: ['email', 'whatsapp'],
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
        pendingAmount: booking.pending_amount,
        currency: booking.currency,
        dueDate: booking.payment_due_date,
        paymentLink: booking.payment_link
      },
      priority: 'high'
    });
  }

  async sendTravelDocumentsReady(bookingData) {
    const { booking, customer, documents } = bookingData;

    return await this.sendNotification({
      type: 'travel_documents_ready',
      channels: ['email'],
      recipient: {
        name: customer.name,
        email: customer.email
      },
      data: {
        bookingReference: booking.booking_reference,
        customerName: customer.name,
        documents: documents,
        downloadLink: booking.documents_link
      },
      priority: 'normal'
    });
  }

  async sendTravelReminder(bookingData) {
    const { booking, customer, package: packageInfo } = bookingData;

    return await this.sendNotification({
      type: 'travel_reminder',
      channels: ['email', 'whatsapp'],
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
        daysUntilTravel: booking.days_until_travel,
        importantInfo: booking.travel_notes,
        contactInfo: {
          emergency: '+54 9 261 123-4567',
          whatsapp: '+54 9 261 123-4567'
        }
      },
      priority: 'high'
    });
  }

  async sendAdminAlert(alertData) {
    const { type, message, severity = 'info', data = {} } = alertData;

    return await this.sendNotification({
      type: 'admin_alert',
      channels: ['email'],
      recipient: {
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@intertravel.com'
      },
      data: {
        alertType: type,
        message,
        severity,
        timestamp: new Date().toISOString(),
        data
      },
      priority: severity === 'critical' ? 'high' : 'normal'
    });
  }

  // ==============================================
  // 📝 GESTIÓN DE TEMPLATES
  // ==============================================

  async getTemplate(type) {
    try {
      // Verificar cache primero
      if (this.templates.has(type)) {
        return { success: true, template: this.templates.get(type) };
      }

      // Buscar en base de datos
      const result = await query(`
        SELECT * FROM notification_templates 
        WHERE type = $1 AND is_active = true
        ORDER BY version DESC
        LIMIT 1
      `, [type]);

      if (result.rows.length === 0) {
        // Usar template por defecto si no existe en BD
        const defaultTemplate = await this.getDefaultTemplate(type);
        if (defaultTemplate) {
          this.templates.set(type, defaultTemplate);
          return { success: true, template: defaultTemplate };
        }
        return { success: false, error: 'Template no encontrado' };
      }

      const template = result.rows[0];
      this.templates.set(type, template);
      
      return { success: true, template };

    } catch (error) {
      console.error(`❌ Error obteniendo template ${type}:`, error);
      return { success: false, error: error.message };
    }
  }

  async getDefaultTemplate(type) {
    const defaultTemplates = {
      booking_confirmation: {
        type: 'booking_confirmation',
        name: 'Confirmación de Reserva',
        channels: {
          email: {
            subject: '✅ Reserva Confirmada - {{bookingReference}}',
            content: `
              <h2>¡Tu reserva está confirmada!</h2>
              <p>Hola {{customerName}},</p>
              <p>Nos complace confirmar tu reserva:</p>
              <ul>
                <li><strong>Reserva:</strong> {{bookingReference}}</li>
                <li><strong>Destino:</strong> {{destination}}</li>
                <li><strong>Paquete:</strong> {{packageTitle}}</li>
                <li><strong>Fecha de viaje:</strong> {{travelDate}}</li>
                <li><strong>Viajeros:</strong> {{travelers}}</li>
                <li><strong>Total:</strong> {{totalAmount}} {{currency}}</li>
              </ul>
              {{#if specialRequests}}
              <p><strong>Solicitudes especiales:</strong> {{specialRequests}}</p>
              {{/if}}
              <p>¡Esperamos que disfrutes tu experiencia con InterTravel!</p>
            `
          },
          whatsapp: {
            content: `
🎉 *Reserva Confirmada*

Hola {{customerName}}!

✅ Tu reserva {{bookingReference}} está confirmada
🏝️ Destino: {{destination}}
📅 Fecha: {{travelDate}}
👥 Viajeros: {{travelers}}
💰 Total: {{totalAmount}} {{currency}}

¡Gracias por elegir InterTravel! 🌟
            `
          }
        }
      },
      payment_reminder: {
        type: 'payment_reminder',
        name: 'Recordatorio de Pago',
        channels: {
          email: {
            subject: '💳 Recordatorio de Pago - {{bookingReference}}',
            content: `
              <h2>Recordatorio de Pago</h2>
              <p>Hola {{customerName}},</p>
              <p>Te recordamos que tienes un pago pendiente para tu reserva:</p>
              <ul>
                <li><strong>Reserva:</strong> {{bookingReference}}</li>
                <li><strong>Destino:</strong> {{destination}}</li>
                <li><strong>Monto pendiente:</strong> {{pendingAmount}} {{currency}}</li>
                <li><strong>Fecha límite:</strong> {{dueDate}}</li>
              </ul>
              <p><a href="{{paymentLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pagar Ahora</a></p>
              <p>Si tienes alguna consulta, no dudes en contactarnos.</p>
            `
          },
          whatsapp: {
            content: `
💳 *Recordatorio de Pago*

Hola {{customerName}}!

⏰ Tienes un pago pendiente:
📋 Reserva: {{bookingReference}}
🏝️ Destino: {{destination}}
💰 Monto: {{pendingAmount}} {{currency}}
📅 Vence: {{dueDate}}

👆 Pagar: {{paymentLink}}

¿Necesitas ayuda? ¡Escríbenos! 😊
            `
          }
        }
      }
    };

    return defaultTemplates[type] || null;
  }

  async renderTemplate(template, channel, data) {
    try {
      const channelTemplate = template.channels[channel];
      if (!channelTemplate) {
        throw new Error(`Template no tiene configuración para canal ${channel}`);
      }

      // Función simple de template rendering (reemplazar {{variable}})
      const render = (text, data) => {
        if (!text) return '';
        
        return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          const value = this.getNestedValue(data, key.trim());
          return value !== undefined ? value : match;
        });
      };

      const rendered = {
        subject: render(channelTemplate.subject || '', data),
        content: render(channelTemplate.content || '', data),
        attachments: channelTemplate.attachments || []
      };

      return rendered;

    } catch (error) {
      console.error('❌ Error renderizando template:', error);
      throw error;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (key.includes('(') && key.includes(')')) {
        // Función helper (ej: json data)
        const [func, arg] = key.replace(')', '').split('(');
        if (func === 'json') {
          return JSON.stringify(current[arg], null, 2);
        }
      }
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // ==============================================
  // 💾 GESTIÓN DE REGISTROS
  // ==============================================

  async createNotificationRecord(notificationData) {
    try {
      const result = await query(`
        INSERT INTO notifications 
        (type, recipient_name, recipient_email, recipient_phone, channels, data, priority, scheduled_for, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        notificationData.type,
        notificationData.recipient.name,
        notificationData.recipient.email,
        notificationData.recipient.phone,
        notificationData.channels,
        notificationData.data,
        notificationData.priority,
        notificationData.scheduledFor,
        notificationData.status
      ]);

      return { success: true, notification: result.rows[0] };

    } catch (error) {
      console.error('❌ Error creando registro de notificación:', error);
      return { success: false, error: error.message };
    }
  }

  async saveChannelResult(notificationId, channel, result) {
    try {
      await query(`
        INSERT INTO notification_deliveries 
        (notification_id, channel, status, external_id, error_message, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        notificationId,
        channel,
        result.success ? 'sent' : 'failed',
        result.externalId || null,
        result.error || null,
        JSON.stringify(result.metadata || {})
      ]);

    } catch (error) {
      console.error('❌ Error guardando resultado de canal:', error);
    }
  }

  async updateNotificationStatus(notificationId, status) {
    try {
      await query(`
        UPDATE notifications 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status, notificationId]);

    } catch (error) {
      console.error('❌ Error actualizando estado de notificación:', error);
    }
  }

  // ==============================================
  // 📊 ESTADÍSTICAS Y REPORTES
  // ==============================================

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
          COUNT(*) as count,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today
        FROM notifications
        WHERE created_at >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY type, status
        ORDER BY count DESC
      `);

      const channelStats = await query(`
        SELECT 
          nd.channel,
          nd.status,
          COUNT(*) as count,
          COUNT(CASE WHEN nd.created_at >= CURRENT_DATE THEN 1 END) as today
        FROM notification_deliveries nd
        JOIN notifications n ON nd.notification_id = n.id
        WHERE n.created_at >= CURRENT_DATE - INTERVAL '${interval}'
        GROUP BY nd.channel, nd.status
        ORDER BY count DESC
      `);

      return {
        success: true,
        data: {
          period,
          byType: stats.rows,
          byChannel: channelStats.rows
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de notificaciones:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==============================================
// 📧 EMAIL CHANNEL
// ==============================================

class EmailChannel {
  constructor() {
    this.name = 'email';
    this.config = null;
  }

  async initialize() {
    await this.loadConfig();
  }

  async loadConfig() {
    try {
      const SettingsManager = require('./settings-manager');
      const settingsManager = new SettingsManager();
      const integrationsConfig = await settingsManager.getIntegrationsConfig();
      
      if (integrationsConfig.success) {
        this.config = integrationsConfig.config.communication.email;
      }
      
      return this.config;
    } catch (error) {
      console.error('❌ Error cargando configuración de email:', error);
      return null;
    }
  }

  async isConfigured() {
    const config = await this.loadConfig();
    return config && config.enabled && config.smtpHost && config.fromEmail;
  }

  async send({ recipient, subject, content, attachments = [] }) {
    try {
      console.log(`📧 Enviando email a ${recipient.email}: ${subject}`);
      
      // Por ahora, simular envío exitoso
      return {
        success: true,
        externalId: `email_${Date.now()}`,
        metadata: {
          recipient: recipient.email,
          subject,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==============================================
// 📱 WHATSAPP CHANNEL
// ==============================================

class WhatsAppChannel {
  constructor() {
    this.name = 'whatsapp';
    this.config = null;
  }

  async initialize() {
    await this.loadConfig();
  }

  async loadConfig() {
    try {
      const SettingsManager = require('./settings-manager');
      const settingsManager = new SettingsManager();
      const integrationsConfig = await settingsManager.getIntegrationsConfig();
      
      if (integrationsConfig.success) {
        this.config = integrationsConfig.config.communication.whatsapp;
      }
      
      return this.config;
    } catch (error) {
      console.error('❌ Error cargando configuración de WhatsApp:', error);
      return null;
    }
  }

  async isConfigured() {
    const config = await this.loadConfig();
    return config && config.enabled && config.accessToken;
  }

  async send({ recipient, content }) {
    try {
      console.log(`📱 Enviando WhatsApp a ${recipient.phone}`);
      
      // Por ahora, simular envío exitoso
      return {
        success: true,
        externalId: `whatsapp_${Date.now()}`,
        metadata: {
          recipient: recipient.phone,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error enviando WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==============================================
// 📲 SMS CHANNEL
// ==============================================

class SMSChannel {
  constructor() {
    this.name = 'sms';
    this.config = null;
  }

  async initialize() {
    await this.loadConfig();
  }

  async loadConfig() {
    try {
      const SettingsManager = require('./settings-manager');
      const settingsManager = new SettingsManager();
      const integrationsConfig = await settingsManager.getIntegrationsConfig();
      
      if (integrationsConfig.success) {
        this.config = integrationsConfig.config.communication.sms;
      }
      
      return this.config;
    } catch (error) {
      console.error('❌ Error cargando configuración de SMS:', error);
      return null;
    }
  }

  async isConfigured() {
    const config = await this.loadConfig();
    return config && config.enabled && config.apiKey;
  }

  async send({ recipient, content }) {
    try {
      console.log(`📲 Enviando SMS a ${recipient.phone}`);
      
      // Por ahora, simular envío exitoso
      return {
        success: true,
        externalId: `sms_${Date.now()}`,
        metadata: {
          recipient: recipient.phone,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error enviando SMS:', error);
      return { success: false, error: error.message };
    }
  }
}

// ==============================================
// 🔔 PUSH CHANNEL
// ==============================================

class PushChannel {
  constructor() {
    this.name = 'push';
    this.config = null;
  }

  async initialize() {
    await this.loadConfig();
  }

  async loadConfig() {
    // Por ahora, configuración básica
    this.config = { enabled: false };
    return this.config;
  }

  async isConfigured() {
    return false; // Por implementar
  }

  async send({ recipient, content }) {
    return { success: false, error: 'Push notifications pendientes de implementación' };
  }
}

module.exports = NotificationSystem;
