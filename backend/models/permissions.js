// backend/models/permissions.js
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  // Clientes
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  CLIENTS_EXPORT: 'clients:export',
  
  // Reservas
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_CREATE: 'bookings:create',
  BOOKINGS_UPDATE: 'bookings:update',
  BOOKINGS_CANCEL: 'bookings:cancel',
  BOOKINGS_DELETE: 'bookings:delete',
  BOOKINGS_EXPORT: 'bookings:export',
  
  // Paquetes
  PACKAGES_VIEW: 'packages:view',
  PACKAGES_CREATE: 'packages:create',
  PACKAGES_UPDATE: 'packages:update',
  PACKAGES_DELETE: 'packages:delete',
  PACKAGES_PUBLISH: 'packages:publish',
  
  // Configuración
  CONFIG_VIEW: 'config:view',
  CONFIG_UPDATE: 'config:update',
  CONFIG_SYSTEM: 'config:system',
  
  // Usuarios y Roles
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',
  
  // Reportes y Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  
  // Finanzas
  FINANCE_VIEW: 'finance:view',
  FINANCE_UPDATE: 'finance:update',
  FINANCE_REPORTS: 'finance:reports',
  
  // Audit y Logs
  AUDIT_VIEW: 'audit:view',
  LOGS_VIEW: 'logs:view',
  
  // Travel Compositor API
  API_COMPOSITOR_VIEW: 'api:compositor:view',
  API_COMPOSITOR_MANAGE: 'api:compositor:manage'
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  
  [ROLES.ADMIN]: [
    // Clientes - Acceso completo excepto eliminar
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.CLIENTS_EXPORT,
    
    // Reservas - Acceso completo
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_UPDATE,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.BOOKINGS_EXPORT,
    
    // Paquetes - Acceso completo
    PERMISSIONS.PACKAGES_VIEW,
    PERMISSIONS.PACKAGES_CREATE,
    PERMISSIONS.PACKAGES_UPDATE,
    PERMISSIONS.PACKAGES_PUBLISH,
    
    // Configuración - Vista y updates básicos
    PERMISSIONS.CONFIG_VIEW,
    PERMISSIONS.CONFIG_UPDATE,
    
    // Usuarios - Vista y creación
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    
    // Reportes y Analytics
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    
    // Finanzas - Vista y reportes
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_REPORTS,
    
    // Audit
    PERMISSIONS.AUDIT_VIEW,
    
    // API Compositor
    PERMISSIONS.API_COMPOSITOR_VIEW,
    PERMISSIONS.API_COMPOSITOR_MANAGE
  ],
  
  [ROLES.MANAGER]: [
    // Clientes - Sin eliminar
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.CLIENTS_EXPORT,
    
    // Reservas - Sin eliminar
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_UPDATE,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.BOOKINGS_EXPORT,
    
    // Paquetes - Solo vista y actualización
    PERMISSIONS.PACKAGES_VIEW,
    PERMISSIONS.PACKAGES_UPDATE,
    
    // Configuración - Solo vista
    PERMISSIONS.CONFIG_VIEW,
    
    // Usuarios - Solo vista
    PERMISSIONS.USERS_VIEW,
    
    // Reportes
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    
    // Finanzas - Solo vista
    PERMISSIONS.FINANCE_VIEW,
    
    // API Compositor - Solo vista
    PERMISSIONS.API_COMPOSITOR_VIEW
  ],
  
  [ROLES.OPERATOR]: [
    // Clientes - Vista y creación
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_UPDATE,
    
    // Reservas - Vista y creación
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_UPDATE,
    
    // Paquetes - Solo vista
    PERMISSIONS.PACKAGES_VIEW,
    
    // Reportes básicos
    PERMISSIONS.REPORTS_VIEW,
    
    // API Compositor - Solo vista
    PERMISSIONS.API_COMPOSITOR_VIEW
  ],
  
  [ROLES.VIEWER]: [
    // Solo vista de datos básicos
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.PACKAGES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW
  ]
};

// Función para verificar si un usuario tiene un permiso específico
const hasPermission = (userRole, requiredPermission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(requiredPermission);
};

// Función para verificar múltiples permisos (requiere TODOS)
const hasAllPermissions = (userRole, requiredPermissions) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return requiredPermissions.every(permission => rolePermissions.includes(permission));
};

// Función para verificar múltiples permisos (requiere AL MENOS UNO)
const hasAnyPermission = (userRole, requiredPermissions) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return requiredPermissions.some(permission => rolePermissions.includes(permission));
};

// Función para obtener todos los permisos de un rol
const getRolePermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};

// Función para verificar si un rol puede acceder a un módulo completo
const canAccessModule = (userRole, module) => {
  const modulePermissions = {
    'clients': [PERMISSIONS.CLIENTS_VIEW],
    'bookings': [PERMISSIONS.BOOKINGS_VIEW],
    'packages': [PERMISSIONS.PACKAGES_VIEW],
    'users': [PERMISSIONS.USERS_VIEW],
    'config': [PERMISSIONS.CONFIG_VIEW],
    'reports': [PERMISSIONS.REPORTS_VIEW],
    'analytics': [PERMISSIONS.ANALYTICS_VIEW],
    'finance': [PERMISSIONS.FINANCE_VIEW],
    'audit': [PERMISSIONS.AUDIT_VIEW],
    'api': [PERMISSIONS.API_COMPOSITOR_VIEW]
  };
  
  const requiredPermissions = modulePermissions[module] || [];
  return hasAnyPermission(userRole, requiredPermissions);
};

// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      console.warn(`🚫 Acceso denegado: ${req.user.email} (${req.user.role}) intentó acceder a ${req.originalUrl} - Permiso requerido: ${permission}`);
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        userRole: req.user.role,
        action: `Se requiere el permiso "${permission}" para esta acción`
      });
    }

    console.log(`✅ Acceso autorizado: ${req.user.email} - ${permission}`);
    next();
  };
};

// Función para obtener las capacidades de un usuario (para el frontend)
const getUserCapabilities = (userRole) => {
  const permissions = getRolePermissions(userRole);
  
  return {
    role: userRole,
    permissions: permissions,
    modules: {
      clients: canAccessModule(userRole, 'clients'),
      bookings: canAccessModule(userRole, 'bookings'),
      packages: canAccessModule(userRole, 'packages'),
      users: canAccessModule(userRole, 'users'),
      config: canAccessModule(userRole, 'config'),
      reports: canAccessModule(userRole, 'reports'),
      analytics: canAccessModule(userRole, 'analytics'),
      finance: canAccessModule(userRole, 'finance'),
      audit: canAccessModule(userRole, 'audit'),
      api: canAccessModule(userRole, 'api')
    },
    capabilities: {
      canCreateClients: hasPermission(userRole, PERMISSIONS.CLIENTS_CREATE),
      canDeleteClients: hasPermission(userRole, PERMISSIONS.CLIENTS_DELETE),
      canCreateBookings: hasPermission(userRole, PERMISSIONS.BOOKINGS_CREATE),
      canCancelBookings: hasPermission(userRole, PERMISSIONS.BOOKINGS_CANCEL),
      canManageUsers: hasPermission(userRole, PERMISSIONS.USERS_MANAGE_ROLES),
      canConfigureSystem: hasPermission(userRole, PERMISSIONS.CONFIG_SYSTEM),
      canExportData: hasAnyPermission(userRole, [
        PERMISSIONS.CLIENTS_EXPORT,
        PERMISSIONS.BOOKINGS_EXPORT,
        PERMISSIONS.REPORTS_EXPORT
      ]),
      canViewFinance: hasPermission(userRole, PERMISSIONS.FINANCE_VIEW),
      canViewAudit: hasPermission(userRole, PERMISSIONS.AUDIT_VIEW)
    }
  };
};

module.exports = { 
  ROLES, 
  PERMISSIONS, 
  ROLE_PERMISSIONS,
  hasPermission, 
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  canAccessModule,
  requirePermission,
  getUserCapabilities
};
