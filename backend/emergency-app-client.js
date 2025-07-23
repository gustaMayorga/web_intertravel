// SOLUCIÓN DE EMERGENCIA - RUTAS APP CLIENT INTEGRADAS
console.log('🚨 APLICANDO SOLUCIÓN DE EMERGENCIA...');

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Router para app client
const appClientRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Mock query que siempre funciona
const mockQuery = async (sql, params) => {
  console.log('🔄 Mock DB Query:', sql.substring(0, 50) + '...');
  
  if (sql.includes('SELECT') && sql.includes('users') && sql.includes('email')) {
    return { 
      rows: [{
        id: 1,
        username: 'test@test.com',
        email: 'test@test.com',
        password_hash: await bcrypt.hash('123456', 10),
        role: 'user',
        full_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        phone: '123456789',
        is_active: true,
        created_at: new Date()
      }]
    };
  }
  
  if (sql.includes('INSERT INTO users')) {
    return {
      rows: [{
        id: Math.floor(Math.random() * 1000),
        username: params[1],
        email: params[1],
        full_name: params[4],
        role: 'user',
        created_at: new Date()
      }]
    };
  }
  
  return { rows: [] };
};

// Health check
appClientRouter.get('/health', (req, res) => {
  console.log('✅ Health check called');
  res.json({
    success: true,
    message: 'App Cliente API funcionando (EMERGENCY MODE)',
    timestamp: new Date().toISOString(),
    mode: 'emergency',
    endpoints: {
      auth: '/api/app/auth/login',
      register: '/api/app/auth/register',
      profile: '/api/app/user/profile'
    }
  });
});

// Registro
appClientRouter.post('/auth/register', async (req, res) => {
  try {
    console.log('📱 EMERGENCY - Registro:', req.body.email);
    
    const { firstName, lastName, email, phone, password } = req.body;

    // Validaciones
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

    // Usar mock query
    const existingUser = await mockQuery('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario mock
    const newUser = await mockQuery(`INSERT INTO users (username, email, password_hash, role, full_name, first_name, last_name, phone, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, username, email, full_name, role, created_at`, [
      email.toLowerCase(),
      email.toLowerCase(),
      passwordHash,
      'user',
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
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ EMERGENCY - Registro exitoso:', user.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente (EMERGENCY MODE)',
      user: {
        id: user.id,
        firstName: firstName,
        lastName: lastName,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Error en registro emergency:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Login
appClientRouter.post('/auth/login', async (req, res) => {
  try {
    console.log('📱 EMERGENCY - Login:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    const userResult = await mockQuery('SELECT id, username, email, password_hash, role, full_name, first_name, last_name, phone, is_active FROM users WHERE email = $1', [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Cuenta desactivada. Contacta soporte.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ EMERGENCY - Login exitoso:', user.id);

    res.json({
      success: true,
      message: 'Login exitoso (EMERGENCY MODE)',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token: token
    });

  } catch (error) {
    console.error('❌ Error en login emergency:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = appClientRouter;
