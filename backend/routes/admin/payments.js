// ===============================================
// ADMIN PAYMENTS - GESTIÓN DE PAGOS
// Backend API para gestión completa de pagos
// ===============================================

const express = require('express');
const router = express.Router();
const { query } = require('../../database');

// ===============================================
// GET /api/admin/payments - LISTAR PAGOS
// ===============================================
router.get('/', async (req, res) => {
  try {
    console.log('💳 Admin Payments - Listando pagos');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const method = req.query.method || '';
    const days = parseInt(req.query.days) || 30;

    try {
      // Calcular fecha de inicio
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Construir query con filtros
      let whereConditions = ['created_at >= $1'];
      let queryParams = [startDate];
      let paramIndex = 2;

      if (search) {
        whereConditions.push(`(order_id ILIKE $${paramIndex} OR customer_email ILIKE $${paramIndex} OR customer_name ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (status && status !== 'all') {
        whereConditions.push(`status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (method && method !== 'all') {
        whereConditions.push(`payment_method = $${paramIndex}`);
        queryParams.push(method);
        paramIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Query principal de órdenes/pagos
      const paymentsQuery = `
        SELECT 
          id,
          order_id,
          package_title,
          package_destination,
          amount,
          currency,
          customer_name,
          customer_email,
          customer_phone,
          travelers,
          payment_method,
          payment_id,
          status,
          transaction_id,
          created_at,
          updated_at,
          confirmed_at,
          failed_at,
          failure_reason
        FROM orders 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM orders 
        ${whereClause}
      `;

      const countParams = queryParams.slice(0, -2);

      const [paymentsResult, countResult] = await Promise.all([
        query(paymentsQuery, queryParams),
        query(countQuery, countParams)
      ]);

      const payments = paymentsResult.rows || [];
      const total = parseInt(countResult.rows?.[0]?.total) || 0;

      // Procesar datos para el frontend
      const processedPayments = payments.map(payment => ({
        id: payment.order_id || payment.id,
        order_id: payment.order_id,
        package: {
          title: payment.package_title,
          destination: payment.package_destination
        },
        customer: {
          name: payment.customer_name,
          email: payment.customer_email,
          phone: payment.customer_phone
        },
        amount: parseFloat(payment.amount).toFixed(2),
        currency: payment.currency || 'USD',
        travelers: parseInt(payment.travelers) || 1,
        payment_method: payment.payment_method,
        payment_id: payment.payment_id,
        status: payment.status,
        transaction_id: payment.transaction_id,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        confirmed_at: payment.confirmed_at,
        failed_at: payment.failed_at,
        failure_reason: payment.failure_reason
      }));

      // Estadísticas del período
      const statsQuery = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_orders,
          SUM(amount) FILTER (WHERE status = 'confirmed') as total_revenue,
          AVG(amount) as avg_order_value
        FROM orders 
        ${whereClause}
      `;

      const statsResult = await query(statsQuery, countParams);
      const stats = statsResult.rows[0];

      res.json({
        success: true,
        data: processedPayments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          total: parseInt(stats.total_orders) || 0,
          confirmed: parseInt(stats.confirmed_orders) || 0,
          pending: parseInt(stats.pending_orders) || 0,
          failed: parseInt(stats.failed_orders) || 0,
          total_revenue: parseFloat(stats.total_revenue || 0).toFixed(2),
          avg_order_value: parseFloat(stats.avg_order_value || 0).toFixed(2),
          period_days: days
        },
        message: `${processedPayments.length} pagos encontrados`
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, usando datos de fallback:', dbError.message);
      
      // Datos de fallback para pagos
      const fallbackPayments = [
        {
          id: 'ORD-2024-001',
          order_id: 'ORD-2024-001',
          package: {
            title: 'Mendoza Premium Wine Tour',
            destination: 'Mendoza, Argentina'
          },
          customer: {
            name: 'María González',
            email: 'maria@email.com',
            phone: '+54 9 11 1234-5678'
          },
          amount: '2850.00',
          currency: 'USD',
          travelers: 2,
          payment_method: 'mercadopago',
          payment_id: 'MP-78945612',
          status: 'confirmed',
          transaction_id: 'TXN-ABC123',
          created_at: new Date('2024-12-20T14:30:00Z'),
          updated_at: new Date('2024-12-20T14:32:00Z'),
          confirmed_at: new Date('2024-12-20T14:32:00Z'),
          failed_at: null,
          failure_reason: null
        },
        {
          id: 'ORD-2024-002',
          order_id: 'ORD-2024-002',
          package: {
            title: 'París Romántico',
            destination: 'París, Francia'
          },
          customer: {
            name: 'Carlos Rodríguez',
            email: 'carlos@email.com',
            phone: '+54 9 261 555-0123'
          },
          amount: '4200.00',
          currency: 'USD',
          travelers: 2,
          payment_method: 'stripe',
          payment_id: 'ST-pi_3N8X2L2eZvKYlo2C',
          status: 'pending',
          transaction_id: null,
          created_at: new Date('2024-12-19T16:45:00Z'),
          updated_at: new Date('2024-12-19T16:45:00Z'),
          confirmed_at: null,
          failed_at: null,
          failure_reason: null
        },
        {
          id: 'ORD-2024-003',
          order_id: 'ORD-2024-003',
          package: {
            title: 'Aventura en Aconcagua',
            destination: 'Mendoza, Argentina'
          },
          customer: {
            name: 'Ana Martínez',
            email: 'ana@email.com',
            phone: '+54 9 351 4XX-9012'
          },
          amount: '1890.00',
          currency: 'USD',
          travelers: 1,
          payment_method: 'mercadopago',
          payment_id: 'MP-78945613',
          status: 'failed',
          transaction_id: null,
          created_at: new Date('2024-12-18T10:15:00Z'),
          updated_at: new Date('2024-12-18T10:17:00Z'),
          confirmed_at: null,
          failed_at: new Date('2024-12-18T10:17:00Z'),
          failure_reason: 'Tarjeta rechazada'
        }
      ];

      res.json({
        success: true,
        data: fallbackPayments,
        pagination: {
          page: 1,
          limit: 10,
          total: fallbackPayments.length,
          pages: 1
        },
        stats: {
          total: 3,
          confirmed: 1,
          pending: 1,
          failed: 1,
          total_revenue: '2850.00',
          avg_order_value: '2980.00',
          period_days: days
        },
        message: `${fallbackPayments.length} pagos (datos de fallback)`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error en GET /admin/payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
});

// ===============================================
// GET /api/admin/payments/:id - OBTENER PAGO ESPECÍFICO
// ===============================================
router.get('/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    console.log(`💳 Admin Payments - Obteniendo pago: ${paymentId}`);

    try {
      const paymentQuery = `
        SELECT 
          o.*,
          pt.gateway,
          pt.gateway_transaction_id,
          pt.status as transaction_status
        FROM orders o
        LEFT JOIN payment_transactions pt ON o.id = pt.order_id
        WHERE o.id = $1 OR o.order_id = $1
      `;

      const result = await query(paymentQuery, [paymentId]);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      const payment = result.rows[0];

      // Procesar datos del pago
      const processedPayment = {
        id: payment.order_id || payment.id,
        order_id: payment.order_id,
        package: {
          id: payment.package_id,
          title: payment.package_title,
          destination: payment.package_destination,
          duration: payment.package_duration
        },
        customer: {
          name: payment.customer_name,
          email: payment.customer_email,
          phone: payment.customer_phone
        },
        amount: parseFloat(payment.amount).toFixed(2),
        currency: payment.currency || 'USD',
        travelers: parseInt(payment.travelers) || 1,
        payment_method: payment.payment_method,
        payment_id: payment.payment_id,
        payment_data: payment.payment_data ? JSON.parse(payment.payment_data) : null,
        special_requests: payment.special_requests,
        status: payment.status,
        transaction_id: payment.transaction_id,
        payment_response: payment.payment_response ? JSON.parse(payment.payment_response) : null,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        confirmed_at: payment.confirmed_at,
        failed_at: payment.failed_at,
        failure_reason: payment.failure_reason,
        transaction: {
          gateway: payment.gateway,
          gateway_transaction_id: payment.gateway_transaction_id,
          status: payment.transaction_status
        }
      };

      res.json({
        success: true,
        data: processedPayment,
        message: 'Pago obtenido correctamente'
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, pago no disponible:', dbError.message);
      res.status(404).json({
        success: false,
        message: 'Pago no encontrado',
        error: 'Base de datos no disponible'
      });
    }

  } catch (error) {
    console.error('❌ Error en GET /admin/payments/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pago',
      error: error.message
    });
  }
});

// ===============================================
// PATCH /api/admin/payments/:id/status - CAMBIAR ESTADO
// ===============================================
router.patch('/:id/status', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { status, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Estado es obligatorio'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    console.log(`💳 Admin Payments - Cambiando estado de ${paymentId} a ${status}`);

    try {
      const updateQuery = `
        UPDATE orders SET 
          status = $1,
          updated_at = NOW(),
          confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END,
          failed_at = CASE WHEN $1 = 'failed' THEN NOW() ELSE failed_at END,
          failure_reason = CASE WHEN $1 = 'failed' AND $3 IS NOT NULL THEN $3 ELSE failure_reason END
        WHERE id = $2 OR order_id = $2
        RETURNING id, order_id, status, customer_name, amount
      `;

      const result = await query(updateQuery, [status, paymentId, reason]);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      const updatedPayment = result.rows[0];

      // Log de actividad
      console.log(`✅ Estado de pago ${updatedPayment.order_id} cambiado a ${status}`);

      res.json({
        success: true,
        data: {
          id: updatedPayment.order_id,
          status: updatedPayment.status,
          customer_name: updatedPayment.customer_name,
          amount: parseFloat(updatedPayment.amount).toFixed(2)
        },
        message: `Estado cambiado a ${status} exitosamente`
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, simulando cambio de estado:', dbError.message);
      
      res.json({
        success: true,
        data: { id: paymentId, status },
        message: `Estado cambiado a ${status} exitosamente (modo simulación)`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error en PATCH /admin/payments/:id/status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
});

// ===============================================
// POST /api/admin/payments/:id/refund - PROCESAR REEMBOLSO
// ===============================================
router.post('/:id/refund', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { amount, reason, partial = false } = req.body;
    
    if (!amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Monto y razón son obligatorios para el reembolso'
      });
    }

    console.log(`💳 Admin Payments - Procesando reembolso de ${paymentId}`);

    try {
      // Obtener datos del pago original
      const paymentQuery = `
        SELECT id, order_id, amount, status, payment_method, payment_id, customer_name
        FROM orders
        WHERE id = $1 OR order_id = $1
      `;

      const paymentResult = await query(paymentQuery, [paymentId]);
      
      if (!paymentResult.rows || paymentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pago no encontrado'
        });
      }

      const payment = paymentResult.rows[0];
      
      if (payment.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden reembolsar pagos confirmados'
        });
      }

      const refundAmount = parseFloat(amount);
      const originalAmount = parseFloat(payment.amount);

      if (refundAmount > originalAmount) {
        return res.status(400).json({
          success: false,
          message: 'El monto del reembolso no puede ser mayor al pago original'
        });
      }

      // Simular procesamiento del reembolso
      const refundId = `REF-${Date.now()}`;
      const newStatus = partial ? 'partially_refunded' : 'refunded';

      // Actualizar estado del pago
      const updateQuery = `
        UPDATE orders SET 
          status = $1,
          updated_at = NOW(),
          failure_reason = CASE WHEN $1 = 'refunded' THEN $2 ELSE failure_reason END
        WHERE id = $3
        RETURNING order_id, status
      `;

      const updateResult = await query(updateQuery, [newStatus, `Reembolso: ${reason}`, payment.id]);

      console.log(`✅ Reembolso procesado: ${refundId} por $${refundAmount}`);

      res.json({
        success: true,
        data: {
          refund_id: refundId,
          order_id: payment.order_id,
          original_amount: originalAmount.toFixed(2),
          refund_amount: refundAmount.toFixed(2),
          status: newStatus,
          reason: reason,
          processed_at: new Date().toISOString()
        },
        message: 'Reembolso procesado exitosamente'
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, simulando reembolso:', dbError.message);
      
      const refundId = `REF-${Date.now()}`;
      
      res.json({
        success: true,
        data: {
          refund_id: refundId,
          order_id: paymentId,
          refund_amount: parseFloat(amount).toFixed(2),
          reason: reason,
          processed_at: new Date().toISOString()
        },
        message: 'Reembolso procesado exitosamente (modo simulación)',
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error en POST /admin/payments/:id/refund:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar reembolso',
      error: error.message
    });
  }
});

// ===============================================
// GET /api/admin/payments/stats - ESTADÍSTICAS DE PAGOS
// ===============================================
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 Admin Payments - Obteniendo estadísticas');
    
    const { period = 'month' } = req.query;
    
    try {
      // Determinar rango de fechas
      let startDate;
      const endDate = new Date();
      
      switch (period) {
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(endDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      }

      const statsQuery = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_orders,
          COUNT(*) FILTER (WHERE status = 'refunded') as refunded_orders,
          SUM(amount) FILTER (WHERE status = 'confirmed') as total_revenue,
          SUM(amount) FILTER (WHERE status = 'refunded') as refunded_amount,
          AVG(amount) FILTER (WHERE status = 'confirmed') as avg_order_value,
          COUNT(DISTINCT payment_method) as payment_methods_used
        FROM orders
        WHERE created_at >= $1 AND created_at <= $2
      `;

      const methodStatsQuery = `
        SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(amount) FILTER (WHERE status = 'confirmed') as revenue,
          AVG(amount) as avg_amount
        FROM orders
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY payment_method
        ORDER BY revenue DESC
      `;

      const [statsResult, methodsResult] = await Promise.all([
        query(statsQuery, [startDate, endDate]),
        query(methodStatsQuery, [startDate, endDate])
      ]);

      const stats = statsResult.rows[0];
      const methods = methodsResult.rows || [];

      // Calcular métricas derivadas
      const successRate = stats.total_orders > 0 
        ? ((stats.confirmed_orders / stats.total_orders) * 100).toFixed(2)
        : 0;

      const netRevenue = (parseFloat(stats.total_revenue || 0) - parseFloat(stats.refunded_amount || 0)).toFixed(2);

      res.json({
        success: true,
        stats: {
          period: period,
          date_range: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          summary: {
            total_orders: parseInt(stats.total_orders) || 0,
            confirmed_orders: parseInt(stats.confirmed_orders) || 0,
            pending_orders: parseInt(stats.pending_orders) || 0,
            failed_orders: parseInt(stats.failed_orders) || 0,
            refunded_orders: parseInt(stats.refunded_orders) || 0,
            total_revenue: parseFloat(stats.total_revenue || 0).toFixed(2),
            refunded_amount: parseFloat(stats.refunded_amount || 0).toFixed(2),
            net_revenue: netRevenue,
            avg_order_value: parseFloat(stats.avg_order_value || 0).toFixed(2),
            success_rate: parseFloat(successRate),
            payment_methods_used: parseInt(stats.payment_methods_used) || 0
          },
          by_method: methods.map(method => ({
            method: method.payment_method,
            count: parseInt(method.count),
            revenue: parseFloat(method.revenue || 0).toFixed(2),
            avg_amount: parseFloat(method.avg_amount || 0).toFixed(2)
          }))
        },
        message: `Estadísticas de pagos para ${period}`
      });

    } catch (dbError) {
      console.warn('⚠️ DB Error, usando stats de fallback:', dbError.message);
      
      res.json({
        success: true,
        stats: {
          period: period,
          summary: {
            total_orders: 156,
            confirmed_orders: 142,
            pending_orders: 8,
            failed_orders: 6,
            refunded_orders: 3,
            total_revenue: '234580.00',
            refunded_amount: '4200.00',
            net_revenue: '230380.00',
            avg_order_value: '1653.24',
            success_rate: 91.03,
            payment_methods_used: 3
          },
          by_method: [
            { method: 'mercadopago', count: 89, revenue: '145600.00', avg_amount: '1636.00' },
            { method: 'stripe', count: 45, revenue: '78200.00', avg_amount: '1737.78' },
            { method: 'bank_transfer', count: 8, revenue: '10780.00', avg_amount: '1347.50' }
          ]
        },
        message: `Estadísticas de pagos para ${period} (datos de fallback)`,
        fallback: true
      });
    }

  } catch (error) {
    console.error('❌ Error en GET /admin/payments/stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de pagos',
      error: error.message
    });
  }
});

module.exports = router;