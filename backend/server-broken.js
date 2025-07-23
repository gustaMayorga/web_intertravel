    // Intentar conectar a base de datos
    console.log('🐘 Verificando conexión a base de datos...');
    try {
      await connectDB();
      await initializeDatabase();
      console.log('✅ Base de datos conectada y inicializada');
    } catch (dbError) {
      console.warn('⚠️ Base de datos no disponible - usando datos mock');
      console.log('ℹ️ El sistema funcionará con datos de ejemplo');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('\n🚀 SERVIDOR INTERTRAVEL INICIADO - VERSIÓN COMPLETA CON PERMISOS + AUDIT');
      console.log('=' .repeat(70));
      console.log(`🌐 Puerto: ${PORT}`);
      console.log(`🔐 Seguridad: ACTIVADA`);
      console.log(`🔒 Autenticación: REQUERIDA`);
      console.log(`👮 Permisos granulares: ACTIVOS`);
      console.log(`📝 Audit trail: ACTIVO`);
      console.log(`⚡ Rate limiting: ACTIVO`);
      console.log(`🛡️ Helmet security: ACTIVO`);
      console.log(`🌐 CORS: CONFIGURADO`);
      console.log('');
      console.log('📋 ENDPOINTS DISPONIBLES:');
      console.log('  ┌─ PÚBLICOS:');
      console.log('  │  GET  /api/health');
      console.log('  │  POST /api/admin/auth/login');
      console.log('  │');
      console.log('  └─ PROTEGIDOS (requieren autenticación + permisos):');
      console.log('     🔐 POST /api/admin/auth/logout');
      console.log('     🔐 GET  /api/admin/auth/verify');
      console.log('     📊 GET  /api/admin/stats (reports:view)');
      console.log('     👥 GET  /api/admin/clientes (clients:view)');
      console.log('     📋 GET  /api/admin/reservas (bookings:view)');
      console.log('     ⚙️ GET  /api/admin/configuracion (config:view)');
      console.log('     👤 GET  /api/admin/user/capabilities');
      console.log('     🕵️ GET  /api/admin/audit/activity (audit:view)');
      console.log('     📈 GET  /api/admin/audit/stats (audit:view)');
      console.log('     🔍 GET  /api/admin/security/suspicious (audit:view)');
      console.log('');
      console.log('🎯 CREDENCIALES DE TESTING:');
      console.log('   📧 Email: admin@intertravel.com');
      console.log('   🔑 Password: admin123');
      console.log('   👤 Rol: super_admin (acceso completo)');
      console.log('');
      console.log('🛡️ SISTEMA DE PERMISOS:');
      console.log('   • super_admin: Acceso total (incluye eliminar)');
      console.log('   • admin: Gestión completa (excepto eliminar)');
      console.log('   • manager: Gestión limitada (clientes + reservas)');
      console.log('   • operator: Operaciones básicas (crear/editar)');
      console.log('   • viewer: Solo lectura');
      console.log('');
      console.log('📝 AUDIT TRAIL:');
      console.log('   • Todas las acciones se registran automáticamente');
      console.log('   • Detección de actividad sospechosa');
      console.log('   • Historial completo de cambios');
      console.log('   • Logs de acceso por IP y usuario');
      console.log('');
      console.log('✨ SISTEMA LISTO - MODO EMPRESARIAL COMPLETO ✨');
      console.log('=' .repeat(70));
    });

  } catch (error) {
    console.error('💥 Error crítico iniciando servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor (Ctrl+C)...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
