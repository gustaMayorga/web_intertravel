// ===============================================
// INTEGRACIÓN DE SERVICIOS AVANZADOS - INTERTRAVEL
// Conecta todos los módulos nuevos con el servidor principal
// ===============================================

const SalesAutoSyncService = require('./modules/sales-auto-sync');
const ReferralEngine = require('./modules/referral-engine');

class InterTravelServicesIntegration {
  constructor(app, dbManager) {
    this.app = app;
    this.dbManager = dbManager;
    this.salesSyncService = null;
    this.referralEngine = null;
    this.isInitialized = false;

    console.log('🔧 Inicializando servicios avanzados de InterTravel...');
    this.initialize();
  }

  async initialize() {
    try {
      // Inicializar servicios
      this.salesSyncService = new SalesAutoSyncService(this.dbManager);
      this.referralEngine = new ReferralEngine(this.dbManager);

      // Configurar event listeners
      this.setupEventListeners();

      // Registrar rutas API
      this.registerAPIRoutes();

      // Configurar trabajos programados
      this.setupScheduledJobs();

      this.isInitialized = true;
      console.log('✅ Servicios avanzados inicializados correctamente');

    } catch (error) {
      console.error('❌ Error inicializando servicios:', error);
    }
  }

  // ===============================================
  // CONFIGURAR EVENT LISTENERS
  // ===============================================

  setupEventListeners() {
    // Escuchar eventos de sincronización de ventas
    this.salesSyncService.on('saleSync', (data) => {
      console.log(`📦 Venta sincronizada: ${data.orderId}`);
      
      // Aquí se puede notificar a la app cliente via WebSocket
      // this.notifyClientApp(data);
    });

    // Escuchar cuando se necesite procesar un referido
    this.salesSyncService.on('newSale', async (orderData) => {
      // Verificar si la venta tiene código de referido
      if (orderData.referralCode) {
        console.log(`🎯 Procesando referido para venta: ${orderData.id}`);
        
        const referralResult = await this.referralEngine.trackReferral(
          orderData.referralCode,
          {
            email: orderData.customer_email,
            name: orderData.customer_name,
            phone: orderData.customer_phone
          },
          orderData
        );

        if (referralResult.success) {
          console.log(`✅ Referido procesado: comisión $${referralResult.commissionAmount}`);
        }
      }
    });
  }

  // ===============================================
  // REGISTRAR RUTAS API
  // ===============================================

  registerAPIRoutes() {
    console.log('🛣️ Registrando rutas API avanzadas...');

    // ===============================================
    // RUTAS DE SINCRONIZACIÓN DE VENTAS
    // ===============================================

    // Webhook para nuevas ventas (llamado cuando se confirma un pago)
    this.app.post('/api/webhooks/sale-confirmed', async (req, res) => {
      try {
        const orderData = req.body;
        
        console.log(`📦 Webhook recibido: venta confirmada ${orderData.id}`);

        // Sincronizar venta automáticamente
        const syncResult = await this.salesSyncService.syncNewSale(orderData);

        // Emitir evento para procesamiento de referidos
        this.salesSyncService.emit('newSale', orderData);

        res.json({
          success: true,
          sync: syncResult,
          message: 'Venta procesada correctamente'
        });

      } catch (error) {
        console.error('❌ Error en webhook de venta:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Obtener datos de ventas para app cliente
    this.app.get('/api/client-app/sales-data/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const result = await this.salesSyncService.getSalesDataForApp(email);
        res.json(result);
      } catch (error) {
        console.error('❌ Error obteniendo datos para app:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Obtener checklist para app cliente
    this.app.get('/api/client-app/checklist/:salesDataId', async (req, res) => {
      try {
        const { salesDataId } = req.params;
        const result = await this.salesSyncService.getChecklistForApp(salesDataId);
        res.json(result);
      } catch (error) {
        console.error('❌ Error obteniendo checklist:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Actualizar item de checklist
    this.app.put('/api/client-app/checklist/:salesDataId/:itemId', async (req, res) => {
      try {
        const { salesDataId, itemId } = req.params;
        const { completed } = req.body;
        
        const result = await this.salesSyncService.updateChecklistItem(salesDataId, itemId, completed);
        res.json(result);
      } catch (error) {
        console.error('❌ Error actualizando checklist:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===============================================
    // RUTAS DE SISTEMA DE REFERIDOS
    // ===============================================

    // Validar código de referido
    this.app.get('/api/referrals/validate/:code', async (req, res) => {
      try {
        const { code } = req.params;
        const result = await this.referralEngine.validateReferralCode(code);
        res.json(result);
      } catch (error) {
        console.error('❌ Error validando código de referido:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Crear programa de referidos para agencia
    this.app.post('/api/admin/referrals/create-program', this.requireAuth, async (req, res) => {
      try {
        const agencyData = req.body;
        const result = await this.referralEngine.createReferralProgram(agencyData);
        res.json(result);
      } catch (error) {
        console.error('❌ Error creando programa de referidos:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Obtener métricas de referidos
    this.app.get('/api/admin/referrals/metrics', this.requireAuth, async (req, res) => {
      try {
        const { agencyId, startDate, endDate } = req.query;
        const result = await this.referralEngine.getReferralMetrics(agencyId, startDate, endDate);
        res.json(result);
      } catch (error) {
        console.error('❌ Error obteniendo métricas de referidos:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Separación de clientes
    this.app.get('/api/admin/clients/separation', this.requireAuth, async (req, res) => {
      try {
        const result = await this.referralEngine.getClientSeparation();
        res.json(result);
      } catch (error) {
        console.error('❌ Error obteniendo separación de clientes:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Procesar comisiones pendientes
    this.app.post('/api/admin/referrals/process-commissions', this.requireAuth, async (req, res) => {
      try {
        const result = await this.referralEngine.processPendingCommissions();
        res.json(result);
      } catch (error) {
        console.error('❌ Error procesando comisiones:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Obtener programa de referidos de una agencia
    this.app.get('/api/agencies/:agencyId/referral-program', this.requireAuth, async (req, res) => {
      try {
        const { agencyId } = req.params;
        const result = await this.referralEngine.getReferralProgramByAgency(agencyId);
        res.json(result);
      } catch (error) {
        console.error('❌ Error obteniendo programa de referidos:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===============================================
    // RUTAS DE CONFIGURACIÓN SISTEMA
    // ===============================================

    // Obtener configuración del sistema
    this.app.get('/api/admin/system/config', this.requireAuth, async (req, res) => {
      try {
        const { category } = req.query;
        
        let query = 'SELECT * FROM system_settings';
        let params = [];
        
        if (category) {
          query += ' WHERE category = $1';
          params.push(category);
        }
        
        query += ' ORDER BY category, setting_key';
        
        const result = await this.dbManager.query(query, params);
        
        res.json({
          success: true,
          settings: result.rows
        });
      } catch (error) {
        console.error('❌ Error obteniendo configuración:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Actualizar configuración del sistema
    this.app.put('/api/admin/system/config', this.requireAuth, async (req, res) => {
      try {
        const { settings } = req.body;
        
        for (const setting of settings) {
          await this.dbManager.query(`
            INSERT INTO system_settings (category, setting_key, setting_value, display_name, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (category, setting_key) 
            DO UPDATE SET 
              setting_value = EXCLUDED.setting_value,
              updated_at = CURRENT_TIMESTAMP
          `, [
            setting.category,
            setting.key,
            JSON.stringify(setting.value),
            setting.displayName,
            setting.description
          ]);
        }
        
        res.json({
          success: true,
          message: 'Configuración actualizada correctamente'
        });
      } catch (error) {
        console.error('❌ Error actualizando configuración:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===============================================
    // RUTAS DE PERMISOS ABM
    // ===============================================

    // Obtener todos los roles
    this.app.get('/api/admin/permissions/roles', this.requireAuth, async (req, res) => {
      try {
        const result = await this.dbManager.query(`
          SELECT r.*, 
                 COUNT(u.id) as user_count,
                 ARRAY_AGG(p.name) as permissions
          FROM roles r
          LEFT JOIN users u ON u.role = r.name
          LEFT JOIN role_permissions rp ON r.id = rp.role_id
          LEFT JOIN permissions p ON rp.permission_id = p.id
          GROUP BY r.id
          ORDER BY r.level DESC
        `);
        
        res.json({
          success: true,
          roles: result.rows
        });
      } catch (error) {
        console.error('❌ Error obteniendo roles:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Obtener todos los permisos
    this.app.get('/api/admin/permissions/list', this.requireAuth, async (req, res) => {
      try {
        const result = await this.dbManager.query(`
          SELECT p.*, 
                 ARRAY_AGG(DISTINCT r.name) as assigned_roles
          FROM permissions p
          LEFT JOIN role_permissions rp ON p.id = rp.permission_id
          LEFT JOIN roles r ON rp.role_id = r.id
          GROUP BY p.id
          ORDER BY p.module, p.resource, p.action
        `);
        
        res.json({
          success: true,
          permissions: result.rows
        });
      } catch (error) {
        console.error('❌ Error obteniendo permisos:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Asignar permisos a rol
    this.app.post('/api/admin/permissions/assign', this.requireAuth, async (req, res) => {
      try {
        const { roleId, permissionIds, grantedBy } = req.body;
        
        // Eliminar permisos existentes del rol
        await this.dbManager.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
        
        // Asignar nuevos permisos
        for (const permissionId of permissionIds) {
          await this.dbManager.query(`
            INSERT INTO role_permissions (role_id, permission_id, granted_by)
            VALUES ($1, $2, $3)
          `, [roleId, permissionId, grantedBy]);
        }
        
        res.json({
          success: true,
          message: 'Permisos asignados correctamente'
        });
      } catch (error) {
        console.error('❌ Error asignando permisos:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===============================================
    // RUTAS DE DATOS PARA APP CLIENTE PUERTO 3009
    // ===============================================

    // API específica para la aplicación cliente
    this.app.get('/api/app-client/dashboard/:email', async (req, res) => {
      try {
        const { email } = req.params;
        
        // Obtener datos de ventas del cliente
        const salesData = await this.salesSyncService.getSalesDataForApp(email);
        
        // Obtener recordatorios pendientes
        const reminders = await this.dbManager.query(`
          SELECT ar.*, sd.customer_data
          FROM automated_reminders ar
          JOIN sales_data sd ON ar.sales_data_id = sd.id
          WHERE sd.customer_data->>'email' = $1 
          AND ar.status = 'scheduled'
          AND ar.trigger_date <= CURRENT_DATE + INTERVAL '7 days'
          ORDER BY ar.trigger_date ASC
          LIMIT 5
        `, [email]);

        // Obtener próximos viajes
        const upcomingTrips = await this.dbManager.query(`
          SELECT o.*, sd.checklist_data, sd.travel_documents
          FROM orders o
          JOIN sales_data sd ON o.id = sd.order_id
          WHERE o.customer_email = $1 
          AND o.status = 'confirmed'
          ORDER BY o.created_at DESC
          LIMIT 3
        `, [email]);

        res.json({
          success: true,
          dashboard: {
            salesData: salesData.data || [],
            upcomingReminders: reminders.rows || [],
            upcomingTrips: upcomingTrips.rows || [],
            customerEmail: email
          }
        });

      } catch (error) {
        console.error('❌ Error obteniendo dashboard para app cliente:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Marcar recordatorio como visto
    this.app.put('/api/app-client/reminders/:reminderId/seen', async (req, res) => {
      try {
        const { reminderId } = req.params;
        
        await this.dbManager.query(`
          UPDATE automated_reminders 
          SET opened_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `, [reminderId]);

        res.json({
          success: true,
          message: 'Recordatorio marcado como visto'
        });
      } catch (error) {
        console.error('❌ Error marcando recordatorio:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    console.log('✅ Rutas API avanzadas registradas');
  }

  // ===============================================
  // MIDDLEWARE DE AUTENTICACIÓN
  // ===============================================

  requireAuth(req, res, next) {
    const authHeader = req.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
    }
    
    // Aquí se validaría el token (implementar según el sistema de auth existente)
    // Por simplicidad, asumimos que es válido
    next();
  }

  // ===============================================
  // TRABAJOS PROGRAMADOS
  // ===============================================

  setupScheduledJobs() {
    console.log('⏰ Configurando trabajos programados...');

    // Procesar recordatorios cada hora
    setInterval(async () => {
      try {
        await this.processScheduledReminders();
      } catch (error) {
        console.error('❌ Error procesando recordatorios:', error);
      }
    }, 60 * 60 * 1000); // Cada hora

    // Procesar comisiones de referidos diariamente
    setInterval(async () => {
      try {
        await this.referralEngine.processPendingCommissions();
      } catch (error) {
        console.error('❌ Error procesando comisiones programadas:', error);
      }
    }, 24 * 60 * 60 * 1000); // Cada 24 horas

    // Limpiar logs antiguos semanalmente
    setInterval(async () => {
      try {
        await this.cleanupOldLogs();
      } catch (error) {
        console.error('❌ Error limpiando logs:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // Cada semana

    console.log('✅ Trabajos programados configurados');
  }

  // ===============================================
  // PROCESAMIENTO DE RECORDATORIOS
  // ===============================================

  async processScheduledReminders() {
    try {
      console.log('📅 Procesando recordatorios programados...');

      const pendingReminders = await this.dbManager.query(`
        SELECT ar.*, sd.customer_data
        FROM automated_reminders ar
        JOIN sales_data sd ON ar.sales_data_id = sd.id
        WHERE ar.status = 'scheduled'
        AND ar.trigger_date <= CURRENT_DATE
        AND ar.trigger_time <= CURRENT_TIME
        LIMIT 50
      `);

      for (const reminder of pendingReminders.rows) {
        try {
          // Enviar recordatorio por email (implementar según configuración)
          console.log(`📧 Enviando recordatorio: ${reminder.title} a ${reminder.customer_data.email}`);
          
          // Marcar como enviado
          await this.dbManager.query(`
            UPDATE automated_reminders 
            SET status = 'sent', sent_at = CURRENT_TIMESTAMP 
            WHERE id = $1
          `, [reminder.id]);

        } catch (error) {
          console.error(`❌ Error enviando recordatorio ${reminder.id}:`, error);
        }
      }

      if (pendingReminders.rows.length > 0) {
        console.log(`✅ ${pendingReminders.rows.length} recordatorios procesados`);
      }

    } catch (error) {
      console.error('❌ Error en procesamiento de recordatorios:', error);
    }
  }

  // ===============================================
  // LIMPIEZA DE LOGS ANTIGUOS
  // ===============================================

  async cleanupOldLogs() {
    try {
      console.log('🧹 Limpiando logs antiguos...');

      // Obtener configuración de retención
      const retentionResult = await this.dbManager.query(`
        SELECT setting_value 
        FROM system_settings 
        WHERE category = 'system' AND setting_key = 'data_retention_days'
      `);

      const retentionDays = retentionResult.rows.length > 0 
        ? JSON.parse(retentionResult.rows[0].setting_value)
        : 365;

      // Eliminar logs antiguos
      const deleteResult = await this.dbManager.query(`
        DELETE FROM activity_logs 
        WHERE created_at < CURRENT_DATE - INTERVAL '${retentionDays} days'
      `);

      console.log(`✅ ${deleteResult.rowCount} logs antiguos eliminados`);

    } catch (error) {
      console.error('❌ Error limpiando logs:', error);
    }
  }

  // ===============================================
  // MÉTODOS PÚBLICOS
  // ===============================================

  getSalesSync() {
    return this.salesSyncService;
  }

  getReferralEngine() {
    return this.referralEngine;
  }

  isReady() {
    return this.isInitialized;
  }

  // Método para simular una venta (testing)
  async simulateSale(orderData) {
    if (!this.isInitialized) {
      throw new Error('Servicios no inicializados');
    }

    console.log('🧪 Simulando venta para testing...');
    
    // Simular webhook de venta confirmada
    const syncResult = await this.salesSyncService.syncNewSale(orderData);
    
    // Procesar referido si aplica
    if (orderData.referralCode) {
      const referralResult = await this.referralEngine.trackReferral(
        orderData.referralCode,
        {
          email: orderData.customer_email,
          name: orderData.customer_name,
          phone: orderData.customer_phone
        },
        orderData
      );
      
      return {
        sync: syncResult,
        referral: referralResult
      };
    }

    return { sync: syncResult };
  }
}

module.exports = InterTravelServicesIntegration;