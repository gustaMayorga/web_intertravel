// 🔐 SOLUCIÓN TEMPORAL - BYPASS AUTH PARA TESTING
// ================================================
// Para que el testing funcione mientras desarrollamos

// Middleware que permite requests sin autenticación válida en desarrollo
export const authBypass = (req, res, next) => {
  // Solo en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚨 BYPASS AUTH ACTIVADO - SOLO DESARROLLO');
    
    // Simular usuario admin autenticado
    req.user = {
      id: 'admin-dev',
      username: 'admin',
      role: 'super_admin'
    };
    
    return next();
  }
  
  // En producción, usar autenticación normal
  return require('./auth-middleware')(req, res, next);
};

// Headers que NO requieren autenticación en desarrollo
export const publicEndpoints = [
  '/api/packages',
  '/api/destinations',
  '/api/health'
];

// Headers que requieren auth bypass en desarrollo
export const devBypassEndpoints = [
  '/api/admin/bookings',
  '/api/admin/clients',
  '/api/admin/whatsapp-config',
  '/api/admin/stats'
];
