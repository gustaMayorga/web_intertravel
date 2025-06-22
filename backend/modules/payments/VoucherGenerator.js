// ===============================================
// GENERADOR DE VOUCHERS PDF - INTERTRAVEL
// Generación automática de vouchers profesionales
// ===============================================

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

class VoucherGenerator {
  constructor() {
    this.companyInfo = {
      name: 'InterTravel Group',
      address: 'Chacras Park, Edificio Ceibo',
      city: 'Luján de Cuyo, Mendoza, Argentina',
      phone: '+54 261 XXX-XXXX',
      email: 'info@intertravel.com.ar',
      website: 'www.intertravel.com.ar',
      license: 'EVyT 15.566'
    };
  }

  async generateVoucher(orderData) {
    try {
      console.log('📄 Generando voucher para orden:', orderData.orderId);

      // Crear directorio si no existe
      const vouchersDir = path.join(__dirname, '../../vouchers');
      if (!fs.existsSync(vouchersDir)) {
        fs.mkdirSync(vouchersDir, { recursive: true });
      }

      const filename = `voucher_${orderData.orderId}_${Date.now()}.pdf`;
      const filepath = path.join(vouchersDir, filename);

      // Crear documento PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Voucher de Viaje - ${orderData.orderId}`,
          Author: 'InterTravel Group',
          Subject: 'Voucher de Confirmación de Viaje',
          Creator: 'InterTravel System',
          Producer: 'InterTravel PDF Generator'
        }
      });

      // Stream para guardar archivo
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Generar contenido del voucher
      await this.generateVoucherContent(doc, orderData);

      // Finalizar documento
      doc.end();

      // Esperar a que termine de escribirse
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          console.log('✅ Voucher generado exitosamente:', filename);
          resolve({
            success: true,
            filename: filename,
            filepath: filepath,
            url: `/api/vouchers/${filename}`
          });
        });

        stream.on('error', (error) => {
          console.error('❌ Error generando voucher:', error);
          reject({
            success: false,
            error: error.message
          });
        });
      });

    } catch (error) {
      console.error('❌ Error en generación de voucher:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateVoucherContent(doc, orderData) {
    const pageWidth = doc.page.width;
    const margin = doc.page.margins.left;
    const contentWidth = pageWidth - (margin * 2);

    // ===============================================
    // HEADER CON LOGO Y EMPRESA
    // ===============================================
    
    // Header background
    doc.rect(0, 0, pageWidth, 120)
       .fillAndStroke('#1e40af', '#1e40af');

    // Company name
    doc.fillColor('#ffffff')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('InterTravel', margin, 25);

    doc.fontSize(14)
       .font('Helvetica')
       .text('Premium Travel Experiences', margin, 55);

    // License info
    doc.fontSize(10)
       .text(`Legajo ${this.companyInfo.license} • +15 años de experiencia`, margin, 80);

    // Contact info (right side)
    doc.text(this.companyInfo.phone, pageWidth - 200, 25);
    doc.text(this.companyInfo.email, pageWidth - 200, 40);
    doc.text(this.companyInfo.website, pageWidth - 200, 55);

    // ===============================================
    // VOUCHER TITLE Y NÚMERO
    // ===============================================

    doc.fillColor('#000000')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('VOUCHER DE VIAJE', margin, 150);

    doc.fontSize(14)
       .font('Helvetica')
       .text(`Número: ${orderData.orderId}`, margin, 180);

    doc.text(`Fecha de emisión: ${moment().format('DD/MM/YYYY HH:mm')}`, margin, 200);

    // Status badge
    const statusColor = orderData.status === 'confirmed' ? '#10b981' : '#f59e0b';
    const statusText = orderData.status === 'confirmed' ? 'CONFIRMADO' : 'PENDIENTE';
    
    doc.rect(pageWidth - 150, 150, 100, 25)
       .fillAndStroke(statusColor, statusColor);
    
    doc.fillColor('#ffffff')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text(statusText, pageWidth - 140, 158);

    // ===============================================
    // INFORMACIÓN DEL CLIENTE
    // ===============================================

    doc.fillColor('#000000')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL PASAJERO', margin, 250);

    // Customer info box
    doc.rect(margin, 275, contentWidth, 80)
       .stroke('#e5e7eb');

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nombre: ${orderData.customerName}`, margin + 15, 290)
       .text(`Email: ${orderData.customerEmail}`, margin + 15, 310)
       .text(`Teléfono: ${orderData.customerPhone || 'No especificado'}`, margin + 15, 330);

    // ===============================================
    // DETALLES DEL PAQUETE
    // ===============================================

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('DETALLES DEL VIAJE', margin, 380);

    // Package info box
    doc.rect(margin, 405, contentWidth, 120)
       .stroke('#e5e7eb');

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text(orderData.packageTitle, margin + 15, 420);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Destino: ${orderData.packageDestination || orderData.destination}`, margin + 15, 445)
       .text(`Duración: ${orderData.packageDuration || orderData.duration || 'A confirmar'}`, margin + 15, 465)
       .text(`Fecha de salida: ${orderData.departureDate || 'A coordinar'}`, margin + 15, 485)
       .text(`Número de pasajeros: ${orderData.travelers || orderData.passengers || 1}`, margin + 15, 505);

    // ===============================================
    // INFORMACIÓN DE PAGO
    // ===============================================

    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE PAGO', margin, 550);

    // Payment info box
    doc.rect(margin, 575, contentWidth, 80)
       .stroke('#e5e7eb');

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Total pagado: ${this.formatCurrency(orderData.amount, orderData.currency)}`, margin + 15, 590)
       .text(`Método de pago: ${orderData.paymentMethod || 'Tarjeta de crédito'}`, margin + 15, 610)
       .text(`ID de transacción: ${orderData.transactionId || orderData.orderId}`, margin + 15, 630);

    // ===============================================
    // QR CODE
    // ===============================================

    try {
      const qrData = JSON.stringify({
        orderId: orderData.orderId,
        customerEmail: orderData.customerEmail,
        amount: orderData.amount,
        packageId: orderData.packageId,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3005'}/verify/${orderData.orderId}`
      });

      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      doc.image(qrCodeBuffer, pageWidth - 170, 560, { width: 120 });
      
      doc.fontSize(10)
           .text('Código de verificación', pageWidth - 170, 690);

    } catch (error) {
      console.error('Error generando QR:', error);
      // Continuar sin QR si hay error
    }

    // ===============================================
    // TÉRMINOS Y CONDICIONES
    // ===============================================

    doc.addPage();
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('TÉRMINOS Y CONDICIONES', margin, 50);

    const terms = [
      '1. Este voucher es válido por 12 meses desde la fecha de emisión.',
      '2. Para realizar cambios o cancelaciones, contactar con 48hs de anticipación.',
      '3. Los servicios están sujetos a disponibilidad y confirmación.',
      '4. Es obligatorio presentar documento de identidad vigente.',
      '5. Las fechas de viaje deben coordinarse con mínimo 15 días de anticipación.',
      '6. InterTravel Group se reserva el derecho de modificar itinerarios por causas de fuerza mayor.',
      '7. El pasajero debe contar con documentación requerida para el destino.',
      '8. Los gastos personales no están incluidos salvo que se especifique lo contrario.'
    ];

    let yPosition = 90;
    terms.forEach(term => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(term, margin, yPosition, { width: contentWidth });
      yPosition += 25;
    });

    // ===============================================
    // INFORMACIÓN DE CONTACTO
    // ===============================================

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE CONTACTO', margin, yPosition + 30);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Dirección: ${this.companyInfo.address}`, margin, yPosition + 55)
       .text(`${this.companyInfo.city}`, margin, yPosition + 75)
       .text(`Teléfono: ${this.companyInfo.phone}`, margin, yPosition + 95)
       .text(`Email: ${this.companyInfo.email}`, margin, yPosition + 115)
       .text(`WhatsApp: +54 9 261 XXX-XXXX`, margin, yPosition + 135);

    // ===============================================
    // FOOTER
    // ===============================================

    const footerY = doc.page.height - 60;
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('Este voucher es un documento oficial de InterTravel Group.', margin, footerY)
       .text('Conserve este documento durante todo su viaje.', margin, footerY + 15)
       .text(`Generado el ${moment().format('DD/MM/YYYY HH:mm:ss')} - Sistema InterTravel v3.0`, margin, footerY + 30);
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  async generateEmailTemplate(orderData, voucherUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Reserva - InterTravel</title>
    <style>
        body { font-family: 'Helvetica', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #1e40af, #7c3aed); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .header p { color: #e0e7ff; margin: 5px 0 0 0; }
        .content { padding: 30px; }
        .status-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .order-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; }
        .footer a { color: #60a5fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>¡Reserva Confirmada!</h1>
            <p>Tu aventura está lista para comenzar</p>
        </div>
        
        <div class="content">
            <h2>Hola ${orderData.customerName},</h2>
            
            <p>¡Excelentes noticias! Tu reserva ha sido confirmada exitosamente.</p>
            
            <div class="status-badge">✅ CONFIRMADO</div>
            
            <div class="order-details">
                <h3>Detalles de tu viaje:</h3>
                <p><strong>Paquete:</strong> ${orderData.packageTitle}</p>
                <p><strong>Destino:</strong> ${orderData.packageDestination || orderData.destination}</p>
                <p><strong>Número de orden:</strong> ${orderData.orderId}</p>
                <p><strong>Total pagado:</strong> ${this.formatCurrency(orderData.amount, orderData.currency)}</p>
                <p><strong>Fecha de reserva:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</p>
            </div>
            
            <p>Tu voucher oficial está adjunto a este email. <strong>¡Descárgalo y consérvalo!</strong> Lo necesitarás durante tu viaje.</p>
            
            <a href="${voucherUrl}" class="button">📄 Descargar Voucher</a>
            
            <h3>¿Qué sigue ahora?</h3>
            <ul>
                <li>📧 Recibirás información detallada del itinerario en las próximas 24hs</li>
                <li>📞 Nuestro equipo se contactará contigo para coordinar fechas</li>
                <li>✈️ Te ayudaremos con toda la documentación necesaria</li>
                <li>🎒 Te brindaremos tips y recomendaciones para tu destino</li>
            </ul>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos:</p>
            <p>📱 WhatsApp: <a href="https://wa.me/5492611234567">+54 9 261 XXX-XXXX</a></p>
            <p>📧 Email: info@intertravel.com.ar</p>
            <p>📞 Teléfono: +54 261 XXX-XXXX</p>
        </div>
        
        <div class="footer">
            <p><strong>InterTravel Group</strong> • EVyT 15.566</p>
            <p>Chacras Park, Edificio Ceibo • Luján de Cuyo, Mendoza</p>
            <p><a href="mailto:info@intertravel.com.ar">info@intertravel.com.ar</a> • <a href="http://www.intertravel.com.ar">www.intertravel.com.ar</a></p>
            <p style="margin-top: 15px; font-size: 11px;">
                Este email fue enviado porque realizaste una reserva en InterTravel.<br>
                Si no realizaste esta reserva, contacta inmediatamente a nuestro soporte.
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

module.exports = VoucherGenerator;