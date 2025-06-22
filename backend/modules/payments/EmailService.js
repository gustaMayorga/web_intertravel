// ===============================================
// SISTEMA DE EMAILS TRANSACCIONALES - INTERTRAVEL
// Nodemailer + Templates profesionales
// ===============================================

const nodemailer = require('nodemailer');
const moment = require('moment');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configuración para desarrollo (usar Gmail/SMTP real en producción)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'noreply@intertravel.com.ar',
        pass: process.env.SMTP_PASS || 'your-app-password'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('📧 Servicio de email configurado');
  }

  async sendBookingConfirmation(orderData, voucherBuffer) {
    try {
      console.log('📧 Enviando confirmación de reserva a:', orderData.customerEmail);

      const emailHtml = this.generateConfirmationEmail(orderData);
      
      const mailOptions = {
        from: {
          name: 'InterTravel Group',
          address: process.env.SMTP_USER || 'noreply@intertravel.com.ar'
        },
        to: orderData.customerEmail,
        subject: `✅ Reserva Confirmada - ${orderData.packageTitle} - Orden ${orderData.orderId}`,
        html: emailHtml,
        attachments: voucherBuffer ? [{
          filename: `voucher_${orderData.orderId}.pdf`,
          content: voucherBuffer,
          contentType: 'application/pdf'
        }] : []
      };

      // En desarrollo, simular envío
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Modo desarrollo: Simulando envío de email');
        console.log('📧 Para:', orderData.customerEmail);
        console.log('📧 Asunto:', mailOptions.subject);
        
        return {
          success: true,
          messageId: `dev-${Date.now()}`,
          simulation: true
        };
      }

      // En producción, enviar email real
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email enviado exitosamente:', result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        simulation: false
      };

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendPaymentReceived(orderData) {
    try {
      console.log('💰 Enviando notificación de pago recibido:', orderData.customerEmail);

      const emailHtml = this.generatePaymentReceivedEmail(orderData);
      
      const mailOptions = {
        from: {
          name: 'InterTravel Group',
          address: process.env.SMTP_USER || 'noreply@intertravel.com.ar'
        },
        to: orderData.customerEmail,
        subject: `💳 Pago Recibido - ${orderData.packageTitle} - ${orderData.orderId}`,
        html: emailHtml
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Simulando email de pago recibido');
        return {
          success: true,
          messageId: `dev-payment-${Date.now()}`,
          simulation: true
        };
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error enviando notificación de pago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendPaymentFailed(orderData) {
    try {
      console.log('❌ Enviando notificación de pago fallido:', orderData.customerEmail);

      const emailHtml = this.generatePaymentFailedEmail(orderData);
      
      const mailOptions = {
        from: {
          name: 'InterTravel Group',
          address: process.env.SMTP_USER || 'noreply@intertravel.com.ar'
        },
        to: orderData.customerEmail,
        subject: `⚠️ Problema con el Pago - ${orderData.packageTitle}`,
        html: emailHtml
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Simulando email de pago fallido');
        return {
          success: true,
          messageId: `dev-failed-${Date.now()}`,
          simulation: true
        };
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Error enviando notificación de fallo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateConfirmationEmail(orderData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Reserva - InterTravel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f7fa; }
        .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        
        .header { 
            background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); 
            padding: 40px 30px; 
            text-align: center; 
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
            animation: float 20s ease-in-out infinite;
        }
        .header h1 { color: #ffffff; font-size: 32px; font-weight: 700; margin-bottom: 8px; position: relative; z-index: 1; }
        .header p { color: #e0e7ff; font-size: 16px; position: relative; z-index: 1; }
        
        .content { padding: 40px 30px; }
        .greeting { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
        .message { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.7; }
        
        .status-card {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
        }
        .status-icon { font-size: 48px; margin-bottom: 10px; }
        .status-text { font-size: 24px; font-weight: 700; }
        
        .order-details {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        .order-details h3 { color: #1f2937; font-size: 18px; font-weight: 600; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #4b5563; }
        .detail-value { color: #1f2937; font-weight: 500; }
        
        .cta-section { text-align: center; margin: 40px 0; }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #1e40af, #7c3aed);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 8px 25px rgba(30, 64, 175, 0.3);
            transition: transform 0.2s ease;
        }
        .btn:hover { transform: translateY(-2px); }
        
        .next-steps {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 25px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .next-steps h3 { color: #1e40af; margin-bottom: 15px; }
        .next-steps ul { list-style: none; }
        .next-steps li { margin: 10px 0; padding-left: 25px; position: relative; }
        .next-steps li::before { content: '✅'; position: absolute; left: 0; }
        
        .contact-info {
            background: #f9fafb;
            padding: 25px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .contact-info h3 { color: #1f2937; margin-bottom: 15px; }
        .contact-item { margin: 8px 0; }
        .contact-item a { color: #3b82f6; text-decoration: none; font-weight: 500; }
        
        .footer {
            background: #1f2937;
            color: #9ca3af;
            padding: 30px;
            text-align: center;
        }
        .footer h4 { color: #ffffff; margin-bottom: 10px; }
        .footer p { font-size: 14px; margin: 5px 0; }
        .footer a { color: #60a5fa; text-decoration: none; }
        .security-note { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            color: #92400e; 
            padding: 15px; 
            border-radius: 6px; 
            margin-top: 20px; 
            font-size: 12px; 
        }
        
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @media (max-width: 600px) {
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
            .header h1 { font-size: 28px; }
            .btn { padding: 14px 28px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 ¡Reserva Confirmada!</h1>
            <p>Tu aventura está lista para comenzar</p>
        </div>
        
        <div class="content">
            <div class="greeting">¡Hola ${orderData.customerName}! 👋</div>
            
            <div class="message">
                ¡Excelentes noticias! Tu reserva ha sido procesada y confirmada exitosamente. 
                Estamos emocionados de ser parte de tu próxima aventura y queremos asegurarnos 
                de que tengas la experiencia más increíble posible.
            </div>
            
            <div class="status-card">
                <div class="status-icon">✅</div>
                <div class="status-text">RESERVA CONFIRMADA</div>
            </div>
            
            <div class="order-details">
                <h3>📋 Detalles de tu Reserva</h3>
                <div class="detail-row">
                    <span class="detail-label">🎫 Paquete:</span>
                    <span class="detail-value">${orderData.packageTitle}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🌍 Destino:</span>
                    <span class="detail-value">${orderData.packageDestination || orderData.destination || 'Por confirmar'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Duración:</span>
                    <span class="detail-value">${orderData.packageDuration || orderData.duration || 'Por confirmar'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👥 Pasajeros:</span>
                    <span class="detail-value">${orderData.travelers || orderData.passengers || 1}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🔢 N° de Orden:</span>
                    <span class="detail-value">${orderData.orderId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">💰 Total Pagado:</span>
                    <span class="detail-value" style="font-size: 18px; font-weight: 700; color: #10b981;">${this.formatCurrency(orderData.amount, orderData.currency)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Fecha de Reserva:</span>
                    <span class="detail-value">${moment().format('DD/MM/YYYY HH:mm')}</span>
                </div>
            </div>
            
            <div class="cta-section">
                <p style="margin-bottom: 20px; color: #4b5563;">
                    <strong>Tu voucher oficial está adjunto a este email.</strong><br>
                    ¡Descárgalo y consérvalo! Lo necesitarás durante tu viaje.
                </p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3005'}/account/bookings" class="btn">
                    📱 Ver Mi Reserva Online
                </a>
            </div>
            
            <div class="next-steps">
                <h3>🚀 ¿Qué sigue ahora?</h3>
                <ul>
                    <li>Recibirás información detallada del itinerario en las próximas 24 horas</li>
                    <li>Nuestro equipo se contactará contigo para coordinar fechas exactas</li>
                    <li>Te ayudaremos con toda la documentación necesaria para el viaje</li>
                    <li>Recibirás tips y recomendaciones personalizadas para tu destino</li>
                    <li>Tendrás acceso 24/7 a nuestro soporte durante todo el proceso</li>
                </ul>
            </div>
            
            <div class="contact-info">
                <h3>📞 ¿Necesitas ayuda?</h3>
                <div class="contact-item">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/5492611234567">+54 9 261 XXX-XXXX</a></div>
                <div class="contact-item">📧 <strong>Email:</strong> <a href="mailto:info@intertravel.com.ar">info@intertravel.com.ar</a></div>
                <div class="contact-item">📞 <strong>Teléfono:</strong> +54 261 XXX-XXXX</div>
                <div class="contact-item">🌐 <strong>Web:</strong> <a href="http://www.intertravel.com.ar">www.intertravel.com.ar</a></div>
                <p style="margin-top: 15px; color: #6b7280; font-style: italic;">
                    Nuestro horario de atención: Lunes a Viernes 9:00 - 18:00 • Sábados 9:00 - 13:00
                </p>
            </div>
        </div>
        
        <div class="footer">
            <h4>InterTravel Group</h4>
            <p><strong>EVyT 15.566</strong> • +15 años creando experiencias inolvidables</p>
            <p>Chacras Park, Edificio Ceibo • Luján de Cuyo, Mendoza, Argentina</p>
            <p><a href="mailto:info@intertravel.com.ar">info@intertravel.com.ar</a> • <a href="http://www.intertravel.com.ar">www.intertravel.com.ar</a></p>
            
            <div class="security-note">
                🔒 <strong>Nota de Seguridad:</strong> Este email fue enviado porque realizaste una reserva en InterTravel. 
                Si no realizaste esta reserva, contacta inmediatamente a nuestro soporte. 
                Nunca compartas tu información de reserva con terceros no autorizados.
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  generatePaymentReceivedEmail(orderData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pago Recibido - InterTravel</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .payment-confirmed { background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .amount { font-size: 36px; font-weight: bold; color: #10b981; margin: 10px 0; }
        .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💳 Pago Recibido</h1>
        </div>
        
        <div class="content">
            <h2>¡Hola ${orderData.customerName}!</h2>
            
            <div class="payment-confirmed">
                <h3>✅ Pago Confirmado</h3>
                <div class="amount">${this.formatCurrency(orderData.amount, orderData.currency)}</div>
                <p>Tu pago ha sido procesado exitosamente</p>
            </div>
            
            <div class="details">
                <h3>Detalles del Pago:</h3>
                <p><strong>Orden:</strong> ${orderData.orderId}</p>
                <p><strong>Paquete:</strong> ${orderData.packageTitle}</p>
                <p><strong>Fecha:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</p>
                <p><strong>Método:</strong> ${orderData.paymentMethod || 'Tarjeta de crédito'}</p>
            </div>
            
            <p>Muy pronto recibirás tu voucher de confirmación con todos los detalles de tu viaje.</p>
            
            <p>¡Gracias por confiar en InterTravel para tu próxima aventura!</p>
        </div>
        
        <div class="footer">
            <p><strong>InterTravel Group</strong> • EVyT 15.566</p>
            <p>info@intertravel.com.ar • +54 261 XXX-XXXX</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  generatePaymentFailedEmail(orderData) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Problema con el Pago - InterTravel</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .alert { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .retry-btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Problema con el Pago</h1>
        </div>
        
        <div class="content">
            <h2>Hola ${orderData.customerName},</h2>
            
            <div class="alert">
                <h3>❌ No pudimos procesar tu pago</h3>
                <p>Hubo un problema al procesar el pago de tu reserva:</p>
                <p><strong>${orderData.packageTitle}</strong></p>
                <p>Orden: ${orderData.orderId}</p>
            </div>
            
            <h3>¿Qué puedes hacer?</h3>
            <ul>
                <li>Verifica que tu tarjeta tenga fondos suficientes</li>
                <li>Confirma que los datos ingresados sean correctos</li>
                <li>Intenta con otra tarjeta o método de pago</li>
                <li>Contacta a tu banco para verificar restricciones</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3005'}/checkout/retry/${orderData.orderId}" class="retry-btn">
                🔄 Reintentar Pago
            </a>
            
            <p>Si continúas teniendo problemas, no dudes en contactarnos:</p>
            <p>📱 WhatsApp: +54 9 261 XXX-XXXX</p>
            <p>📧 Email: info@intertravel.com.ar</p>
            
            <p><em>Tu reserva permanecerá disponible por 24 horas mientras resuelves el pago.</em></p>
        </div>
        
        <div class="footer">
            <p><strong>InterTravel Group</strong> • EVyT 15.566</p>
            <p>info@intertravel.com.ar • +54 261 XXX-XXXX</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

module.exports = EmailService;