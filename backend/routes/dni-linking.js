// ===============================================
// ENDPOINTS PARA VINCULACIÓN POR DNI - CRÍTICO PARA LANZAMIENTO
// ===============================================

const express = require('express');
const router = express.Router();

// Cargar middleware de autenticación
const {
  authenticateAdvanced,
  apiRateLimit,
  USER_ROLES,
  PERMISSIONS
} = require('../middleware/auth-advanced');

// ===============================================
// APLICAR RATE LIMITING
// ===============================================
router.use(apiRateLimit);

// ===============================================
// ENDPOINTS PARA USUARIOS (APP CLIENT)
// ===============================================

/**
 * POST /api/app/user/link-by-dni
 * Vinculación automática del usuario por DNI
 */
router.post('/user/link-by-dni', 
  authenticateAdvanced(PERMISSIONS.USER_WRITE), 
  async (req, res) => {
    try {
      const { documentNumber } = req.body;
      const userId = req.user.userId;
      
      if (!documentNumber) {
        return res.status(400).json({
          success: false,
          error: 'Número de documento es requerido'
        });
      }

      const { query } = require('../database');

      // 1. Actualizar usuario con DNI
      await query(
        `UPDATE users 
         SET document_type = 'DNI', document_number = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [documentNumber, userId]
      );

      // 2. Buscar reservas existentes con ese DNI
      const bookingsResult = await query(
        `SELECT find_customer_bookings_by_dni($1) as result`,
        [documentNumber]
      );

      const linkingResult = bookingsResult.rows[0]?.result || { found: false };

      console.log(`🔗 User ${req.user.email} linked with DNI ${documentNumber}`);

      if (linkingResult.found) {
        res.json({
          success: true,
          message: 'DNI vinculado exitosamente',
          data: {
            linked: true,
            customer_data: linkingResult.customer_data,
            bookings: linkingResult.bookings,
            total_bookings: linkingResult.total_bookings
          }
        });
      } else {
        res.json({
          success: true,
          message: 'DNI guardado, no se encontraron reservas previas',
          data: {
            linked: false,
            bookings: [],
            total_bookings: 0
          }
        });
      }

    } catch (error) {
      console.error('❌ Error vinculando DNI:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
);

/**
 * GET /api/app/user/my-bookings-by-dni
 * Obtener reservas del usuario basadas en su DNI
 */
router.get('/user/my-bookings-by-dni', 
  authenticateAdvanced(PERMISSIONS.USER_READ), 
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { query } = require('../database');

      // Obtener DNI del usuario
      const userResult = await query(
        `SELECT document_number FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].document_number) {
        return res.json({
          success: true,
          data: {
            linked: false,
            message: 'Usuario no tiene DNI vinculado',
            bookings: [],
            total_bookings: 0
          }
        });
      }

      const userDNI = userResult.rows[0].document_number;

      // Buscar reservas por DNI
      const bookingsResult = await query(
        `SELECT * FROM get_user_bookings($1)`,
        [userDNI]
      );

      res.json({
        success: true,
        data: {
          linked: true,
          dni: userDNI,
          bookings: bookingsResult.rows,
          total_bookings: bookingsResult.rows.length
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo reservas por DNI:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
);

/**
 * GET /api/app/user/dni-status
 * Verificar estado de vinculación por DNI
 */
router.get('/user/dni-status', 
  authenticateAdvanced(PERMISSIONS.USER_READ), 
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { query } = require('../database');

      const userResult = await query(
        `SELECT document_type, document_number FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const userData = userResult.rows[0];
      const hasDocument = !!userData.document_number;

      let bookingsInfo = { bookings: [], total_bookings: 0 };

      if (hasDocument) {
        const bookingsResult = await query(
          `SELECT find_customer_bookings_by_dni($1) as result`,
          [userData.document_number]
        );
        
        const linkingResult = bookingsResult.rows[0]?.result || { found: false };
        if (linkingResult.found) {
          bookingsInfo = {
            bookings: linkingResult.bookings || [],
            total_bookings: linkingResult.total_bookings || 0
          };
        }
      }

      res.json({
        success: true,
        data: {
          has_document: hasDocument,
          document_type: userData.document_type,
          document_number: userData.document_number,
          linked: hasDocument && bookingsInfo.total_bookings > 0,
          ...bookingsInfo
        }
      });

    } catch (error) {
      console.error('❌ Error verificando estado DNI:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
);

// ===============================================
// ENDPOINTS PARA ADMIN
// ===============================================

/**
 * POST /api/admin/customers/create-with-booking
 * Crear customer con reserva (para carga manual del agente)
 */
router.post('/admin/customers/create-with-booking',
  authenticateAdvanced(PERMISSIONS.ADMIN_WRITE),
  async (req, res) => {
    try {
      const {
        // Datos del cliente
        firstName,
        lastName,
        email,
        phone,
        documentType = 'DNI',
        documentNumber,
        country = 'Argentina',
        
        // Datos de la reserva
        packageId,
        travelersCount,
        totalAmount,
        currency = 'USD',
        travelDate,
        specialRequests = '',
        source = 'manual_agent'
      } = req.body;

      if (!firstName || !lastName || !documentNumber || !packageId || !totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'Campos requeridos: firstName, lastName, documentNumber, packageId, totalAmount'
        });
      }

      const { query } = require('../database');

      // Generar referencia única para la reserva
      const bookingReference = `IT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      // 1. Crear o actualizar customer
      const customerResult = await query(
        `INSERT INTO customers (email, first_name, last_name, phone, document_type, document_number, country, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (email) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           phone = EXCLUDED.phone,
           document_type = EXCLUDED.document_type,
           document_number = EXCLUDED.document_number,
           updated_at = CURRENT_TIMESTAMP
         RETURNING id`,
        [email, firstName, lastName, phone, documentType, documentNumber, country]
      );

      const customerId = customerResult.rows[0].id;

      // 2. Crear reserva
      const bookingResult = await query(
        `INSERT INTO bookings (
           booking_reference, package_id, customer_id, travelers_count, 
           total_amount, currency, status, travel_date, special_requests,
           customer_name, customer_email, customer_phone, customer_document,
           created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
         RETURNING id, booking_reference`,
        [
          bookingReference, packageId, customerId, travelersCount,
          totalAmount, currency, travelDate, specialRequests,
          `${firstName} ${lastName}`, email, phone, documentNumber
        ]
      );

      const booking = bookingResult.rows[0];

      console.log(`📋 Admin ${req.user.email} created booking ${booking.booking_reference} for DNI ${documentNumber}`);

      res.status(201).json({
        success: true,
        message: 'Cliente y reserva creados exitosamente',
        data: {
          customer: {
            id: customerId,
            firstName,
            lastName,
            email,
            phone,
            documentNumber
          },
          booking: {
            id: booking.id,
            reference: booking.booking_reference,
            packageId,
            totalAmount,
            currency,
            status: 'confirmed',
            travelDate
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creando customer con reserva:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
);

/**
 * GET /api/admin/customers/search-by-dni/:dni
 * Buscar cliente y reservas por DNI
 */
router.get('/admin/customers/search-by-dni/:dni',
  authenticateAdvanced(PERMISSIONS.ADMIN_READ),
  async (req, res) => {
    try {
      const { dni } = req.params;
      const { query } = require('../database');

      const result = await query(
        `SELECT find_customer_bookings_by_dni($1) as result`,
        [dni]
      );

      const searchResult = result.rows[0]?.result || { found: false };

      res.json({
        success: true,
        data: searchResult
      });

    } catch (error) {
      console.error('❌ Error buscando por DNI:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
);

/**
 * POST /api/admin/users/link-existing-customer
 * Vincular usuario existente con customer por DNI
 */
router.post('/admin/users/link-existing-customer',
  authenticateAdvanced(PERMISSIONS.ADMIN_WRITE),
  async (req, res) => {
    try {
      const { userId, documentNumber } = req.body;

      if (!userId || !documentNumber) {
        return res.status(400).json({
          success: false,
          error: 'userId y documentNumber son requeridos'
        });
      }

      const { query } = require('../database');

      // Actualizar usuario con DNI
      await query(
        `UPDATE users 
         SET document_type = 'DNI', document_number = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [documentNumber, userId]
      );

      // Verificar vinculación
      const linkResult = await query(
        `SELECT link_user_to_customer($1) as linked`,
        [userId]
      );

      const linked = linkResult.rows[0]?.linked || false;

      res.json({
        success: true,
        message: linked ? 'Usuario vinculado exitosamente' : 'DNI actualizado, no se encontraron reservas',
        data: { linked }
      });

    } catch (error) {
      console.error('❌ Error vinculando usuario:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
);

// ===============================================
// HEALTH CHECK
// ===============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DNI Linking System funcionando',
    endpoints: {
      user: [
        'POST /link-by-dni',
        'GET /my-bookings-by-dni',
        'GET /dni-status'
      ],
      admin: [
        'POST /customers/create-with-booking',
        'GET /customers/search-by-dni/:dni',
        'POST /users/link-existing-customer'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

console.log('✅ DNI Linking router loaded successfully');
module.exports = router;
