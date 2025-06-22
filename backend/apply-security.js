#!/usr/bin/env node

// ===============================================
// APLICAR MEJORAS DE SEGURIDAD AL SERVIDOR
// ===============================================

const fs = require('fs');
const path = require('path');

console.log('🔐 Aplicando mejoras de seguridad al servidor...\n');

// Leer el server.js actual
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// ======================================
// 1. REEMPLAZAR IMPORTACIONES
// ======================================

const secureImports = `// ===============================================
// SERVIDOR INTERTRAVEL UNIFICADO - VERSION SEGURA
// Version: 3.1 POSTGRESQL + TRAVEL COMPOSITOR + SECURITY
// ===============================================

// Cargar variables de entorno primero
require('dotenv').config();

// Importaciones principales
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

// Importaciones de seguridad
const SecurityManager = require('./security-manager');
const UserManager = require('./user-manager');

const app = express();
const PORT = process.env.PORT || 3002;

// Inicializar sistemas de seguridad
const security = new SecurityManager();
const userManager = new UserManager();
const rateLimiters = security.createRateLimiters();`;

// ======================================
// 2. MIDDLEWARE DE SEGURIDAD MEJORADO
// ======================================

const secureMiddleware = `// ======================================
// CONFIGURACIÓN DE SEGURIDAD AVANZADA
// ======================================

// Helmet con configuración segura
app.use(helmet(security.getHelmetConfig()));

// Set trust proxy
app.set('trust proxy', 1);

// Rate limiting por tipo
app.use('/api/', rateLimiters.general);
app.use('/api/auth/', rateLimiters.auth);
app.use('/api/packages/search', rateLimiters.search);

// CORS configurado según entorno
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3005', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(\`🚫 CORS blocked origin: \${origin}\`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware básicos con validación
app.use(compression());
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Validar que sea JSON válido
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('JSON inválido');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de seguridad
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = security.getClientIP(req);
  console.log(\`\${timestamp} \${req.method} \${req.url} - IP: \${ip}\`);
  
  // Log requests sospechosos
  if (req.url.includes('..') || req.url.includes('<script>')) {
    security.logSecurityEvent('SUSPICIOUS_REQUEST', {
      ip,
      url: req.url,
      userAgent: req.headers['user-agent']
    });
  }
  
  next();
});`;

// ======================================
// 3. SISTEMA DE AUTENTICACIÓN SEGURO
// ======================================

const secureAuth = `// ======================================
// RUTAS DE AUTENTICACIÓN SEGURAS
// ======================================

// Login de agencia SEGURO
app.post('/api/auth/agency-login', async (req, res) => {
  try {
    const clientIP = security.getClientIP(req);
    const sanitizedData = security.sanitizeObject(req.body);
    const { username, password } = sanitizedData;
    
    console.log(\`🔐 Intento de login agencia: \${username} - IP: \${clientIP}\`);
    
    const result = await userManager.authenticate(username, password, clientIP);
    
    if (result.success) {
      console.log(\`✅ Login agencia exitoso: \${username}\`);
      res.json({
        success: true,
        user: result.user,
        token: result.token,
        expiresIn: result.expiresIn,
        message: 'Autenticación exitosa'
      });
    } else {
      console.log(\`❌ Login agencia fallido: \${username} - \${result.error}\`);
      res.status(401).json({
        success: false,
        error: result.error,
        code: 'AUTHENTICATION_FAILED'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en login agencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Login admin SEGURO
app.post('/api/admin/login', async (req, res) => {
  try {
    const clientIP = security.getClientIP(req);
    const sanitizedData = security.sanitizeObject(req.body);
    const { username, password } = sanitizedData;
    
    console.log(\`🔐 Intento de login admin: \${username} - IP: \${clientIP}\`);
    
    const result = await userManager.authenticate(username, password, clientIP);
    
    if (result.success && result.user.role === 'super_admin') {
      console.log(\`✅ Login admin exitoso: \${username}\`);
      res.json({
        success: true,
        user: result.user,
        token: result.token,
        expiresIn: result.expiresIn,
        message: 'Autenticación exitosa'
      });
    } else {
      console.log(\`❌ Login admin fallido: \${username}\`);
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas o permisos insuficientes',
        code: 'AUTHENTICATION_FAILED'
      });
    }
    
  } catch (error) {
    console.error('❌ Error en login admin:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Verificar token SEGURO
app.get('/api/auth/verify', security.authMiddleware(), (req, res) => {
  res.json({
    success: true,
    user: {
      username: req.user.username,
      name: req.user.name,
      role: req.user.role,
      agency: req.user.agency,
      permissions: req.user.permissions
    },
    valid: true,
    expiresAt: new Date(req.user.exp * 1000).toISOString()
  });
});

// Logout SEGURO
app.post('/api/auth/logout', security.authMiddleware(), (req, res) => {
  security.logSecurityEvent('LOGOUT', {
    username: req.user.username,
    ip: security.getClientIP(req),
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});`;

// ======================================
// 4. GENERAR ARCHIVO SEGURO
// ======================================

console.log('1. ✅ Preparando importaciones seguras...');
console.log('2. ✅ Configurando middleware de seguridad...');
console.log('3. ✅ Implementando autenticación JWT...');

// Obtener partes del archivo original que queremos mantener
const originalParts = {
  // Mantener las funciones de obtención de datos
  dataFunctions: serverContent.substring(
    serverContent.indexOf('// ======================================\n// OBTENER PAQUETES CON FALLBACK'),
    serverContent.indexOf('// ======================================\n// DATOS MOCK PARA DESARROLLO')
  ),
  
  // Mantener datos mock
  mockData: serverContent.substring(
    serverContent.indexOf('// ======================================\n// DATOS MOCK PARA DESARROLLO'),
    serverContent.indexOf('// ======================================\n// RUTAS DE AUTENTICACIÓN')
  ),
  
  // Mantener rutas API públicas
  publicRoutes: serverContent.substring(
    serverContent.indexOf('// ======================================\n// RUTAS API PÚBLICAS'),
    serverContent.indexOf('// ======================================\n// RUTAS ADMIN PROTEGIDAS')
  ),
  
  // Mantener rutas admin (pero cambiar middleware)
  adminRoutes: serverContent.substring(
    serverContent.indexOf('// ======================================\n// RUTAS ADMIN PROTEGIDAS'),
    serverContent.indexOf('// ======================================\n// MANEJO DE ERRORES Y 404')
  ).replace(/requireAuth/g, 'security.authMiddleware()'),
  
  // Mantener manejo de errores y resto
  finalParts: serverContent.substring(
    serverContent.indexOf('// ======================================\n// MANEJO DE ERRORES Y 404')
  )
};

// Construir el nuevo archivo
const newServerContent = [
  secureImports,
  '',
  originalParts.dataFunctions,
  originalParts.mockData,
  secureMiddleware,
  secureAuth,
  originalParts.publicRoutes,
  originalParts.adminRoutes,
  originalParts.finalParts
].join('\n');

// Escribir el archivo seguro
fs.writeFileSync(serverPath + '.secure', newServerContent);

console.log('4. ✅ Archivo server.js.secure creado...');
console.log('5. ✅ Validando sintaxis...');

// Validar que el archivo nuevo es sintácticamente correcto
try {
  require('./server.js.secure');
  console.log('6. ✅ Sintaxis válida confirmada...');
} catch (error) {
  console.log('6. ❌ Error de sintaxis:', error.message);
  process.exit(1);
}

console.log('\n🎉 MEJORAS DE SEGURIDAD APLICADAS!\n');
console.log('📋 PRÓXIMOS PASOS:');
console.log('1. Revisar server.js.secure');
console.log('2. Copiar .env.example a .env y configurar');
console.log('3. Ejecutar: npm install');
console.log('4. Si todo está OK: mv server.js.secure server.js');
console.log('5. Reiniciar servidor');

console.log('\n🔐 MEJORAS INCLUIDAS:');
console.log('✅ JWT tokens reales (no fake)');
console.log('✅ Contraseñas hasheadas con bcrypt');
console.log('✅ Rate limiting inteligente');
console.log('✅ Validación y sanitización de entrada');
console.log('✅ Protección contra fuerza bruta');
console.log('✅ Logging de eventos de seguridad');
console.log('✅ Headers de seguridad (Helmet)');
console.log('✅ CORS restringido por entorno');
console.log('✅ Configuración segura por defecto');

console.log('\n⚠️ RECORDATORIOS IMPORTANTES:');
console.log('❗ Cambiar TODAS las contraseñas por defecto');
console.log('❗ Generar JWT_SECRET único y seguro');
console.log('❗ No subir .env a Git (ya está en .gitignore)');
console.log('❗ Usar HTTPS en producción');
console.log('❗ Monitorear logs de seguridad');

process.exit(0);