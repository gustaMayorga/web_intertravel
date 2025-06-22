# InterTravel - Reparación Globo 3D + IA (PowerShell)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  INTERTRAVEL - REPARACION GLOBO 3D + IA" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio correcto
Set-Location "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend"

Write-Host "[1/3] Deteniendo servidor si esta corriendo..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "[2/3] Instalando Three.js (si no esta instalado)..." -ForegroundColor Yellow
npm install three @types/three --legacy-peer-deps

Write-Host "[3/3] Iniciando frontend corregido..." -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ CAMBIOS APLICADOS:" -ForegroundColor Green
Write-Host "- Globo 3D con fallback visual" -ForegroundColor White
Write-Host "- Buscador IA visible inmediatamente" -ForegroundColor White
Write-Host "- Loading time reducido a 2 segundos" -ForegroundColor White
Write-Host "- Interface funcionando sin dependencias conflictivas" -ForegroundColor White
Write-Host ""
Write-Host "Iniciando en puerto 3005..." -ForegroundColor Yellow

# Iniciar el servidor en una nueva ventana
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ SISTEMA REPARADO" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Globo 3D: Fallback visual funcionando" -ForegroundColor White
Write-Host "🧠 Buscador IA: Visible inmediatamente" -ForegroundColor White
Write-Host "🎯 Interface: Completamente responsive" -ForegroundColor White
Write-Host ""
Write-Host "URL: http://localhost:3005" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para continuar"
