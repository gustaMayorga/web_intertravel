// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    // Intentar obtener token de cookie primero, luego header
    const token = req.cookies?.authToken || 
                  req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.warn(`🚫 Token missing - ${req.method} ${req.originalUrl} from ${req.ip}`);
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        code: 'AUTH_TOKEN_MISSING'
      });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Log de actividad exitosa
    console.log(`🔐 Usuario autenticado: ${decoded.email} - ${new Date().toISOString()}`);
    
    next();
  } catch (error) {
    console.error(`❌ Error de autenticación: ${error.message} - ${req.originalUrl}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    return res.status(401).json({ 
      error: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware opcional para rutas que pueden funcionar con o sin autenticación
const optionalAuth = (req, res, next) => {
  try {
    const token = req.cookies?.authToken || 
                  req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Continuar sin usuario autenticado
    console.log(`ℹ️ Token opcional inválido: ${error.message}`);
  }
  
  next();
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      console.warn(`🚫 Acceso denegado: ${req.user.email} (${userRole}) intentó acceder a ${req.originalUrl}`);
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

module.exports = { 
  verifyToken, 
  optionalAuth, 
  requireRole 
};
