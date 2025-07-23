// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN REAL - INTERTRAVEL
// Solución para vulnerabilidad crítica de bypass
// ===============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

// Configuración de seguridad robusta
const JWT_SECRET = process.env.JWT_SECRET || 'intertravel-super-secret-key-2025-' + Date.now();
const JWT_EXPIRATION = '24h';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutos

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: MAX_LOGIN_ATTEMPTS,
  message: {
    success: false,
    error: 'Demasiados intentos de login. Intente en 15 minutos.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Almacén temporal para intentos fallidos (en producción usar Redis)
const failedAttempts = new Map();
const activeSessions = new Map();

// ===============================================
// FUNCIONES DE UTILIDAD DE SEGURIDAD
// ===============================================

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

function generateSecureToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions || ['read'],
    sessionId: Date.now() + Math.random(),
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRATION,
    issuer: 'intertravel-admin',
    audience: 'intertravel-users'
  });
}

function isAccountLocked(ip) {
  const attempts = failedAttempts.get(ip);
  if (!attempts) return false;
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLock = Date.now() - attempts.lastAttempt;
    return timeSinceLock < LOCKOUT_TIME;
  }
  return false;
}

function recordFailedAttempt(ip) {
  const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  failedAttempts.set(ip, attempts);
}

function clearFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN SEGURO
// ===============================================

function authMiddleware(requiredRoles = ['admin']) {
  return async (req, res, next) => {
    try {
      console.log('🔐 Verificando autenticación para:', req.path);

      const authHeader = req.get('Authorization');
      const token = authHeader && authHeader.split(' ')[1];

      // ELIMINADO: Bypass automático de desarrollo
      // Ya NO permite acceso sin token en ningún entorno
      
      if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({
          success: false,
          error: 'Token de autenticación requerido',
          code: 'NO_TOKEN'
        });
      }

      // Verificar JWT con validaciones estrictas
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET, {
          issuer: 'intertravel-admin',
          audience: 'intertravel-users'
        });
      } catch (jwtError) {
        console.log('❌ Invalid JWT:', jwtError.message);
        return res.status(401).json({
          success: false,
          error: 'Token inválido o expirado',
          code: 'INVALID_TOKEN'
        });
      }

      // Verificar sesión activa
      const sessionKey = `${decoded.userId}-${decoded.sessionId}`;
      const sessionData = activeSessions.get(sessionKey);
      
      if (!sessionData) {
        console.log('❌ Session not found or expired');
        return res.status(401).json({
          success: false,
          error: 'Sesión expirada. Inicie sesión nuevamente.',
          code: 'SESSION_EXPIRED'
        });
      }

      // Verificar roles requeridos
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        console.log('❌ Insufficient permissions');
        return res.status(403).json({
          success: false,
          error: 'Permisos insuficientes para esta acción',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Agregar información de usuario al request
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        permissions: decoded.permissions || [],
        sessionId: decoded.sessionId
      };

      // Actualizar última actividad de la sesión
      sessionData.lastActivity = Date.now();
      activeSessions.set(sessionKey, sessionData);

      console.log('✅ Authentication successful for:', decoded.username);
      next();

    } catch (error) {
      console.error('❌ Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno de autenticación',
        code: 'AUTH_ERROR'
      });
    }
  };
}

// ===============================================
// CONTROLADOR DE LOGIN SEGURO
// ===============================================

async function loginController(req, res) {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    console.log('🔐 Login attempt from:', clientIP);

    // Verificar si la cuenta está bloqueada
    if (isAccountLocked(clientIP)) {
      console.log('❌ Account locked for IP:', clientIP);
      return res.status(429).json({
        success: false,
        error: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos',
        code: 'ACCOUNT_LOCKED',
        retryAfter: LOCKOUT_TIME
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      recordFailedAttempt(clientIP);
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Credenciales por defecto (en producción usar base de datos)
    const validUsers = [
      {
        id: 'admin-001',
        username: 'admin',
        passwordHash: await hashPassword('admin123'),
        role: 'super_admin',
        permissions: ['read', 'write', 'delete', 'manage_users']
      },
      {
        id: 'manager-001', 
        username: 'manager',
        passwordHash: await hashPassword('manager123'),
        role: 'admin',
        permissions: ['read', 'write']
      }
    ];

    // Buscar usuario
    const user = validUsers.find(u => u.username === username);
    
    if (!user) {
      recordFailedAttempt(clientIP);
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar contraseña
    const passwordValid = await verifyPassword(password, user.passwordHash);
    
    if (!passwordValid) {
      recordFailedAttempt(clientIP);
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token y sesión
    const token = generateSecureToken(user);
    const sessionId = Date.now() + Math.random();
    const sessionKey = `${user.id}-${sessionId}`;
    
    // Registrar sesión activa
    activeSessions.set(sessionKey, {
      userId: user.id,
      username: user.username,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ip: clientIP
    });

    // Limpiar intentos fallidos
    clearFailedAttempts(clientIP);

    console.log('✅ Login successful for:', username);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      },
      expiresIn: JWT_EXPIRATION
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}

// ===============================================
// CONTROLADOR DE LOGOUT SEGURO
// ===============================================

function logoutController(req, res) {
  try {
    if (req.user && req.user.sessionId) {
      const sessionKey = `${req.user.id}-${req.user.sessionId}`;
      activeSessions.delete(sessionKey);
      console.log('✅ Session terminated for:', req.user.username);
    }

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Error durante logout'
    });
  }
}

// ===============================================
// MIDDLEWARE DE LIMPIEZA DE SESIONES
// ===============================================

function cleanupExpiredSessions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  
  for (const [key, session] of activeSessions.entries()) {
    if (now - session.lastActivity > maxAge) {
      activeSessions.delete(key);
      console.log('🧹 Cleaned expired session for:', session.username);
    }
  }
}

// Limpiar sesiones cada 30 minutos
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

// ===============================================
// EXPORTAR MÓDULOS
// ===============================================

module.exports = {
  authMiddleware,
  loginController,
  logoutController,
  loginLimiter,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  JWT_SECRET
};

console.log('✅ Secure auth system loaded - NO BYPASS MODE');
