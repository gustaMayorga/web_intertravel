/**
 * 🔓 MIDDLEWARE DE AUTENTICACIÓN PERMISIVO
 * =======================================
 * 
 * Este middleware permite que todas las requests pasen
 * sin verificación de autenticación, útil para desarrollo
 * y testing inicial.
 */

// Middleware que permite todas las requests (desarrollo)
function bypassAuth(req, res, next) {
    console.log(`🔓 Auth bypass: ${req.method} ${req.originalUrl}`);
    
    // Agregar headers de CORS si no están
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    
    // Simular usuario autenticado para requests que lo necesiten
    req.user = {
        id: 1,
        email: 'admin@intertravel.com',
        role: 'admin',
        name: 'Admin Demo'
    };
    
    next();
}

// Middleware de logging de requests
function logRequests(req, res, next) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
}

// Middleware de manejo de errores de autenticación
function handleAuthError(err, req, res, next) {
    if (err.status === 401 || err.message.includes('Unauthorized')) {
        console.log('🔓 Convirtiendo error 401 en success (modo desarrollo)');
        return res.json({
            success: true,
            data: [],
            message: 'Datos mock - autenticación bypassed',
            development: true
        });
    }
    next(err);
}

module.exports = {
    bypassAuth,
    logRequests,
    handleAuthError
};
