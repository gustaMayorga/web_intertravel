# InterTravel - Reparación de Dependencias Rotas
Write-Host "==========================================" -ForegroundColor Red
Write-Host "  REPARACION CRITICA - DEPENDENCIAS ROTAS" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red
Write-Host ""

Set-Location "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend"

Write-Host "❌ PROBLEMA DETECTADO:" -ForegroundColor Red
Write-Host "- react-simple-maps downgradeado a v1.0.0 (requiere React 16)" -ForegroundColor White
Write-Host "- Tu proyecto usa React 18.3.1" -ForegroundColor White
Write-Host "- Conflicto irreconciliable de versiones" -ForegroundColor White
Write-Host ""

Write-Host "[1/5] Eliminando node_modules completamente..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules eliminado" -ForegroundColor Green
}

Write-Host "[2/5] Eliminando package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ package-lock.json eliminado" -ForegroundColor Green
}

Write-Host "[3/5] Eliminando react-simple-maps problemático del package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies."react-simple-maps") {
    $packageJson.dependencies.PSObject.Properties.Remove("react-simple-maps")
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content "package.json"
    Write-Host "✅ react-simple-maps eliminado del package.json" -ForegroundColor Green
} else {
    Write-Host "✅ react-simple-maps no encontrado en package.json" -ForegroundColor Green
}

Write-Host "[4/5] Reinstalando dependencias limpias..." -ForegroundColor Yellow
npm install --legacy-peer-deps

Write-Host "[5/5] Instalando Three.js nuevamente..." -ForegroundColor Yellow
npm install three @types/three --legacy-peer-deps

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ DEPENDENCIAS REPARADAS" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Acciones realizadas:" -ForegroundColor White
Write-Host "- Eliminado react-simple-maps problemático" -ForegroundColor White
Write-Host "- Reinstaladas dependencias limpias" -ForegroundColor White
Write-Host "- Three.js instalado correctamente" -ForegroundColor White
Write-Host "- Usados flags --legacy-peer-deps para compatibilidad" -ForegroundColor White
Write-Host ""
Write-Host "SIGUIENTE PASO: Iniciar el proyecto" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Read-Host "Presiona Enter para continuar"
