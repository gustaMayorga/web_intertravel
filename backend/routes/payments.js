const express = require('express');
const router = express.Router();

// GET /api/admin/payments - Listar órdenes de pago
router.get('/', async (req, res) => {
    try {
        console.log('💳 GET /api/admin/payments - Solicitud recibida');
        
        // Datos mock de órdenes de pago
        const mockPayments = [
            {
                id: 1,
                order_number: 'IT-' + Date.now() + '-001',
                user_id: 1,
                package_id: 1,
                amount: 1500.00,
                currency: 'USD',
                status: 'completed',
                payment_method: 'credit_card',
                transaction_id: 'txn_' + Date.now(),
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                order_number: 'IT-' + Date.now() + '-002',
                user_id: 2,
                package_id: 3,
                amount: 890.50,
                currency: 'USD',
                status: 'pending',
                payment_method: 'paypal',
                created_at: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: mockPayments,
            pagination: {
                page: 1,
                limit: 10,
                total: mockPayments.length,
                pages: 1
            },
            message: 'Órdenes de pago obtenidas exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en GET /payments:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo pagos',
            details: error.message
        });
    }
});

// POST /api/admin/payments - Crear orden de pago
router.post('/', async (req, res) => {
    try {
        console.log('💳 POST /api/admin/payments - Crear orden');
        const paymentData = req.body;

        // Simular creación de orden
        const newPayment = {
            id: Date.now(),
            order_number: 'IT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            ...paymentData,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        res.status(201).json({
            success: true,
            data: newPayment,
            message: 'Orden de pago creada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en POST /payments:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando orden de pago',
            details: error.message
        });
    }
});

module.exports = router;
