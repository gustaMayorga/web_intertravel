const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// ======================================
// REGISTRO DE USUARIOS
// ======================================
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    console.log('📝 Nuevo registro de usuario:', { email, firstName, lastName });

    // Validaciones básicas
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await query(`
      INSERT INTO users (
        username, email, password_hash, role, full_name, 
        first_name, last_name, phone, is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, username, email, full_name, role, created_at
    `, [
      email.toLowerCase(), // username = email
      email.toLowerCase(),
      passwordHash,
      'user', // rol de usuario normal
      `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone || null,
      true,
      new Date()
    ]);

    const user = newUser.rows[0];

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Usuario registrado exitosamente:', user.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        role: user.role,
        joinDate: user.created_at
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    // Error de PostgreSQL no disponible - usar fallback
    if (error.message.includes('connect') || error.code === 'ECONNREFUSED') {
      // Simulación de registro exitoso en modo fallback
      const mockUser = {
        id: `fallback_${Date.now()}`,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        role: 'user',
        joinDate: new Date()
      };

      const token = jwt.sign(
        { 
          userId: mockUser.id, 
          email: mockUser.email, 
          role: mockUser.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente (modo demo)',
        user: mockUser,
        token: token,
        _fallback: true
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// LOGIN DE USUARIOS
// ======================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intento de login usuario:', { email });

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario en base de datos
    const userResult = await query(`
      SELECT id, username, email, password_hash, role, full_name, 
             first_name, last_name, phone, is_active, created_at
      FROM users 
      WHERE email = $1 AND role = 'user'
    `, [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = userResult.rows[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Cuenta desactivada. Contacta al administrador.'
      });
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login usuario exitoso:', user.email);

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        loyaltyLevel: 'Gold', // Ejemplo
        points: 2847, // Ejemplo
        joinDate: user.created_at
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Error en login usuario:', error);
    
    // MODO PRODUCCION REAL - SIN DEMOS
    if (error.message.includes('connect') || error.code === 'ECONNREFUSED') {
      console.log('❌ PostgreSQL no disponible - SISTEMA EN MODO PRODUCCION');
      return res.status(500).json({
        success: false,
        error: 'Base de datos no disponible. Contacte al administrador.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// LOGIN DE AGENCIAS
// ======================================
router.post('/agency-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🏢 Intento de login agencia:', { username });

    // Validaciones básicas
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario de agencia en base de datos
    const userResult = await query(`
      SELECT u.id, u.username, u.email, u.password_hash, u.role, u.full_name, 
             u.agency_id, u.is_active,
             a.code, a.name, a.business_name, a.email as agency_email, 
             a.phone, a.address, a.commission_rate, a.status
      FROM users u
      JOIN agencies a ON u.agency_id = a.id
      WHERE u.username = $1 AND u.role IN ('admin_agencia', 'user_agencia')
    `, [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const userData = userResult.rows[0];

    // Verificar si el usuario y la agencia están activos
    if (!userData.is_active || userData.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Cuenta o agencia desactivada. Contacta al administrador.'
      });
    }

    // Verificar contraseña
    const passwordValid = await bcrypt.compare(password, userData.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: userData.id, 
        username: userData.username,
        agencyId: userData.agency_id,
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login agencia exitoso:', userData.username);

    res.json({
      success: true,
      message: 'Login de agencia exitoso',
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.full_name,
        email: userData.email,
        role: userData.role,
        agencyId: userData.agency_id
      },
      agency: {
        id: userData.agency_id,
        name: userData.name,
        code: userData.code,
        email: userData.agency_email,
        phone: userData.phone,
        address: userData.address,
        commissionRate: userData.commission_rate,
        status: userData.status
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Error en login agencia:', error);
    
    // Error de PostgreSQL no disponible - usar credenciales demo
    if (error.message.includes('connect') || error.code === 'ECONNREFUSED') {
      console.log('⚠️ PostgreSQL no disponible, usando credenciales demo agencia');
      
      // Credenciales demo para agencia
      if (username === 'agencia_admin' && password === 'agencia123') {
        const mockAgency = {
          id: '1',
          name: 'Viajes Total',
          code: 'VIAJES_TOTAL',
          email: 'info@viajestotal.com.ar',
          phone: '+54 261 4XX-XXXX',
          address: 'Av. San Martín 1234, Local 5, Mendoza',
          commissionRate: 12.50,
          status: 'active'
        };

        const mockUser = {
          id: 'demo_agency_user_001',
          username: 'agencia_admin',
          name: 'Administrador Viajes Total',
          email: 'admin@viajestotal.com.ar',
          role: 'admin_agencia',
          agencyId: '1'
        };

        const token = jwt.sign(
          { 
            userId: mockUser.id, 
            username: mockUser.username,
            agencyId: mockAgency.id,
            role: mockUser.role 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          message: 'Login de agencia exitoso (modo demo)',
          user: mockUser,
          agency: mockAgency,
          token: token,
          _fallback: true
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Credenciales inválidas (usa agencia_admin / agencia123 en modo demo)'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ======================================
// VERIFICAR TOKEN
// ======================================
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token requerido'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        agencyId: decoded.agencyId || null
      }
    });

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
});

// ======================================
// LOGOUT
// ======================================
router.post('/logout', async (req, res) => {
  try {
    // En una implementación real, aquí podrías invalidar el token
    // Por ahora, simplemente confirmamos el logout
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
