// Middleware verificación permisos granulares
const { query } = require('../database');

async function checkPermission(resource, action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const hasPermission = await query(
        'SELECT user_has_permission($1, $2, $3) as has_permission',
        [userId, resource, action]
      );
      
      if (!hasPermission.rows[0].has_permission) {
        return res.status(403).json({
          success: false,
          error: `Sin permisos para ${action} en ${resource}`
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Error verificando permisos' });
    }
  };
}

module.exports = { checkPermission };