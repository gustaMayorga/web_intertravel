// ===============================================
// SISTEMA DE USUARIOS SEGURO
// ===============================================

const SecurityManager = require('./security-manager');

class UserManager {
  constructor() {
    this.security = new SecurityManager();
    this.initializeUsers();
  }

  async initializeUsers() {
    // En producción, estos estarían en la base de datos
    this.users = new Map();
    
    // Crear usuarios con contraseñas hasheadas
    await this.createUser({
      username: 'admin',
      password: process.env.ADMIN_PASSWORD || 'SecureAdmin2024!',
      role: 'super_admin',
      name: 'Administrador Principal',
      agency: 'InterTravel',
      permissions: ['dashboard:view', 'packages:manage', 'bookings:view', 'system:admin']
    });

    await this.createUser({
      username: 'agencia_admin',
      password: process.env.AGENCY_PASSWORD || 'SecureAgency2024!',
      role: 'admin_agencia',
      name: 'Administrador Agencia',
      agency: 'InterTravel',
      permissions: ['dashboard:view', 'packages:view', 'bookings:view']
    });

    console.log('✅ Usuarios seguros inicializados');
  }

  async createUser(userData) {
    const hashedPassword = await this.security.hashPassword(userData.password);
    
    this.users.set(userData.username, {
      ...userData,
      password: hashedPassword, // Guardar hash, no la contraseña
      createdAt: new Date().toISOString(),
      isActive: true,
      loginHistory: []
    });
  }

  async authenticate(username, password, clientIP) {
    try {
      // Validar entrada
      const validation = this.security.validateInput(
        { username, password },
        this.security.getLoginValidationRules()
      );

      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Verificar intentos de login
      const loginCheck = this.security.checkLoginAttempts(clientIP);
      if (!loginCheck.allowed) {
        throw new Error(`IP bloqueada por ${loginCheck.lockedFor} minutos`);
      }

      // Sanitizar entrada
      const cleanUsername = this.security.sanitizeInput(username);
      
      // Buscar usuario
      const user = this.users.get(cleanUsername);
      if (!user || !user.isActive) {
        this.security.recordFailedLogin(clientIP);
        throw new Error('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await this.security.verifyPassword(password, user.password);
      if (!isValidPassword) {
        this.security.recordFailedLogin(clientIP);
        this.security.logSecurityEvent('FAILED_LOGIN', {
          username: cleanUsername,
          ip: clientIP,
          timestamp: new Date().toISOString()
        });
        throw new Error('Credenciales inválidas');
      }

      // Login exitoso
      this.security.recordSuccessfulLogin(clientIP);
      
      // Actualizar historial de login
      user.loginHistory.push({
        ip: clientIP,
        timestamp: new Date().toISOString(),
        userAgent: null // Se puede agregar desde req.headers
      });

      // Mantener solo los últimos 10 logins
      if (user.loginHistory.length > 10) {
        user.loginHistory = user.loginHistory.slice(-10);
      }

      // Generar JWT
      const tokenPayload = {
        username: user.username,
        name: user.name,
        role: user.role,
        agency: user.agency,
        permissions: user.permissions,
        loginTime: new Date().toISOString()
      };

      const token = this.security.generateJWT(tokenPayload);

      this.security.logSecurityEvent('SUCCESSFUL_LOGIN', {
        username: cleanUsername,
        ip: clientIP,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        user: {
          username: user.username,
          name: user.name,
          role: user.role,
          agency: user.agency,
          permissions: user.permissions
        },
        token,
        expiresIn: '24h'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar si un usuario tiene un permiso específico
  hasPermission(user, permission) {
    return user.permissions && user.permissions.includes(permission);
  }

  // Obtener información del usuario desde token
  getUserFromToken(token) {
    try {
      return this.security.verifyJWT(token);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserManager;