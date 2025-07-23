// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN AVANZADO - FASE 3
// ===============================================

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// ===============================================
// CONFIGURACIÓN
// ===============================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Store de sesiones en memoria (en producción usar Redis)
const activeSessions = new Map();
const loginAttempts = new Map();

// ===============================================
// RATE LIMITING
// ===============================================

const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: {
    success: false,
    error: message,
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiters específicos
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  5, // máximo 5 intentos
  'Demasiados intentos de autenticación. Intente en 15 minutos.'
);

const apiRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minuto
  100, // máximo 100 requests
  'Demasiadas requests. Intente en 1 minuto.'
);

const strictApiRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minuto
  10, // máximo 10 requests
  'Endpoint protegido. Máximo 10 requests por minuto.'
);

// ===============================================
// TIPOS DE USUARIO Y PERMISOS
// ===============================================

const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  AGENCY: 'agency',
  USER: 'user',
  GUEST: 'guest'
};

const PERMISSIONS = {
  // Admin permissions
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
  ADMIN_DELETE: 'admin:delete',
  
  // User permissions
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  
  // Agency permissions
  AGENCY_READ: 'agency:read',
  AGENCY_WRITE: 'agency:write',
  
  // Booking permissions
  BOOKING_CREATE: 'booking:create',
  BOOKING_READ: 'booking:read',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_CANCEL: 'booking:cancel'
};

const rolePermissions = {
  [USER_ROLES.SUPER_ADMIN]: [
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
    PERMISSIONS.ADMIN_DELETE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.AGENCY_READ,
    PERMISSIONS.AGENCY_WRITE,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_CANCEL
  ],
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.AGENCY_READ,
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_UPDATE
  ],
  [USER_ROLES.AGENCY]: [
    PERMISSIONS.AGENCY_READ,
    PERMISSIONS.AGENCY_WRITE,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_UPDATE
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_WRITE,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_READ,
    PERMISSIONS.BOOKING_CANCEL
  ],
  [USER_ROLES.GUEST]: [
    PERMISSIONS.USER_READ
  ]
};

// ===============================================
// HELPER FUNCTIONS
// ===============================================

/**
 * Verificar si un usuario tiene un permiso específico
 */
const hasPermission = (userRole, permission) => {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Obtener permisos de un rol
 */
const getRolePermissions = (role) => {
  return rolePermissions[role] || [];
};

/**
 * Generar tokens JWT
 */
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || USER_ROLES.USER,
    fullName: user.full_name || `${user.first_name} ${user.last_name}`,
    sessionId: Date.now() + Math.random().toString(36)
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '2h' // Token más corto para mayor seguridad
  });

  const refreshToken = jwt.sign(
    { userId: user.id, sessionId: payload.sessionId }, 
    JWT_REFRESH_SECRET, 
    { expiresIn: '30d' }
  );

  // Guardar sesión activa
  activeSessions.set(payload.sessionId, {
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: new Date(),
    lastActivity: new Date()
  });

  return { accessToken, refreshToken, sessionId: payload.sessionId };
};

/**
 * Limpiar sesiones expiradas
 */
const cleanExpiredSessions = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.lastActivity < thirtyDaysAgo) {
      activeSessions.delete(sessionId);
    }
  }
};

// Limpiar sesiones cada hora
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN PRINCIPAL
// ===============================================

/**
 * Middleware de autenticación avanzado
 */
const authenticateAdvanced = (requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      // Obtener token
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        console.warn(`🚫 Token missing - ${req.method} ${req.originalUrl} from ${req.ip}`);
        return res.status(401).json({
          success: false,
          error: 'Token de acceso requerido',
          code: 'AUTH_TOKEN_MISSING'
        });
      }

      // Verificar token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verificar sesión activa
      const session = activeSessions.get(decoded.sessionId);
      if (!session) {
        console.warn(`🚫 Sesión inválida - ${decoded.email} - ${req.originalUrl}`);
        return res.status(401).json({
          success: false,
          error: 'Sesión inválida o expirada',
          code: 'AUTH_SESSION_INVALID'
        });
      }

      // Actualizar última actividad
      session.lastActivity = new Date();
      activeSessions.set(decoded.sessionId, session);

      // Verificar permisos si se requiere
      if (requiredPermission && !hasPermission(decoded.role, requiredPermission)) {
        console.warn(`🚫 Permiso denegado - ${decoded.email} - ${requiredPermission} - ${req.originalUrl}`);
        return res.status(403).json({
          success: false,
          error: 'Permisos insuficientes',
          code: 'AUTH_PERMISSION_DENIED',
          required: requiredPermission,
          userRole: decoded.role
        });
      }

      // Añadir información del usuario al request
      req.user = {
        ...decoded,
        permissions: getRolePermissions(decoded.role)
      };

      console.log(`🔐 Usuario autenticado: ${decoded.email} (${decoded.role}) - ${req.originalUrl}`);
      next();

    } catch (error) {
      console.error(`❌ Error de autenticación: ${error.message} - ${req.originalUrl}`);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expirado',
          code: 'AUTH_TOKEN_EXPIRED'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
          code: 'AUTH_TOKEN_INVALID'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Error de autenticación',
        code: 'AUTH_ERROR'
      });
    }
  };
};

// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN OPCIONAL
// ===============================================

/**
 * Middleware opcional - funciona con o sin autenticación
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const session = activeSessions.get(decoded.sessionId);
    
    if (session) {
      session.lastActivity = new Date();
      activeSessions.set(decoded.sessionId, session);
      
      req.user = {
        ...decoded,
        permissions: getRolePermissions(decoded.role)
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
};

// ===============================================
// MIDDLEWARE DE REFRESH TOKEN
// ===============================================

/**
 * Endpoint para renovar tokens
 */
const refreshTokenEndpoint = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token requerido',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Verificar sesión activa
    const session = activeSessions.get(decoded.sessionId);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Sesión expirada',
        code: 'REFRESH_SESSION_EXPIRED'
      });
    }

    // Buscar usuario (aquí necesitarías acceso a la BD)
    // Por ahora usar datos de la sesión
    const userFromSession = {
      id: session.userId,
      email: session.email,
      role: session.role
    };

    // Generar nuevos tokens
    const tokens = generateTokens(userFromSession);

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('Error renovando token:', error);
    res.status(401).json({
      success: false,
      error: 'Refresh token inválido',
      code: 'REFRESH_TOKEN_INVALID'
    });
  }
};

// ===============================================
// MIDDLEWARE DE LOGOUT
// ===============================================

/**
 * Logout seguro
 */
const logoutEndpoint = (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Eliminar sesión activa
      activeSessions.delete(decoded.sessionId);
      
      console.log(`👋 Logout exitoso: ${decoded.email}`);
    }

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    // Incluso si hay error, confirmar logout
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  }
};

// ===============================================
// MIDDLEWARE DE SEGURIDAD ADICIONAL
// ===============================================

/**
 * Middleware para trackear intentos de login fallidos
 */
const trackLoginAttempts = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const attempts = loginAttempts.get(clientIp) || { count: 0, lastAttempt: null };

  // Si hay muchos intentos fallidos, bloquear temporalmente
  if (attempts.count >= 5) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const lockoutTime = 15 * 60 * 1000; // 15 minutos

    if (timeSinceLastAttempt < lockoutTime) {
      return res.status(429).json({
        success: false,
        error: 'Demasiados intentos fallidos. Intente más tarde.',
        code: 'LOGIN_ATTEMPTS_EXCEEDED',
        retryAfter: Math.ceil((lockoutTime - timeSinceLastAttempt) / 1000)
      });
    } else {
      // Reset después del tiempo de bloqueo
      loginAttempts.delete(clientIp);
    }
  }

  req.clientIp = clientIp;
  next();
};

/**
 * Registrar intento fallido
 */
const recordFailedLogin = (clientIp) => {
  const attempts = loginAttempts.get(clientIp) || { count: 0, lastAttempt: null };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(clientIp, attempts);
};

/**
 * Limpiar intentos exitosos
 */
const clearLoginAttempts = (clientIp) => {
  loginAttempts.delete(clientIp);
};

// ===============================================
// EXPORTS
// ===============================================

module.exports = {
  // Middleware principal
  authenticateAdvanced,
  optionalAuth,
  
  // Rate limiting
  authRateLimit,
  apiRateLimit,
  strictApiRateLimit,
  
  // Endpoints especiales
  refreshTokenEndpoint,
  logoutEndpoint,
  
  // Seguridad adicional
  trackLoginAttempts,
  recordFailedLogin,
  clearLoginAttempts,
  
  // Utilidades
  generateTokens,
  hasPermission,
  getRolePermissions,
  
  // Constantes
  USER_ROLES,
  PERMISSIONS,
  
  // Info de sesiones (para debugging)
  getActiveSessions: () => activeSessions,
  getLoginAttempts: () => loginAttempts
};
