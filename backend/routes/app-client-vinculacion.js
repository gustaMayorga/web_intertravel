// ===============================================
// ENDPOINTS VINCULACIÓN DNI - APP CLIENT
// ===============================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Simulamos conexión a BD (reemplazar con conexión real)
const db = require('../database');

// ===============================================
// REGISTRO CON VINCULACIÓN AUTOMÁTICA POR DNI
// ===============================================

router.post('/auth/register', async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            document_type = 'DNI',
            document_number,
            phone,
            country = 'Argentina'
        } = req.body;

        console.log(`📋 Registro nuevo usuario con DNI: ${document_number}`);

        // 1. VERIFICAR SI YA EXISTE USER CON ESE EMAIL O DNI
        const existingUser = await db.query(`
            SELECT id, email, document_number 
            FROM users 
            WHERE email = $1 OR document_number = $2
        `, [email, document_number]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: 'Usuario ya existe',
                details: 'Email o DNI ya registrado'
            });
        }

        // 2. BUSCAR CUSTOMER EXISTENTE CON ESE DNI
        const customerExistente = await db.query(`
            SELECT id, email, first_name, last_name, document_number
            FROM customers 
            WHERE document_number = $1 AND user_id IS NULL
        `, [document_number]);

        // 3. CREAR USUARIO
        const passwordHash = await bcrypt.hash(password, 10);
        
        const nuevoUser = await db.query(`
            INSERT INTO users (
                username, email, password_hash, first_name, last_name,
                document_type, document_number, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING id, username, email, first_name, last_name, document_number
        `, [
            email, // username = email por ahora
            email,
            passwordHash,
            first_name,
            last_name,
            document_type,
            document_number
        ]);

        const user = nuevoUser.rows[0];

        // 4. VINCULAR CON CUSTOMER EXISTENTE SI EXISTE
        let vinculacionInfo = { vinculado: false, reservas: 0 };
        
        if (customerExistente.rows.length > 0) {
            const customer = customerExistente.rows[0];
            
            // Vincular customer con user
            await db.query(`
                UPDATE customers 
                SET user_id = $1 
                WHERE id = $2
            `, [user.id, customer.id]);

            // Contar reservas vinculadas
            const reservasCount = await db.query(`
                SELECT COUNT(*) as count 
                FROM bookings 
                WHERE customer_id = $1
            `, [customer.id]);

            vinculacionInfo = {
                vinculado: true,
                reservas: parseInt(reservasCount.rows[0].count),
                customer_data: {
                    id: customer.id,
                    email: customer.email,
                    nombre: `${customer.first_name} ${customer.last_name}`
                }
            };

            console.log(`✅ Usuario vinculado con customer existente. Reservas: ${vinculacionInfo.reservas}`);
        } else {
            console.log(`📋 Usuario nuevo sin reservas previas`);
        }

        // 5. GENERAR JWT TOKEN
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                document_number: user.document_number
            },
            process.env.JWT_SECRET || 'intertravel-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                document_number: user.document_number
            },
            token,
            vinculacion: vinculacionInfo
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================================
// LOGIN CON CHECK DE RESERVAS
// ===============================================

router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`📋 Login usuario: ${email}`);

        // 1. BUSCAR USUARIO
        const userResult = await db.query(`
            SELECT id, email, password_hash, first_name, last_name, document_number
            FROM users 
            WHERE email = $1 AND is_active = true
        `, [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        const user = userResult.rows[0];

        // 2. VERIFICAR PASSWORD
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordValid) {
            return res.status(401).json({
                error: 'Credenciales inválidas'
            });
        }

        // 3. BUSCAR RESERVAS DEL USUARIO
        const reservasResult = await db.query(`
            SELECT 
                b.id,
                b.booking_reference,
                b.status,
                b.total_amount,
                b.currency,
                b.travel_date,
                p.title as package_title,
                c.id as customer_id
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            LEFT JOIN packages p ON b.package_id = p.id
            WHERE c.user_id = $1
            ORDER BY b.created_at DESC
        `, [user.id]);

        // 4. ACTUALIZAR ÚLTIMO LOGIN
        await db.query(`
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP, last_activity = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [user.id]);

        // 5. GENERAR TOKEN
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email,
                document_number: user.document_number
            },
            process.env.JWT_SECRET || 'intertravel-secret-key',
            { expiresIn: '24h' }
        );

        console.log(`✅ Login exitoso. Reservas encontradas: ${reservasResult.rows.length}`);

        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                document_number: user.document_number
            },
            token,
            hasBookings: reservasResult.rows.length > 0,
            bookingsCount: reservasResult.rows.length,
            bookings: reservasResult.rows
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================================
// OBTENER RESERVAS DEL USUARIO AUTENTICADO
// ===============================================

router.get('/bookings/my-bookings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log(`📋 Obteniendo reservas para usuario: ${userId}`);

        const reservas = await db.query(`
            SELECT 
                b.id,
                b.booking_reference,
                b.status,
                b.total_amount,
                b.currency,
                b.travel_date,
                b.travelers_count,
                b.special_requests,
                b.created_at,
                p.title as package_title,
                p.description as package_description,
                p.duration_days,
                p.duration_nights,
                p.images as package_images,
                d.name as destination_name,
                d.country_id,
                c.first_name as customer_first_name,
                c.last_name as customer_last_name,
                c.phone as customer_phone
            FROM bookings b
            JOIN customers c ON b.customer_id = c.id
            LEFT JOIN packages p ON b.package_id = p.id
            LEFT JOIN destinations d ON p.destination_id = d.id
            WHERE c.user_id = $1
            ORDER BY b.created_at DESC
        `, [userId]);

        // Obtener pagos para cada reserva
        for (let reserva of reservas.rows) {
            const pagos = await db.query(`
                SELECT 
                    id,
                    payment_reference,
                    amount,
                    currency,
                    status,
                    payment_method,
                    processed_at
                FROM payments
                WHERE booking_id = $1
                ORDER BY created_at DESC
            `, [reserva.id]);
            
            reserva.payments = pagos.rows;
        }

        res.json({
            message: 'Reservas obtenidas exitosamente',
            count: reservas.rows.length,
            bookings: reservas.rows
        });

    } catch (error) {
        console.error('❌ Error obteniendo reservas:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================================
// VERIFICAR ESTADO DE VINCULACIÓN POR DNI
// ===============================================

router.post('/auth/check-dni', async (req, res) => {
    try {
        const { document_number } = req.body;

        if (!document_number) {
            return res.status(400).json({
                error: 'DNI requerido'
            });
        }

        // Verificar si existe user con ese DNI
        const userExiste = await db.query(`
            SELECT id, email, first_name, last_name 
            FROM users 
            WHERE document_number = $1
        `, [document_number]);

        // Verificar si existe customer con ese DNI
        const customerExiste = await db.query(`
            SELECT 
                c.id,
                c.email,
                c.first_name,
                c.last_name,
                c.user_id,
                COUNT(b.id) as reservas_count
            FROM customers c
            LEFT JOIN bookings b ON c.id = b.customer_id
            WHERE c.document_number = $1
            GROUP BY c.id, c.email, c.first_name, c.last_name, c.user_id
        `, [document_number]);

        const response = {
            document_number,
            user_registered: userExiste.rows.length > 0,
            has_bookings: false,
            bookings_count: 0,
            can_register: true,
            should_link: false
        };

        if (customerExiste.rows.length > 0) {
            const customer = customerExiste.rows[0];
            response.has_bookings = parseInt(customer.reservas_count) > 0;
            response.bookings_count = parseInt(customer.reservas_count);
            response.should_link = !customer.user_id && response.has_bookings;
        }

        if (userExiste.rows.length > 0) {
            response.can_register = false;
            response.existing_user = {
                email: userExiste.rows[0].email,
                name: `${userExiste.rows[0].first_name} ${userExiste.rows[0].last_name}`
            };
        }

        res.json(response);

    } catch (error) {
        console.error('❌ Error verificando DNI:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ===============================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'intertravel-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Token inválido'
            });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
