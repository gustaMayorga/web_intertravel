// Users Manager - Gestión completa de usuarios con PostgreSQL
// ============================================================

const { dbManager } = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UsersManager {
  constructor() {
    this.saltRounds = 10;
    this.jwtSecret = process.env.JWT_SECRET || 'intertravel-secret-key';
  }

  // ================================
  // AUTENTICACIÓN Y TOKENS
  // ================================

  async authenticate(username, password) {
    try {
      // Buscar usuario con role y agencia
      const result = await dbManager.query(`
        SELECT 
          u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
          u.agency_id, u.is_active, u.email_verified, u.last_login,
          r.name as role_name, r.display_name as role_display, r.permissions as role_permissions,
          a.name as agency_name, a.code as agency_code, a.status as agency_status
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN agencies a ON u.agency_id = a.id
        WHERE u.username = $1 AND u.is_active = true
      `, [username]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Usuario no encontrado o inactivo' };
      }

      const user = result.rows[0];

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        // Log intento fallido
        await this.logAccess(user.id, 'login_failed', null, 'Contraseña incorrecta');
        return { success: false, error: 'Contraseña incorrecta' };
      }

      // Verificar que la agencia esté activa (si tiene agencia)
      if (user.agency_id && user.agency_status !== 'active') {
        return { success: false, error: 'Agencia inactiva' };
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role_name,
          agencyId: user.agency_id
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      // Actualizar último login
      await dbManager.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP, last_activity = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Guardar sesión
      await this.createSession(user.id, token);

      // Log acceso exitoso
      await this.logAccess(user.id, 'login_success');

      // Preparar respuesta sin datos sensibles
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: {
          name: user.role_name,
          displayName: user.role_display,
          permissions: user.role_permissions || []
        },
        agency: user.agency_id ? {
          id: user.agency_id,
          name: user.agency_name,
          code: user.agency_code,
          status: user.agency_status
        } : null,
        lastLogin: user.last_login,
        emailVerified: user.email_verified
      };

      return {
        success: true,
        user: userResponse,
        token: token,
        expiresIn: '24h'
      };

    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);

      // Verificar que la sesión esté activa
      const sessionResult = await dbManager.query(`
        SELECT id FROM user_sessions 
        WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP AND is_active = true
      `, [await this.hashToken(token)]);

      if (sessionResult.rows.length === 0) {
        return { success: false, error: 'Sesión expirada o inválida' };
      }

      // Actualizar actividad del usuario
      await dbManager.query(
        'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
        [decoded.userId]
      );

      return { success: true, user: decoded };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { success: false, error: 'Token expirado' };
      }
      return { success: false, error: 'Token inválido' };
    }
  }

  async createSession(userId, token, ipAddress = null, userAgent = null) {
    try {
      const tokenHash = await this.hashToken(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      await dbManager.query(`
        INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, tokenHash, expiresAt, ipAddress, userAgent]);

      return { success: true };
    } catch (error) {
      console.error('❌ Error creando sesión:', error);
      return { success: false, error: error.message };
    }
  }

  async revokeSession(token) {
    try {
      const tokenHash = await this.hashToken(token);
      
      await dbManager.query(`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE token_hash = $1
      `, [tokenHash]);

      return { success: true };
    } catch (error) {
      console.error('❌ Error revocando sesión:', error);
      return { success: false, error: error.message };
    }
  }

  async hashToken(token) {
    return bcrypt.hash(token, 5); // Hash ligero para tokens
  }

  // ================================
  // GESTIÓN DE USUARIOS
  // ================================

  async getUsers(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        agency_id,
        status,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = filters;

      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramCount = 0;

      // Filtros
      if (search) {
        paramCount++;
        whereConditions.push(`(
          u.username ILIKE $${paramCount} OR 
          u.email ILIKE $${paramCount} OR 
          u.first_name ILIKE $${paramCount} OR 
          u.last_name ILIKE $${paramCount}
        )`);
        queryParams.push(`%${search}%`);
      }

      if (role) {
        paramCount++;
        whereConditions.push(`r.name = $${paramCount}`);
        queryParams.push(role);
      }

      if (agency_id) {
        paramCount++;
        whereConditions.push(`u.agency_id = $${paramCount}`);
        queryParams.push(agency_id);
      }

      if (status !== undefined) {
        paramCount++;
        whereConditions.push(`u.is_active = $${paramCount}`);
        queryParams.push(status === 'active');
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      // Query principal
      const usersResult = await dbManager.query(`
        SELECT 
          u.id, u.username, u.email, u.first_name, u.last_name,
          u.agency_id, u.is_active, u.email_verified, u.created_at, u.last_login, u.last_activity,
          r.name as role_name, r.display_name as role_display,
          a.name as agency_name, a.code as agency_code,
          (SELECT COUNT(*) FROM user_sessions WHERE user_id = u.id AND is_active = true) as active_sessions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN agencies a ON u.agency_id = a.id
        WHERE ${whereClause}
        ORDER BY u.${sort_by} ${sort_order}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, limit, offset]);

      // Count total
      const countResult = await dbManager.query(`
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN agencies a ON u.agency_id = a.id
        WHERE ${whereClause}
      `, queryParams);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          users: usersResult.rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            role: {
              name: user.role_name,
              displayName: user.role_display
            },
            agency: user.agency_id ? {
              id: user.agency_id,
              name: user.agency_name,
              code: user.agency_code
            } : null,
            isActive: user.is_active,
            emailVerified: user.email_verified,
            lastLogin: user.last_login,
            lastActivity: user.last_activity,
            activeSessions: parseInt(user.active_sessions),
            createdAt: user.created_at
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async getUserById(userId) {
    try {
      const result = await dbManager.query(`
        SELECT 
          u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
          u.agency_id, u.role_id, u.is_active, u.email_verified, u.two_factor_enabled,
          u.avatar_url, u.settings, u.created_at, u.last_login, u.last_activity,
          r.name as role_name, r.display_name as role_display, r.permissions as role_permissions,
          a.name as agency_name, a.code as agency_code, a.status as agency_status
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN agencies a ON u.agency_id = a.id
        WHERE u.id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const user = result.rows[0];

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          phone: user.phone,
          role: {
            id: user.role_id,
            name: user.role_name,
            displayName: user.role_display,
            permissions: user.role_permissions || []
          },
          agency: user.agency_id ? {
            id: user.agency_id,
            name: user.agency_name,
            code: user.agency_code,
            status: user.agency_status
          } : null,
          isActive: user.is_active,
          emailVerified: user.email_verified,
          twoFactorEnabled: user.two_factor_enabled,
          avatarUrl: user.avatar_url,
          settings: user.settings || {},
          lastLogin: user.last_login,
          lastActivity: user.last_activity,
          createdAt: user.created_at
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async createUser(userData, createdBy = null) {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        phone,
        roleId,
        agencyId,
        isActive = true,
        emailVerified = false
      } = userData;

      // Validaciones
      if (!username || !email || !password) {
        return { success: false, error: 'Username, email y password son requeridos' };
      }

      // Verificar username único
      const existingUser = await dbManager.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return { success: false, error: 'Username o email ya existe' };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // Crear usuario
      const result = await dbManager.query(`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, phone,
          role_id, agency_id, is_active, email_verified, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, username, email, created_at
      `, [
        username, email, passwordHash, firstName, lastName, phone,
        roleId, agencyId, isActive, emailVerified, createdBy
      ]);

      const newUser = result.rows[0];

      // Log actividad
      await this.logAccess(newUser.id, 'user_created', null, 'Usuario creado por admin', { createdBy });

      return {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.created_at
        },
        message: 'Usuario creado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async updateUser(userId, updateData, updatedBy = null) {
    try {
      const {
        email,
        firstName,
        lastName,
        phone,
        roleId,
        agencyId,
        isActive,
        emailVerified
      } = updateData;

      // Verificar que el usuario existe
      const existingUser = await dbManager.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (existingUser.rows.length === 0) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Si hay email, verificar que sea único
      if (email) {
        const emailCheck = await dbManager.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, userId]
        );
        if (emailCheck.rows.length > 0) {
          return { success: false, error: 'Email ya está en uso' };
        }
      }

      // Construir query dinámico
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      if (email !== undefined) {
        paramCount++;
        updateFields.push(`email = $${paramCount}`);
        values.push(email);
      }

      if (firstName !== undefined) {
        paramCount++;
        updateFields.push(`first_name = $${paramCount}`);
        values.push(firstName);
      }

      if (lastName !== undefined) {
        paramCount++;
        updateFields.push(`last_name = $${paramCount}`);
        values.push(lastName);
      }

      if (phone !== undefined) {
        paramCount++;
        updateFields.push(`phone = $${paramCount}`);
        values.push(phone);
      }

      if (roleId !== undefined) {
        paramCount++;
        updateFields.push(`role_id = $${paramCount}`);
        values.push(roleId);
      }

      if (agencyId !== undefined) {
        paramCount++;
        updateFields.push(`agency_id = $${paramCount}`);
        values.push(agencyId);
      }

      if (isActive !== undefined) {
        paramCount++;
        updateFields.push(`is_active = $${paramCount}`);
        values.push(isActive);
      }

      if (emailVerified !== undefined) {
        paramCount++;
        updateFields.push(`email_verified = $${paramCount}`);
        values.push(emailVerified);
      }

      if (updatedBy) {
        paramCount++;
        updateFields.push(`updated_by = $${paramCount}`);
        values.push(updatedBy);
      }

      if (updateFields.length === 0) {
        return { success: false, error: 'No hay datos para actualizar' };
      }

      // Agregar timestamp y userId
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      const result = await dbManager.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING id, username, email, updated_at
      `, values);

      const updatedUser = result.rows[0];

      // Log actividad
      await this.logAccess(userId, 'user_updated', null, 'Usuario actualizado', { updatedBy, changes: updateData });

      return {
        success: true,
        user: updatedUser,
        message: 'Usuario actualizado exitosamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async deleteUser(userId, deletedBy = null) {
    try {
      // Verificar que el usuario existe y no es el mismo que lo está eliminando
      const userCheck = await dbManager.query('SELECT username FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      if (userId === deletedBy) {
        return { success: false, error: 'No puedes eliminar tu propio usuario' };
      }

      const username = userCheck.rows[0].username;

      // En lugar de eliminar, desactivar (soft delete)
      await dbManager.query(`
        UPDATE users 
        SET is_active = false, updated_by = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [deletedBy, userId]);

      // Revocar todas las sesiones
      await dbManager.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1', [userId]);

      // Log actividad
      await this.logAccess(userId, 'user_deleted', null, 'Usuario eliminado/desactivado', { deletedBy });

      return {
        success: true,
        message: `Usuario ${username} desactivado exitosamente`
      };

    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async changePassword(userId, currentPassword, newPassword, changedBy = null) {
    try {
      // Obtener usuario actual
      const userResult = await dbManager.query(
        'SELECT password_hash FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      const user = userResult.rows[0];

      // Verificar contraseña actual (si no es admin cambiando otra)
      if (userId === changedBy) {
        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordMatch) {
          return { success: false, error: 'Contraseña actual incorrecta' };
        }
      }

      // Hash nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Actualizar contraseña
      await dbManager.query(`
        UPDATE users 
        SET password_hash = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [newPasswordHash, changedBy, userId]);

      // Si no es el mismo usuario, revocar todas las sesiones
      if (userId !== changedBy) {
        await dbManager.query('UPDATE user_sessions SET is_active = false WHERE user_id = $1', [userId]);
      }

      // Log actividad
      await this.logAccess(userId, 'password_changed', null, 'Contraseña cambiada', { changedBy });

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // ROLES Y PERMISOS
  // ================================

  async getRoles() {
    try {
      const result = await dbManager.query(`
        SELECT id, name, display_name, description, permissions, is_active
        FROM roles
        WHERE is_active = true
        ORDER BY display_name
      `);

      return {
        success: true,
        roles: result.rows
      };

    } catch (error) {
      console.error('❌ Error obteniendo roles:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async getPermissions() {
    try {
      const result = await dbManager.query(`
        SELECT name, display_name, description, module, category
        FROM permissions
        WHERE is_active = true
        ORDER BY module, category, display_name
      `);

      // Agrupar por módulo
      const groupedPermissions = result.rows.reduce((acc, perm) => {
        if (!acc[perm.module]) {
          acc[perm.module] = {};
        }
        if (!acc[perm.module][perm.category]) {
          acc[perm.module][perm.category] = [];
        }
        acc[perm.module][perm.category].push(perm);
        return acc;
      }, {});

      return {
        success: true,
        permissions: result.rows,
        groupedPermissions
      };

    } catch (error) {
      console.error('❌ Error obteniendo permisos:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // LOGS Y AUDITORÍA
  // ================================

  async logAccess(userId, action, ipAddress = null, details = null, metadata = {}) {
    try {
      await dbManager.query(`
        INSERT INTO user_access_logs (user_id, action, ip_address, details, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [userId, action, ipAddress, JSON.stringify({ details, ...metadata })]);

    } catch (error) {
      console.error('❌ Error guardando log de acceso:', error);
    }
  }

  async getAccessLogs(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        action,
        startDate,
        endDate
      } = filters;

      let whereConditions = ['1=1'];
      let queryParams = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        whereConditions.push(`l.user_id = $${paramCount}`);
        queryParams.push(userId);
      }

      if (action) {
        paramCount++;
        whereConditions.push(`l.action = $${paramCount}`);
        queryParams.push(action);
      }

      if (startDate) {
        paramCount++;
        whereConditions.push(`l.created_at >= $${paramCount}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereConditions.push(`l.created_at <= $${paramCount}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.join(' AND ');
      const offset = (page - 1) * limit;

      const result = await dbManager.query(`
        SELECT 
          l.*, 
          u.username, u.first_name, u.last_name
        FROM user_access_logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `, [...queryParams, limit, offset]);

      return {
        success: true,
        logs: result.rows
      };

    } catch (error) {
      console.error('❌ Error obteniendo logs de acceso:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ================================
  // ESTADÍSTICAS
  // ================================

  async getUserStats() {
    try {
      const result = await dbManager.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
          COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
          COUNT(CASE WHEN last_login > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as recent_login,
          COUNT(CASE WHEN created_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as new_this_month
        FROM users
      `);

      const roleStats = await dbManager.query(`
        SELECT r.display_name, COUNT(u.id) as count
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id AND u.is_active = true
        GROUP BY r.id, r.display_name
        ORDER BY count DESC
      `);

      const agencyStats = await dbManager.query(`
        SELECT a.name, COUNT(u.id) as user_count
        FROM agencies a
        LEFT JOIN users u ON a.id = u.agency_id AND u.is_active = true
        WHERE a.status = 'active'
        GROUP BY a.id, a.name
        ORDER BY user_count DESC
        LIMIT 10
      `);

      return {
        success: true,
        stats: {
          overview: result.rows[0],
          byRole: roleStats.rows,
          byAgency: agencyStats.rows
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de usuarios:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}

module.exports = new UsersManager();
