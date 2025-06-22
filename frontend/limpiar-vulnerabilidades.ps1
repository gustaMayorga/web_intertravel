# InterTravel - Limpieza de Vulnerabilidades npm
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  INTERTRAVEL - LIMPIEZA VULNERABILIDADES" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Asegurar que estamos en el directorio correcto
Set-Location "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend"

Write-Host "[1/4] Mostrando vulnerabilidades detalladas..." -ForegroundColor Yellow
npm audit

Write-Host ""
Write-Host "[2/4] Intentando reparaciones automáticas seguras..." -ForegroundColor Yellow
npm audit fix

Write-Host ""
Write-Host "[3/4] Verificando si quedan vulnerabilidades críticas..." -ForegroundColor Yellow
$auditResult = npm audit --json | ConvertFrom-Json
$critical = $auditResult.metadata.vulnerabilities.critical
$high = $auditResult.metadata.vulnerabilities.high

if ($critical -gt 0 -or $high -gt 0) {
    Write-Host ""
    Write-Host "⚠️  VULNERABILIDADES CRÍTICAS/ALTAS RESTANTES" -ForegroundColor Red
    Write-Host "Vulnerabilidades críticas: $critical" -ForegroundColor Red
    Write-Host "Vulnerabilidades altas: $high" -ForegroundColor Red
    Write-Host ""
    Write-Host "¿Quieres aplicar fix forzado? (Puede romper dependencias)" -ForegroundColor Yellow
    $response = Read-Host "Escribe 'si' para continuar con --force"
    
    if ($response -eq "si") {
        Write-Host ""
        Write-Host "[4/4] Aplicando reparaciones forzadas..." -ForegroundColor Red
        npm audit fix --force
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Testa el proyecto después del fix forzado" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "✅ Vulnerabilidades resueltas satisfactoriamente" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 Estado de seguridad mejorado" -ForegroundColor White
Write-Host "📦 Dependencias actualizadas" -ForegroundColor White
Write-Host ""
Write-Host "SIGUIENTE PASO: Iniciar el proyecto" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Read-Host "Presiona Enter para continuar"
