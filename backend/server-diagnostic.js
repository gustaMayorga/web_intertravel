// ===============================================
// SERVIDOR DE DIAGNÓSTICO - USAR TEMPORALMENTE
// ===============================================

console.log('🔍 INICIANDO DIAGNÓSTICO DEL SERVIDOR ORIGINAL...');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3002;

// Basic Middlewares
app.use(cors({
  origin: [
    'http://localhost:3005',
    'http://localhost:3009', 
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.url}`);
  next();
});

// ===============================================
// PROBAR CARGA DE MÓDULOS UNO POR UNO
// ===============================================

console.log('🔍 1. Probando carga de database...');
try {
  const { connect: connectDB, initializeDatabase } = require('./database');
  console.log('✅ Database module loaded OK');
} catch (error) {
  console.error('❌ Database error:', error.message);
}

console.log('🔍 2. Probando carga de auth middleware...');
try {
  const authMiddleware = require('./middleware/auth');
  console.log('✅ Auth middleware loaded OK');
} catch (error) {
  console.error('❌ Auth middleware error:', error.message);
}

console.log('🔍 3. Probando carga de admin auth routes...');
try {
  const adminAuthRoutes = require('./routes/admin/auth');
  console.log('✅ Admin auth routes loaded OK');
} catch (error) {
  console.error('❌ Admin auth routes error:', error.message);
}

console.log('🔍 4. Probando carga de admin index routes...');
try {
  const adminRoutes = require('./routes/admin/index');
  console.log('✅ Admin index routes loaded OK');
} catch (error) {
  console.error('❌ Admin index routes error:', error.message);
}

console.log('🔍 5. Probando carga de app-client routes...');
try {
  const appClientRoutes = require('./routes/app-client');
  console.log('✅ App client routes loaded OK');
} catch (error) {
  console.error('❌ App client routes error:', error.message);
}

// ===============================================
// SI TODO ESTÁ OK, CONFIGURAR RUTAS
// ===============================================

console.log('🔍 6. Configurando rutas...');

// Auth routes (sin middleware)
try {
  const adminAuthRoutes = require('./routes/admin/auth');
  app.use('/api/admin/auth', adminAuthRoutes);
  console.log('✅ /api/admin/auth configurado');
} catch (error) {
  console.error('❌ Error configurando admin auth:', error.message);
}

// Simple auth middleware para testing
const simpleAuth = (requiredRoles = []) => {
  return (req, res, next) => {
    try {
      // Obtener token del header
      const authHeader = req.header('Authorization');
      const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : null;
      
      console.log('🔍 Auth check - Token:', token ? 'presente' : 'ausente');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de acceso requerido'
        });
      }
      
      // Para testing, aceptar nuestro mock token
      if (token === 'mock-jwt-token-for-testing') {
        req.user = {
          id: 1,
          username: 'admin',
          role: 'admin',
          permissions: ['admin']
        };
        console.log('✅ Auth successful for user:', req.user.username);
        return next();
      }
      
      // Token inválido
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error en autenticación'
      });
    }
  };
};

// Admin routes (con middleware de testing)
try {
  const adminRoutes = require('./routes/admin/index');
  app.use('/api/admin', simpleAuth(['admin', 'super_admin']), adminRoutes);
  console.log('✅ /api/admin configurado con auth de testing');
} catch (error) {
  console.error('❌ Error configurando admin routes:', error.message);
}

// ===============================================
// RUTAS ESPECÍFICAS PRIORITY-KEYWORDS
// ===============================================

// Mock data para keywords
let mockKeywords = [
  { id: 1, keyword: 'charter', priority: 1, category: 'transport', active: true, description: 'Vuelos charter prioritarios' },
  { id: 2, keyword: 'perú', priority: 2, category: 'destination', active: true, description: 'Destino Perú prioritario' },
  { id: 3, keyword: 'MSC', priority: 3, category: 'cruise', active: true, description: 'Cruceros MSC prioritarios' },
  { id: 4, keyword: 'intertravel', priority: 1, category: 'agency', active: true, description: 'Paquetes InterTravel' },
  { id: 5, keyword: 'premium', priority: 4, category: 'category', active: true, description: 'Paquetes premium' },
  { id: 6, keyword: 'mendoza', priority: 3, category: 'destination', active: true, description: 'Destino Mendoza' }
];

// GET - Obtener keywords
app.get('/api/admin/priority-keywords', simpleAuth(['admin']), (req, res) => {
  console.log('📝 GET priority-keywords solicitado');
  res.json({
    success: true,
    keywords: mockKeywords
  });
});

// POST - Crear keyword
app.post('/api/admin/priority-keywords', simpleAuth(['admin']), (req, res) => {
  console.log('➕ POST priority-keywords:', req.body);
  
  const newKeyword = {
    id: Date.now(),
    ...req.body,
    active: true
  };
  
  mockKeywords.push(newKeyword);
  
  res.json({
    success: true,
    keyword: newKeyword
  });
});

// PUT - Actualizar keyword
app.put('/api/admin/priority-keywords/:id', simpleAuth(['admin']), (req, res) => {
  console.log('✏️ PUT priority-keywords:', req.params.id, req.body);
  
  const id = parseInt(req.params.id);
  const index = mockKeywords.findIndex(k => k.id === id);
  
  if (index !== -1) {
    mockKeywords[index] = { ...mockKeywords[index], ...req.body };
    res.json({
      success: true,
      keyword: mockKeywords[index]
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Keyword no encontrada'
    });
  }
});

// DELETE - Eliminar keyword
app.delete('/api/admin/priority-keywords/:id', simpleAuth(['admin']), (req, res) => {
  console.log('🗑️ DELETE priority-keywords:', req.params.id);
  
  const id = parseInt(req.params.id);
  const index = mockKeywords.findIndex(k => k.id === id);
  
  if (index !== -1) {
    const deletedKeyword = mockKeywords.splice(index, 1)[0];
    res.json({
      success: true,
      keyword: deletedKeyword
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Keyword no encontrada'
    });
  }
});

// App client routes
try {
  const appClientRoutes = require('./routes/app-client');
  app.use('/api/app', appClientRoutes);
  console.log('✅ /api/app configurado');
} catch (error) {
  console.error('❌ Error configurando app routes:', error.message);
}

// Catch all
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint no encontrado',
    method: req.method,
    url: req.originalUrl
  });
});

// ===============================================
// INICIAR SERVIDOR
// ===============================================
app.listen(PORT, () => {
  console.log('');
  console.log('🔍 ===============================================');
  console.log('🔍 SERVIDOR DE DIAGNÓSTICO INICIADO');
  console.log('🔍 ===============================================');
  console.log(`📡 Puerto: ${PORT}`);
  console.log('🔍 Prueba el login admin y mira qué errores aparecen...');
  console.log('===============================================');
});
