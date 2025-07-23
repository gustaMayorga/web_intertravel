// ===============================================
// ADMIN ENDPOINTS - VINCULACIÓN DNI
// ===============================================

const express = require('express');
const router = express.Router();

// Simulamos conexión a BD (reemplazar con conexión real)
const db = require('../database');

// ===============================================
// CREAR RESERVA MANUAL CON VINCULACIÓN AUTOMÁTICA
// ===============================================

router.post('/bookings', async (req, res) => {
    try {
        const {
            customer,
            package_id,
            travelers_count,
            travel_date,
            special_requests,
            agency_id
        } = req.body;

        console.log(`📋 Creando reserva manual para DNI: ${customer.document_number}`);

        // 1. VERIFICAR SI CUSTOMER YA EXISTE
        let customerId;
        const customerExistente = await db.query(`
            SELECT id, user_id 
            FROM customers 
            WHERE document_number = $1
        `, [customer.document_number]);

        if (customerExistente.rows.length > 0) {
            // Customer existe, usar ID existente
            customerId = customerExistente.rows[0].id;
            console.log(`✅ Customer existente encontrado: ID ${customerId}`);
        } else {
            // Crear nuevo customer
            const nuevoCustomer = await db.query(`
                INSERT INTO customers (
                    email, first_name, last_name, phone,
                    document_type, document_number, country
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [
                customer.email,
                customer.first_name,
                customer.last_name,
                customer.phone || null,
                customer.document_type || 'DNI',
                customer.document_number,
                customer.country || 'Argentina'
            ]);
            
            customerId = nuevoCustomer.rows[0].id;
            console.log(`✅ Nuevo customer creado: ID ${customerId}`);
        }

        // 2. VERIFICAR SI EXISTE USER CON ESE DNI PARA VINCULACIÓN
        const userConDNI = await db.query(`
            SELECT id, email, first_name, last_name
            FROM users 
            WHERE document_number = $1
        `, [customer.document_number]);

        if (userConDNI.rows.length > 0) {
            // Vincular customer con user existente
            await db.query(`
                UPDATE customers 
                SET user_id = $1 
                WHERE id = $2
            `, [userConDNI.rows[0].id, customerId]);
            
            console.log(`🔗 Customer vinculado automáticamente con user ID: ${userConDNI.rows[0].id}`);
        }

        // 3. OBTENER PRECIO DEL PAQUETE
        const paquete = await db.query(`
            SELECT price_amount, price_currency, title
            FROM packages 
            WHERE id = $1
        `, [package_id]);

        if (paquete.rows.length === 0) {
            return res.status(400).json({
                error: 'Paquete no encontrado'
            });
        }

        const totalAmount = paquete.rows[0].price_amount * travelers_count;

        // 4. GENERAR REFERENCIA ÚNICA
        const bookingReference = `ITV-${Date.now()}-${customerId}`;

        // 5. CREAR RESERVA
        const nuevaReserva = await db.query(`
            INSERT INTO bookings (
                booking_reference,
                package_id,
                customer_id,
                agency_id,
                travelers_count,
                total_amount,
                currency,
                travel_date,
                special_requests,
                status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
            RETURNING *
        `, [
            bookingReference,
            package_id,
            customerId,
            agency_id || null,
            travelers_count,
            totalAmount,
            paquete.rows[0].price_currency,
            travel_date,
            special_requests
        ]);

        const reserva = nuevaReserva.rows[0];

        // 6. RESPUESTA CON INFO DE VINCULACIÓN
        const response = {
            message: 'Reserva creada exitosamente',
            booking: {
                id: reserva.id,
                booking_reference: reserva.booking_reference,
                package_title: paquete.rows[0].title,
                customer_name: `${customer.first_name} ${customer.last_name}`,
                total_amount: reserva.total_amount,
                currency: reserva.currency,
                status: reserva.status,
                travel_date: reserva.travel_date
            },
            customer: {
                id: customerId,
                document_number: customer.document_number,
                email: customer.email
            },
            vinculacion: {
                user_vinculado: userConDNI.rows.length > 0,
                user_info: userConDNI.rows.length > 0 ? {
                    id: userConDNI.rows[0].id,
                    email: userConDNI.rows[0].email,
                    nombre: `${userConDNI.rows[0].first_name} ${userConDNI.rows[0].last_name}`
                } : null
            }
        };

        console.log(`✅ Reserva creada: ${bookingReference}`);
        res.status(201).json(response);

    } catch (error) {
        console.error('❌ Error creando reserva:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================================
// VER ESTADO DE VINCULACIÓN DE CUSTOMER
// ===============================================

router.get('/customers/:id/user-status', async (req, res) => {
    try {
        const customerId = req.params.id;

        const customer = await db.query(`
            SELECT 
                c.*,
                u.id as user_id,
                u.email as user_email,
                u.last_login,
                u.last_activity,
                COUNT(b.id) as total_bookings
            FROM customers c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN bookings b ON c.id = b.customer_id
            WHERE c.id = $1
            GROUP BY c.id, u.id, u.email, u.last_login, u.last_activity
        `, [customerId]);

        if (customer.rows.length === 0) {
            return res.status(404).json({
                error: 'Customer no encontrado'
            });
        }

        const customerData = customer.rows[0];

        res.json({
            customer: {
                id: customerData.id,
                email: customerData.email,
                first_name: customerData.first_name,
                last_name: customerData.last_name,
                document_number: customerData.document_number,
                total_bookings: parseInt(customerData.total_bookings)
            },
            user_status: {
                hasUser: !!customerData.user_id,
                user_id: customerData.user_id,
                user_email: customerData.user_email,
                last_login: customerData.last_login,
                last_activity: customerData.last_activity,
                is_active: !!customerData.last_activity
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estado de customer:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================================
// GESTIÓN DE PAQUETES DESTACADOS PARA LANDING
// ===============================================

router.get('/packages/featured', async (req, res) => {
    try {
        console.log('📋 Obteniendo paquetes destacados...');

        const featuredPackages = await db.query(`
            SELECT 
                p.*,
                d.name as destination_name,
                pc.name as category_name
            FROM packages p
            LEFT JOIN destinations d ON p.destination_id = d.id
            LEFT JOIN package_categories pc ON p.category_id = pc.id
            WHERE p.is_featured = true AND p.is_active = true
            ORDER BY p.rating_average DESC, p.price_amount ASC
            LIMIT 3
        `);

        // Obtener configuración de landing
        const landingConfig = await db.query(`
            SELECT key, value
            FROM system_config
            WHERE category = 'landing' AND is_active = true
        `);

        const config = {};
        landingConfig.rows.forEach(row => {
            config[row.key] = JSON.parse(row.value);
        });

        res.json({
            message: 'Paquetes destacados obtenidos',
            config: {
                title: config.featured_title || "Nuestros Mejores Destinos",
                subtitle: config.featured_subtitle || "Experiencias únicas que no puedes perderte",
                count: config.featured_count || 3
            },
            packages: featuredPackages.rows
        });

    } catch (error) {
        console.error('❌ Error obteniendo paquetes destacados:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

router.put('/packages/featured', async (req, res) => {
    try {
        const { featuredPackages, landingConfig } = req.body;

        console.log(`📋 Actualizando paquetes destacados: ${featuredPackages?.join(', ')}`);

        // 1. QUITAR FEATURED DE TODOS LOS PAQUETES
        await db.query(`
            UPDATE packages SET is_featured = false
        `);

        // 2. MARCAR NUEVOS PAQUETES COMO FEATURED
        if (featuredPackages && featuredPackages.length > 0) {
            const placeholders = featuredPackages.map((_, index) => `$${index + 1}`).join(',');
            await db.query(`
                UPDATE packages 
                SET is_featured = true 
                WHERE id IN (${placeholders}) AND is_active = true
            `, featuredPackages);
        }

        // 3. ACTUALIZAR CONFIGURACIÓN DE LANDING
        if (landingConfig) {
            for (const [key, value] of Object.entries(landingConfig)) {
                await db.query(`
                    INSERT INTO system_config (category, key, value, description, is_public)
                    VALUES ('landing', $1, $2, $3, true)
                    ON CONFLICT (category, key) 
                    DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
                `, [key, JSON.stringify(value), `Configuración de landing: ${key}`]);
            }
        }

        // 4. OBTENER PAQUETES ACTUALIZADOS
        const updatedPackages = await db.query(`
            SELECT 
                p.id,
                p.title,
                p.price_amount,
                p.price_currency,
                p.images,
                d.name as destination_name
            FROM packages p
            LEFT JOIN destinations d ON p.destination_id = d.id
            WHERE p.is_featured = true AND p.is_active = true
            ORDER BY p.rating_average DESC
        `);

        res.json({
            message: 'Paquetes destacados actualizados exitosamente',
            featured_count: updatedPackages.rows.length,
            packages: updatedPackages.rows
        });

    } catch (error) {
        console.error('❌ Error actualizando paquetes destacados:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================================
// DASHBOARD CON STATS DE VINCULACIÓN
// ===============================================

router.get('/dashboard/vinculacion-stats', async (req, res) => {
    try {
        // Stats de vinculación
        const vinculacionStats = await db.query(`
            SELECT 
                COUNT(*) as total_customers,
                COUNT(user_id) as customers_vinculados,
                COUNT(*) - COUNT(user_id) as customers_sin_vincular
            FROM customers
        `);

        // Reservas por estado de vinculación
        const reservasStats = await db.query(`
            SELECT 
                CASE 
                    WHEN c.user_id IS NOT NULL THEN 'vinculado'
                    ELSE 'sin_vincular'
                END as vinculacion_status,
                COUNT(b.id) as total_reservas,
                SUM(b.total_amount) as total_revenue
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            GROUP BY (c.user_id IS NOT NULL)
        `);

        // Actividad reciente de usuarios vinculados
        const actividadReciente = await db.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.last_activity,
                COUNT(b.id) as total_reservas
            FROM users u
            JOIN customers c ON u.id = c.user_id
            LEFT JOIN bookings b ON c.id = b.customer_id
            WHERE u.last_activity IS NOT NULL
            GROUP BY u.id, u.first_name, u.last_name, u.last_activity
            ORDER BY u.last_activity DESC
            LIMIT 10
        `);

        const stats = vinculacionStats.rows[0];
        const vinculacionPorcentaje = stats.total_customers > 0 
            ? ((stats.customers_vinculados / stats.total_customers) * 100).toFixed(1)
            : 0;

        res.json({
            message: 'Stats de vinculación obtenidas',
            vinculacion: {
                total_customers: parseInt(stats.total_customers),
                customers_vinculados: parseInt(stats.customers_vinculados),
                customers_sin_vincular: parseInt(stats.customers_sin_vincular),
                porcentaje_vinculado: parseFloat(vinculacionPorcentaje)
            },
            reservas_por_vinculacion: reservasStats.rows,
            actividad_reciente: actividadReciente.rows,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error obteniendo stats de vinculación:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

module.exports = router;
