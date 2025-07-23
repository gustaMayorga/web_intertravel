# ===============================================
# SCRIPT DE LIMPIEZA AUTOMÁTICA - INTERTRAVEL
# Mueve archivos obsoletos a carpeta separada
# ===============================================

Write-Host "🧹 ===============================================" -ForegroundColor Blue
Write-Host "🧹 LIMPIEZA AUTOMÁTICA INTERTRAVEL" -ForegroundColor Blue
Write-Host "🧹 ===============================================" -ForegroundColor Blue

# Crear carpeta para archivos obsoletos
$obsoletosPath = ".\ARCHIVOS_OBSOLETOS"
New-Item -ItemType Directory -Force -Path $obsoletosPath | Out-Null
Write-Host "✅ Carpeta ARCHIVOS_OBSOLETOS creada" -ForegroundColor Green

# Contador de archivos movidos
$movedCount = 0

# Scripts .bat obsoletos
Write-Host "📦 Moviendo scripts .bat obsoletos..." -ForegroundColor Yellow
$batFiles = @(
    "APLICAR-FALLBACK-INTELIGENTE.bat",
    "APLICAR-SOLUCION-SIMPLE.bat",
    "ARREGLAR-BASE-DATOS.bat",
    "ARREGLAR-DESTINOS.bat",
    "CONFIGURAR-ADMIN-DESTINOS.bat",
    "DETENER-PROCESOS.bat",
    "DIAGNOSTICO-COMPLETO-SISTEMA.bat",
    "DIAGNOSTICO-CONECTIVIDAD.bat",
    "EJECUTAR-TESTING-COMPLETO.bat",
    "FIX-ADMIN-CRITICAL.bat",
    "FIX-APP-3009-CAMBORIU.bat",
    "FIX-DEPENDENCIAS.bat",
    "IMPLEMENTAR-CORRECCIONES.bat",
    "INICIAR-INTERTRAVEL-UNIFICADO.bat",
    "INICIAR-SISTEMA-COMPLETO.bat",
    "INICIAR-TRAVEL-COMPOSITOR-TESTING.bat",
    "INSTALAR-AGENTE-4.bat",
    "install-intertravel-complete.bat",
    "INVESTIGAR-TRAVEL-COMPOSITOR.bat",
    "LIMPIEZA-AUTOMATICA-COMPLETA.bat",
    "MAESTRO-REPARACION.bat",
    "PROBAR-BACKEND-DIRECTO.bat",
    "PROBAR-TC-SIMPLE.bat",
    "REINICIO-COMPLETO.bat",
    "REINSTALAR-DEPENDENCIAS-BACKEND.bat",
    "REPARACION-CRITICA-COMPLETADA.bat",
    "REPARAR-ADMIN-COMPLETO.bat",
    "SOLUCION-COMPLETA-ERROR.bat",
    "SOLUCION-DEFINITIVA-CACHE.bat",
    "SOLUCIONAR-ADMIN-Y-ERRORES.bat",
    "SOLUCIONAR-CACHE-ERROR.bat",
    "SOLUCIONAR-ERRORES-CONSOLA.bat",
    "TESTING-B2B2C.bat",
    "TESTING-COMPLETO.bat",
    "TESTING-SISTEMA-COMPLETO.bat",
    "VERIFICAR-ERROR-ANALYTICS-RESUELTO.bat",
    "VERIFICAR-FIXES.bat",
    "VERIFICAR-SISTEMA-UNIFICADO.bat",
    "start-backend.bat",
    "start-frontend.bat",
    "setup.bat",
    "git-init.bat"
)

foreach ($file in $batFiles) {
    if (Test-Path $file) {
        Move-Item $file -Destination $obsoletosPath
        $movedCount++
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

# Documentación obsoleta
Write-Host "📚 Moviendo documentación obsoleta..." -ForegroundColor Yellow
$docsObsoletos = @(
    "AGENTE-3-COMPLETADO.md",
    "AGENTE-5-COMPLETADO.md",
    "AGENTE-6-COMPLETADO.md",
    "ANALISIS-COMPLETO-PARA-AGENTE.md",
    "CONTEXTO-PARA-AGENTE-5.md",
    "CORRECCIONES-COMPLETADAS-FINAL.md",
    "CORRECCIONES-IMPLEMENTADAS.md",
    "DOCUMENTACION-EJECUTIVA-FINAL.md",
    "DOCUMENTO-TRANSFERENCIA-CRITICO.md",
    "INFORME-REPARACION-PUERTO-3005.md",
    "LIMPIEZA-COMPLETADA.md",
    "MASTER-PLAN-2-COMPLETADO.md",
    "PLAN-ACCION-INMEDIATO.md",
    "PLAN-REGENERACION.md",
    "PLAN-TESTING-COMPLETO.md",
    "README-PROYECTO-LIMPIO.md",
    "README-SISTEMA-UNIFICADO.md",
    "README-TRAVEL-COMPOSITOR.md",
    "REPARACION-COMPLETADA-SISTEMA-100-FUNCIONAL.md",
    "RESUMEN-EJECUTIVO-CORRECCIONES.md",
    "SOLUCION-PDFKIT-ERROR.md",
    "SOLUCION-USEOPTIMIZATIONS-COMPLETADA.md",
    "TRAVEL-COMPOSITOR-SOLUCION-COMPLETA.md"
)

foreach ($file in $docsObsoletos) {
    if (Test-Path $file) {
        Move-Item $file -Destination $obsoletosPath
        $movedCount++
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

# Archivos backup
Write-Host "💾 Moviendo archivos backup..." -ForegroundColor Yellow
$backupFiles = @(
    "Backend)",
    "landing_backup_v1.html",
    "nombre_landingmaps.bkp",
    "fixed_login_test.json",
    "health_v4.json"
)

foreach ($file in $backupFiles) {
    if (Test-Path $file) {
        Move-Item $file -Destination $obsoletosPath
        $movedCount++
        Write-Host "  ✓ $file" -ForegroundColor Gray
    }
}

# Directorios obsoletos
Write-Host "🗂️ Moviendo directorios obsoletos..." -ForegroundColor Yellow
$dirsObsoletos = @(
    "_DUPLICADOS_OBSOLETOS",
    "BACKUP-MEJORAS-PROFESIONALES-20250618",
    "SCRIPTS-BACKUP",
    "TESTING"
)

foreach ($dir in $dirsObsoletos) {
    if (Test-Path $dir) {
        Move-Item $dir -Destination $obsoletosPath
        $movedCount++
        Write-Host "  ✓ $dir/" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎉 ===============================================" -ForegroundColor Green
Write-Host "🎉 LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "🎉 ===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Estadísticas:" -ForegroundColor Blue
Write-Host "   📁 Archivos movidos: $movedCount" -ForegroundColor White
Write-Host "   📂 Destino: $obsoletosPath" -ForegroundColor White
Write-Host ""
Write-Host "✅ SIGUIENTE PASO:" -ForegroundColor Yellow
Write-Host "   1. Verificar que la carpeta 'produccion' funciona correctamente" -ForegroundColor White
Write-Host "   2. Testing completo del sistema" -ForegroundColor White
Write-Host "   3. Una vez confirmado, eliminar ARCHIVOS_OBSOLETOS" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Mantener ARCHIVOS_OBSOLETOS hasta confirmar que todo funciona" -ForegroundColor Red