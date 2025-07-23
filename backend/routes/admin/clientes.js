// ===============================================
// RUTAS ADMIN CLIENTES - SISTEMA FUNCIONAL COMPLETO
// ===============================================

const express = require('express');
const router = express.Router();

// ===============================================
// GET /api/admin/clients - LISTAR CLIENTES
// ===============================================

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      nationality,
      city
    } = req.query;

    console.log(`👥 Consultando clientes: página ${page}, límite ${limit}`);

    const { query: dbQuery } = require('../../database');
    
    // Construir query con filtros
    let whereConditions = ['1=1'];
    let queryParams = [];
    let paramCount = 0;

    // Filtro de búsqueda
    if (search) {
      paramCount++;
      whereConditions.push(`(
        LOWER(first_name) LIKE LOWER($${paramCount}) OR 
        LOWER(last_name) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount}) OR
        LOWER(phone) LIKE LOWER($${paramCount})
      )`);
      queryParams.push(`%${search}%`);
    }

    // Filtro de estado
    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    // Filtro de nacionalidad
    if (nationality) {
      paramCount++;
      whereConditions.push(`LOWER(nationality) = LOWER($${paramCount})`);
      queryParams.push(nationality);
    }

    // Filtro de ciudad
    if (city) {
      paramCount++;
      whereConditions.push(`LOWER(city) = LOWER($${paramCount})`);
      queryParams.push(city);
    }

    // Query principal con conteo
    const countQuery = `
      SELECT COUNT(*) as total
      FROM clients
      WHERE ${whereConditions.join(' AND ')}
    `;

    const dataQuery = `
      SELECT 
        id,
        first_name,
        last_name,
        name,
        email,
        phone,
        date_of_birth,
        nationality,
        city,
        province,
        country,
        status,
        notes,
        created_at,
        updated_at,
        last_booking_date,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.customer_email = clients.email
        ) as total_bookings,
        (
          SELECT COALESCE(SUM(total_amount), 0) 
          FROM bookings b 
          WHERE b.customer_email = clients.email 
          AND b.status = 'confirmed'
        ) as total_spent
      FROM clients
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    // Paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    queryParams.push(limitNum, offset);

    // Ejecutar queries
    const [countResult, dataResult] = await Promise.all([
      dbQuery(countQuery, queryParams.slice(0, -2)),
      dbQuery(dataQuery, queryParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const clients = dataResult.rows;
    const totalPages = Math.ceil(total / limitNum);

    // Enriquecer datos de clientes
    const enrichedClients = clients.map(client => ({
      ...client,
      fullName: `${client.first_name} ${client.last_name}`,
      hasBookings: client.total_bookings > 0,
      customerValue: parseFloat(client.total_spent) || 0,
      lastActivity: client.last_booking_date || client.updated_at,
      isVip: parseFloat(client.total_spent) > 5000,
      age: client.date_of_birth ? 
        Math.floor((new Date() - new Date(client.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
        null
    }));

    res.json({
      success: true,
      data: enrichedClients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      filters: {
        search: search || null,
        status: status || null,
        nationality: nationality || null,
        city: city || null
      },
      stats: {
        totalClients: total,
        vipClients: enrichedClients.filter(c => c.isVip).length,
        activeClients: enrichedClients.filter(c => c.status === 'active').length,
        totalRevenue: enrichedClients.reduce((sum, c) => sum + c.customerValue, 0)
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Clientes consultados: ${clients.length}/${total} encontrados`);

  } catch (error) {
    console.error('❌ Error consultando clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ===============================================
// GET /api/admin/clients/:id - DETALLE CLIENTE
// ===============================================

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 Consultando detalle cliente: ${id}`);

    const { query: dbQuery } = require('../../database');

    // Obtener datos del cliente
    const clientResult = await dbQuery(`
      SELECT 
        id, first_name, last_name, name, email, phone,
        date_of_birth, nationality, passport_number, passport_expiry,
        address, city, province, country, emergency_contact_name,
        emergency_contact_phone, preferences, status, notes,
        created_at, updated_at, last_booking_date
      FROM clients
      WHERE id = $1
    `, [id]);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
        message: `Cliente con ID ${id} no existe`
      });
    }

    const client = clientResult.rows[0];

    // Obtener historial de reservas
    const bookingsResult = await dbQuery(`
      SELECT 
        id, booking_reference, package_id, package_name,
        passenger_count, total_amount, currency, status,
        travel_date, created_at, confirmed_at,
        special_requests
      FROM bookings
      WHERE customer_email = $1
      ORDER BY created_at DESC
    `, [client.email]);

    // Calcular estadísticas del cliente
    const bookings = bookingsResult.rows;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalSpent = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
    const avgBookingValue = confirmedBookings.length > 0 ? totalSpent / confirmedBookings.length : 0;

    // Analizar preferencias de destinos
    const destinationStats = {};
    confirmedBookings.forEach(booking => {
      if (booking.package_name) {
        const destination = booking.package_name.split(' ')[0]; // Simplificado
        destinationStats[destination] = (destinationStats[destination] || 0) + 1;
      }
    });

    const clientDetail = {
      ...client,
      preferences: client.preferences ? JSON.parse(client.preferences) : {},
      stats: {
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        totalSpent,
        avgBookingValue,
        lastBookingDate: bookings.length > 0 ? bookings[0].created_at : null,
        preferredDestinations: Object.entries(destinationStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([dest, count]) => ({ destination: dest, count }))
      },
      bookings: bookings.map(booking => ({
        ...booking,
        total_amount: parseFloat(booking.total_amount),
        isRecent: new Date(booking.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })),
      isVip: totalSpent > 5000,
      riskLevel: bookings.filter(b => b.status === 'cancelled').length > 2 ? 'high' : 'low'
    };

    res.json({
      success: true,
      client: clientDetail,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Cliente detalle: ${client.email} - ${bookings.length} reservas`);

  } catch (error) {
    console.error('❌ Error obteniendo detalle cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo detalle del cliente',
      message: error.message
    });
  }
});

// ===============================================
// POST /api/admin/clients - CREAR CLIENTE
// ===============================================

router.post('/', async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      nationality = 'Argentina',
      passport_number,
      passport_expiry,
      address,
      city,
      province,
      country = 'Argentina',
      emergency_contact_name,
      emergency_contact_phone,
      preferences = {},
      notes
    } = req.body;

    console.log(`👤 Creando nuevo cliente: ${email}`);

    // Validaciones básicas
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Datos requeridos faltantes',
        message: 'Nombre, apellido y email son requeridos'
      });
    }

    const { query: dbQuery } = require('../../database');

    // Verificar si el email ya existe
    const existingClient = await dbQuery(
      'SELECT id FROM clients WHERE email = $1',
      [email]
    );

    if (existingClient.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cliente ya existe',
        message: `Ya existe un cliente con el email ${email}`
      });
    }

    // Crear cliente
    const createResult = await dbQuery(`
      INSERT INTO clients (
        first_name, last_name, email, phone, date_of_birth,
        nationality, passport_number, passport_expiry, address,
        city, province, country, emergency_contact_name,
        emergency_contact_phone, preferences, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'active')
      RETURNING *
    `, [
      first_name, last_name, email, phone, date_of_birth,
      nationality, passport_number, passport_expiry, address,
      city, province, country, emergency_contact_name,
      emergency_contact_phone, JSON.stringify(preferences), notes
    ]);

    const newClient = createResult.rows[0];

    res.status(201).json({
      success: true,
      client: {
        ...newClient,
        preferences: JSON.parse(newClient.preferences || '{}')
      },
      message: 'Cliente creado exitosamente',
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Cliente creado: ${newClient.id} - ${email}`);

  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando cliente',
      message: error.message
    });
  }
});

// ===============================================
// PUT /api/admin/clients/:id - ACTUALIZAR CLIENTE
// ===============================================

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`✏️ Actualizando cliente: ${id}`);

    const { query: dbQuery } = require('../../database');

    // Verificar que el cliente existe
    const existingClient = await dbQuery(
      'SELECT id FROM clients WHERE id = $1',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
        message: `Cliente con ID ${id} no existe`
      });
    }

    // Construir query de actualización dinámico
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
      'nationality', 'passport_number', 'passport_expiry', 'address',
      'city', 'province', 'country', 'emergency_contact_name',
      'emergency_contact_phone', 'preferences', 'notes', 'status'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        
        // Manejar preferences como JSON
        if (key === 'preferences' && typeof updates[key] === 'object') {
          updateValues.push(JSON.stringify(updates[key]));
        } else {
          updateValues.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay campos válidos para actualizar',
        message: 'Debe proporcionar al menos un campo válido'
      });
    }

    // Agregar updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Agregar ID para WHERE
    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE clients 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await dbQuery(updateQuery, updateValues);
    const updatedClient = updateResult.rows[0];

    res.json({
      success: true,
      client: {
        ...updatedClient,
        preferences: updatedClient.preferences ? JSON.parse(updatedClient.preferences) : {}
      },
      message: 'Cliente actualizado exitosamente',
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Cliente actualizado: ${id} - ${updateFields.length} campos`);

  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error actualizando cliente',
      message: error.message
    });
  }
});

// ===============================================
// DELETE /api/admin/clients/:id - ELIMINAR CLIENTE
// ===============================================

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Eliminando cliente: ${id}`);

    const { query: dbQuery } = require('../../database');

    // Verificar que el cliente existe
    const existingClient = await dbQuery(
      'SELECT id, email FROM clients WHERE id = $1',
      [id]
    );

    if (existingClient.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado',
        message: `Cliente con ID ${id} no existe`
      });
    }

    const client = existingClient.rows[0];

    // Verificar si tiene reservas activas
    const activeBookings = await dbQuery(`
      SELECT COUNT(*) as count
      FROM bookings
      WHERE customer_email = $1 AND status IN ('pending', 'confirmed')
    `, [client.email]);

    if (parseInt(activeBookings.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cliente tiene reservas activas',
        message: 'No se puede eliminar un cliente con reservas pendientes o confirmadas'
      });
    }

    // Eliminar cliente
    await dbQuery('DELETE FROM clients WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      deletedClient: {
        id: parseInt(id),
        email: client.email
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Cliente eliminado: ${id} - ${client.email}`);

  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Error eliminando cliente',
      message: error.message
    });
  }
});

// ===============================================
// GET /api/admin/clients/stats - ESTADÍSTICAS
// ===============================================

router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📊 Generando estadísticas de clientes...');

    const { query: dbQuery } = require('../../database');

    // Estadísticas generales
    const statsQueries = [
      // Total clientes por estado
      `SELECT status, COUNT(*) as count 
       FROM clients 
       GROUP BY status`,
      
      // Clientes por nacionalidad (top 5)
      `SELECT nationality, COUNT(*) as count 
       FROM clients 
       GROUP BY nationality 
       ORDER BY count DESC 
       LIMIT 5`,
      
      // Clientes por ciudad (top 5)
      `SELECT city, COUNT(*) as count 
       FROM clients 
       WHERE city IS NOT NULL 
       GROUP BY city 
       ORDER BY count DESC 
       LIMIT 5`,
      
      // Clientes VIP (con más de $5000 gastados)
      `SELECT COUNT(*) as vip_count
       FROM (
         SELECT c.id
         FROM clients c
         LEFT JOIN bookings b ON b.customer_email = c.email
         WHERE b.status = 'confirmed'
         GROUP BY c.id
         HAVING COALESCE(SUM(b.total_amount), 0) > 5000
       ) vip`,
      
      // Nuevos clientes por mes (últimos 6 meses)
      `SELECT 
         DATE_TRUNC('month', created_at) as month,
         COUNT(*) as count
       FROM clients
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month`,
    ];

    const results = await Promise.all(
      statsQueries.map(query => dbQuery(query))
    );

    const [
      statusStats,
      nationalityStats,
      cityStats,
      vipStats,
      monthlyStats
    ] = results.map(result => result.rows);

    res.json({
      success: true,
      stats: {
        byStatus: statusStats.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {}),
        byNationality: nationalityStats,
        byCity: cityStats,
        vipCount: parseInt(vipStats[0]?.vip_count || 0),
        monthlyGrowth: monthlyStats.map(row => ({
          month: row.month,
          count: parseInt(row.count)
        })),
        totalClients: statusStats.reduce((sum, row) => sum + parseInt(row.count), 0)
      },
      timestamp: new Date().toISOString()
    });

    console.log('✅ Estadísticas de clientes generadas');

  } catch (error) {
    console.error('❌ Error generando estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error generando estadísticas',
      message: error.message
    });
  }
});

console.log('👥 Rutas admin clientes funcionales cargadas');

module.exports = router;