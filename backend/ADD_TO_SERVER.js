// ==========================================
// MANUAL: AGREGAR ESTAS LÍNEAS AL SERVER.JS
// ==========================================

// Buscar la sección donde se cargan las rutas (cerca de las otras rutas de admin)
// y agregar estas líneas ANTES de "// MANEJO DE ERRORES Y 404":

// Rutas de Gestión Paquete-Cliente (NUEVO SISTEMA)
try {
    const packageClientRoutes = require('./routes/package-client');
    app.use('/api/package-client', packageClientRoutes);
    console.log('✅ Ruta /api/package-client configurada');
} catch (error) {
    console.log('⚠️  Error cargando package-client routes:', error.message);
}

// ==========================================
// LÍNEAS A AGREGAR AL SERVER.JS
// ==========================================
