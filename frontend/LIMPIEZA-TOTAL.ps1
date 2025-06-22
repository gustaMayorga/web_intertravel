Write-Host "LIMPIANDO CACHE Y REINICIANDO..." -ForegroundColor Red
Set-Location "D:\Inter\intertravel-website\WEB-FINAL-UNIFICADA\frontend"

Write-Host "1. Eliminando cache de Next.js..." -ForegroundColor Yellow
if (Test-Path ".next") { 
    Remove-Item -Recurse -Force ".next" 
    Write-Host "✓ Cache eliminado" -ForegroundColor Green
}

Write-Host "2. Limpiando node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") { 
    Remove-Item -Recurse -Force "node_modules" 
    Write-Host "✓ node_modules eliminado" -ForegroundColor Green
}

Write-Host "3. Reinstalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host "4. INICIANDO SERVIDOR LIMPIO..." -ForegroundColor Cyan
npm run dev
