// ===============================================
// SISTEMA DE SEGURIDAD MEJORADO PARA INTERTRAVEL
// ===============================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

class SecurityManager {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || this.generateSecureSecret();
    this.saltRounds = 12;
    this.tokenExpiry = '24h';
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutos
    this.loginAttempts = new Map(); // IP -> { attempts, lockedUntil }
  }

  // ======================================
  // GENERACIÓN DE SECRETOS SEGUROS
  // ======================================
  
  generateSecureSecret() {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  // ======================================
  // GESTIÓN DE CONTRASEÑAS
  // ======================================
  
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  // ======================================
  // GESTIÓN DE JWT TOKENS
  // ======================================
  
  generateJWT(payload) {
    try {
      return jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.tokenExpiry,
        issuer: 'intertravel-backend',
        audience: 'intertravel-frontend'
      });
    } catch (error) {
      throw new Error('Error generating JWT');
    }
  }

  verifyJWT(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'intertravel-backend',
        audience: 'intertravel-frontend'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }
      throw new Error('Error verificando token');
    }
  }

  // ======================================
  // PROTECCIÓN CONTRA FUERZA BRUTA
  // ======================================
  
  checkLoginAttempts(ip) {
    const attempts = this.loginAttempts.get(ip);
    
    if (!attempts) {
      return { allowed: true, remaining: this.maxLoginAttempts };
    }

    // Verificar si está bloqueado
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
      return { 
        allowed: false, 
        remaining: 0,
        lockedFor: remainingTime 
      };
    }

    // Si pasó el tiempo de bloqueo, resetear
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      this.loginAttempts.delete(ip);
      return { allowed: true, remaining: this.maxLoginAttempts };
    }

    // Verificar intentos restantes
    const remaining = this.maxLoginAttempts - attempts.count;
    return { 
      allowed: remaining > 0, 
      remaining: Math.max(0, remaining) 
    };
  }

  recordFailedLogin(ip) {
    const attempts = this.loginAttempts.get(ip) || { count: 0, lockedUntil: null };
    attempts.count++;

    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockedUntil = Date.now() + this.lockoutDuration;
      console.log(`🚫 IP ${ip} bloqueada por ${this.lockoutDuration / 1000 / 60} minutos`);
    }

    this.loginAttempts.set(ip, attempts);
  }

  recordSuccessfulLogin(ip) {
    this.loginAttempts.delete(ip);
  }

  // ======================================
  // VALIDACIÓN DE ENTRADA
  // ======================================
  
  validateInput(data, rules) {
    const errors = [];

    for (const [field, value] of Object.entries(data)) {
      const rule = rules[field];
      if (!rule) continue;

      // Requerido
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(`${field} es requerido`);
        continue;
      }

      if (!value) continue; // Si no es requerido y está vacío, saltar

      // Tipo
      if (rule.type === 'email' && !validator.isEmail(value)) {
        errors.push(`${field} debe ser un email válido`);
      }

      // Longitud
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} debe tener al menos ${rule.minLength} caracteres`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} debe tener máximo ${rule.maxLength} caracteres`);
      }

      // Patrones
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} tiene formato inválido`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ======================================
  // SANITIZACIÓN
  // ======================================
  
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return validator.escape(input.trim());
  }

  sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // ======================================
  // MIDDLEWARE DE AUTENTICACIÓN
  // ======================================
  
  authMiddleware() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({
            success: false,
            error: 'Token de acceso requerido',
            code: 'NO_TOKEN'
          });
        }

        const token = authHeader.substring(7);
        const decoded = this.verifyJWT(token);
        
        // Verificar que el usuario aún existe y está activo
        if (decoded.role === 'super_admin' || decoded.role === 'admin_agencia') {
          req.user = decoded;
          next();
        } else {
          throw new Error('Rol inválido');
        }

      } catch (error) {
        console.log(`🚫 Auth failed: ${error.message}`);
        
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'INVALID_TOKEN'
        });
      }
    };
  }

  // ======================================
  // CONFIGURACIONES DE RATE LIMITING
  // ======================================
  
  createRateLimiters() {
    return {
      // Rate limiter general para API
      general: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 1000, // 1000 requests por ventana
        message: {
          success: false,
          error: 'Demasiadas solicitudes. Intenta más tarde.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          console.log(`🚫 Rate limit exceeded for IP: ${req.ip}`);
          res.status(429).json({
            success: false,
            error: 'Demasiadas solicitudes. Intenta más tarde.',
            code: 'RATE_LIMIT_EXCEEDED'
          });
        }
      }),

      // Rate limiter estricto para login
      auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 5, // Solo 5 intentos de login por IP
        message: {
          success: false,
          error: 'Demasiados intentos de login. Intenta en 15 minutos.',
          code: 'LOGIN_RATE_LIMIT_EXCEEDED'
        },
        skipSuccessfulRequests: true, // No contar logins exitosos
        handler: (req, res) => {
          console.log(`🚫 Login rate limit exceeded for IP: ${req.ip}`);
          res.status(429).json({
            success: false,
            error: 'Demasiados intentos de login. Intenta en 15 minutos.',
            code: 'LOGIN_RATE_LIMIT_EXCEEDED'
          });
        }
      }),

      // Rate limiter para búsquedas
      search: rateLimit({
        windowMs: 60 * 1000, // 1 minuto
        max: 30, // 30 búsquedas por minuto
        message: {
          success: false,
          error: 'Demasiadas búsquedas. Intenta más tarde.',
          code: 'SEARCH_RATE_LIMIT_EXCEEDED'
        }
      })
    };
  }

  // ======================================
  // CONFIGURACIÓN DE HELMET
  // ======================================
  
  getHelmetConfig() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "https:", "data:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://online.travelcompositor.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false, // Para compatibilidad
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    };
  }

  // ======================================
  // LOGGING DE SEGURIDAD
  // ======================================
  
  logSecurityEvent(type, details) {
    const timestamp = new Date().toISOString();
    console.log(`🔐 [SECURITY] ${timestamp} - ${type}:`, details);
    
    // En producción, enviar a sistema de logging centralizado
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrar con servicio de logging (ELK, Splunk, etc.)
    }
  }

  // ======================================
  // VALIDACIONES ESPECÍFICAS
  // ======================================
  
  getLoginValidationRules() {
    return {
      username: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[a-zA-Z0-9_]+$/
      },
      password: {
        required: true,
        minLength: 6,
        maxLength: 100
      }
    };
  }

  // ======================================
  // FUNCIONES DE UTILIDAD
  // ======================================
  
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
  }

  generateSecureSessionId() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = SecurityManager;