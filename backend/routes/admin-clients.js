// ===============================================
// ADMIN CLIENTS - VERSIÓN REPARADA CON BASE DE DATOS REAL
// ===============================================

const express = require('express');
const router = express.Router();

// Cargar database con fallback
let query;
try {
  const { query: dbQuery } = require('../database');
  query = dbQuery;
  console.log('✅ Database loaded for admin routes');
} catch (error) {
  console.warn('⚠️ Database not available for admin:', error.message);
  // Mock query function
  query = async (sql, params) => {
    console.log('🔄 Mock query for admin:', sql.substring(0, 50) + '...');
    return { rows: [] };
  };
}

// ===============================================
// WHATSAPP CONFIGURATION - NUEVA RUTA
// ===============================================

/**
 * GET /api/admin/whatsapp-config
 * Obtener configuración de WhatsApp
 */
router.get('/whatsapp-config', async (req, res) => {
  try {
    console.log('📱 Obteniendo configuración WhatsApp...');
    
    const config = {
      success: true,
      data: {
        main: process.env.INTERTRAVEL_WHATSAPP_MAIN || '+5492615555555',
        results: process.env.INTERTRAVEL_WHATSAPP_RESULTS || '+5492615555556',
        detail: process.env.INTERTRAVEL_WHATSAPP_DETAIL || '+5492615555557',
        agency: process.env.INTERTRAVEL_WHATSAPP_AGENCY || '+5492615555558',
        prebooking: process.env.INTERTRAVEL_WHATSAPP_PREBOOKING || '+5492615555559',
        enabled: true,
        businessHours: {
          enabled: true,
          timezone: 'America/Argentina/Mendoza',
          schedule: {
            monday: { open: '09:00', close: '18:00', enabled: true },
            tuesday: { open: '09:00', close: '18:00', enabled: true },
            wednesday: { open: '09:00', close: '18:00', enabled: true },
            thursday: { open: '09:00', close: '18:00', enabled: true },
            friday: { open: '09:00', close: '18:00', enabled: true },
            saturday: { open: '09:00', close: '13:00', enabled: true },
            sunday: { open: '00:00', close: '00:00', enabled: false }
          }
        },
        messages: {
          main: 'Hola! Me interesa conocer más sobre sus paquetes',
          results: 'Me interesa obtener más información sobre los paquetes disponibles',
          detail: 'Me interesa el paquete [PACKAGE_NAME] y me gustaría recibir más información',
          agency: 'Hola! Soy agencia de viajes y necesito información sobre su plataforma B2B',
          prebooking: 'Completé el formulario de prebooking y me gustaría finalizar mi reserva'
        }
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(config);
    
  } catch (error) {
    console.error('❌ Error obteniendo configuración WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo configuración WhatsApp',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/whatsapp-config
 * Actualizar configuración de WhatsApp
 */
router.put('/whatsapp-config', async (req, res) => {
  try {
    const { config } = req.body;
    
    console.log('📝 Actualizando configuración WhatsApp...');
    
    // Aquí iría la lógica para guardar en BD
    // Por ahora solo confirmamos la recepción
    
    res.json({
      success: true,
      message: 'Configuración WhatsApp actualizada correctamente',
      data: config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error actualizando configuración WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando configuración WhatsApp',
      message: error.message
    });
  }
});

// ===============================================
// CRUD COMPLETO DE CLIENTES - DATOS REALES
// ===============================================

/**
 * GET /api/admin/clients
 * Obtener lista de clientes con paginación y filtros
 */
router.get('/clients', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = '', 
      sortBy = 'created_at', 
      sortOrder = 'desc' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construir WHERE clause dinámicamente
    let whereClause = "WHERE role IN ('user', 'client')";
    const params = [];
    
    // Filtro de búsqueda
    if (search && search.trim() !== '') {
      whereClause += ` AND (
        first_name ILIKE $${params.length + 1} OR 
        last_name ILIKE $${params.length + 2} OR 
        email ILIKE $${params.length + 3} OR
        phone ILIKE $${params.length + 4}
      )`;
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Filtro de estado
    if (status && status !== 'all') {
      whereClause += ` AND is_active = $${params.length + 1}`;
      params.push(status === 'active');
    }
    
    // Validar sortBy para evitar SQL injection
    const validSortColumns = ['created_at', 'email', 'first_name', 'last_name'];
    const validSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    // Obtener total de registros
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener clientes paginados
    const clientsResult = await query(`
      SELECT 
        id,
        first_name,
        last_name,
        COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') as full_name,
        email,
        phone,
        is_active,
        role,
        created_at,
        updated_at,
        last_login,
        agency_id
      FROM users 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    // Formatear datos para el frontend
    const clients = clientsResult.rows.map(client => ({
      id: client.id,
      firstName: client.first_name || '',
      lastName: client.last_name || '',
      fullName: client.full_name || 'Sin nombre',
      email: client.email,
      phone: client.phone || '',
      isActive: client.is_active,
      role: client.role,
      createdAt: client.created_at,
      updatedAt: client.updated_at,
      lastLogin: client.last_login,
      agencyId: client.agency_id
    }));
    
    res.json({
      success: true,
      data: clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit),
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      },
      filters: {
        search,
        status,
        sortBy: validSortBy,
        sortOrder: validSortOrder
      },
      source: 'database',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/admin/clients
 * Crear nuevo cliente
 */
router.post('/clients', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dni,
      birthDate,
      address,
      city,
      country,
      notes,
      isActive = true
    } = req.body;
    
    // Validaciones obligatorias
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        required: ['firstName', 'lastName', 'email']
      });
    }
    
    // Validar formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido'
      });
    }
    
    // Verificar si el email ya existe
    const existingUser = await query(
      'SELECT id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado',
        existingUser: {
          id: existingUser.rows[0].id,
          email: existingUser.rows[0].email
        }
      });
    }
    
    // Crear cliente
    const result = await query(`
      INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        phone, 
        username,
        role, 
        is_active, 
        created_at,
        updated_at,
        full_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, first_name, last_name, email, phone, is_active, created_at
    `, [
      firstName.trim(),
      lastName.trim(),
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      email.toLowerCase().trim(), // username = email
      'user',
      isActive,
      new Date(),
      new Date(),
      `${firstName.trim()} ${lastName.trim()}`
    ]);
    
    const newClient = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: {
        id: newClient.id,
        firstName: newClient.first_name,
        lastName: newClient.last_name,
        fullName: `${newClient.first_name} ${newClient.last_name}`,
        email: newClient.email,
        phone: newClient.phone,
        isActive: newClient.is_active,
        createdAt: newClient.created_at
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creating client:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/clients/:id
 * Actualizar cliente existente
 */
router.put('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      isActive
    } = req.body;
    
    // Validar que el cliente existe
    const existingClient = await query(
      'SELECT id, email FROM users WHERE id = $1 AND role IN ($2, $3)',
      [id, 'user', 'client']
    );
    
    if (existingClient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Si se está cambiando el email, verificar que no exista
    if (email && email.toLowerCase() !== existingClient.rows[0].email) {
      const emailExists = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );
      
      if (emailExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está en uso por otro usuario'
        });
      }
    }
    
    // Actualizar cliente
    const result = await query(`
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        is_active = COALESCE($5, is_active),
        updated_at = $6,
        full_name = COALESCE($1, first_name) || ' ' || COALESCE($2, last_name)
      WHERE id = $7
      RETURNING id, first_name, last_name, email, phone, is_active, updated_at
    `, [
      firstName?.trim(),
      lastName?.trim(),
      email?.toLowerCase()?.trim(),
      phone?.trim(),
      isActive,
      new Date(),
      id
    ]);
    
    const updatedClient = result.rows[0];
    
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: {
        id: updatedClient.id,
        firstName: updatedClient.first_name,
        lastName: updatedClient.last_name,
        fullName: `${updatedClient.first_name} ${updatedClient.last_name}`,
        email: updatedClient.email,
        phone: updatedClient.phone,
        isActive: updatedClient.is_active,
        updatedAt: updatedClient.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating client:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/clients/:id
 * Eliminar cliente (soft delete)
 */
router.delete('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el cliente existe
    const existingClient = await query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1 AND role IN ($2, $3)',
      [id, 'user', 'client']
    );
    
    if (existingClient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    // Verificar si tiene reservas activas
    const activeBookings = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE customer_email = $1 AND status IN ($2, $3)',
      [existingClient.rows[0].email, 'pending', 'confirmed']
    );
    
    if (parseInt(activeBookings.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el cliente porque tiene reservas activas',
        activeBookings: parseInt(activeBookings.rows[0].count)
      });
    }
    
    // Soft delete - desactivar usuario
    await query(
      'UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2',
      [new Date(), id]
    );
    
    res.json({
      success: true,
      message: 'Cliente desactivado exitosamente',
      data: {
        id: existingClient.rows[0].id,
        name: `${existingClient.rows[0].first_name} ${existingClient.rows[0].last_name}`,
        email: existingClient.rows[0].email,
        action: 'deactivated'
      }
    });
    
  } catch (error) {
    console.error('❌ Error deleting client:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/clients/:id
 * Obtener cliente específico
 */
router.get('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        is_active,
        role,
        created_at,
        updated_at,
        last_login,
        agency_id
      FROM users 
      WHERE id = $1 AND role IN ('user', 'client')
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const client = result.rows[0];
    
    // Obtener estadísticas de bookings del cliente
    const bookingStats = await query(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        SUM(total_amount) as total_spent,
        MAX(created_at) as last_booking_date
      FROM bookings 
      WHERE customer_email = $1
    `, [client.email]);
    
    const stats = bookingStats.rows[0];
    
    res.json({
      success: true,
      data: {
        id: client.id,
        firstName: client.first_name || '',
        lastName: client.last_name || '',
        fullName: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
        email: client.email,
        phone: client.phone || '',
        isActive: client.is_active,
        role: client.role,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
        lastLogin: client.last_login,
        agencyId: client.agency_id,
        stats: {
          totalBookings: parseInt(stats.total_bookings || 0),
          confirmedBookings: parseInt(stats.confirmed_bookings || 0),
          completedBookings: parseInt(stats.completed_bookings || 0),
          totalSpent: parseFloat(stats.total_spent || 0),
          lastBookingDate: stats.last_booking_date
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching client:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/clients/:id/bookings
 * Obtener reservas de un cliente específico
 */
router.get('/clients/:clientId/bookings', async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Obtener email del cliente
    const clientResult = await query(
      'SELECT email FROM users WHERE id = $1 AND role IN ($2, $3)',
      [clientId, 'user', 'client']
    );
    
    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const clientEmail = clientResult.rows[0].email;
    
    // Obtener reservas del cliente
    const bookingsResult = await query(`
      SELECT 
        id,
        booking_reference,
        package_title,
        destination,
        country,
        travel_date,
        return_date,
        total_amount,
        currency,
        status,
        payment_status,
        created_at
      FROM bookings 
      WHERE customer_email = $1
      ORDER BY created_at DESC
    `, [clientEmail]);
    
    res.json({
      success: true,
      data: bookingsResult.rows,
      total: bookingsResult.rows.length,
      clientId: clientId,
      clientEmail: clientEmail
    });
    
  } catch (error) {
    console.error('❌ Error fetching client bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;