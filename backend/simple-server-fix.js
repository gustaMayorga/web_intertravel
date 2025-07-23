// FIX-BACKEND-JSON.js - Arreglo inmediato para respuestas JSON
// Ejecutar: node FIX-BACKEND-JSON.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3002;

// MIDDLEWARE BÁSICO
app.use(cors({
  origin: ['http://localhost:3009', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOGGING
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// JWT SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro';

// USUARIOS MOCK
const mockUsers = [
  {
    id: 1,
    email: 'test@test.com',
    password: '$2b$10$rHXqGl7.KT8.fN3nXGXqdeXzX8tO7qD7QJ9Lj/xQ2vP.AJ9sY7V6O', // 123456
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    phone: '123456789',
    role: 'user'
  },
  {
    id: 2,
    email: 'test@intertravel.com',
    password: '$2b$10$8K9Lj.gN7.fQ3nXGXqdeXzX8tO7qD7QJ9Lj/xQ2vP.AJ9sY7V6O', // test123
    firstName: 'Test',
    lastName: 'InterTravel',
    fullName: 'Test InterTravel',
    phone: '987654321',
    role: 'user'
  }
];

// RUTA DE HEALTH CHECK
app.get('/api/app/health', (req, res) => {
  res.json({
    success: true,
    message: 'App Cliente API funcionando',
    timestamp: new Date().toISOString()
  });
});

// RUTA DE LOGIN
app.post('/api/app/auth/login', async (req, res) => {
  try {
    console.log('🔑 LOGIN REQUEST:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }
    
    // Buscar usuario
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }
    
    // Generar token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ LOGIN EXITOSO para:', email);
    
    // RESPUESTA JSON CORRECTA
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role
        },
        token: token
      },
      message: 'Login exitoso'
    });
    
  } catch (error) {
    console.error('❌ ERROR EN LOGIN:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// RUTA DE REGISTRO
app.post('/api/app/auth/register', async (req, res) => {
  try {
    console.log('📝 REGISTER REQUEST:', req.body);
    
    const { firstName, lastName, email, password, phone } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      });
    }
    
    // Verificar si existe
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El usuario ya existe'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const newUser = {
      id: mockUsers.length + 1,
      email: email.toLowerCase(),
      password: passwordHash,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      phone: phone || '',
      role: 'user'
    };
    
    mockUsers.push(newUser);
    
    // Generar token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ REGISTRO EXITOSO para:', email);
    
    // RESPUESTA JSON CORRECTA
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          fullName: newUser.fullName,
          phone: newUser.phone,
          role: newUser.role
        },
        token: token
      },
      message: 'Usuario registrado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ ERROR EN REGISTRO:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// RUTA DE RESERVAS (MOCK)
app.get('/api/app/user/bookings', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token requerido'
    });
  }
  
  try {
    jwt.verify(token, JWT_SECRET);
    
    // Reservas mock
    const mockBookings = [
      {
        id: '1',
        bookingReference: 'IT2025001',
        packageTitle: 'Paquete Camboriú Verano',
        destination: 'Camboriú',
        country: 'Brasil',
        travelDate: '2025-12-15',
        returnDate: '2025-12-20',
        durationDays: 5,
        travelersCount: 2,
        totalAmount: 1500,
        paidAmount: 500,
        currency: 'USD',
        status: 'confirmed',
        paymentStatus: 'partial',
        createdAt: '2025-01-15T10:00:00Z'
      }
    ];
    
    res.json({
      success: true,
      data: {
        bookings: mockBookings,
        total: mockBookings.length
      }
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
});

// CATCH ALL - ERROR HANDLER
app.use('*', (req, res) => {
  console.log('❌ RUTA NO ENCONTRADA:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log('🚀 SERVIDOR BACKEND SIMPLIFICADO INICIADO');
  console.log(`✅ Escuchando en http://localhost:${PORT}`);
  console.log('📱 Endpoints disponibles:');
  console.log('  POST /api/app/auth/login');
  console.log('  POST /api/app/auth/register');
  console.log('  GET /api/app/user/bookings');
  console.log('  GET /api/app/health');
  console.log('');
  console.log('🔑 CREDENCIALES DE PRUEBA:');
  console.log('  Email: test@test.com');
  console.log('  Password: 123456');
  console.log('');
  console.log('  Email: test@intertravel.com');
  console.log('  Password: test123');
});

module.exports = app;