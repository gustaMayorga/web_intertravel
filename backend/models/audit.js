// backend/models/audit.js

// Tipos de acciones para el audit trail
const AUDIT_ACTIONS = {
  // Autenticación
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  
  // Clientes
  CLIENT_CREATE: 'CLIENT_CREATE',
  CLIENT_UPDATE: 'CLIENT_UPDATE',
  CLIENT_DELETE: 'CLIENT_DELETE',
  CLIENT_VIEW: 'CLIENT_VIEW',
  CLIENT_EXPORT: 'CLIENT_EXPORT',
  
  // Reservas
  BOOKING_CREATE: 'BOOKING_CREATE',
  BOOKING_UPDATE: 'BOOKING_UPDATE',
  BOOKING_CANCEL: 'BOOKING_CANCEL',
  BOOKING_DELETE: 'BOOKING_DELETE',
  BOOKING_VIEW: 'BOOKING_VIEW',
  BOOKING_EXPORT: 'BOOKING_EXPORT',
  
  // Paquetes
  PACKAGE_CREATE: 'PACKAGE_CREATE',
  PACKAGE_UPDATE: 'PACKAGE_UPDATE',
  PACKAGE_DELETE: 'PACKAGE_DELETE',
  PACKAGE_PUBLISH: 'PACKAGE_PUBLISH',
  PACKAGE_UNPUBLISH: 'PACKAGE_UNPUBLISH',
  
  // Usuarios
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  
  // Configuración
  CONFIG_UPDATE: 'CONFIG_UPDATE',
  SYSTEM_CONFIG_UPDATE: 'SYSTEM_CONFIG_UPDATE',
  
  // Reportes
  REPORT_GENERATE: 'REPORT_GENERATE',
  REPORT_EXPORT: 'REPORT_EXPORT',
  
  // API
  API_ACCESS: 'API_ACCESS',
  API_ERROR: 'API_ERROR',
  
  // Sistema
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING'
};

// Array para almacenar el audit trail en memoria (en producción usar BD)
let auditTrail = [];

// Función principal para log de actividades
const logActivity = async (userId, action, resource, details = {}, request = null) => {
  try {
    const auditEntry = {
      id: Date.now() + Math.random(), // ID único temporal
      user_id: userId,
      action: action,
      resource: resource,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: request?.ip || details.ip || 'unknown',
      user_agent: request?.get('User-Agent') || details.userAgent || 'unknown',
      created_at: new Date().toISOString(),
      session_id: request?.sessionID || 'unknown'
    };

    // Almacenar en memoria (en producción, guardar en BD)
    auditTrail.push(auditEntry);

    // Mantener solo los últimos 1000 registros en memoria
    if (auditTrail.length > 1000) {
      auditTrail = auditTrail.slice(-1000);
    }

    // Log en consola con formato detallado
    const timestamp = new Date().toLocaleString('es-AR');
    console.log(`📝 [${timestamp}] AUDIT: ${action} | User: ${userId} | Resource: ${resource} | IP: ${auditEntry.ip_address}`);

    return auditEntry;

  } catch (error) {
    console.error('💥 Error logging activity:', error);
    // No lanzar error para no interrumpir el flujo principal
    return null;
  }
};

// Función para log de errores específicos
const logError = async (userId, error, context = {}, request = null) => {
  try {
    return await logActivity(
      userId,
      AUDIT_ACTIONS.SYSTEM_ERROR,
      'system',
      {
        error: error.message,
        stack: error.stack,
        context: context,
        severity: 'error'
      },
      request
    );
  } catch (auditError) {
    console.error('💥 Error logging error:', auditError);
  }
};

// Función para log de warnings
const logWarning = async (userId, message, context = {}, request = null) => {
  try {
    return await logActivity(
      userId,
      AUDIT_ACTIONS.SYSTEM_WARNING,
      'system',
      {
        warning: message,
        context: context,
        severity: 'warning'
      },
      request
    );
  } catch (error) {
    console.error('💥 Error logging warning:', error);
  }
};

// Middleware para audit automático de APIs
const auditMiddleware = (action, resource) => {
  return (req, res, next) => {
    // Capturar datos originales para comparación
    const originalSend = res.send;
    const startTime = Date.now();

    // Override del método send para capturar la respuesta
    res.send = function(data) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Log después de respuesta exitosa
      if (res.statusCode < 400 && req.user) {
        const details = {
          method: req.method,
          url: req.originalUrl,
          responseStatus: res.statusCode,
          responseTime: responseTime,
          queryParams: req.query,
          bodySize: req.body ? JSON.stringify(req.body).length : 0,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer') || 'direct'
        };

        // Log específico según el método HTTP
        if (req.method === 'POST' && req.body) {
          details.createdResource = true;
          details.resourceData = Object.keys(req.body);
        } else if (req.method === 'PUT' || req.method === 'PATCH') {
          details.updatedResource = true;
          if (req.body) {
            details.fieldsUpdated = Object.keys(req.body);
          }
        } else if (req.method === 'DELETE') {
          details.deletedResource = true;
          details.resourceId = req.params.id || 'unknown';
        }

        logActivity(req.user.id, action, resource, details, req);
      }

      // Log de errores
      if (res.statusCode >= 400) {
        logActivity(
          req.user?.id || null,
          AUDIT_ACTIONS.API_ERROR,
          resource,
          {
            method: req.method,
            url: req.originalUrl,
            errorStatus: res.statusCode,
            responseTime: responseTime,
            errorMessage: data ? JSON.parse(data)?.error : 'Unknown error'
          },
          req
        );
      }

      // Llamar al método original
      originalSend.call(this, data);
    };

    next();
  };
};

// Función para obtener historial de actividades con filtros
const getActivityHistory = async (filters = {}) => {
  try {
    let filteredTrail = [...auditTrail];

    // Aplicar filtros
    if (filters.userId) {
      filteredTrail = filteredTrail.filter(entry => entry.user_id == filters.userId);
    }

    if (filters.action) {
      filteredTrail = filteredTrail.filter(entry => entry.action === filters.action);
    }

    if (filters.resource) {
      filteredTrail = filteredTrail.filter(entry => entry.resource === filters.resource);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredTrail = filteredTrail.filter(entry => new Date(entry.created_at) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredTrail = filteredTrail.filter(entry => new Date(entry.created_at) <= toDate);
    }

    if (filters.ipAddress) {
      filteredTrail = filteredTrail.filter(entry => entry.ip_address === filters.ipAddress);
    }

    // Ordenar por fecha descendente
    filteredTrail.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Aplicar límite
    const limit = filters.limit || 100;
    filteredTrail = filteredTrail.slice(0, limit);

    return filteredTrail;

  } catch (error) {
    console.error('💥 Error getting activity history:', error);
    throw error;
  }
};

// Función para obtener estadísticas de actividad
const getActivityStats = async (dateFrom = null, dateTo = null) => {
  try {
    let dataToAnalyze = [...auditTrail];

    // Filtrar por fechas si se proporcionan
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      dataToAnalyze = dataToAnalyze.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate >= fromDate && entryDate <= toDate;
      });
    }

    // Calcular estadísticas
    const stats = {};
    const uniqueUsers = new Set();
    const uniqueIPs = new Set();

    dataToAnalyze.forEach(entry => {
      // Por acción
      if (!stats[entry.action]) {
        stats[entry.action] = {
          count: 0,
          unique_users: new Set(),
          unique_ips: new Set()
        };
      }
      stats[entry.action].count++;
      stats[entry.action].unique_users.add(entry.user_id);
      stats[entry.action].unique_ips.add(entry.ip_address);

      // Totales
      uniqueUsers.add(entry.user_id);
      uniqueIPs.add(entry.ip_address);
    });

    // Convertir Sets a números
    const result = Object.keys(stats).map(action => ({
      action,
      count: stats[action].count,
      unique_users: stats[action].unique_users.size,
      unique_ips: stats[action].unique_ips.size
    })).sort((a, b) => b.count - a.count);

    return {
      actions: result,
      totals: {
        total_events: dataToAnalyze.length,
        unique_users: uniqueUsers.size,
        unique_ips: uniqueIPs.size,
        date_range: {
          from: dateFrom,
          to: dateTo
        }
      }
    };

  } catch (error) {
    console.error('💥 Error getting activity stats:', error);
    throw error;
  }
};

// Función para detectar actividad sospechosa
const detectSuspiciousActivity = async () => {
  try {
    const checks = [];
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Múltiples logins fallidos desde la misma IP
    const recentEntries = auditTrail.filter(entry => new Date(entry.created_at) > oneHourAgo);
    const failedLogins = {};
    
    recentEntries
      .filter(entry => entry.action === AUDIT_ACTIONS.LOGIN_FAILED)
      .forEach(entry => {
        if (!failedLogins[entry.ip_address]) {
          failedLogins[entry.ip_address] = {
            count: 0,
            attempts: []
          };
        }
        failedLogins[entry.ip_address].count++;
        failedLogins[entry.ip_address].attempts.push(entry.created_at);
      });

    Object.keys(failedLogins).forEach(ip => {
      if (failedLogins[ip].count >= 5) {
        checks.push({
          type: 'multiple_failed_logins',
          severity: 'high',
          description: `${failedLogins[ip].count} intentos fallidos desde ${ip}`,
          data: failedLogins[ip]
        });
      }
    });

    // 2. Acceso desde múltiples IPs para el mismo usuario
    const last24h = auditTrail.filter(entry => new Date(entry.created_at) > oneDayAgo);
    const userIPs = {};
    
    last24h
      .filter(entry => entry.action === AUDIT_ACTIONS.LOGIN)
      .forEach(entry => {
        if (!userIPs[entry.user_id]) {
          userIPs[entry.user_id] = new Set();
        }
        userIPs[entry.user_id].add(entry.ip_address);
      });

    Object.keys(userIPs).forEach(userId => {
      if (userIPs[userId].size >= 3) {
        checks.push({
          type: 'multiple_ips_per_user',
          severity: 'medium',
          description: `Usuario ${userId} accedió desde ${userIPs[userId].size} IPs diferentes`,
          data: {
            user_id: userId,
            ip_count: userIPs[userId].size,
            ips: Array.from(userIPs[userId])
          }
        });
      }
    });

    // 3. Actividad fuera del horario normal (22:00 - 06:00)
    const offHoursActivity = last24h.filter(entry => {
      const hour = new Date(entry.created_at).getHours();
      return (hour < 6 || hour > 22) && 
             entry.action !== AUDIT_ACTIONS.LOGIN && 
             entry.action !== AUDIT_ACTIONS.LOGOUT;
    });

    if (offHoursActivity.length > 0) {
      checks.push({
        type: 'off_hours_activity',
        severity: 'low',
        description: `${offHoursActivity.length} actividades fuera del horario normal`,
        data: offHoursActivity.slice(0, 10) // Solo los primeros 10
      });
    }

    return checks;

  } catch (error) {
    console.error('💥 Error detecting suspicious activity:', error);
    throw error;
  }
};

// Función para limpiar logs antiguos (mantener últimos 30 días)
const cleanOldLogs = () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const initialCount = auditTrail.length;
  
  auditTrail = auditTrail.filter(entry => new Date(entry.created_at) > thirtyDaysAgo);
  
  const removed = initialCount - auditTrail.length;
  if (removed > 0) {
    console.log(`🧹 Limpieza de audit trail: ${removed} registros antiguos eliminados`);
  }
};

// Ejecutar limpieza automática cada 24 horas
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000);

module.exports = {
  AUDIT_ACTIONS,
  logActivity,
  logError,
  logWarning,
  auditMiddleware,
  getActivityHistory,
  getActivityStats,
  detectSuspiciousActivity,
  cleanOldLogs
};
