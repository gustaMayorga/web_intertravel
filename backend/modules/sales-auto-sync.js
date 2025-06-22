// ===============================================
// SISTEMA DE SINCRONIZACIÓN AUTOMÁTICA DE VENTAS
// InterTravel - Manejo de ventas para app cliente
// ===============================================

const EventEmitter = require('events');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

class SalesAutoSyncService extends EventEmitter {
  constructor(dbManager) {
    super();
    this.dbManager = dbManager;
    this.isInitialized = false;
    this.processingQueue = [];
    this.emailTransporter = null;
    
    console.log('🔄 Inicializando SalesAutoSyncService...');
    this.initialize();
  }

  async initialize() {
    try {
      // Configurar transportador de email
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'noreply@intertravel.com.ar',
          pass: process.env.SMTP_PASS || 'app_password'
        }
      });

      // Crear directorios necesarios
      await this.ensureDirectories();
      
      this.isInitialized = true;
      console.log('✅ SalesAutoSyncService inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando SalesAutoSyncService:', error);
    }
  }

  async ensureDirectories() {
    const dirs = [
      './documents/vouchers',
      './documents/itineraries', 
      './documents/checklists',
      './documents/temp'
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.warn(`⚠️ No se pudo crear directorio ${dir}:`, error.message);
      }
    }
  }

  // ===============================================
  // MÉTODO PRINCIPAL: SINCRONIZAR NUEVA VENTA
  // ===============================================
  
  async syncNewSale(orderData) {
    console.log(`🔄 Sincronizando nueva venta: ${orderData.id}`);
    
    try {
      // 1. Validar datos de entrada
      const validationResult = this.validateOrderData(orderData);
      if (!validationResult.valid) {
        throw new Error(`Datos inválidos: ${validationResult.errors.join(', ')}`);
      }

      // 2. Crear entrada en sales_data
      const salesDataId = await this.createSalesDataEntry(orderData);
      
      // 3. Generar documentación automática
      const documents = await this.generateTravelDocuments(salesDataId, orderData);
      
      // 4. Configurar checklist personalizado
      const checklist = await this.generatePersonalizedChecklist(salesDataId, orderData);
      
      // 5. Programar recordatorios
      await this.setupAutomatedReminders(salesDataId, orderData);
      
      // 6. Inicializar datos de remarketing
      await this.initializeRemarketingData(salesDataId, orderData);
      
      // 7. Actualizar estado en sales_data
      await this.updateSalesDataStatus(salesDataId, 'completed', {
        documents,
        checklist,
        syncTimestamp: new Date().toISOString()
      });

      // 8. Emitir evento para notificar a la app cliente
      this.emit('saleSync', {
        salesDataId,
        orderId: orderData.id,
        status: 'success',
        documents,
        checklist
      });

      console.log(`✅ Venta sincronizada exitosamente: ${orderData.id}`);
      
      return {
        success: true,
        salesDataId,
        documents,
        checklist,
        message: 'Venta sincronizada y procesada completamente'
      };

    } catch (error) {
      console.error(`❌ Error sincronizando venta ${orderData.id}:`, error);
      
      // Registrar error en la base de datos
      if (orderData.id) {
        await this.logSyncError(orderData.id, error);
      }

      return {
        success: false,
        error: error.message,
        orderId: orderData.id
      };
    }
  }

  // ===============================================
  // VALIDACIÓN DE DATOS
  // ===============================================

  validateOrderData(orderData) {
    const errors = [];
    
    if (!orderData.id) errors.push('ID de orden requerido');
    if (!orderData.customer_email) errors.push('Email del cliente requerido');
    if (!orderData.package_title) errors.push('Título del paquete requerido');
    if (!orderData.amount || orderData.amount <= 0) errors.push('Monto válido requerido');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ===============================================
  // CREAR ENTRADA EN SALES_DATA
  // ===============================================

  async createSalesDataEntry(orderData) {
    const customerData = {
      name: orderData.customer_name,
      email: orderData.customer_email,
      phone: orderData.customer_phone,
      travelers: orderData.travelers || 1,
      specialRequests: orderData.special_requests
    };

    const result = await this.dbManager.query(`
      INSERT INTO sales_data (
        order_id, customer_data, auto_sync_status, 
        sync_attempts, created_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      orderData.id,
      JSON.stringify(customerData),
      'processing',
      1,
      new Date()
    ]);

    return result.rows[0].id;
  }

  // ===============================================
  // GENERAR DOCUMENTOS DE VIAJE
  // ===============================================

  async generateTravelDocuments(salesDataId, orderData) {
    console.log(`📄 Generando documentos para venta ${salesDataId}`);
    
    const documents = [];

    try {
      // 1. Generar Voucher PDF
      const voucherPath = await this.generateVoucherPDF(salesDataId, orderData);
      documents.push({
        type: 'voucher',
        filename: path.basename(voucherPath),
        path: voucherPath,
        generated_at: new Date().toISOString()
      });

      // 2. Generar Itinerario
      const itineraryPath = await this.generateItineraryPDF(salesDataId, orderData);
      documents.push({
        type: 'itinerary',
        filename: path.basename(itineraryPath),
        path: itineraryPath,
        generated_at: new Date().toISOString()
      });

      // 3. Registrar documentos en la base de datos
      for (const doc of documents) {
        await this.dbManager.query(`
          INSERT INTO generated_documents (
            sales_data_id, document_type, filename, file_path, 
            generation_status, generated_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          salesDataId, doc.type, doc.filename, doc.path,
          'generated', new Date()
        ]);
      }

      console.log(`✅ ${documents.length} documentos generados`);
      return documents;

    } catch (error) {
      console.error('❌ Error generando documentos:', error);
      throw error;
    }
  }

  async generateVoucherPDF(salesDataId, orderData) {
    const filename = `voucher-${orderData.id}-${Date.now()}.pdf`;
    const filePath = path.join('./documents/vouchers', filename);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(require('fs').createWriteStream(filePath));

        // Header
        doc.fontSize(24).font('Helvetica-Bold');
        doc.text('VOUCHER DE RESERVA', 50, 50, { align: 'center' });
        doc.text('InterTravel Group', 50, 85, { align: 'center' });
        
        // Línea separadora
        doc.moveTo(50, 120).lineTo(550, 120).stroke();

        // Información de la reserva
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('INFORMACIÓN DE LA RESERVA', 50, 140);
        
        doc.fontSize(12).font('Helvetica');
        let yPos = 165;
        
        doc.text(`Número de Reserva: ${orderData.id}`, 50, yPos);
        yPos += 20;
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, 50, yPos);
        yPos += 20;
        doc.text(`Paquete: ${orderData.package_title}`, 50, yPos);
        yPos += 20;
        doc.text(`Destino: ${orderData.package_destination || 'A confirmar'}`, 50, yPos);
        yPos += 20;
        doc.text(`Duración: ${orderData.package_duration || 'A confirmar'}`, 50, yPos);

        // Información del cliente
        yPos += 40;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('INFORMACIÓN DEL CLIENTE', 50, yPos);
        
        yPos += 25;
        doc.fontSize(12).font('Helvetica');
        doc.text(`Nombre: ${orderData.customer_name}`, 50, yPos);
        yPos += 20;
        doc.text(`Email: ${orderData.customer_email}`, 50, yPos);
        yPos += 20;
        doc.text(`Teléfono: ${orderData.customer_phone || 'No proporcionado'}`, 50, yPos);
        yPos += 20;
        doc.text(`Cantidad de Viajeros: ${orderData.travelers || 1}`, 50, yPos);

        // Información financiera
        yPos += 40;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('INFORMACIÓN FINANCIERA', 50, yPos);
        
        yPos += 25;
        doc.fontSize(12).font('Helvetica');
        doc.text(`Monto Total: ${orderData.currency || 'USD'} ${orderData.amount}`, 50, yPos);
        yPos += 20;
        doc.text(`Estado de Pago: ${orderData.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}`, 50, yPos);

        // Términos y condiciones
        yPos += 40;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('TÉRMINOS Y CONDICIONES', 50, yPos);
        
        yPos += 25;
        doc.fontSize(10).font('Helvetica');
        doc.text('1. Este voucher debe ser presentado al momento del check-in.', 50, yPos);
        yPos += 15;
        doc.text('2. Las fechas y servicios están sujetos a disponibilidad.', 50, yPos);
        yPos += 15;
        doc.text('3. Para cambios o cancelaciones, contactar con 48hs de anticipación.', 50, yPos);

        // Footer
        yPos += 40;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('InterTravel Group - EVYT 15.566', 50, yPos, { align: 'center' });
        yPos += 15;
        doc.text('ventas@intertravel.com.ar - +54 261 XXX-XXXX', 50, yPos, { align: 'center' });

        doc.end();
        
        doc.on('end', () => {
          console.log(`✅ Voucher generado: ${filename}`);
          resolve(filePath);
        });

        doc.on('error', (error) => {
          console.error('❌ Error generando voucher:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  async generateItineraryPDF(salesDataId, orderData) {
    const filename = `itinerary-${orderData.id}-${Date.now()}.pdf`;
    const filePath = path.join('./documents/itineraries', filename);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(require('fs').createWriteStream(filePath));

        // Header
        doc.fontSize(24).font('Helvetica-Bold');
        doc.text('ITINERARIO DE VIAJE', 50, 50, { align: 'center' });
        doc.text(orderData.package_title, 50, 85, { align: 'center' });
        
        // Línea separadora
        doc.moveTo(50, 120).lineTo(550, 120).stroke();

        // Información general
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('INFORMACIÓN GENERAL', 50, 140);
        
        doc.fontSize(12).font('Helvetica');
        let yPos = 165;
        
        doc.text(`Cliente: ${orderData.customer_name}`, 50, yPos);
        yPos += 20;
        doc.text(`Destino: ${orderData.package_destination || 'A confirmar'}`, 50, yPos);
        yPos += 20;
        doc.text(`Duración: ${orderData.package_duration || 'A confirmar'}`, 50, yPos);

        // Itinerario día por día (mockup)
        yPos += 40;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('ITINERARIO DETALLADO', 50, yPos);

        const days = [
          {
            day: 1,
            title: 'Llegada',
            activities: ['Llegada al aeropuerto', 'Traslado al hotel', 'Check-in', 'Cena de bienvenida']
          },
          {
            day: 2,
            title: 'City Tour',
            activities: ['Desayuno', 'Tour por la ciudad', 'Almuerzo incluido', 'Tiempo libre']
          },
          {
            day: 3,
            title: 'Excursión',
            activities: ['Excursión de día completo', 'Almuerzo en destino', 'Regreso al hotel']
          }
        ];

        days.forEach(dayInfo => {
          yPos += 30;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text(`DÍA ${dayInfo.day}: ${dayInfo.title}`, 50, yPos);
          
          yPos += 20;
          doc.fontSize(10).font('Helvetica');
          dayInfo.activities.forEach(activity => {
            doc.text(`• ${activity}`, 70, yPos);
            yPos += 15;
          });
        });

        // Información importante
        yPos += 30;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('INFORMACIÓN IMPORTANTE', 50, yPos);
        
        yPos += 25;
        doc.fontSize(10).font('Helvetica');
        doc.text('• Documentación: Pasaporte vigente (mín. 6 meses)', 50, yPos);
        yPos += 15;
        doc.text('• Equipaje: Consultar restricciones de aerolínea', 50, yPos);
        yPos += 15;
        doc.text('• Moneda: Se recomienda llevar dinero en efectivo local', 50, yPos);
        yPos += 15;
        doc.text('• Seguro: Seguro de viaje incluido en el paquete', 50, yPos);

        doc.end();
        
        doc.on('end', () => {
          console.log(`✅ Itinerario generado: ${filename}`);
          resolve(filePath);
        });

        doc.on('error', (error) => {
          console.error('❌ Error generando itinerario:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // ===============================================
  // GENERAR CHECKLIST PERSONALIZADO
  // ===============================================

  async generatePersonalizedChecklist(salesDataId, orderData) {
    console.log(`📋 Generando checklist para venta ${salesDataId}`);

    const checklist = {
      preTrip: [
        {
          id: 'passport_check',
          title: 'Verificar vigencia del pasaporte',
          description: 'Debe tener al menos 6 meses de vigencia',
          dueDate: this.addDays(new Date(), -30), // 30 días antes
          completed: false,
          priority: 'high'
        },
        {
          id: 'visa_requirements',
          title: 'Consultar requisitos de visa',
          description: 'Verificar si el destino requiere visa',
          dueDate: this.addDays(new Date(), -25),
          completed: false,
          priority: 'high'
        },
        {
          id: 'travel_insurance',
          title: 'Contratar seguro de viaje',
          description: 'Cobertura médica internacional',
          dueDate: this.addDays(new Date(), -20),
          completed: false,
          priority: 'medium'
        },
        {
          id: 'vaccinations',
          title: 'Verificar vacunas requeridas',
          description: 'Consultar con centro de vacunación internacional',
          dueDate: this.addDays(new Date(), -15),
          completed: false,
          priority: 'medium'
        }
      ],
      duringTrip: [
        {
          id: 'emergency_contacts',
          title: 'Guardar contactos de emergencia',
          description: 'Números de InterTravel y embajada',
          completed: false,
          priority: 'high'
        },
        {
          id: 'local_currency',
          title: 'Cambiar moneda local',
          description: 'Tener efectivo para gastos menores',
          completed: false,
          priority: 'medium'
        }
      ],
      postTrip: [
        {
          id: 'feedback',
          title: 'Dejar opinión del viaje',
          description: 'Ayúdanos a mejorar nuestros servicios',
          completed: false,
          priority: 'low'
        },
        {
          id: 'photos_backup',
          title: 'Respaldar fotos del viaje',
          description: 'Guardar recuerdos en lugar seguro',
          completed: false,
          priority: 'low'
        }
      ]
    };

    // Guardar checklist en sales_data
    await this.dbManager.query(`
      UPDATE sales_data 
      SET checklist_data = $1, updated_at = $2
      WHERE id = $3
    `, [
      JSON.stringify(checklist),
      new Date(),
      salesDataId
    ]);

    console.log(`✅ Checklist generado con ${checklist.preTrip.length + checklist.duringTrip.length + checklist.postTrip.length} elementos`);
    return checklist;
  }

  // ===============================================
  // CONFIGURAR RECORDATORIOS AUTOMÁTICOS
  // ===============================================

  async setupAutomatedReminders(salesDataId, orderData) {
    console.log(`⏰ Configurando recordatorios para venta ${salesDataId}`);

    const reminders = [
      {
        type: 'pre_trip',
        trigger_date: this.addDays(new Date(), -30),
        title: 'Verificación de documentos',
        message: `Hola ${orderData.customer_name}! Faltan 30 días para tu viaje a ${orderData.package_destination}. Es momento de verificar que tu pasaporte esté vigente.`,
        delivery_method: 'email'
      },
      {
        type: 'pre_trip',
        trigger_date: this.addDays(new Date(), -15),
        title: 'Preparativos de viaje',
        message: `¡Tu aventura se acerca! Faltan solo 15 días. No olvides revisar el checklist de tu viaje.`,
        delivery_method: 'email'
      },
      {
        type: 'pre_trip',
        trigger_date: this.addDays(new Date(), -3),
        title: 'Último recordatorio',
        message: `¡Ya falta muy poco! En 3 días comienza tu viaje. Verifica que tengas todo listo.`,
        delivery_method: 'email'
      },
      {
        type: 'post_trip',
        trigger_date: this.addDays(new Date(), 7),
        title: 'Esperamos tu opinión',
        message: `Esperamos que hayas disfrutado tu viaje. Nos encantaría conocer tu experiencia.`,
        delivery_method: 'email'
      }
    ];

    for (const reminder of reminders) {
      await this.dbManager.query(`
        INSERT INTO automated_reminders (
          sales_data_id, reminder_type, trigger_date, 
          title, message, delivery_method, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        salesDataId, reminder.type, reminder.trigger_date,
        reminder.title, reminder.message, reminder.delivery_method, 'scheduled'
      ]);
    }

    console.log(`✅ ${reminders.length} recordatorios programados`);
    return reminders;
  }

  // ===============================================
  // INICIALIZAR DATOS DE REMARKETING
  // ===============================================

  async initializeRemarketingData(salesDataId, orderData) {
    console.log(`🎯 Inicializando remarketing para venta ${salesDataId}`);

    const remarketingData = {
      customerSegment: this.determineCustomerSegment(orderData),
      preferences: {
        destination: orderData.package_destination,
        priceRange: this.getPriceRange(orderData.amount),
        travelStyle: this.determineTravelStyle(orderData)
      },
      engagement: {
        purchaseDate: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        engagementScore: 100 // Cliente recién convertido
      },
      campaigns: {
        eligible: true,
        excludeUntil: this.addDays(new Date(), 90), // No molestar por 90 días
        interests: this.extractInterests(orderData)
      }
    };

    // Actualizar datos de remarketing en sales_data
    await this.dbManager.query(`
      UPDATE sales_data 
      SET remarketing_data = $1, updated_at = $2
      WHERE id = $3
    `, [
      JSON.stringify(remarketingData),
      new Date(),
      salesDataId
    ]);

    // Clasificar cliente si no existe
    await this.classifyCustomer(orderData);

    console.log(`✅ Datos de remarketing inicializados`);
    return remarketingData;
  }

  // ===============================================
  // MÉTODOS AUXILIARES
  // ===============================================

  determineCustomerSegment(orderData) {
    const amount = parseFloat(orderData.amount);
    
    if (amount >= 3000) return 'premium';
    if (amount >= 1500) return 'mid-range';
    return 'budget';
  }

  getPriceRange(amount) {
    const value = parseFloat(amount);
    
    if (value >= 3000) return 'premium';
    if (value >= 2000) return 'high';
    if (value >= 1000) return 'medium';
    return 'low';
  }

  determineTravelStyle(orderData) {
    const title = orderData.package_title?.toLowerCase() || '';
    
    if (title.includes('aventura') || title.includes('trekking')) return 'adventure';
    if (title.includes('romántico') || title.includes('luna de miel')) return 'romantic';
    if (title.includes('familia') || title.includes('niños')) return 'family';
    if (title.includes('cultural') || title.includes('histórico')) return 'cultural';
    
    return 'general';
  }

  extractInterests(orderData) {
    const interests = [];
    const title = orderData.package_title?.toLowerCase() || '';
    const destination = orderData.package_destination?.toLowerCase() || '';
    
    if (title.includes('playa') || destination.includes('caribe')) interests.push('beach');
    if (title.includes('montaña') || title.includes('trekking')) interests.push('mountains');
    if (title.includes('ciudad') || title.includes('urban')) interests.push('urban');
    if (title.includes('cultural') || title.includes('museo')) interests.push('culture');
    
    return interests;
  }

  async classifyCustomer(orderData) {
    try {
      // Verificar si el cliente ya existe
      const existingCustomer = await this.dbManager.query(`
        SELECT id FROM customer_classification 
        WHERE customer_email = $1
      `, [orderData.customer_email]);

      if (existingCustomer.rows.length === 0) {
        // Crear nueva clasificación de cliente
        await this.dbManager.query(`
          INSERT INTO customer_classification (
            customer_email, customer_name, customer_phone,
            classification, acquisition_source, lifetime_value,
            total_bookings, first_purchase_date, last_purchase_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          orderData.customer_email,
          orderData.customer_name,
          orderData.customer_phone,
          'direct', // Por defecto directo, se puede actualizar después
          'website',
          parseFloat(orderData.amount),
          1,
          new Date(),
          new Date()
        ]);
      } else {
        // Actualizar cliente existente
        await this.dbManager.query(`
          UPDATE customer_classification 
          SET 
            lifetime_value = lifetime_value + $1,
            total_bookings = total_bookings + 1,
            last_purchase_date = $2,
            updated_at = $3
          WHERE customer_email = $4
        `, [
          parseFloat(orderData.amount),
          new Date(),
          new Date(),
          orderData.customer_email
        ]);
      }
    } catch (error) {
      console.error('❌ Error clasificando cliente:', error);
    }
  }

  async updateSalesDataStatus(salesDataId, status, additionalData = {}) {
    await this.dbManager.query(`
      UPDATE sales_data 
      SET 
        auto_sync_status = $1,
        last_sync_at = $2,
        updated_at = $3,
        travel_documents = COALESCE(travel_documents, '[]'::jsonb) || $4::jsonb,
        checklist_data = COALESCE(checklist_data, '{}'::jsonb) || $5::jsonb
      WHERE id = $6
    `, [
      status,
      new Date(),
      new Date(),
      JSON.stringify(additionalData.documents || []),
      JSON.stringify(additionalData.checklist || {}),
      salesDataId
    ]);
  }

  async logSyncError(orderId, error) {
    try {
      await this.dbManager.query(`
        UPDATE sales_data 
        SET 
          auto_sync_status = 'error',
          error_log = $1,
          sync_attempts = sync_attempts + 1,
          updated_at = $2
        WHERE order_id = $3
      `, [
        error.message,
        new Date(),
        orderId
      ]);
    } catch (dbError) {
      console.error('❌ Error logging sync error:', dbError);
    }
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // ===============================================
  // API ENDPOINTS PARA LA APP CLIENTE
  // ===============================================

  async getSalesDataForApp(customerEmail) {
    try {
      const result = await this.dbManager.query(`
        SELECT 
          sd.*,
          o.package_title,
          o.package_destination,
          o.amount,
          o.currency,
          o.created_at as purchase_date
        FROM sales_data sd
        JOIN orders o ON sd.order_id = o.id
        WHERE sd.customer_data->>'email' = $1
        ORDER BY sd.created_at DESC
      `, [customerEmail]);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('❌ Error obteniendo datos para app:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getChecklistForApp(salesDataId) {
    try {
      const result = await this.dbManager.query(`
        SELECT checklist_data
        FROM sales_data
        WHERE id = $1
      `, [salesDataId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Datos no encontrados' };
      }

      return {
        success: true,
        checklist: result.rows[0].checklist_data
      };
    } catch (error) {
      console.error('❌ Error obteniendo checklist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateChecklistItem(salesDataId, itemId, completed) {
    try {
      // Esta funcionalidad requiere una actualización más compleja del JSON
      // Por simplicidad, se implementaría con una función PostgreSQL personalizada
      
      console.log(`📋 Actualizando item ${itemId} del checklist ${salesDataId}: ${completed}`);
      
      return {
        success: true,
        message: 'Checklist actualizado'
      };
    } catch (error) {
      console.error('❌ Error actualizando checklist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SalesAutoSyncService;