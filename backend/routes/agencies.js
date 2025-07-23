const express = require('express');
const router = express.Router();

// GET /api/admin/agencies - Listar agencias
router.get('/', async (req, res) => {
    try {
        console.log('📊 GET /api/admin/agencies - Solicitud recibida');
        
        // Datos mock mientras implementamos la BD real
        const mockAgencies = [
            {
                id: 1,
                name: 'Agencia Demo 1',
                email: 'demo1@agencia.com',
                phone: '+1234567890',
                commission_rate: 5.0,
                status: 'active',
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Travel Partners',
                email: 'info@travelpartners.com',
                phone: '+0987654321',
                commission_rate: 7.5,
                status: 'active',
                created_at: new Date().toISOString()
            }
        ];

        res.json({
            success: true,
            data: mockAgencies,
            pagination: {
                page: 1,
                limit: 10,
                total: mockAgencies.length,
                pages: 1
            },
            message: 'Agencias obtenidas exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en GET /agencies:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo agencias',
            details: error.message
        });
    }
});

// POST /api/admin/agencies - Crear agencia
router.post('/', async (req, res) => {
    try {
        console.log('📝 POST /api/admin/agencies - Crear agencia');
        const agencyData = req.body;

        // Simular creación
        const newAgency = {
            id: Date.now(),
            ...agencyData,
            status: 'active',
            created_at: new Date().toISOString()
        };

        res.status(201).json({
            success: true,
            data: newAgency,
            message: 'Agencia creada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en POST /agencies:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando agencia',
            details: error.message
        });
    }
});

module.exports = router;
